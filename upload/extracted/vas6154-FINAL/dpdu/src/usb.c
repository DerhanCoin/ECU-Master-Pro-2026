#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <unistd.h>
#include <errno.h>
#include <pthread.h>
#include <libusb-1.0/libusb.h>
#include "../include/vas6154.h"

static libusb_context       *g_ctx     = NULL;
static libusb_device_handle *g_dev     = NULL;
static volatile bool         g_running = false;
static pthread_t             g_thread;
static pthread_mutex_t       g_tx_lock = PTHREAD_MUTEX_INITIALIZER;
static uint8_t               g_seq     = 0;
static struct libusb_transfer *g_int_xfr = NULL;
static uint8_t               g_int_buf[64];
static vas6154_event_cb      g_cb      = NULL;
static void                 *g_cb_ud   = NULL;

static const struct { uint16_t vid,pid; const char *name; } DEVS[] = {
    {VAS6154_VID, VAS6154_PID_V1,  "VAS 6154 v1"},
    {VAS6154_VID, VAS6154_PID_V2,  "VAS 6154 v2"},
    {VAS6154_VID, VAS6154_PID_V3,  "VAS 6154 v3 CAN-FD"},
    {VAS6154_VID, VAS6154_PID_DFU, "VAS 6154 DFU"},
    {0,0,NULL}
};

static void *event_thread(void *a) {
    (void)a;
    struct timeval tv = {1,0};
    while (g_running) libusb_handle_events_timeout_completed(g_ctx, &tv, NULL);
    return NULL;
}

static void LIBUSB_CALL int_cb(struct libusb_transfer *xfr) {
    if (xfr->status == LIBUSB_TRANSFER_COMPLETED) {
        if (g_cb && xfr->actual_length >= (int)sizeof(vas6154_evt_t)) {
            vas6154_evt_t *h = (vas6154_evt_t*)xfr->buffer;
            if (h->magic[0]==0xDE && h->magic[1]==0xCA)
                g_cb(h->event, h->channel, h->ts_us,
                     xfr->buffer + sizeof(vas6154_evt_t), h->length, g_cb_ud);
        }
        if (g_running) libusb_submit_transfer(xfr);
    }
}

int vas6154_usb_init(void) {
    int r = libusb_init(&g_ctx);
    if (r) { fprintf(stderr,"[VAS6154] libusb_init: %s\n",libusb_strerror(r)); return -1; }
    return 0;
}

void vas6154_usb_exit(void) { if (g_ctx) { libusb_exit(g_ctx); g_ctx=NULL; } }

int vas6154_usb_open(void) {
    for (int i=0; DEVS[i].vid; i++) {
        g_dev = libusb_open_device_with_vid_pid(g_ctx, DEVS[i].vid, DEVS[i].pid);
        if (g_dev) { printf("[VAS6154] Pronađen: %s\n", DEVS[i].name); break; }
    }
    if (!g_dev) {
        fprintf(stderr,"[VAS6154] Dongle nije pronađen!\n"
                       "  Provjeri: lsusb | grep 19b2\n"
                       "  Provjeri: /etc/udev/rules.d/99-vas6154.rules\n");
        return -1;
    }
    if (libusb_kernel_driver_active(g_dev,0)==1) {
        int r = libusb_detach_kernel_driver(g_dev,0);
        if (r) { fprintf(stderr,"[VAS6154] Detach driver: %s\n",libusb_strerror(r)); }
    }
    libusb_set_configuration(g_dev,1);
    int r = libusb_claim_interface(g_dev,0);
    if (r) { fprintf(stderr,"[VAS6154] Claim interface: %s\n",libusb_strerror(r)); libusb_close(g_dev); g_dev=NULL; return -1; }
    g_running=true;
    pthread_create(&g_thread, NULL, event_thread, NULL);
    g_int_xfr = libusb_alloc_transfer(0);
    if (g_int_xfr) {
        libusb_fill_interrupt_transfer(g_int_xfr, g_dev, VAS6154_EP_INT,
                                        g_int_buf, 64, int_cb, NULL, 0);
        libusb_submit_transfer(g_int_xfr);
    }
    printf("[VAS6154] USB otvoren OK\n");
    return 0;
}

void vas6154_usb_close(void) {
    g_running=false;
    if (g_int_xfr) { libusb_cancel_transfer(g_int_xfr); usleep(100000); libusb_free_transfer(g_int_xfr); g_int_xfr=NULL; }
    pthread_join(g_thread,NULL);
    if (g_dev) { libusb_release_interface(g_dev,0); libusb_attach_kernel_driver(g_dev,0); libusb_close(g_dev); g_dev=NULL; }
}

int vas6154_send(uint8_t cmd, uint16_t ch, const uint8_t *pay, uint16_t plen) {
    if (!g_dev) return -1;
    size_t tot = sizeof(vas6154_cmd_t)+plen;
    uint8_t *buf = malloc(tot);
    if (!buf) return -ENOMEM;
    vas6154_cmd_t *h = (vas6154_cmd_t*)buf;
    h->magic[0]=0xDE; h->magic[1]=0xAD;
    h->cmd=cmd; h->channel=ch; h->length=plen;
    pthread_mutex_lock(&g_tx_lock); h->seq=g_seq++; pthread_mutex_unlock(&g_tx_lock);
    if (pay&&plen) memcpy(buf+sizeof(*h), pay, plen);
    int act=0, r=libusb_bulk_transfer(g_dev, VAS6154_EP_OUT, buf, (int)tot, &act, 5000);
    free(buf);
    if (r) { fprintf(stderr,"[VAS6154] send cmd=0x%02X: %s\n",cmd,libusb_strerror(r)); return -1; }
    return act;
}

int vas6154_recv(uint8_t ecmd, uint8_t *out, uint16_t maxlen, uint16_t *outlen) {
    if (!g_dev) return -1;
    uint8_t buf[512]; int act=0;
    int r=libusb_bulk_transfer(g_dev, VAS6154_EP_IN, buf, sizeof(buf), &act, 5000);
    if (r) { fprintf(stderr,"[VAS6154] recv: %s\n",libusb_strerror(r)); return -1; }
    if (act<(int)sizeof(vas6154_rsp_t)) return -1;
    vas6154_rsp_t *h=(vas6154_rsp_t*)buf;
    if (h->magic[0]!=0xDE||h->magic[1]!=0xBE) return -1;
    if (h->cmd!=ecmd) return -1;
    if (h->status!=0) { fprintf(stderr,"[VAS6154] device err 0x%02X cmd=0x%02X\n",h->status,ecmd); return -(int)h->status; }
    uint16_t pl=h->length;
    if (out&&outlen&&pl>0) { uint16_t cp=pl<maxlen?pl:maxlen; memcpy(out,buf+sizeof(*h),cp); *outlen=cp; }
    else if (outlen) *outlen=0;
    return 0;
}

void vas6154_register_cb(vas6154_event_cb cb, void *ud) { g_cb=cb; g_cb_ud=ud; }

int vas6154_get_info(vas6154_info_t *info) {
    int r=vas6154_send(CMD_GET_INFO,0,NULL,0); if (r<0) return r;
    uint16_t l=0; r=vas6154_recv(CMD_GET_INFO,(uint8_t*)info,sizeof(*info),&l);
    if (!r) { printf("[VAS6154] SN=%s FW=%d.%d.%d HW=%d.%d CANFD=%d\n",
        info->serial,info->fw_major,info->fw_minor,info->fw_patch,
        info->hw_major,info->hw_minor,info->can_fd); }
    return r;
}

int vas6154_reset(void) {
    int r=vas6154_send(CMD_RESET,0,NULL,0); if (r<0) return r;
    usleep(500000); uint16_t l=0; return vas6154_recv(CMD_RESET,NULL,0,&l);
}

int vas6154_set_led(uint8_t color) { return vas6154_send(CMD_SET_LED,0,&color,1); }

int vas6154_open_channel(uint8_t ch, uint32_t baud) {
    uint8_t p[5]={ch,(baud>>24)&0xFF,(baud>>16)&0xFF,(baud>>8)&0xFF,baud&0xFF};
    int r=vas6154_send(CMD_OPEN_CH,ch,p,5); if (r<0) return r;
    uint16_t l=0; return vas6154_recv(CMD_OPEN_CH,NULL,0,&l);
}

int vas6154_close_channel(uint8_t ch) {
    int r=vas6154_send(CMD_CLOSE_CH,ch,NULL,0); if (r<0) return r;
    uint16_t l=0; return vas6154_recv(CMD_CLOSE_CH,NULL,0,&l);
}

int vas6154_send_istp(uint8_t ch, const vas6154_istp_t *h, const uint8_t *data, uint16_t len) {
    size_t tot=sizeof(*h)+len; uint8_t *buf=malloc(tot); if (!buf) return -ENOMEM;
    memcpy(buf,h,sizeof(*h)); memcpy(buf+sizeof(*h),data,len);
    int r=vas6154_send(CMD_SEND_ISTP,ch,buf,(uint16_t)tot); free(buf); return r;
}

int vas6154_recv_istp(uint8_t ch, uint8_t *buf, uint16_t maxlen, uint16_t *recvlen, uint32_t timeout_ms) {
    (void)ch; (void)timeout_ms;
    return vas6154_recv(CMD_RECV, buf, maxlen, recvlen);
}

int vas6154_keepalive(void) {
    int r=vas6154_send(CMD_KEEPALIVE,0,NULL,0); if (r<0) return r;
    uint16_t l=0; return vas6154_recv(CMD_KEEPALIVE,NULL,0,&l);
}

int vas6154_enumerate(vas6154_devinfo_t *out, int max) {
    if (!g_ctx) return -1;
    libusb_device **list; ssize_t cnt=libusb_get_device_list(g_ctx,&list);
    if (cnt<0) return -1;
    int found=0;
    for (ssize_t i=0; i<cnt&&found<max; i++) {
        struct libusb_device_descriptor desc;
        if (libusb_get_device_descriptor(list[i],&desc)) continue;
        for (int j=0; DEVS[j].vid; j++) {
            if (desc.idVendor==DEVS[j].vid && desc.idProduct==DEVS[j].pid) {
                out[found].vid=desc.idVendor; out[found].pid=desc.idProduct;
                out[found].bus=libusb_get_bus_number(list[i]);
                out[found].addr=libusb_get_device_address(list[i]);
                snprintf(out[found].name,64,"%s",DEVS[j].name);
                found++; break;
            }
        }
    }
    libusb_free_device_list(list,1);
    return found;
}
