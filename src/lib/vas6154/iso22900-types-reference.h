#ifndef ISO22900_TYPES_H
#define ISO22900_TYPES_H

/*
 * ISO 22900-2 D-PDU API Types
 * Modular Vehicle Communication Interface (MVCI) Protocol
 * VAS 6154 Linux Driver - DERHAN AutoMatrix Pro
 */

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ============================================================
 * Basic Types (ISO 22900-2 §7.2)
 * ============================================================ */

typedef uint8_t   PDU_UINT8;
typedef uint16_t  PDU_UINT16;
typedef uint32_t  PDU_UINT32;
typedef int8_t    PDU_INT8;
typedef int16_t   PDU_INT16;
typedef int32_t   PDU_INT32;
typedef char      PDU_CHAR;
typedef void*     PDU_HANDLE;
typedef PDU_UINT32 PDU_UNUM32;
typedef PDU_INT32  PDU_SNUM32;

#define PDU_HANDLE_UNDEF  ((PDU_HANDLE)0xFFFFFFFF)
#define PDU_ID_UNDEF      0xFFFFFFFFUL
#define PDU_FLAG_UNDEF    0xFFFFFFFFUL

/* ============================================================
 * Return Codes (ISO 22900-2 §7.3)
 * ============================================================ */

typedef enum {
    PDU_STATUS_NOERROR                  = 0x00000000,
    PDU_ERR_FCT_FAILED                  = 0x00000001,
    PDU_ERR_RESERVED_1                  = 0x00000002,
    PDU_ERR_COMM_PC_TO_VCI_FAILED       = 0x00000010,
    PDU_ERR_PDUAPI_NOT_CONSTRUCTED      = 0x00000020,
    PDU_ERR_INVALID_PARAMETERS          = 0x00000030,
    PDU_ERR_INVALID_HANDLE              = 0x00000031,
    PDU_ERR_VALUE_NOT_SUPPORTED         = 0x00000032,
    PDU_ERR_ID_NOT_SUPPORTED            = 0x00000033,
    PDU_ERR_COMPARAM_NOT_SUPPORTED      = 0x00000034,
    PDU_ERR_COMPARAM_LOCKED             = 0x00000035,
    PDU_ERR_RSC_LOCKED                  = 0x00000036,
    PDU_ERR_RSC_LOCKED_BY_OTHER_CMOD    = 0x00000037,
    PDU_ERR_RSC_NOT_LOCKED              = 0x00000038,
    PDU_ERR_MODULE_NOT_CONNECTED        = 0x00000040,
    PDU_ERR_API_SW_OUT_OF_DATE          = 0x00000041,
    PDU_ERR_MODULE_FW_OUT_OF_DATE       = 0x00000042,
    PDU_ERR_PIN_NOT_CONNECTED           = 0x00000050,
    PDU_ERR_IP_PROTOCOL_NOT_SUPPORTED   = 0x00000060,
    PDU_ERR_CABLE_UNKNOWN               = 0x00000070,
    PDU_ERR_NO_CABLE_DETECTED           = 0x00000071,
    PDU_ERR_COP_INVALID                 = 0x00000080,
    PDU_ERR_COP_NO_REQUEST_TO_HANDLE    = 0x00000081,
    PDU_ERR_MCH_FULL                    = 0x00000090,
    PDU_ERR_MCH_ALREADY_EXISTS          = 0x00000091,
    PDU_ERR_MCH_NOT_CONNECTED           = 0x00000092,
    PDU_ERR_EXCEEDED_LIMIT              = 0x000000A0,
    PDU_ERR_NOT_IMPLEMENTED             = 0x000000FF,
} PDU_STATUS;

/* ============================================================
 * Module Status (ISO 22900-2 §7.4.1)
 * ============================================================ */

typedef enum {
    PDU_MODST_READY             = 0x0000,
    PDU_MODST_NOT_READY         = 0x0001,
    PDU_MODST_NOT_AVAIL         = 0x0002,
    PDU_MODST_AVAIL             = 0x0003,
} PDU_MODULE_STATUS;

/* ============================================================
 * ComLogicalLink Status (ISO 22900-2 §7.4.2)
 * ============================================================ */

typedef enum {
    PDU_CLLST_OFFLINE           = 0x0000,
    PDU_CLLST_ONLINE            = 0x0001,
    PDU_CLLST_COMM_STARTED      = 0x0002,
} PDU_CLL_STATUS;

/* ============================================================
 * ComPrimitive Types (ISO 22900-2 §7.5)
 * ============================================================ */

typedef enum {
    PDU_COPT_STARTCOMM          = 0x8001,
    PDU_COPT_STOPCOMM           = 0x8002,
    PDU_COPT_UPDATEPARAM        = 0x8003,
    PDU_COPT_SENDRECV           = 0x0001,
    PDU_COPT_DELAY              = 0x0002,
    PDU_COPT_RESTORE_PARAM      = 0x0003,
} PDU_COPTYPE;

/* ============================================================
 * Event Codes (ISO 22900-2 §7.6)
 * ============================================================ */

typedef enum {
    PDU_EVT_DATA_AVAILABLE      = 0x0100,
    PDU_EVT_RESULT_AVAILABLE    = 0x0101,
    PDU_EVT_COP_ACTIVE          = 0x0200,
    PDU_EVT_COP_DONE            = 0x0201,
    PDU_EVT_COP_CANCELLED       = 0x0202,
    PDU_EVT_COP_WAIT            = 0x0203,
    PDU_EVT_PDU_CANCELLED       = 0x0204,
    PDU_EVT_RESET_INDICATION    = 0x0300,
    PDU_EVT_ERROR               = 0xFFFF,
} PDU_EVT_CODE;

/* ============================================================
 * Data Structures (ISO 22900-2 §7.7)
 * ============================================================ */

typedef struct {
    PDU_UINT32 NumEntries;
    PDU_UINT8* pData;
} PDU_DATA_ITEM;

typedef struct {
    PDU_UINT32 TxFlag;
    PDU_UINT32 NumSendCycles;
    PDU_UINT32 NumReceiveCycles;
    PDU_UINT32 TimeValue;
    PDU_UINT32 TxBufferSize;
    PDU_UINT32 NumPossibleExpectedResponses;
    /* Response items follow */
} PDU_COP_CTRL_DATA;

typedef struct {
    PDU_EVT_CODE     EventCode;
    PDU_STATUS       Status;
    PDU_HANDLE       hCop;
    PDU_HANDLE       hCoP;       /* ComPrimitive handle */
    PDU_UNUM32       Timestamp;
    PDU_UNUM32       ExtraInfo;
} PDU_EVENT_ITEM;

typedef struct {
    PDU_UINT32  VendorID;
    PDU_UINT32  ProductID;
    PDU_UINT32  BusInterface;
    PDU_CHAR*   pVendorName;
    PDU_CHAR*   pProductName;
    PDU_CHAR*   pFWVersion;
    PDU_CHAR*   pHWVersion;
    PDU_CHAR*   pSerialNumber;
    PDU_CHAR*   pDoIPLogicalAddress;
} PDU_MODULE_DATA;

/* Resource ID structures */
typedef struct {
    PDU_UINT32  ResourceId;
    PDU_UINT32  ResourceStatus;
} PDU_RSC_STATUS_ITEM;

typedef struct {
    PDU_UINT32           NumEntries;
    PDU_RSC_STATUS_ITEM* pResourceStatusItems;
} PDU_RSC_STATUS_DATA;

/* ComParam structure */
typedef struct {
    PDU_UINT32  ParamId;
    PDU_UINT32  ParamValue;
} PDU_PARAM_ITEM;

/* Version info */
typedef struct {
    PDU_UINT32 MVCI_Part1StandardVersion;
    PDU_UINT32 MVCI_Part2StandardVersion;
    PDU_UINT32 HwSerialNumber;
    PDU_UINT32 FwVersion;
    PDU_UINT32 HwVersion;
    PDU_UINT32 VendorID;
    PDU_CHAR*  pVendorAdditionalInfo;
} PDU_VERSION_DATA;

/* ============================================================
 * ComParam IDs (ISO 22900-2 §B.3, VAS 6154 specific)
 * ============================================================ */

/* CAN ComParams */
#define PDU_CPID_BAUDRATE                   0x00000001
#define PDU_CPID_CYCLIC_REQUEST_DELAY       0x00000004
#define PDU_CPID_T1_SEND_TIMEOUT            0x00000005
#define PDU_CPID_T2_SEND_TIMEOUT            0x00000006
#define PDU_CPID_T3_SEND_TIMEOUT            0x00000007
#define PDU_CPID_T4_SEND_TIMEOUT            0x00000008
#define PDU_CPID_TESTER_PRESENT_MSG         0x00000009
#define PDU_CPID_TESTER_PRESENT_CYCLE_TIME  0x0000000A

/* ISO-TP (ISO 15765-2) ComParams */
#define PDU_CPID_CAN_ID_TX                  0x00001000
#define PDU_CPID_CAN_ID_RX                  0x00001001
#define PDU_CPID_STMIN_TX                   0x00001002
#define PDU_CPID_BLOCKSIZE_TX               0x00001003
#define PDU_CPID_STMIN_RX                   0x00001004
#define PDU_CPID_BLOCKSIZE_RX               0x00001005
#define PDU_CPID_FRAME_PADDING_ACTIVATION   0x00001006
#define PDU_CPID_FRAME_PADDING_VALUE        0x00001007
#define PDU_CPID_ADDRESSING_MODE            0x00001008
#define PDU_CPID_CAN_FD_ENABLED             0x00001009

/* DoIP ComParams */
#define PDU_CPID_DOIP_LOGICAL_ADDR_TX       0x00002000
#define PDU_CPID_DOIP_LOGICAL_ADDR_RX       0x00002001
#define PDU_CPID_DOIP_TARGET_ADDR           0x00002002
#define PDU_CPID_DOIP_TESTER_ADDR           0x00002003

/* Bus Interfaces (Resource IDs) */
#define PDU_RSC_ID_ISO_15765_2              0x00001000
#define PDU_RSC_ID_ISO_14230                0x00000100
#define PDU_RSC_ID_ISO_15031_5             0x00000200
#define PDU_RSC_ID_DOIP                     0x00002000
#define PDU_RSC_ID_CAN_RAW                  0x00000800

typedef void (*PDU_CALLBACK)(PDU_HANDLE hModule,
                              PDU_HANDLE hCoP,
                              PDU_EVENT_ITEM* pEventItem,
                              void* pUserData);

#ifdef __cplusplus
}
#endif

#endif /* ISO22900_TYPES_H */
