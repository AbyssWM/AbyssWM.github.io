# Roadmap

Abyss is out as a **first release**. Packages are available for Fedora, Debian, Ubuntu, Arch, Void and Gentoo; expect bugs and please report them. This page lists what is planned; the order is roughly by usefulness for everyday use.

::: warning Work in progress
Nothing on this page is a promise of a date. Details may change.
:::

## Current implementation

- Seventeen code repositories forked and renamed; builds and tests are being checked per repository
- Own dialogs (`abyss-dialog`), no Hyprland packages needed at runtime
- Abyssland runs as its own session
- Abysslang: compiled C++ config with typed options, binds, rules, events, timers, submaps, `abyssctl reload` with last-good fallback
- Native idle rules (`c.idle`) with inhibitor support
- Screensaver in idle: draw your own in C++, clock and audio-visualizer presets included
- Bundled wallpapers drawn by the compositor, no wallpaper app needed
- **AbyssDusk** (blue light filter) and **AbyssPicker** (color picker) are available, see [Tools](/wiki/tools)

## Verification and integration

- **Custom layouts** (`c.addLayout`) and typed cursor options exist; game and Xwayland behavior still need real-session coverage
- Full code reviews across the ecosystem, including callers of renamed APIs
- Reliable builds and tests: successful dependency builds do not prove that every companion application builds or works
- Portal desktop detection, capture failures, selection and restore behavior
- Everyday testing of the real session

## Planned

### Shared configuration

The target is C++-based configuration for configurable Abyss applications under `$XDG_CONFIG_HOME/abyss` (normally `~/.config/abyss`). Freely named files select their application with a custom leading directive such as `#include.abyss <paper>`. Multiple files and ordinary includes must work, with useful type errors and rebuild dependencies.

The current preprocessor is a limited prototype. Generated values are not yet a complete, applied configuration API for the companion tools. Their existing settings remain documented until each migration is implemented and tested. The compositor's existing C++ configuration is a separate working path.

### Personal bar and menus

The personal bar, menus and desktop layout will be configured during real-session testing. They are not an additional implementation milestone in this roadmap. Third-party shells use the compositor's available protocols and IPC.

### AbyssLock

The lock-screen application exists. Its configuration still uses the parser-based format; migration to the shared C++ system and lock/suspend/failure testing remain open.

### AbyssPaper

The image wallpaper application exists. Video/GIF/audio code and a configuration prototype have been added, but the playback/rendering pipeline and applied configuration require further integration. Linking libmpv is not evidence of working video output or hardware decoding. Resize, output changes, audio control and fallback paths need explicit tests.

### More tools

A polkit agent, the color picker (AbyssPicker) and the blue-light filter (AbyssDusk) exist. Configuration consistency, service activation and real-session behavior are part of the remaining review, see [Tools](/wiki/tools).

### Documentation

This wiki grows with the project: a generated Abysslang reference and a guide to the differences from Hyprland.

### Package sources and 1.0.0

All six distribution recipe repositories contain definitions for all 17 code
projects. Publication status and installation instructions live on the
[Installation](/wiki/getting-started) page.

- ✅ **Fedora 44 / 45:** COPR, all 17 packages published
- ✅ **Debian forky / Ubuntu 26.10:** `.deb` files on every GitHub release
- ✅ **Arch Linux:** PKGBUILDs, all 17 built natively — AUR once registration reopens
- ✅ **Void Linux:** signed XBPS repository, all 17 published
- ✅ **Gentoo:** source overlay, all 17 built with Portage
- ⏳ Real-session and hardware tests
- ⏳ Signed APT repository with automatic updates
- ⏳ Older bases (Debian 13, Ubuntu 24.04/26.04, Mint 22) once their libraries catch up

Tagged releases, installation tests and the outstanding correctness work remain
requirements for 1.0.0. Recipe preparation and successful builds alone do not
establish everyday usability.

## Upstream

Security and bug fixes from hyprwm are picked over selectively. Abyss does not blindly merge new Hyprland releases.
