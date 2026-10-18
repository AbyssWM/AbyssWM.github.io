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
| **Fedora 44 / 45** | [COPR](https://copr.fedorainfracloud.org/coprs/bb8therobot1717/Abyss/) | ✅ 17 / 17 packages built and published |
| **Debian forky (testing)** | `.deb` from GitHub releases | ✅ 17 / 17 built and installed |
| **Ubuntu 26.10** | `.deb` from GitHub releases | ✅ 17 / 17 built and installed |
| **Arch Linux** | [PKGBUILDs](https://github.com/AbyssWM/arch-builds) | ✅ 17 / 17 built with makepkg — not on the AUR yet |
| **Void Linux** | [Signed XBPS repo](https://github.com/AbyssWM/void) | ✅ 17 / 17 built and published |
| **Gentoo** | [Overlay](https://github.com/AbyssWM/gentoo-builds) | ✅ 17 / 17 built with Portage |
| Debian 13 · LMDE 7 | — | ⚠️ libraries build, Abyssland needs newer xkbcommon, wayland-protocols and libinput |
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
git clone https://github.com/AbyssWM/arch-builds.git
cd arch-builds/packages
for p in abyssutils abyss-scanner abyssland-protocols abyssparse abysswire abyssgraphics abyssal abysstoolkit abysscursor abyssland; do
  (cd "$p" && makepkg -si --noconfirm) || break
done
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
# Fedora (on Void: sudo xbps-install …)
sudo dnf install xdg-desktop-portal-abyss abysslock abysspaper abysspolkit abyssdusk abysspicker abyss-guiutils
```

On Debian and Ubuntu add `Xdg-desktop-portal-abyss AbyssLock AbyssPaper AbyssPolkit AbyssDusk AbyssPicker Abyss-guiutils`
to the download loop above. On Arch add the matching package names to the `makepkg` loop.

Installing a tool does not configure it or start its user service. See
[Tools](/wiki/tools) for how each one is set up.

## Start the session

Pick **Abyssland** in your display manager, or run `start-abyssland` from a TTY.

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
