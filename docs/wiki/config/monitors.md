# Monitors and workspaces

Outputs are configured with `c.monitor`, switched off with `c.disableMonitor`, and workspaces are tied to them with `c.workspaceRule`. List your output names with `abyssctl monitors all`.

```cpp
c.monitor("DP-1", "2560x1440@144", "0x0", 1.0);
c.monitor("", "preferred", "auto", 1.0);   // every other monitor: automatic
c.disableMonitor("DP-3");
c.workspaceRule("3", {.layout = "dwindle"});
```

## c.monitor

```cpp
void monitor(std::string name, std::string mode = "preferred", std::string position = "auto", double scale = 1.0, const MonitorOpts& opts = {});
void monitor(std::string name, std::string mode, std::string position, std::string scale, const MonitorOpts& opts = {});
void disableMonitor(std::string name);
```

| Argument | Values |
|---|---|
| `name` | an output name such as `"DP-1"`, a description match `"desc:..."`, or `""` for every monitor that has no rule of its own |
| `mode` | `"preferred"`, `"highres"`, `"highrr"`, `"maxwidth"`, `"WxH"` or `"WxH@Hz"` (for example `"2560x1440@144"`); a DRM modeline is accepted as well |
| `position` | `"auto"` (right of the others), `"auto-left"`, `"auto-right"`, `"auto-up"`, `"auto-down"`, `"auto-center-left"`, `"auto-center-right"`, `"auto-center-up"`, `"auto-center-down"`, or `"XxY"` in layout pixels such as `"2560x0"` |
| `scale` | a factor of at least `0.25` (`1.0`, `1.5`, `2.0`) or `"auto"`; the `double` overload treats a value of zero or less as `"auto"` |
| `opts` | a [`MonitorOpts`](#monitoropts) for everything else |

A second call for the same output name is merged into the first rule instead of replacing it. A bad mode, position or scale is reported when the config loads (`abyssctl configerrors`).

### Several monitors

Positions are in layout pixels, measured from the top-left corner. Put the monitors next to each other by giving the second one the width of the first as its X position:

```cpp
// two monitors side by side: DP-1 on the left, DP-2 to its right
c.monitor("DP-1", "2560x1440@144", "0x0", 1.0);
c.monitor("DP-2", "1920x1080@60", "2560x0", 1.0);
c.monitor("", "preferred", "auto", 1.0);          // anything else plugged in later
```

Positions are explicit, so two monitors of different height are aligned at the top unless you offset one. Shift the smaller one down to center it:

```cpp
c.monitor("DP-1", "2560x1440@144", "0x0", 1.0);
c.monitor("DP-2", "1920x1080@60", "2560x180", 1.0);
```

### Scaling

```cpp
c.monitor("eDP-1", "preferred", "0x0", 1.5);       // fractional scale
c.monitor("DP-2", "3840x2160@60", "auto", "auto"); // let Abyssland choose (string overload)
c.monitor("DP-3", "3840x2160@60", "auto", 2.0);
```

### Rotation and mirroring

```cpp
// a portrait monitor: transform 1 = rotated by 90 degrees
c.monitor("DP-2", "preferred", "auto-right", 1.0, {.transform = 1});

// mirror the laptop panel onto a projector
c.monitor("HDMI-A-2", "preferred", "auto", 1.0, {.mirror = "eDP-1"});
```

`transform` follows `wl_output_transform`: `0` normal, `1` 90, `2` 180, `3` 270 degrees, `4` flipped, `5` flipped and 90, `6` flipped and 180, `7` flipped and 270.

### Switching a monitor off

```cpp
c.disableMonitor("DP-3");
```

To turn the picture off temporarily (and wake it up again on input), use the [`dpms`](/wiki/config/keybinds#all-built-in-actions) action together with `c.misc.mouse_move_enables_dpms` and `c.misc.key_press_enables_dpms`, see [Idle](/wiki/config/events#idle).

### Bit depth, VRR, HDR

```cpp
c.monitor("DP-1", "3840x2160@144", "0x0", 1.0, {.bitdepth = 10, .cm = "hdr", .vrr = 1});

// reserve a strip at the top for a bar that does not use layer-shell exclusive zones
c.monitor("DP-2", "preferred", "auto", 1.0, {.reserved = Gap(30, 0, 0, 0)});
```

### MonitorOpts

All fields are optional. Designated initializers must follow this order.

| Field | Type | Meaning |
|---|---|---|
| `.mirror` | string | name of the monitor to mirror |
| `.transform` | int | `0` to `7`, see above |
| `.bitdepth` | int | `8` or `10` |
| `.cm` | string | color management preset: `auto`, `srgb`, `wide`, `edid`, `hdr`, `hdredid`, `dcip3`, `dp3`, `adobe` |
| `.vrr` | int | variable refresh rate mode, `-1` leaves it unset (falls back to `c.misc.vrr`) |
| `.reserved` | Gap | reserved area `top, right, bottom, left` in pixels |
| `.icc` | string | path of an ICC profile |
| `.sdrEotf` | string | transfer function used for SDR content |
| `.sdrBrightness` | double | SDR brightness multiplier in HDR mode |
| `.sdrSaturation` | double | SDR saturation multiplier in HDR mode |
| `.supportsWideColor` | int | override the wide-color capability of the monitor |
| `.supportsHdr` | int | override the HDR capability of the monitor |
| `.sdrMinLuminance` | double | SDR minimum luminance in nits |
| `.sdrMaxLuminance` | int | SDR maximum luminance in nits |
| `.minLuminance` | double | minimum luminance in nits |
| `.maxLuminance` | int | peak luminance in nits |
| `.maxAvgLuminance` | int | maximum average luminance in nits |

::: tip
The HDR related options are only useful on monitors and drivers that support them. Check `abyssctl monitors` and the `c.render` and `c.quirks` options in [Options](/wiki/config/options#c-render).
:::

## Workspaces

`c.workspaceRule(workspace, rule)` attaches settings to a workspace. The workspace is written as a selector: a number (`"3"`), a name (`"name:web"`) or a special workspace (`"special:scratch"`).

```cpp
RuleHandle workspaceRule(std::string workspace, const WorkspaceRule& rule);
```

```cpp
// workspaces 1 to 9 on the main monitor, 10 on the second one
for (int i = 1; i <= 9; ++i)
    c.workspaceRule(std::to_string(i), {.monitor = "DP-1"});
c.workspaceRule("10", {.monitor = "DP-2", .isDefault = true, .persistent = true});

// a named workspace with its own look
c.workspaceRule("name:web", {.monitor = "DP-1", .gapsIn = 0, .gapsOut = 0, .borderSize = 0});

// a workspace that starts a program the first time it is opened empty
c.workspaceRule("name:term", {.onCreatedEmpty = "kitty"});

// per-workspace layout and layout options
c.workspaceRule("4", {.layout = "master", .layoutOpts = {{"orientation", "right"}}});
c.workspaceRule("5", {.layout = "scrolling", .layoutOpts = {{"direction", "right"}}});
```

### WorkspaceRule

All fields are optional. Designated initializers must follow this order.

| Field | Type | Meaning |
|---|---|---|
| `.monitor` | string | monitor the workspace lives on |
| `.isDefault` | bool | the workspace shown first on its monitor |
| `.persistent` | bool | keep the workspace alive when it is empty |
| `.gapsIn` | Gap | gaps between windows on this workspace |
| `.gapsOut` | Gap | gaps to the monitor edges on this workspace |
| `.floatGaps` | Gap | gaps for floating windows |
| `.borderSize` | int | border size |
| `.noBorder` | bool | no borders |
| `.noRounding` | bool | no rounded corners |
| `.decorate` | bool | draw decorations |
| `.noShadow` | bool | no shadows |
| `.onCreatedEmpty` | string | command to run when the workspace is created empty |
| `.defaultName` | string | name given to the workspace |
| `.layout` | string | tiling layout of the workspace: `dwindle`, `master`, `scrolling`, `monocle` or a [custom layout](/wiki/config/layouts) |
| `.animation` | string | animation style, see [Animations](/wiki/config/animations#styles) |
| `.layoutOpts` | map | layout options as name and value text. The layouts read `"orientation"` (master) and `"direction"` (scrolling) |
| `.enabled` | bool | `false` registers the rule disabled, default `true` |

An enabled rule for the same workspace string is merged into instead of adding a new one, so a disabled rule is only created when none is enabled yet. The returned `RuleHandle` switches the rule later, see [Handles](/wiki/config/rules#handles).

::: details Switch a workspace between layouts at runtime
```cpp
c.bind(SUPER, "F1", setLayout("master"));    // every workspace without a layout in a workspace rule
c.bind(SUPER, "F2", setLayout("dwindle"));
```
`setLayout` changes the layout of all workspaces that have no layout of their own in a workspace rule, see [Layouts](/wiki/config/layouts).
:::

## Reading monitors and workspaces

The query functions give you the current state, for example in a bind or an event handler:

```cpp
c.on(Event::MonitorAdded, [](PHLMONITOR m) {
    notify("new monitor: " + monitorName(m));
});
c.bind(SUPER, "M", [] {
    for (auto& m : monitors())
        notify(monitorName(m) + ": " + std::to_string(monitorSize(m).width) + "x" + std::to_string(monitorSize(m).height));
    return ok();
});
```

See [Queries](/wiki/config/queries) for the full list.
