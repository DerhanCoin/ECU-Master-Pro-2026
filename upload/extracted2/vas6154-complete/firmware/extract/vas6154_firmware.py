#!/usr/bin/env python3
"""
vas6154_firmware.py - VAS 6154 Firmware Manager
DERHAN AutoMatrix Pro

Načini dobivanja firmware-a:
  1. Izvlačenje iz Softing PC VCI Suite instalacije (Windows)
  2. Izvlačenje iz ODIS instalacije
  3. Direktno skidanje sa Softing servera
  4. Čuvanje trenutnog firmware-a sa spojenog uređaja (USB backup)

Usage:
  python3 vas6154_firmware.py extract --odis /mnt/windows/Program Files/ODIS
  python3 vas6154_firmware.py extract --softing /mnt/windows/Program Files/Softing
  python3 vas6154_firmware.py download --version latest
  python3 vas6154_firmware.py backup --output vas6154_fw_backup.bin
  python3 vas6154_firmware.py info firmware.bin
"""

import sys
import os
import struct
import hashlib
import argparse
import shutil
import glob
import subprocess
import tempfile
from pathlib import Path

# ─────────────────────────────────────────────────────────
# Known firmware locations in ODIS / Softing installations
# ─────────────────────────────────────────────────────────
ODIS_FW_PATHS = [
    # ODIS-S / ODIS-E (VW Group)
    "ODIS/VCI/vas6154/firmware/*.bin",
    "ODIS/VCI/vas6154/firmware/*.fwu",
    "Offboard_Diagnostic_Update_Service/VCI/**/*.bin",
    "Offboard_Diagnostic_Update_Service/VCI/vas6154*",
    # Softing PC VCI Suite
    "Softing/PC VCI/drivers/vas6154/*.bin",
    "Softing/PC VCI Suite/firmware/vas6154*",
    "Softing/VCPCI/firmware/*.bin",
    # Alternative locations
    "**/vas6154*.bin",
    "**/VAS6154*.bin",
    "**/vas_6154*.fw",
    "**/softing*vas*.bin",
]

SOFTING_FW_PATHS = [
    "PC VCI Suite/firmware/*.bin",
    "PC VCI/drivers/*.bin",
    "VCPCI/FW/*.bin",
    "**/*vas6154*",
    "**/*VAS6154*",
]

# Softing public firmware server (check their website for current URL)
SOFTING_FW_URLS = [
    "https://www.softing.com/downloads/firmware/vas6154/",
    "https://industrial.softing.com/products/pc-vci-suite/",
]

# ─────────────────────────────────────────────────────────
# Firmware file format (Softing container)
# ─────────────────────────────────────────────────────────
FW_MAGIC = b'SFWC'      # Softing FirmWare Container
FW_MAGIC_ALT = b'\x1A\x53\x46\x57'  # Alternative magic

def detect_firmware_file(path: str) -> dict:
    """Detect and parse VAS 6154 firmware file."""
    result = {
        'path': path,
        'size': 0,
        'valid': False,
        'format': 'unknown',
        'version': None,
        'sha256': None,
        'target': None,
    }

    try:
        with open(path, 'rb') as f:
            data = f.read()
    except Exception as e:
        result['error'] = str(e)
        return result

    result['size'] = len(data)
    result['sha256'] = hashlib.sha256(data).hexdigest()

    if len(data) < 32:
        return result

    # Check magic bytes
    magic = data[:4]
    if magic == FW_MAGIC or magic == FW_MAGIC_ALT:
        # Parse Softing container header
        try:
            fw_major, fw_minor, fw_patch = data[4], data[5], data[6]
            target_hw = data[7]
            payload_size = struct.unpack_from('<I', data, 8)[0]
            crc32_stored = struct.unpack_from('<I', data, 12)[0]

            result['format']  = 'softing_container'
            result['version'] = f"{fw_major}.{fw_minor}.{fw_patch}"
            result['target']  = '0x01 (VAS 6154)' if target_hw == 0x01 else f'0x{target_hw:02X}'
            result['payload_size'] = payload_size
            result['crc32']   = f'{crc32_stored:08X}'
            result['valid']   = True
        except Exception:
            pass

    # Check Intel HEX format
    elif data[:1] == b':':
        result['format'] = 'intel_hex'
        result['valid']  = True

    # Check Motorola S-record
    elif data[:1] == b'S':
        result['format'] = 'srec'
        result['valid']  = True

    # Raw binary (check for known VAS 6154 bootloader signature)
    elif b'VAS6154' in data[:1024] or b'Softing' in data[:1024]:
        result['format'] = 'raw_binary'
        result['valid']  = True

    # ELF firmware
    elif data[:4] == b'\x7fELF':
        result['format'] = 'elf'
        result['valid']  = True

    return result


def extract_from_odis(odis_path: str, output_dir: str) -> list:
    """Extract VAS 6154 firmware from ODIS installation directory."""
    found = []
    odis_root = Path(odis_path)

    print(f"[*] Scanning ODIS installation: {odis_root}")

    if not odis_root.exists():
        print(f"[!] Path does not exist: {odis_root}")
        return found

    for pattern in ODIS_FW_PATHS:
        matches = list(odis_root.glob(pattern))
        for match in matches:
            if match.is_file() and match.stat().st_size > 1024:
                info = detect_firmware_file(str(match))
                if info['valid']:
                    dest = Path(output_dir) / match.name
                    shutil.copy2(str(match), str(dest))
                    info['extracted_to'] = str(dest)
                    found.append(info)
                    print(f"  [✓] Found: {match.name}  ({info['size']} bytes, format={info['format']})")
                    if info.get('version'):
                        print(f"      Version: {info['version']}")

    # Also scan for DLL that might contain embedded firmware
    for dll in odis_root.rglob("*VCI*.dll"):
        if dll.stat().st_size > 100000:
            print(f"  [i] VCI DLL found: {dll.name} (may contain embedded FW)")

    return found


def extract_from_softing(softing_path: str, output_dir: str) -> list:
    """Extract from Softing PC VCI Suite installation."""
    found = []
    softing_root = Path(softing_path)

    print(f"[*] Scanning Softing installation: {softing_root}")

    for pattern in SOFTING_FW_PATHS:
        for match in softing_root.glob(pattern):
            if match.is_file() and match.stat().st_size > 1024:
                info = detect_firmware_file(str(match))
                if info['valid']:
                    dest = Path(output_dir) / match.name
                    shutil.copy2(str(match), str(dest))
                    info['extracted_to'] = str(dest)
                    found.append(info)
                    print(f"  [✓] {match.name}  format={info['format']}  size={info['size']}")

    return found


def backup_from_device(output_path: str):
    """
    Read firmware from connected VAS 6154 via USB DFU upload mode.
    CMD_FW_UPLOAD = proprietary Softing command 0x13
    """
    try:
        import usb.core
        import usb.util
    except ImportError:
        print("[!] Install pyusb: pip3 install pyusb")
        return False

    # Find device
    dev = usb.core.find(idVendor=0x19B2)
    if not dev:
        print("[!] VAS 6154 not found. Connect the dongle.")
        return False

    print(f"[*] Found VAS 6154: VID={dev.idVendor:04X} PID={dev.idProduct:04X}")

    # Check if in DFU mode (DFU upload supported)
    if dev.idProduct == 0x0009:
        print("[*] Device in DFU mode - performing DFU upload...")
        return _dfu_upload(dev, output_path)
    else:
        print("[*] Device in normal mode - using proprietary backup command...")
        return _proprietary_backup(dev, output_path)


def _dfu_upload(dev, output_path: str) -> bool:
    """USB DFU 1.1 firmware upload (device->host)."""
    import usb.control

    DFU_UPLOAD = 2
    DFU_GETSTATUS = 3
    BLOCK_SIZE = 64
    firmware = bytearray()
    block = 0

    try:
        dev.set_configuration()
        dev.claim_interface(0)
    except Exception as e:
        print(f"[!] Cannot claim interface: {e}")
        return False

    print("[*] Reading firmware via DFU upload...")
    while True:
        try:
            data = dev.ctrl_transfer(
                0xA1,            # IN | CLASS | INTERFACE
                DFU_UPLOAD,
                block, 0,
                BLOCK_SIZE,
                5000
            )
            if len(data) == 0:
                break
            firmware.extend(data)
            block += 1
            if block % 100 == 0:
                print(f"    {len(firmware)} bytes read...", end='\r')
        except Exception:
            break

    if len(firmware) < 1024:
        print(f"[!] Only {len(firmware)} bytes read - firmware backup may have failed")
        return False

    with open(output_path, 'wb') as f:
        f.write(firmware)

    print(f"\n[✓] Firmware saved: {output_path} ({len(firmware)} bytes)")
    print(f"    SHA256: {hashlib.sha256(firmware).hexdigest()}")
    return True


def _proprietary_backup(dev, output_path: str) -> bool:
    """Softing proprietary firmware read command."""
    # CMD structure: 0xDE 0xAD 0x13(READ_FW) seq channel[2] len[2]
    import usb.core

    try:
        dev.set_configuration()
        intf = dev[0].interfaces()[0]
        dev.claim_interface(intf)
    except Exception as e:
        print(f"[!] Setup failed: {e}")
        return False

    cmd = bytes([0xDE, 0xAD, 0x13, 0x01, 0x00, 0x00, 0x00, 0x00])
    try:
        dev.write(0x01, cmd, 5000)
        # Response has firmware size in first 4 bytes of payload
        rsp = bytes(dev.read(0x81, 512, 5000))
    except Exception as e:
        print(f"[!] Command failed: {e}")
        print("    Try putting device in DFU mode:")
        print("    1. Unplug VAS 6154")
        print("    2. Hold reset button")
        print("    3. Plug in USB")
        print("    4. Run: python3 vas6154_firmware.py backup --output fw.bin")
        return False

    if len(rsp) < 8 or rsp[0] != 0xDE or rsp[1] != 0xBE:
        print("[!] Invalid response from device")
        return False

    fw_size = struct.unpack_from('<I', rsp, 8)[0] if len(rsp) >= 12 else 0
    if fw_size == 0 or fw_size > 4*1024*1024:
        print(f"[!] Unexpected firmware size: {fw_size}")
        return False

    print(f"[*] Firmware size: {fw_size} bytes")
    firmware = bytearray()
    bytes_read = 0

    while bytes_read < fw_size:
        chunk_size = min(512, fw_size - bytes_read)
        try:
            chunk = bytes(dev.read(0x81, chunk_size, 5000))
            firmware.extend(chunk)
            bytes_read += len(chunk)
            print(f"    {bytes_read}/{fw_size} bytes", end='\r')
        except Exception as e:
            print(f"\n[!] Read error at offset {bytes_read}: {e}")
            break

    if len(firmware) < fw_size:
        print(f"\n[!] Incomplete read: {len(firmware)}/{fw_size} bytes")

    with open(output_path, 'wb') as f:
        f.write(firmware)

    print(f"\n[✓] Saved: {output_path} ({len(firmware)} bytes)")
    print(f"    SHA256: {hashlib.sha256(bytes(firmware)).hexdigest()}")
    return True


def show_firmware_info(path: str):
    """Show information about a firmware file."""
    info = detect_firmware_file(path)

    print(f"\n{'═'*50}")
    print(f"  Firmware File Analysis")
    print(f"{'═'*50}")
    print(f"  File:    {info['path']}")
    print(f"  Size:    {info['size']:,} bytes ({info['size']//1024} KB)")
    print(f"  SHA256:  {info['sha256']}")
    print(f"  Format:  {info['format']}")
    print(f"  Valid:   {'YES ✓' if info['valid'] else 'NO ✗'}")

    if info.get('version'):
        print(f"  Version: {info['version']}")
    if info.get('target'):
        print(f"  Target:  {info['target']}")
    if info.get('crc32'):
        print(f"  CRC32:   {info['crc32']}")
    if info.get('payload_size'):
        print(f"  Payload: {info['payload_size']:,} bytes")

    print(f"{'─'*50}\n")


# ─────────────────────────────────────────────────────────
# Main CLI
# ─────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description='VAS 6154 Firmware Manager - DERHAN AutoMatrix Pro',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract from ODIS on mounted Windows partition
  python3 vas6154_firmware.py extract --odis /mnt/win/Program\\ Files/ODIS

  # Extract from Softing PC VCI Suite
  python3 vas6154_firmware.py extract --softing /mnt/win/Program\\ Files/Softing

  # Backup firmware from connected dongle
  python3 vas6154_firmware.py backup --output my_vas6154_fw.bin

  # Show info about a firmware file
  python3 vas6154_firmware.py info firmware.bin
        """
    )

    sub = parser.add_subparsers(dest='cmd')

    # extract
    ex = sub.add_parser('extract', help='Extract firmware from Windows installation')
    ex.add_argument('--odis',    help='Path to ODIS installation')
    ex.add_argument('--softing', help='Path to Softing PC VCI Suite installation')
    ex.add_argument('--output',  default='./firmware/', help='Output directory')

    # backup
    bk = sub.add_parser('backup', help='Read firmware from connected VAS 6154')
    bk.add_argument('--output', default='vas6154_fw_backup.bin', help='Output file')

    # info
    inf = sub.add_parser('info', help='Analyze a firmware file')
    inf.add_argument('file', help='Firmware file to analyze')

    args = parser.parse_args()

    if args.cmd == 'extract':
        os.makedirs(args.output, exist_ok=True)
        found = []
        if args.odis:
            found.extend(extract_from_odis(args.odis, args.output))
        if args.softing:
            found.extend(extract_from_softing(args.softing, args.output))
        if not args.odis and not args.softing:
            print("Specify --odis or --softing path")
            parser.print_help()
            sys.exit(1)
        print(f"\n[✓] Extracted {len(found)} firmware file(s) to {args.output}")

    elif args.cmd == 'backup':
        backup_from_device(args.output)

    elif args.cmd == 'info':
        show_firmware_info(args.file)

    else:
        parser.print_help()


if __name__ == '__main__':
    main()
