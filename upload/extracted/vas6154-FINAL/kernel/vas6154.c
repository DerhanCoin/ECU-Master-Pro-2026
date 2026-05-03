// SPDX-License-Identifier: GPL-2.0
/*
 * vas6154.c - Linux kernel USB driver for VAS 6154
 * DERHAN AutoMatrix Pro
 *
 * Kreira /dev/vas6154_N pri svakom spajanju dongla
 * Sysfs: /sys/class/vas6154/vas6154_N/{serial,fw_version,hw_version,can_fd}
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

MODULE_LICENSE("GPL v2");
MODULE_AUTHOR("DERHAN AutoMatrix Pro");
MODULE_DESCRIPTION("VAS 6154 VCI USB driver - /dev/vas6154_N");
MODULE_VERSION("1.0.0");

#define VAS6154_VID          0x19B2
#define VAS6154_PID_V1       0x0003
#define VAS6154_PID_V2       0x0008
#define VAS6154_PID_V3       0x000C
#define VAS6154_PID_DFU      0x0009
#define VAS6154_PID_BOOT     0x000A

#define VAS6154_MINOR_BASE   180
#define VAS6154_MAX_DEVS     8
#define VAS6154_BUF_SIZE     65536
#define VAS6154_TIMEOUT      5000

#define EP_BULK_OUT  0x01
#define EP_BULK_IN   0x81
#define EP_INT_IN    0x82

static const struct usb_device_id vas6154_ids[] = {
    { USB_DEVICE(VAS6154_VID, VAS6154_PID_V1) },
    { USB_DEVICE(VAS6154_VID, VAS6154_PID_V2) },
    { USB_DEVICE(VAS6154_VID, VAS6154_PID_V3) },
    { USB_DEVICE(VAS6154_VID, VAS6154_PID_DFU) },
    { USB_DEVICE(VAS6154_VID, VAS6154_PID_BOOT) },
    { }
};
MODULE_DEVICE_TABLE(usb, vas6154_ids);

struct vas6154_dev {
    struct usb_device    *udev;
    struct usb_interface *iface;
    struct cdev           cdev;
    struct device        *sysdev;
    unsigned int          minor;
    struct mutex          lock;
    wait_queue_head_t     rx_wq;
    u8                   *rx_buf;
    size_t                rx_head, rx_tail;
    spinlock_t            rx_spin;
    struct urb           *int_urb;
    u8                   *int_buf;
    bool                  gone;
    char                  serial[20];
    u8                    fw_major, fw_minor, fw_patch;
    u8                    hw_major, hw_minor;
    u8                    can_fd;
};

static struct class  *vas6154_class;
static dev_t          vas6154_devt;
static DEFINE_MUTEX(minors_lock);
static struct vas6154_dev *minors[VAS6154_MAX_DEVS];

/* ── RX ring ─────────────────────────────────── */
static void rx_push(struct vas6154_dev *d, const u8 *data, size_t n)
{
    size_t i; unsigned long f;
    spin_lock_irqsave(&d->rx_spin, f);
    for (i = 0; i < n; i++) {
        size_t nx = (d->rx_head + 1) % VAS6154_BUF_SIZE;
        if (nx != d->rx_tail) { d->rx_buf[d->rx_head] = data[i]; d->rx_head = nx; }
    }
    spin_unlock_irqrestore(&d->rx_spin, f);
    wake_up_interruptible(&d->rx_wq);
}

static ssize_t rx_pop(struct vas6154_dev *d, u8 *out, size_t max)
{
    size_t n = 0; unsigned long f;
    spin_lock_irqsave(&d->rx_spin, f);
    while (n < max && d->rx_tail != d->rx_head) {
        out[n++] = d->rx_buf[d->rx_tail];
        d->rx_tail = (d->rx_tail + 1) % VAS6154_BUF_SIZE;
    }
    spin_unlock_irqrestore(&d->rx_spin, f);
    return n;
}

static bool rx_empty(struct vas6154_dev *d)
{
    unsigned long f; bool e;
    spin_lock_irqsave(&d->rx_spin, f);
    e = (d->rx_head == d->rx_tail);
    spin_unlock_irqrestore(&d->rx_spin, f);
    return e;
}

/* ── INT callback ────────────────────────────── */
static void vas6154_int_cb(struct urb *urb)
{
    struct vas6154_dev *d = urb->context;
    if (urb->status == 0 && urb->actual_length > 0)
        rx_push(d, d->int_buf, urb->actual_length);
    if (urb->status != -ECONNRESET && urb->status != -ESHUTDOWN && !d->gone)
        usb_submit_urb(urb, GFP_ATOMIC);
}

/* ── sysfs attrs ─────────────────────────────── */
static ssize_t serial_show(struct device *dev, struct device_attribute *a, char *buf)
{ return sysfs_emit(buf, "%s\n", ((struct vas6154_dev*)dev_get_drvdata(dev))->serial); }
static DEVICE_ATTR_RO(serial);

static ssize_t fw_version_show(struct device *dev, struct device_attribute *a, char *buf)
{
    struct vas6154_dev *d = dev_get_drvdata(dev);
    return sysfs_emit(buf, "%d.%d.%d\n", d->fw_major, d->fw_minor, d->fw_patch);
}
static DEVICE_ATTR_RO(fw_version);

static ssize_t hw_version_show(struct device *dev, struct device_attribute *a, char *buf)
{
    struct vas6154_dev *d = dev_get_drvdata(dev);
    return sysfs_emit(buf, "%d.%d\n", d->hw_major, d->hw_minor);
}
static DEVICE_ATTR_RO(hw_version);

static ssize_t can_fd_show(struct device *dev, struct device_attribute *a, char *buf)
{ return sysfs_emit(buf, "%d\n", ((struct vas6154_dev*)dev_get_drvdata(dev))->can_fd); }
static DEVICE_ATTR_RO(can_fd);

static struct attribute *vas6154_attrs[] = {
    &dev_attr_serial.attr, &dev_attr_fw_version.attr,
    &dev_attr_hw_version.attr, &dev_attr_can_fd.attr, NULL
};
ATTRIBUTE_GROUPS(vas6154);

/* ── Query device info ───────────────────────── */
static void vas6154_query(struct vas6154_dev *d)
{
    u8 cmd[8] = {0xDE,0xAD,0x01,0x01,0,0,0,0};
    u8 rsp[64] = {};
    int act = 0;
    if (usb_bulk_msg(d->udev, usb_sndbulkpipe(d->udev, EP_BULK_OUT),
                     cmd, 8, &act, VAS6154_TIMEOUT)) return;
    if (usb_bulk_msg(d->udev, usb_rcvbulkpipe(d->udev, EP_BULK_IN),
                     rsp, 64, &act, VAS6154_TIMEOUT) || act < 20) {
        snprintf(d->serial, sizeof(d->serial), "UNKNOWN");
        return;
    }
    d->hw_major = rsp[12]; d->hw_minor = rsp[13];
    d->fw_major = rsp[14]; d->fw_minor = rsp[15]; d->fw_patch = rsp[16];
    d->can_fd   = rsp[18];
    memcpy(d->serial, rsp + 20, min(act - 20, (int)sizeof(d->serial) - 1));
}

/* ── fops ────────────────────────────────────── */
static int vas6154_open(struct inode *inode, struct file *file)
{
    struct vas6154_dev *d;
    int idx = iminor(inode) - VAS6154_MINOR_BASE;
    mutex_lock(&minors_lock);
    d = (idx >= 0 && idx < VAS6154_MAX_DEVS) ? minors[idx] : NULL;
    mutex_unlock(&minors_lock);
    if (!d || d->gone) return -ENODEV;
    file->private_data = d;
    return 0;
}

static int vas6154_release(struct inode *i, struct file *f) { return 0; }

static ssize_t vas6154_read(struct file *f, char __user *buf, size_t count, loff_t *pos)
{
    struct vas6154_dev *d = f->private_data;
    u8 tmp[512]; ssize_t n;
    while (rx_empty(d)) {
        if (f->f_flags & O_NONBLOCK) return -EAGAIN;
        if (wait_event_interruptible(d->rx_wq, !rx_empty(d) || d->gone)) return -ERESTARTSYS;
        if (d->gone) return -ENODEV;
    }
    n = rx_pop(d, tmp, min(count, sizeof(tmp)));
    return copy_to_user(buf, tmp, n) ? -EFAULT : n;
}

static ssize_t vas6154_write(struct file *f, const char __user *buf, size_t count, loff_t *pos)
{
    struct vas6154_dev *d = f->private_data;
    u8 *tmp; int act; ssize_t r;
    if (d->gone) return -ENODEV;
    if (count > 512) count = 512;
    tmp = kmalloc(count, GFP_KERNEL);
    if (!tmp) return -ENOMEM;
    if (copy_from_user(tmp, buf, count)) { kfree(tmp); return -EFAULT; }
    r = usb_bulk_msg(d->udev, usb_sndbulkpipe(d->udev, EP_BULK_OUT),
                     tmp, count, &act, VAS6154_TIMEOUT);
    kfree(tmp);
    return r ? r : act;
}

static __poll_t vas6154_poll(struct file *f, poll_table *w)
{
    struct vas6154_dev *d = f->private_data;
    poll_wait(f, &d->rx_wq, w);
    return (EPOLLOUT | EPOLLWRNORM) | (rx_empty(d) ? 0 : (EPOLLIN | EPOLLRDNORM));
}

static const struct file_operations vas6154_fops = {
    .owner = THIS_MODULE, .open = vas6154_open,
    .release = vas6154_release, .read = vas6154_read,
    .write = vas6154_write, .poll = vas6154_poll,
    .llseek = no_llseek,
};

/* ── probe ───────────────────────────────────── */
static int vas6154_probe(struct usb_interface *iface,
                          const struct usb_device_id *id)
{
    struct vas6154_dev *d;
    int idx = -1, i, ret = -ENOMEM;

    d = kzalloc(sizeof(*d), GFP_KERNEL);
    if (!d) return -ENOMEM;

    d->udev  = usb_get_dev(interface_to_usbdev(iface));
    d->iface = iface;
    mutex_init(&d->lock);
    spin_lock_init(&d->rx_spin);
    init_waitqueue_head(&d->rx_wq);

    d->rx_buf  = kzalloc(VAS6154_BUF_SIZE, GFP_KERNEL);
    d->int_buf = kzalloc(64, GFP_KERNEL);
    if (!d->rx_buf || !d->int_buf) goto err_free;

    /* Find minor slot */
    mutex_lock(&minors_lock);
    for (i = 0; i < VAS6154_MAX_DEVS; i++)
        if (!minors[i]) { idx = i; break; }
    if (idx >= 0) { minors[idx] = d; d->minor = VAS6154_MINOR_BASE + idx; }
    mutex_unlock(&minors_lock);
    if (idx < 0) { ret = -ENODEV; goto err_free; }

    /* Query firmware info */
    vas6154_query(d);

    /* Char device */
    cdev_init(&d->cdev, &vas6154_fops);
    d->cdev.owner = THIS_MODULE;
    ret = cdev_add(&d->cdev, MKDEV(MAJOR(vas6154_devt), d->minor), 1);
    if (ret) goto err_minor;

    /* /dev/vas6154_N + sysfs */
    d->sysdev = device_create_with_groups(
        vas6154_class, &iface->dev,
        MKDEV(MAJOR(vas6154_devt), d->minor),
        d, vas6154_groups, "vas6154_%d", idx);
    if (IS_ERR(d->sysdev)) { ret = PTR_ERR(d->sysdev); goto err_cdev; }

    /* INT URB */
    d->int_urb = usb_alloc_urb(0, GFP_KERNEL);
    if (d->int_urb) {
        usb_fill_int_urb(d->int_urb, d->udev,
                         usb_rcvintpipe(d->udev, EP_INT_IN),
                         d->int_buf, 64, vas6154_int_cb, d, 1);
        usb_submit_urb(d->int_urb, GFP_KERNEL);
    }

    usb_set_intfdata(iface, d);
    dev_info(&iface->dev,
             "VAS 6154 → /dev/vas6154_%d  SN=%s  FW=%d.%d.%d  CANFD=%d\n",
             idx, d->serial, d->fw_major, d->fw_minor, d->fw_patch, d->can_fd);
    return 0;

err_cdev:  cdev_del(&d->cdev);
err_minor: mutex_lock(&minors_lock); minors[idx]=NULL; mutex_unlock(&minors_lock);
err_free:  kfree(d->int_buf); kfree(d->rx_buf); usb_put_dev(d->udev); kfree(d);
    return ret;
}

static void vas6154_disconnect(struct usb_interface *iface)
{
    struct vas6154_dev *d = usb_get_intfdata(iface);
    int idx;
    if (!d) return;
    d->gone = true;
    if (d->int_urb) { usb_kill_urb(d->int_urb); usb_free_urb(d->int_urb); }
    wake_up_interruptible(&d->rx_wq);
    device_destroy(vas6154_class, MKDEV(MAJOR(vas6154_devt), d->minor));
    cdev_del(&d->cdev);
    idx = d->minor - VAS6154_MINOR_BASE;
    mutex_lock(&minors_lock); minors[idx] = NULL; mutex_unlock(&minors_lock);
    dev_info(&iface->dev, "VAS 6154 odpojen: /dev/vas6154_%d\n", idx);
    usb_set_intfdata(iface, NULL);
    usb_put_dev(d->udev);
    kfree(d->int_buf); kfree(d->rx_buf); kfree(d);
}

static struct usb_driver vas6154_drv = {
    .name       = "vas6154",
    .probe      = vas6154_probe,
    .disconnect = vas6154_disconnect,
    .id_table   = vas6154_ids,
};

static int __init vas6154_init(void)
{
    int r = alloc_chrdev_region(&vas6154_devt, VAS6154_MINOR_BASE, VAS6154_MAX_DEVS, "vas6154");
    if (r) return r;
    vas6154_class = class_create("vas6154");
    if (IS_ERR(vas6154_class)) { r = PTR_ERR(vas6154_class); goto err; }
    r = usb_register(&vas6154_drv);
    if (r) { class_destroy(vas6154_class); goto err; }
    pr_info("vas6154: driver učitan (major=%d)\n", MAJOR(vas6154_devt));
    return 0;
err:
    unregister_chrdev_region(vas6154_devt, VAS6154_MAX_DEVS);
    return r;
}

static void __exit vas6154_exit(void)
{
    usb_deregister(&vas6154_drv);
    class_destroy(vas6154_class);
    unregister_chrdev_region(vas6154_devt, VAS6154_MAX_DEVS);
    pr_info("vas6154: driver uklonjen\n");
}

module_init(vas6154_init);
module_exit(vas6154_exit);
