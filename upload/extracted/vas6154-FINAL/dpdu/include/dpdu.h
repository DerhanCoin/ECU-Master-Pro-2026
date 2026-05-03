#ifndef DPDU_H
#define DPDU_H
#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

#define PDUFUNC __attribute__((visibility("default")))

typedef uint8_t  PDU_UINT8;
typedef uint32_t PDU_UINT32;
typedef int32_t  PDU_INT32;
typedef char     PDU_CHAR;
typedef void*    PDU_HANDLE;
typedef uint32_t PDU_UNUM32;

#define PDU_HANDLE_UNDEF  ((PDU_HANDLE)(uintptr_t)0xFFFFFFFF)

typedef enum {
    PDU_STATUS_NOERROR=0, PDU_ERR_FAILED=1,
    PDU_ERR_COMM=0x10, PDU_ERR_NOT_INIT=0x20,
    PDU_ERR_PARAM=0x30, PDU_ERR_HANDLE=0x31,
    PDU_ERR_MODULE_NC=0x40, PDU_ERR_LIMIT=0xA0,
    PDU_ERR_NOTIMPL=0xFF,
} PDU_STATUS;

typedef enum {
    PDU_COPT_STARTCOMM=0x8001, PDU_COPT_STOPCOMM=0x8002,
    PDU_COPT_UPDATEPARAM=0x8003, PDU_COPT_SENDRECV=0x0001,
} PDU_COPTYPE;

typedef enum {
    PDU_EVT_DATA=0x0100, PDU_EVT_RESULT=0x0101,
    PDU_EVT_COP_DONE=0x0201, PDU_EVT_COP_CANCEL=0x0202,
    PDU_EVT_ERROR=0xFFFF,
} PDU_EVT_CODE;

typedef struct { PDU_UINT32 ParamId; PDU_UINT32 ParamValue; } PDU_PARAM;
typedef struct {
    PDU_EVT_CODE EventCode; PDU_STATUS Status;
    PDU_HANDLE hCop; PDU_UNUM32 Timestamp; PDU_UNUM32 Extra;
} PDU_EVENT;
typedef struct {
    PDU_UINT32 VendorID; PDU_UINT32 ProductID;
    PDU_CHAR *pVendorName; PDU_CHAR *pProductName;
    PDU_CHAR *pFWVersion; PDU_CHAR *pHWVersion;
    PDU_CHAR *pSerial;
} PDU_MODDATA;
typedef struct {
    PDU_UINT32 MVCI_Part1; PDU_UINT32 MVCI_Part2;
    PDU_UINT32 HwSerial; PDU_UINT32 FwVer; PDU_UINT32 HwVer;
    PDU_UINT32 VendorID; PDU_CHAR *pVendorInfo;
} PDU_VERSION;

#define PDU_CPID_BAUDRATE      0x00000001
#define PDU_CPID_CAN_ID_TX     0x00001000
#define PDU_CPID_CAN_ID_RX     0x00001001
#define PDU_CPID_STMIN_TX      0x00001002
#define PDU_CPID_BLOCKSIZE_TX  0x00001003
#define PDU_CPID_PAD_EN        0x00001006
#define PDU_CPID_PAD_VAL       0x00001007
#define PDU_CPID_ADDR_MODE     0x00001008

#define PDU_RSC_ISO15765       0x00001000
#define PDU_RSC_ISO14230       0x00000100
#define PDU_RSC_CAN_RAW        0x00000800
#define PDU_RSC_DOIP           0x00002000

#define VAS6154_RSC_CAN0       0x00000001
#define VAS6154_RSC_CAN1       0x00000002
#define VAS6154_RSC_KLINE      0x00000003
#define VAS6154_RSC_DOIP       0x00000004

#define VAS6154_IOCTL_LED      0x1000
#define VAS6154_IOCTL_RESET    0x1004

typedef void (*PDU_CALLBACK)(PDU_HANDLE hMod, PDU_HANDLE hCoL,
                              PDU_EVENT *pEvt, void *pUser);

PDUFUNC PDU_STATUS PDUConstruct(const PDU_CHAR *opts, void *tag);
PDUFUNC PDU_STATUS PDUDestruct(void);
PDUFUNC PDU_STATUS PDUModuleConnect(PDU_HANDLE *phMod, const PDU_CHAR *addr);
PDUFUNC PDU_STATUS PDUModuleDisconnect(PDU_HANDLE hMod);
PDUFUNC PDU_STATUS PDUGetModuleIds(PDU_UNUM32 *list, PDU_UNUM32 *n);
PDUFUNC PDU_STATUS PDUGetStatus(PDU_HANDLE hMod, PDU_HANDLE hCoL, PDU_UNUM32 *st);
PDUFUNC PDU_STATUS PDUGetVersion(PDU_HANDLE hMod, PDU_VERSION *ver);
PDUFUNC PDU_STATUS PDUGetModuleData(PDU_HANDLE hMod, PDU_MODDATA *data);
PDUFUNC PDU_STATUS PDUConnect(PDU_HANDLE hMod, PDU_UNUM32 bus, PDU_UNUM32 proto,
                               PDU_UNUM32 *rscs, PDU_UNUM32 nrsc, PDU_HANDLE *phCoL);
PDUFUNC PDU_STATUS PDUDisconnect(PDU_HANDLE hMod, PDU_HANDLE hCoL);
PDUFUNC PDU_STATUS PDUSetComParam(PDU_HANDLE hMod, PDU_HANDLE hCoL,
                                   PDU_UNUM32 id, const PDU_PARAM *p);
PDUFUNC PDU_STATUS PDUGetComParam(PDU_HANDLE hMod, PDU_HANDLE hCoL,
                                   PDU_UNUM32 id, PDU_PARAM *p);
PDUFUNC PDU_STATUS PDUStartComPrimitive(PDU_HANDLE hMod, PDU_HANDLE hCoL,
                                         PDU_COPTYPE type, PDU_UNUM32 dlen,
                                         const PDU_UINT8 *data, void *tag,
                                         PDU_HANDLE *phCop);
PDUFUNC PDU_STATUS PDUCancelComPrimitive(PDU_HANDLE hMod, PDU_HANDLE hCoL, PDU_HANDLE hCop);
PDUFUNC PDU_STATUS PDUGetEventItem(PDU_HANDLE hMod, PDU_HANDLE hCoL, PDU_EVENT **ppEvt);
PDUFUNC PDU_STATUS PDUFreeEventItem(PDU_HANDLE hMod, PDU_EVENT *pEvt);
PDUFUNC PDU_STATUS PDURegisterEventCallback(PDU_HANDLE hMod, PDU_HANDLE hCoL,
                                             PDU_CALLBACK cb, void *ud);
PDUFUNC PDU_STATUS PDUGetResult(PDU_HANDLE hMod, PDU_HANDLE hCoL, PDU_HANDLE hCop,
                                 PDU_UINT8 *buf, PDU_UNUM32 *len,
                                 PDU_UNUM32 *rxcnt, PDU_UNUM32 *ts);
PDUFUNC PDU_STATUS PDUIoCtl(PDU_HANDLE hMod, PDU_UNUM32 id, void *in, void *out);
PDUFUNC PDU_STATUS PDUGetTimestamp(PDU_HANDLE hMod, PDU_UNUM32 *ts);
PDUFUNC const PDU_CHAR *PDUGetErrorText(PDU_STATUS st);

#ifdef __cplusplus
}
#endif
#endif
