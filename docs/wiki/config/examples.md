# Example configs

Four complete configs you can copy into `~/.config/abyss/config.hpp`, and a recipe for starting the Abyss companion tools. Each config stands on its own: change the programs and monitor names to yours, then run `abyssctl reload`.

| Config | For |
|---|---|
| [Minimal](#minimal) | the smallest useful config, a good base |
| [dwm style](#dwm-style) | Alt as the main key, master layout, no decorations, no animations |
| [Katana look](#katana-look) | deep night blue, cold steel, gold; rounded corners, springs, a screensaver |
| [Laptop](#laptop) | touchpad and gestures, brightness and volume keys, lid, idle and lock |
| [Starting the Abyss tools](#starting-the-abyss-tools) | polkit agent, portal, wallpaper and blue-light filter through `c.onStart` |

::: tip
Programs such as `kitty`, `wofi`, `brightnessctl`, `playerctl` and `grim` are not part of Abyss. Install the ones you use, or swap in your own.
:::

## Minimal

Gaps, a border, a terminal, a launcher, workspaces and mouse dragging. Every other option keeps its default.

```cpp
#include <abyss/config.hpp>

using namespace abyss;

void configure(Config& c) {
    c.monitor("", "preferred", "auto", 1.0);

    c.general.gaps_in     = 5;
    c.general.gaps_out    = 10;
    c.general.border_size = 2;
    c.input.kb_layout     = "us";

    c.bind(SUPER, "Return", [] { return exec("kitty"); });
    c.bind(SUPER, "R", [] { return exec("wofi --show drun"); });
    c.bind(SUPER, "Q", closeWindow());
    c.bind(SUPER | SHIFT, "E", exit());
    c.bind(SUPER, "V", toggleFloating());
    c.bind(SUPER, "F", fullscreen());

    c.bind(SUPER, "left", moveFocus(Dir::Left));
    c.bind(SUPER, "right", moveFocus(Dir::Right));
    c.bind(SUPER, "up", moveFocus(Dir::Up));
    c.bind(SUPER, "down", moveFocus(Dir::Down));

    for (int i = 1; i <= 9; ++i) {
        const std::string key = std::to_string(i);
        c.bind(SUPER, key, workspace(i));
        c.bind(SUPER | SHIFT, key, moveToWorkspace(i));
    }

    c.bind(SUPER, "mouse:272", mouseMove(), {.mouse = true});
    c.bind(SUPER, "mouse:273", mouseResize(), {.mouse = true});
}
```

## dwm style

Inspired by dwm: **Alt** is the modifier, new windows become the master, a thin border, no gaps, no rounding, no shadows, no blur and no animations. The keys follow dwm's defaults where Abyssland has a matching action: `j` and `k` cycle the focus, `h` and `l` change the master size, `i` and `d` add and remove masters, `Return` promotes a window to master.

```cpp
#include <abyss/config.hpp>

using namespace abyss;

void configure(Config& c) {
    const Mods MOD = ALT;

    c.monitor("", "preferred", "auto", 1.0);

    // ---- look: plain and fast ----
    c.general.gaps_in       = 0;
    c.general.gaps_out      = 0;
    c.general.border_size   = 1;
    c.general.col.active_border   = rgb(0x005577);
    c.general.col.inactive_border = rgb(0x444444);
    c.general.layout        = "master";
    c.decoration.rounding   = 0;
    c.decoration.shadow.enabled = false;
    c.decoration.blur.enabled   = false;
    c.animations.enabled    = false;
    c.master.new_status     = "master";
    c.master.mfact          = 0.55;
    c.input.kb_layout       = "us";
    c.input.repeat_rate     = 50;
    c.input.repeat_delay    = 300;
    c.input.follow_mouse    = 1;

    // ---- launch ----
    c.bind(MOD, "p", [] { return exec("dmenu_run"); });
    c.bind(MOD | SHIFT, "Return", [] { return exec("st"); });

    // ---- windows and layout ----
    c.bind(MOD, "j", cycleNext());
    c.bind(MOD, "k", cycleNext(false));
    c.bind(MOD | SHIFT, "j", swapNext());
    c.bind(MOD | SHIFT, "k", swapNext(false));
    c.bind(MOD, "h", layoutMsg("mfact -0.05"), {.repeat = true});
    c.bind(MOD, "l", layoutMsg("mfact +0.05"), {.repeat = true});
    c.bind(MOD, "i", layoutMsg("addmaster"));
    c.bind(MOD, "d", layoutMsg("removemaster"));
    c.bind(MOD, "Return", layoutMsg("swapwithmaster"));
    c.bind(MOD, "t", setLayout("master"));
    c.bind(MOD, "m", setLayout("monocle"));
    c.bind(MOD, "space", toggleFloating());
    c.bind(MOD, "f", fullscreen());
    c.bind(MOD | SHIFT, "c", closeWindow());
    c.bind(MOD | SHIFT, "q", exit());

    // ---- monitors ----
    c.bind(MOD, "comma", focusMonitor("-1"));
    c.bind(MOD, "period", focusMonitor("+1"));
    c.bind(MOD | SHIFT, "comma", moveWindowToMonitor("-1"));
    c.bind(MOD | SHIFT, "period", moveWindowToMonitor("+1"));

    // ---- "tags": nine workspaces ----
    for (int i = 1; i <= 9; ++i) {
        const std::string key = std::to_string(i);
        c.bind(MOD, key, workspace(i));
        c.bind(MOD | SHIFT, key, moveToWorkspace(i));
    }

    // ---- mouse ----
    c.bind(MOD, "mouse:272", mouseMove(), {.mouse = true});
    c.bind(MOD, "mouse:273", mouseResize(), {.mouse = true});

    // dialogs float, like dwm's rules table
    c.windowRule({.cls = "^(Gimp)$"}, {.floating = true}, "float-gimp");
}
```

::: info A bar
dwm draws its own status bar. Abyssland does not: start the bar of your choice from [`c.onStart`](/wiki/config/events#startup-and-shutdown).
:::

## Katana look

The Abyss look: a deep night blue (`0x050816`), cold steel (`0x80b0d8`) for the active border and a gold accent (`0xc8a25a`). Sharp corners like a blade, a spring animation, a dark shadow, translucent inactive windows, and a gold clock as the screensaver.

```cpp
#include <abyss/config.hpp>

using namespace abyss;

void configure(Config& c) {
    // palette
    const Color night = rgb(0x050816);   // deep night blue
    const Color steel = rgb(0x80b0d8);   // cold steel
    const Color gold  = rgb(0xc8a25a);   // gold
    const Color dusk  = rgb(0x182234);   // inactive border

    c.monitor("", "preferred", "auto", 1.0);

    // ---- look ----
    c.general.gaps_in       = 5;
    c.general.gaps_out      = 10;
    c.general.border_size   = 2;
    c.general.col.active_border   = gradient({steel, gold}, 45);
    c.general.col.inactive_border = dusk;
    c.general.layout        = "dwindle";

    c.decoration.rounding         = 4;       // sharp, like a blade
    c.decoration.active_opacity   = 0.95;
    c.decoration.inactive_opacity = 0.8;
    c.decoration.shadow.enabled   = true;
    c.decoration.shadow.range     = 20;
    c.decoration.shadow.color     = rgba(0x020410, 0.9);
    c.decoration.blur.enabled     = true;
    c.decoration.blur.size        = 8;
    c.decoration.blur.passes      = 3;
    c.decoration.blur.vibrancy    = 0.5;

    c.group.col.border_active   = gold;
    c.group.groupbar.col.active = gold;
    c.group.groupbar.col.inactive = dusk;

    c.misc.disable_abyssland_logo = false;
    c.misc.force_default_wallpaper = -1;     // one of the bundled wallpapers at random
    c.misc.disable_splash_rendering = true;
    c.misc.background_color = night;

    c.dwindle.preserve_split = true;

    // ---- animations: a spring for windows, quick fades ----
    c.animations.enabled = true;
    c.bezier("ease", 0.25, 0.1, 0.25, 1.0);
    c.bezier("quick", 0.15, 0, 0.1, 1);
    c.spring("easy", 1, 878.5, 59.29);
    c.animation("global",     true, 10, "default");
    c.animation("windows",    true, 5, "easy");
    c.animation("windowsIn",  true, 4, "easy", "slide bottom");
    c.animation("windowsOut", true, 1.5, "quick", "slide top");
    c.animation("border",     true, 5, "ease");
    c.animation("fade",       true, 4, "quick");
    c.animation("workspaces", true, 3, "ease", "slidevert");

    // ---- input ----
    c.input.kb_layout    = "us";
    c.input.follow_mouse = 1;

    // ---- binds ----
    c.bind(SUPER, "Return", [] { return exec("kitty"); });
    c.bind(SUPER, "Space", [] { return exec("wofi --show drun"); });
    c.bind(SUPER, "Q", closeWindow());
    c.bind(SUPER | SHIFT, "Escape", exit());
    c.bind(SUPER, "V", toggleFloating());
    c.bind(SUPER, "F", fullscreen());
    c.bind(SUPER, "J", toggleSplit());
    c.bind(SUPER, "K", toggleGroup());

    c.bind(SUPER, "left", moveFocus(Dir::Left));
    c.bind(SUPER, "right", moveFocus(Dir::Right));
    c.bind(SUPER, "up", moveFocus(Dir::Up));
    c.bind(SUPER, "down", moveFocus(Dir::Down));
    c.bind(SUPER | SHIFT, "left", moveWindow(Dir::Left));
    c.bind(SUPER | SHIFT, "right", moveWindow(Dir::Right));
    c.bind(SUPER | SHIFT, "up", moveWindow(Dir::Up));
    c.bind(SUPER | SHIFT, "down", moveWindow(Dir::Down));

    for (int i = 1; i <= 9; ++i) {
        const std::string key = std::to_string(i);
        c.bind(SUPER, key, workspace(i));
        c.bind(SUPER | SHIFT, key, moveToWorkspace(i));
    }
    c.bind(SUPER, "S", toggleSpecial("magic"));
    c.bind(SUPER | SHIFT, "S", moveToSpecial("magic"));
    c.bind(SUPER, "mouse_down", workspace("e+1"));
    c.bind(SUPER, "mouse_up", workspace("e-1"));
    c.bind(SUPER, "mouse:272", mouseMove(), {.mouse = true});
    c.bind(SUPER, "mouse:273", mouseResize(), {.mouse = true});

    c.bind(NONE, "Print", [] { return exec("grim -g \"$(slurp)\" - | wl-copy"); });

    // ---- rules ----
    c.windowRule({}, {.suppressEvent = "maximize"}, "suppress-maximize");
    c.windowRule({.cls = "^(org.pulseaudio.pavucontrol)$"}, {.floating = true, .center = true, .size = "800 600"}, "float-pavucontrol");
    c.layerRule(LayerMatch{.nspace = "^(waybar)$"}, LayerEffects{.blur = true, .ignoreAlpha = 0.3}, "bar-blur");

    // ---- screensaver: a gold clock on night blue ----
    c.idle(300, screensaver(saver::clock({.color = 0xc8a25a, .size = 180, .background = 0x050816})));
}
```

## Laptop

A touchpad, gestures, the brightness and volume keys, the lid switch, and a staged idle: dim, lock, screen off, suspend. Locking uses [AbyssLock](/wiki/getting-started#companion-tools) (`abysslock`); brightness uses `brightnessctl`, volume `wpctl` (PipeWire).

```cpp
#include <abyss/config.hpp>

#include <fstream>

using namespace abyss;

void configure(Config& c) {
    // ---- display: let Abyssland pick a scale that fits the panel ----
    c.monitor("eDP-1", "preferred", "0x0", "auto");
    c.monitor("", "preferred", "auto-right", 1.0);       // an external monitor goes to the right

    // ---- input ----
    c.input.kb_layout    = "us";
    c.input.follow_mouse = 1;
    c.input.touchpad.natural_scroll       = true;
    c.input.touchpad.tap_to_click         = true;
    c.input.touchpad.tap_and_drag         = true;
    c.input.touchpad.disable_while_typing = true;
    c.input.touchpad.clickfinger_behavior = true;         // 1 / 2 / 3 finger click = left / right / middle
    c.input.touchpad.scroll_factor        = 0.6;

    // ---- gestures ----
    c.gestures.workspace_swipe_distance     = 300;
    c.gestures.workspace_swipe_cancel_ratio = 0.2;
    c.gesture(3, "horizontal", "workspace");              // three fingers: switch workspace
    c.gesture(4, "pinch", "fullscreen", {.mode = "fullscreen"});
    c.gesture(3, "down", [] { exec("grim"); });           // screenshot when the fingers are lifted

    // ---- look: light on the battery ----
    c.general.gaps_in  = 3;
    c.general.gaps_out = 6;
    c.decoration.rounding     = 6;
    c.decoration.blur.enabled = false;                    // blur costs battery
    c.decoration.shadow.enabled = false;
    c.animations.enabled = true;
    c.bezier("quick", 0.15, 0, 0.1, 1);
    c.animation("global", true, 6, "quick");

    // ---- keys ----
    c.bind(SUPER, "Return", [] { return exec("kitty"); });
    c.bind(SUPER, "R", [] { return exec("wofi --show drun"); });
    c.bind(SUPER, "Q", closeWindow());
    c.bind(SUPER, "V", toggleFloating());
    c.bind(SUPER, "F", fullscreen());
    c.bind(SUPER, "L", [] { return exec("abysslock"); });
    for (int i = 1; i <= 9; ++i) {
        const std::string key = std::to_string(i);
        c.bind(SUPER, key, workspace(i));
        c.bind(SUPER | SHIFT, key, moveToWorkspace(i));
    }
    c.bind(SUPER, "mouse:272", mouseMove(), {.mouse = true});
    c.bind(SUPER, "mouse:273", mouseResize(), {.mouse = true});

    // brightness and volume: also on the lock screen, repeating while held
    c.bind(NONE, "XF86MonBrightnessUp", [] { return exec("brightnessctl -e4 -n2 set 5%+"); }, {.locked = true, .repeat = true});
    c.bind(NONE, "XF86MonBrightnessDown", [] { return exec("brightnessctl -e4 -n2 set 5%-"); }, {.locked = true, .repeat = true});
    c.bind(NONE, "XF86AudioRaiseVolume", [] { return exec("wpctl set-volume -l 1 @DEFAULT_AUDIO_SINK@ 5%+"); }, {.locked = true, .repeat = true});
    c.bind(NONE, "XF86AudioLowerVolume", [] { return exec("wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-"); }, {.locked = true, .repeat = true});
    c.bind(NONE, "XF86AudioMute", [] { return exec("wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle"); }, {.locked = true});
    c.bind(NONE, "XF86AudioMicMute", [] { return exec("wpctl set-mute @DEFAULT_AUDIO_SOURCE@ toggle"); }, {.locked = true});
    c.bind(NONE, "XF86AudioPlay", [] { return exec("playerctl play-pause"); }, {.locked = true});
    c.bind(NONE, "XF86AudioNext", [] { return exec("playerctl next"); }, {.locked = true});
    c.bind(NONE, "XF86AudioPrev", [] { return exec("playerctl previous"); }, {.locked = true});

    // lid closed: lock, then suspend (use `loginctl suspend` where there is no systemd)
    c.bind(NONE, "switch:on:Lid Switch", [] { return exec("abysslock & sleep 1; systemctl suspend"); }, {.locked = true});

    // ---- idle: dim, lock, screen off, suspend ----
    c.misc.mouse_move_enables_dpms = true;
    c.misc.key_press_enables_dpms  = true;
    c.idle(150, [] { exec("brightnessctl -s set 10%"); },      // dim after 2.5 minutes
                [] { exec("brightnessctl -r"); });             // and restore on the first input
    c.idle(300, [] { exec("abysslock"); });                     // lock after 5 minutes
    c.idle(330, [] { run(dpms("off")); },                       // screen off 30 seconds later
                [] { run(dpms("on")); });
    c.idle(1800, [] { exec("systemctl suspend"); });            // suspend after 30 minutes

    // ---- battery warning, from plain C++ ----
    c.timer(60'000, [] {
        std::ifstream f("/sys/class/power_supply/BAT0/capacity");
        int percent = 100;
        if (f >> percent && percent <= 10)
            notify("battery at " + std::to_string(percent) + " percent", 10'000, std::nullopt, "warning");
    }, /*repeat=*/true);
}
```

::: tip No battery called BAT0?
List your supply names with `ls /sys/class/power_supply` and change the path.
:::

## Starting the Abyss tools

Installing a tool does not start it, see [Tools](/wiki/tools). The companion programs can be started from the config with [`c.onStart`](/wiki/config/events#startup-and-shutdown), which runs once per compositor process:

```cpp
void startAbyssTools(Config& c) {
    c.onStart([] {
        // polkit authentication agent: only ONE agent may run per session
        exec("/usr/libexec/abyss-polkit-agent");

        // the Abyss desktop portal (screen sharing, screenshots, global shortcuts)
        exec("/usr/libexec/xdg-desktop-portal-abyss");

        // wallpaper daemon, reads ~/.config/abyss/abysspaper.conf
        exec("abysspaper");

        // blue-light filter, reads ~/.config/abyss/abyssdusk.conf
        exec("abyssdusk");
    });
}
```

Put the function into `configure()` (`startAbyssTools(c);`) or paste its body in directly.

::: details Notes on each tool
- **abyss-polkit-agent** lives in the libexec directory of your prefix (`/usr/libexec` for distribution packages). Only one polkit agent can be registered per session, so do not start another one next to it. It ships a systemd user unit and the D-Bus service `org.abyssland.AbyssPolkitAgent`; its optional config is `~/.config/abyss-polkit-agent/abyss-polkit-agent.conf`.
- **xdg-desktop-portal-abyss** is normally started on demand through D-Bus activation (the package installs the service file and a systemd user unit), so you usually do not need to start it by hand. Start it from `onStart` only if activation does not work on your system. Portal selection is described in [Desktop portals](/wiki/portals).
- **abysspaper** shows your own images (`cover`, `contain`, `tile` and `fill` modes), configured in `~/.config/abyss/abysspaper.conf`. Use static images: video and GIF wallpapers are not usable yet. Without it Abyssland draws its own bundled wallpaper, see `c.misc.force_default_wallpaper`.
- **abyssdusk** applies the profiles of `~/.config/abyss/abyssdusk.conf` (a color temperature by time of day), see [Tools](/wiki/tools#abyssdusk). It needs the Abyss protocol `abyssland_ctm_control_manager_v1`, so it only works on Abyssland.
:::

Example configs for the two daemons:

::: code-group

```ini [abysspaper.conf]
wallpaper {
    monitor =
    path = ~/Pictures/wall.png
    fit_mode = cover
}
```

```ini [abyssdusk.conf]
max-gamma = 100

profile {
    time = 7:30
    identity = true
}

profile {
    time = 20:30
    temperature = 3500
    gamma = 0.8
}
```

:::

::: tip Services instead
With systemd the packages ship user units. Instead of `c.onStart` you can run `systemctl --user enable --now abysspaper abyssdusk`. Pick one way per tool, not both.
:::

::: info Without systemd
A session without systemd (for example Void with runit) has no user manager that imports the session environment. Start `dbus-update-activation-environment --all` first in `c.onStart`, so D-Bus activated services such as the portal see `WAYLAND_DISPLAY`.
:::
