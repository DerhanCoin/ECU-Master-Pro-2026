cmake_minimum_required(VERSION 3.16)
project(vas6154-linux VERSION 1.0.0 LANGUAGES C)

# ──────────────────────────────────────────────
# Compiler settings
# ──────────────────────────────────────────────
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_EXTENSIONS OFF)

add_compile_options(
    -Wall -Wextra -Wpedantic
    -Wno-unused-parameter
    -fvisibility=hidden
    -D_GNU_SOURCE
)

# Release build by default
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

set(CMAKE_C_FLAGS_RELEASE "-O2 -DNDEBUG")
set(CMAKE_C_FLAGS_DEBUG   "-g3 -O0 -DDEBUG")

# ──────────────────────────────────────────────
# Find dependencies
# ──────────────────────────────────────────────
find_package(PkgConfig REQUIRED)
pkg_check_modules(LIBUSB REQUIRED libusb-1.0)
find_package(Threads REQUIRED)

# ──────────────────────────────────────────────
# Include directories
# ──────────────────────────────────────────────
include_directories(
    ${CMAKE_SOURCE_DIR}/include
    ${LIBUSB_INCLUDE_DIRS}
)

# ──────────────────────────────────────────────
# libdpdu_vas6154.so - D-PDU API shared library
# ──────────────────────────────────────────────
add_library(dpdu_vas6154 SHARED
    src/usb/vas6154_usb.c
    src/dpdu/dpdu_api.c
)

target_include_directories(dpdu_vas6154 PRIVATE
    src/usb
    src/dpdu
    ${LIBUSB_INCLUDE_DIRS}
)

target_link_libraries(dpdu_vas6154
    ${LIBUSB_LIBRARIES}
    Threads::Threads
)

target_compile_definitions(dpdu_vas6154 PRIVATE
    BUILDING_DPDU_LIB
)

set_target_properties(dpdu_vas6154 PROPERTIES
    VERSION   ${PROJECT_VERSION}
    SOVERSION 1
    PUBLIC_HEADER "include/dpdu_api.h;include/iso22900_types.h;include/vas6154.h"
)

# ──────────────────────────────────────────────
# vas6154-test - Diagnostic test tool
# ──────────────────────────────────────────────
add_executable(vas6154-test
    tools/vas6154_test.c
    src/usb/vas6154_usb.c
    src/dpdu/dpdu_api.c
)

target_include_directories(vas6154-test PRIVATE
    src/usb
    src/dpdu
    ${LIBUSB_INCLUDE_DIRS}
)

target_link_libraries(vas6154-test
    ${LIBUSB_LIBRARIES}
    Threads::Threads
)

# ──────────────────────────────────────────────
# vas6154-fwupdate - Firmware updater
# ──────────────────────────────────────────────
add_executable(vas6154-fwupdate
    src/firmware/fw_loader.c
    src/usb/vas6154_usb.c
)

target_include_directories(vas6154-fwupdate PRIVATE
    src/usb
    ${LIBUSB_INCLUDE_DIRS}
)

target_link_libraries(vas6154-fwupdate
    ${LIBUSB_LIBRARIES}
    Threads::Threads
)

target_compile_definitions(vas6154-fwupdate PRIVATE
    FW_LOADER_STANDALONE
)

# ──────────────────────────────────────────────
# Install targets
# ──────────────────────────────────────────────
include(GNUInstallDirs)

install(TARGETS dpdu_vas6154
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    PUBLIC_HEADER DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}/vas6154
)

install(TARGETS vas6154-test vas6154-fwupdate
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

install(FILES udev/99-vas6154.rules
    DESTINATION /etc/udev/rules.d
)

# pkg-config file
configure_file(
    ${CMAKE_SOURCE_DIR}/scripts/dpdu_vas6154.pc.in
    ${CMAKE_BINARY_DIR}/dpdu_vas6154.pc
    @ONLY
)
install(FILES ${CMAKE_BINARY_DIR}/dpdu_vas6154.pc
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/pkgconfig
)

# ──────────────────────────────────────────────
# Post-install: ldconfig + udev reload
# ──────────────────────────────────────────────
install(CODE "
    message(STATUS \"Running ldconfig...\")
    execute_process(COMMAND ldconfig)
    message(STATUS \"Reloading udev rules...\")
    execute_process(COMMAND udevadm control --reload-rules)
    execute_process(COMMAND udevadm trigger)
    message(STATUS \"Install complete!\")
")

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
message(STATUS "")
message(STATUS "VAS 6154 Linux Driver ${PROJECT_VERSION}")
message(STATUS "  Build type:     ${CMAKE_BUILD_TYPE}")
message(STATUS "  Install prefix: ${CMAKE_INSTALL_PREFIX}")
message(STATUS "  libusb version: ${LIBUSB_VERSION}")
message(STATUS "")
