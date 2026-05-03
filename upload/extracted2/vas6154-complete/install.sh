#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#
#  VAS 6154 LINUX DRIVER - KOMPLETAN INSTALLER
#  DERHAN AutoMatrix Pro
#
#  Instalira SVE:
#    ✓ Kernel modul (vas6154.ko)  →  /dev/vas6154_N pri svakom spajanju
#    ✓ D-PDU API library          →  /usr/local/lib/libdpdu_vas6154.so
#    ✓ D-PDU registry             →  /etc/dpdu/modules.xml
#    ✓ udev pravila               →  /etc/udev/rules.d/99-vas6154.rules
#    ✓ Detection daemon           →  /usr/local/bin/vas6154d
#    ✓ systemd servis             →  systemctl start vas6154d
#    ✓ Node.js detection lib      →  /usr/local/lib/node/vas6154-detect.ts
#    ✓ Header files               →  /usr/local/include/vas6154/
#    ✓ Test tools                 →  vas6154-test, vas6154-fwupdate
#
#  USAGE:
#    sudo bash install.sh           # Puna instalacija
#    sudo bash install.sh --quick   # Samo udev + daemon (bez kernel modula)
#    sudo bash install.sh --kmod    # Samo kernel modul
#    sudo bash install.sh --check   # Provjeri stanje
#    sudo bash install.sh --remove  # Ukloni sve
#
# ══════════════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[1;33m'
BLU='\033[0;34m'; CYN='\033[0;36m'; MAG='\033[0;35m'
BOLD='\033[1m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG=/tmp/vas6154-install.log
PREFIX=/usr/local
KVER="$(uname -r)"
ERRORS=0

: > "$LOG"

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
info()  { echo -e "${GRN}  ✓${NC} $*"; echo "[OK  ] $*" >> "$LOG"; }
warn()  { echo -e "${YLW}  !${NC} $*"; echo "[WARN] $*" >> "$LOG"; }
err()   { echo -e "${RED}  ✗${NC} $*"; echo "[ERR ] $*" >> "$LOG"; ((ERRORS++)) || true; }
step()  { echo -e "\n${CYN}${BOLD}▶ $*${NC}"; }
die()   { echo -e "${RED}${BOLD}FATAL: $*${NC}"; exit 1; }

check_root() { [[ $EUID -eq 0 ]] || die "Pokreni kao root: sudo bash install.sh"; }

# ─────────────────────────────────────────────
# Banner
# ─────────────────────────────────────────────
banner() {
echo -e "
${CYN}${BOLD}
  ██╗   ██╗ █████╗ ███████╗     ██████╗ ██╗███████╗ ██╗ ██████╗  ██╗
  ██║   ██║██╔══██╗██╔════╝    ██╔════╝ ██║██╔════╝███║██╔════╝ ███║
  ██║   ██║███████║███████╗    ███████╗ ██║███████╗ ╚██║╚█████╗  ╚██║
  ╚██╗ ██╔╝██╔══██║╚════██║    ██╔═══██╗██║╚════██║  ██║ ╚═══██╗  ██║
   ╚████╔╝ ██║  ██║███████║    ╚██████╔╝██║███████║  ██║██████╔╝  ██║
    ╚═══╝  ╚═╝  ╚═╝╚══════╝    ╚═════╝ ╚═╝╚══════╝  ╚═╝╚═════╝   ╚═╝
${NC}
${BOLD}  Linux Driver Installer  │  DERHAN AutoMatrix Pro${NC}
  Kernel: $KVER
"
}

# ─────────────────────────────────────────────
# Detect OS
# ─────────────────────────────────────────────
detect_os() {
    source /etc/os-release 2>/dev/null || die "Nepoznat OS"
    OS_ID="${ID:-unknown}"
    OS_VER="${VERSION_ID:-0}"
    case "$OS_ID" in
        kali)    info "OS: Kali Linux $OS_VER" ;;
        ubuntu)  info "OS: Ubuntu $OS_VER" ;;
        debian)  info "OS: Debian $OS_VER" ;;
        *)       warn "OS: $OS_ID $OS_VER (neprovjereno, pokušavam Debian stil)" ;;
    esac
}

# ─────────────────────────────────────────────
# STEP 1: Sistemske zavisnosti
# ─────────────────────────────────────────────
install_deps() {
    step "Instaliranje zavisnosti"

    apt-get update -qq 2>>"$LOG"

    PKGS=(
        build-essential cmake pkg-config
        libusb-1.0-0-dev libusb-1.0-0
        linux-headers-"$KVER"
        python3 python3-pip python3-usb
        dfu-util udev kmod
        git curl wget
    )

    apt-get install -y --no-install-recommends "${PKGS[@]}" >>"$LOG" 2>&1 \
        && info "Paketi instalirani" \
        || { warn "Neki paketi nisu dostupni (nastavlja se)"; }

    # Python zavisnosti za daemon i firmware tool
    pip3 install --break-system-packages pyusb 2>>"$LOG" || \
    pip3 install pyusb 2>>"$LOG" || true
    info "Python zavisnosti OK"
}

# ─────────────────────────────────────────────
# STEP 2: Kernel modul
# ─────────────────────────────────────────────
build_kmod() {
    step "Izgradnja kernel modula vas6154.ko"

    local KMOD_SRC="$SCRIPT_DIR/kernel_module"

    if [[ ! -d "/lib/modules/$KVER/build" ]]; then
        warn "Kernel headers nisu instalirani ($KVER)"
        warn "Pokušaj: sudo apt-get install linux-headers-\$(uname -r)"
        warn "Kernel modul preskočen - koristit će se libusb fallback"
        return 0
    fi

    cd "$KMOD_SRC"
    make clean >>"$LOG" 2>&1 || true
    make KVER="$KVER" >>"$LOG" 2>&1 \
        && info "vas6154.ko izgrađen" \
        || { err "Izgradnja kernel modula neuspješna (pogledaj $LOG)"; return 1; }

    # Instaliraj modul
    install -d /lib/modules/"$KVER"/extra/
    install -m 644 vas6154.ko /lib/modules/"$KVER"/extra/
    depmod -a
    info "vas6154.ko instaliran: /lib/modules/$KVER/extra/vas6154.ko"

    # Automatski učitaj pri bootu
    echo "vas6154" > /etc/modules-load.d/vas6154.conf
    info "vas6154 dodan u /etc/modules-load.d/vas6154.conf"

    # Sprječi cdc_acm da preuzme uređaj
    mkdir -p /etc/modprobe.d/
    cat > /etc/modprobe.d/vas6154.conf << 'EOF'
# VAS 6154 - Softing VCI - DERHAN AutoMatrix Pro
# Sprječava cdc_acm da preuzme uređaj
blacklist cdc_acm
# Učitaj vas6154 odmah pri detekciji
options vas6154 auto_claim=1
EOF
    info "/etc/modprobe.d/vas6154.conf kreiran"

    # Učitaj odmah
    modprobe vas6154 2>>"$LOG" \
        && info "vas6154 modul učitan (aktivan)" \
        || warn "Modul je instaliran ali nije odmah učitan (bit će pri restartu)"

    cd "$SCRIPT_DIR"
}

# ─────────────────────────────────────────────
# STEP 3: D-PDU API library
# ─────────────────────────────────────────────
build_dpdu() {
    step "Izgradnja D-PDU API library (libdpdu_vas6154.so)"

    mkdir -p /tmp/vas6154-build
    cp -r "$SCRIPT_DIR"/. /tmp/vas6154-build/
    cd /tmp/vas6154-build

    mkdir -p build && cd build
    cmake .. \
        -DCMAKE_BUILD_TYPE=Release \
        -DCMAKE_INSTALL_PREFIX="$PREFIX" \
        >>"$LOG" 2>&1 || { err "CMake failed"; return 1; }

    make -j"$(nproc)" >>"$LOG" 2>&1 \
        && info "Library izgrađena" \
        || { err "Build failed (pogledaj $LOG)"; return 1; }

    make install >>"$LOG" 2>&1 \
        && info "Library instalirana" \
        || { err "Install failed"; return 1; }

    ldconfig
    info "ldconfig osvježen"
    cd "$SCRIPT_DIR"
}

# ─────────────────────────────────────────────
# STEP 4: udev pravila
# ─────────────────────────────────────────────
install_udev() {
    step "Instaliranje udev pravila"

    cat > /etc/udev/rules.d/99-vas6154.rules << 'UDEV_EOF'
# VAS 6154 VCI - DERHAN AutoMatrix Pro
# Kreira /dev/vas6154_N i daje pristup bez root-a

# VAS 6154 sve verzije (VID 0x19B2)
SUBSYSTEM=="usb", ATTRS{idVendor}=="19b2", \
    MODE="0666", GROUP="plugdev", \
    ENV{ID_MM_DEVICE_IGNORE}="1", \
    TAG+="uaccess"

# Kernel modul trigger - učitaj vas6154.ko pri spajanju
SUBSYSTEM=="usb", ATTRS{idVendor}=="19b2", ATTRS{idProduct}=="0003", ACTION=="add", RUN+="/sbin/modprobe vas6154"
SUBSYSTEM=="usb", ATTRS{idVendor}=="19b2", ATTRS{idProduct}=="0008", ACTION=="add", RUN+="/sbin/modprobe vas6154"
SUBSYSTEM=="usb", ATTRS{idVendor}=="19b2", ATTRS{idProduct}=="000c", ACTION=="add", RUN+="/sbin/modprobe vas6154"

# DFU mode
SUBSYSTEM=="usb", ATTRS{idVendor}=="19b2", ATTRS{idProduct}=="0009", \
    MODE="0666", GROUP="plugdev", TAG+="uaccess", SYMLINK+="vas6154_dfu"

# K-Line serial access
KERNEL=="ttyUSB*", ATTRS{idVendor}=="19b2", MODE="0666", GROUP="dialout", SYMLINK+="vas6154_kline"
KERNEL=="ttyACM*", ATTRS{idVendor}=="19b2", MODE="0666", GROUP="dialout", SYMLINK+="vas6154_kline"

# Sprječi ModemManager
SUBSYSTEM=="usb", ATTRS{idVendor}=="19b2", ENV{ID_MM_DEVICE_IGNORE}="1"
SUBSYSTEM=="usb", ATTRS{idVendor}=="0403", ENV{ID_MM_DEVICE_IGNORE}="1"

# Klasa notification (za sysfs aplikacije)
SUBSYSTEM=="vas6154", MODE="0666", GROUP="plugdev"
UDEV_EOF

    chmod 644 /etc/udev/rules.d/99-vas6154.rules
    udevadm control --reload-rules
    udevadm trigger
    info "udev pravila instalirana i učitana"

    # Isključi ModemManager ako radi
    if systemctl is-active --quiet ModemManager 2>/dev/null; then
        systemctl stop  ModemManager 2>/dev/null || true
        systemctl mask  ModemManager 2>/dev/null || true
        info "ModemManager zaustavljen i maskiran"
    fi
}

# ─────────────────────────────────────────────
# STEP 5: D-PDU registry
# ─────────────────────────────────────────────
install_registry() {
    step "Instaliranje D-PDU registry"

    mkdir -p /etc/dpdu
    install -m 644 "$SCRIPT_DIR/dpdu_registry/modules.xml" /etc/dpdu/modules.xml
    info "D-PDU registry: /etc/dpdu/modules.xml"

    # Syslink za kompatibilnost
    mkdir -p /etc/vas6154
    cat > /etc/vas6154/config.ini << 'EOF'
[VAS6154]
LibraryPath=/usr/local/lib/libdpdu_vas6154.so
RegistryPath=/etc/dpdu/modules.xml
DevicePattern=/dev/vas6154_*
SysfsClass=/sys/class/vas6154
DaemonSocket=/run/vas6154/status.sock
LogLevel=INFO
EOF
    info "/etc/vas6154/config.ini kreiran"
}

# ─────────────────────────────────────────────
# STEP 6: Detection daemon
# ─────────────────────────────────────────────
install_daemon() {
    step "Instaliranje detection daemon"

    install -m 755 "$SCRIPT_DIR/daemon/vas6154d.py" /usr/local/bin/vas6154d
    info "Daemon instaliran: /usr/local/bin/vas6154d"

    # systemd servis
    install -m 644 "$SCRIPT_DIR/systemd/vas6154d.service" /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable  vas6154d 2>>"$LOG"
    systemctl restart vas6154d 2>>"$LOG" || \
        systemctl start vas6154d 2>>"$LOG" || \
        warn "Daemon nije mogao startati odmah (bit će aktivan nakon reboot-a)"
    info "systemd servis: vas6154d (enabled + started)"

    # Kratko čekaj da daemon startuje
    sleep 1
    if systemctl is-active --quiet vas6154d; then
        info "vas6154d daemon AKTIVAN ✓"
    else
        warn "vas6154d daemon nije aktivan odmah - provjeri: journalctl -u vas6154d"
    fi
}

# ─────────────────────────────────────────────
# STEP 7: Node.js lib za ECU Master Pro
# ─────────────────────────────────────────────
install_nodejs_lib() {
    step "Instaliranje Node.js detection library"

    mkdir -p "$PREFIX/lib/node"
    install -m 644 "$SCRIPT_DIR/userspace/lib/vas6154-detect.ts" \
                   "$PREFIX/lib/node/vas6154-detect.ts"
    info "Node.js lib: $PREFIX/lib/node/vas6154-detect.ts"

    # Kopiraj i u projekt direktorij ako postoji
    for proj_dir in /home/*/ecu-master* /home/*/ECU* /root/ecu* /root/ECU*; do
        [[ -d "$proj_dir/src" || -d "$proj_dir/lib" ]] || continue
        target="$proj_dir/src/lib/vas6154-detect.ts"
        [[ -d "$proj_dir/src/lib" ]] && cp "$SCRIPT_DIR/userspace/lib/vas6154-detect.ts" "$target" \
            && info "Kopirano u projekat: $target"
    done
}

# ─────────────────────────────────────────────
# STEP 8: User grupe
# ─────────────────────────────────────────────
setup_groups() {
    step "Konfiguracija korisničkih grupa"

    REAL_USER="${SUDO_USER:-$(logname 2>/dev/null || echo $USER)}"

    for grp in plugdev dialout usb; do
        getent group "$grp" > /dev/null 2>&1 || groupadd "$grp" 2>/dev/null || true
        if ! id -nG "$REAL_USER" 2>/dev/null | grep -qw "$grp"; then
            usermod -aG "$grp" "$REAL_USER" 2>/dev/null && info "Korisnik '$REAL_USER' dodan u grupu '$grp'"
        else
            info "Korisnik '$REAL_USER' već u grupi '$grp'"
        fi
    done

    echo -e "${YLW}  ⚠  ODJAVI SE I PONOVO PRIJAVI da grup promjene stupe na snagu!${NC}"
}

# ─────────────────────────────────────────────
# STEP 9: Firmware tool
# ─────────────────────────────────────────────
install_fw_tool() {
    step "Instaliranje firmware tools"

    install -m 755 "$SCRIPT_DIR/firmware/extract/vas6154_firmware.py" \
                   /usr/local/bin/vas6154-firmware
    info "Firmware tool: /usr/local/bin/vas6154-firmware"
}

# ─────────────────────────────────────────────
# Finalna provjera
# ─────────────────────────────────────────────
final_check() {
    step "Provjera instalacije"
    echo ""

    local ALL_OK=true

    # Kernel modul
    if lsmod | grep -q "^vas6154" 2>/dev/null; then
        info "Kernel modul:   vas6154 UČITAN ✓"
    elif [[ -f "/lib/modules/$KVER/extra/vas6154.ko" ]]; then
        warn "Kernel modul:   instaliran ali nije učitan (spoji dongle da ga pokreneš)"
    else
        warn "Kernel modul:   nije instaliran (libusb fallback aktivan)"
    fi

    # D-PDU library
    if ldconfig -p 2>/dev/null | grep -q "libdpdu_vas6154"; then
        info "D-PDU Library:  libdpdu_vas6154.so ✓"
    else
        err "D-PDU Library:  NIJE pronađena"
        ALL_OK=false
    fi

    # udev pravila
    [[ -f /etc/udev/rules.d/99-vas6154.rules ]] && info "udev pravila:   ✓" || err "udev pravila:   ✗"

    # D-PDU registry
    [[ -f /etc/dpdu/modules.xml ]] && info "D-PDU registry: ✓" || err "D-PDU registry: ✗"

    # Daemon
    if systemctl is-active --quiet vas6154d 2>/dev/null; then
        info "Daemon:         vas6154d AKTIVAN ✓"
    else
        warn "Daemon:         nije aktivan (startaj: sudo systemctl start vas6154d)"
    fi

    # Uređaj
    echo ""
    if lsusb 2>/dev/null | grep -qi "19b2"; then
        info "VAS 6154:       DETEKTOVAN ✓"
        lsusb | grep -i "19b2" | while read l; do echo "    $l"; done
        if [[ -d /sys/class/vas6154 ]]; then
            for dev in /sys/class/vas6154/*/; do
                name=$(basename "$dev")
                serial=$(cat "$dev/serial" 2>/dev/null || echo "?")
                fw=$(cat "$dev/fw_version" 2>/dev/null || echo "?")
                info "/dev/$name  serial=$serial  fw=$fw"
            done
        fi
    else
        warn "VAS 6154:       NIJE spojen (spoji dongle i provjeri: lsusb | grep 19b2)"
    fi

    # Test daemon status
    echo ""
    if [[ -f /run/vas6154/devices.json ]]; then
        COUNT=$(python3 -c "import json; d=json.load(open('/run/vas6154/devices.json')); print(d['device_count'])" 2>/dev/null || echo "?")
        info "Daemon vidi $COUNT uređaj(a)"
    fi
}

# ─────────────────────────────────────────────
# Usage guide
# ─────────────────────────────────────────────
usage_guide() {
    echo ""
    echo -e "${MAG}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAG}${BOLD}  Kako koristiti${NC}"
    echo -e "${MAG}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${BOLD}1. Provjeri da li dongle radi:${NC}"
    echo -e "     ${CYN}vas6154-test scan${NC}"
    echo -e "     ${CYN}vas6154-test info${NC}"
    echo ""
    echo -e "  ${BOLD}2. Provjeri daemon status:${NC}"
    echo -e "     ${CYN}python3 /usr/local/bin/vas6154d status${NC}"
    echo -e "     ${CYN}cat /run/vas6154/devices.json${NC}"
    echo ""
    echo -e "  ${BOLD}3. ECU Master Pro - detektuj dongle u Node.js:${NC}"
    echo -e "     ${CYN}// Kopiraj vas6154-detect.ts u src/lib/${NC}"
    echo -e "     ${CYN}import { detector } from './vas6154-detect'${NC}"
    echo -e "     ${CYN}const devs = await detector.findDevices()${NC}"
    echo ""
    echo -e "  ${BOLD}4. Firmware (ako treba update):${NC}"
    echo -e "     ${CYN}vas6154-firmware extract --odis /mnt/windows/Program\\ Files/ODIS${NC}"
    echo -e "     ${CYN}vas6154-fwupdate firmware.bin${NC}"
    echo ""
    echo -e "  ${BOLD}5. CAN bus sniffer:${NC}"
    echo -e "     ${CYN}vas6154-test sniff${NC}"
    echo ""
    echo -e "  ${BOLD}6. UDS VIN čitanje:${NC}"
    echo -e "     ${CYN}vas6154-test uds${NC}           ${BOLD}# OBD-II broadcast${NC}"
    echo -e "     ${CYN}vas6154-test uds 7E0 7E8${NC}   ${BOLD}# Direktno ECU${NC}"
    echo ""
    echo -e "  Log fajl: ${BLU}$LOG${NC}"
    echo -e "  Daemon log: ${BLU}journalctl -u vas6154d -f${NC}"
    echo ""
    if [[ $ERRORS -gt 0 ]]; then
        echo -e "  ${RED}${BOLD}⚠ $ERRORS grešaka tokom instalacije. Pogledaj: $LOG${NC}"
    else
        echo -e "  ${GRN}${BOLD}✓ Instalacija uspješna!${NC}"
    fi
    echo ""
}

# ─────────────────────────────────────────────
# Check mode
# ─────────────────────────────────────────────
do_check() {
    echo -e "\n${BOLD}  VAS 6154 System Check - DERHAN AutoMatrix Pro${NC}\n"

    echo "  Kernel modul:"
    lsmod | grep -q "^vas6154" && echo "    [✓] vas6154 učitan" || echo "    [✗] vas6154 NIJE učitan"
    [[ -f "/lib/modules/$KVER/extra/vas6154.ko" ]] && echo "    [✓] vas6154.ko instaliran" || echo "    [✗] vas6154.ko NIJE instaliran"

    echo ""
    echo "  Library:"
    ldconfig -p | grep -q "libdpdu_vas6154" && echo "    [✓] libdpdu_vas6154.so instalirana" || echo "    [✗] libdpdu_vas6154.so NIJE instalirana"

    echo ""
    echo "  udev:"
    [[ -f /etc/udev/rules.d/99-vas6154.rules ]] && echo "    [✓] 99-vas6154.rules" || echo "    [✗] 99-vas6154.rules NEMA"

    echo ""
    echo "  Daemon:"
    systemctl is-active --quiet vas6154d 2>/dev/null && echo "    [✓] vas6154d aktivan" || echo "    [✗] vas6154d NIJE aktivan"
    [[ -f /run/vas6154/devices.json ]] && echo "    [✓] /run/vas6154/devices.json postoji" || echo "    [✗] devices.json ne postoji"

    echo ""
    echo "  USB:"
    if lsusb 2>/dev/null | grep -qi "19b2"; then
        echo "    [✓] VAS 6154 detektovan:"
        lsusb | grep -i "19b2" | sed 's/^/       /'
    else
        echo "    [✗] VAS 6154 NIJE spojen ili NIJE detektovan"
    fi

    echo ""
    echo "  Device nodes:"
    if ls /dev/vas6154_* 2>/dev/null; then
        ls -la /dev/vas6154_* | sed 's/^/    /'
    else
        echo "    (nema /dev/vas6154_* - spoji dongle ili učitaj kernel modul)"
    fi
}

# ─────────────────────────────────────────────
# Remove / uninstall
# ─────────────────────────────────────────────
do_remove() {
    step "Uklanjanje VAS 6154 driver-a"

    systemctl stop    vas6154d 2>/dev/null || true
    systemctl disable vas6154d 2>/dev/null || true
    modprobe -r vas6154 2>/dev/null || true

    rm -f /etc/systemd/system/vas6154d.service
    rm -f /etc/udev/rules.d/99-vas6154.rules
    rm -f /etc/modprobe.d/vas6154.conf
    rm -f /etc/modules-load.d/vas6154.conf
    rm -f /lib/modules/"$KVER"/extra/vas6154.ko
    rm -f /usr/local/bin/vas6154d
    rm -f /usr/local/bin/vas6154-test
    rm -f /usr/local/bin/vas6154-fwupdate
    rm -f /usr/local/bin/vas6154-firmware
    rm -f /usr/local/lib/libdpdu_vas6154.so*
    rm -rf /etc/dpdu
    rm -rf /etc/vas6154
    rm -rf /usr/local/include/vas6154
    rm -f /usr/local/lib/pkgconfig/dpdu_vas6154.pc

    systemctl daemon-reload
    depmod -a 2>/dev/null || true
    ldconfig
    udevadm control --reload-rules

    info "Deinstalacija završena"
}

# ─────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────
main() {
    banner
    check_root
    detect_os

    case "${1:-}" in
    --check|-c)
        do_check
        ;;
    --remove|--uninstall|-r)
        do_remove
        ;;
    --kmod)
        install_deps
        build_kmod
        ;;
    --quick|-q)
        install_deps
        install_udev
        install_registry
        install_daemon
        install_fw_tool
        install_nodejs_lib
        setup_groups
        final_check
        usage_guide
        ;;
    ""|--full|-f)
        step "PUNA INSTALACIJA"
        install_deps
        build_kmod
        build_dpdu
        install_udev
        install_registry
        install_daemon
        install_fw_tool
        install_nodejs_lib
        setup_groups
        final_check
        usage_guide
        ;;
    --help|-h)
        echo "Usage: sudo bash install.sh [--full|--quick|--kmod|--check|--remove]"
        ;;
    *)
        die "Nepoznata opcija: $1"
        ;;
    esac
}

main "$@"
