# Events, timers, idle and screensaver

Everything that reacts to something: programs that start with the session, listeners for window and monitor events, timers, idle rules and the screensaver. All of it is registered in `configure()` and dropped on the next load, so nothing is registered twice.

## Startup and shutdown

```cpp
void onStart(std::function<void()> fn);
void onShutdown(std::function<void()> fn);
void exec(std::string cmd);
void execOnce(std::string cmd);
void execShutdown(std::string cmd);
```

```cpp
c.onStart([] {
    exec("quickshell");                       // your bar or shell
    exec("wl-paste --type text --watch cliphist store");
});
c.onShutdown([] { exec("notify-send 'bye'"); });
```

`onStart` runs the callback **once per compositor process**, when the compositor has started. This makes it the autostart entry point: `exec("quickshell")` inside it starts the shell only once. An in-process reload (`abyssctl reload --no-build`) does not run it again, a rebuilt compositor is a new process and runs it again.

`exec(command)` inside a callback starts the command immediately through `/bin/sh -c` (shell expansion, pipes and redirects work) and supports exec rules such as `"[float; size 800 600] kitty"`.

| Function | When the command runs |
|---|---|
| `c.onStart(fn)` | once per compositor process, after start (preferred) |
| `c.onShutdown(fn)` | when the compositor shuts down (it is the `Event::Shutdown` listener) |
| `c.exec(cmd)` | after the compositor started, on every config load |
| `c.execOnce(cmd)` | after the compositor started, only on the very first load of this session |
| `c.execShutdown(cmd)` | when the compositor shuts down (registered on the first load only) |

Prefer `c.onStart` with `exec` for autostart. A copy-and-paste recipe for the Abyss companion tools is in [Example configs](/wiki/config/examples#starting-the-abyss-tools).

## Events

Subscribe with `c.on(Event::..., callback)`. A callback may take fewer arguments than the event provides, down to none. The tags live in the global `Event` namespace so they can be written as `Event::WindowOpen` even with `using namespace abyss;`.

```cpp
c.on(Event::WindowOpen, [](PHLWINDOW w) { notify("opened " + windowTitle(w)); });
c.on(Event::WorkspaceActive, [] { /* no arguments needed */ });
c.on(Event::MonitorAdded, [](PHLMONITOR m) { notify("new monitor " + monitorName(m)); });
```

| Event | Callback arguments | Fires when |
|---|---|---|
| `Event::Start` | none | the compositor started |
| `Event::Shutdown` | none | the compositor shuts down |
| `Event::WindowOpen` | `PHLWINDOW` | a window is mapped and its rules were applied |
| `Event::WindowOpenEarly` | `PHLWINDOW` | a window opens, before it is fully set up |
| `Event::WindowClose` | `PHLWINDOW` | a window closes (still a valid window) |
| `Event::WindowDestroy` | `PHLWINDOWREF` | the window object is being destroyed, the ref may already be expired |
| `Event::WindowKill` | `PHLWINDOW` | just before click-to-kill (`abyssctl dispatch kill`) sends SIGKILL to the window's process |
| `Event::WindowActive` | `PHLWINDOW`, `int` | the focused window changed; the second argument is the focus reason |
| `Event::WindowUrgent` | `PHLWINDOW` | a window asks for attention |
| `Event::WindowTitle` | `PHLWINDOW` | the title changed |
| `Event::WindowClass` | `PHLWINDOW` | the class changed |
| `Event::WindowPin` | `PHLWINDOW` | a window was pinned or unpinned |
| `Event::WindowFullscreen` | `PHLWINDOW` | the fullscreen state changed |
| `Event::WindowFloating` | `PHLWINDOW` | floating or tiled changed |
| `Event::WindowUpdateRules` | `PHLWINDOW` | the rules were applied again |
| `Event::WindowMoveToWorkspace` | `PHLWINDOW`, `PHLWORKSPACE` | a window moved to another workspace |
| `Event::LayerOpened`, `Event::LayerClosed` | `PHLLS` | a layer surface appeared or went away |
| `Event::MonitorAdded`, `Event::MonitorRemoved` | `PHLMONITOR` | a monitor was plugged in or removed |
| `Event::MonitorFocused` | `PHLMONITOR` | the focused monitor changed |
| `Event::MonitorLayoutChanged` | none | the monitor layout changed |
| `Event::WorkspaceActive` | `PHLWORKSPACE` | a workspace became active |
| `Event::WorkspaceSpecialActive` | `PHLWORKSPACE`, `PHLMONITOR` | a special workspace was shown or hidden |
| `Event::WorkspaceCreated` | `PHLWORKSPACE` | a workspace was created |
| `Event::WorkspaceRemoved` | `PHLWORKSPACEREF` | a workspace is removed; use `workspaceId()` / `workspaceName()` on the ref |
| `Event::WorkspaceMoveToMonitor` | `PHLWORKSPACE`, `PHLMONITOR` | a workspace moved to another monitor |
| `Event::ConfigReloaded` | none | the config was loaded again |
| `Event::PropsRefreshed` | `bool` | window properties were refreshed; the argument says whether it ran as scheduled |
| `Event::Submap` | `std::string` | the keybind submap changed (`""` is the default one) |
| `Event::ScreenshareState` | `bool`, `int`, `std::string` | screen sharing started or stopped: started, type, name |
| `Event::KeyboardKey` | `int`, `int`, `int` | a key was pressed or released: xkb keycode (+8), time in ms, state (0 up, 1 down) |

`WindowDestroy` and `WorkspaceRemoved` hand you a weak reference. Check it before use:

```cpp
c.on(Event::WindowDestroy, [](PHLWINDOWREF w) {
    if (auto win = w.lock())
        notify(windowTitle(win));
});
c.on(Event::WindowKill, [](PHLWINDOW w) { notify("killing " + windowTitle(w)); });
c.on(Event::WorkspaceRemoved, [](PHLWORKSPACEREF ws) { notify("gone: " + workspaceName(ws)); });
```

### More event examples

```cpp
// center pavucontrol when it opens, from code instead of a rule
c.on(Event::WindowOpen, [](PHLWINDOW w) {
    if (windowClass(w) == "pavucontrol")
        run(centerWindow(byAddress(w)));
});

// tell a bar about the active submap (a script reads it from the event socket, see c.command and emit)
c.on(Event::Submap, [](std::string name) { emit("submap", name); });

// show when someone starts sharing the screen
c.on(Event::ScreenshareState, [](bool started, int, std::string name) {
    notify(std::string(started ? "sharing: " : "stopped sharing: ") + name, 3000, std::nullopt, "warning");
});

// log every key (needs c.debug.disable_logs = false)
c.on(Event::KeyboardKey, [](int code, int, int state) { print("key {} state {}", code, state); });

// a notification when the config was applied
c.on(Event::ConfigReloaded, [] { notify("config reloaded", 2000, std::nullopt, "ok"); });
```

### Handles

`c.on` returns an `EventHandle`. `cancel()` removes the listener early; `isActive()` tells whether it still is registered (false after `cancel()` or once a reload dropped it, also on copies of the handle). See [Handles](/wiki/config/rules#handles).

```cpp
auto h = c.on(Event::WindowOpen, [](PHLWINDOW w) { notify(windowTitle(w)); });
// later
if (h.isActive())
    h.cancel();
```

## Timers

```cpp
TimerHandle timer(int ms, std::function<void()> fn, bool repeat = false, bool enabled = true);
```

`c.timer` calls `fn` after `ms` milliseconds, and every `ms` milliseconds when `repeat` is set. With `enabled = false` the timer is created disarmed and starts when you call `setEnabled(true)` or `setTimeout(ms)`.

```cpp
auto t = c.timer(60'000, [] { notify("one minute passed"); }, /*repeat=*/true);
t.setEnabled(false);   // disarm
t.cancel();            // remove
t.setTimeout(30'000);  // new interval: armed now, fires every 30 s

// created disarmed, started by a bind
auto tick = c.timer(5000, [] { notify("still here"); }, /*repeat=*/true, /*enabled=*/false);
c.bind(SUPER, "F12", [tick] { tick.setEnabled(!tick.isEnabled()); return ok(); });
```

| `TimerHandle` method | Effect |
|---|---|
| `setEnabled(bool)` | re-arms with the original interval, or disarms |
| `isEnabled()` | armed. A oneshot timer is not enabled any more after it fired; a cancelled or reload-dropped timer never is |
| `setTimeout(int ms)` | new interval in ms (at least 1); arms the timer to fire after it. For a repeating timer the new interval is kept |
| `cancel()` | removes the timer |

Timer callbacks run on the compositor thread, so keep them short and use `exec()` for anything slow.

## Idle

```cpp
void idle(double seconds, std::function<void()> onIdle, std::function<void()> onResume = {});
void idle(double seconds, Screensaver s);
```

`c.idle` runs a callback after a period without input (keyboard, pointer, touch, tablet) and, optionally, another one on the first input afterwards:

```cpp
c.idle(300, [] { exec("abysslock"); });                    // lock after 5 minutes
c.idle(600, [] { run(dpms("off")); },
            [] { run(dpms("on")); });                      // screen off, back on with the first input
c.idle(1800, [] { exec("systemctl suspend"); });           // suspend after 30 minutes
```

- Nothing is registered by default: there is no built-in lock, suspend or helper. Do it in the callbacks.
- Active idle inhibitors (video players, browsers in fullscreen, `idleInhibit` window rules) block the rule. When they go away, the whole timeout counts again.
- `onResume` only runs after `onIdle` ran. It may be left out.
- `seconds` must be finite, at least `0.001` and at most about `4294966`.
- The rule is registered once the compositor started. A reload (`abyssctl reload --no-build`) drops and re-creates the rules, they never stack up.
- Callbacks run on the compositor thread: keep them short and use `exec()` for anything slow. Exceptions are caught and logged.
- The `forceIdle` action bypasses inhibitors, as it does for the `ext-idle-notify` protocol.

::: tip Wake a screen that DPMS switched off
Set `c.misc.mouse_move_enables_dpms = true` and `c.misc.key_press_enables_dpms = true`, otherwise a monitor that was switched off with `dpms("off")` stays dark until you switch it on. Both default to off, see [Options](/wiki/config/options#c-misc).
:::

## Screensaver

The screensaver is part of idle. Pass `screensaver(...)` instead of the two callbacks. It is shown fullscreen on every monitor on idle, above everything including the session lock, and hidden again on the first input, which is swallowed: it only wakes up (a click or key does not reach a window, a bind or the lock screen below, moving the mouse also wakes up).

```cpp
c.idle(300, screensaver(saver::clock()));                                   // big clock with date
c.idle(300, screensaver(saver::cava({.bars = 64, .color = 0x80b0d8})));    // audio bars (needs the cava program)
```

Lock and screensaver together: the lock screen is what you see after waking the saver up.

```cpp
c.idle(300, screensaver(saver::clock()));
c.idle(300, [] { exec("abysslock"); });
```

- `abyssctl dispatch screensaver` (or the `showScreensaver()` action) shows the first configured one right away, which is handy for testing.
- Nothing runs (no timer, no process) while no screensaver is shown. The cursor is hidden meanwhile. A reload ends a running screensaver.
- Other idle rules (lock, DPMS through `exec`) still run next to it.

### Ready-made savers

```cpp
c.idle(300, screensaver(saver::clock({.color = 0xc8a25a, .size = 200, .format = "%H:%M:%S"})));
```

| `saver::ClockOpts` field | Default | Meaning |
|---|---|---|
| `.color` | `0xffffff` | text color, `0xRRGGBB` |
| `.size` | `160` | time font size in logical pixels |
| `.format` | `"%H:%M"` | `strftime` format of the time |
| `.dateFormat` | `"%A, %d. %B %Y"` | `strftime` format of the date, empty = no date line |
| `.background` | `0x000000` | background color |
| `.wander` | `true` | burn-in protection: jump to a new spot once a minute (the same spot on every monitor); `false` keeps it centered |

| `saver::CavaOpts` field | Default | Meaning |
|---|---|---|
| `.bars` | `64` | number of bars |
| `.color` | `0x80b0d8` | bar color |
| `.background` | `0x000000` | background color |
| `.fps` | `60` | redraw rate |

`saver::cava` needs the `cava` program. Without it, or without audio, the bars stay quiet; the compositor keeps running if `cava` dies.

### Your own screensaver

`screensaver(fn, opts)` takes a callback that is called once per monitor and frame while the screensaver is shown (not at all otherwise). It draws into a `Canvas`, a thin wrapper around cairo and pango: no widgets, no toolkit. An exception in the callback is caught and logged, the frame stays black.

```cpp
c.idle(300, screensaver([](Canvas& g, const SaverFrame& f) {
    g.clear(0x000000);
    g.text(f.width / 2, f.height / 2, "hello", {.size = 64, .color = 0xc8a25a, .align = Align::Center});
}, {.fps = 30}));
```

```cpp
Screensaver screensaver(SaverFn fn, SaverOpts opts = {});   // SaverFn = std::function<void(Canvas&, const SaverFrame&)>
```

::: details Canvas drawing functions
Colors are `0xRRGGBB` with an optional alpha as a separate `0..1` argument. Coordinates are logical pixels (`SaverFrame::width` and `height` are already divided by the monitor scale), the origin is the top left.

| Function | Draws |
|---|---|
| `clear(color, alpha = 1.0)` | fills everything |
| `rect(x, y, w, h, color, alpha = 1.0)` | a rectangle |
| `roundRect(x, y, w, h, radius, color, alpha = 1.0)` | a rounded rectangle |
| `line(x1, y1, x2, y2, color, width = 1.0, alpha = 1.0)` | a line |
| `circle(cx, cy, radius, color, alpha = 1.0)` | a filled circle |
| `text(x, y, str, TextOpts = {})` | text; `y` is the vertical middle of the (single or multi line) text, Pango markup is not interpreted |
| `textSize(str, TextOpts = {})` | width and height of the text as `text()` would draw it |
| `image(path, x, y, w = 0, h = 0)` | a PNG; `0` keeps the size (one of them `0` keeps the aspect ratio); cached until the screensaver ends |
| `cairo()` | the raw cairo context, already scaled to logical pixels (include `<cairo.h>` yourself) |

`TextOpts`: `.size` (24), `.color` (`0xffffff`), `.align` (`Align::Left`, `Align::Center` or `Align::Right`), `.alpha` (1.0), `.bold` (false), `.font` (a Pango family, empty means "IBM Plex Sans").
:::

`SaverFrame` is what the callback gets:

| Member | Meaning |
|---|---|
| `width`, `height` | logical size of the monitor |
| `scale` | monitor scale (1 logical pixel = `scale` device pixels) |
| `monitor` | output name |
| `time` | seconds since the screensaver started |
| `now` | the current `std::chrono::system_clock::time_point` |
| `audio` | current cava bars (`0` to `1`), `SaverOpts::bars` entries; empty when `SaverOpts::audio` is off; quiet bars when no audio plays or `cava` is missing |

`SaverOpts` (the second argument of `screensaver`):

| Field | Default | Meaning |
|---|---|---|
| `.fps` | `30` | redraw rate, `0` draws once (and again only when the monitor changes), at most `144` |
| `.audio` | `false` | start `cava` and fill `SaverFrame::audio` while the screensaver runs |
| `.bars` | `64` | number of audio bars (1 to 512), only with `.audio` |
| `.monitors` | empty | only these outputs (empty means all, the others stay black) |

#### Examples

::: code-group

```cpp [Drifting text]
// a name that drifts slowly across the screen
c.idle(300, screensaver([](Canvas& g, const SaverFrame& f) {
    g.clear(0x050816);
    const double x = f.width * (0.3 + 0.4 * (0.5 + 0.5 * std::sin(f.time * 0.15)));
    const double y = f.height * (0.3 + 0.4 * (0.5 + 0.5 * std::sin(f.time * 0.11)));
    g.text(x, y, "ABYSS", {.size = 96, .color = 0xc8a25a, .align = Align::Center, .bold = true});
}, {.fps = 30}));
```

```cpp [Analog clock]
c.idle(300, screensaver([](Canvas& g, const SaverFrame& f) {
    g.clear(0x050816);
    const auto   t  = std::chrono::system_clock::to_time_t(f.now);
    std::tm      tm{};
    localtime_r(&t, &tm);
    const double cx = f.width / 2, cy = f.height / 2, r = std::min(f.width, f.height) * 0.3;
    g.circle(cx, cy, r, 0x182234);
    auto hand = [&](double turns, double len, double w, uint32_t color) {
        const double a = turns * 2 * M_PI - M_PI / 2;
        g.line(cx, cy, cx + std::cos(a) * r * len, cy + std::sin(a) * r * len, color, w);
    };
    hand((tm.tm_hour % 12 + tm.tm_min / 60.0) / 12, 0.5, 6, 0xc8a25a);
    hand((tm.tm_min + tm.tm_sec / 60.0) / 60, 0.8, 4, 0x80b0d8);
    hand(tm.tm_sec / 60.0, 0.9, 2, 0xffffff);
}, {.fps = 1}));
```

```cpp [Audio bars]
// bars from the audio that plays, only on DP-1
c.idle(300, screensaver([](Canvas& g, const SaverFrame& f) {
    g.clear(0x000000);
    const size_t n = f.audio.size();
    if (n == 0)
        return;
    const double slot = f.width / n;
    for (size_t i = 0; i < n; ++i) {
        const double h = std::max(2.0, f.audio[i] * f.height * 0.6);
        g.rect(i * slot + 2, f.height * 0.8 - h, slot - 4, h, 0x80b0d8);
    }
}, {.fps = 60, .audio = true, .bars = 48, .monitors = {"DP-1"}}));
```

```cpp [Image]
// a PNG in the middle, 50 percent of the screen height
c.idle(300, screensaver([](Canvas& g, const SaverFrame& f) {
    g.clear(0x000000);
    g.image("/usr/share/pixmaps/logo.png", f.width / 2 - f.height * 0.25, f.height * 0.25, 0, f.height * 0.5);
}, {.fps = 0}));
```

:::

::: warning Compile includes
The functions `std::sin`, `std::min` and friends come from `<cmath>` and `<algorithm>`; `abyss/saver.hpp` already includes both, and `<ctime>` for `localtime_r`. Include `<cairo.h>` yourself if you use `Canvas::cairo()`.
:::
