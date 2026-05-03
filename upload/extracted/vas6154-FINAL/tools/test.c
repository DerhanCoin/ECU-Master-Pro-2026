#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <unistd.h>
#include "../dpdu/include/dpdu.h"
#include "../dpdu/include/vas6154.h"

static volatile int stop=0;
static void sig(int s){(void)s;stop=1;}

static void hex(const char *prefix,const uint8_t *d,size_t n){
    printf("%s",prefix);
    for(size_t i=0;i<n;i++){if(i&&i%16==0)printf("\n%s",prefix);printf("%02X ",d[i]);}
    printf("\n");
}

static int cmd_scan(void){
    printf("\nSkeniranje VAS 6154 uređaja...\n\n");
    vas6154_usb_init();
    vas6154_devinfo_t devs[8]; int n=vas6154_enumerate(devs,8);
    if(n<=0){printf("  ✗ Nije pronađen nijedan VAS 6154!\n\n  Provjeri:\n  1) lsusb | grep 19b2\n  2) sudo modprobe vas6154\n  3) ls /dev/vas6154_*\n"); vas6154_usb_exit(); return 1;}
    printf("  Pronađeno %d uređaj(a):\n\n",n);
    for(int i=0;i<n;i++) printf("  [%d] %s\n      VID=%04X PID=%04X Bus=%d Addr=%d\n\n",i,devs[i].name,devs[i].vid,devs[i].pid,devs[i].bus,devs[i].addr);
    vas6154_usb_exit(); return 0;
}

static int cmd_info(void){
    printf("\nVAS 6154 Info...\n");
    vas6154_usb_init();
    if(vas6154_usb_open()){vas6154_usb_exit();return 1;}
    vas6154_info_t info={0};
    if(!vas6154_get_info(&info)){
        printf("\n  ┌──────────────────────────────────┐\n");
        printf("  │ VAS 6154 Device Info              │\n");
        printf("  ├──────────────────────────────────┤\n");
        printf("  │ Serial:  %-24s│\n",info.serial);
        printf("  │ FW:      v%d.%d.%-20d│\n",info.fw_major,info.fw_minor,info.fw_patch);
        printf("  │ HW:      v%d.%-24d│\n",info.hw_major,info.hw_minor);
        printf("  │ CAN-FD:  %-24s│\n",info.can_fd?"DA":"NE");
        printf("  │ DoIP:    %-24s│\n",info.doip?"DA":"NE");
        printf("  └──────────────────────────────────┘\n");
    } else printf("  Info nije dostupan (non-fatal)\n");
    vas6154_usb_close(); vas6154_usb_exit(); return 0;
}

static void sniff_cb(uint8_t ev,uint8_t ch,uint32_t ts,const uint8_t *d,uint16_t len,void *ud){
    (void)ud; if(ev!=1||len<5) return;
    uint32_t id=((uint32_t)d[0]<<24)|((uint32_t)d[1]<<16)|((uint32_t)d[2]<<8)|d[3];
    uint8_t dlc=d[4]&0x0F;
    printf("[%10u] ch%d ID=%08X DLC=%d  ",ts,ch,id,dlc);
    for(int i=0;i<dlc&&i<8;i++) printf("%02X ",d[5+i]);
    printf("\n");
}

static int cmd_sniff(void){
    printf("\nCAN Sniffer - Ctrl+C za stop\n\n");
    signal(SIGINT,sig);
    vas6154_usb_init();
    if(vas6154_usb_open()){vas6154_usb_exit();return 1;}
    vas6154_register_cb(sniff_cb,NULL);
    vas6154_open_channel(0,BAUD_500K);
    while(!stop) usleep(1000);
    vas6154_close_channel(0);
    vas6154_usb_close(); vas6154_usb_exit();
    printf("\nSniffer zaustavljen.\n");
    return 0;
}

static int cmd_uds(uint32_t tx,uint32_t rx){
    printf("\nUDS test: TX=0x%08X RX=0x%08X\n",tx,rx);
    PDU_HANDLE hMod,hCoL,hCop;
    PDU_STATUS s;
    s=PDUConstruct(NULL,NULL); if(s!=PDU_STATUS_NOERROR){fprintf(stderr,"PDUConstruct: %s\n",PDUGetErrorText(s));return 1;}
    s=PDUModuleConnect(&hMod,NULL); if(s!=PDU_STATUS_NOERROR){fprintf(stderr,"PDUModuleConnect: %s\n",PDUGetErrorText(s));PDUDestruct();return 1;}
    PDU_UNUM32 rscs[]={VAS6154_RSC_CAN0};
    s=PDUConnect(hMod,PDU_RSC_ISO15765,0,rscs,1,&hCoL); if(s!=PDU_STATUS_NOERROR){fprintf(stderr,"PDUConnect: %s\n",PDUGetErrorText(s));goto done;}
    PDU_PARAM p;
    p.ParamValue=BAUD_500K;  PDUSetComParam(hMod,hCoL,PDU_CPID_BAUDRATE,&p);
    p.ParamValue=tx;         PDUSetComParam(hMod,hCoL,PDU_CPID_CAN_ID_TX,&p);
    p.ParamValue=rx;         PDUSetComParam(hMod,hCoL,PDU_CPID_CAN_ID_RX,&p);
    s=PDUStartComPrimitive(hMod,hCoL,PDU_COPT_STARTCOMM,0,NULL,NULL,&hCop);
    if(s){fprintf(stderr,"STARTCOMM: %s\n",PDUGetErrorText(s));goto disc;}
    usleep(200000);
    uint8_t req[]={0x22,0xF1,0x90};
    printf("  → 22 F1 90 (ReadDataByIdentifier VIN)\n");
    s=PDUStartComPrimitive(hMod,hCoL,PDU_COPT_SENDRECV,sizeof(req),req,NULL,&hCop);
    if(s){fprintf(stderr,"SENDRECV: %s\n",PDUGetErrorText(s));goto disc;}
    printf("  Čekam odgovor");
    for(int w=0;w<50;w++){
        PDU_EVENT *evt=NULL;
        if(PDUGetEventItem(hMod,hCoL,&evt)==PDU_STATUS_NOERROR&&evt){
            if(evt->EventCode==PDU_EVT_RESULT||evt->EventCode==PDU_EVT_COP_DONE){
                printf("\n  ← Odgovor primljen:\n");
                uint8_t buf[256]; PDU_UNUM32 l=sizeof(buf),cnt,ts;
                if(!PDUGetResult(hMod,hCoL,evt->hCop,buf,&l,&cnt,&ts)){
                    hex("     ",buf,l);
                    if(l>3&&buf[0]==0x62&&buf[1]==0xF1&&buf[2]==0x90){
                        printf("  VIN: "); for(PDU_UNUM32 i=3;i<l;i++) printf("%c",buf[i]>=0x20?buf[i]:'?'); printf("\n");
                    } else if(l>0&&buf[0]==0x7F) printf("  NRC: 0x%02X\n",l>2?buf[2]:0);
                }
                PDUFreeEventItem(hMod,evt); break;
            }
            PDUFreeEventItem(hMod,evt);
        }
        usleep(100000); printf("."); fflush(stdout);
    }
    printf("\n");
disc: PDUDisconnect(hMod,hCoL);
done: PDUModuleDisconnect(hMod); PDUDestruct();
    return 0;
}

int main(int argc,char *argv[]){
    printf("\n");
    printf("  ██████╗ ███████╗██████╗ ██╗  ██╗ █████╗ ███╗\n");
    printf("  ██╔══██╗██╔════╝██╔══██╗██║  ██║██╔══██╗████║\n");
    printf("  ██║  ██║█████╗  ██████╔╝███████║███████║╚██╔╝\n");
    printf("  ██║  ██║██╔══╝  ██╔══██╗██╔══██║██╔══██║ ██║\n");
    printf("  ██████╔╝███████╗██║  ██║██║  ██║██║  ██║ ██║\n");
    printf("  ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═╝\n");
    printf("  VAS 6154 Test Tool - DERHAN AutoMatrix Pro\n\n");
    if(argc<2){
        printf("Upotreba: %s <komanda>\n\n",argv[0]);
        printf("  scan           Skeniraj VAS 6154 uređaje\n");
        printf("  info           Info o donglu\n");
        printf("  uds [tx rx]    UDS VIN čitanje (default: 7DF/7E8)\n");
        printf("  sniff          CAN sniffer\n");
        return 1;
    }
    if(!strcmp(argv[1],"scan"))  return cmd_scan();
    if(!strcmp(argv[1],"info"))  return cmd_info();
    if(!strcmp(argv[1],"sniff")) return cmd_sniff();
    if(!strcmp(argv[1],"uds")){
        uint32_t tx=0x7DF,rx=0x7E8;
        if(argc>=4){tx=(uint32_t)strtol(argv[2],NULL,16);rx=(uint32_t)strtol(argv[3],NULL,16);}
        return cmd_uds(tx,rx);
    }
    fprintf(stderr,"Nepoznata komanda: %s\n",argv[1]);
    return 1;
}
