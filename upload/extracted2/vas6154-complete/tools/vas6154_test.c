/*
 * vas6154_test.c - VAS 6154 Diagnostic & Test Tool
 * DERHAN AutoMatrix Pro
 *
 * Full diagnostic tool: device detection, UDS communication test,
 * CAN sniffing, ISO-TP echo test
 *
 * Usage:
 *   vas6154-test info        - Show device info
 *   vas6154-test scan        - Scan for devices
 *   vas6154-test uds <addr>  - Send UDS 0x22 F190 (VIN read)
 *   vas6154-test sniff       - CAN bus sniffer
 *   vas6154-test echo        - ISO-TP echo test (loopback)
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <unistd.h>
#include <stdint.h>

#include "../include/dpdu_api.h"
#include "../include/vas6154.h"
#include "../src/usb/vas6154_usb.h"

static volatile int g_stop = 0;

static void sig_handler(int sig) { (void)sig; g_stop = 1; }

/* ============================================================
 * Hex dump helper
 * ============================================================ */

static void hexdump(const uint8_t* data, size_t len, const char* prefix)
{
    for (size_t i = 0; i < len; i++) {
        if (i % 16 == 0) printf("%s%04zX: ", prefix, i);
        printf("%02X ", data[i]);
        if (i % 16 == 15) printf("\n");
    }
    if (len % 16 != 0) printf("\n");
}

/* ============================================================
 * Command: info
 * ============================================================ */

static int cmd_info(void)
{
    printf("═══════════════════════════════════════════\n");
    printf("  VAS 6154 Device Information\n");
    printf("  DERHAN AutoMatrix Pro\n");
    printf("═══════════════════════════════════════════\n\n");

    int r = vas6154_usb_init();
    if (r < 0) return 1;

    r = vas6154_usb_open();
    if (r < 0) {
        vas6154_usb_exit();
        return 1;
    }

    vas6154_info_payload_t info;
    r = vas6154_get_info(&info);

    if (r == 0) {
        printf("  ┌─────────────────────────────────────┐\n");
        printf("  │ Hardware                             │\n");
        printf("  ├─────────────────────────────────────┤\n");
        printf("  │ Serial:      %-22s │\n", info.serial);
        printf("  │ HW Version:  v%d.%-20d │\n",
               info.hw_version_major, info.hw_version_minor);
        printf("  │ FW Version:  v%d.%d.%d (%s)%*s │\n",
               info.fw_version_major, info.fw_version_minor,
               info.fw_version_patch, info.fw_date,
               (int)(10 - strlen(info.fw_date)), "");
        printf("  ├─────────────────────────────────────┤\n");
        printf("  │ Capabilities                         │\n");
        printf("  ├─────────────────────────────────────┤\n");
        printf("  │ CAN channels: %-22d │\n", info.num_can_channels);
        printf("  │ CAN-FD:       %-22s │\n", info.can_fd_capable ? "YES" : "NO");
        printf("  │ DoIP:         %-22s │\n", info.doip_capable   ? "YES" : "NO");
        printf("  └─────────────────────────────────────┘\n");
    } else {
        printf("  [!] Could not read device info\n");
        printf("      Device connected but firmware may be outdated\n");
    }

    vas6154_usb_close();
    vas6154_usb_exit();
    return 0;
}

/* ============================================================
 * Command: scan - enumerate all connected VAS interfaces
 * ============================================================ */

static int cmd_scan(void)
{
    printf("Scanning for VAS 6154 devices...\n\n");

    int r = vas6154_usb_init();
    if (r < 0) return 1;

    vas6154_dev_info_t devs[8];
    int found = vas6154_enumerate_devices(devs, 8);

    if (found <= 0) {
        printf("  No VAS 6154 devices found.\n\n");
        printf("  Troubleshooting:\n");
        printf("  1) Check USB connection: lsusb | grep 19b2\n");
        printf("  2) Check udev rules: ls -la /etc/udev/rules.d/99-vas6154.rules\n");
        printf("  3) Check permissions: groups | grep plugdev\n");
        printf("  4) Reload udev: sudo udevadm control --reload-rules\n");
        vas6154_usb_exit();
        return 1;
    }

    printf("  Found %d device(s):\n\n", found);
    for (int i = 0; i < found; i++) {
        printf("  [%d] %s\n", i, devs[i].name);
        printf("       VID=%04X  PID=%04X  Bus=%03d  Address=%03d\n",
               devs[i].vid, devs[i].pid, devs[i].bus, devs[i].port);
    }

    vas6154_usb_exit();
    return 0;
}

/* ============================================================
 * Command: uds - send UDS ReadDataByIdentifier (0x22)
 * ============================================================ */

static int cmd_uds(uint32_t tx_id, uint32_t rx_id)
{
    printf("UDS Test: ReadDataByIdentifier 0x22 0xF1 0x90 (VIN)\n");
    printf("  TX: 0x%08X  RX: 0x%08X\n\n", tx_id, rx_id);

    PDU_HANDLE hModule = PDU_HANDLE_UNDEF;
    PDU_HANDLE hCoL    = PDU_HANDLE_UNDEF;
    PDU_HANDLE hCop    = PDU_HANDLE_UNDEF;

    /* Initialize D-PDU API */
    PDU_STATUS st = PDUConstruct(NULL, NULL);
    if (st != PDU_STATUS_NOERROR) {
        fprintf(stderr, "PDUConstruct failed: %s\n", PDUGetErrorText(st));
        return 1;
    }

    st = PDUModuleConnect(&hModule, NULL);
    if (st != PDU_STATUS_NOERROR) {
        fprintf(stderr, "PDUModuleConnect failed: %s\n", PDUGetErrorText(st));
        PDUDestruct();
        return 1;
    }

    /* Open CAN channel 0, ISO-TP */
    PDU_UNUM32 rsc_ids[] = { VAS6154_RSC_ID_CAN_CH0 };
    st = PDUConnect(hModule,
                    PDU_RSC_ID_ISO_15765_2,
                    0,
                    rsc_ids, 1,
                    &hCoL);
    if (st != PDU_STATUS_NOERROR) {
        fprintf(stderr, "PDUConnect failed: %s\n", PDUGetErrorText(st));
        PDUModuleDisconnect(hModule);
        PDUDestruct();
        return 1;
    }

    /* Set ComParams */
    PDU_PARAM_ITEM param;
    param.ParamId = PDU_CPID_BAUDRATE;
    param.ParamValue = VAS6154_CAN_BAUD_500K;
    PDUSetComParam(hModule, hCoL, PDU_CPID_BAUDRATE, &param);

    param.ParamId = PDU_CPID_CAN_ID_TX;
    param.ParamValue = tx_id;
    PDUSetComParam(hModule, hCoL, PDU_CPID_CAN_ID_TX, &param);

    param.ParamId = PDU_CPID_CAN_ID_RX;
    param.ParamValue = rx_id;
    PDUSetComParam(hModule, hCoL, PDU_CPID_CAN_ID_RX, &param);

    /* Start communication */
    st = PDUStartComPrimitive(hModule, hCoL, PDU_COPT_STARTCOMM,
                               0, NULL, NULL, &hCop);
    if (st != PDU_STATUS_NOERROR) {
        fprintf(stderr, "PDUStartComPrimitive (STARTCOMM) failed: %s\n",
                PDUGetErrorText(st));
        goto cleanup;
    }
    usleep(200000);

    /* UDS request: 22 F1 90 (ReadDataByIdentifier VIN) */
    uint8_t uds_req[] = { 0x22, 0xF1, 0x90 };
    printf("  → Sending UDS request: ");
    for (size_t i = 0; i < sizeof(uds_req); i++) printf("%02X ", uds_req[i]);
    printf("\n");

    st = PDUStartComPrimitive(hModule, hCoL, PDU_COPT_SENDRECV,
                               sizeof(uds_req), uds_req, NULL, &hCop);
    if (st != PDU_STATUS_NOERROR) {
        fprintf(stderr, "PDUStartComPrimitive (SENDRECV) failed: %s\n",
                PDUGetErrorText(st));
        goto cleanup;
    }

    /* Wait for response with timeout */
    printf("  Waiting for response");
    uint8_t rx_buf[256];
    PDU_UNUM32 rx_len = sizeof(rx_buf);
    PDU_UNUM32 rx_count, timestamp;
    int waited = 0;

    while (waited < 50) {   /* 5 second timeout */
        PDU_EVENT_ITEM* evt = NULL;
        st = PDUGetEventItem(hModule, hCoL, &evt);

        if (st == PDU_STATUS_NOERROR && evt) {
            if (evt->EventCode == PDU_EVT_RESULT_AVAILABLE ||
                evt->EventCode == PDU_EVT_COP_DONE) {
                printf("\n");
                PDU_STATUS gst = PDUGetResult(hModule, hCoL, evt->hCop,
                                               rx_buf, &rx_len,
                                               &rx_count, &timestamp);
                if (gst == PDU_STATUS_NOERROR && rx_len > 0) {
                    printf("  ← Response (%u bytes, t=%u µs):\n", rx_len, timestamp);
                    hexdump(rx_buf, rx_len, "     ");

                    /* Parse UDS positive response */
                    if (rx_len > 3 && rx_buf[0] == 0x62 &&
                        rx_buf[1] == 0xF1 && rx_buf[2] == 0x90) {
                        printf("  VIN: ");
                        for (PDU_UNUM32 i = 3; i < rx_len; i++) {
                            printf("%c", (rx_buf[i] >= 0x20 && rx_buf[i] < 0x7F)
                                         ? rx_buf[i] : '?');
                        }
                        printf("\n");
                    } else if (rx_len > 0 && rx_buf[0] == 0x7F) {
                        printf("  UDS NRC: 0x%02X (%s)\n", rx_buf[2],
                               rx_buf[2] == 0x31 ? "RequestOutOfRange" :
                               rx_buf[2] == 0x22 ? "ConditionsNotCorrect" :
                               "Unknown NRC");
                    }
                }
                PDUFreeEventItem(hModule, evt);
                break;
            }
            PDUFreeEventItem(hModule, evt);
        }

        usleep(100000);
        waited++;
        printf(".");
        fflush(stdout);
    }

    if (waited >= 50) {
        printf("\n  [TIMEOUT] No response received\n");
    }

cleanup:
    PDUDisconnect(hModule, hCoL);
    PDUModuleDisconnect(hModule);
    PDUDestruct();
    return 0;
}

/* ============================================================
 * Command: sniff - raw CAN bus sniffer
 * ============================================================ */

static void sniff_event_cb(uint8_t evt, uint8_t ch, uint32_t ts,
                            const uint8_t* data, uint16_t len, void* ud)
{
    (void)ud;
    if (evt != 0x01) return;
    if (len < 5) return;

    vas6154_can_frame_t* f = (vas6154_can_frame_t*)data;
    uint32_t id = f->can_id & 0x1FFFFFFF;
    int ext = (f->can_id >> 31) & 1;

    printf("[%10u µs] ch%d %s%08X [%d] ",
           ts, ch, ext ? "X" : " ", id, f->dlc & 0x0F);
    for (int i = 0; i < (f->dlc & 0x0F) && i < 8; i++) {
        printf("%02X ", f->data[i]);
    }
    printf("\n");
    (void)len;
}

static int cmd_sniff(void)
{
    printf("CAN Sniffer - Press Ctrl+C to stop\n\n");
    printf("%-12s %-4s %-12s %-6s %s\n",
           "Timestamp", "Ch", "CAN ID", "DLC", "Data");
    printf("─────────────────────────────────────────────────\n");

    signal(SIGINT, sig_handler);

    int r = vas6154_usb_init();
    if (r < 0) return 1;
    r = vas6154_usb_open();
    if (r < 0) { vas6154_usb_exit(); return 1; }

    vas6154_register_event_cb(sniff_event_cb, NULL);
    vas6154_open_channel(0, VAS6154_CAN_BAUD_500K);

    while (!g_stop) {
        usleep(1000);
    }

    printf("\n[Sniffer stopped]\n");
    vas6154_close_channel(0);
    vas6154_usb_close();
    vas6154_usb_exit();
    return 0;
}

/* ============================================================
 * Main
 * ============================================================ */

int main(int argc, char* argv[])
{
    printf("\n");
    printf("  ██████╗ ███████╗██████╗ ██╗  ██╗ █████╗ ███╗\n");
    printf("  ██╔══██╗██╔════╝██╔══██╗██║  ██║██╔══██╗████║\n");
    printf("  ██║  ██║█████╗  ██████╔╝███████║███████║╚██╔╝\n");
    printf("  ██║  ██║██╔══╝  ██╔══██╗██╔══██║██╔══██║ ██║\n");
    printf("  ██████╔╝███████╗██║  ██║██║  ██║██║  ██║ ██║\n");
    printf("  ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═╝\n");
    printf("  VAS 6154 Linux Driver Test Tool\n");
    printf("  DERHAN AutoMatrix Pro\n\n");

    if (argc < 2) {
        printf("Usage: %s <command> [args]\n\n", argv[0]);
        printf("Commands:\n");
        printf("  info            - Show device info\n");
        printf("  scan            - Scan for connected devices\n");
        printf("  uds [txid rxid] - UDS VIN read (default: 7DF/7E8)\n");
        printf("  sniff           - CAN bus sniffer\n");
        return 1;
    }

    if (strcmp(argv[1], "info") == 0) {
        return cmd_info();
    } else if (strcmp(argv[1], "scan") == 0) {
        return cmd_scan();
    } else if (strcmp(argv[1], "uds") == 0) {
        uint32_t tx = 0x7DF, rx = 0x7E8;
        if (argc >= 4) {
            tx = (uint32_t)strtol(argv[2], NULL, 16);
            rx = (uint32_t)strtol(argv[3], NULL, 16);
        }
        return cmd_uds(tx, rx);
    } else if (strcmp(argv[1], "sniff") == 0) {
        return cmd_sniff();
    } else {
        fprintf(stderr, "Unknown command: %s\n", argv[1]);
        return 1;
    }
}
