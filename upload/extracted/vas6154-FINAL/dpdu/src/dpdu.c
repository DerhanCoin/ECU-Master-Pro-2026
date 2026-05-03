#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <unistd.h>
#include <time.h>
#include <pthread.h>
#include "../include/dpdu.h"
#include "../include/vas6154.h"

#define MAX_COL 8
#define MAX_COP 32
#define MOD_H   ((PDU_HANDLE)(uintptr_t)1)
#define COL_H(i) ((PDU_HANDLE)(uintptr_t)(0x10000|(i)))
#define COP_H(i) ((PDU_HANDLE)(uintptr_t)(0x20000|(i)))
#define COL_IDX(h) ((int)((uintptr_t)(h)&0xFFFF))
#define COP_IDX(h) ((int)((uintptr_t)(h)&0xFFFF))
#define IS_COL(h) (((uintptr_t)(h)>>16)==0x1)
#define IS_COP(h) (((uintptr_t)(h)>>16)==0x2)

typedef enum { COP_IDLE,COP_RUN,COP_DONE,COP_CANCEL,COP_ERR } cop_st_t;

typedef struct {
    bool     used; cop_st_t state; PDU_COPTYPE type; void *tag;
    uint8_t *rx; uint32_t rx_len,rx_cnt,ts; PDU_STATUS err; pthread_mutex_t m;
} cop_t;

typedef struct {
    bool used; uint32_t bus,proto,baud; uint8_t ch;
    uint32_t tx_id,rx_id; uint8_t pad_en,pad_val,addr_mode,stmin,bs;
    PDU_CALLBACK cb; void *cb_ud; cop_t cops[MAX_COP]; pthread_mutex_t m;
} col_t;

typedef struct {
    bool inited,connected; vas6154_info_t info;
    col_t cols[MAX_COL]; PDU_CALLBACK mod_cb; void *mod_ud; pthread_mutex_t m;
} state_t;

static state_t G={0};

static uint32_t now_us(void) {
    struct timespec ts; clock_gettime(CLOCK_MONOTONIC,&ts);
    return (uint32_t)(ts.tv_sec*1000000ULL+ts.tv_nsec/1000);
}

static void usb_event_cb(uint8_t ev,uint8_t ch,uint32_t ts,
                          const uint8_t *data,uint16_t len,void *ud) {
    (void)ud;
    for (int i=0;i<MAX_COL;i++) {
        col_t *c=&G.cols[i];
        if (!c->used||c->ch!=ch) continue;
        PDU_EVENT evt={0}; evt.Timestamp=ts;
        for (int j=0;j<MAX_COP;j++) {
            cop_t *p=&c->cops[j];
            if (!p->used||p->state!=COP_RUN) continue;
            pthread_mutex_lock(&p->m);
            if (p->rx) free(p->rx);
            p->rx=malloc(len); if(p->rx){memcpy(p->rx,data,len);p->rx_len=len;p->rx_cnt++;p->ts=ts;}
            p->state=COP_DONE;
            pthread_mutex_unlock(&p->m);
            evt.EventCode=PDU_EVT_RESULT; evt.Status=PDU_STATUS_NOERROR; evt.hCop=COP_H(j);
            break;
        }
        if (!evt.EventCode) { evt.EventCode=(ev==1?PDU_EVT_DATA:PDU_EVT_ERROR); evt.Status=PDU_STATUS_NOERROR; }
        if (c->cb) c->cb(MOD_H,COL_H(i),&evt,c->cb_ud);
        else if (G.mod_cb) G.mod_cb(MOD_H,COL_H(i),&evt,G.mod_ud);
        break;
    }
}

PDU_STATUS PDUConstruct(const PDU_CHAR *o,void *t) {
    (void)o;(void)t;
    if (G.inited) return PDU_STATUS_NOERROR;
    memset(&G,0,sizeof(G));
    pthread_mutex_init(&G.m,NULL);
    for(int i=0;i<MAX_COL;i++){pthread_mutex_init(&G.cols[i].m,NULL);for(int j=0;j<MAX_COP;j++)pthread_mutex_init(&G.cols[i].cops[j].m,NULL);}
    if (vas6154_usb_init()) return PDU_ERR_COMM;
    G.inited=true;
    printf("[DPDU] Inicijaliziran\n");
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUDestruct(void) {
    if (!G.inited) return PDU_ERR_NOT_INIT;
    if (G.connected) { vas6154_usb_close(); G.connected=false; }
    vas6154_usb_exit();
    G.inited=false;
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUModuleConnect(PDU_HANDLE *phMod,const PDU_CHAR *addr) {
    (void)addr;
    if (!G.inited) return PDU_ERR_NOT_INIT;
    if (!phMod) return PDU_ERR_PARAM;
    if (vas6154_usb_open()) return PDU_ERR_COMM;
    vas6154_register_cb(usb_event_cb,NULL);
    vas6154_get_info(&G.info);
    vas6154_set_led(LED_GREEN);
    G.connected=true;
    *phMod=MOD_H;
    printf("[DPDU] Modul spojen: VAS 6154 SN=%s\n",G.info.serial);
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUModuleDisconnect(PDU_HANDLE hMod) {
    if (hMod!=MOD_H) return PDU_ERR_HANDLE;
    vas6154_set_led(LED_OFF);
    vas6154_usb_close();
    G.connected=false;
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetModuleIds(PDU_UNUM32 *list,PDU_UNUM32 *n) {
    if (!n) return PDU_ERR_PARAM;
    if (!G.inited) vas6154_usb_init();
    vas6154_devinfo_t devs[4]; int f=vas6154_enumerate(devs,4); if(f<0)f=0;
    if (list&&*n>=(PDU_UNUM32)f) for(int i=0;i<f;i++) list[i]=i;
    *n=(PDU_UNUM32)f;
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetStatus(PDU_HANDLE hMod,PDU_HANDLE hCoL,PDU_UNUM32 *st) {
    if (hMod!=MOD_H||!st) return PDU_ERR_PARAM;
    if (hCoL==(PDU_HANDLE)PDU_HANDLE_UNDEF) { *st=G.connected?0:2; return PDU_STATUS_NOERROR; }
    if (!IS_COL(hCoL)) return PDU_ERR_HANDLE;
    int i=COL_IDX(hCoL); if(i>=MAX_COL) return PDU_ERR_HANDLE;
    *st=G.cols[i].used?1:0;
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetVersion(PDU_HANDLE hMod,PDU_VERSION *v) {
    if (hMod!=MOD_H||!v) return PDU_ERR_PARAM;
    v->MVCI_Part1=0x0200; v->MVCI_Part2=0x0200; v->VendorID=VAS6154_VID;
    v->FwVer=((uint32_t)G.info.fw_major<<16)|((uint32_t)G.info.fw_minor<<8)|G.info.fw_patch;
    v->HwVer=((uint32_t)G.info.hw_major<<8)|G.info.hw_minor;
    v->pVendorInfo=(PDU_CHAR*)"DERHAN AutoMatrix Pro - Linux";
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetModuleData(PDU_HANDLE hMod,PDU_MODDATA *d) {
    if (hMod!=MOD_H||!d) return PDU_ERR_PARAM;
    static char fw[16],hw[8];
    snprintf(fw,sizeof(fw),"%d.%d.%d",G.info.fw_major,G.info.fw_minor,G.info.fw_patch);
    snprintf(hw,sizeof(hw),"%d.%d",G.info.hw_major,G.info.hw_minor);
    d->VendorID=VAS6154_VID; d->ProductID=VAS6154_PID_V2;
    d->pVendorName=(PDU_CHAR*)"Softing AG"; d->pProductName=(PDU_CHAR*)"VAS 6154";
    d->pFWVersion=fw; d->pHWVersion=hw; d->pSerial=G.info.serial;
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUConnect(PDU_HANDLE hMod,PDU_UNUM32 bus,PDU_UNUM32 proto,
                       PDU_UNUM32 *rscs,PDU_UNUM32 nr,PDU_HANDLE *phCoL) {
    if (hMod!=MOD_H||!phCoL) return PDU_ERR_PARAM;
    if (!G.connected) return PDU_ERR_MODULE_NC;
    pthread_mutex_lock(&G.m);
    int idx=-1;
    for(int i=0;i<MAX_COL;i++) if(!G.cols[i].used){idx=i;break;}
    if(idx<0){pthread_mutex_unlock(&G.m);return PDU_ERR_LIMIT;}
    col_t *c=&G.cols[idx];
    memset(c,0,sizeof(*c)); pthread_mutex_init(&c->m,NULL);
    for(int j=0;j<MAX_COP;j++) pthread_mutex_init(&c->cops[j].m,NULL);
    c->used=true; c->bus=bus; c->proto=proto; c->baud=BAUD_500K;
    c->pad_en=1; c->pad_val=0xCC;
    if (nr>0&&rscs) { switch(rscs[0]) { case VAS6154_RSC_CAN0:c->ch=0;break; case VAS6154_RSC_CAN1:c->ch=1;break; default:c->ch=0; } }
    *phCoL=COL_H(idx);
    pthread_mutex_unlock(&G.m);
    printf("[DPDU] Kanal otvoren: col[%d] ch=%d baud=%u\n",idx,c->ch,c->baud);
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUDisconnect(PDU_HANDLE hMod,PDU_HANDLE hCoL) {
    if (hMod!=MOD_H||!IS_COL(hCoL)) return PDU_ERR_HANDLE;
    int i=COL_IDX(hCoL); if(i>=MAX_COL) return PDU_ERR_HANDLE;
    col_t *c=&G.cols[i]; pthread_mutex_lock(&c->m);
    vas6154_close_channel(c->ch);
    for(int j=0;j<MAX_COP;j++){if(c->cops[j].rx)free(c->cops[j].rx);c->cops[j].used=false;}
    c->used=false; pthread_mutex_unlock(&c->m);
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUSetComParam(PDU_HANDLE hMod,PDU_HANDLE hCoL,PDU_UNUM32 id,const PDU_PARAM *p) {
    if (hMod!=MOD_H||!IS_COL(hCoL)||!p) return PDU_ERR_PARAM;
    int i=COL_IDX(hCoL); if(i>=MAX_COL) return PDU_ERR_HANDLE;
    col_t *c=&G.cols[i];
    switch(id) {
    case PDU_CPID_BAUDRATE:    c->baud=p->ParamValue; break;
    case PDU_CPID_CAN_ID_TX:   c->tx_id=p->ParamValue; break;
    case PDU_CPID_CAN_ID_RX:   c->rx_id=p->ParamValue; break;
    case PDU_CPID_STMIN_TX:    c->stmin=(uint8_t)p->ParamValue; break;
    case PDU_CPID_BLOCKSIZE_TX:c->bs=(uint8_t)p->ParamValue; break;
    case PDU_CPID_PAD_EN:      c->pad_en=(uint8_t)p->ParamValue; break;
    case PDU_CPID_PAD_VAL:     c->pad_val=(uint8_t)p->ParamValue; break;
    case PDU_CPID_ADDR_MODE:   c->addr_mode=(uint8_t)p->ParamValue; break;
    default: return PDU_ERR_NOTIMPL;
    }
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetComParam(PDU_HANDLE hMod,PDU_HANDLE hCoL,PDU_UNUM32 id,PDU_PARAM *p) {
    if (hMod!=MOD_H||!IS_COL(hCoL)||!p) return PDU_ERR_PARAM;
    int i=COL_IDX(hCoL); if(i>=MAX_COL) return PDU_ERR_HANDLE;
    col_t *c=&G.cols[i]; p->ParamId=id;
    switch(id) {
    case PDU_CPID_BAUDRATE:    p->ParamValue=c->baud; break;
    case PDU_CPID_CAN_ID_TX:   p->ParamValue=c->tx_id; break;
    case PDU_CPID_CAN_ID_RX:   p->ParamValue=c->rx_id; break;
    case PDU_CPID_PAD_EN:      p->ParamValue=c->pad_en; break;
    default: return PDU_ERR_NOTIMPL;
    }
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUStartComPrimitive(PDU_HANDLE hMod,PDU_HANDLE hCoL,PDU_COPTYPE type,
                                 PDU_UNUM32 dlen,const PDU_UINT8 *data,void *tag,PDU_HANDLE *phCop) {
    if (hMod!=MOD_H||!IS_COL(hCoL)||!phCop) return PDU_ERR_PARAM;
    int ci=COL_IDX(hCoL); if(ci>=MAX_COL) return PDU_ERR_HANDLE;
    col_t *c=&G.cols[ci];
    int pi=-1;
    pthread_mutex_lock(&c->m);
    for(int j=0;j<MAX_COP;j++) if(!c->cops[j].used){pi=j;break;}
    if(pi<0){pthread_mutex_unlock(&c->m);return PDU_ERR_LIMIT;}
    cop_t *p=&c->cops[pi];
    p->used=true; p->state=COP_RUN; p->type=type; p->tag=tag;
    p->rx=NULL; p->rx_len=p->rx_cnt=0; p->err=PDU_STATUS_NOERROR;
    pthread_mutex_unlock(&c->m);
    int r=0;
    switch(type) {
    case PDU_COPT_STARTCOMM:
        r=vas6154_open_channel(c->ch,c->baud);
        p->state=(r?COP_ERR:COP_DONE);
        if(!r) vas6154_set_led(LED_BLUE);
        break;
    case PDU_COPT_STOPCOMM:
        vas6154_close_channel(c->ch); p->state=COP_DONE; vas6154_set_led(LED_GREEN);
        break;
    case PDU_COPT_SENDRECV:
        if (!data||!dlen){p->state=COP_ERR;*phCop=COP_H(pi);return PDU_ERR_PARAM;}
        { vas6154_istp_t h={.tx_id=c->tx_id,.rx_id=c->rx_id,.addr_mode=c->addr_mode,.pad_en=c->pad_en,.pad_byte=c->pad_val,.data_len=(uint16_t)dlen};
          r=vas6154_send_istp(c->ch,&h,data,(uint16_t)dlen);
          p->state=(r<0?COP_ERR:COP_RUN); }
        break;
    case PDU_COPT_UPDATEPARAM:
        p->state=COP_DONE; break;
    default:
        p->state=COP_ERR; *phCop=COP_H(pi); return PDU_ERR_NOTIMPL;
    }
    *phCop=COP_H(pi);
    return (r<0)?PDU_ERR_COMM:PDU_STATUS_NOERROR;
}

PDU_STATUS PDUCancelComPrimitive(PDU_HANDLE hMod,PDU_HANDLE hCoL,PDU_HANDLE hCop) {
    if (!IS_COL(hCoL)||!IS_COP(hCop)) return PDU_ERR_HANDLE;
    int ci=COL_IDX(hCoL),pi=COP_IDX(hCop);
    if(ci>=MAX_COL||pi>=MAX_COP) return PDU_ERR_HANDLE;
    G.cols[ci].cops[pi].state=COP_CANCEL;
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetEventItem(PDU_HANDLE hMod,PDU_HANDLE hCoL,PDU_EVENT **ppEvt) {
    if (hMod!=MOD_H||!ppEvt) return PDU_ERR_PARAM;
    for(int i=0;i<MAX_COL;i++){
        col_t *c=&G.cols[i]; if(!c->used) continue;
        if(hCoL!=(PDU_HANDLE)PDU_HANDLE_UNDEF&&hCoL!=COL_H(i)) continue;
        for(int j=0;j<MAX_COP;j++){
            cop_t *p=&c->cops[j]; if(!p->used) continue;
            if(p->state==COP_DONE||p->state==COP_ERR||p->state==COP_CANCEL){
                PDU_EVENT *e=calloc(1,sizeof(*e)); if(!e) return PDU_ERR_FAILED;
                e->Timestamp=p->ts; e->hCop=COP_H(j);
                e->EventCode=(p->state==COP_DONE?PDU_EVT_COP_DONE:p->state==COP_CANCEL?PDU_EVT_COP_CANCEL:PDU_EVT_ERROR);
                e->Status=(p->state==COP_ERR?p->err:PDU_STATUS_NOERROR);
                p->used=false; *ppEvt=e; return PDU_STATUS_NOERROR;
            }
        }
    }
    return PDU_ERR_FAILED;
}

PDU_STATUS PDUFreeEventItem(PDU_HANDLE hMod,PDU_EVENT *p){(void)hMod;if(p)free(p);return PDU_STATUS_NOERROR;}

PDU_STATUS PDURegisterEventCallback(PDU_HANDLE hMod,PDU_HANDLE hCoL,PDU_CALLBACK cb,void *ud) {
    if (hMod!=MOD_H) return PDU_ERR_HANDLE;
    if (hCoL==(PDU_HANDLE)PDU_HANDLE_UNDEF){G.mod_cb=cb;G.mod_ud=ud;}
    else {if(!IS_COL(hCoL))return PDU_ERR_HANDLE;int i=COL_IDX(hCoL);if(i>=MAX_COL)return PDU_ERR_HANDLE;G.cols[i].cb=cb;G.cols[i].cb_ud=ud;}
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetResult(PDU_HANDLE hMod,PDU_HANDLE hCoL,PDU_HANDLE hCop,
                         PDU_UINT8 *buf,PDU_UNUM32 *len,PDU_UNUM32 *cnt,PDU_UNUM32 *ts) {
    if (!IS_COL(hCoL)||!IS_COP(hCop)) return PDU_ERR_HANDLE;
    int ci=COL_IDX(hCoL),pi=COP_IDX(hCop);
    if(ci>=MAX_COL||pi>=MAX_COP) return PDU_ERR_HANDLE;
    cop_t *p=&G.cols[ci].cops[pi];
    pthread_mutex_lock(&p->m);
    if (!p->used){pthread_mutex_unlock(&p->m);return PDU_ERR_FAILED;}
    if (buf&&len&&p->rx&&p->rx_len){uint32_t cp=p->rx_len<*len?p->rx_len:*len;memcpy(buf,p->rx,cp);*len=cp;}
    else if(len)*len=p->rx_len;
    if(cnt)*cnt=p->rx_cnt; if(ts)*ts=p->ts;
    pthread_mutex_unlock(&p->m);
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUIoCtl(PDU_HANDLE hMod,PDU_UNUM32 id,void *in,void *out){
    (void)out;
    if(hMod!=MOD_H)return PDU_ERR_HANDLE;
    switch(id){case VAS6154_IOCTL_LED:if(in)vas6154_set_led(*(uint8_t*)in);break;case VAS6154_IOCTL_RESET:vas6154_reset();break;default:return PDU_ERR_NOTIMPL;}
    return PDU_STATUS_NOERROR;
}

PDU_STATUS PDUGetTimestamp(PDU_HANDLE hMod,PDU_UNUM32 *ts){if(hMod!=MOD_H||!ts)return PDU_ERR_PARAM;*ts=now_us();return PDU_STATUS_NOERROR;}

const PDU_CHAR *PDUGetErrorText(PDU_STATUS s){
    switch(s){
    case PDU_STATUS_NOERROR: return "OK";
    case PDU_ERR_FAILED:     return "Greška";
    case PDU_ERR_COMM:       return "USB komunikacija neuspješna";
    case PDU_ERR_NOT_INIT:   return "API nije inicijaliziran";
    case PDU_ERR_PARAM:      return "Nevažeći parametri";
    case PDU_ERR_HANDLE:     return "Nevažeći handle";
    case PDU_ERR_MODULE_NC:  return "Modul nije spojen";
    case PDU_ERR_LIMIT:      return "Prekoračen limit";
    case PDU_ERR_NOTIMPL:    return "Nije implementirano";
    default:                 return "Nepoznata greška";
    }
}
