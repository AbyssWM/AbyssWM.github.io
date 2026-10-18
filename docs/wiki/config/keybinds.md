# Keybinds and actions

`c.bind` registers a keybind. What it runs is an **action**: a value such as `killActive()` or `workspace(3)`, or your own lambda. This page covers binds, their flags, submaps, gestures, and the complete list of built-in actions.

```cpp
c.bind(SUPER, "Q", [] { return exec("kitty"); });   // your own code
c.bind(SUPER, "C", killActive());                    // a built-in action
c.bind("SUPER+SHIFT+Q", exit());                     // the combined string form
```

## c.bind

```cpp
BindHandle bind(Mods mods, std::string key, Action action, const BindOpts& opts = {});
BindHandle bind(std::string combo, Action action, const BindOpts& opts = {});
void       unbind(Mods mods, std::string key);
void       unbind(std::string combo);
void       unbindAll();
```

### Modifiers

`Mods` values are combined with `|`:

| Constant | Key |
|---|---|
| `NONE` | no modifier |
| `SHIFT` | Shift |
| `CAPS` | Caps Lock |
| `CTRL` | Control |
| `ALT` | Alt |
| `MOD2` | Mod2 (usually Num Lock) |
| `MOD3` | Mod3 |
| `SUPER` | the Super (Windows) key |
| `MOD5` | Mod5 (usually AltGr) |

```cpp
c.bind(SUPER | SHIFT, "Q", killActive());
c.bind(SUPER | CTRL | ALT, "T", [] { return exec("kitty"); });
c.bind(NONE, "Print", [] { return exec("grim"); });
```

A typical set of workspace keys, with the key `0` for workspace 10:

```cpp
for (int i = 1; i <= 10; ++i) {
    const std::string key = std::to_string(i % 10);
    c.bind(SUPER, key, workspace(i));
    c.bind(SUPER | SHIFT, key, moveToWorkspace(i));
}
```

In the combined string form modifiers are joined with `+` and must come first: `"SUPER+SHIFT+Q"`. Accepted names are `SHIFT`, `CAPS`, `CTRL` (or `CONTROL`), `ALT` (or `MOD1`), `MOD2`, `MOD3`, `SUPER` (or `WIN`, `LOGO`, `MOD4`, `META`) and `MOD5`.

### Keys

| Key | Meaning |
|---|---|
| `"Return"`, `"Q"`, `"left"`, `"F5"`, `"XF86AudioMute"` | xkb key names (`wev` shows them) |
| `"code:10"` | a raw keycode |
| `"mouse:272"` | mouse button (272 left, 273 right, 274 middle) |
| `"mouse_down"`, `"mouse_up"`, `"mouse_left"`, `"mouse_right"` | scroll wheel |
| `"switch:on:Lid Switch"`, `"switch:off:Lid Switch"` | a hardware switch such as the laptop lid |
| `"catchall"` | every key; only allowed inside a [submap](#submaps) |

### Bind flags

The third argument after the action is a `BindOpts`. All flags default to off. Designated initializers must follow this order:

| Field | Type | Meaning |
|---|---|---|
| `.locked` | bool | also works on the lock screen |
| `.release` | bool | trigger on key release |
| `.repeat` | bool | repeat while the key is held |
| `.longPress` | bool | trigger on a long press |
| `.mouse` | bool | marks a mouse bind, requires `mouseMove()` or `mouseResize()` as the action |
| `.nonConsuming` | bool | the key press is also passed to the focused window |
| `.autoConsuming` | bool | the key is consumed only if the action succeeded |
| `.transparent` | bool | cannot be shadowed by other binds |
| `.ignoreMods` | bool | the bind triggers whatever modifiers are held |
| `.dontInhibit` | bool | works even if a client inhibits shortcuts |
| `.click` | bool | mouse bind: only on click (no drag) |
| `.drag` | bool | mouse bind: only on drag |
| `.submapUniversal` | bool | active in every submap |
| `.allowInputCapture` | bool | still handled while an input capture is active (binds are skipped then by default) |
| `.description` | string | text shown by `abyssctl binds` |
| `.devices` | list of string | restrict to (or exclude) devices with these tags, see [Options](/wiki/config/options#per-device-settings-c-device) |
| `.devicesInclusive` | bool | `true` (default): only these devices; `false`: all but these |

```cpp
// volume keys: on the lock screen too, and repeating while held
c.bind(NONE, "XF86AudioRaiseVolume", [] { return exec("wpctl set-volume -l 1 @DEFAULT_AUDIO_SINK@ 5%+"); },
       {.locked = true, .repeat = true});

// trigger on release, for example a push-to-talk key
c.bind(NONE, "F13", [] { return exec("wpctl set-mute @DEFAULT_AUDIO_SOURCE@ 1"); }, {.release = true});

// a long press
c.bind(SUPER, "Escape", [] { return exec("wlogout"); }, {.longPress = true});

// keep the key for the app as well, and describe the bind
c.bind(NONE, "Print", [] { return exec("grim"); }, {.nonConsuming = true, .description = "screenshot"});

// only for devices tagged "mx-master" (see c.device and its .tags)
c.bind(NONE, "mouse:275", [] { return exec("playerctl previous"); }, {.devices = {"mx-master"}});

// laptop lid
c.bind(NONE, "switch:on:Lid Switch", [] { return exec("systemctl suspend"); }, {.locked = true});

// mouse binds: move and resize with SUPER + drag
c.bind(SUPER, "mouse:272", mouseMove(), {.mouse = true});
c.bind(SUPER, "mouse:273", mouseResize(), {.mouse = true});

// middle click without a drag
c.bind(SUPER, "mouse:274", [] { return exec("playerctl play-pause"); }, {.click = true});
```

These combinations are rejected when the config loads (`abyssctl configerrors`):

- `.mouse` with an action other than `mouseMove()` or `mouseResize()`,
- a mouse bind with `.repeat`, `.release` or `.locked`,
- `.click` together with `.drag`,
- `.longPress`, `.release`, `.click` or `.drag` together with `.repeat`,
- a `"catchall"` bind outside a submap, or a key that does not parse.

### Remove and switch binds

`bind` returns a `BindHandle`. A disabled bind stays registered but does not trigger. A reload drops every bind and so invalidates the handle.

```cpp
auto b = c.bind(SUPER, "G", [] { return exec("steam"); });
b.setEnabled(false);
if (!b.isEnabled())
    notify("the bind is off");
b.remove();                // unregisters exactly this bind, the handle is dead afterwards

c.unbind(SUPER, "Q");              // remove binds on this key
c.unbind("SUPER+SHIFT+Q");
c.unbindAll();                     // start from nothing
```

`remove()` leaves other binds on the same key alone. `isEnabled()` is false for a removed or reload-dropped bind.

## Your own code as an action

Any callable that returns `void` or an `SDispatchResult` converts to an `Action`. A lambda is the usual way. Return `ok()` for success or `error("message")` to report a failure. Exceptions are caught and logged, they never take the compositor down.

```cpp
c.bind(SUPER, "N", [] { notify("hello from C++"); return ok(); });

// anything C++ can do, with the query functions of the config API
c.bind(SUPER, "G", [] {
    auto gaps = get<int>("general:gaps_in");
    if (!gaps)
        return error("no such option");
    set("general:gaps_in", *gaps >= 20 ? 0 : *gaps + 5);
    return ok();
});

// capture variables by value
const std::string terminal = "kitty";
c.bind(SUPER, "Return", [terminal] { return exec(terminal); });
```

`exec(command)` starts the command immediately through `/bin/sh -c`, with shell expansion, pipes and redirects. It returns a result, not an `Action`, so `c.bind(..., exec("kitty"))` does not compile. The lambda defers execution until the key is pressed.

### Running actions from your own code

Built-in actions are deferred values. Inside a callback you run one with `run(action)`, or by calling it:

```cpp
c.bind(SUPER, "F", [] {
    run(toggleFloating());          // run it now
    return run(centerWindow());     // returns the SDispatchResult of the action
});

c.timer(5000, [] { run(workspace(2)); });
```

`Action` is `[[nodiscard]]`, so a forgotten `run()` shows up as a compiler warning instead of silently doing nothing. `Action` also keeps `handler` and `arg` for string-backed actions (`isNative()` is true for your own callbacks), which go through the same dispatcher table as `abyssctl dispatch <name> <arg>`; all dispatchers are reachable through `dispatch(name, arg)`.

## Submaps

A submap is a separate set of binds that is active until you leave it.

```cpp
void submap(std::string name, const std::function<void(Config&)>& fn, std::string reset = "");
```

```cpp
c.bind(SUPER, "X", submap("resize"));
c.submap("resize", [](Config& c) {
    c.bind(NONE, "right", resizeActive(20, 0), {.repeat = true});
    c.bind(NONE, "left",  resizeActive(-20, 0), {.repeat = true});
    c.bind(NONE, "up",    resizeActive(0, -20), {.repeat = true});
    c.bind(NONE, "down",  resizeActive(0, 20), {.repeat = true});
    c.bind(NONE, "escape", submap("reset"));      // "reset" leaves the submap
});
```

The binds registered inside `fn` belong to the submap. Leave it with `bind(..., submap("reset"))`. If `reset` is non-empty, every bind in the submap switches to that submap (usually `"reset"`) after it ran, which makes a one-shot submap:

```cpp
// SUPER+A, then one key: a launcher chord
c.bind(SUPER, "A", submap("apps"));
c.submap("apps", [](Config& c) {
    c.bind(NONE, "F", [] { return exec("firefox"); });
    c.bind(NONE, "T", [] { return exec("kitty"); });
    c.bind(NONE, "catchall", noop());             // swallow every other key
}, "reset");
```

`"catchall"` is only allowed inside a submap. `{.submapUniversal = true}` makes a bind active in every submap. The current submap is returned by `currentSubmap()`, and the `Event::Submap` event fires on every change, see [Events](/wiki/config/events).

## Gestures

Touchpad gestures run a built-in action or your own code. There are three forms:

```cpp
void gesture(int fingers, std::string direction, std::string action, const GestureOpts& opts = {});
void gesture(int fingers, std::string direction, std::function<void()> onEnd, const GestureOpts& opts = {});
void gesture(int fingers, std::string direction, GestureCallbacks callbacks, const GestureOpts& opts = {});
```

```cpp
c.gesture(3, "horizontal", "workspace");                     // built-in action
c.gesture(4, "pinch", "fullscreen", {.mode = "fullscreen"});
c.gesture(3, "down", [] { exec("grim"); });                  // runs once when the fingers are lifted
c.gesture(4, "swipe", GestureCallbacks{
    .start  = [](const GestureEvent& e) { notify("direction: " + e.direction); },
    .update = [](const GestureEvent& e) { /* e.delta, e.scale, e.rotation */ },
    .finish = [](const GestureEvent& e) { if (e.cancelled) notify("cancelled"); },
});
c.gesture(3, "up", "special", {.workspaceName = "magic"});
c.gesture(3, "vertical", "unset");                           // remove a gesture
```

| Part | Values |
|---|---|
| `fingers` | 2 to 9 |
| built-in actions | `workspace`, `move`, `resize`, `special`, `close`, `float`, `fullscreen`, `cursor_zoom` (or `cursorZoom`), `scroll_move`, `unset` |
| directions | `horizontal` (`horiz`), `vertical` (`vert`), `left` (`l`), `right` (`r`), `up` (`u`, `top`, `t`), `down` (`d`, `bottom`, `b`), `swipe`, `pinch`, `pinchin` (`zoomin`), `pinchout` (`zoomout`); case does not matter |

`GestureOpts` (designated initializers in this order):

| Field | Type | Meaning |
|---|---|---|
| `.mods` | string | modifiers that must be held, `"SUPER"` or `"SUPER+SHIFT"` |
| `.scale` | double | sensitivity scale, `0.1` to `10`, default `1.0` |
| `.disableInhibit` | bool | work even if a client inhibits gestures |
| `.workspaceName` | string | for the action `special` |
| `.zoomLevel` | string | for the action `cursor_zoom` |
| `.mode` | string | for `float`, `fullscreen` and `cursor_zoom` |

The options (`mods`, `scale`, `disableInhibit`) work for all three forms. `GestureCallbacks` has the members `start`, `update` and `finish`; at least one must be set. `start` fires once the direction was recognised, `update` on every following update, `finish` when the fingers are lifted. The `GestureEvent` they receive has:

| Member | Meaning |
|---|---|
| `phase` | `GestureEvent::Phase::Start`, `Update` or `End` |
| `direction` | the actual direction as text (`"LEFT"`, `"PINCH_IN"`, ...), `"NONE"` if unknown |
| `type` | `"swipe"` or `"pinch"` |
| `timeMs` | event time |
| `fingers`, `delta` | Start and Update only |
| `scale`, `rotation` | Start and Update of a pinch only |
| `cancelled` | End only: the gesture was cancelled |

Exceptions in callbacks are caught and logged. `workspaceName`, `zoomLevel` and `mode` are ignored for callback gestures. The tuning options for the workspace swipe are in [`c.gestures`](/wiki/config/options#c-gestures).

## Window selectors

Many window actions take an optional `selector` as their last parameter. Without a selector (or with `""`) they act on the focused window. With one, the window is resolved when the action runs. A selector that matches no window is an error, never a silent fallback to the focused window.

```cpp
c.bind(SUPER, "K", moveWindow(Dir::Left, false, "class:^(kitty)$"));   // silent = false, then the selector
c.bind(SUPER, "J", centerWindow("title:^(Notes)$"));
c.bind(SUPER, "M", moveIntoGroup(Dir::Right, "tag:work"));
c.bind(SUPER, "F", fullscreen(0, "set", /*layoutAware=*/false, "initialclass:^(mpv)$"));
```

| Selector | Matches |
|---|---|
| `class:<regex>` | the window class |
| `initialclass:<regex>` | the class at map time |
| `title:<regex>` | the window title |
| `initialtitle:<regex>` | the title at map time |
| `tag:<name>` | windows with this tag |
| `address:0x...` | exactly one window, as printed by `abyssctl` or `byAddress(w)` |
| `pid:<n>` | windows of this process |
| `floating` / `tiled` | all floating or all tiled windows |

The regex has to match the whole string, so use `class:^(kitty)$` or `class:.*kitty.*`, not a bare `class:kitty` for a partial match. A string without one of these prefixes matches nothing.

::: warning String literals and bool
A string literal converts to `bool` before it becomes a `std::string`. `moveWindow(Dir::Left, "class:x")` would therefore have silently meant `silent = true` with no selector. These overloads are deleted and are a compile error: `moveWindow(Dir, const char*)`, `moveWindowToMonitor(std::string, const char*)`, `swapNext(const char*)`, `cycleNext(const char*)`, `cycleNext(bool, const char*)`, `moveToWorkspace(int / std::string, const char*)`, `changeGroupActive(const char*)` and `fullscreen(int, const char*, const char*)`. Pass the `bool` explicitly, as in the first example above.
:::

## All built-in actions

Every function below returns an `Action`, except `exec`, which runs at once. Dispatcher actions are deferred, utilities such as `notify`, `ok` and `error` run immediately (see [Queries](/wiki/config/queries)). The examples are real calls; the key choices are only illustrations. `spawn` and `spawnRaw` are not public config functions.

`Dir` is `Dir::Left`, `Dir::Right`, `Dir::Up` or `Dir::Down`.

### Generic

| Signature | What it does | Example |
|---|---|---|
| `dispatch(std::string name, std::string arg = "")` | any dispatcher by name, same arguments as `abyssctl dispatch <name> <arg>` | `c.bind(SUPER, "F11", dispatch("fullscreen", "1"));` |
| `exec(const std::string& cmd)` | runs the command **immediately** through `/bin/sh -c` and returns an `SDispatchResult`, not an action; supports exec rules such as `"[float; size 800 600] kitty"`. Call it inside a callback | `c.bind(SUPER, "Return", [] { return exec("kitty"); });` |

### Windows

| Signature | What it does | Example |
|---|---|---|
| `killActive()` | close the active window (a polite close request, the client may ask first) | `c.bind(SUPER, "C", killActive());` |
| `forceKillActive()` | kill the active window right away | `c.bind("SUPER+CTRL+C", forceKillActive());` |
| `closeWindow(std::string selector = "")` | close the selected window, the active one without a selector | `c.bind(SUPER, "Q", closeWindow());` |
| `killWindow(std::string selector)` | kill the window that matches the [selector](#window-selectors) | `c.bind("SUPER+ALT+K", killWindow("class:^(steam)$"));` |
| `signal(int sig)` | send a signal to the active window's process | `c.bind(SUPER, "F9", signal(10));` |
| `signalWindow(int sig, std::string selector = "")` | send a signal to the selected window's process | `c.bind(SUPER, "F10", signalWindow(10, "class:^(obs)$"));` |
| `toggleFloating(std::string selector = "")` | toggle floating | `c.bind(SUPER, "V", toggleFloating());` |
| `setFloating(std::string selector = "")` | make the window floating | `c.bind(SUPER, "F", setFloating());` |
| `setTiled(std::string selector = "")` | make the window tiled | `c.bind("SUPER+SHIFT+F", setTiled());` |
| `pseudo(std::string selector = "")` | toggle pseudotiling | `c.bind(SUPER, "P", pseudo());` |
| `pin(std::string selector = "")` | pin a floating window to every workspace | `c.bind("SUPER+SHIFT+P", pin());` |
| `fullscreen(int mode = 0, std::string state = "toggle")` | `mode` 0 = fullscreen, 1 = maximize; `state` is `"toggle"`, `"set"` or `"unset"` | `c.bind(SUPER, "F11", fullscreen());` |
| `fullscreen(int mode, std::string state, bool layoutAware, std::string selector = "")` | same with a target window; `layoutAware = false` means the layout is not told and the window just covers the monitor | `c.bind("SUPER+SHIFT+F11", fullscreen(0, "set", false, "initialclass:^(mpv)$"));` |
| `fullscreenState(int internal, int client)` | set what the compositor shows and what the client believes (0 none, 1 maximized, 2 fullscreen, 3 both) | `c.bind("SUPER+CTRL+F", fullscreenState(2, 0));` |
| `moveFocus(Dir d)` | move the focus in a direction (`Dir::Left`, `Dir::Right`, `Dir::Up`, `Dir::Down`) | `c.bind(SUPER, "left", moveFocus(Dir::Left));` |
| `moveWindow(Dir d, bool silent = false, std::string selector = "")` | move a window in a direction; `silent` keeps the focus where it was | `c.bind("SUPER+SHIFT+left", moveWindow(Dir::Left));` |
| `moveWindowToMonitor(std::string monitor, bool silent = false)` | send the active window to a monitor (name, id or a direction such as `"+1"` or `"l"`) | `c.bind("SUPER+ALT+right", moveWindowToMonitor("+1"));` |
| `moveWindowOrGroup(Dir d, std::string selector = "")` | move a window, or into a neighboring group | `c.bind("SUPER+SHIFT+up", moveWindowOrGroup(Dir::Up));` |
| `swapWindow(Dir d, std::string selector = "")` | swap with the window in that direction | `c.bind("SUPER+CTRL+left", swapWindow(Dir::Left));` |
| `swapWith(std::string selector)` | swap the active window with the selected one | `c.bind("SUPER+CTRL+M", swapWith("tag:main"));` |
| `swapNext(bool forward = true, std::string selector = "")` | swap with the next (or previous) window | `c.bind("SUPER+CTRL+N", swapNext());` |
| `centerWindow(std::string selector = "")` | center a floating window | `c.bind(SUPER, "C", centerWindow());` |
| `resizeActive(std::string args)` | resize the active window; `"10 0"` relative, `"exact 800 600"` absolute | `c.bind("SUPER+CTRL+R", resizeActive("exact 800 600"));` |
| `resizeActive(int dx, int dy)` | resize by pixels | `c.bind("SUPER+CTRL+right", resizeActive(20, 0), {.repeat = true});` |
| `moveActive(std::string args)` | move the active (floating) window, same syntax as `resizeActive` | `c.bind("SUPER+CTRL+M", moveActive("exact 100 100"));` |
| `moveActive(int dx, int dy)` | move by pixels | `c.bind("SUPER+ALT+down", moveActive(0, 20), {.repeat = true});` |
| `resizeWindowPixel(std::string args, std::string selector)` | resize the selected window | `c.bind("SUPER+ALT+R", resizeWindowPixel("exact 640 480", "class:^(mpv)$"));` |
| `moveWindowPixel(std::string args, std::string selector)` | move the selected window | `c.bind("SUPER+ALT+M", moveWindowPixel("exact 0 0", "class:^(mpv)$"));` |
| `cycleNext(bool forward = true, bool onlyTiled = false, bool onlyFloating = false)` | focus the next (or previous) window on the workspace | `c.bind(ALT, "Tab", cycleNext());` |
| `focusWindow(std::string selector)` | focus the selected window | `c.bind(SUPER, "B", focusWindow("class:^(firefox)$"));` |
| `focusUrgentOrLast()` | focus the urgent window, or the previously focused one | `c.bind(SUPER, "U", focusUrgentOrLast());` |
| `focusCurrentOrLast()` | focus the current window, or the previously focused one | `c.bind(SUPER, "Tab", focusCurrentOrLast());` |
| `bringActiveToTop()` | raise the active floating window | `c.bind(SUPER, "T", bringActiveToTop());` |
| `alterZOrder(std::string position, std::string selector = "")` | `"top"` or `"bottom"` | `c.bind("SUPER+SHIFT+T", alterZOrder("bottom"));` |
| `tag(std::string tag, std::string selector = "")` | `"+name"` adds, `"-name"` removes, `"name"` toggles a tag | `c.bind(SUPER, "G", tag("+work"));` |
| `clearTags(std::string selector = "")` | remove every tag, also the dynamic ones from rules | `c.bind("SUPER+SHIFT+G", clearTags());` |
| `toggleSwallow()` | toggle window swallowing for the active window | `c.bind("SUPER+ALT+S", toggleSwallow());` |
| `setProp(std::string selector, std::string prop, std::string value)` | set a window property at runtime (as `abyssctl setprop`) | `c.bind("SUPER+ALT+O", setProp("", "opacity", "0.5"));` |
| `mouseMove()` | drag the window with the mouse; use with `{.mouse = true}` | `c.bind(SUPER, "mouse:272", mouseMove(), {.mouse = true});` |
| `mouseResize(bool keepAspectRatio = false)` | resize the window with the mouse; use with `{.mouse = true}` | `c.bind(SUPER, "mouse:273", mouseResize(), {.mouse = true});` |

### Groups

| Signature | What it does | Example |
|---|---|---|
| `toggleGroup(std::string selector = "")` | create or dissolve a group | `c.bind(SUPER, "K", toggleGroup());` |
| `changeGroupActive(bool forward = true, std::string selector = "")` | show the next (or previous) tab of the group | `c.bind(SUPER, "bracketright", changeGroupActive());` |
| `setGroupActive(int index, std::string selector = "")` | make the index-th window of the group active (1-based, `0` = last) | `c.bind(SUPER, "F1", setGroupActive(1));` |
| `moveGroupWindow(bool forward = true)` | move the active tab inside its group | `c.bind(SUPER, "bracketleft", moveGroupWindow(false));` |
| `moveIntoGroup(Dir d, std::string selector = "")` | move the window into the group in that direction | `c.bind("SUPER+CTRL+up", moveIntoGroup(Dir::Up));` |
| `moveIntoOrCreateGroup(Dir d, std::string selector = "")` | move into the group in that direction, or create one | `c.bind("SUPER+CTRL+down", moveIntoOrCreateGroup(Dir::Down));` |
| `moveOutOfGroup(std::string selector = "")` | take the window out of its group | `c.bind("SUPER+SHIFT+K", moveOutOfGroup());` |
| `lockGroups(std::string mode = "toggle")` | `"lock"`, `"unlock"` or `"toggle"`: lock every group so nothing joins them | `c.bind("SUPER+ALT+L", lockGroups());` |
| `lockActiveGroup(std::string mode = "toggle")` | same for the active group only | `c.bind("SUPER+ALT+G", lockActiveGroup("lock"));` |
| `denyWindowFromGroup(std::string mode = "toggle")` | `"on"`, `"off"` or `"toggle"`: forbid the window to be grouped | `c.bind("SUPER+ALT+D", denyWindowFromGroup());` |

### Workspaces and monitors

| Signature | What it does | Example |
|---|---|---|
| `workspace(int id)` | switch to a workspace by number | `c.bind(SUPER, "1", workspace(1));` |
| `workspace(std::string name)` | switch by selector: `"3"`, `"name:web"`, `"e+1"`, `"e-1"`, `"+1"`, `"special:scratch"`, `"previous"`, `"empty"` | `c.bind(SUPER, "mouse_down", workspace("e+1"));` |
| `moveToWorkspace(int id, bool silent = false, std::string selector = "")` | move the active (or selected) window to a workspace; `silent` stays on the current one | `c.bind("SUPER+SHIFT+1", moveToWorkspace(1));` |
| `moveToWorkspace(std::string name, bool silent = false, std::string selector = "")` | same with a workspace selector | `c.bind("SUPER+SHIFT+W", moveToWorkspace("name:web", true));` |
| `toggleSpecial(std::string name = "")` | show or hide a special workspace (a scratchpad) | `c.bind(SUPER, "S", toggleSpecial("magic"));` |
| `moveToSpecial(std::string name = "")` | move the window to a special workspace | `c.bind("SUPER+SHIFT+S", moveToSpecial("magic"));` |
| `renameWorkspace(int id, std::string name)` | give a workspace a name | `c.bind("SUPER+ALT+1", renameWorkspace(1, "main"));` |
| `changeWorkspaceId(int64_t from, int64_t to)` | give workspace `from` the id `to` (fails if `to` exists) | `c.bind("SUPER+ALT+2", changeWorkspaceId(2, 12));` |
| `focusMonitor(std::string monitor)` | focus a monitor (name, id, or a direction such as `"+1"` or `"l"`) | `c.bind(SUPER, "period", focusMonitor("+1"));` |
| `focusWorkspaceOnCurrentMonitor(std::string workspace)` | bring a workspace to the focused monitor | `c.bind("SUPER+CTRL+2", focusWorkspaceOnCurrentMonitor("2"));` |
| `moveCurrentWorkspaceToMonitor(std::string monitor)` | move the current workspace to a monitor | `c.bind("SUPER+CTRL+comma", moveCurrentWorkspaceToMonitor("-1"));` |
| `moveWorkspaceToMonitor(std::string workspace, std::string monitor)` | move a given workspace to a monitor | `c.bind("SUPER+CTRL+3", moveWorkspaceToMonitor("3", "DP-2"));` |
| `swapActiveWorkspaces(std::string monitor1, std::string monitor2)` | swap the active workspaces of two monitors | `c.bind("SUPER+CTRL+S", swapActiveWorkspaces("DP-1", "DP-2"));` |
| `dpms(std::string mode, std::string monitor = "")` | `"on"`, `"off"` or `"toggle"` the picture of one or every monitor | `c.bind("SUPER+ALT+P", dpms("toggle"));` |
| `moveCursorToCorner(int corner, std::string selector = "")` | move the cursor to a corner of the window, `corner` is 0 to 3 | `c.bind("SUPER+ALT+C", moveCursorToCorner(0));` |
| `moveCursor(int x, int y)` | move the cursor to layout coordinates | `c.bind("SUPER+ALT+X", moveCursor(960, 540));` |

### Layout

| Signature | What it does | Example |
|---|---|---|
| `layoutMsg(std::string msg)` | send a message to the active workspace's layout (`abyssctl dispatch layoutmsg`), see [Layouts](/wiki/config/layouts#layout-messages) | `c.bind(SUPER, "M", layoutMsg("swapwithmaster"));` |
| `setLayout(std::string name)` | switch the layout of every workspace without a layout in a workspace rule (as `abyssctl dispatch setlayout`) | `c.bind(SUPER, "F2", setLayout("master"));` |
| `toggleSplit()` | dwindle: toggle the split direction of the active window | `c.bind(SUPER, "J", toggleSplit());` |
| `swapSplit()` | dwindle: swap the two halves of the split | `c.bind("SUPER+SHIFT+J", swapSplit());` |

### Misc

| Signature | What it does | Example |
|---|---|---|
| `submap(std::string name)` | switch the keybind submap, `"reset"` leaves it | `c.bind(SUPER, "X", submap("resize"));` |
| `pass(std::string selector)` | pass the pressed key to a window | `c.bind(SUPER, "F5", pass("class:^(obs)$"));` |
| `sendShortcut(Mods mods, std::string key, std::string selector = "")` | send a key combination to a window | `c.bind(SUPER, "F6", sendShortcut(CTRL, "R", "class:^(firefox)$"));` |
| `sendKeyState(Mods mods, std::string key, std::string state, std::string selector = "")` | send a key event to a window; `state` is `"down"`, `"repeat"` or `"up"` | `c.bind(SUPER, "F7", sendKeyState(NONE, "space", "down", "class:^(mpv)$"));` |
| `global(std::string name)` | trigger a global shortcut, `"app:name"` | `c.bind(SUPER, "F8", global("org.example.app:record"));` |
| `event(std::string data)` | emit a custom event on the event socket (as `abyssctl dispatch event`) | `c.bind("SUPER+ALT+E", event("hello"));` |
| `forceRendererReload()` | reload the renderer | `c.bind("SUPER+ALT+F5", forceRendererReload());` |
| `forceIdle(float seconds)` | act as if the system had been idle for that long (bypasses idle inhibitors) | `c.bind("SUPER+ALT+I", forceIdle(1.0f));` |
| `showScreensaver()` | show the first screensaver registered with `c.idle` now, the next input ends it | `c.bind("SUPER+ALT+Z", showScreensaver());` |
| `releaseInputCapture()` | release an active input capture | `c.bind("SUPER+ALT+Escape", releaseInputCapture());` |
| `exit()` | end the session | `c.bind("SUPER+SHIFT+Escape", exit());` |
| `noop()` | do nothing: a bind that only swallows its key | `c.bind(NONE, "XF86Launch1", noop());` |


::: tip Your own dispatch
Everything `abyssctl dispatch` knows is reachable from the config with `dispatch(name, arg)`. See the dispatcher list in the [abyssctl reference](/wiki/abyssctl#dispatchers).
:::
