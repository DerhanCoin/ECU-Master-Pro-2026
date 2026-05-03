#ifndef DPDU_API_H
#define DPDU_API_H

/*
 * D-PDU API - ISO 22900-2 MVCI Protocol API
 * VAS 6154 Linux Implementation
 * DERHAN AutoMatrix Pro
 *
 * This implements the standard ISO 22900-2 D-PDU API
 * as a shared library (libdpdu_vas6154.so)
 * Compatible with: OpenVehicleDiag, ECU Master Pro, ODIS, VCDS
 */

#include "iso22900_types.h"

#ifdef __cplusplus
extern "C" {
#endif

#ifdef _WIN32
  #define PDUFUNC __declspec(dllexport)
#else
  #define PDUFUNC __attribute__((visibility("default")))
#endif

/* ============================================================
 * Module Management (ISO 22900-2 §8.2)
 * ============================================================ */

/**
 * PDUConstruct - Initialize the D-PDU API
 * @pszOptionStr: Optional XML config string (pass NULL for defaults)
 * @pAPITag:      Optional application-defined tag
 * Returns: PDU_STATUS_NOERROR on success
 */
PDUFUNC PDU_STATUS PDUConstruct(const PDU_CHAR* pszOptionStr, void* pAPITag);

/**
 * PDUDestruct - Shut down the D-PDU API and release all resources
 */
PDUFUNC PDU_STATUS PDUDestruct(void);

/**
 * PDUModuleConnect - Connect to a VCI module
 * @hMod:   Module handle (output)
 * @pszModule: Module address string (e.g., "USB:0" or NULL for first found)
 */
PDUFUNC PDU_STATUS PDUModuleConnect(PDU_HANDLE* phModule,
                                     const PDU_CHAR* pszModuleAddr);

/**
 * PDUModuleDisconnect - Disconnect from a VCI module
 */
PDUFUNC PDU_STATUS PDUModuleDisconnect(PDU_HANDLE hModule);

/**
 * PDUGetModuleIds - Get list of available module IDs
 * @pModuleIdList: Caller-allocated array; pass NULL to get required size
 * @pNumIds:       In/out: buffer size in / actual count out
 */
PDUFUNC PDU_STATUS PDUGetModuleIds(PDU_UNUM32* pModuleIdList,
                                    PDU_UNUM32* pNumIds);

/**
 * PDUGetStatus - Get module or ComLogicalLink status
 * @hModule:  Module handle
 * @hCoL:     ComLogicalLink handle (PDU_HANDLE_UNDEF for module status)
 * @pStatus:  Output status code
 */
PDUFUNC PDU_STATUS PDUGetStatus(PDU_HANDLE hModule,
                                 PDU_HANDLE hCoL,
                                 PDU_UNUM32* pStatus);

/**
 * PDUGetVersion - Get API and firmware version information
 */
PDUFUNC PDU_STATUS PDUGetVersion(PDU_HANDLE hModule,
                                  PDU_VERSION_DATA* pVersionData);

/**
 * PDUGetModuleData - Get module hardware/firmware info
 */
PDUFUNC PDU_STATUS PDUGetModuleData(PDU_HANDLE hModule,
                                     PDU_MODULE_DATA* pModuleData);

/* ============================================================
 * ComLogicalLink Management (ISO 22900-2 §8.3)
 * ============================================================ */

/**
 * PDUConnect - Open a ComLogicalLink (communication channel)
 * @hModule:       Module handle
 * @hMod:          Resource ID (e.g. VAS6154_RSC_ID_CAN_CH0)
 * @busTypeId:     Bus type (PDU_RSC_ID_ISO_15765_2 etc.)
 * @protocolId:    Protocol ID
 * @pRscData:      Resource configuration data
 * @phCoL:         Output ComLogicalLink handle
 */
PDUFUNC PDU_STATUS PDUConnect(PDU_HANDLE  hModule,
                               PDU_UNUM32  busTypeId,
                               PDU_UNUM32  protocolId,
                               PDU_UNUM32* pRscIdList,
                               PDU_UNUM32  numRscIds,
                               PDU_HANDLE* phCoL);

/**
 * PDUDisconnect - Close a ComLogicalLink
 */
PDUFUNC PDU_STATUS PDUDisconnect(PDU_HANDLE hModule, PDU_HANDLE hCoL);

/* ============================================================
 * ComParameter Management (ISO 22900-2 §8.4)
 * ============================================================ */

/**
 * PDUSetComParam - Set a communication parameter
 * @hModule:   Module handle
 * @hCoL:      ComLogicalLink handle
 * @ParamId:   Parameter ID (PDU_CPID_*)
 * @pParamItem: Parameter value
 */
PDUFUNC PDU_STATUS PDUSetComParam(PDU_HANDLE        hModule,
                                   PDU_HANDLE        hCoL,
                                   PDU_UNUM32        ParamId,
                                   const PDU_PARAM_ITEM* pParamItem);

/**
 * PDUGetComParam - Get a communication parameter value
 */
PDUFUNC PDU_STATUS PDUGetComParam(PDU_HANDLE   hModule,
                                   PDU_HANDLE   hCoL,
                                   PDU_UNUM32   ParamId,
                                   PDU_PARAM_ITEM* pParamItem);

/* ============================================================
 * ComPrimitive Management (ISO 22900-2 §8.5)
 * ============================================================ */

/**
 * PDUStartComPrimitive - Start a communication operation
 * @hModule:     Module handle
 * @hCoL:        ComLogicalLink handle
 * @CopType:     ComPrimitive type (PDU_COPT_*)
 * @CopDataLen:  Length of COP control data
 * @pCopData:    COP control data (tx buffer, expected responses, etc.)
 * @pCopTag:     Application tag (returned in callbacks)
 * @phCop:       Output ComPrimitive handle
 */
PDUFUNC PDU_STATUS PDUStartComPrimitive(PDU_HANDLE          hModule,
                                         PDU_HANDLE          hCoL,
                                         PDU_COPTYPE         CopType,
                                         PDU_UNUM32          CopDataLen,
                                         const PDU_UINT8*    pCopData,
                                         void*               pCopTag,
                                         PDU_HANDLE*         phCop);

/**
 * PDUCancelComPrimitive - Cancel an active ComPrimitive
 */
PDUFUNC PDU_STATUS PDUCancelComPrimitive(PDU_HANDLE hModule,
                                          PDU_HANDLE hCoL,
                                          PDU_HANDLE hCop);

/**
 * PDUGetEventItem - Get the next event item (polling mode)
 * @hModule:        Module handle
 * @hCoL:           ComLogicalLink handle (PDU_HANDLE_UNDEF for any)
 * @ppEventItem:    Output event pointer (caller must free with PDUFreeEventItem)
 */
PDUFUNC PDU_STATUS PDUGetEventItem(PDU_HANDLE        hModule,
                                    PDU_HANDLE        hCoL,
                                    PDU_EVENT_ITEM**  ppEventItem);

/**
 * PDUFreeEventItem - Free an event item returned by PDUGetEventItem
 */
PDUFUNC PDU_STATUS PDUFreeEventItem(PDU_HANDLE hModule,
                                     PDU_EVENT_ITEM* pEventItem);

/**
 * PDURegisterEventCallback - Register async event callback
 * @hModule:    Module handle
 * @hCoL:       ComLogicalLink handle (PDU_HANDLE_UNDEF for module-level)
 * @pfnCallback: Callback function pointer
 * @pUserData:  User-defined data passed to callback
 */
PDUFUNC PDU_STATUS PDURegisterEventCallback(PDU_HANDLE    hModule,
                                             PDU_HANDLE    hCoL,
                                             PDU_CALLBACK  pfnCallback,
                                             void*         pUserData);

/* ============================================================
 * Result / Data retrieval (ISO 22900-2 §8.6)
 * ============================================================ */

/**
 * PDUGetResult - Get result data from a completed ComPrimitive
 */
PDUFUNC PDU_STATUS PDUGetResult(PDU_HANDLE      hModule,
                                 PDU_HANDLE      hCoL,
                                 PDU_HANDLE      hCop,
                                 PDU_UINT8*      pResultBuf,
                                 PDU_UNUM32*     pResultBufLen,
                                 PDU_UNUM32*     pRxCount,
                                 PDU_UNUM32*     pTimestamp);

/* ============================================================
 * Utility / Helper Functions
 * ============================================================ */

/**
 * PDUIoCtl - Device-specific control (vendor extension)
 * @hModule:   Module handle
 * @IoctlId:   Vendor-specific control ID
 * @pInput:    Input data
 * @pOutput:   Output data
 */
PDUFUNC PDU_STATUS PDUIoCtl(PDU_HANDLE hModule,
                              PDU_UNUM32 IoctlId,
                              void*      pInput,
                              void*      pOutput);

/* VAS 6154 specific IoCtl IDs */
#define VAS6154_IOCTL_SET_LED           0x1000
#define VAS6154_IOCTL_GET_VIN           0x1001
#define VAS6154_IOCTL_TRIGGER_FW_UPDATE 0x1002
#define VAS6154_IOCTL_GET_DOIP_ADDR     0x1003
#define VAS6154_IOCTL_CAN_BUS_RESET     0x1004
#define VAS6154_IOCTL_GET_CAN_STATS     0x1005

/**
 * PDUGetErrorText - Get human-readable error string
 */
PDUFUNC const PDU_CHAR* PDUGetErrorText(PDU_STATUS status);

/**
 * PDUGetTimestamp - Get current device timestamp (microseconds)
 */
PDUFUNC PDU_STATUS PDUGetTimestamp(PDU_HANDLE hModule, PDU_UNUM32* pTimestamp);

#ifdef __cplusplus
}
#endif

#endif /* DPDU_API_H */
