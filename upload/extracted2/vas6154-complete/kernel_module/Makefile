obj-m += vas6154.o

KVER ?= $(shell uname -r)
KDIR  = /lib/modules/$(KVER)/build
PWD   = $(shell pwd)

all:
	$(MAKE) -C $(KDIR) M=$(PWD) modules

clean:
	$(MAKE) -C $(KDIR) M=$(PWD) clean

install: all
	install -d /lib/modules/$(KVER)/extra/
	install -m 644 vas6154.ko /lib/modules/$(KVER)/extra/
	depmod -a
	modprobe vas6154
	@echo "Kernel module installed: vas6154.ko"
	@echo "Device will appear as /dev/vas6154_N when dongle is plugged"

uninstall:
	modprobe -r vas6154 2>/dev/null || true
	rm -f /lib/modules/$(KVER)/extra/vas6154.ko
	depmod -a
