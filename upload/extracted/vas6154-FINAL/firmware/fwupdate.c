#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <unistd.h>
#include <errno.h>
#include <libusb-1.0/libusb.h>
#include "../dpdu/include/vas6154.h"

#define FW_MAX (4*1024*1024)
#define DFU_DNLOAD    1
#define DFU_GETSTATUS 3
#define DFU_CLRSTATUS 4

typedef struct __attribute__((packed)) { uint8_t status; uint8_t poll[3]; uint8_t state; uint8_t str; } dfu_st_t;

static uint32_t crc32(const uint8_t *d, size_t n){
    uint32_t c=0xFFFFFFFF,t[256]; int i,j;
    for(i=0;i<256;i++){uint32_t v=i;for(j=0;j<8;j++)v=(v&1)?(0xEDB88320^(v>>1)):(v>>1);t[i]=v;}
    for(size_t k=0;k<n;k++)c=t[(c^d[k])&0xFF]^(c>>8);
    return c^0xFFFFFFFF;
}

static void progress(size_t done,size_t total){
    int p=(int)(done*100/total),bars=p/2;
    printf("\r  ["); for(int i=0;i<50;i++) printf(i<bars?"#":" ");
    printf("] %3d%% (%zu/%zu)",p,done,total); fflush(stdout);
}

static int dfu_upload(libusb_device_handle *dev,const uint8_t *fw,size_t sz){
    printf("[FW] DFU download %zu bytes...\n",sz);
    dfu_st_t st; uint16_t blk=0;
    libusb_control_transfer(dev,0x21,DFU_CLRSTATUS,0,0,NULL,0,1000);
    size_t off=0;
    while(off<sz){
        size_t ch=sz-off; if(ch>64)ch=64;
        int r=libusb_control_transfer(dev,0x21,DFU_DNLOAD,blk,0,(uint8_t*)fw+off,(uint16_t)ch,5000);
        if(r<0){fprintf(stderr,"\n[FW] DFU block %d fail: %s\n",blk,libusb_strerror(r));return -1;}
        do { usleep(10000); libusb_control_transfer(dev,0xA1,DFU_GETSTATUS,0,0,(uint8_t*)&st,6,5000); } while(st.state==4);
        if(st.status){fprintf(stderr,"\n[FW] DFU err 0x%02X\n",st.status);return -1;}
        off+=ch; blk++; progress(off,sz);
    }
    libusb_control_transfer(dev,0x21,DFU_DNLOAD,blk,0,NULL,0,5000);
    printf("\n[FW] DFU complete!\n"); return 0;
}

int vas6154_firmware_update(const char *path){
    printf("\n  VAS 6154 Firmware Updater - DERHAN AutoMatrix Pro\n\n");
    FILE *f=fopen(path,"rb"); if(!f){perror(path);return -1;}
    fseek(f,0,SEEK_END); long sz=ftell(f); fseek(f,0,SEEK_SET);
    if(sz<=0||sz>FW_MAX){fclose(f);fprintf(stderr,"Nevažeća veličina: %ld\n",sz);return -1;}
    uint8_t *fw=malloc(sz); if(!fw){fclose(f);return -1;}
    if(fread(fw,1,sz,f)!=(size_t)sz){fclose(f);free(fw);return -1;}
    fclose(f);
    printf("[FW] Fajl: %s (%ld bytes)\n",path,sz);
    printf("[FW] CRC32: %08X\n",crc32(fw,sz));
    libusb_context *ctx=NULL; libusb_init(&ctx);
    libusb_device_handle *dfu=libusb_open_device_with_vid_pid(ctx,VAS6154_VID,VAS6154_PID_DFU);
    int r;
    if(dfu){
        printf("[FW] DFU mode detektovan\n");
        libusb_claim_interface(dfu,0);
        r=dfu_upload(dfu,fw,sz);
        libusb_release_interface(dfu,0); libusb_close(dfu);
    } else {
        printf("[FW] Normalni mode - proprietary update...\n");
        libusb_exit(ctx);
        vas6154_usb_init(); vas6154_usb_open();
        uint32_t fsz=(uint32_t)sz;
        r=vas6154_send(CMD_FW_START,0,(uint8_t*)&fsz,4);
        if(r>=0){ uint16_t l=0; r=vas6154_recv(CMD_FW_START,NULL,0,&l); }
        if(r<0){fprintf(stderr,"[FW] Start neuspješan\n"); goto done;}
        size_t off=0;
        while(off<(size_t)sz){
            size_t ch=(size_t)sz-off; if(ch>500)ch=500;
            r=vas6154_send(CMD_FW_DATA,0,fw+off,(uint16_t)ch);
            if(r<0){fprintf(stderr,"\n[FW] Data send fail @ %zu\n",off);goto done;}
            uint16_t l=0; r=vas6154_recv(CMD_FW_DATA,NULL,0,&l);
            if(r<0){fprintf(stderr,"\n[FW] Data ack fail @ %zu\n",off);goto done;}
            off+=ch; progress(off,sz);
        }
        uint32_t crc=crc32(fw,sz);
        r=vas6154_send(CMD_FW_END,0,(uint8_t*)&crc,4);
        if(r>=0){ uint16_t l=0; r=vas6154_recv(CMD_FW_END,NULL,0,&l); }
        printf("\n");
done:   vas6154_usb_close(); vas6154_usb_exit();
    }
    free(fw);
    if(!r){printf("\n✓ Firmware update uspješan! Reboot...\n");}
    else  {fprintf(stderr,"\n✗ FAILED. Ne odvajaj uređaj!\n");}
    return r;
}

#ifdef FW_STANDALONE
int main(int argc,char *argv[]){
    if(argc<2){
        printf("Upotreba: %s <firmware.bin>\n\n",argv[0]);
        printf("DFU mode (ako normalni ne radi):\n");
        printf("  1) Isključi VAS 6154\n  2) Drži reset\n  3) Priključi USB\n");
        return 1;
    }
    return vas6154_firmware_update(argv[1]);
}
#endif
