# Environment, cursor and helpers

The system side of the config: environment variables, the cursor theme, the bundled wallpapers, GPU selection, the programs the compositor starts, permissions, your own `abyssctl` commands and events, and extra source files compiled into Abyssland.

## Environment variables

```cpp
void env(std::string name, std::string value, bool dbus = false);
```

`c.env` sets an environment variable for the compositor and everything it starts. With `dbus = true` the variable is also imported into the D-Bus activation environment (and the systemd user manager where systemd is used), so services started through D-Bus see it.

```cpp
c.env("GDK_BACKEND", "wayland,x11,*");
c.env("QT_QPA_PLATFORM", "wayland;xcb");
c.env("SDL_VIDEODRIVER", "wayland,x11");
c.env("MOZ_ENABLE_WAYLAND", "1", true);       // also for D-Bus activated programs
```

An empty name is an error. On a reload the environment is only touched when the value changed.

Because the config is C++, you can set a variable only where it applies:

```cpp
#include <filesystem>

// NVIDIA variables only when the NVIDIA driver is loaded
if (std::filesystem::exists("/proc/driver/nvidia/version")) {
    c.env("LIBVA_DRIVER_NAME", "nvidia");
    c.env("__GLX_VENDOR_LIBRARY_NAME", "nvidia");
    c.env("NVD_BACKEND", "direct");
}
```

See [NVIDIA](/wiki/nvidia) for the variables that matter on NVIDIA cards.

## Cursor theme and size

Set the theme and logical size in one place:

```cpp
c.cursor.theme = "Adwaita";
c.cursor.size  = 24;
```

An explicit theme is used for both Abysscursor and XCursor clients. Abyssland synchronizes the XCursor fallback, gsettings, the XWayland root cursor and the `Xcursor.theme` / `Xcursor.size` X resources, preserving unrelated X resources. It exports `XCURSOR_THEME`, `XCURSOR_SIZE`, `ABYSSCURSOR_THEME` and `ABYSSCURSOR_SIZE` to newly launched children.

In a real desktop session these four variables are also sent asynchronously to the D-Bus activation environment and an already running systemd user manager. This works without systemd; no user manager is started. Nested compositors skip activation export so they do not change their parent's launch environment. `ABYSSLAND_NO_SD_VARS=1` disables activation export.

The defaults `theme = ""` and `size = 0` preserve the startup environment's selection, including separate native and XCursor themes. A size of zero uses the startup size (native if available and enabled, otherwise XCursor); invalid environment sizes fall back to 24. `c.cursor.enable_abysscursor = false` selects XCursor rendering. Changing typed cursor options through a config reload or `abyss::set` refreshes the cursor. `abyssctl setcursor <theme> <size>` applies a temporary change; it does not edit your compiled config.

Applications may retain cursors they already loaded. Theme synchronization does not guarantee that every running app immediately reloads its cursor assets. All cursor fields are in [Options](/wiki/config/options#c-cursor).

## Bundled wallpapers

Abyssland includes seven backgrounds, named `wall0.png` through `wall6.png`. The four newest variants show mist and water, a katana with tentacles, a stone wall with a gold crack, and a minimal katana scene. They use artwork generated with Google Flow for Abyss.

```cpp
c.misc.disable_abyssland_logo = false;
c.misc.disable_splash_rendering = true;
c.misc.force_default_wallpaper = -1;   // choose randomly at compositor startup
// c.misc.force_default_wallpaper = 4; // always use wall4.png
```

The background stays fixed during the session; there is no timed slideshow. An external wallpaper client such as AbyssPaper can cover it, see the recipe in [Example configs](/wiki/config/examples#starting-the-abyss-tools). New bundled files belong in `assets/install/` of the source tree, numbered consecutively without gaps. CMake detects added assets on the next build and includes them in the installation.

## GPU and backend (`c.gpu`)

`c.gpu` is the typed form of the `ABYSSAL_*` variables (see [NVIDIA](/wiki/nvidia)). The values are read once at start, before the backend exists.

```cpp
c.gpu.devices        = {"/dev/dri/by-path/pci-0000:0b:00.0-card", "/dev/dri/card1"};
c.gpu.noModifiers    = true;
c.gpu.noExplicitMgpu = true;
```

| Field | Variable | Meaning |
|---|---|---|
| `devices` | `ABYSSAL_DRM_DEVICES` | DRM devices to use, the first one is primary |
| `noModifiers` | `ABYSSAL_NO_MODIFIERS` | no explicit buffer modifiers (old drivers) |
| `noExplicitMgpu` | `ABYSSAL_MGPU_NO_EXPLICIT` | no explicit sync between GPUs |
| `noAtomic` | `ABYSSAL_NO_ATOMIC` | legacy KMS instead of atomic modesetting |
| `eglNoModifiers` | `ABYSSLAND_EGL_NO_MODIFIERS` | the renderer ignores modifiers |

- Paths in `devices` that do not exist are skipped with a warning, so one config works on several machines. If none exists, the variable is left alone and the backend picks automatically.
- Fields you do not set leave the environment alone. Variables from your login environment stay as they are.
- A reload that changes them only warns (it takes effect after a restart).

## Helper programs (`c.helpers`)

The compositor starts a few programs of its own. Each can be replaced by your own, given as a name in `PATH` or as a path containing `/`.

```cpp
c.helpers.dialog       = "my-dialog";
c.helpers.updateScreen = "";   // never show the update screen
c.helpers.donateScreen = "";
```

| Field | Default | Used for |
|---|---|---|
| `dialog` | `abyss-dialog` | "app not responding" and permission prompts |
| `updateScreen` | `abyssland-update-screen` | shown once after an update as `<updateScreen> --new-version <version>`, only without `ecosystem:no_update_news` |
| `donateScreen` | `abyssland-donate-screen` | donation reminder, no arguments, only without `ecosystem:no_donation_nag` |

An empty value never starts the helper. For the dialog, the request is then treated like a closed dialog: a permission prompt is denied and "app not responding" shows nothing. A helper that is not found is logged when the config loads.

The dialog contract:

```
my-dialog --title "<title>" --text "<text>" --buttons "<a>;<b>;..."
```

The program shows the dialog, prints the label of the pressed button on stdout and exits. Any program that follows this works, a script included.

## Permissions

`c.permission(binary, type, mode)` sets rules for programs that want sensitive access. They only apply with `c.ecosystem.enforce_permissions = true`.

```cpp
c.ecosystem.enforce_permissions = true;
c.permission("/usr/bin/grim", "screencopy", "allow");
c.permission("/usr/bin/wf-recorder", "screencopy", "ask");
c.permission("/usr/bin/some-tool", "keyboard", "deny");
```

| Argument | Values |
|---|---|
| `type` | `screencopy`, `cursorpos`, `keyboard` (or `keeb`), `input-capture` |
| `mode` | `allow`, `ask`, `deny` |

An unknown type or mode is an error. The rules are registered on the first load of a session. The `ask` answer is shown with the dialog helper, see above.

## Wayland protocols

Which protocols (globals) Abyssland offers is configured with `c.protocol(...)` and `c.protocols.*`. By default everything is offered. This has its own page: [Wayland protocols](/wiki/protocols).

```cpp
c.protocol("zwlr_screencopy_manager_v1", false);
c.protocols.disable({"abyssland_toplevel_export_manager_v1", "ext_image_copy_capture_manager_v1"});
c.protocol("zwlr_screencopy_manager_v1", {.maxVersion = 2});
```

Two functions tell you what is offered, for example in a bind:

```cpp
std::vector<ProtocolInfo> knownProtocols();                 // name, core, enabled, maxVersion, note
bool                      protocolEnabled(std::string_view name);
```

```cpp
c.bind(SUPER, "F4", [] {
    notify(protocolEnabled("zwlr_screencopy_manager_v1") ? "wlr screencopy is on" : "wlr screencopy is off");
    for (const auto& p : knownProtocols())
        if (!p.enabled)
            print("protocol off: {}", p.name);
    return ok();
});
```

`abyssctl protocols` shows the same from a shell.

## Commands and user events

`c.command(name, fn)` registers your own command. Scripts and bars call it with `abyssctl run`.

```cpp
c.command("gaps", [](std::string_view a) {
    abyss::set("general:gaps_in", std::stoi(std::string(a)));
    return std::string{};
});

c.command("ping", [](std::string_view) { return std::string("pong"); });
```

```sh
abyssctl run            # lists the registered names
abyssctl run ping       # pong
abyssctl run gaps 8     # ok
```

- `fn` gets the rest of the line and returns the reply, which `abyssctl` prints. An empty reply prints `ok`.
- An exception is caught and comes back as the error text.
- Names may contain letters, digits, `_`, `-` and `.` (at most 64 characters). Registering a name twice replaces it.
- A reload drops all commands, and the config registers them again.
- `fn` can be any callable taking `std::string_view` and returning `void` or something convertible to `std::string`.

`abyss::emit(name, data)` sends the event `user.<name>>>data` to every socket2 listener, the same socket as the built-in events. It returns `false` for a bad name, and newlines in `data` become spaces.

```cpp
c.bind(SUPER, "F9", [] { emit("mic", "muted"); return ok(); });
```

```sh
# read the events from a script or a bar
socat -U - UNIX-CONNECT:"$XDG_RUNTIME_DIR/abyss/$ABYSSLAND_INSTANCE_SIGNATURE/.socket2.sock" |
  while IFS= read -r line; do
    case $line in user.mic'>>'*) echo "mic: ${line#user.mic>>}";; esac
  done
```

## Own source files (ABYSS_USER_SOURCES)

Own code does not need a fork. `ABYSS_USER_SOURCES` lists extra `.cpp` files that are compiled into Abyssland (own protocols, managers, helpers for the config), `ABYSS_USER_INCLUDE_DIRS` the include directories for them. Both are CMake cache variables, separated by `;`. Relative paths are relative to the directory of your `config.hpp`. They live in the CMake cache, so `abyssctl reload` keeps them.

```sh
cmake -B build -DABYSS_USER_SOURCES="mods/myproto.cpp;mods/extra.cpp" -DABYSS_USER_INCLUDE_DIRS="mods"
```

A listed file that does not exist stops CMake with an error. The config path itself is the cache variable `ABYSS_CONFIG` (default `~/.config/abyss/config.hpp`). Code added this way is your own responsibility, see [Patching and replacing](/wiki/patching).

::: info More extension points
Portals, protocols, helpers, commands and the activation environment are collected on [Patching and replacing](/wiki/patching).
:::
