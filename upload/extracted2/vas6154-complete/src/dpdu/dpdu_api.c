/*
 * dpdu_api.c - ISO 22900-2 D-PDU API Implementation
 * VAS 6154 Linux Driver - DERHAN AutoMatrix Pro
 *
 * This is the full D-PDU API library that sits on top of
 * the USB layer. Applications link against libdpdu_vas6154.so
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <pthread.h>
#include <unistd.h>
#include <time.h>
#include <errno.h>

#include "../../include/dpdu_api.h"
#include "../../include/vas6154.h"
#include "../usb/vas6154_usb.h"

/* ============================================================
 * Internal state management
 * ============================================================ */

#define MAX_COMLINKS    8
#define MAX_COPRIMS     32

typedef enum {
    COP_STATE_IDLE      = 0,
    COP_STATE_RUNNING   = 1,
    COP_STATE_DONE      = 2,
    COP_STATE_CANCELLED = 3,
    COP_STATE_ERROR     = 4,
} cop_state_t;

typedef struct {
    bool            in_use;
    cop_state_t     state;
    PDU_COPTYPE     type;
    void*           tag;
    uint8_t*        rx_buf;
    uint32_t        rx_len;
    uint32_t        rx_count;
    uint32_t        timestamp;
    PDU_STATUS      last_error;
    pthread_mutex_t lock;
} cop_entry_t;

typedef struct {
    bool            in_use;
    PDU_CLL_STATUS  status;
    uint32_t        bus_type_id;
    uint32_t        protocol_id;
    uint8_t         channel;       /* VAS6154 channel index */
    /* ComParams */
    uint32_t        can_id_tx;
    uint32_t        can_id_rx;
    uint32_t        baudrate;
    uint8_t         stmin_tx;
    uint8_t         blocksize_tx;
    uint8_t         padding_en;
    uint8_t         padding_byte;
    uint8_t         addr_mode;
    /* Callback */
    PDU_CALLBACK    callback;
    void*           cb_userdata;
    /* ComPrimitives */
    cop_entry_t     cops[MAX_COPRIMS];
    pthread_mutex_t lock;
} col_entry_t;

typedef struct {
    bool            constructed;
    bool            connected;
    vas6154_state_t hw_state;
    col_entry_t     comlinks[MAX_COMLINKS];
    PDU_CALLBACK    module_callback;
    void*           module_cb_userdata;
    pthread_t       comm_thread;
    volatile bool   comm_running;
    pthread_mutex_t lock;
    vas6154_info_payload_t dev_info;
} dpdu_state_t;

static dpdu_state_t g_state = {0};

/* Handle encoding: upper 16 bits = type, lower 16 bits = index */
#define MAKE_COL_HANDLE(idx)    ((PDU_HANDLE)(uintptr_t)(0x00010000 | (idx)))
#define MAKE_COP_HANDLE(idx)    ((PDU_HANDLE)(uintptr_t)(0x00020000 | (idx)))
#define GET_HANDLE_IDX(h)       ((uintptr_t)(h) & 0xFFFF)
#define IS_COL_HANDLE(h)        (((uintptr_t)(h) & 0xFFFF0000) == 0x00010000)
#define IS_COP_HANDLE(h)        (((uintptr_t)(h) & 0xFFFF0000) == 0x00020000)

#define MODULE_HANDLE           ((PDU_HANDLE)0x00000001)

/* ============================================================
 * Timestamp utility
 * ============================================================ */

static uint32_t get_timestamp_us(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (uint32_t)(ts.tv_sec * 1000000ULL + ts.tv_nsec / 1000);
}

/* ============================================================
 * USB event callback -> D-PDU events
 * ============================================================ */

static void usb_event_handler(uint8_t  event_type,
                               uint8_t  channel,
                               uint32_t timestamp_us,
                               const uint8_t* data,
                               uint16_t data_len,
                               void*    userdata)
{
    (void)userdata;

    /* Find the ComLogicalLink for this channel */
    pthread_mutex_lock(&g_state.lock);
    for (int i = 0; i < MAX_COMLINKS; i++) {
        col_entry_t* col = &g_state.comlinks[i];
        if (!col->in_use || col->channel != channel) continue;

        PDU_EVENT_ITEM evt = {0};
        evt.Timestamp = timestamp_us;

        switch (event_type) {
        case 0x01:  /* Data received */
            evt.EventCode = PDU_EVT_DATA_AVAILABLE;
            evt.Status    = PDU_STATUS_NOERROR;
            /* Store data in active COP */
            for (int j = 0; j < MAX_COPRIMS; j++) {
                cop_entry_t* cop = &col->cops[j];
                if (cop->in_use && cop->state == COP_STATE_RUNNING) {
                    pthread_mutex_lock(&cop->lock);
                    if (cop->rx_buf) free(cop->rx_buf);
                    cop->rx_buf   = malloc(data_len);
                    if (cop->rx_buf) {
                        memcpy(cop->rx_buf, data, data_len);
                        cop->rx_len   = data_len;
                        cop->rx_count++;
                        cop->timestamp = timestamp_us;
                    }
                    cop->state = COP_STATE_DONE;
                    evt.hCop = MAKE_COP_HANDLE(j);
                    pthread_mutex_unlock(&cop->lock);

                    evt.EventCode = PDU_EVT_RESULT_AVAILABLE;
                    break;
                }
            }
            break;

        case 0x02:  /* CAN bus off */
            evt.EventCode = PDU_EVT_ERROR;
            evt.Status    = PDU_ERR_FCT_FAILED;
            break;

        case 0x03:  /* COP complete */
            evt.EventCode = PDU_EVT_COP_DONE;
            evt.Status    = PDU_STATUS_NOERROR;
            break;

        default:
            evt.EventCode = PDU_EVT_DATA_AVAILABLE;
            evt.Status    = PDU_STATUS_NOERROR;
        }

        if (col->callback) {
            col->callback(MODULE_HANDLE,
                          MAKE_COL_HANDLE(i),
                          &evt,
                          col->cb_userdata);
        } else if (g_state.module_callback) {
            g_state.module_callback(MODULE_HANDLE,
                                    MAKE_COL_HANDLE(i),
                                    &evt,
                                    g_state.module_cb_userdata);
        }
        break;
    }
    pthread_mutex_unlock(&g_state.lock);
}

/* ============================================================
 * ISO 22900-2 D-PDU API Implementation
 * ============================================================ */

PDU_STATUS PDUConstruct(const PDU_CHAR* pszOptionStr, void* pAPITag)
{
    (void)pszOptionStr;
    (void)pAPITag;

    if (g_state.constructed) return PDU_STATUS_NOERROR;

    memset(&g_state, 0, sizeof(g_state));
    pthread_mutex_init(&g_state.lock, NULL);

    for (int i = 0; i < MAX_COMLINKS; i++) {
        pthread_mutex_init(&g_state.comlinks[i].lock, NULL);
        for (int j = 0; j < MAX_COPRIMS; j++) {
            pthread_mutex_init(&g_state.comlinks[i].cops[j].lock, NULL);
        }
    }

    int r = vas6154_usb_init();
    if (r < 0) return PDU_ERR_COMM_PC_TO_VCI_FAILED;

    g_state.constructed = true;
    printf("[D-PDU API] Constructed (VAS 6154 Linux Driver v1.0.0)\n");
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUDestruct(void)
{
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;

    if (g_state.connected) {
        vas6154_usb_close();
        g_state.connected = false;
    }

    vas6154_usb_exit();

    for (int i = 0; i < MAX_COMLINKS; i++) {
        col_entry_t* col = &g_state.comlinks[i];
        for (int j = 0; j < MAX_COPRIMS; j++) {
            if (col->cops[j].rx_buf) free(col->cops[j].rx_buf);
            pthread_mutex_destroy(&col->cops[j].lock);
        }
        pthread_mutex_destroy(&col->lock);
    }
    pthread_mutex_destroy(&g_state.lock);

    g_state.constructed = false;
    printf("[D-PDU API] Destructed\n");
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUModuleConnect(PDU_HANDLE* phModule, const PDU_CHAR* pszModuleAddr)
{
    (void)pszModuleAddr;
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;
    if (!phModule) return PDU_ERR_INVALID_PARAMETERS;

    int r = vas6154_usb_open();
    if (r < 0) return PDU_ERR_COMM_PC_TO_VCI_FAILED;

    /* Register our USB event handler */
    vas6154_register_event_cb(usb_event_handler, NULL);

    /* Query device info */
    r = vas6154_get_info(&g_state.dev_info);
    if (r < 0) {
        fprintf(stderr, "[D-PDU API] Failed to get device info (non-fatal)\n");
    }

    /* Signal device ready: green LED */
    vas6154_set_led(VAS6154_LED_GREEN);

    g_state.connected = true;
    g_state.hw_state  = VAS6154_STATE_READY;
    *phModule = MODULE_HANDLE;

    printf("[D-PDU API] Module connected: VAS 6154\n");
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUModuleDisconnect(PDU_HANDLE hModule)
{
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;
    if (hModule != MODULE_HANDLE) return PDU_ERR_INVALID_HANDLE;
    if (!g_state.connected) return PDU_ERR_MODULE_NOT_CONNECTED;

    vas6154_set_led(VAS6154_LED_OFF);
    vas6154_usb_close();
    g_state.connected = false;
    g_state.hw_state  = VAS6154_STATE_DISCONNECTED;

    printf("[D-PDU API] Module disconnected\n");
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetModuleIds(PDU_UNUM32* pModuleIdList, PDU_UNUM32* pNumIds)
{
    if (!pNumIds) return PDU_ERR_INVALID_PARAMETERS;

    if (!g_state.constructed) {
        /* Can enumerate without being fully constructed */
        vas6154_usb_init();
    }

    vas6154_dev_info_t devs[4];
    int found = vas6154_enumerate_devices(devs, 4);
    if (found < 0) found = 0;

    if (pModuleIdList && *pNumIds >= (PDU_UNUM32)found) {
        for (int i = 0; i < found; i++) {
            pModuleIdList[i] = (PDU_UNUM32)i;
        }
    }
    *pNumIds = (PDU_UNUM32)found;
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetStatus(PDU_HANDLE hModule, PDU_HANDLE hCoL, PDU_UNUM32* pStatus)
{
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;
    if (hModule != MODULE_HANDLE) return PDU_ERR_INVALID_HANDLE;
    if (!pStatus) return PDU_ERR_INVALID_PARAMETERS;

    if (hCoL == PDU_HANDLE_UNDEF) {
        /* Module status */
        *pStatus = g_state.connected ? PDU_MODST_READY : PDU_MODST_NOT_AVAIL;
    } else {
        /* ComLogicalLink status */
        if (!IS_COL_HANDLE(hCoL)) return PDU_ERR_INVALID_HANDLE;
        int idx = (int)GET_HANDLE_IDX(hCoL);
        if (idx >= MAX_COMLINKS) return PDU_ERR_INVALID_HANDLE;
        *pStatus = g_state.comlinks[idx].status;
    }
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetVersion(PDU_HANDLE hModule, PDU_VERSION_DATA* pVersionData)
{
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;
    if (hModule != MODULE_HANDLE) return PDU_ERR_INVALID_HANDLE;
    if (!pVersionData) return PDU_ERR_INVALID_PARAMETERS;

    pVersionData->MVCI_Part1StandardVersion = 0x0200;   /* ISO 22900-1 v2.0 */
    pVersionData->MVCI_Part2StandardVersion = 0x0200;   /* ISO 22900-2 v2.0 */
    pVersionData->VendorID                  = VAS6154_USB_VID;
    pVersionData->FwVersion = ((uint32_t)g_state.dev_info.fw_version_major << 16) |
                               ((uint32_t)g_state.dev_info.fw_version_minor <<  8) |
                                (uint32_t)g_state.dev_info.fw_version_patch;
    pVersionData->HwVersion = ((uint32_t)g_state.dev_info.hw_version_major <<  8) |
                               (uint32_t)g_state.dev_info.hw_version_minor;
    pVersionData->pVendorAdditionalInfo = (PDU_CHAR*)"DERHAN AutoMatrix Pro - Linux";
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUConnect(PDU_HANDLE  hModule,
                       PDU_UNUM32  busTypeId,
                       PDU_UNUM32  protocolId,
                       PDU_UNUM32* pRscIdList,
                       PDU_UNUM32  numRscIds,
                       PDU_HANDLE* phCoL)
{
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;
    if (hModule != MODULE_HANDLE) return PDU_ERR_INVALID_HANDLE;
    if (!g_state.connected) return PDU_ERR_MODULE_NOT_CONNECTED;
    if (!phCoL) return PDU_ERR_INVALID_PARAMETERS;

    pthread_mutex_lock(&g_state.lock);

    /* Find free ComLogicalLink slot */
    int idx = -1;
    for (int i = 0; i < MAX_COMLINKS; i++) {
        if (!g_state.comlinks[i].in_use) { idx = i; break; }
    }
    if (idx < 0) {
        pthread_mutex_unlock(&g_state.lock);
        return PDU_ERR_EXCEEDED_LIMIT;
    }

    col_entry_t* col = &g_state.comlinks[idx];
    memset(col, 0, sizeof(*col));
    pthread_mutex_init(&col->lock, NULL);

    col->in_use      = true;
    col->bus_type_id = busTypeId;
    col->protocol_id = protocolId;
    col->status      = PDU_CLLST_OFFLINE;

    /* Determine CAN channel from resource ID */
    if (numRscIds > 0 && pRscIdList) {
        switch (pRscIdList[0]) {
        case VAS6154_RSC_ID_CAN_CH0: col->channel = 0; break;
        case VAS6154_RSC_ID_CAN_CH1: col->channel = 1; break;
        case VAS6154_RSC_ID_KLINE:   col->channel = 2; break;
        case VAS6154_RSC_ID_DOIP:    col->channel = 3; break;
        default:                     col->channel = 0; break;
        }
    }

    /* Set defaults */
    col->baudrate     = VAS6154_CAN_BAUD_500K;  /* Default 500kbaud */
    col->stmin_tx     = 0;
    col->blocksize_tx = 0;
    col->padding_en   = 1;
    col->padding_byte = 0xCC;
    col->addr_mode    = 0;  /* Normal addressing */

    *phCoL = MAKE_COL_HANDLE(idx);
    pthread_mutex_unlock(&g_state.lock);

    printf("[D-PDU API] Connected: CoL[%d] ch=%d bus=0x%04X proto=0x%04X\n",
           idx, col->channel, busTypeId, protocolId);
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUDisconnect(PDU_HANDLE hModule, PDU_HANDLE hCoL)
{
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;
    if (hModule != MODULE_HANDLE) return PDU_ERR_INVALID_HANDLE;
    if (!IS_COL_HANDLE(hCoL)) return PDU_ERR_INVALID_HANDLE;

    int idx = (int)GET_HANDLE_IDX(hCoL);
    if (idx >= MAX_COMLINKS) return PDU_ERR_INVALID_HANDLE;

    col_entry_t* col = &g_state.comlinks[idx];
    pthread_mutex_lock(&col->lock);

    if (col->status == PDU_CLLST_COMM_STARTED) {
        vas6154_close_channel(col->channel);
    }

    /* Free any pending COPs */
    for (int j = 0; j < MAX_COPRIMS; j++) {
        if (col->cops[j].rx_buf) free(col->cops[j].rx_buf);
        col->cops[j].in_use = false;
    }

    col->in_use = false;
    col->status = PDU_CLLST_OFFLINE;
    pthread_mutex_unlock(&col->lock);

    printf("[D-PDU API] Disconnected: CoL[%d]\n", idx);
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUSetComParam(PDU_HANDLE hModule, PDU_HANDLE hCoL,
                           PDU_UNUM32 ParamId, const PDU_PARAM_ITEM* pParamItem)
{
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;
    if (hModule != MODULE_HANDLE) return PDU_ERR_INVALID_HANDLE;
    if (!IS_COL_HANDLE(hCoL)) return PDU_ERR_INVALID_HANDLE;
    if (!pParamItem) return PDU_ERR_INVALID_PARAMETERS;

    int idx = (int)GET_HANDLE_IDX(hCoL);
    if (idx >= MAX_COMLINKS) return PDU_ERR_INVALID_HANDLE;

    col_entry_t* col = &g_state.comlinks[idx];
    pthread_mutex_lock(&col->lock);

    switch (ParamId) {
    case PDU_CPID_BAUDRATE:
        col->baudrate = pParamItem->ParamValue;
        break;
    case PDU_CPID_CAN_ID_TX:
        col->can_id_tx = pParamItem->ParamValue;
        break;
    case PDU_CPID_CAN_ID_RX:
        col->can_id_rx = pParamItem->ParamValue;
        break;
    case PDU_CPID_STMIN_TX:
        col->stmin_tx = (uint8_t)pParamItem->ParamValue;
        break;
    case PDU_CPID_BLOCKSIZE_TX:
        col->blocksize_tx = (uint8_t)pParamItem->ParamValue;
        break;
    case PDU_CPID_FRAME_PADDING_ACTIVATION:
        col->padding_en = (uint8_t)pParamItem->ParamValue;
        break;
    case PDU_CPID_FRAME_PADDING_VALUE:
        col->padding_byte = (uint8_t)pParamItem->ParamValue;
        break;
    case PDU_CPID_ADDRESSING_MODE:
        col->addr_mode = (uint8_t)pParamItem->ParamValue;
        break;
    default:
        pthread_mutex_unlock(&col->lock);
        return PDU_ERR_COMPARAM_NOT_SUPPORTED;
    }

    pthread_mutex_unlock(&col->lock);
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetComParam(PDU_HANDLE hModule, PDU_HANDLE hCoL,
                           PDU_UNUM32 ParamId, PDU_PARAM_ITEM* pParamItem)
{
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;
    if (hModule != MODULE_HANDLE) return PDU_ERR_INVALID_HANDLE;
    if (!IS_COL_HANDLE(hCoL)) return PDU_ERR_INVALID_HANDLE;
    if (!pParamItem) return PDU_ERR_INVALID_PARAMETERS;

    int idx = (int)GET_HANDLE_IDX(hCoL);
    if (idx >= MAX_COMLINKS) return PDU_ERR_INVALID_HANDLE;

    col_entry_t* col = &g_state.comlinks[idx];
    pParamItem->ParamId = ParamId;

    switch (ParamId) {
    case PDU_CPID_BAUDRATE:           pParamItem->ParamValue = col->baudrate;    break;
    case PDU_CPID_CAN_ID_TX:          pParamItem->ParamValue = col->can_id_tx;   break;
    case PDU_CPID_CAN_ID_RX:          pParamItem->ParamValue = col->can_id_rx;   break;
    case PDU_CPID_STMIN_TX:           pParamItem->ParamValue = col->stmin_tx;    break;
    case PDU_CPID_BLOCKSIZE_TX:       pParamItem->ParamValue = col->blocksize_tx; break;
    case PDU_CPID_FRAME_PADDING_ACTIVATION: pParamItem->ParamValue = col->padding_en; break;
    case PDU_CPID_FRAME_PADDING_VALUE: pParamItem->ParamValue = col->padding_byte; break;
    case PDU_CPID_ADDRESSING_MODE:    pParamItem->ParamValue = col->addr_mode;   break;
    default: return PDU_ERR_COMPARAM_NOT_SUPPORTED;
    }
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUStartComPrimitive(PDU_HANDLE       hModule,
                                 PDU_HANDLE       hCoL,
                                 PDU_COPTYPE      CopType,
                                 PDU_UNUM32       CopDataLen,
                                 const PDU_UINT8* pCopData,
                                 void*            pCopTag,
                                 PDU_HANDLE*      phCop)
{
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;
    if (hModule != MODULE_HANDLE) return PDU_ERR_INVALID_HANDLE;
    if (!IS_COL_HANDLE(hCoL)) return PDU_ERR_INVALID_HANDLE;
    if (!phCop) return PDU_ERR_INVALID_PARAMETERS;

    int col_idx = (int)GET_HANDLE_IDX(hCoL);
    if (col_idx >= MAX_COMLINKS) return PDU_ERR_INVALID_HANDLE;

    col_entry_t* col = &g_state.comlinks[col_idx];

    /* Find free COP slot */
    int cop_idx = -1;
    pthread_mutex_lock(&col->lock);
    for (int j = 0; j < MAX_COPRIMS; j++) {
        if (!col->cops[j].in_use) { cop_idx = j; break; }
    }

    if (cop_idx < 0) {
        pthread_mutex_unlock(&col->lock);
        return PDU_ERR_MCH_FULL;
    }

    cop_entry_t* cop = &col->cops[cop_idx];
    cop->in_use     = true;
    cop->state      = COP_STATE_RUNNING;
    cop->type       = CopType;
    cop->tag        = pCopTag;
    cop->rx_buf     = NULL;
    cop->rx_len     = 0;
    cop->rx_count   = 0;
    cop->last_error = PDU_STATUS_NOERROR;

    pthread_mutex_unlock(&col->lock);

    int r = 0;
    switch (CopType) {
    case PDU_COPT_STARTCOMM:
        /* Open CAN channel */
        r = vas6154_open_channel(col->channel, col->baudrate);
        if (r < 0) {
            cop->state = COP_STATE_ERROR;
            cop->last_error = PDU_ERR_COMM_PC_TO_VCI_FAILED;
            *phCop = MAKE_COP_HANDLE(cop_idx);
            return PDU_ERR_COMM_PC_TO_VCI_FAILED;
        }
        col->status = PDU_CLLST_COMM_STARTED;
        cop->state  = COP_STATE_DONE;
        vas6154_set_led(VAS6154_LED_BLUE);
        break;

    case PDU_COPT_STOPCOMM:
        vas6154_close_channel(col->channel);
        col->status = PDU_CLLST_ONLINE;
        cop->state  = COP_STATE_DONE;
        vas6154_set_led(VAS6154_LED_GREEN);
        break;

    case PDU_COPT_SENDRECV:
        if (!pCopData || CopDataLen == 0) {
            cop->state = COP_STATE_ERROR;
            *phCop = MAKE_COP_HANDLE(cop_idx);
            return PDU_ERR_INVALID_PARAMETERS;
        }

        /* Build ISO-TP header and send */
        {
            vas6154_istp_hdr_t hdr = {
                .tx_id       = col->can_id_tx,
                .rx_id       = col->can_id_rx,
                .addr_mode   = col->addr_mode,
                .ext_addr    = 0,
                .padding_en  = col->padding_en,
                .padding_byte = col->padding_byte,
                .data_length = (uint16_t)CopDataLen,
            };

            r = vas6154_send_isotp(col->channel, &hdr, pCopData, (uint16_t)CopDataLen);
            if (r < 0) {
                cop->state = COP_STATE_ERROR;
                cop->last_error = PDU_ERR_COMM_PC_TO_VCI_FAILED;
                *phCop = MAKE_COP_HANDLE(cop_idx);
                return PDU_ERR_COMM_PC_TO_VCI_FAILED;
            }
            /* Response will arrive via interrupt callback */
            cop->state = COP_STATE_RUNNING;
        }
        break;

    case PDU_COPT_UPDATEPARAM:
        /* Already set via PDUSetComParam, just acknowledge */
        cop->state = COP_STATE_DONE;
        break;

    default:
        cop->state = COP_STATE_ERROR;
        *phCop = MAKE_COP_HANDLE(cop_idx);
        return PDU_ERR_NOT_IMPLEMENTED;
    }

    *phCop = MAKE_COP_HANDLE(cop_idx);
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUCancelComPrimitive(PDU_HANDLE hModule,
                                  PDU_HANDLE hCoL,
                                  PDU_HANDLE hCop)
{
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;
    if (hModule != MODULE_HANDLE) return PDU_ERR_INVALID_HANDLE;
    if (!IS_COL_HANDLE(hCoL) || !IS_COP_HANDLE(hCop)) return PDU_ERR_INVALID_HANDLE;

    int col_idx = (int)GET_HANDLE_IDX(hCoL);
    int cop_idx = (int)GET_HANDLE_IDX(hCop);
    if (col_idx >= MAX_COMLINKS || cop_idx >= MAX_COPRIMS) return PDU_ERR_INVALID_HANDLE;

    cop_entry_t* cop = &g_state.comlinks[col_idx].cops[cop_idx];
    pthread_mutex_lock(&cop->lock);
    cop->state = COP_STATE_CANCELLED;
    pthread_mutex_unlock(&cop->lock);
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetEventItem(PDU_HANDLE       hModule,
                            PDU_HANDLE       hCoL,
                            PDU_EVENT_ITEM** ppEventItem)
{
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;
    if (hModule != MODULE_HANDLE) return PDU_ERR_INVALID_HANDLE;
    if (!ppEventItem) return PDU_ERR_INVALID_PARAMETERS;

    /* Search for done COPs */
    for (int i = 0; i < MAX_COMLINKS; i++) {
        col_entry_t* col = &g_state.comlinks[i];
        if (!col->in_use) continue;
        if (hCoL != (PDU_HANDLE)PDU_HANDLE_UNDEF &&
            hCoL != MAKE_COL_HANDLE(i)) continue;

        for (int j = 0; j < MAX_COPRIMS; j++) {
            cop_entry_t* cop = &col->cops[j];
            if (!cop->in_use) continue;

            if (cop->state == COP_STATE_DONE ||
                cop->state == COP_STATE_ERROR ||
                cop->state == COP_STATE_CANCELLED) {

                PDU_EVENT_ITEM* evt = calloc(1, sizeof(PDU_EVENT_ITEM));
                if (!evt) return PDU_ERR_FCT_FAILED;

                evt->Timestamp = cop->timestamp;
                evt->hCop      = MAKE_COP_HANDLE(j);
                evt->hCoP      = MAKE_COP_HANDLE(j);

                switch (cop->state) {
                case COP_STATE_DONE:
                    evt->EventCode = PDU_EVT_COP_DONE;
                    evt->Status    = PDU_STATUS_NOERROR;
                    break;
                case COP_STATE_CANCELLED:
                    evt->EventCode = PDU_EVT_COP_CANCELLED;
                    evt->Status    = PDU_STATUS_NOERROR;
                    break;
                case COP_STATE_ERROR:
                    evt->EventCode = PDU_EVT_ERROR;
                    evt->Status    = cop->last_error;
                    break;
                default:
                    break;
                }

                cop->in_use = false;
                *ppEventItem = evt;
                return PDU_STATUS_NOERROR;
            }
        }
    }

    return PDU_ERR_COP_NO_REQUEST_TO_HANDLE;
}

PDU_STATUS PDUFreeEventItem(PDU_HANDLE hModule, PDU_EVENT_ITEM* pEventItem)
{
    (void)hModule;
    if (pEventItem) free(pEventItem);
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDURegisterEventCallback(PDU_HANDLE   hModule,
                                     PDU_HANDLE   hCoL,
                                     PDU_CALLBACK pfnCallback,
                                     void*        pUserData)
{
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;
    if (hModule != MODULE_HANDLE) return PDU_ERR_INVALID_HANDLE;

    if (hCoL == PDU_HANDLE_UNDEF) {
        g_state.module_callback        = pfnCallback;
        g_state.module_cb_userdata     = pUserData;
    } else {
        if (!IS_COL_HANDLE(hCoL)) return PDU_ERR_INVALID_HANDLE;
        int idx = (int)GET_HANDLE_IDX(hCoL);
        if (idx >= MAX_COMLINKS) return PDU_ERR_INVALID_HANDLE;
        g_state.comlinks[idx].callback    = pfnCallback;
        g_state.comlinks[idx].cb_userdata = pUserData;
    }
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetResult(PDU_HANDLE   hModule,
                         PDU_HANDLE   hCoL,
                         PDU_HANDLE   hCop,
                         PDU_UINT8*   pResultBuf,
                         PDU_UNUM32*  pResultBufLen,
                         PDU_UNUM32*  pRxCount,
                         PDU_UNUM32*  pTimestamp)
{
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;
    if (hModule != MODULE_HANDLE) return PDU_ERR_INVALID_HANDLE;
    if (!IS_COL_HANDLE(hCoL) || !IS_COP_HANDLE(hCop)) return PDU_ERR_INVALID_HANDLE;

    int col_idx = (int)GET_HANDLE_IDX(hCoL);
    int cop_idx = (int)GET_HANDLE_IDX(hCop);
    if (col_idx >= MAX_COMLINKS || cop_idx >= MAX_COPRIMS) return PDU_ERR_INVALID_HANDLE;

    cop_entry_t* cop = &g_state.comlinks[col_idx].cops[cop_idx];
    pthread_mutex_lock(&cop->lock);

    if (!cop->in_use || cop->state == COP_STATE_IDLE) {
        pthread_mutex_unlock(&cop->lock);
        return PDU_ERR_COP_INVALID;
    }

    if (cop->state == COP_STATE_RUNNING) {
        pthread_mutex_unlock(&cop->lock);
        return PDU_ERR_COP_NO_REQUEST_TO_HANDLE;   /* Not done yet */
    }

    if (pResultBuf && pResultBufLen && cop->rx_buf && cop->rx_len > 0) {
        uint32_t copy = (cop->rx_len < *pResultBufLen) ? cop->rx_len : *pResultBufLen;
        memcpy(pResultBuf, cop->rx_buf, copy);
        *pResultBufLen = copy;
    } else if (pResultBufLen) {
        *pResultBufLen = cop->rx_len;
    }

    if (pRxCount)   *pRxCount   = cop->rx_count;
    if (pTimestamp) *pTimestamp = cop->timestamp;

    pthread_mutex_unlock(&cop->lock);
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUIoCtl(PDU_HANDLE hModule,
                     PDU_UNUM32 IoctlId,
                     void*      pInput,
                     void*      pOutput)
{
    if (!g_state.constructed) return PDU_ERR_PDUAPI_NOT_CONSTRUCTED;
    if (hModule != MODULE_HANDLE) return PDU_ERR_INVALID_HANDLE;

    switch (IoctlId) {
    case VAS6154_IOCTL_SET_LED:
        if (!pInput) return PDU_ERR_INVALID_PARAMETERS;
        vas6154_set_led(*(uint8_t*)pInput);
        break;

    case VAS6154_IOCTL_CAN_BUS_RESET:
        vas6154_reset();
        break;

    case VAS6154_IOCTL_GET_DOIP_ADDR:
        if (!pOutput) return PDU_ERR_INVALID_PARAMETERS;
        *(uint16_t*)pOutput = 0x0001;  /* Default DoIP tester address */
        break;

    default:
        return PDU_ERR_NOT_IMPLEMENTED;
    }
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetTimestamp(PDU_HANDLE hModule, PDU_UNUM32* pTimestamp)
{
    if (hModule != MODULE_HANDLE) return PDU_ERR_INVALID_HANDLE;
    if (!pTimestamp) return PDU_ERR_INVALID_PARAMETERS;
    *pTimestamp = get_timestamp_us();
    return PDU_STATUS_NOERROR;
}

const PDU_CHAR* PDUGetErrorText(PDU_STATUS status)
{
    switch (status) {
    case PDU_STATUS_NOERROR:              return "No error";
    case PDU_ERR_FCT_FAILED:              return "Function failed";
    case PDU_ERR_COMM_PC_TO_VCI_FAILED:  return "PC to VCI communication failed";
    case PDU_ERR_PDUAPI_NOT_CONSTRUCTED: return "API not constructed";
    case PDU_ERR_INVALID_PARAMETERS:     return "Invalid parameters";
    case PDU_ERR_INVALID_HANDLE:         return "Invalid handle";
    case PDU_ERR_MODULE_NOT_CONNECTED:   return "Module not connected";
    case PDU_ERR_COMPARAM_NOT_SUPPORTED: return "ComParam not supported";
    case PDU_ERR_EXCEEDED_LIMIT:         return "Exceeded limit";
    case PDU_ERR_NOT_IMPLEMENTED:        return "Not implemented";
    case PDU_ERR_COP_INVALID:            return "ComPrimitive invalid";
    case PDU_ERR_COP_NO_REQUEST_TO_HANDLE: return "No pending request";
    default:                             return "Unknown error";
    }
}
