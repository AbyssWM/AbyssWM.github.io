# Installation

Abyss ships as normal distribution packages: the compositor, its libraries, the
desktop portal and all companion tools. Everything installs to `/usr` and your
package manager owns the files.

::: warning First release
All 17 packages build natively on the distributions below. This is the first
release: expect bugs and please report them.
:::

## Pick your distribution

| Distribution | How | Status |
|---|---|---|
| **Fedora 44 / 45** | [COPR](https://copr.fedorainfracloud.org/coprs/bb8therobot1717/Abyss/) | ✅ 17 / 17 packages, rebuilt automatically on every change |
| **Debian forky (testing)** | `.deb` from GitHub releases | ✅ 17 / 17 built by CI, `.deb` attached to releases |
| **Ubuntu 26.10** | `.deb` from GitHub releases | ✅ 17 / 17 built by CI, `.deb` attached to releases |
| **Arch Linux** | [Signed pacman repo](https://github.com/AbyssWM/arch) | ✅ 17 / 17 built by CI and published |
| **Void Linux** | [Signed XBPS repo](https://github.com/AbyssWM/void) | ✅ 17 / 17 built by CI and published |
| **Gentoo** | [Overlay](https://github.com/AbyssWM/gentoo-builds) | ✅ 17 / 17 built with Portage |
| Debian 13 · LMDE 7 | — | ❌ the forky packages do not install (they need libstdc++6 ≥ 16 and glibc ≥ 2.43); Abyssland also needs newer xkbcommon, wayland-protocols and libinput |
| Ubuntu 26.04 | — | ⚠️ libraries build, Abyssland needs wayland-protocols ≥ 1.49 |
| Ubuntu 24.04 · Linux Mint 22 | — | ❌ compiler and CMake too old for C++26 |

## Install

::: code-group

```sh [Fedora]
sudo dnf copr enable bb8therobot1717/Abyss
sudo dnf install abyssland
```

```sh [Debian forky]
mkdir abyss-debs && cd abyss-debs
for r in Abyssutils Abyss-scanner Abyssland-protocols Abyssparse Abysswire Abyssgraphics Abyssal Abysstoolkit Abysscursor Abyssland; do
  curl -s https://api.github.com/repos/AbyssWM/$r/releases/latest \
    | grep browser_download_url | grep -o 'https://[^"]*\.deb' | grep -v ubuntu1 | xargs -n1 curl -sLO
done
sudo apt install ./*.deb
```

```sh [Ubuntu 26.10]
mkdir abyss-debs && cd abyss-debs
for r in Abyssutils Abyss-scanner Abyssland-protocols Abyssparse Abysswire Abyssgraphics Abyssal Abysstoolkit Abysscursor Abyssland; do
  curl -s https://api.github.com/repos/AbyssWM/$r/releases/latest \
    | grep browser_download_url | grep -o 'https://[^"]*\.deb' | grep ubuntu1 | xargs -n1 curl -sLO
done
sudo apt install ./*.deb
```

```sh [Void]
echo "repository=https://abysswm.github.io/void" | sudo tee /etc/xbps.d/abyss.conf
sudo xbps-install -S abyssland
```

```sh [Arch]
curl -sL https://abysswm.github.io/arch/abyss.gpg | sudo pacman-key --add -
sudo pacman-key --lsign-key 7429EE25FE7F6A87620632B360D0CDE7A027F6A6
# add the repository to /etc/pacman.conf:
#   [abyss]
#   Server = https://abysswm.github.io/arch
sudo pacman -Sy abyssland
```

```sh [Gentoo]
eselect repository add abyss git https://github.com/AbyssWM/gentoo-builds.git
emaint sync -r abyss
echo '*/*::abyss ~amd64' >> /etc/portage/package.accept_keywords/abyss
emerge --ask gui-wm/abyssland
```

:::

**Void Linux:** on the first sync xbps asks to import the repository key
(signed by `bb8TheRobot <bb8therobot85@gmail.com>`) — answer **y**. Updates then
come with the normal `sudo xbps-install -Su`.

**Arch Linux:** add the `[abyss]` section shown above to `/etc/pacman.conf`
(for example with `sudo nano /etc/pacman.conf`), then run the `pacman -Sy`
command. Updates come with the normal `sudo pacman -Syu`. The packages are built
by CI from the [PKGBUILDs](https://github.com/AbyssWM/arch-builds), which you
can also build yourself with `makepkg`.

## Companion tools

`abyssland` pulls in all libraries it needs. The tools are separate packages,
so you only install what you want:

| Package | What it does |
|---|---|
| `xdg-desktop-portal-abyss` | Screen sharing, file pickers and the share picker |
| `abysslock` | Lock screen |
| `abysspaper` | Wallpaper daemon |
| `abysspolkit` | Polkit authentication agent |
| `abyssdusk` | Blue light filter |
| `abysspicker` | Color picker |
| `abyss-guiutils` | Dialogs, welcome and update screens |

```sh
# Fedora (on Void: sudo xbps-install …, on Arch: sudo pacman -S …)
sudo dnf install xdg-desktop-portal-abyss abysslock abysspaper abysspolkit abyssdusk abysspicker abyss-guiutils
```

On Debian and Ubuntu add `Xdg-desktop-portal-abyss AbyssLock AbyssPaper AbyssPolkit AbyssDusk AbyssPicker Abyss-guiutils`
to the download loop above. On Arch the same names work with `sudo pacman -S`.

Installing a tool does not configure it or start its user service. See
[Tools](/wiki/tools) for how each one is set up.

## Start the session

Pick **Abyssland** in your display manager, or run `abyssland` from a TTY.

Abyssland sets up the session the way a full desktop does, on every
distribution, with or without systemd:

- **Launcher:** `abyssland` is `start-abyssland`, which watches the compositor,
  falls back to the last good binary and restarts it after `abyssctl reload`.
  Starting the `Abyssland` binary directly goes through it as well.
  Its output and the compositor's early output are also written to
  `$XDG_RUNTIME_DIR/abyss/start-abyssland.log`, so a failed start or restart
  can be read after the fact.
- **D-Bus:** the session bus of the system is used. Without one (a plain TTY on
  a system without a user bus), `start-abyssland` starts one with
  `dbus-run-session`. The session variables (`WAYLAND_DISPLAY`,
  `XDG_CURRENT_DESKTOP`, ...) are exported to D-Bus, and to the systemd user
  manager when systemd runs.
- **systemd:** `abyssland-session.target` is started, which brings up
  `graphical-session.target` and with it the portals, the polkit agent and the
  XDG autostart entries. Under UWSM, UWSM does this instead.
- **Without systemd:** PipeWire is started fresh for the session (one left over
  from an earlier session has lost access to the sound cards), plus WirePlumber
  and the PulseAudio bridge if PipeWire does not start them, and the XDG
  autostart entries from `~/.config/autostart` and `/etc/xdg/autostart` meant
  for this desktop.
- **Polkit agent:** if none runs a moment after the start, `abyss-polkit-agent`
  is started.
- **Portals:** D-Bus starts `xdg-desktop-portal-abyss` when an app needs it.

Every part can be turned off: `c.ecosystem.no_session_services = true;` (or
`ABYSSLAND_NO_SESSION_SERVICES=1`) for audio, autostart and the polkit agent,
`ABYSSLAND_NO_SD_TARGET=1` for the systemd target, `ABYSSLAND_NO_SD_VARS=1` for
exporting the variables, `ABYSSLAND_NO_START_WRAPPER=1` to run the binary
without `start-abyssland`.

Packages ship the public default C++ configuration. The
[configuration guide](/wiki/config/) explains the API and the user
config at `~/.config/abyss/config.hpp`. After editing it, run `abyssctl reload`:
the first run sets up your own build in `~/.config/abyss/.build`, later runs only
rebuild and restart. It needs the matching `-devel` / `-dev` packages, git and a compiler.

## Build from source

Every repository builds with CMake or Meson against the Abyss libraries. Build
them in this order and install each one before the next:

`Abyssutils` → `Abyss-scanner` → `Abyssland-protocols` → `Abyssparse` →
`Abysswire` → `Abyssgraphics` → `Abyssal` → `Abysstoolkit` → `Abysscursor` →
`Abyssland` → tools

```sh
cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr
cmake --build build
sudo cmake --install build
```

Abyss uses C++26, so you need a recent GCC and CMake — the distributions marked
⚠️ / ❌ above do not have them yet.
