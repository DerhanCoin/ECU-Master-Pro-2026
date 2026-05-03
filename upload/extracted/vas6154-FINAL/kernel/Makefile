obj-m += vas6154.o
KVER  ?= $(shell uname -r)
KDIR   = /lib/modules/$(KVER)/build
all:
	$(MAKE) -C $(KDIR) M=$(shell pwd) modules
clean:
	$(MAKE) -C $(KDIR) M=$(shell pwd) clean
