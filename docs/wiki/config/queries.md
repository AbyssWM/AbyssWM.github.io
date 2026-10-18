# Queries, notifications and logging

Everything you could read from Hyprland's Lua API is available as plain functions: windows, workspaces, monitors, layer surfaces, groups, the cursor and the options. This page lists them, together with notifications and logging.

Handles are the compositor's own shared pointers (`PHLWINDOW`, `PHLWORKSPACE`, `PHLMONITOR`, `PHLLS`, `PHLGROUP`). Every accessor accepts a null handle and then returns an empty value (`0`, `false`, `""`, a null handle, an empty list or `std::nullopt`), it never crashes. Lua returned `nil` for "not there"; here that is a null handle, `std::nullopt` or an empty list as noted per function. Reads change nothing, except `monitorSetWorkspace`, `monitorSetSpecialWorkspace`, `groupAdd` and `groupRemove`.

```cpp
c.bind(SUPER, "I", [] {
    for (auto& w : windows({.workspace = activeWorkspace(monitorAtCursor()), .floating = true}))
        notify(windowTitle(w));
    return ok();
});
```

::: warning Read in callbacks, not in configure()
Typed option fields are applied after `configure()` returned, and windows or monitors may not exist yet while it runs. Do your reads in binds, timers, event listeners and `onStart` callbacks.
:::

## Reading and setting options

`abyss::getOption(name)` returns the current value of any option by its string name, the counterpart of `hl.get_config` in Hyprland's Lua API. `abyss::get<T>(name)` reads it typed. Both return `std::optional`, empty when the option does not exist.

```cpp
c.bind(SUPER, "G", [] {
    auto gaps   = get<int>("general:gaps_in");            // std::optional<int>
    auto blur   = get<bool>("decoration:blur:enabled");
    auto layout = get<std::string>("general:layout");
    if (gaps && *gaps < 20)
        set("general:gaps_in", *gaps + 5);
    if (blur.value_or(false))
        notify("blur is on, layout " + layout.value_or("unknown"));
    return ok();
});
```

| Function | Purpose |
|---|---|
| `get<T>(name)` | typed read; `T` is a number (`int`, `float`, `double`, ...), `bool`, `std::string`, `Vec2` or `Gap` |
| `getOption(name)` | the raw value, a `std::variant` (`OptionValue`) of `bool`, `int64_t`, `double`, `std::string`, `Vec2` and `Gap`; empty if there is no such option |
| `optionSetByUser(name)` | true when the config (or `set()`) changed the option, false while it still has its default or does not exist |
| `set(name, value)` | change an option at runtime; returns `false` (and notifies) for an unknown option or a bad value |
| `setOption(name, variant)` | the same with an explicit `std::variant<bool, int64_t, double, std::string, Color, Gradient, Vec2, Gap>` |

Names use the form `section:key` or `section:sub:key`, as in `"general:gaps_in"` and `"decoration:blur:enabled"` (the field `c.general.gaps_in` is the option `general:gaps_in`).

`T` conversions: numbers and `bool` convert into each other, and anything converts to `std::string`. A `Gap` whose four sides are equal reads as a plain number. If the type does not fit (for example `Vec2` on an integer option), the result is empty. Other complex values come back as their config string: a gradient is a `std::string`, while colors are returned as an `int`.

## Windows

```cpp
PHLWINDOW              activeWindow();
PHLWINDOW              windowByAddress(std::string_view address /* "0x..." */);
PHLWINDOW              windowBySelector(std::string_view selector);
std::vector<PHLWINDOW> windows();
std::vector<PHLWINDOW> windows(const WindowFilter& filter);
PHLWINDOW              urgentWindow();
PHLWINDOW              lastWindow();
```

`windows()` without arguments is all mapped windows. `windows(WindowFilter)` returns the windows where every set field matches:

| `WindowFilter` field | Type | Meaning |
|---|---|---|
| `.monitor` | `PHLMONITOR` | only this monitor (null = any) |
| `.workspace` | `PHLWORKSPACE` | only this workspace (null = any) |
| `.floating` | optional bool | floating or tiled |
| `.mapped` | optional bool | default `true` (mapped windows only); `std::nullopt` returns both |
| `.className` | optional string | window class |
| `.title` | optional string | window title |
| `.tag` | optional string | windows with this tag |

`urgentWindow()` is the first window with the urgent hint (null if none), `lastWindow()` the one that had focus before the current one.

Accessors, all taking a `PHLWINDOW`:

| Function | Returns |
|---|---|
| `windowClass(w)`, `windowTitle(w)`, `windowInitialClass(w)`, `windowInitialTitle(w)` | strings |
| `windowAddress(w)` | `"0x..."` as printed by `abyssctl` |
| `byAddress(w)` | a selector string for the action functions: `focusWindow(byAddress(w))` |
| `windowPid(w)`, `windowStableId(w)` | process id, stable window id |
| `windowFloating(w)`, `windowFullscreen(w)` | bool (fullscreen is true for fullscreen or maximized) |
| `windowMapped(w)`, `windowHidden(w)`, `windowVisible(w)`, `windowActive(w)`, `windowAcceptsInput(w)` | bool; hidden means on a hidden group tab or special workspace, active means it has focus |
| `windowWorkspaceId(w)`, `windowWorkspace(w)` | workspace id, workspace handle |
| `windowMonitorName(w)`, `windowMonitor(w)` | monitor name, monitor handle |
| `windowAt(w)`, `windowSize(w)` | `Point` and `Size` of the goal position and size (where the layout wants it) |
| `windowXwayland(w)`, `windowPinned(w)`, `windowPinFullscreened(w)`, `windowAllowedOverFullscreen(w)`, `windowTearingHint(w)`, `windowInhibitingIdle(w)` | bool |
| `windowFullscreenModes(w)` | `FullscreenModes{internal, client}`: 0 none, 1 maximized, 2 fullscreen (3 both, client only) |
| `windowFullscreenHandler(w)` | text |
| `windowGroup(w)` | `PHLGROUP`, null if not grouped |
| `windowTags(w)` | `std::vector<std::string>` |
| `windowSwallowing(w)` | the window hidden behind this one, null if none |
| `windowFocusHistoryId(w)` | 0 = most recently focused, -1 = not in the history |
| `windowXdgTag(w)`, `windowXdgDescription(w)` | `std::optional<std::string>` |
| `windowContentType(w)` | `"none"`, `"photo"`, `"video"` or `"game"` |
| `windowLayoutInfo(w)` | `std::optional<WindowLayoutInfo>`; empty for floating windows and windows without a tiled layout |

`WindowLayoutInfo` has `name` (`"dwindle"`, `"master"`, `"scrolling"`, `"monocle"` or a custom layout's name) and, for the active layout only, `isMaster`, `percMaster`, `percSize` (master) and `columnIndex`, `columnWidth`, `columnWindows`, `indexInColumn` (scrolling).

```cpp
// float every tiled window of the current workspace
c.bind("SUPER+ALT+F", [] {
    for (auto& w : windows({.workspace = activeWorkspace(), .floating = false}))
        run(setFloating(byAddress(w)));
    return ok();
});

// jump to the urgent window, or tell that there is none
c.bind(SUPER, "U", [] {
    if (auto w = urgentWindow())
        return run(focusWindow(byAddress(w)));
    notify("nothing urgent");
    return ok();
});
```

## Workspaces

```cpp
PHLWORKSPACE              activeWorkspace();
PHLWORKSPACE              activeWorkspace(const PHLMONITOR& monitor);
PHLWORKSPACE              activeSpecialWorkspace(const PHLMONITOR& monitor = nullptr);
PHLWORKSPACE              lastWorkspace();
PHLWORKSPACE              lastWorkspace(const PHLMONITOR& monitor);
PHLWORKSPACE              workspaceById(int64_t id);
PHLWORKSPACE              workspaceBySelector(std::string_view selector);
std::vector<PHLWORKSPACE> workspaces();
std::vector<PHLWINDOW>    workspaceWindows(const PHLWORKSPACE& ws);
std::vector<PHLWINDOW>    workspaceWindows(std::string_view workspaceSelector);
```

`workspaceBySelector` takes the same selectors as the workspace dispatchers: `"3"`, `"name:web"`, `"special:x"`, `"e+1"`, `"previous"`, `"empty"`. A null monitor means the focused one.

| Function | Returns |
|---|---|
| `workspaceId(w)`, `workspaceName(w)` | id and name (both also take a `PHLWORKSPACEREF`) |
| `workspaceWindowCount(w)` | number of windows |
| `workspaceMonitor(w)` | the monitor |
| `workspaceVisible(w)`, `workspaceSpecial(w)`, `workspaceActive(w)` | bool; active means shown on its monitor (normal or special) |
| `workspaceHasUrgent(w)`, `workspaceHasFullscreen(w)`, `workspacePersistent(w)`, `workspaceEmpty(w)` | bool |
| `workspaceFullscreenMode(w)` | 0 none, 1 maximized, 2 fullscreen |
| `workspaceConfigName(w)` | the configured name |
| `workspaceTiledLayout(w)` | the layout name, `"unknown"` if it has none |
| `workspaceLastWindow(w)`, `workspaceFullscreenWindow(w)` | windows |
| `workspaceWindows(w, mappedOnly)` | all (`false`) or mapped (`true`) windows |
| `workspaceGroupCount(w)`, `workspaceGroups(w)` | number of groups, the groups |

## Monitors

```cpp
PHLMONITOR              activeMonitor();
PHLMONITOR              monitorByName(std::string_view name);
PHLMONITOR              monitorBySelector(std::string_view selector);
PHLMONITOR              monitorAt(double x, double y);
PHLMONITOR              monitorAtCursor();
std::vector<PHLMONITOR> monitors();
```

`monitorBySelector` accepts a name (`"DP-1"`), an id (`"0"`), a description (`"desc:..."`), a direction (`"l"`, `"r"`, `"u"`, `"d"`) or a relative one (`"+1"`, `"-1"`), relative to the focused monitor.

| Function | Returns |
|---|---|
| `monitorName(m)`, `monitorId(m)`, `monitorDescription(m)`, `monitorSerial(m)` | identification |
| `monitorSize(m)`, `monitorPhysicalSize(m)` | `Size` in pixels, in millimeters |
| `monitorRefreshRate(m)`, `monitorScale(m)`, `monitorTransform(m)` | Hz, scale factor, `wl_output_transform` 0 to 7 |
| `monitorPosition(m)` | layout `Point` |
| `monitorActiveWorkspace(m)`, `monitorActiveSpecialWorkspace(m)` | workspaces |
| `monitorDpms(m)`, `monitorVrrActive(m)`, `monitorIsMirror(m)`, `monitorFocused(m)` | bool (DPMS: true = on) |
| `monitorMirrors(m)` | monitors mirroring this one |
| `monitorAvailableModes(m)` | `std::vector<MonitorMode>` with `width`, `height`, `refreshRate`, `preferred` |
| `monitorCm(m)` | color management preset, for example `"srgb"` or `"hdr"` |
| `monitorReserved(m)` | `ReservedArea{top, right, bottom, left}` |
| `monitorSetWorkspace(m, selector or ws)` | switch the monitor to a workspace (it must exist); false if not found |
| `monitorSetSpecialWorkspace(m, selector or ws)` | show a special workspace; an empty selector or a null workspace closes the active one; false if not found |

## Layer surfaces

```cpp
std::vector<PHLLS> layers(const LayerFilter& filter = {});
```

`LayerFilter` has `.monitor` (null = any) and `.namespace_` (optional string). Accessors take a `PHLLS`:

| Function | Returns |
|---|---|
| `layerAddress(l)`, `layerNamespace(l)`, `layerPid(l)` | `"0x..."`, namespace, process id |
| `layerGeometry(l)` | `Rect{x, y, width, height}` |
| `layerX(l)`, `layerY(l)`, `layerW(l)`, `layerH(l)` | the same, one by one |
| `layerMonitor(l)` | the monitor |
| `layerMapped(l)`, `layerAboveFullscreen(l)` | bool |
| `layerLayer(l)` | 0 background, 1 bottom, 2 top, 3 overlay |
| `layerInteractivity(l)` | 0 none, 1 exclusive, 2 on-demand |

```cpp
c.bind(SUPER, "L", [] {
    for (auto& l : layers({.namespace_ = "waybar"}))
        notify("bar at " + std::to_string(layerY(l)));
    return ok();
});
```

## Groups

| Function | Purpose |
|---|---|
| `groupSize(g)`, `groupCurrentIndex(g)` | number of windows, the active index (1-based, `0` for a null group) |
| `groupCurrent(g)`, `groupMembers(g)` | the active window, all windows |
| `groupLocked(g)`, `groupDenied(g)` | bool |
| `groupAdd(g, w, index = 0)` | add a window at a 1-based index (`0` = at the end); false if not allowed |
| `groupRemove(g, w)`, `groupRemove(g, index)` | remove a member by window or 1-based index; false if it is not a member |

## Cursor, keys, version

| Function | Returns |
|---|---|
| `cursorPos()` | `std::optional<PointD>` in layout coordinates, empty if input is not up yet |
| `currentSubmap()` | the active keybind submap, `""` for the default |
| `isKeyDown(key)` | is the key physically held right now; `key` is an xkb keysym name (`"Shift_L"`, `"a"`, `"Return"`) or `"code:<n>"`; `isKeyDown(int keycode)` works too. False (and a log line) for an unknown key |
| `version()` | the compositor version, for example `"0.56.2"` |

Value types: `Point{x, y}` (int), `Size{width, height}`, `Rect{x, y, width, height}`, `PointD{x, y}` (double).

## Notifications

`notify(text, ms = 5000, color = std::nullopt, icon = "info")` shows a notification overlay. The second form takes options and is the one to use for the font size:

```cpp
notify("done");
notify("careful", 8000, std::nullopt, "warning");
auto n = notify("building...", NotifyOpts{.ms = 10000, .icon = "hint", .fontSize = 16.f});
```

`NotifyOpts` fields, in this order: `.ms` (default 5000), `.color` (optional, default is the icon's color), `.icon` (`info`, `warning`, `error`, `hint`, `ok`, `confused` or `none`) and `.fontSize` (default 13).

Both forms return a `NotificationHandle`. It is copyable and every call does nothing once the notification is gone, so a stale handle is safe to keep.

| Member | Effect |
|---|---|
| `alive()` | false once timed out or dismissed |
| `text()` / `setText(text)` | read or replace the text |
| `setColor(color)`, `setIcon(icon)`, `setFontSize(size)` | restyle it |
| `setTimeout(ms)` | restarts the countdown with a new duration |
| `pause()` / `resume()` | stop or restart the countdown, calls must be balanced |
| `dismiss()` | removes it |

```cpp
auto progress = std::make_shared<NotificationHandle>();
c.bind(SUPER, "P", [progress] {
    if (progress->alive())
        progress->setText("still running");
    else
        *progress = notify("started", NotifyOpts{.ms = 60'000});
    return ok();
});
```

`notifications()` lists every notification that is shown, oldest first. `dismissNotifications(n)` removes the oldest `n`; with no argument or `-1` it removes all.

From a shell script you can use `abyssctl notify`, see the [abyssctl reference](/wiki/abyssctl#acting).

## Logging and small helpers

- `print(fmt, args...)` and `log(LogLevel, text)` write `[abyss] text` into the compositor log (`abyssctl rollinglog`), like `print()` in the Lua API. `print` uses `std::format` syntax and the `Info` level; `log` takes `LogLevel::Trace`, `Debug`, `Info`, `Warn` or `Error`. Nothing is written while `debug:disable_logs` is on, which is the default, so set `c.debug.disable_logs = false` while you debug.
- `clearCrashedLockscreen()` unlocks the session when the lock screen client crashed and the session stays locked behind a red screen. It refuses while a working lock screen holds the lock. It runs immediately and is deliberately not a dispatcher, so other local processes cannot call it.
- `execScheduledPropRefreshImmediately()` applies window rule and property changes from `set()` now instead of on the next loop iteration. It returns `false` if nothing was pending.
- `emit(name, data)` sends `user.<name>>>data` to every event-socket listener, see [Environment, cursor and helpers](/wiki/config/system#commands-and-user-events).

```cpp
c.debug.disable_logs = false;
c.bind(SUPER, "L", [] { print("active gaps: {}", get<int>("general:gaps_in").value_or(-1)); return ok(); });
c.bind(SUPER, "K", [] { log(LogLevel::Warn, "something looks off"); return ok(); });
```

`ok()` and `error(msg)` build the `SDispatchResult` a bind callback returns.
