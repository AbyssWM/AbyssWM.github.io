# Configuration guide

**Abysslang** is how Abyssland is configured: your configuration is a C++ file that is compiled into the compositor, in the spirit of dwm's `config.h`. There is no config file to parse at runtime and no scripting layer. Options are typed fields, binds are function calls, and anything C++ can do is allowed.

This guide walks through every part of the API, with examples. Everything in it is taken from the public headers (`include/abyss/*.hpp`) and the default config (`config.def.hpp`).

::: warning Work in progress
Abysslang is under active development. Names and details may still change before 1.0.0.
:::

## The pages

| Page | What is in it |
|---|---|
| **Quickstart** (this page) | where the config lives, how to rebuild and reload, common compile errors |
| [Options](/wiki/config/options) | every option group as a table: field, type, default, range, description |
| [Monitors and workspaces](/wiki/config/monitors) | `c.monitor`, `c.disableMonitor`, `c.workspaceRule` |
| [Keybinds and actions](/wiki/config/keybinds) | `c.bind`, bind flags, submaps, gestures, every built-in action |
| [Window, layer and workspace rules](/wiki/config/rules) | matchers, effects, handles |
| [Animations](/wiki/config/animations) | curves, springs, animation leaves and styles |
| [Events, timers, idle and screensaver](/wiki/config/events) | `c.on`, `c.onStart`, `c.timer`, `c.idle`, `screensaver(...)` |
| [Queries, notifications and logging](/wiki/config/queries) | reading windows, monitors and options, `notify`, `print` |
| [Custom layouts](/wiki/config/layouts) | `c.addLayout`, `LayoutCtx`, `TiledLayout` |
| [Environment, cursor and helpers](/wiki/config/system) | `c.env`, `c.cursor`, `c.gpu`, `c.helpers`, `c.command`, `ABYSS_USER_SOURCES` |
| [Example configs](/wiki/config/examples) | four complete, copy-and-paste configs and a recipe for the companion tools |
| [Wayland protocols](/wiki/protocols) | `c.protocol`, `c.protocols.*` |

## Where the config lives

Your config is one header, `~/.config/abyss/config.hpp`. It defines one function, `configure(Config&)`, which runs on every config load (at start and after a reload).

```cpp
#include <abyss/config.hpp>

using namespace abyss;

void configure(Config& c) {
    c.general.gaps_in  = 5;
    c.general.gaps_out = 20;
    c.bind(SUPER, "Return", [] { return exec("kitty"); });
}
```

- Everything registered inside `configure()` (binds, rules, listeners, timers, animations, ...) is cleared before the next load, so nothing is registered twice.
- Because it is plain C++, you can use variables, loops, functions and your own lambdas as keybind actions.
- **Typed options:** options are fields such as `c.general.gaps_in`. Misspell one and the build fails, there are no silently ignored typos.
- **Designated initializers** (`{.cls = "x"}`) must list their fields in declaration order, a C++ rule. The order is the one in the tables of this guide.

### Start from the default config

The default config is `config.def.hpp` in the Abyssland source tree. When CMake configures Abyssland and no config exists yet, it copies that file to `~/.config/abyss/config.hpp`, like dwm's `config.def.h`. The path can be changed with the CMake cache variable `ABYSS_CONFIG`.

```sh
mkdir -p ~/.config/abyss
cp config.def.hpp ~/.config/abyss/config.hpp   # only if CMake did not do it already
```

### Split the config into several files

A big config is easier to keep in several headers. Each extra file holds ordinary C++ functions taking `Config&` and is pulled in with `#include`. Includes are resolved relative to the file that contains them, so keep the files next to `config.hpp`.

::: code-group

```cpp [config.hpp]
#include <abyss/config.hpp>
#include "binds.hpp"
#include "rules.hpp"

using namespace abyss;

void configure(Config& c) {
    c.general.gaps_in = 5;
    setupBinds(c);
    setupRules(c);
}
```

```cpp [binds.hpp]
#pragma once
#include <abyss/config.hpp>

inline void setupBinds(abyss::Config& c) {
    using namespace abyss;
    c.bind(SUPER, "Q", killActive());
    c.bind(SUPER, "Return", [] { return exec("kitty"); });
}
```

```cpp [rules.hpp]
#pragma once
#include <abyss/config.hpp>

inline void setupRules(abyss::Config& c) {
    c.windowRule({.cls = "^(pavucontrol)$"}, {.floating = true}, "float-pavucontrol");
}
```

:::

::: tip
Mark helper functions `inline` and start each header with `#pragma once`. Your config is compiled as a single translation unit.
:::

Extra `.cpp` files (own protocols, managers, helpers) can be compiled into Abyssland as well, see [ABYSS_USER_SOURCES](/wiki/config/system#own-source-files-abyss-user-sources).

## Rebuild and reload

Abyssland's config is C++ compiled into the binary, so a change needs a rebuild. `abyssctl reload` does it:

```sh
abyssctl reload            # build, install, restart Abyssland
abyssctl reload --dry-run  # build only, install and restart nothing
abyssctl reload --no-build # re-apply the already compiled config in place
```

`abyssctl reload`:

1. builds the `Abyssland` target (`cmake --build`, with progress),
2. on a compile error shows the first error as a notification, keeps the session running and exits with code 1 (the full log is written to `abyssctl-reload.log` in the build directory),
3. otherwise saves the installed binary as `Abyssland.last-good`, runs `cmake --install` and asks Abyssland to restart through `start-abyssland`.

A restart closes your windows. **If the new binary dies right after starting, the start wrapper tries it again up to five times (the old instance may still hold the seat) and then falls back to `Abyssland.last-good`.** That protects you from a binary that crashes. It cannot protect you from a config that compiles and runs but does the wrong thing, such as unbinding every key, so keep a way to start a terminal and to exit bound, and keep a known-good copy of your config.

The build directory and prefix can be overridden with `ABYSS_SOURCE_DIR`, `ABYSS_BUILD_DIR` and `ABYSS_PREFIX`, see the [abyssctl reference](/wiki/abyssctl#reload). Useful companions while you edit:

```sh
abyssctl configerrors   # runtime config errors (bad monitor mode, unknown effect, ...)
abyssctl doctor         # what differs from the default config
abyssctl rollinglog -f  # follow the compositor log
```

::: info What `--no-build` does
`--no-build` runs `configure()` again inside the running compositor. Registered binds, rules, timers and listeners are rebuilt, but nothing is compiled, so source edits are not picked up. `c.onStart` callbacks and the GPU and protocol settings are not applied again, see [Events](/wiki/config/events#startup-and-shutdown) and [Wayland protocols](/wiki/protocols#rules-of-the-game).
:::

::: info Package installations
Distribution packages ship the public default configuration. On a package installation the first `abyssctl reload` sets up your own build in the hidden `~/.config/abyss/.build` (sources in `.build/src`, cloned if missing) and replaces the installed compositor binary (`/usr/bin/Abyssland` for packages) with your build, asking for root via `sudo` or `pkexec`. A package update puts the packaged binary back, so run `abyssctl reload` again after one. You need git, CMake, a C++26 compiler (a recent GCC) and the `-devel` / `-dev` packages of the Abyss libraries (for example `abyssutils-devel` on Fedora and Void, `libabyssutils-dev` on Debian and Ubuntu). Details in the [abyssctl reference](/wiki/abyssctl#reload).
:::

## Common compile errors

The first compiler error is what `abyssctl` shows. These are the ones you will meet.

| Message | Cause and fix |
|---|---|
| `... has no member named 'gapz_in'; did you mean 'gaps_in'?` | A typo in an option name. Options are fields, so the compiler suggests the right one. |
| `no match for 'operator=' (operand types are 'abyss::Opt<long int>' and 'const char [2]')` | Wrong value type: `c.general.border_size = "2";`. Strings for strings, numbers for numbers, `rgb(...)` for colors, see [Options](/wiki/config/options#value-types). |
| `designator order for field 'abyss::WindowEffects::floating' does not match declaration order` | A designated initializer lists its fields in the wrong order. Use the order of the tables: `{.floating = true, .center = true}`, not `{.center = true, .floating = true}`. |
| `no matching function for call to 'abyss::Config::bind(const abyss::Mods&, const char [2], SDispatchResult)'` | `exec()` runs at once and returns a result, not an action. Wrap it: `c.bind(SUPER, "Q", [] { return exec("kitty"); });` |
| `use of deleted function 'abyss::Action abyss::moveWindow(Dir, const char*)'` | A string literal would silently mean `silent = true`. Pass the bool: `moveWindow(Dir::Left, false, "class:x")`. |
| `ignoring returned value of type 'abyss::Action', declared with attribute 'nodiscard'` | An action was created but never used. Pass it to `c.bind` or run it with `run(...)`, see [Actions](/wiki/config/keybinds#running-actions-from-your-own-code). |
| `'Config' was not declared in this scope; did you mean 'abyss::Config'?` | Add `using namespace abyss;` after the include, or write `abyss::Config`. The same goes for `SUPER` and every action. |

Some mistakes only show when the config loads, because the value is checked at runtime: a monitor mode that cannot be parsed, an unknown animation leaf, a bezier point out of range, an option value outside its range. They appear in the error overlay and in `abyssctl configerrors`.

::: details Typed fields are applied after configure() returns
Typed fields such as `c.general.gaps_in = 5` are collected while `configure()` runs and applied afterwards. Reading an option inside `configure()` therefore still shows the old value. Read options in callbacks, binds, timers and event listeners instead, see [Queries](/wiki/config/queries#reading-and-setting-options).
:::

## Next steps

- Start with a complete config from [Example configs](/wiki/config/examples) and change it piece by piece.
- Look up a field in [Options](/wiki/config/options), a function in [Keybinds and actions](/wiki/config/keybinds).
- Everything that can be replaced or patched is listed in [Patching and replacing](/wiki/patching).
