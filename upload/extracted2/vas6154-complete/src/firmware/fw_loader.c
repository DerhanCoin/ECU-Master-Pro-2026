/*
 * fw_loader.c - VAS 6154 Firmware Upload Utility
 * DERHAN AutoMatrix Pro - Linux Driver
 *
 * Uploads firmware to the VAS 6154 using either:
 * 1) USB DFU (Device Firmware Upgrade) - standard USB DFU protocol
 * 2) Proprietary Softing firmware update protocol
 *
 * Usage: vas6154-fwupdate <firmware.bin>
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <unistd.h>
#include <errno.h>
#include <libusb-1.0/libusb.h>

#include "../../include/vas6154.h"
#include "../usb/vas6154_usb.h"

/* ============================================================
 * Firmware file header (Softing .bin format)
 * ============================================================ */

#define FW_MAGIC    0x53465743   /* "SFWC" - Softing FirmWare Container */
#define FW_MAX_SIZE (4 * 1024 * 1024)   /* 4MB max */
#define FW_CHUNK    64           /* Bytes per USB write */

typedef struct __attribute__((packed)) {
    uint32_t magic;
    uint8_t  fw_major;
    uint8_t  fw_minor;
    uint8_t  fw_patch;
    uint8_t  target_hw;        /* 0x01 = VAS 6154 */
    uint32_t payload_size;
    uint32_t crc32;
    uint8_t  reserved[16];
    /* Firmware payload follows */
} fw_header_t;

/* ============================================================
 * CRC32 (IEEE 802.3)
 * ============================================================ */

static uint32_t crc32_table[256];
static int crc32_initialized = 0;

static void crc32_init(void)
{
    for (uint32_t i = 0; i < 256; i++) {
        uint32_t c = i;
        for (int j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >> 1)) : (c >> 1);
        }
        crc32_table[i] = c;
    }
    crc32_initialized = 1;
}

static uint32_t crc32(const uint8_t* data, size_t len)
{
    if (!crc32_initialized) crc32_init();
    uint32_t c = 0xFFFFFFFF;
    for (size_t i = 0; i < len; i++) {
        c = crc32_table[(c ^ data[i]) & 0xFF] ^ (c >> 8);
    }
    return c ^ 0xFFFFFFFF;
}

/* ============================================================
 * Progress display
 * ============================================================ */

static void print_progress(size_t done, size_t total)
{
    int pct = (int)(done * 100 / total);
    int bars = pct / 2;
    printf("\r  [");
    for (int i = 0; i < 50; i++) {
        printf(i < bars ? "#" : " ");
    }
    printf("] %3d%% (%zu/%zu bytes)", pct, done, total);
    fflush(stdout);
}

/* ============================================================
 * USB DFU Protocol (USB DFU 1.1 - usb.org spec)
 * ============================================================ */

/* DFU Request codes */
#define DFU_DETACH      0
#define DFU_DNLOAD      1
#define DFU_UPLOAD      2
#define DFU_GETSTATUS   3
#define DFU_CLRSTATUS   4
#define DFU_GETSTATE    5
#define DFU_ABORT       6

/* DFU States */
#define DFU_STATE_IDLE          2
#define DFU_STATE_DNLOAD_SYNC   3
#define DFU_STATE_DNBUSY        4
#define DFU_STATE_DNLOAD_IDLE   5
#define DFU_STATE_MANIFEST_SYNC 6
#define DFU_STATE_MANIFEST      7
#define DFU_STATE_MANIFEST_WAIT 8
#define DFU_STATE_UPLOAD_IDLE   9
#define DFU_STATE_ERROR         10

typedef struct __attribute__((packed)) {
    uint8_t  bStatus;
    uint8_t  bwPollTimeout[3];
    uint8_t  bState;
    uint8_t  iString;
} dfu_status_t;

static int dfu_get_status(libusb_device_handle* dev, dfu_status_t* st)
{
    return libusb_control_transfer(dev,
        LIBUSB_ENDPOINT_IN | LIBUSB_REQUEST_TYPE_CLASS | LIBUSB_RECIPIENT_INTERFACE,
        DFU_GETSTATUS,
        0, 0,
        (uint8_t*)st, sizeof(*st),
        5000);
}

static int dfu_download_block(libusb_device_handle* dev,
                               uint16_t block_num,
                               const uint8_t* data,
                               uint16_t len)
{
    return libusb_control_transfer(dev,
        LIBUSB_ENDPOINT_OUT | LIBUSB_REQUEST_TYPE_CLASS | LIBUSB_RECIPIENT_INTERFACE,
        DFU_DNLOAD,
        block_num, 0,
        (uint8_t*)data, len,
        5000);
}

static int dfu_clear_status(libusb_device_handle* dev)
{
    return libusb_control_transfer(dev,
        LIBUSB_ENDPOINT_OUT | LIBUSB_REQUEST_TYPE_CLASS | LIBUSB_RECIPIENT_INTERFACE,
        DFU_CLRSTATUS,
        0, 0, NULL, 0, 1000);
}

/* ============================================================
 * DFU upload (full device firmware update via DFU)
 * ============================================================ */

static int fw_upload_dfu(libusb_device_handle* dev,
                          const uint8_t* fw_data,
                          size_t fw_size)
{
    printf("[FW] Starting DFU download (%zu bytes)...\n", fw_size);

    dfu_status_t st;
    int r = dfu_get_status(dev, &st);
    if (r < 0) {
        fprintf(stderr, "[FW] DFU get status failed: %s\n", libusb_strerror(r));
        return -1;
    }

    if (st.bState == DFU_STATE_ERROR) {
        printf("[FW] Device in error state, clearing...\n");
        dfu_clear_status(dev);
        usleep(100000);
    }

    size_t offset = 0;
    uint16_t block = 0;

    while (offset < fw_size) {
        size_t chunk = fw_size - offset;
        if (chunk > FW_CHUNK) chunk = FW_CHUNK;

        r = dfu_download_block(dev, block, fw_data + offset, (uint16_t)chunk);
        if (r < 0) {
            fprintf(stderr, "\n[FW] DFU download block %d failed: %s\n",
                    block, libusb_strerror(r));
            return -1;
        }

        /* Poll until busy clears */
        do {
            usleep(10000);
            r = dfu_get_status(dev, &st);
            if (r < 0) {
                fprintf(stderr, "\n[FW] DFU get status failed during download\n");
                return -1;
            }
            if (st.bStatus != 0) {
                fprintf(stderr, "\n[FW] DFU error status: 0x%02X\n", st.bStatus);
                return -1;
            }
        } while (st.bState == DFU_STATE_DNBUSY);

        offset += chunk;
        block++;
        print_progress(offset, fw_size);
    }

    /* Send zero-length packet to finalize */
    r = dfu_download_block(dev, block, NULL, 0);
    if (r < 0) {
        fprintf(stderr, "\n[FW] DFU finalize failed: %s\n", libusb_strerror(r));
        return -1;
    }

    /* Wait for manifest */
    do {
        usleep(50000);
        r = dfu_get_status(dev, &st);
        if (r < 0) break;
    } while (st.bState == DFU_STATE_MANIFEST ||
             st.bState == DFU_STATE_MANIFEST_SYNC);

    printf("\n[FW] DFU download complete!\n");
    return 0;
}

/* ============================================================
 * Proprietary Softing firmware update protocol
 * (used when device is in normal mode, not DFU mode)
 * ============================================================ */

static int fw_upload_proprietary(const uint8_t* fw_data, size_t fw_size)
{
    printf("[FW] Starting proprietary firmware update (%zu bytes)...\n", fw_size);

    /* Step 1: Enter firmware update mode */
    int r = vas6154_usb_send_cmd(VAS6154_CMD_FW_UPDATE_START, 0,
                                  (const uint8_t*)&fw_size, sizeof(uint32_t));
    if (r < 0) {
        fprintf(stderr, "[FW] Failed to start firmware update\n");
        return -1;
    }

    uint16_t rsp_len = 0;
    r = vas6154_usb_recv_rsp(VAS6154_CMD_FW_UPDATE_START, NULL, 0, &rsp_len);
    if (r < 0) {
        fprintf(stderr, "[FW] Device rejected firmware update start\n");
        return -1;
    }

    printf("[FW] Device entered firmware update mode\n");
    usleep(200000);

    /* Step 2: Send firmware in chunks */
    size_t offset = 0;
    while (offset < fw_size) {
        size_t chunk = fw_size - offset;
        if (chunk > VAS6154_BULK_OUT_SIZE - 8) {
            chunk = VAS6154_BULK_OUT_SIZE - 8;
        }

        r = vas6154_usb_send_cmd(VAS6154_CMD_FW_UPDATE_DATA, 0,
                                  fw_data + offset, (uint16_t)chunk);
        if (r < 0) {
            fprintf(stderr, "\n[FW] Failed to send firmware chunk at offset %zu\n", offset);
            return -1;
        }

        r = vas6154_usb_recv_rsp(VAS6154_CMD_FW_UPDATE_DATA, NULL, 0, &rsp_len);
        if (r < 0) {
            fprintf(stderr, "\n[FW] Device error at offset %zu\n", offset);
            return -1;
        }

        offset += chunk;
        print_progress(offset, fw_size);
    }

    /* Step 3: Finalize */
    uint32_t fw_crc = crc32(fw_data, fw_size);
    r = vas6154_usb_send_cmd(VAS6154_CMD_FW_UPDATE_END, 0,
                              (uint8_t*)&fw_crc, sizeof(fw_crc));
    if (r < 0) {
        fprintf(stderr, "\n[FW] Failed to finalize firmware update\n");
        return -1;
    }

    r = vas6154_usb_recv_rsp(VAS6154_CMD_FW_UPDATE_END, NULL, 0, &rsp_len);
    if (r < 0) {
        fprintf(stderr, "\n[FW] CRC verification failed - firmware rejected\n");
        return -1;
    }

    printf("\n[FW] Firmware update successful!\n");
    printf("[FW] Device will reboot...\n");
    usleep(3000000); /* Wait for device reboot */
    return 0;
}

/* ============================================================
 * Main firmware update entry point
 * ============================================================ */

int vas6154_firmware_update(const char* fw_path)
{
    printf("╔══════════════════════════════════════════╗\n");
    printf("║   VAS 6154 Firmware Updater v1.0        ║\n");
    printf("║   DERHAN AutoMatrix Pro                  ║\n");
    printf("╚══════════════════════════════════════════╝\n\n");

    /* Load firmware file */
    FILE* f = fopen(fw_path, "rb");
    if (!f) {
        fprintf(stderr, "[FW] Cannot open firmware: %s (%s)\n",
                fw_path, strerror(errno));
        return -1;
    }

    fseek(f, 0, SEEK_END);
    long fsize = ftell(f);
    fseek(f, 0, SEEK_SET);

    if (fsize <= 0 || fsize > FW_MAX_SIZE) {
        fprintf(stderr, "[FW] Invalid firmware size: %ld\n", fsize);
        fclose(f);
        return -1;
    }

    uint8_t* fw_raw = malloc((size_t)fsize);
    if (!fw_raw) {
        fprintf(stderr, "[FW] Out of memory\n");
        fclose(f);
        return -1;
    }

    if (fread(fw_raw, 1, (size_t)fsize, f) != (size_t)fsize) {
        fprintf(stderr, "[FW] Read error\n");
        free(fw_raw);
        fclose(f);
        return -1;
    }
    fclose(f);

    /* Check firmware header */
    const uint8_t* fw_payload = fw_raw;
    size_t fw_payload_size    = (size_t)fsize;

    if (fsize >= (long)sizeof(fw_header_t)) {
        fw_header_t* hdr = (fw_header_t*)fw_raw;
        if (hdr->magic == FW_MAGIC) {
            printf("[FW] Softing firmware container detected\n");
            printf("[FW] Firmware version: %d.%d.%d\n",
                   hdr->fw_major, hdr->fw_minor, hdr->fw_patch);
            printf("[FW] Target HW: 0x%02X\n", hdr->target_hw);
            printf("[FW] Payload size: %u bytes\n", hdr->payload_size);

            if (hdr->target_hw != 0x01) {
                fprintf(stderr, "[FW] Firmware not for VAS 6154 (target_hw=0x%02X)\n",
                        hdr->target_hw);
                free(fw_raw);
                return -1;
            }

            fw_payload      = fw_raw + sizeof(fw_header_t);
            fw_payload_size = hdr->payload_size;

            /* Verify CRC */
            uint32_t calc_crc = crc32(fw_payload, fw_payload_size);
            if (calc_crc != hdr->crc32) {
                fprintf(stderr, "[FW] CRC32 mismatch! File corrupt? (calc=%08X expect=%08X)\n",
                        calc_crc, hdr->crc32);
                free(fw_raw);
                return -1;
            }
            printf("[FW] CRC32 OK: %08X\n", calc_crc);
        }
    }

    printf("[FW] Loading firmware: %s (%zu bytes)\n\n", fw_path, fw_payload_size);

    /* Initialize USB */
    int r = vas6154_usb_init();
    if (r < 0) { free(fw_raw); return -1; }

    /* Check if device is in DFU mode */
    libusb_context* ctx = NULL;
    libusb_init(&ctx);

    libusb_device_handle* dfu_dev = libusb_open_device_with_vid_pid(
        ctx, VAS6154_USB_VID, VAS6154_USB_PID_DFU);

    if (dfu_dev) {
        printf("[FW] Device is in DFU mode - using USB DFU protocol\n");
        libusb_claim_interface(dfu_dev, 0);
        r = fw_upload_dfu(dfu_dev, fw_payload, fw_payload_size);
        libusb_release_interface(dfu_dev, 0);
        libusb_close(dfu_dev);
    } else {
        printf("[FW] Device in normal mode - using proprietary update protocol\n");
        libusb_exit(ctx);

        r = vas6154_usb_open();
        if (r < 0) { free(fw_raw); return -1; }

        r = fw_upload_proprietary(fw_payload, fw_payload_size);
        vas6154_usb_close();
    }

    vas6154_usb_exit();
    free(fw_raw);

    if (r == 0) {
        printf("\n✓ Firmware update completed successfully!\n");
        printf("  Reconnect the VAS 6154 if needed.\n");
    } else {
        fprintf(stderr, "\n✗ Firmware update FAILED\n");
        fprintf(stderr, "  Do NOT disconnect the device.\n");
        fprintf(stderr, "  Try again in DFU mode (hold button + plug USB).\n");
    }
    return r;
}

/* ============================================================
 * Standalone firmware update tool entry point
 * ============================================================ */

#ifdef FW_LOADER_STANDALONE

int main(int argc, char* argv[])
{
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <firmware.bin>\n", argv[0]);
        fprintf(stderr, "\nVAS 6154 Firmware Update Tool\n");
        fprintf(stderr, "DERHAN AutoMatrix Pro\n\n");
        fprintf(stderr, "To enter DFU mode manually:\n");
        fprintf(stderr, "  Unplug the VAS 6154\n");
        fprintf(stderr, "  Hold the reset button\n");
        fprintf(stderr, "  Plug in USB while holding button\n");
        fprintf(stderr, "  LED should flash rapidly\n\n");
        fprintf(stderr, "Then run: %s vas6154_vX.Y.Z.bin\n", argv[0]);
        return 1;
    }

    return vas6154_firmware_update(argv[1]) == 0 ? 0 : 1;
}

#endif /* FW_LOADER_STANDALONE */
