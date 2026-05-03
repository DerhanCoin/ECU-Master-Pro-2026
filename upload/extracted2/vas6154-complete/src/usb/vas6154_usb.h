#ifndef VAS6154_USB_H
#define VAS6154_USB_H

#include <stdint.h>
#include "../../include/vas6154.h"

#ifdef __cplusplus
extern "C" {
#endif

/* Event callback type */
typedef void (*vas6154_event_cb_t)(uint8_t event_type,
                                    uint8_t channel,
                                    uint32_t timestamp_us,
                                    const uint8_t* data,
                                    uint16_t data_len,
                                    void* userdata);

/* Device info for enumeration */
typedef struct {
    uint16_t vid;
    uint16_t pid;
    uint8_t  bus;
    uint8_t  port;
    char     name[64];
} vas6154_dev_info_t;

/* Lifecycle */
int  vas6154_usb_init(void);
void vas6154_usb_exit(void);
int  vas6154_usb_open(void);
void vas6154_usb_close(void);

/* Low-level I/O */
int  vas6154_usb_send_cmd(uint8_t cmd, uint16_t channel,
                           const uint8_t* payload, uint16_t payload_len);
int  vas6154_usb_recv_rsp(uint8_t expected_cmd,
                           uint8_t* payload_out, uint16_t payload_max,
                           uint16_t* payload_len_out);

/* High-level commands */
int  vas6154_get_info(vas6154_info_payload_t* info);
int  vas6154_reset(void);
int  vas6154_set_led(uint8_t color);
int  vas6154_open_channel(uint8_t channel, uint32_t baudrate);
int  vas6154_close_channel(uint8_t channel);
int  vas6154_send_can_frame(uint8_t channel, const vas6154_can_frame_t* frame);
int  vas6154_send_isotp(uint8_t channel, const vas6154_istp_hdr_t* hdr,
                         const uint8_t* data, uint16_t data_len);
int  vas6154_recv_isotp(uint8_t channel, uint8_t* buf, uint16_t buf_max,
                         uint16_t* received_len, uint32_t timeout_ms);
int  vas6154_kline_init(uint8_t addr, uint8_t init_type);
int  vas6154_keepalive(void);
int  vas6154_enumerate_devices(vas6154_dev_info_t* out, int max_devs);

/* Callbacks */
void vas6154_register_event_cb(vas6154_event_cb_t cb, void* userdata);

#ifdef __cplusplus
}
#endif

#endif /* VAS6154_USB_H */
