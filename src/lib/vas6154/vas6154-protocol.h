#ifndef VAS6154_H
#define VAS6154_H

/*
 * VAS 6154 - USB VCI (Vehicle Communication Interface)
 * Linux Driver Definitions - DERHAN AutoMatrix Pro
 *
 * VAS 6154 = Softing-based VW/Audi diagnostic interface
 * Supports: CAN, CAN-FD, K-Line, DoIP (Ethernet)
 * Protocol: USB 2.0 High-Speed (480 Mbps)
 */

#include <stdint.h>
#include "iso22900_types.h"

#ifdef __cplusplus
extern "C" {
#endif

/* ============================================================
 * USB Device Identification
 * ============================================================ */

/* VAS 6154 USB IDs */
#define VAS6154_USB_VID             0x19B2      /* Softing AG */
#define VAS6154_USB_PID_OPERATIONAL 0x0008      /* Normal operation */
#define VAS6154_USB_PID_DFU         0x0009      /* Firmware update (DFU) mode */
#define VAS6154_USB_PID_BOOT        0x000A      /* Bootloader mode */

/* Alternative PIDs (hardware revisions) */
#define VAS6154_USB_PID_V1          0x0003
#define VAS6154_USB_PID_V2          0x0008      /* Most common */
#define VAS6154_USB_PID_V3          0x000C      /* CAN-FD capable */

/* USB Configuration */
#define VAS6154_USB_CONFIG          1
#define VAS6154_USB_INTERFACE       0
#define VAS6154_USB_ALT_SETTING     0

/* USB Endpoints */
#define VAS6154_EP_BULK_OUT         0x01        /* Host -> Device (commands) */
#define VAS6154_EP_BULK_IN          0x81        /* Device -> Host (responses) */
#define VAS6154_EP_INT_IN           0x82        /* Device -> Host (events/status) */

/* USB Transfer parameters */
#define VAS6154_BULK_OUT_SIZE       512
#define VAS6154_BULK_IN_SIZE        512
#define VAS6154_INT_IN_SIZE         64
#define VAS6154_USB_TIMEOUT_MS      5000
#define VAS6154_FW_TIMEOUT_MS       30000

/* ============================================================
 * Device Hardware Capabilities
 * ============================================================ */

#define VAS6154_MAX_CAN_CHANNELS    2           /* CAN channel 0, 1 */
#define VAS6154_MAX_KLINE_CHANNELS  1           /* K-Line channel */
#define VAS6154_SUPPORTS_CAN_FD     1           /* CAN-FD support (V3+) */
#define VAS6154_SUPPORTS_DOIP       1           /* DoIP via USB-Ethernet adapter */
#define VAS6154_MAX_MSG_SIZE        4096

/* CAN Baudrates supported */
#define VAS6154_CAN_BAUD_100K       100000
#define VAS6154_CAN_BAUD_125K       125000
#define VAS6154_CAN_BAUD_250K       250000
#define VAS6154_CAN_BAUD_500K       500000
#define VAS6154_CAN_BAUD_1M         1000000

/* CAN-FD data rates */
#define VAS6154_CANFD_DBAUD_2M      2000000
#define VAS6154_CANFD_DBAUD_4M      4000000
#define VAS6154_CANFD_DBAUD_5M      5000000
#define VAS6154_CANFD_DBAUD_8M      8000000

/* ============================================================
 * USB Protocol Command Set (Softing VCI Protocol)
 * Reverse-engineered from USB captures + Softing SDK headers
 * ============================================================ */

/* Command IDs */
typedef enum {
    VAS6154_CMD_GET_INFO            = 0x01,
    VAS6154_CMD_GET_STATUS          = 0x02,
    VAS6154_CMD_RESET               = 0x03,
    VAS6154_CMD_SET_LED             = 0x04,
    VAS6154_CMD_FW_UPDATE_START     = 0x10,
    VAS6154_CMD_FW_UPDATE_DATA      = 0x11,
    VAS6154_CMD_FW_UPDATE_END       = 0x12,
    VAS6154_CMD_OPEN_CHANNEL        = 0x20,
    VAS6154_CMD_CLOSE_CHANNEL       = 0x21,
    VAS6154_CMD_START_COMM          = 0x22,
    VAS6154_CMD_STOP_COMM           = 0x23,
    VAS6154_CMD_SET_BAUDRATE        = 0x24,
    VAS6154_CMD_SET_FILTER          = 0x25,
    VAS6154_CMD_SEND_MSG            = 0x30,
    VAS6154_CMD_RECV_MSG            = 0x31,
    VAS6154_CMD_SET_COMPARAM        = 0x40,
    VAS6154_CMD_GET_COMPARAM        = 0x41,
    VAS6154_CMD_SEND_ISTP_MSG       = 0x50,     /* ISO-TP message */
    VAS6154_CMD_SEND_RAW_CAN        = 0x51,     /* Raw CAN frame */
    VAS6154_CMD_KLINE_INIT          = 0x60,     /* K-Line initialization */
    VAS6154_CMD_KLINE_SEND          = 0x61,
    VAS6154_CMD_DOIP_CONNECT        = 0x70,     /* DoIP */
    VAS6154_CMD_DOIP_SEND           = 0x71,
    VAS6154_CMD_KEEPALIVE           = 0xF0,
    VAS6154_CMD_ACK                 = 0xFF,
} VAS6154_CMD;

/* Response status codes */
typedef enum {
    VAS6154_RSP_OK                  = 0x00,
    VAS6154_RSP_ERR_GENERIC         = 0x01,
    VAS6154_RSP_ERR_INVALID_CMD     = 0x02,
    VAS6154_RSP_ERR_INVALID_PARAM   = 0x03,
    VAS6154_RSP_ERR_BUSY            = 0x04,
    VAS6154_RSP_ERR_TIMEOUT         = 0x05,
    VAS6154_RSP_ERR_NO_DATA         = 0x06,
    VAS6154_RSP_ERR_CAN_BUS_OFF     = 0x10,
    VAS6154_RSP_ERR_CAN_ERR_PASSIVE = 0x11,
    VAS6154_RSP_ERR_KLINE_NO_WAKEUP = 0x20,
} VAS6154_RSP_STATUS;

/* ============================================================
 * USB Packet Structures (Little-endian)
 * ============================================================ */

/* Command packet header */
typedef struct __attribute__((packed)) {
    uint8_t  magic[2];      /* 0xDE, 0xAD */
    uint8_t  cmd;           /* VAS6154_CMD */
    uint8_t  seq;           /* Sequence number (incremented per command) */
    uint16_t channel;       /* CAN channel (0 or 1) / bus index */
    uint16_t length;        /* Payload length in bytes */
    /* Payload follows */
} vas6154_cmd_hdr_t;

/* Response packet header */
typedef struct __attribute__((packed)) {
    uint8_t  magic[2];      /* 0xDE, 0xBE */
    uint8_t  cmd;           /* Echo of command */
    uint8_t  seq;           /* Echo of sequence */
    uint8_t  status;        /* VAS6154_RSP_STATUS */
    uint8_t  reserved;
    uint16_t length;        /* Payload length */
    /* Payload follows */
} vas6154_rsp_hdr_t;

/* Event packet (from interrupt endpoint) */
typedef struct __attribute__((packed)) {
    uint8_t  magic[2];      /* 0xDE, 0xCA */
    uint8_t  event_type;
    uint8_t  channel;
    uint32_t timestamp_us;  /* Microsecond timestamp */
    uint16_t length;
    /* Data follows */
} vas6154_evt_hdr_t;

/* Device info response payload */
typedef struct __attribute__((packed)) {
    uint16_t vendor_id;
    uint16_t product_id;
    uint8_t  hw_version_major;
    uint8_t  hw_version_minor;
    uint8_t  fw_version_major;
    uint8_t  fw_version_minor;
    uint8_t  fw_version_patch;
    uint8_t  num_can_channels;
    uint8_t  can_fd_capable;
    uint8_t  doip_capable;
    char     serial[16];
    char     fw_date[12];
} vas6154_info_payload_t;

/* CAN frame structure */
typedef struct __attribute__((packed)) {
    uint32_t can_id;        /* CAN ID (bit 31: extended frame) */
    uint8_t  dlc;           /* Data Length Code (0-8, or 0-15 for FD) */
    uint8_t  flags;         /* Bit 0: FD frame, Bit 1: BRS, Bit 2: ESI */
    uint8_t  reserved[2];
    uint8_t  data[64];      /* Max 64 bytes (CAN-FD) */
} vas6154_can_frame_t;

/* ISO-TP message header */
typedef struct __attribute__((packed)) {
    uint32_t tx_id;
    uint32_t rx_id;
    uint8_t  addr_mode;     /* 0=normal, 1=extended, 2=mixed */
    uint8_t  ext_addr;      /* Extended address byte */
    uint8_t  padding_en;
    uint8_t  padding_byte;
    uint16_t data_length;
    /* Data follows */
} vas6154_istp_hdr_t;

/* K-Line init (ISO 14230 / KWP2000) */
typedef struct __attribute__((packed)) {
    uint8_t  init_type;     /* 0=5-baud, 1=fast init */
    uint8_t  baud;          /* 10.4kbaud = 0, custom = byte value */
    uint8_t  addr;          /* ECU address */
    uint8_t  flags;
} vas6154_kline_init_t;

/* ============================================================
 * D-PDU API Module/Resource IDs for VAS 6154
 * ============================================================ */

#define VAS6154_MODULE_ID           0x00000001
#define VAS6154_RSC_ID_CAN_CH0      0x00000001
#define VAS6154_RSC_ID_CAN_CH1      0x00000002
#define VAS6154_RSC_ID_KLINE        0x00000003
#define VAS6154_RSC_ID_DOIP         0x00000004

/* Bus interface types (BusInterface field in module data) */
#define VAS6154_BUS_CAN             0x0001
#define VAS6154_BUS_KLINE           0x0002
#define VAS6154_BUS_DOIP            0x0004

/* LED control */
#define VAS6154_LED_OFF             0x00
#define VAS6154_LED_GREEN           0x01
#define VAS6154_LED_RED             0x02
#define VAS6154_LED_BLUE            0x03
#define VAS6154_LED_BLINK_GREEN     0x11

/* ============================================================
 * Internal driver state
 * ============================================================ */

typedef enum {
    VAS6154_STATE_DISCONNECTED  = 0,
    VAS6154_STATE_CONNECTED     = 1,
    VAS6154_STATE_READY         = 2,
    VAS6154_STATE_COMM_ACTIVE   = 3,
    VAS6154_STATE_FW_UPDATE     = 4,
    VAS6154_STATE_ERROR         = 5,
} vas6154_state_t;

#ifdef __cplusplus
}
#endif

#endif /* VAS6154_H */
