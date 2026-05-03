#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════
#  VAS 6154 Linux Driver - PRAVI INSTALLER
#  DERHAN AutoMatrix Pro
#
#  sudo bash install.sh        → Instaliraj sve
#  sudo bash install.sh --check → Provjeri status
#  sudo bash install.sh --remove → Ukloni sve
# ══════════════════════════════════════════════════════════
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG=/tmp/vas6154-install.log
KVER="$(uname -r)"
R='\033[0;31m';G='\033[0;32m';Y='\033[1;33m';C='\033[0;36m';B='\033[1m';N='\033[0m'
OK=0; FAIL=0

: > "$LOG"
ok()   { echo -e "${G}  ✓${N} $*"; echo "[OK  ] $*" >> "$LOG"; ((OK++))  || true; }
fail() { echo -e "${R}  ✗${N} $*"; echo "[FAIL] $*" >> "$LOG"; ((FAIL++)) || true; }
warn() { echo -e "${Y}  !${N} $*"; echo "[WARN] $*" >> "$LOG"; }
step() { echo -e "\n${C}${B}▶ $*${N}"; }

[[ $EUID -eq 0 ]] || { echo "Pokreni: sudo bash install.sh"; exit 1; }

echo -e "
${C}${B}  ██╗   ██╗ █████╗ ███████╗     ██████╗ ██╗███████╗ ██╗ ██████╗  ██╗
  ██║   ██║██╔══██╗██╔════╝    ██╔════╝ ██║██╔════╝███║██╔════╝ ███║
  ██║   ██║███████║███████╗    ███████╗ ██║███████╗ ╚██║╚█████╗  ╚██║
  ╚██╗ ██╔╝██╔══██║╚════██║    ██╔═══██╗██║╚════██║  ██║ ╚═══██╗  ██║
   ╚████╔╝ ██║  ██║███████║    ╚██████╔╝██║███████║  ██║██████╔╝  ██║
    ╚═══╝  ╚═╝  ╚═╝╚══════╝    ╚═════╝ ╚═╝╚══════╝  ╚═╝╚═════╝   ╚═╝${N}
  ${B}VAS 6154 Linux Driver Installer  │  DERHAN AutoMatrix Pro${N}
  Kernel: $KVER
"

# ──────────────────────────────────────────────────────────
# CHECK MODE
# ──────────────────────────────────────────────────────────
if [[ "${1:-}" == "--check" || "${1:-}" == "-c" ]]; then
    echo -e "${B}  VAS 6154 System Check${N}\n"

    echo "  Kernel modul:"
    if lsmod 2>/dev/null | grep -q "^vas6154"; then ok "vas6154.ko UČITAN"
    elif [[ -f "/lib/modules/$KVER/extra/vas6154.ko" ]]; then warn "Instaliran ali nije učitan (spoji dongle)"
    else fail "vas6154.ko NIJE instaliran"; fi

    echo ""
    echo "  D-PDU Library:"
    if ldconfig -p 2>/dev/null | grep -q "libdpdu_vas6154"; then ok "libdpdu_vas6154.so instalirana"
    else fail "libdpdu_vas6154.so NIJE pronađena - pokreni: sudo bash install.sh"; fi

    echo ""
    echo "  udev:"
    [[ -f /etc/udev/rules.d/99-vas6154.rules ]] && ok "99-vas6154.rules" || fail "99-vas6154.rules NEMA"

    echo ""
    echo "  Tools:"
    for t in vas6154-test vas6154-fwupdate; do
        command -v $t &>/dev/null && ok "$t" || fail "$t NIJE instaliran"
    done

    echo ""
    echo "  USB:"
    if lsusb 2>/dev/null | grep -qi "19b2"; then
        ok "VAS 6154 DETEKTOVAN:"
        lsusb | grep -i "19b2" | while read l; do echo "       $l"; done
    else fail "VAS 6154 NIJE spojen (provjeri USB kabel, provjeri: lsusb)"; fi

    echo ""
    echo "  /dev:"
    if ls /dev/vas6154_* 2>/dev/null | head -3; then ok "/dev/vas6154_* postoji"
    else warn "/dev/vas6154_* ne postoji (spoji dongle + učitaj kernel modul)"; fi

    echo ""
    [[ $FAIL -eq 0 ]] && echo -e "${G}${B}  SVE OK${N}" || echo -e "${R}${B}  $FAIL problema - pokreni: sudo bash install.sh${N}"
    exit 0
fi

# ──────────────────────────────────────────────────────────
# REMOVE MODE
# ──────────────────────────────────────────────────────────
if [[ "${1:-}" == "--remove" || "${1:-}" == "-r" ]]; then
    step "Uklanjanje"
    modprobe -r vas6154 2>/dev/null || true
    rm -f /lib/modules/"$KVER"/extra/vas6154.ko
    depmod -a 2>/dev/null || true
    rm -f /usr/local/lib/libdpdu_vas6154.so /usr/local/lib/libdpdu_vas6154.so.1
    rm -f /usr/local/bin/vas6154-test /usr/local/bin/vas6154-fwupdate
    rm -rf /usr/local/include/vas6154
    rm -f /etc/udev/rules.d/99-vas6154.rules
    rm -f /etc/modprobe.d/vas6154.conf
    rm -f /etc/modules-load.d/vas6154.conf
    ldconfig; udevadm control --reload-rules 2>/dev/null || true
    ok "Uklonjen"
    exit 0
fi

# ══════════════════════════════════════════════════════════
# FULL INSTALL
# ══════════════════════════════════════════════════════════

# ── 1. Zavisnosti ─────────────────────────────────────────
step "Instaliranje zavisnosti"
source /etc/os-release 2>/dev/null || true
apt-get update -qq >>"$LOG" 2>&1 || true
PKGS=(build-essential gcc make libusb-1.0-0-dev libusb-1.0-0 python3 python3-pip dfu-util)
# Kernel headers
if apt-cache show "linux-headers-${KVER}" >>"$LOG" 2>&1; then
    PKGS+=("linux-headers-${KVER}")
elif apt-cache show "linux-headers-$(uname -r | sed 's/-[a-z]*$//')" >>"$LOG" 2>&1; then
    PKGS+=("linux-headers-$(uname -r | sed 's/-[a-z]*$//')")
fi
apt-get install -y --no-install-recommends "${PKGS[@]}" >>"$LOG" 2>&1 && ok "Paketi OK" || warn "Neki paketi možda nedostaju"

# ── 2. D-PDU Library ──────────────────────────────────────
step "Build D-PDU API library"
cd "$DIR"
make -j"$(nproc)" >>"$LOG" 2>&1 && ok "Build uspješan" || { fail "Build FAILED - pogledaj $LOG"; exit 1; }

make install >>"$LOG" 2>&1 && ok "Library instalirana: /usr/local/lib/libdpdu_vas6154.so" || { fail "Install failed"; exit 1; }
ldconfig && ok "ldconfig osvježen"

# ── 3. Kernel modul ───────────────────────────────────────
step "Kernel modul (vas6154.ko)"
KMOD_BUILT=false
if [[ -d "/lib/modules/${KVER}/build" ]]; then
    cd "$DIR/kernel"
    make KVER="$KVER" >>"$LOG" 2>&1 \
        && { install -d /lib/modules/"$KVER"/extra; install -m 644 vas6154.ko /lib/modules/"$KVER"/extra/; depmod -a; ok "vas6154.ko instaliran"; KMOD_BUILT=true; } \
        || warn "Kernel modul compile failed (nastavlja se bez njega)"
    cd "$DIR"
else
    warn "Kernel headers nisu pronađeni za $KVER"
    warn "Instaliraj: sudo apt-get install linux-headers-\$(uname -r)"
    warn "Koristit će se libusb direktni pristup (radi bez kernel modula)"
fi

if $KMOD_BUILT; then
    echo "vas6154" > /etc/modules-load.d/vas6154.conf
    ok "Automatski load pri bootu: /etc/modules-load.d/vas6154.conf"
    modprobe vas6154 2>>"$LOG" && ok "vas6154.ko UČITAN odmah" || warn "Učitat će se pri restartu ili kad priključiš dongle"
fi

# ── 4. udev ───────────────────────────────────────────────
step "udev pravila"
cat > /etc/udev/rules.d/99-vas6154.rules << 'UDEV'
# VAS 6154 VCI - DERHAN AutoMatrix Pro

# Svi VAS 6154 uređaji (VID 0x19B2)
SUBSYSTEM=="usb", ATTRS{idVendor}=="19b2", MODE="0666", GROUP="plugdev", ENV{ID_MM_DEVICE_IGNORE}="1", TAG+="uaccess"

# Trigger kernel modula pri spajanju
SUBSYSTEM=="usb", ATTRS{idVendor}=="19b2", ACTION=="add", RUN+="/sbin/modprobe -q vas6154"

# K-Line serial
KERNEL=="ttyUSB*", ATTRS{idVendor}=="19b2", MODE="0666", GROUP="dialout"
KERNEL=="ttyACM*", ATTRS{idVendor}=="19b2", MODE="0666", GROUP="dialout"

# Vas6154 sysfs klasa
SUBSYSTEM=="vas6154", MODE="0666", GROUP="plugdev"

# Blokiraj ModemManager
SUBSYSTEM=="usb", ATTRS{idVendor}=="19b2", ENV{ID_MM_DEVICE_IGNORE}="1"
SUBSYSTEM=="usb", ATTRS{idVendor}=="0403", ENV{ID_MM_DEVICE_IGNORE}="1"
UDEV
chmod 644 /etc/udev/rules.d/99-vas6154.rules
udevadm control --reload-rules 2>/dev/null; udevadm trigger 2>/dev/null
ok "udev pravila instalirana"

# Zaustavi ModemManager
if systemctl is-active --quiet ModemManager 2>/dev/null; then
    systemctl stop ModemManager; systemctl mask ModemManager
    ok "ModemManager zaustavljen"
fi

# ── 5. Modprobe config ────────────────────────────────────
mkdir -p /etc/modprobe.d
cat > /etc/modprobe.d/vas6154.conf << 'MPD'
# VAS 6154 - sprječava cdc_acm preuzimanje
blacklist cdc_acm
MPD
ok "/etc/modprobe.d/vas6154.conf kreiran"

# ── 6. Grupe ──────────────────────────────────────────────
step "Grupe korisnika"
RUSER="${SUDO_USER:-$(logname 2>/dev/null || echo "")}"
if [[ -n "$RUSER" ]]; then
    for g in plugdev dialout usb; do
        getent group "$g" &>/dev/null || groupadd "$g" 2>/dev/null || true
        usermod -aG "$g" "$RUSER" 2>/dev/null && ok "'$RUSER' dodan u grupu '$g'" || true
    done
fi

# ══════════════════════════════════════════════════════════
# FINALNA PROVJERA
# ══════════════════════════════════════════════════════════
echo ""
step "Provjera"

# Library
ldconfig -p | grep -q "libdpdu_vas6154" && ok "libdpdu_vas6154.so: ✓" || fail "Library nije registrirana"
command -v vas6154-test &>/dev/null && ok "vas6154-test: ✓" || fail "vas6154-test nije u PATH-u"
command -v vas6154-fwupdate &>/dev/null && ok "vas6154-fwupdate: ✓" || fail "vas6154-fwupdate nije u PATH-u"
[[ -f /etc/udev/rules.d/99-vas6154.rules ]] && ok "udev: ✓" || fail "udev pravila nedostaju"

# USB detekcija
echo ""
if lsusb 2>/dev/null | grep -qi "19b2"; then
    ok "VAS 6154 DETEKTOVAN:"
    lsusb | grep -i "19b2" | while read l; do echo "       $l"; done
    # Trigger udev odmah
    udevadm trigger --attr-match=idVendor=19b2 2>/dev/null || true
    sleep 1
    if ls /dev/vas6154_* 2>/dev/null; then ok "/dev/vas6154_* kreira": ls /dev/vas6154_* 2>/dev/null; fi
else
    warn "VAS 6154 NIJE spojen - priključi dongle i provjeri: lsusb | grep 19b2"
fi

# ══════════════════════════════════════════════════════════
echo ""
echo -e "${C}${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${B}  Upotreba nakon instalacije:${N}"
echo ""
echo -e "  ${C}vas6154-test scan${N}       → Pronađi spojene dongle"
echo -e "  ${C}vas6154-test info${N}       → Info o donglu (FW, HW, serial)"
echo -e "  ${C}vas6154-test sniff${N}      → CAN bus sniffer"
echo -e "  ${C}vas6154-test uds${N}        → UDS VIN čitanje"
echo -e "  ${C}vas6154-fwupdate fw.bin${N} → Update firmware"
echo ""
echo -e "  ${Y}⚠ ODJAVI SE I PONOVO PRIJAVI za grupne promjene${N}"
echo ""
if [[ $FAIL -eq 0 ]]; then echo -e "${G}${B}  ✓ Instalacija završena (log: $LOG)${N}"
else echo -e "${R}${B}  ✗ $FAIL problema - pogledaj $LOG${N}"; fi
echo ""
