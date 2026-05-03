CC      = gcc
CFLAGS  = -O2 -Wall -Wextra -fPIC -D_GNU_SOURCE -Idpdu/include
LDFLAGS = -lusb-1.0 -lpthread

PREFIX  = /usr/local
LIBDIR  = $(PREFIX)/lib
BINDIR  = $(PREFIX)/bin
INCDIR  = $(PREFIX)/include/vas6154

SRCS_LIB = dpdu/src/usb.c dpdu/src/dpdu.c
SRCS_TEST = tools/test.c dpdu/src/usb.c dpdu/src/dpdu.c
SRCS_FW   = firmware/fwupdate.c dpdu/src/usb.c

.PHONY: all clean install uninstall

all: libdpdu_vas6154.so vas6154-test vas6154-fwupdate

libdpdu_vas6154.so: $(SRCS_LIB)
	$(CC) $(CFLAGS) -shared -Wl,-soname,libdpdu_vas6154.so.1 \
	      -o $@ $^ $(LDFLAGS)
	ln -sf libdpdu_vas6154.so libdpdu_vas6154.so.1

vas6154-test: $(SRCS_TEST)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

vas6154-fwupdate: $(SRCS_FW)
	$(CC) $(CFLAGS) -DFW_STANDALONE -o $@ $^ $(LDFLAGS)

install: all
	install -d $(LIBDIR) $(BINDIR) $(INCDIR)
	install -m 755 libdpdu_vas6154.so   $(LIBDIR)/
	install -m 755 libdpdu_vas6154.so.1 $(LIBDIR)/ 2>/dev/null || true
	install -m 755 vas6154-test     $(BINDIR)/
	install -m 755 vas6154-fwupdate $(BINDIR)/
	install -m 644 dpdu/include/*.h  $(INCDIR)/
	ldconfig
	@echo "Library instalirana: $(LIBDIR)/libdpdu_vas6154.so"

uninstall:
	rm -f $(LIBDIR)/libdpdu_vas6154.so $(LIBDIR)/libdpdu_vas6154.so.1
	rm -f $(BINDIR)/vas6154-test $(BINDIR)/vas6154-fwupdate
	rm -rf $(INCDIR)
	ldconfig

clean:
	rm -f libdpdu_vas6154.so libdpdu_vas6154.so.1 vas6154-test vas6154-fwupdate
