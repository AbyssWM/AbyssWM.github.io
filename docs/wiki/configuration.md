# Configuration (Abysslang)

**Abysslang** is how Abyssland is configured: your configuration is a C++ file that is compiled into the compositor, in the spirit of dwm's `config.h`. There is no config file to parse at runtime and no scripting layer.

```cpp
#include <abyss/config.hpp>

using namespace abyss;

void configure(Config& c) {
    c.general.gaps_in  = 5;
    c.general.gaps_out = 20;
    c.bind(SUPER, "Q", [] { return exec("kitty"); });
}
```

The reference that used to live on this page is now the **[Configuration guide](/wiki/config/)**, split into one page per topic and with examples for everything. Start with the [Quickstart](/wiki/config/), or copy a complete config from [Example configs](/wiki/config/examples).

::: warning Work in progress
Abysslang is under active development. The guide is written from the current headers (`include/abyss/*.hpp`), but names and details may still change before 1.0.0.
:::

## Where to find what

| I want to ... | Go to |
|---|---|
| find the config file, rebuild, reload, fix a compile error | [Quickstart](/wiki/config/) |
| change gaps, borders, blur, input, cursor ... | [Options](/wiki/config/options) |
| set up monitors, scaling, rotation, workspaces | [Monitors and workspaces](/wiki/config/monitors) |
| bind keys, gestures, submaps, see every action | [Keybinds and actions](/wiki/config/keybinds) |
| float or place windows automatically | [Rules](/wiki/config/rules) |
| tune animations | [Animations](/wiki/config/animations) |
| react to events, timers, idle, screensaver | [Events, timers, idle and screensaver](/wiki/config/events) |
| read windows, monitors or options, show notifications | [Queries, notifications and logging](/wiki/config/queries) |
| write my own tiling layout | [Custom layouts](/wiki/config/layouts) |
| set environment, GPU, helpers, permissions, own commands | [Environment, cursor and helpers](/wiki/config/system) |
| choose Wayland protocols | [Wayland protocols](/wiki/protocols) |
| start from a working config | [Example configs](/wiki/config/examples) |

## Where the old sections went

Nothing was dropped. If you followed a link to a section of this page, this is where it lives now.

| Old section | New place |
|---|---|
| Concept, minimal config, splitting your config | [Quickstart](/wiki/config/) |
| Options, value helpers, `c.set`, per-device settings | [Options](/wiki/config/options) |
| Reading options | [Queries](/wiki/config/queries#reading-and-setting-options) |
| Cursor theme and size, bundled wallpapers | [Environment, cursor and helpers](/wiki/config/system) |
| Programs, environment and autostart | [Events](/wiki/config/events#startup-and-shutdown) and [Environment](/wiki/config/system#environment-variables) |
| Binds and actions, available actions, window selectors | [Keybinds and actions](/wiki/config/keybinds) |
| Window and layer rules | [Rules](/wiki/config/rules) |
| Monitors and workspaces | [Monitors and workspaces](/wiki/config/monitors) |
| Animations and curves | [Animations](/wiki/config/animations) |
| Events | [Events](/wiki/config/events#events) |
| Notifications, logging and small helpers, reading state | [Queries](/wiki/config/queries) |
| Timers, idle, screensaver | [Events](/wiki/config/events#timers) |
| Handles | [Rules](/wiki/config/rules#handles) |
| Submaps, gestures and permissions | [Keybinds](/wiki/config/keybinds#submaps) and [Environment](/wiki/config/system#permissions) |
| Custom layouts | [Custom layouts](/wiki/config/layouts) |
