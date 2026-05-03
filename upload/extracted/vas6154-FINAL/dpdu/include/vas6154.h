#ifndef VAS6154_H
#define VAS6154_H
#include <stdint.h>
#include <stdbool.h>

/* USB IDs */
#define VAS6154_VID           0x19B2
#define VAS6154_PID_V1        0x0003
#define VAS6154_PID_V2        0x0008
#define VAS6154_PID_V3        0x000C
#define VAS6154_PID_DFU       0x0009

/* Endpoints */
#define VAS6154_EP_OUT        0x01
#define VAS6154_EP_IN         0x81
#define VAS6154_EP_INT        0x82

/* Commands */
#define CMD_GET_INFO          0x01
#define CMD_RESET             0x03
#define CMD_SET_LED           0x04
#define CMD_OPEN_CH           0x20
#define CMD_CLOSE_CH          0x21
#define CMD_SEND_ISTP         0x50
#define CMD_RECV              0x31
#define CMD_FW_START          0x10
#define CMD_FW_DATA           0x11
#define CMD_FW_END            0x12
#define CMD_KEEPALIVE         0xF0

/* Baudrates */
#define BAUD_125K             125000
#define BAUD_250K             250000
#define BAUD_500K             500000
#define BAUD_1M               1000000

/* LED */
#define LED_OFF   0x00
#define LED_GREEN 0x01
#define LED_RED   0x02
#define LED_BLUE  0x03

/* Packet structures */
typedef struct __attribute__((packed)) {
    uint8_t  magic[2];   /* DE AD */
    uint8_t  cmd;
    uint8_t  seq;
    uint16_t channel;
    uint16_t length;
} vas6154_cmd_t;

typedef struct __attribute__((packed)) {
    uint8_t  magic[2];   /* DE BE */
    uint8_t  cmd;
    uint8_t  seq;
    uint8_t  status;
    uint8_t  pad;
    uint16_t length;
} vas6154_rsp_t;

typedef struct __attribute__((packed)) {
    uint8_t  magic[2];   /* DE CA */
    uint8_t  event;
    uint8_t  channel;
    uint32_t ts_us;
    uint16_t length;
} vas6154_evt_t;

typedef struct __attribute__((packed)) {
    uint16_t vid, pid;
    uint8_t  hw_major, hw_minor;
    uint8_t  fw_major, fw_minor, fw_patch;
    uint8_t  num_ch;
    uint8_t  can_fd;
    uint8_t  doip;
    char     serial[16];
    char     fw_date[12];
} vas6154_info_t;

typedef struct __attribute__((packed)) {
    uint32_t tx_id;
    uint32_t rx_id;
    uint8_t  addr_mode;
    uint8_t  ext_addr;
    uint8_t  pad_en;
    uint8_t  pad_byte;
    uint16_t data_len;
} vas6154_istp_t;

typedef struct __attribute__((packed)) {
    uint32_t can_id;
    uint8_t  dlc;
    uint8_t  flags;
    uint8_t  pad[2];
    uint8_t  data[64];
} vas6154_can_t;

#ifdef __cplusplus
extern "C" {
#endif

typedef void (*vas6154_event_cb)(uint8_t evt, uint8_t ch, uint32_t ts,
                                  const uint8_t *data, uint16_t len, void *ud);

/* USB layer */
int   vas6154_usb_init(void);
void  vas6154_usb_exit(void);
int   vas6154_usb_open(void);
void  vas6154_usb_close(void);
int   vas6154_send(uint8_t cmd, uint16_t ch, const uint8_t *payload, uint16_t plen);
int   vas6154_recv(uint8_t expect_cmd, uint8_t *out, uint16_t maxlen, uint16_t *outlen);
void  vas6154_register_cb(vas6154_event_cb cb, void *ud);

/* High-level */
int   vas6154_get_info(vas6154_info_t *info);
int   vas6154_reset(void);
int   vas6154_set_led(uint8_t color);
int   vas6154_open_channel(uint8_t ch, uint32_t baud);
int   vas6154_close_channel(uint8_t ch);
int   vas6154_send_istp(uint8_t ch, const vas6154_istp_t *h, const uint8_t *data, uint16_t len);
int   vas6154_recv_istp(uint8_t ch, uint8_t *buf, uint16_t maxlen, uint16_t *recvlen, uint32_t timeout_ms);
int   vas6154_keepalive(void);

typedef struct { uint16_t vid,pid; uint8_t bus,addr; char name[64]; } vas6154_devinfo_t;
int   vas6154_enumerate(vas6154_devinfo_t *out, int max);

#ifdef __cplusplus
}
#endif
#endif
