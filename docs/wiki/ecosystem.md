# Ecosystem

Abyss forks the whole Hyprland stack from [hyprwm](https://github.com/hyprwm), renames it and builds it as one unit. The full upstream history is kept. All repositories live in the GitHub organisation [**AbyssWM**](https://github.com/AbyssWM).

| Repository | Purpose | Based on | Version |
|---|---|---|---|
| [Abyssland](https://github.com/AbyssWM/Abyssland) | Compositor | [Hyprland](https://github.com/hyprwm/Hyprland) | 0.56.2 |
| [Abyssal](https://github.com/AbyssWM/Abyssal) | Rendering backend library | [aquamarine](https://github.com/hyprwm/aquamarine) | 0.15.0 |
| [Abyssutils](https://github.com/AbyssWM/Abyssutils) | Utility library | [hyprutils](https://github.com/hyprwm/hyprutils) | 0.14.2 |
| [Abyssparse](https://github.com/AbyssWM/Abyssparse) | Config parser library (LGPL-3) | [hyprlang](https://github.com/hyprwm/hyprlang) | 0.6.8 |
| [Abysscursor](https://github.com/AbyssWM/Abysscursor) | Cursor themes | [hyprcursor](https://github.com/hyprwm/hyprcursor) | 0.1.13 |
| [Abyssgraphics](https://github.com/AbyssWM/Abyssgraphics) | Graphics helpers | [hyprgraphics](https://github.com/hyprwm/hyprgraphics) | 0.5.1 |
| [Abysswire](https://github.com/AbyssWM/Abysswire) | Wire protocol library | [hyprwire](https://github.com/hyprwm/hyprwire) | 0.3.1 |
| [Abyss-scanner](https://github.com/AbyssWM/Abyss-scanner) | Wayland protocol scanner | [hyprwayland-scanner](https://github.com/hyprwm/hyprwayland-scanner) | 0.4.5 |
| [Abyssland-protocols](https://github.com/AbyssWM/Abyssland-protocols) | Extra Wayland protocols | [hyprland-protocols](https://github.com/hyprwm/hyprland-protocols) | 0.7.0 |
| [Xdg-desktop-portal-abyss](https://github.com/AbyssWM/Xdg-desktop-portal-abyss) | Desktop portal (screen sharing, ...) | [xdg-desktop-portal-hyprland](https://github.com/hyprwm/xdg-desktop-portal-hyprland) | 1.4.1 |
| [Abysstoolkit](https://github.com/AbyssWM/Abysstoolkit) | GUI toolkit for the Abyss tools | [hyprtoolkit](https://github.com/hyprwm/hyprtoolkit) | 0.6.0 |
| [Abyss-guiutils](https://github.com/AbyssWM/Abyss-guiutils) | Dialogs (`abyss-dialog`), run prompt, welcome and update screens | [hyprland-guiutils](https://github.com/hyprwm/hyprland-guiutils) | 0.2.2 |
| [AbyssDusk](https://github.com/AbyssWM/AbyssDusk) | Blue light filter (`abyssdusk`) | [hyprsunset](https://github.com/hyprwm/hyprsunset) | 0.4.0 |
| [AbyssPicker](https://github.com/AbyssWM/AbyssPicker) | Color picker (`abysspicker`) | [hyprpicker](https://github.com/hyprwm/hyprpicker) | 0.4.7 |
| [AbyssPaper](https://github.com/AbyssWM/AbyssPaper) | Wallpaper application (`abysspaper`) | [hyprpaper](https://github.com/hyprwm/hyprpaper) | 0.8.4 |
| [AbyssLock](https://github.com/AbyssWM/AbyssLock) | Lock screen (`abysslock`) | [hyprlock](https://github.com/hyprwm/hyprlock) | 0.9.6 |
| [AbyssPolkit](https://github.com/AbyssWM/AbyssPolkit) | Authentication agent (`abyss-polkit-agent`) | [hyprpolkitagent](https://github.com/hyprwm/hyprpolkitagent) | 0.2.0 |

"Version" identifies the base source version recorded in the current packaging
snapshot. Development packages also include commit/revision suffixes. See
[Installation](/wiki/getting-started) for all six package recipe repositories and
the publication status of each distribution source. Abyss remains in 0.x development.

## Interfaces are renamed too

Abyss does not pretend to be Hyprland: environment variables are `ABYSSLAND_*`, sockets live in `$XDG_RUNTIME_DIR/abyss`, protocols are called `abyssland_*`, `XDG_CURRENT_DESKTOP` is `Abyssland` and the control tool is `abyssctl`. Lua configs and plugins are removed; configuration is [Abysslang](/wiki/config/).

## Tools

How to use AbyssDusk and AbyssPicker: [Tools](/wiki/tools). See the [Roadmap](/roadmap) for the lock screen, wallpaper tool and more.
