// SPDX-License-Identifier: GPL-2.0
/*
 * vas6154.c  –  Linux kernel USB driver for VAS 6154 VCI
 * DERHAN AutoMatrix Pro
 *
 * Creates:  /dev/vas6154_0, /dev/vas6154_1, ...
 * Class:    /sys/class/vas6154/
 * uevents:  SUBSYSTEM=vas6154  ACTION=add/remove
 *
 * So that udev + your application can detect the dongle exactly
 * like ODIS detects it on Windows (scan for VCI modules).
 */

#include <linux/kernel.h>
#include <linux/module.h>
#include <linux/usb.h>
#include <linux/slab.h>
#include <linux/mutex.h>
#include <linux/uaccess.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/poll.h>
#include <linux/wait.h>
#include <linux/atomic.h>
#include <linux/string.h>

MODULE_LICENSE("GPL v2");
MODULE_AUTHOR("DERHAN AutoMatrix Pro");
MODULE_DESCRIPTION("VAS 6154 VCI USB driver - creates /dev/vas6154_N");
MODULE_VERSION("1.0.0");

/* ──────────────────────────────────────────────────────────────
 * USB ID table
 * ────────────────────────────────────────────────────────────── */
#define VAS6154_USB_VID         0x19B2
#define VAS6154_USB_PID_V1      0x0003
#define VAS6154_USB_PID_V2      0x0008    /* Most common */
#define VAS6154_USB_PID_V3      0x000C    /* CAN-FD */
#define VAS6154_USB_PID_DFU     0x0009

static const struct usb_device_id vas6154_id_table[] = {
    { USB_DEVICE(VAS6154_USB_VID, VAS6154_USB_PID_V1) },
    { USB_DEVICE(VAS6154_USB_VID, VAS6154_USB_PID_V2) },
    { USB_DEVICE(VAS6154_USB_VID, VAS6154_USB_PID_V3) },
    { USB_DEVICE(VAS6154_USB_VID, VAS6154_USB_PID_DFU) },
    { }
};
MODULE_DEVICE_TABLE(usb, vas6154_id_table);

/* ──────────────────────────────────────────────────────────────
 * Constants
 * ────────────────────────────────────────────────────────────── */
#define VAS6154_MINOR_BASE      180
#define VAS6154_MAX_DEVICES     8
#define VAS6154_EP_BULK_OUT     0x01
#define VAS6154_EP_BULK_IN      0x81
#define VAS6154_EP_INT_IN       0x82
#define VAS6154_BULK_SIZE       512
#define VAS6154_INT_SIZE        64
#define VAS6154_BUF_SIZE        4096
#define VAS6154_TIMEOUT_MS      5000

/* ──────────────────────────────────────────────────────────────
 * Per-device structure
 * ────────────────────────────────────────────────────────────── */
struct vas6154_dev {
    struct usb_device       *udev;
    struct usb_interface    *interface;
    struct cdev              cdev;
    struct device           *sysfs_dev;

    unsigned int             minor;
    int                      open_count;
    struct mutex             io_mutex;

    /* Endpoints */
    __u8                     ep_bulk_out;
    __u8                     ep_bulk_in;
    __u8                     ep_int_in;
    size_t                   ep_bulk_out_size;
    size_t                   ep_bulk_in_size;

    /* RX ring buffer (for read()) */
    u8                      *rx_buf;
    size_t                   rx_head;
    size_t                   rx_tail;
    spinlock_t               rx_lock;
    wait_queue_head_t        rx_wait;

    /* Interrupt URB */
    struct urb              *int_urb;
    u8                      *int_buf;

    /* Device info (read from device on connect) */
    char                     serial[17];
    u8                       fw_major;
    u8                       fw_minor;
    u8                       fw_patch;
    u8                       hw_major;
    u8                       hw_minor;
    u8                       can_fd_capable;
    u8                       num_channels;

    /* State */
    bool                     disconnected;
    atomic_t                 urb_use_count;
};

/* ──────────────────────────────────────────────────────────────
 * Global state
 * ────────────────────────────────────────────────────────────── */
static struct class     *vas6154_class;
static dev_t             vas6154_devt;
static DEFINE_MUTEX(minor_table_lock);
static struct vas6154_dev *minor_table[VAS6154_MAX_DEVICES];

/* ──────────────────────────────────────────────────────────────
 * RX ring buffer helpers
 * ────────────────────────────────────────────────────────────── */
static void rx_push(struct vas6154_dev *dev, const u8 *data, size_t len)
{
    size_t i;
    unsigned long flags;
    spin_lock_irqsave(&dev->rx_lock, flags);
    for (i = 0; i < len; i++) {
        size_t next = (dev->rx_head + 1) % VAS6154_BUF_SIZE;
        if (next != dev->rx_tail) {
            dev->rx_buf[dev->rx_head] = data[i];
            dev->rx_head = next;
        }
    }
    spin_unlock_irqrestore(&dev->rx_lock, flags);
    wake_up_interruptible(&dev->rx_wait);
}

static ssize_t rx_pop(struct vas6154_dev *dev, u8 *out, size_t max)
{
    size_t n = 0;
    unsigned long flags;
    spin_lock_irqsave(&dev->rx_lock, flags);
    while (n < max && dev->rx_tail != dev->rx_head) {
        out[n++] = dev->rx_buf[dev->rx_tail];
        dev->rx_tail = (dev->rx_tail + 1) % VAS6154_BUF_SIZE;
    }
    spin_unlock_irqrestore(&dev->rx_lock, flags);
    return (ssize_t)n;
}

static int rx_empty(struct vas6154_dev *dev)
{
    unsigned long flags;
    int empty;
    spin_lock_irqsave(&dev->rx_lock, flags);
    empty = (dev->rx_head == dev->rx_tail);
    spin_unlock_irqrestore(&dev->rx_lock, flags);
    return empty;
}

/* ──────────────────────────────────────────────────────────────
 * Interrupt IN callback (async events from device)
 * ────────────────────────────────────────────────────────────── */
static void vas6154_int_callback(struct urb *urb)
{
    struct vas6154_dev *dev = urb->context;
    int status = urb->status;
    int retval;

    switch (status) {
    case 0:
        /* Good data - push to RX ring */
        if (urb->actual_length > 0)
            rx_push(dev, dev->int_buf, urb->actual_length);
        break;
    case -ECONNRESET:
    case -ENOENT:
    case -ESHUTDOWN:
        return;   /* URB was killed */
    default:
        dev_warn(&dev->interface->dev,
                 "INT urb status %d\n", status);
        break;
    }

    /* Re-submit */
    retval = usb_submit_urb(urb, GFP_ATOMIC);
    if (retval && retval != -EPERM)
        dev_err(&dev->interface->dev,
                "failed to re-submit INT urb: %d\n", retval);
}

/* ──────────────────────────────────────────────────────────────
 * Query device info (serial, firmware version)
 * ────────────────────────────────────────────────────────────── */
static void vas6154_query_info(struct vas6154_dev *dev)
{
    /* CMD_GET_INFO: magic=0xDEAD cmd=0x01 seq=0x01 ch=0 len=0 */
    u8 cmd[8] = { 0xDE, 0xAD, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00 };
    u8 rsp[64] = {0};
    int actual = 0;
    int ret;

    ret = usb_bulk_msg(dev->udev,
                       usb_sndbulkpipe(dev->udev, dev->ep_bulk_out),
                       cmd, sizeof(cmd), &actual, VAS6154_TIMEOUT_MS);
    if (ret) return;

    ret = usb_bulk_msg(dev->udev,
                       usb_rcvbulkpipe(dev->udev, dev->ep_bulk_in),
                       rsp, sizeof(rsp), &actual, VAS6154_TIMEOUT_MS);
    if (ret || actual < 10) return;

    /* rsp layout (after 8-byte header):
     * [0-1]  VID
     * [2-3]  PID
     * [4]    hw_major  [5] hw_minor
     * [6]    fw_major  [7] fw_minor  [8] fw_patch
     * [9]    num_channels
     * [10]   can_fd_capable
     * [11]   doip_capable
     * [12..27] serial (16 chars)
     */
    if (actual >= 28) {
        dev->hw_major       = rsp[12];
        dev->hw_minor       = rsp[13];
        dev->fw_major       = rsp[14];
        dev->fw_minor       = rsp[15];
        dev->fw_patch       = rsp[16];
        dev->num_channels   = rsp[17];
        dev->can_fd_capable = rsp[18];
        memcpy(dev->serial, rsp + 20, 16);
        dev->serial[16] = '\0';
    } else {
        snprintf(dev->serial, sizeof(dev->serial), "UNKNOWN");
    }
}

/* ──────────────────────────────────────────────────────────────
 * sysfs attributes  (read by udev, by application)
 * ────────────────────────────────────────────────────────────── */
static ssize_t serial_show(struct device *d, struct device_attribute *a, char *buf)
{
    struct vas6154_dev *dev = dev_get_drvdata(d);
    return sysfs_emit(buf, "%s\n", dev->serial);
}
static DEVICE_ATTR_RO(serial);

static ssize_t fw_version_show(struct device *d, struct device_attribute *a, char *buf)
{
    struct vas6154_dev *dev = dev_get_drvdata(d);
    return sysfs_emit(buf, "%d.%d.%d\n",
                      dev->fw_major, dev->fw_minor, dev->fw_patch);
}
static DEVICE_ATTR_RO(fw_version);

static ssize_t hw_version_show(struct device *d, struct device_attribute *a, char *buf)
{
    struct vas6154_dev *dev = dev_get_drvdata(d);
    return sysfs_emit(buf, "%d.%d\n", dev->hw_major, dev->hw_minor);
}
static DEVICE_ATTR_RO(hw_version);

static ssize_t can_fd_show(struct device *d, struct device_attribute *a, char *buf)
{
    struct vas6154_dev *dev = dev_get_drvdata(d);
    return sysfs_emit(buf, "%d\n", dev->can_fd_capable);
}
static DEVICE_ATTR_RO(can_fd);

static struct attribute *vas6154_attrs[] = {
    &dev_attr_serial.attr,
    &dev_attr_fw_version.attr,
    &dev_attr_hw_version.attr,
    &dev_attr_can_fd.attr,
    NULL,
};
ATTRIBUTE_GROUPS(vas6154);

/* ──────────────────────────────────────────────────────────────
 * File operations  (/dev/vas6154_N)
 * ────────────────────────────────────────────────────────────── */
static int vas6154_open(struct inode *inode, struct file *file)
{
    struct vas6154_dev *dev;
    int minor = iminor(inode);

    mutex_lock(&minor_table_lock);
    dev = minor_table[minor - VAS6154_MINOR_BASE];
    mutex_unlock(&minor_table_lock);

    if (!dev) return -ENODEV;

    mutex_lock(&dev->io_mutex);
    if (dev->disconnected) {
        mutex_unlock(&dev->io_mutex);
        return -ENODEV;
    }
    dev->open_count++;
    mutex_unlock(&dev->io_mutex);

    file->private_data = dev;
    return 0;
}

static int vas6154_release(struct inode *inode, struct file *file)
{
    struct vas6154_dev *dev = file->private_data;
    if (!dev) return -ENODEV;
    mutex_lock(&dev->io_mutex);
    dev->open_count--;
    mutex_unlock(&dev->io_mutex);
    return 0;
}

static ssize_t vas6154_read(struct file *file, char __user *buf,
                             size_t count, loff_t *pos)
{
    struct vas6154_dev *dev = file->private_data;
    u8 kbuf[VAS6154_BULK_SIZE];
    ssize_t n;

    if (mutex_lock_interruptible(&dev->io_mutex))
        return -ERESTARTSYS;

    if (dev->disconnected) {
        mutex_unlock(&dev->io_mutex);
        return -ENODEV;
    }

    /* Block until data available (if O_NONBLOCK not set) */
    while (rx_empty(dev)) {
        mutex_unlock(&dev->io_mutex);
        if (file->f_flags & O_NONBLOCK)
            return -EAGAIN;
        if (wait_event_interruptible(dev->rx_wait, !rx_empty(dev)))
            return -ERESTARTSYS;
        if (mutex_lock_interruptible(&dev->io_mutex))
            return -ERESTARTSYS;
        if (dev->disconnected) {
            mutex_unlock(&dev->io_mutex);
            return -ENODEV;
        }
    }

    n = rx_pop(dev, kbuf, min(count, sizeof(kbuf)));
    mutex_unlock(&dev->io_mutex);

    if (n > 0 && copy_to_user(buf, kbuf, n))
        return -EFAULT;
    return n;
}

static ssize_t vas6154_write(struct file *file, const char __user *buf,
                              size_t count, loff_t *pos)
{
    struct vas6154_dev *dev = file->private_data;
    u8 *kbuf;
    int actual;
    ssize_t ret;

    if (count > VAS6154_BULK_SIZE) count = VAS6154_BULK_SIZE;

    kbuf = kmalloc(count, GFP_KERNEL);
    if (!kbuf) return -ENOMEM;

    if (copy_from_user(kbuf, buf, count)) {
        kfree(kbuf);
        return -EFAULT;
    }

    mutex_lock(&dev->io_mutex);
    if (dev->disconnected) {
        mutex_unlock(&dev->io_mutex);
        kfree(kbuf);
        return -ENODEV;
    }

    ret = usb_bulk_msg(dev->udev,
                       usb_sndbulkpipe(dev->udev, dev->ep_bulk_out),
                       kbuf, (int)count, &actual,
                       VAS6154_TIMEOUT_MS);
    mutex_unlock(&dev->io_mutex);
    kfree(kbuf);

    if (ret) return ret;
    return actual;
}

static __poll_t vas6154_poll(struct file *file, poll_table *wait)
{
    struct vas6154_dev *dev = file->private_data;
    __poll_t mask = EPOLLOUT | EPOLLWRNORM;  /* always writable */

    poll_wait(file, &dev->rx_wait, wait);
    if (!rx_empty(dev))
        mask |= EPOLLIN | EPOLLRDNORM;
    if (dev->disconnected)
        mask |= EPOLLHUP;
    return mask;
}

static const struct file_operations vas6154_fops = {
    .owner   = THIS_MODULE,
    .open    = vas6154_open,
    .release = vas6154_release,
    .read    = vas6154_read,
    .write   = vas6154_write,
    .poll    = vas6154_poll,
    .llseek  = no_llseek,
};

/* ──────────────────────────────────────────────────────────────
 * USB probe  (called when device is plugged in)
 * ────────────────────────────────────────────────────────────── */
static int vas6154_probe(struct usb_interface *interface,
                          const struct usb_device_id *id)
{
    struct vas6154_dev *dev;
    struct usb_host_interface *iface_desc;
    struct usb_endpoint_descriptor *ep;
    int i, retval = -ENOMEM;
    int minor_idx = -1;

    dev = kzalloc(sizeof(*dev), GFP_KERNEL);
    if (!dev) return -ENOMEM;

    dev->udev      = usb_get_dev(interface_to_usbdev(interface));
    dev->interface = interface;
    mutex_init(&dev->io_mutex);
    spin_lock_init(&dev->rx_lock);
    init_waitqueue_head(&dev->rx_wait);
    atomic_set(&dev->urb_use_count, 0);

    dev->rx_buf = kzalloc(VAS6154_BUF_SIZE, GFP_KERNEL);
    if (!dev->rx_buf) goto error_free;

    dev->int_buf = kzalloc(VAS6154_INT_SIZE, GFP_KERNEL);
    if (!dev->int_buf) goto error_free;

    /* Parse endpoints */
    iface_desc = interface->cur_altsetting;
    for (i = 0; i < iface_desc->desc.bNumEndpoints; i++) {
        ep = &iface_desc->endpoint[i].desc;
        if (usb_endpoint_is_bulk_out(ep))
            dev->ep_bulk_out = ep->bEndpointAddress;
        else if (usb_endpoint_is_bulk_in(ep))
            dev->ep_bulk_in = ep->bEndpointAddress;
        else if (usb_endpoint_is_int_in(ep))
            dev->ep_int_in = ep->bEndpointAddress;
    }

    /* Fallback to known addresses */
    if (!dev->ep_bulk_out) dev->ep_bulk_out = VAS6154_EP_BULK_OUT;
    if (!dev->ep_bulk_in)  dev->ep_bulk_in  = VAS6154_EP_BULK_IN;
    if (!dev->ep_int_in)   dev->ep_int_in   = VAS6154_EP_INT_IN;

    /* Find minor number */
    mutex_lock(&minor_table_lock);
    for (i = 0; i < VAS6154_MAX_DEVICES; i++) {
        if (!minor_table[i]) { minor_idx = i; break; }
    }
    if (minor_idx < 0) {
        mutex_unlock(&minor_table_lock);
        dev_err(&interface->dev, "No minor numbers available\n");
        retval = -ENODEV;
        goto error_free;
    }
    dev->minor = VAS6154_MINOR_BASE + minor_idx;
    minor_table[minor_idx] = dev;
    mutex_unlock(&minor_table_lock);

    /* Query device info */
    vas6154_query_info(dev);

    /* Create character device */
    cdev_init(&dev->cdev, &vas6154_fops);
    dev->cdev.owner = THIS_MODULE;
    retval = cdev_add(&dev->cdev,
                      MKDEV(MAJOR(vas6154_devt), dev->minor), 1);
    if (retval) goto error_minor;

    /* Create /dev/vas6154_N and /sys/class/vas6154/vas6154_N */
    dev->sysfs_dev = device_create_with_groups(
        vas6154_class, &interface->dev,
        MKDEV(MAJOR(vas6154_devt), dev->minor),
        dev,
        vas6154_groups,
        "vas6154_%d", minor_idx);

    if (IS_ERR(dev->sysfs_dev)) {
        retval = PTR_ERR(dev->sysfs_dev);
        goto error_cdev;
    }

    /* Start interrupt URB */
    dev->int_urb = usb_alloc_urb(0, GFP_KERNEL);
    if (dev->int_urb) {
        usb_fill_int_urb(dev->int_urb, dev->udev,
                         usb_rcvintpipe(dev->udev, dev->ep_int_in),
                         dev->int_buf, VAS6154_INT_SIZE,
                         vas6154_int_callback, dev, 1);
        usb_submit_urb(dev->int_urb, GFP_KERNEL);
    }

    usb_set_intfdata(interface, dev);

    dev_info(&interface->dev,
             "VAS 6154 connected: /dev/vas6154_%d  serial=%s  fw=%d.%d.%d\n",
             minor_idx, dev->serial,
             dev->fw_major, dev->fw_minor, dev->fw_patch);

    return 0;

error_cdev:
    cdev_del(&dev->cdev);
error_minor:
    mutex_lock(&minor_table_lock);
    minor_table[minor_idx] = NULL;
    mutex_unlock(&minor_table_lock);
error_free:
    kfree(dev->int_buf);
    kfree(dev->rx_buf);
    usb_put_dev(dev->udev);
    kfree(dev);
    return retval;
}

/* ──────────────────────────────────────────────────────────────
 * USB disconnect
 * ────────────────────────────────────────────────────────────── */
static void vas6154_disconnect(struct usb_interface *interface)
{
    struct vas6154_dev *dev = usb_get_intfdata(interface);
    int minor_idx;

    if (!dev) return;

    mutex_lock(&dev->io_mutex);
    dev->disconnected = true;
    mutex_unlock(&dev->io_mutex);

    if (dev->int_urb) {
        usb_kill_urb(dev->int_urb);
        usb_free_urb(dev->int_urb);
    }

    wake_up_interruptible(&dev->rx_wait);

    device_destroy(vas6154_class,
                   MKDEV(MAJOR(vas6154_devt), dev->minor));
    cdev_del(&dev->cdev);

    minor_idx = dev->minor - VAS6154_MINOR_BASE;
    mutex_lock(&minor_table_lock);
    minor_table[minor_idx] = NULL;
    mutex_unlock(&minor_table_lock);

    dev_info(&interface->dev,
             "VAS 6154 disconnected: /dev/vas6154_%d\n", minor_idx);

    usb_set_intfdata(interface, NULL);
    usb_put_dev(dev->udev);
    kfree(dev->int_buf);
    kfree(dev->rx_buf);
    kfree(dev);
}

/* ──────────────────────────────────────────────────────────────
 * USB driver registration
 * ────────────────────────────────────────────────────────────── */
static struct usb_driver vas6154_driver = {
    .name       = "vas6154",
    .probe      = vas6154_probe,
    .disconnect = vas6154_disconnect,
    .id_table   = vas6154_id_table,
};

/* ──────────────────────────────────────────────────────────────
 * Module init / exit
 * ────────────────────────────────────────────────────────────── */
static int __init vas6154_init(void)
{
    int ret;

    ret = alloc_chrdev_region(&vas6154_devt,
                               VAS6154_MINOR_BASE,
                               VAS6154_MAX_DEVICES,
                               "vas6154");
    if (ret) {
        pr_err("vas6154: alloc_chrdev_region failed: %d\n", ret);
        return ret;
    }

    vas6154_class = class_create("vas6154");
    if (IS_ERR(vas6154_class)) {
        ret = PTR_ERR(vas6154_class);
        pr_err("vas6154: class_create failed: %d\n", ret);
        goto err_chrdev;
    }

    ret = usb_register(&vas6154_driver);
    if (ret) {
        pr_err("vas6154: usb_register failed: %d\n", ret);
        goto err_class;
    }

    pr_info("vas6154: driver loaded (major=%d)\n", MAJOR(vas6154_devt));
    return 0;

err_class:
    class_destroy(vas6154_class);
err_chrdev:
    unregister_chrdev_region(vas6154_devt, VAS6154_MAX_DEVICES);
    return ret;
}

static void __exit vas6154_exit(void)
{
    usb_deregister(&vas6154_driver);
    class_destroy(vas6154_class);
    unregister_chrdev_region(vas6154_devt, VAS6154_MAX_DEVICES);
    pr_info("vas6154: driver unloaded\n");
}

module_init(vas6154_init);
module_exit(vas6154_exit);
