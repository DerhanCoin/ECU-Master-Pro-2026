#!/usr/bin/env python3
"""
vas6154d.py - VAS 6154 Detection Daemon
DERHAN AutoMatrix Pro

Radi kao systemd servis u pozadini.
Prati USB hotplug evente (udev), otkriva VAS 6154,
i objavljuje status kroz:
  1. Unix socket:  /run/vas6154/status.sock
  2. JSON file:    /run/vas6154/devices.json
  3. DBus signal:  org.derhan.VAS6154.DeviceAdded/Removed

Vaša ECU Master Pro aplikacija se spaja na socket i
odmah dobiva listu svih spojenih VAS 6154 dogleova -
identično kao ODIS na Windowsu koji skenira VCI registry.
"""

import os
import sys
import json
import time
import socket
import signal
import struct
import threading
import glob
import logging
import subprocess
from pathlib import Path
from datetime import datetime

# ─────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────
RUN_DIR         = "/run/vas6154"
STATUS_SOCK     = f"{RUN_DIR}/status.sock"
DEVICES_JSON    = f"{RUN_DIR}/devices.json"
PID_FILE        = f"{RUN_DIR}/vas6154d.pid"
LOG_FILE        = "/var/log/vas6154d.log"
SYSFS_CLASS     = "/sys/class/vas6154"
DEV_PATTERN     = "/dev/vas6154_*"
VAS6154_VID     = "19b2"
POLL_INTERVAL   = 2.0   # seconds between USB polls

# USB PIDs for VAS 6154
VAS6154_PIDS = {"0003", "0008", "000c", "0009", "000a"}

# ─────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [vas6154d] %(levelname)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
    ]
)
log = logging.getLogger("vas6154d")

# ─────────────────────────────────────────────────────────
# Device discovery
# ─────────────────────────────────────────────────────────

def read_sysfs(path: str, default="") -> str:
    """Read a sysfs attribute."""
    try:
        return Path(path).read_text().strip()
    except Exception:
        return default


def discover_via_sysfs() -> list:
    """Discover connected VAS 6154 devices via /sys/class/vas6154/."""
    devices = []
    sysfs_path = Path(SYSFS_CLASS)

    if not sysfs_path.exists():
        return devices

    for entry in sorted(sysfs_path.iterdir()):
        if not entry.is_dir():
            continue

        dev_name = entry.name  # e.g. "vas6154_0"
        dev_node = f"/dev/{dev_name}"

        dev = {
            "name":        dev_name,
            "device_node": dev_node,
            "serial":      read_sysfs(entry / "serial",     "UNKNOWN"),
            "fw_version":  read_sysfs(entry / "fw_version", "?.?.?"),
            "hw_version":  read_sysfs(entry / "hw_version", "?.?"),
            "can_fd":      read_sysfs(entry / "can_fd",     "0") == "1",
            "available":   os.path.exists(dev_node),
            "source":      "sysfs",
            "discovered":  datetime.utcnow().isoformat() + "Z",
        }

        # Get USB info from sysfs parent
        uevent_path = entry / "device" / "uevent"
        if uevent_path.exists():
            for line in uevent_path.read_text().splitlines():
                if "=" in line:
                    k, v = line.split("=", 1)
                    if k == "PRODUCT":
                        parts = v.split("/")
                        if len(parts) >= 2:
                            dev["usb_vid"] = parts[0]
                            dev["usb_pid"] = parts[1]

        devices.append(dev)

    return devices


def discover_via_usbfs() -> list:
    """Fallback: discover via /sys/bus/usb/devices/ scan."""
    devices = []

    for bus_path in glob.glob("/sys/bus/usb/devices/*/"):
        try:
            idVendor  = read_sysfs(f"{bus_path}idVendor")
            idProduct = read_sysfs(f"{bus_path}idProduct")

            if idVendor != VAS6154_VID:
                continue
            if idProduct not in VAS6154_PIDS:
                continue

            serial   = read_sysfs(f"{bus_path}serial", "UNKNOWN")
            product  = read_sysfs(f"{bus_path}product", "VAS 6154")
            bus_num  = read_sysfs(f"{bus_path}busnum")
            dev_num  = read_sysfs(f"{bus_path}devnum")
            speed    = read_sysfs(f"{bus_path}speed")

            mode_map = {
                "0003": "operational_v1",
                "0008": "operational_v2",
                "000c": "operational_v3_canfd",
                "0009": "dfu",
                "000a": "bootloader",
            }

            devices.append({
                "name":        f"vas6154_usb_{bus_num}_{dev_num}",
                "device_node": None,   # No /dev node (kernel module not loaded)
                "serial":      serial,
                "product":     product,
                "usb_vid":     idVendor,
                "usb_pid":     idProduct,
                "usb_bus":     bus_num,
                "usb_address": dev_num,
                "usb_speed":   speed,
                "mode":        mode_map.get(idProduct, "unknown"),
                "can_fd":      idProduct == "000c",
                "fw_version":  "?.?.?",
                "hw_version":  "?.?",
                "available":   True,
                "source":      "usbfs",
                "discovered":  datetime.utcnow().isoformat() + "Z",
                "warning":     "Kernel module not loaded - /dev/vas6154_N not created",
            })

        except Exception:
            continue

    return devices


def discover_all() -> list:
    """Discover all VAS 6154 devices using all available methods."""
    devices = []

    # Method 1: sysfs (kernel module loaded)
    sysfs_devs = discover_via_sysfs()
    devices.extend(sysfs_devs)

    # Method 2: usbfs fallback (kernel module not loaded)
    if not sysfs_devs:
        usbfs_devs = discover_via_usbfs()
        devices.extend(usbfs_devs)

    # Method 3: libusb via lsusb
    if not devices:
        try:
            out = subprocess.check_output(
                ["lsusb", "-d", f"{VAS6154_VID}:"],
                stderr=subprocess.DEVNULL, text=True, timeout=3
            )
            for line in out.strip().splitlines():
                if line:
                    devices.append({
                        "name":        "vas6154_lsusb",
                        "device_node": None,
                        "serial":      "UNKNOWN",
                        "fw_version":  "?.?.?",
                        "available":   True,
                        "source":      "lsusb",
                        "lsusb_line":  line.strip(),
                        "warning":     "Detected via lsusb only - install kernel module",
                        "discovered":  datetime.utcnow().isoformat() + "Z",
                    })
        except Exception:
            pass

    return devices


# ─────────────────────────────────────────────────────────
# Status JSON writer
# ─────────────────────────────────────────────────────────

def write_status_json(devices: list):
    """Write current device list to JSON file."""
    os.makedirs(RUN_DIR, mode=0o755, exist_ok=True)

    status = {
        "version":       "1.0",
        "daemon":        "vas6154d",
        "timestamp":     datetime.utcnow().isoformat() + "Z",
        "device_count":  len(devices),
        "devices":       devices,
        "kernel_module": os.path.exists(SYSFS_CLASS),
        "dpdu_library":  (
            os.path.exists("/usr/local/lib/libdpdu_vas6154.so") or
            os.path.exists("/usr/lib/libdpdu_vas6154.so")
        ),
        "dpdu_registry": "/etc/dpdu/modules.xml",
    }

    tmp = DEVICES_JSON + ".tmp"
    with open(tmp, 'w') as f:
        json.dump(status, f, indent=2)
    os.rename(tmp, DEVICES_JSON)


# ─────────────────────────────────────────────────────────
# Unix socket server
# Clients (ECU Master Pro, etc.) connect here to get device list
# ─────────────────────────────────────────────────────────

class SocketServer:
    PROTOCOL_VERSION = 1

    def __init__(self, sock_path: str):
        self.sock_path   = sock_path
        self.devices     = []
        self.clients     = []
        self.lock        = threading.Lock()
        self._sock       = None
        self._running    = False

    def start(self):
        os.makedirs(RUN_DIR, mode=0o755, exist_ok=True)
        try:
            os.unlink(self.sock_path)
        except FileNotFoundError:
            pass

        self._sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self._sock.bind(self.sock_path)
        os.chmod(self.sock_path, 0o666)
        self._sock.listen(16)
        self._running = True

        t = threading.Thread(target=self._accept_loop, daemon=True)
        t.start()
        log.info(f"Listening on {self.sock_path}")

    def stop(self):
        self._running = False
        if self._sock:
            self._sock.close()

    def update_devices(self, devices: list):
        with self.lock:
            self.devices = devices
        # Notify all connected clients
        self._broadcast({
            "type":    "device_update",
            "devices": devices,
            "count":   len(devices),
        })

    def _accept_loop(self):
        while self._running:
            try:
                self._sock.settimeout(1.0)
                try:
                    conn, _ = self._sock.accept()
                except socket.timeout:
                    continue

                t = threading.Thread(
                    target=self._handle_client,
                    args=(conn,), daemon=True
                )
                t.start()
            except Exception as e:
                if self._running:
                    log.error(f"Accept error: {e}")

    def _handle_client(self, conn: socket.socket):
        with self.lock:
            self.clients.append(conn)

        try:
            # Send current device list immediately on connect
            with self.lock:
                devs = self.devices[:]

            self._send_msg(conn, {
                "type":    "hello",
                "daemon":  "vas6154d",
                "version": self.PROTOCOL_VERSION,
                "devices": devs,
                "count":   len(devs),
            })

            # Handle client requests
            conn.settimeout(60.0)
            while True:
                try:
                    header = self._recv_exact(conn, 4)
                    if not header:
                        break
                    msg_len = struct.unpack('<I', header)[0]
                    if msg_len > 65536:
                        break
                    msg_data = self._recv_exact(conn, msg_len)
                    if not msg_data:
                        break
                    msg = json.loads(msg_data)
                    self._handle_msg(conn, msg)
                except (socket.timeout, ConnectionResetError):
                    break
                except Exception as e:
                    log.debug(f"Client error: {e}")
                    break
        finally:
            with self.lock:
                try:
                    self.clients.remove(conn)
                except ValueError:
                    pass
            conn.close()

    def _handle_msg(self, conn, msg: dict):
        cmd = msg.get("cmd", "")

        if cmd == "list":
            with self.lock:
                devs = self.devices[:]
            self._send_msg(conn, {
                "type":    "device_list",
                "devices": devs,
                "count":   len(devs),
            })

        elif cmd == "ping":
            self._send_msg(conn, {"type": "pong", "ts": time.time()})

        elif cmd == "status":
            self._send_msg(conn, {
                "type":          "status",
                "device_count":  len(self.devices),
                "kernel_module": os.path.exists(SYSFS_CLASS),
                "dpdu_library":  (
                    os.path.exists("/usr/local/lib/libdpdu_vas6154.so") or
                    os.path.exists("/usr/lib/libdpdu_vas6154.so")
                ),
                "uptime":        time.time(),
            })

    def _send_msg(self, conn, data: dict):
        try:
            payload = json.dumps(data).encode('utf-8')
            header  = struct.pack('<I', len(payload))
            conn.sendall(header + payload)
        except Exception:
            pass

    def _recv_exact(self, conn, n: int) -> bytes:
        buf = b''
        while len(buf) < n:
            chunk = conn.recv(n - len(buf))
            if not chunk:
                return b''
            buf += chunk
        return buf

    def _broadcast(self, data: dict):
        with self.lock:
            clients = self.clients[:]
        for c in clients:
            self._send_msg(c, data)


# ─────────────────────────────────────────────────────────
# Main daemon loop
# ─────────────────────────────────────────────────────────

class VAS6154Daemon:
    def __init__(self):
        self.server      = SocketServer(STATUS_SOCK)
        self.prev_devs   = []
        self._running    = False

    def start(self):
        log.info("vas6154d starting (DERHAN AutoMatrix Pro)")
        log.info(f"  Socket:  {STATUS_SOCK}")
        log.info(f"  Status:  {DEVICES_JSON}")
        log.info(f"  Sysfs:   {SYSFS_CLASS}")

        # Write PID file
        os.makedirs(RUN_DIR, mode=0o755, exist_ok=True)
        with open(PID_FILE, 'w') as f:
            f.write(str(os.getpid()))

        # Setup signal handlers
        signal.signal(signal.SIGTERM, self._sig_handler)
        signal.signal(signal.SIGINT,  self._sig_handler)

        self.server.start()
        self._running = True
        self._main_loop()

    def _sig_handler(self, sig, frame):
        log.info(f"Signal {sig} received, shutting down...")
        self._running = False

    def _main_loop(self):
        log.info("Discovery loop started")
        while self._running:
            try:
                devices = discover_all()

                # Detect changes
                current_names = {d["name"] for d in devices}
                prev_names    = {d["name"] for d in self.prev_devs}

                added   = current_names - prev_names
                removed = prev_names - current_names

                for name in added:
                    dev = next(d for d in devices if d["name"] == name)
                    log.info(f"CONNECTED: {name}  serial={dev.get('serial','?')}  "
                             f"fw={dev.get('fw_version','?')}  node={dev.get('device_node','?')}")

                for name in removed:
                    log.info(f"DISCONNECTED: {name}")

                if added or removed or not self.prev_devs:
                    write_status_json(devices)
                    self.server.update_devices(devices)
                    self.prev_devs = devices

            except Exception as e:
                log.error(f"Discovery error: {e}")

            time.sleep(POLL_INTERVAL)

        # Cleanup
        self.server.stop()
        try:
            os.unlink(PID_FILE)
        except Exception:
            pass
        log.info("vas6154d stopped")


# ─────────────────────────────────────────────────────────
# Client helper (for ECU Master Pro / your application)
# ─────────────────────────────────────────────────────────

class VAS6154Client:
    """
    Use this class in your application to find VAS 6154 dongles.
    Equivalent to how ODIS scans for VCI modules on Windows.

    Usage:
        from vas6154d import VAS6154Client
        client = VAS6154Client()
        devices = client.list_devices()
        for d in devices:
            print(f"VAS 6154: {d['name']}  serial={d['serial']}  node={d['device_node']}")
    """

    def __init__(self, sock_path: str = STATUS_SOCK, timeout: float = 3.0):
        self.sock_path = sock_path
        self.timeout   = timeout

    def list_devices(self) -> list:
        """Get list of connected VAS 6154 devices."""
        # Try socket first (fast, if daemon running)
        try:
            return self._via_socket()
        except Exception:
            pass

        # Fallback: read JSON file
        try:
            with open(DEVICES_JSON) as f:
                data = json.load(f)
            return data.get("devices", [])
        except Exception:
            pass

        # Last resort: direct discovery
        return discover_all()

    def _via_socket(self) -> list:
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        s.settimeout(self.timeout)
        s.connect(self.sock_path)

        # Read hello message
        header = self._recv_exact(s, 4)
        msg_len = struct.unpack('<I', header)[0]
        data = json.loads(self._recv_exact(s, msg_len))
        s.close()

        return data.get("devices", [])

    def _recv_exact(self, s, n):
        buf = b''
        while len(buf) < n:
            chunk = s.recv(n - len(buf))
            if not chunk:
                break
            buf += chunk
        return buf

    def first_device(self) -> dict:
        """Return first available VAS 6154 or None."""
        devs = self.list_devices()
        for d in devs:
            if d.get("available") and d.get("device_node"):
                return d
        return devs[0] if devs else None


# ─────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'status':
        # Quick status check
        client = VAS6154Client()
        devs = client.list_devices()
        if not devs:
            print("No VAS 6154 devices found")
            sys.exit(1)
        print(f"Found {len(devs)} VAS 6154 device(s):")
        for d in devs:
            print(f"  {d['name']}")
            print(f"    Serial:   {d.get('serial', 'UNKNOWN')}")
            print(f"    FW:       {d.get('fw_version', '?')}")
            print(f"    Node:     {d.get('device_node', 'N/A')}")
            print(f"    CAN-FD:   {d.get('can_fd', False)}")
            print(f"    Source:   {d.get('source', '?')}")
            if d.get('warning'):
                print(f"    WARNING:  {d['warning']}")
            print()
        sys.exit(0)

    # Start daemon
    daemon = VAS6154Daemon()
    daemon.start()
