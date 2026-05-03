/*
 * vas6154_usb.c - VAS 6154 USB Communication Layer
 * DERHAN AutoMatrix Pro - Linux Driver
 *
 * Uses libusb-1.0 for userspace USB access
 * No kernel module required - runs fully in userspace
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <pthread.h>
#include <unistd.h>
#include <stdint.h>
#include <stdbool.h>
#include <libusb-1.0/libusb.h>

#include "vas6154_usb.h"
#include "../include/vas6154.h"

/* ============================================================
 * Internal state
 * ============================================================ */

static libusb_context*          g_usb_ctx       = NULL;
static libusb_device_handle*    g_dev_handle    = NULL;
static volatile bool            g_running        = false;
static pthread_t                g_event_thread;
static pthread_mutex_t          g_tx_mutex       = PTHREAD_MUTEX_INITIALIZER;
static uint8_t                  g_seq_num        = 0;

/* Interrupt endpoint buffer */
static uint8_t g_int_buf[VAS6154_INT_IN_SIZE];
static struct libusb_transfer* g_int_transfer = NULL;

/* Event callback registered by upper layer */
static vas6154_event_cb_t g_event_cb = NULL;
static void* g_event_cb_data = NULL;

/* Known device table */
static const struct {
    uint16_t vid;
    uint16_t pid;
    const char* name;
} vas6154_devices[] = {
    { VAS6154_USB_VID, VAS6154_USB_PID_V1,          "VAS 6154 v1"       },
    { VAS6154_USB_VID, VAS6154_USB_PID_OPERATIONAL,  "VAS 6154 v2"       },
    { VAS6154_USB_VID, VAS6154_USB_PID_V3,           "VAS 6154 v3 CAN-FD"},
    { VAS6154_USB_VID, VAS6154_USB_PID_DFU,          "VAS 6154 DFU"      },
    { VAS6154_USB_VID, VAS6154_USB_PID_BOOT,         "VAS 6154 Boot"     },
    /* Fallback: scan for any Softing device */
    { 0x0403, 0x6001, "FTDI-based VCI (fallback)"   },  /* FTDI USB-Serial */
    { 0, 0, NULL }
};

/* ============================================================
 * USB Event Thread
 * ============================================================ */

static void* usb_event_thread(void* arg)
{
    (void)arg;
    struct timeval tv = { .tv_sec = 1, .tv_usec = 0 };

    while (g_running) {
        int r = libusb_handle_events_timeout_completed(g_usb_ctx, &tv, NULL);
        if (r < 0 && r != LIBUSB_ERROR_INTERRUPTED) {
            fprintf(stderr, "[VAS6154] USB event error: %s\n",
                    libusb_strerror(r));
        }
    }
    return NULL;
}

/* ============================================================
 * Interrupt IN callback (async events from device)
 * ============================================================ */

static void LIBUSB_CALL int_transfer_cb(struct libusb_transfer* transfer)
{
    if (transfer->status == LIBUSB_TRANSFER_COMPLETED) {
        if (g_event_cb && transfer->actual_length >= (int)sizeof(vas6154_evt_hdr_t)) {
            vas6154_evt_hdr_t* hdr = (vas6154_evt_hdr_t*)transfer->buffer;
            if (hdr->magic[0] == 0xDE && hdr->magic[1] == 0xCA) {
                g_event_cb(hdr->event_type,
                           hdr->channel,
                           hdr->timestamp_us,
                           transfer->buffer + sizeof(vas6154_evt_hdr_t),
                           hdr->length,
                           g_event_cb_data);
            }
        }
        /* Re-submit the transfer */
        if (g_running) {
            libusb_submit_transfer(transfer);
        }
    } else if (transfer->status != LIBUSB_TRANSFER_CANCELLED) {
        fprintf(stderr, "[VAS6154] INT transfer error: %d\n", transfer->status);
        if (g_running) {
            /* Brief delay before retry */
            usleep(10000);
            libusb_submit_transfer(transfer);
        }
    }
}

/* ============================================================
 * Public API: USB layer
 * ============================================================ */

int vas6154_usb_init(void)
{
    int r = libusb_init(&g_usb_ctx);
    if (r < 0) {
        fprintf(stderr, "[VAS6154] libusb_init failed: %s\n",
                libusb_strerror(r));
        return -1;
    }

#ifdef LIBUSB_LOG_LEVEL_WARNING
    libusb_set_option(g_usb_ctx, LIBUSB_OPTION_LOG_LEVEL, LIBUSB_LOG_LEVEL_WARNING);
#endif
    return 0;
}

void vas6154_usb_exit(void)
{
    if (g_usb_ctx) {
        libusb_exit(g_usb_ctx);
        g_usb_ctx = NULL;
    }
}

int vas6154_usb_open(void)
{
    if (!g_usb_ctx) {
        fprintf(stderr, "[VAS6154] USB not initialized\n");
        return -1;
    }

    /* Try each known device */
    for (int i = 0; vas6154_devices[i].vid != 0; i++) {
        g_dev_handle = libusb_open_device_with_vid_pid(
            g_usb_ctx,
            vas6154_devices[i].vid,
            vas6154_devices[i].pid);

        if (g_dev_handle) {
            printf("[VAS6154] Found: %s (VID=%04X PID=%04X)\n",
                   vas6154_devices[i].name,
                   vas6154_devices[i].vid,
                   vas6154_devices[i].pid);
            break;
        }
    }

    if (!g_dev_handle) {
        fprintf(stderr, "[VAS6154] No VAS 6154 device found.\n"
                        "  Check: lsusb | grep 19b2\n"
                        "  Ensure udev rules are installed: /etc/udev/rules.d/99-vas6154.rules\n");
        return -1;
    }

    /* Detach kernel driver if attached */
    if (libusb_kernel_driver_active(g_dev_handle, VAS6154_USB_INTERFACE) == 1) {
        int r = libusb_detach_kernel_driver(g_dev_handle, VAS6154_USB_INTERFACE);
        if (r < 0) {
            fprintf(stderr, "[VAS6154] Cannot detach kernel driver: %s\n",
                    libusb_strerror(r));
            fprintf(stderr, "  Try: sudo modprobe -r cdc_acm usbserial\n");
            libusb_close(g_dev_handle);
            g_dev_handle = NULL;
            return -1;
        }
        printf("[VAS6154] Detached kernel driver\n");
    }

    /* Set configuration */
    int r = libusb_set_configuration(g_dev_handle, VAS6154_USB_CONFIG);
    if (r < 0) {
        fprintf(stderr, "[VAS6154] set_configuration failed: %s\n",
                libusb_strerror(r));
        /* Non-fatal, continue */
    }

    /* Claim interface */
    r = libusb_claim_interface(g_dev_handle, VAS6154_USB_INTERFACE);
    if (r < 0) {
        fprintf(stderr, "[VAS6154] claim_interface failed: %s\n"
                        "  Try running as root or check udev rules\n",
                libusb_strerror(r));
        libusb_close(g_dev_handle);
        g_dev_handle = NULL;
        return -1;
    }

    /* Start event thread */
    g_running = true;
    if (pthread_create(&g_event_thread, NULL, usb_event_thread, NULL) != 0) {
        fprintf(stderr, "[VAS6154] Failed to create event thread\n");
        libusb_release_interface(g_dev_handle, VAS6154_USB_INTERFACE);
        libusb_close(g_dev_handle);
        g_dev_handle = NULL;
        return -1;
    }

    /* Set up async interrupt IN transfer */
    g_int_transfer = libusb_alloc_transfer(0);
    if (g_int_transfer) {
        libusb_fill_interrupt_transfer(g_int_transfer,
                                        g_dev_handle,
                                        VAS6154_EP_INT_IN,
                                        g_int_buf,
                                        VAS6154_INT_IN_SIZE,
                                        int_transfer_cb,
                                        NULL,
                                        0);
        r = libusb_submit_transfer(g_int_transfer);
        if (r < 0) {
            fprintf(stderr, "[VAS6154] INT transfer submit failed: %s\n",
                    libusb_strerror(r));
            /* Non-fatal */
        }
    }

    printf("[VAS6154] USB device opened successfully\n");
    return 0;
}

void vas6154_usb_close(void)
{
    g_running = false;

    if (g_int_transfer) {
        libusb_cancel_transfer(g_int_transfer);
        /* Wait for cancellation */
        usleep(100000);
        libusb_free_transfer(g_int_transfer);
        g_int_transfer = NULL;
    }

    pthread_join(g_event_thread, NULL);

    if (g_dev_handle) {
        libusb_release_interface(g_dev_handle, VAS6154_USB_INTERFACE);
        libusb_attach_kernel_driver(g_dev_handle, VAS6154_USB_INTERFACE);
        libusb_close(g_dev_handle);
        g_dev_handle = NULL;
    }
}

/* ============================================================
 * Low-level USB I/O
 * ============================================================ */

int vas6154_usb_send_cmd(uint8_t  cmd,
                          uint16_t channel,
                          const uint8_t* payload,
                          uint16_t payload_len)
{
    if (!g_dev_handle) return -1;

    size_t total = sizeof(vas6154_cmd_hdr_t) + payload_len;
    uint8_t* buf = malloc(total);
    if (!buf) return -ENOMEM;

    vas6154_cmd_hdr_t* hdr = (vas6154_cmd_hdr_t*)buf;
    hdr->magic[0] = 0xDE;
    hdr->magic[1] = 0xAD;
    hdr->cmd      = cmd;
    hdr->channel  = channel;
    hdr->length   = payload_len;

    pthread_mutex_lock(&g_tx_mutex);
    hdr->seq = g_seq_num++;
    pthread_mutex_unlock(&g_tx_mutex);

    if (payload && payload_len > 0) {
        memcpy(buf + sizeof(vas6154_cmd_hdr_t), payload, payload_len);
    }

    int transferred = 0;
    int r = libusb_bulk_transfer(g_dev_handle,
                                  VAS6154_EP_BULK_OUT,
                                  buf,
                                  (int)total,
                                  &transferred,
                                  VAS6154_USB_TIMEOUT_MS);
    free(buf);

    if (r < 0) {
        fprintf(stderr, "[VAS6154] bulk_out failed (cmd=0x%02X): %s\n",
                cmd, libusb_strerror(r));
        return -1;
    }
    return transferred;
}

int vas6154_usb_recv_rsp(uint8_t  expected_cmd,
                          uint8_t* payload_out,
                          uint16_t payload_max,
                          uint16_t* payload_len_out)
{
    if (!g_dev_handle) return -1;

    uint8_t buf[VAS6154_BULK_IN_SIZE];
    int transferred = 0;
    int r = libusb_bulk_transfer(g_dev_handle,
                                  VAS6154_EP_BULK_IN,
                                  buf,
                                  sizeof(buf),
                                  &transferred,
                                  VAS6154_USB_TIMEOUT_MS);
    if (r < 0) {
        fprintf(stderr, "[VAS6154] bulk_in failed: %s\n", libusb_strerror(r));
        return -1;
    }

    if (transferred < (int)sizeof(vas6154_rsp_hdr_t)) {
        fprintf(stderr, "[VAS6154] Response too short (%d bytes)\n", transferred);
        return -1;
    }

    vas6154_rsp_hdr_t* hdr = (vas6154_rsp_hdr_t*)buf;
    if (hdr->magic[0] != 0xDE || hdr->magic[1] != 0xBE) {
        fprintf(stderr, "[VAS6154] Invalid response magic: %02X %02X\n",
                hdr->magic[0], hdr->magic[1]);
        return -1;
    }

    if (hdr->cmd != expected_cmd) {
        fprintf(stderr, "[VAS6154] Response cmd mismatch: got 0x%02X, expected 0x%02X\n",
                hdr->cmd, expected_cmd);
        return -1;
    }

    if (hdr->status != VAS6154_RSP_OK) {
        fprintf(stderr, "[VAS6154] Device error 0x%02X for cmd 0x%02X\n",
                hdr->status, hdr->cmd);
        return -(int)hdr->status;
    }

    uint16_t plen = hdr->length;
    if (plen > 0 && payload_out && payload_max > 0) {
        uint16_t copy = (plen < payload_max) ? plen : payload_max;
        memcpy(payload_out,
               buf + sizeof(vas6154_rsp_hdr_t),
               copy);
        if (payload_len_out) *payload_len_out = copy;
    } else if (payload_len_out) {
        *payload_len_out = 0;
    }

    return 0;
}

/* ============================================================
 * High-level device commands
 * ============================================================ */

int vas6154_get_info(vas6154_info_payload_t* info)
{
    if (!info) return -1;

    int r = vas6154_usb_send_cmd(VAS6154_CMD_GET_INFO, 0, NULL, 0);
    if (r < 0) return r;

    uint16_t len = 0;
    r = vas6154_usb_recv_rsp(VAS6154_CMD_GET_INFO,
                              (uint8_t*)info,
                              sizeof(*info),
                              &len);
    if (r < 0) return r;

    printf("[VAS6154] Device info:\n");
    printf("  VID/PID:  %04X/%04X\n", info->vendor_id, info->product_id);
    printf("  HW:       v%d.%d\n", info->hw_version_major, info->hw_version_minor);
    printf("  FW:       v%d.%d.%d (%s)\n",
           info->fw_version_major, info->fw_version_minor,
           info->fw_version_patch, info->fw_date);
    printf("  Serial:   %s\n", info->serial);
    printf("  CAN ch:   %d\n", info->num_can_channels);
    printf("  CAN-FD:   %s\n", info->can_fd_capable ? "Yes" : "No");
    printf("  DoIP:     %s\n", info->doip_capable    ? "Yes" : "No");
    return 0;
}

int vas6154_reset(void)
{
    int r = vas6154_usb_send_cmd(VAS6154_CMD_RESET, 0, NULL, 0);
    if (r < 0) return r;
    /* Wait for device to reset */
    usleep(500000);
    uint16_t len = 0;
    return vas6154_usb_recv_rsp(VAS6154_CMD_RESET, NULL, 0, &len);
}

int vas6154_set_led(uint8_t color)
{
    return vas6154_usb_send_cmd(VAS6154_CMD_SET_LED, 0, &color, 1);
}

int vas6154_open_channel(uint8_t channel, uint32_t baudrate)
{
    uint8_t payload[5];
    payload[0] = channel;
    payload[1] = (baudrate >> 24) & 0xFF;
    payload[2] = (baudrate >> 16) & 0xFF;
    payload[3] = (baudrate >>  8) & 0xFF;
    payload[4] = (baudrate      ) & 0xFF;

    int r = vas6154_usb_send_cmd(VAS6154_CMD_OPEN_CHANNEL, channel, payload, sizeof(payload));
    if (r < 0) return r;

    uint16_t len = 0;
    return vas6154_usb_recv_rsp(VAS6154_CMD_OPEN_CHANNEL, NULL, 0, &len);
}

int vas6154_close_channel(uint8_t channel)
{
    int r = vas6154_usb_send_cmd(VAS6154_CMD_CLOSE_CHANNEL, channel, NULL, 0);
    if (r < 0) return r;
    uint16_t len = 0;
    return vas6154_usb_recv_rsp(VAS6154_CMD_CLOSE_CHANNEL, NULL, 0, &len);
}

int vas6154_send_can_frame(uint8_t channel, const vas6154_can_frame_t* frame)
{
    return vas6154_usb_send_cmd(VAS6154_CMD_SEND_RAW_CAN,
                                 channel,
                                 (const uint8_t*)frame,
                                 sizeof(*frame));
}

int vas6154_send_isotp(uint8_t channel,
                        const vas6154_istp_hdr_t* hdr,
                        const uint8_t* data,
                        uint16_t data_len)
{
    size_t total = sizeof(*hdr) + data_len;
    uint8_t* buf = malloc(total);
    if (!buf) return -ENOMEM;

    memcpy(buf, hdr, sizeof(*hdr));
    memcpy(buf + sizeof(*hdr), data, data_len);

    int r = vas6154_usb_send_cmd(VAS6154_CMD_SEND_ISTP_MSG,
                                  channel, buf, (uint16_t)total);
    free(buf);
    return r;
}

int vas6154_recv_isotp(uint8_t channel,
                        uint8_t* buf,
                        uint16_t buf_max,
                        uint16_t* received_len,
                        uint32_t timeout_ms)
{
    (void)channel;
    (void)timeout_ms;

    /* Poll for response */
    uint8_t rsp[VAS6154_MAX_MSG_SIZE];
    uint16_t rsp_len = 0;
    int r = vas6154_usb_recv_rsp(VAS6154_CMD_RECV_MSG,
                                  rsp, sizeof(rsp), &rsp_len);
    if (r < 0) return r;

    if (rsp_len > buf_max) rsp_len = buf_max;
    memcpy(buf, rsp, rsp_len);
    if (received_len) *received_len = rsp_len;
    return 0;
}

int vas6154_kline_init(uint8_t addr, uint8_t init_type)
{
    vas6154_kline_init_t kinit = {
        .init_type = init_type,
        .baud = 0x00,       /* 10.4kbaud */
        .addr = addr,
        .flags = 0x00,
    };

    int r = vas6154_usb_send_cmd(VAS6154_CMD_KLINE_INIT, 0,
                                  (uint8_t*)&kinit, sizeof(kinit));
    if (r < 0) return r;
    uint16_t len = 0;
    return vas6154_usb_recv_rsp(VAS6154_CMD_KLINE_INIT, NULL, 0, &len);
}

void vas6154_register_event_cb(vas6154_event_cb_t cb, void* userdata)
{
    g_event_cb      = cb;
    g_event_cb_data = userdata;
}

int vas6154_keepalive(void)
{
    int r = vas6154_usb_send_cmd(VAS6154_CMD_KEEPALIVE, 0, NULL, 0);
    if (r < 0) return r;
    uint16_t len = 0;
    return vas6154_usb_recv_rsp(VAS6154_CMD_KEEPALIVE, NULL, 0, &len);
}

/* ============================================================
 * Device enumeration helper
 * ============================================================ */

int vas6154_enumerate_devices(vas6154_dev_info_t* out, int max_devs)
{
    if (!g_usb_ctx) return -1;

    libusb_device** list;
    ssize_t cnt = libusb_get_device_list(g_usb_ctx, &list);
    if (cnt < 0) return -1;

    int found = 0;
    for (ssize_t i = 0; i < cnt && found < max_devs; i++) {
        struct libusb_device_descriptor desc;
        if (libusb_get_device_descriptor(list[i], &desc) != 0) continue;

        for (int j = 0; vas6154_devices[j].vid != 0; j++) {
            if (desc.idVendor  == vas6154_devices[j].vid &&
                desc.idProduct == vas6154_devices[j].pid) {
                out[found].vid  = desc.idVendor;
                out[found].pid  = desc.idProduct;
                out[found].bus  = libusb_get_bus_number(list[i]);
                out[found].port = libusb_get_device_address(list[i]);
                snprintf(out[found].name, sizeof(out[found].name),
                         "%s", vas6154_devices[j].name);
                found++;
                break;
            }
        }
    }

    libusb_free_device_list(list, 1);
    return found;
}
