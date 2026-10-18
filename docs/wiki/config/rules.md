# Window, layer and workspace rules

Rules pair a **match** with **effects**. Whenever a window (or layer surface) appears or changes, every rule whose match fits has its effects applied.

```cpp
// ignore maximize requests from apps
c.windowRule({}, {.suppressEvent = "maximize"}, "suppress-maximize");

// always float pavucontrol
c.windowRule({.cls = "^(org.pulseaudio.pavucontrol)$"},
             {.floating = true, .center = true, .size = "800 600"},
             "pavucontrol-float");
```

```cpp
RuleHandle windowRule(const WindowMatch& match, const WindowEffects& effects, std::string name = "", bool enabled = true);
RuleHandle layerRule(const LayerMatch& match, const LayerEffects& effects, std::string name = "", bool enabled = true);
RuleHandle workspaceRule(std::string workspace, const WorkspaceRule& rule);
```

::: tip Finding class, title and namespace
`abyssctl clients` lists every window with its class, initial class, title and more. `abyssctl layers` lists layer surfaces and their namespaces. Use those values in your matches.
:::

## How matching works

- A field you leave unset does not take part in matching. `{}` matches every window.
- All set fields must match (logical and).
- String fields are regular expressions (RE2) and must match the **whole** string. `"^(kitty)$"` matches the class `kitty`, `".*kitty.*"` matches any class that contains it, a bare `"kitty"` only matches the exact text `kitty`.
- A string that starts with `negative:` matches everything the rest of the expression does **not** match: `.cls = "negative:^(kitty)$"`.
- Boolean fields (`floating`, `xwayland`, ...) match the state of the window.
- Designated initializers must follow the declaration order of the tables below, a C++ rule.

### WindowMatch

| Field | Type | Matches |
|---|---|---|
| `.cls` | regex | the window class |
| `.title` | regex | the window title |
| `.initialClass` | regex | the class when the window was mapped |
| `.initialTitle` | regex | the title when the window was mapped |
| `.floating` | bool | floating or tiled |
| `.tag` | string | windows that have this tag |
| `.xwayland` | bool | X11 windows |
| `.fullscreen` | bool | fullscreen windows |
| `.pinned` | bool | pinned windows |
| `.focus` | bool | the focused window |
| `.group` | bool | windows in a group |
| `.modal` | bool | modal windows |
| `.workspace` | string | workspace selector, for example `"1"` or `"name:web"` |
| `.content` | string | content type |
| `.xdgTag` | string | the xdg toplevel tag |
| `.fullscreenStateInternal` | int | internal fullscreen state |
| `.fullscreenStateClient` | int | client fullscreen state |
| `.extra` | list of `{name, value}` | the same matches by property name: `class`, `title`, `initial_class`, `initial_title`, `float`, `tag`, `xwayland`, `fullscreen`, `pin`, `focus`, `group`, `modal`, `fullscreen_state_internal`, `fullscreen_state_client`, `workspace`, `content`, `xdg_tag` |

An unknown name in `.extra` is reported when the config loads.

## Window rules

`c.windowRule(match, effects, name = "", enabled = true)`:

- A rule with a **name** is updated when one with the same name was already registered in this config load: the match properties and effects of the new call are added to it, and `enabled` is set again. So a name addresses exactly one rule. Without a name every call adds a new rule.
- `enabled = false` registers (or switches) the rule disabled. Use the returned handle to toggle it later, see [Handles](#handles).

### WindowEffects

The effect fields are optional; designated initializers must follow this order. "Rule name" is the name the rule engine knows the effect by, and is what you use in `.extra`.

| Field | Rule name | Type | Effect |
|---|---|---|---|
| `.floating` | `float` | bool | Open the window floating |
| `.tile` | `tile` | bool | Force tiling |
| `.fullscreen` | `fullscreen` | bool | Open fullscreen |
| `.maximize` | `maximize` | bool | Open maximized |
| `.center` | `center` | bool | Center a floating window on its monitor |
| `.pseudo` | `pseudo` | bool | Pseudotile the window |
| `.pin` | `pin` | bool | Pin a floating window to every workspace |
| `.size` | `size` | string | Window size, for example `"800 600"` or `"monitor_w*0.5 monitor_h*0.5"` |
| `.move` | `move` | string | Window position in the same style as `size`, for example `"100 100"` |
| `.minSize` | `min_size` | string | Minimum size, `"w h"` |
| `.maxSize` | `max_size` | string | Maximum size, `"w h"` |
| `.monitor` | `monitor` | string | Open on this monitor |
| `.workspace` | `workspace` | string | Open on this workspace, for example `"2"`, `"name:web"` or `"special:music"` |
| `.group` | `group` | string | Group behavior (the text of the group rule) |
| `.opacity` | `opacity` | string | Opacity, `"active inactive"` as in `"0.9 0.8"` |
| `.borderColor` | `border_color` | string | Border colors as text, for example `"0xff80b0d8 0xffffffff 45deg"` |
| `.borderSize` | `border_size` | int | Border size in pixels |
| `.rounding` | `rounding` | int | Corner radius in pixels |
| `.roundingPower` | `rounding_power` | float | Rounding power of the corners |
| `.animation` | `animation` | string | Animation style for this window, for example `"popin 80%"` |
| `.tag` | `tag` | string | Add (`"+name"`), remove (`"-name"`) or toggle (`"name"`) a tag |
| `.content` | `content` | string | Content type of the window (`none`, `photo`, `video` or `game`) |
| `.idleInhibit` | `idle_inhibit` | string | Idle inhibit mode: `none`, `always`, `focus` or `fullscreen` |
| `.fullscreenState` | `fullscreen_state` | string | Fullscreen state as `"internal client"` |
| `.suppressEvent` | `suppress_event` | string | Events to ignore: `fullscreen`, `maximize`, `activate`, `activatefocus`, `fullscreenoutput`, `x11configurerequest` |
| `.tonemap` | `tonemap` | string | Tone mapping mode for HDR content |
| `.scrollingWidth` | `scrolling_width` | float | Column width in the scrolling layout |
| `.scrollMouse` | `scroll_mouse` | float | Mouse scroll factor for this window |
| `.scrollTouchpad` | `scroll_touchpad` | float | Touchpad scroll factor for this window |
| `.noCloseFor` | `no_close_for` | int | Ignore close requests for this many milliseconds after the window opened |
| `.noInitialFocus` | `no_initial_focus` | bool | Do not focus the window when it opens |
| `.noFocus` | `no_focus` | bool | The window never takes focus |
| `.noFollowMouse` | `no_follow_mouse` | bool | Focus does not follow the mouse onto this window |
| `.stayFocused` | `stay_focused` | bool | Keep the focus on this window as long as it is visible |
| `.focusOnActivate` | `focus_on_activate` | bool | Focus the window when it asks to be activated |
| `.allowsInput` | `allows_input` | bool | Force an XWayland window to receive input even if it asks not to |
| `.persistentSize` | `persistent_size` | bool | Remember the size of the floating window |
| `.keepAspectRatio` | `keep_aspect_ratio` | bool | Keep the aspect ratio when resizing |
| `.noMaxSize` | `no_max_size` | bool | Remove max-size limits, useful for clients that report invalid ones |
| `.decorate` | `decorate` | bool | Draw decorations (border, shadow) for the window |
| `.dimAround` | `dim_around` | bool | Dim everything around the window |
| `.noDim` | `no_dim` | bool | Never dim this window |
| `.noAnim` | `no_anim` | bool | Disable animations for this window |
| `.noBlur` | `no_blur` | bool | No background blur for this window |
| `.noShadow` | `no_shadow` | bool | No shadow for this window |
| `.opaque` | `opaque` | bool | Render the window opaque |
| `.xray` | `xray` | bool | Blur ignores the windows below |
| `.nearestNeighbor` | `nearest_neighbor` | bool | Scale the window with nearest-neighbor filtering |
| `.forceRgbx` | `force_rgbx` | bool | Treat the buffer as RGBX (ignore alpha) |
| `.syncFullscreen` | `sync_fullscreen` | bool | Sync the fullscreen state with the client |
| `.immediate` | `immediate` | bool | Allow tearing for this window (needs `c.general.allow_tearing`) |
| `.renderUnfocused` | `render_unfocused` | bool | Keep rendering the window while it is not visible |
| `.noScreenShare` | `no_screen_share` | bool | Hide the window from screen sharing |
| `.noShortcutsInhibit` | `no_shortcuts_inhibit` | bool | Ignore shortcut-inhibit requests from the client |
| `.noVrr` | `no_vrr` | bool | Do not let this window enable VRR |
| `.noAutoHdr` | `no_auto_hdr` | bool | Do not enable automatic HDR for this window |
| `.confinePointer` | `confine_pointer` | bool | Confine the pointer to the window while it is focused |

Bool effects take `true`/`false`. String effects take the text the rule has always taken, for example `size = "800 600"` or `size = "monitor_w*0.5 monitor_h*0.5"`, `opacity = "0.9 0.8"`, `borderColor = "0xff80b0d8 0xffffffff 45deg"`. For anything not in the table there is `.extra`, a list of rule name and value pairs. The pair `{"float", "true"}` is the same as `.floating = true`.

### Examples

::: code-group

```cpp [Floating dialogs]
c.windowRule({.cls = "^(org.pulseaudio.pavucontrol)$"}, {.floating = true, .center = true, .size = "800 600"}, "float-pavucontrol");
c.windowRule({.cls = "^(blueman-manager)$"}, {.floating = true}, "float-blueman");
c.windowRule({.title = "^(Open File|Save As)$"}, {.floating = true, .center = true}, "float-file-dialogs");
```

```cpp [Workspaces and monitors]
// open Firefox on workspace 2 and Steam on workspace 5
c.windowRule({.cls = "^(firefox)$"}, {.workspace = "2"}, "firefox-ws");
c.windowRule({.cls = "^(steam)$"}, {.workspace = "5"}, "steam-ws");

// a music player lives in a scratchpad
c.windowRule({.cls = "^(spotify)$"}, {.floating = true, .workspace = "special:music"}, "music");

// everything on the second monitor
c.windowRule({.cls = "^(obs)$"}, {.monitor = "DP-2"}, "obs-monitor");
```

```cpp [Look]
// translucent terminals
c.windowRule({.cls = "^(kitty)$"}, {.opacity = "0.9 0.8"}, "kitty-opacity");

// no blur or shadow for a video player, and keep the screen awake while it is focused
c.windowRule({.cls = "^(mpv)$"}, {.idleInhibit = "focus", .noBlur = true, .noShadow = true}, "mpv");

// a gold border for tagged windows
c.windowRule({.tag = "work"}, {.borderColor = "0xffc8a25a"}, "work-border");
```

```cpp [Fixes]
// ignore maximize requests from apps
c.windowRule({}, {.suppressEvent = "maximize"}, "suppress-maximize");

// fix some dragging issues with XWayland
c.windowRule({.cls = "^$", .title = "^$", .floating = true, .xwayland = true, .fullscreen = false, .pinned = false},
             {.noFocus = true}, "xwayland-dragging-fix");

// ignore fullscreen requests from every app except kitty
c.windowRule({.cls = "negative:^(kitty)$"}, {.suppressEvent = "fullscreen"}, "no-app-fullscreen");
```

```cpp [Tags]
// tag by class, then act on the tag everywhere
c.windowRule({.cls = "^(firefox|chromium)$"}, {.tag = "+browser"}, "tag-browsers");
c.windowRule({.tag = "browser"}, {.opacity = "1.0 0.95"}, "browser-opacity");
c.bind(SUPER, "B", focusWindow("tag:browser"));
```

:::

## Layer rules

Layer surfaces are bars, launchers, notification daemons and other shell components. A layer is matched by its namespace (see `abyssctl layers`).

```cpp
c.layerRule(LayerMatch{.nspace = "^(waybar)$"}, LayerEffects{.blur = true, .ignoreAlpha = 0.3}, "bar-blur");
c.layerRule(LayerMatch{.nspace = "^(launcher)$"}, LayerEffects{.animation = "fade"}, "launcher-fade");
c.layerRule(LayerMatch{.nspace = "^(notifications)$"}, LayerEffects{.noAnim = true, .noScreenShare = true}, "no-notification-anim");
```

### LayerMatch

| Field | Type | Matches |
|---|---|---|
| `.nspace` | regex | the layer namespace (`namespace` is a C++ keyword) |
| `.extra` | list of `{name, value}` | matches by property name, `namespace` |

### LayerEffects

| Field | Rule name | Type | Effect |
|---|---|---|---|
| `.blur` | `blur` | bool | Blur behind the layer |
| `.blurPopups` | `blur_popups` | bool | Blur the popups of the layer too |
| `.ignoreAlpha` | `ignore_alpha` | float | Pixels with an alpha below this value (0 to 1) are not blurred |
| `.noAnim` | `no_anim` | bool | Disable animations for the layer |
| `.animation` | `animation` | string | Animation style for the layer, for example `"slide"` or `"fade"` |
| `.dimAround` | `dim_around` | bool | Dim everything around the layer |
| `.xray` | `xray` | bool | Blur ignores the windows below |
| `.order` | `order` | int | Stacking order inside the layer |
| `.aboveLock` | `above_lock` | int | Show the layer above the lock screen |
| `.noScreenShare` | `no_screen_share` | bool | Hide the layer from screen sharing |

`LayerEffects` has an `.extra` list as well. The naming rules (names, `enabled`, handles) are the same as for window rules.

## Workspace rules

`c.workspaceRule` binds workspaces to monitors and gives them their own layout, gaps and behavior. It is described with monitors, see [Monitors and workspaces](/wiki/config/monitors#workspaces).

## Handles

Binds, rules, timers and event listeners return a small handle you can keep (in a variable, a lambda capture or a global) to switch the thing later without a reload. A reload drops every bind, rule, timer and listener, which invalidates all handles: query them again from the new `configure()`.

| Handle | From | Methods |
|---|---|---|
| `BindHandle` | `c.bind` | `setEnabled(bool)`, `isEnabled()`, `remove()` |
| `RuleHandle` | `c.windowRule`, `c.layerRule`, `c.workspaceRule` | `setEnabled(bool)`, `isEnabled()` |
| `TimerHandle` | `c.timer` | `setEnabled(bool)`, `isEnabled()`, `setTimeout(int ms)`, `cancel()` |
| `EventHandle` | `c.on` | `isActive()`, `cancel()` |

A disabled rule stays registered but is ignored. Switching it applies the rules to the existing windows, layers or workspaces right away. `isEnabled()` is false when the rule is gone (after a reload).

```cpp
// a rule that is off until you toggle it
auto r = c.windowRule({.cls = "^(kitty)$"}, {.opacity = "0.8"}, "kitty-opacity", /*enabled=*/false);
c.bind(SUPER, "O", [r] { r.setEnabled(!r.isEnabled()); });

// the same for a workspace rule
WorkspaceRule quiet{.noBorder = true, .noShadow = true, .enabled = false};
auto q = c.workspaceRule("name:focus", quiet);
c.bind(SUPER, "Z", [q] { q.setEnabled(!q.isEnabled()); });
```

`workspaceRule(workspace, rule)`: set `rule.enabled = false` (`WorkspaceRule::enabled`) to register it disabled. An enabled rule for the same workspace string is merged into instead of adding a new one, so a disabled rule is only created when none is enabled yet; otherwise switch it with the handle.

Handles for binds, timers and events are described with their features: [Keybinds](/wiki/config/keybinds#remove-and-switch-binds), [Events](/wiki/config/events#handles).
