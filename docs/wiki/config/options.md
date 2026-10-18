# Options

Options are typed fields grouped like the sections of the compositor (`general`, `decoration`, `input`, ...). A field is addressed by its section and name: the option `general:gaps_in` is the field `c.general.gaps_in`. Nested sections become nested structs: `decoration:blur:size` is `c.decoration.blur.size`, `general:col.active_border` is `c.general.col.active_border`.

```cpp
c.general.gaps_in     = 5;
c.general.border_size = 2;
c.general.col.active_border = gradient({rgba(0x4a7bd8, 0xee), rgba(0x1b2f6e, 0xee)}, 45);
c.decoration.blur.enabled   = true;
c.input.kb_layout = "us";
```

This page lists every field with its type, default and allowed range. The values come from the option table that the compositor itself uses, so the defaults are the real ones. A field you do not assign keeps its default.

::: tip
A misspelled field is a compile error, a value outside its range is reported when the config loads (error overlay and `abyssctl configerrors`). The header with the option structs, `abyss/Options.hpp`, is generated at build time from the option table. You will find it in the build directory (`generated/abyss/Options.hpp`), not next to the other headers in `include/abyss`.
:::

## Value types

Every field is an `Opt<T>` that remembers whether it was assigned. Assign a plain value, the table below shows what each type accepts.

| Type in the tables | C++ type | How to write it |
|---|---|---|
| bool | `bool` | `true` or `false` |
| int | `int64_t` | any integer, `c.general.border_size = 2;` |
| int or name | `IntChoice` | an integer or a name from the "Range / values" column: `c.input.follow_mouse = 1;` or `c.general.resize_corner = "top_left";` |
| float | `double` | any number, `c.decoration.active_opacity = 0.9;` |
| string | `std::string` | text: `c.input.kb_layout = "de";` |
| color | `Color` | `rgb(0xRRGGBB)`, `rgb(r, g, b)`, `rgba(0xRRGGBB, alpha)` or `argb(0xAARRGGBB)` |
| gradient | `Gradient` | one color, or `gradient({colors...}, angleDeg)` with up to 10 colors |
| Vec2 | `Vec2` | `Vec2{x, y}` |
| Gap | `Gap` | CSS style: `5`, `Gap(vertical, horizontal)` or `Gap(top, right, bottom, left)` |
| font weight | `FontWeight` | `700` or `"bold"` |

Color helpers:

| Helper | Meaning |
|---|---|
| `rgb(0xRRGGBB)` | opaque color |
| `rgb(r, g, b)` | opaque color from three bytes |
| `rgba(0xRRGGBB, 0xAA)` | alpha as an integer `0..255` |
| `rgba(0xRRGGBB, 0.5)` | alpha as a number `0.0..1.0` |
| `argb(0xAARRGGBB)` | everything in one number |
| `gradient({c1, c2, ...}, angleDeg)` | gradient of up to 10 colors and an angle in degrees |

```cpp
c.general.col.active_border   = gradient({rgb(0x80b0d8), rgb(0xc8a25a)}, 45);
c.general.col.inactive_border = rgba(0x182234, 0xaa);
c.general.gaps_out            = Gap(10, 20);         // top and bottom 10, left and right 20
c.group.groupbar.font_weight_active = "bold";
```

A type mismatch is a compile error. The native setters for integer, boolean and float options reject non-finite numbers and numeric conversions outside the destination type's range. A rejected assignment keeps the previous value and its existing user-set state.

### Setting an option by its string name

The same checks are available by name, which is handy in loops and callbacks:

```cpp
c.set("general:gaps_in", 5);
c.set("general:col.active_border", gradient({rgb(0x80b0d8), rgb(0xc8a25a)}, 45));
c.bind(SUPER, "G", [] { set("general:gaps_in", 0); return ok(); });
```

`set(name, value)` returns `false` (and shows a notification) for an unknown option or a bad value. Reading is covered in [Queries](/wiki/config/queries#reading-and-setting-options).

## Groups at a glance

| Group | Fields | What it controls |
|---|---|---|
| [`c.general`](#c-general) | 23 | Gaps, borders, layout choice, resizing, snapping |
| [`c.decoration`](#c-decoration) | 43 | Rounding, opacity, shadow, glow, blur, dimming |
| [`c.animations`](#c-animations) | 2 | Master switch for animations |
| [`c.input`](#c-input) | 60 | Keyboard, pointer, touchpad, touch, tablet |
| [`c.gestures`](#c-gestures) | 14 | Workspace swipe and gesture tuning |
| [`c.group`](#c-group) | 47 | Window groups (tabs) and the groupbar |
| [`c.misc`](#c-misc) | 40 | Splash, wallpaper, DPMS wake-up, swallowing, dialogs |
| [`c.binds`](#c-binds) | 14 | Behavior of binds and workspace switching |
| [`c.xwayland`](#c-xwayland) | 4 | XWayland |
| [`c.opengl`](#c-opengl) | 1 | OpenGL workarounds |
| [`c.render`](#c-render) | 17 | Renderer, color management, HDR |
| [`c.cursor`](#c-cursor) | 24 | Cursor theme, size, warping, hiding |
| [`c.ecosystem`](#c-ecosystem) | 3 | Update news, donation reminder, permissions |
| [`c.debug`](#c-debug) | 22 | Debug overlay and logging |
| [`c.layout`](#c-layout) | 2 | Aspect ratio of a single window |
| [`c.dwindle`](#c-dwindle) | 11 | Dwindle layout |
| [`c.master`](#c-master) | 14 | Master layout |
| [`c.scrolling`](#c-scrolling) | 9 | Scrolling layout |
| [`c.experimental`](#c-experimental) | 1 | Experimental switches |
| [`c.input_capture`](#c-input-capture) | 2 | Input capture portal |
| [`c.quirks`](#c-quirks) | 2 | Driver and HDR quirks |

## c.general

Window gaps, border size and colors, the active layout, border resizing and floating-window snapping.

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.general.border_size` | int | `1` | 0 to 20 | Size of the border around windows |
| `c.general.gaps_in` | Gap | `5` |  | Gaps between windows |
| `c.general.gaps_out` | Gap | `20` |  | Gaps between windows and monitor edges |
| `c.general.float_gaps` | Gap | `0` |  | Gaps between windows and monitor edges for floating windows |
| `c.general.gaps_workspaces` | int | `0` | 0 to 100 | Gaps between workspaces. Stacks with gaps_out. |
| `c.general.layout` | string | `"dwindle"` |  | Which layout to use: `dwindle`, `master`, `scrolling`, `monocle` or the name of a layout added with `c.addLayout` |
| `c.general.no_focus_fallback` | bool | `false` |  | If true, will not fall back to the next available window when moving focus in a direction where no window was found |
| `c.general.resize_on_border` | bool | `false` |  | Enables resizing windows by clicking and dragging on borders and gaps |
| `c.general.extend_border_grab_area` | int | `15` | 0 to 100 | Extends the area around the border where you can click and drag on, only used when `c.general.resize_on_border` is on. |
| `c.general.hover_icon_on_border` | bool | `true` |  | Show a cursor icon when hovering over borders, only used when `c.general.resize_on_border` is on. |
| `c.general.allow_tearing` | bool | `false` |  | Master switch for allowing tearing to occur. |
| `c.general.resize_corner` | int or name | `0` | 0 to 4; `disable` = 0, `top_left` = 1, `top_right` = 2, `bottom_right` = 3, `bottom_left` = 4 | Force floating windows to use a specific corner when being resized (1-4 going clockwise from top left, 0 to disable) |
| `c.general.modal_parent_blocking` | bool | `true` |  | If true, parent windows of modals will not be interactive. |
| `c.general.locale` | string | `""` |  | Overrides the system locale |

### `c.general.col`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.general.col.inactive_border` | gradient | `0xff1a2338` |  | Border color for inactive windows |
| `c.general.col.active_border` | gradient | `0xff3d6dcc` |  | Border color for the active window |
| `c.general.col.nogroup_border` | gradient | `0xff5a4f9e` |  | Inactive border color for window that cannot be added to a group |
| `c.general.col.nogroup_border_active` | gradient | `0xff8a7cf0` |  | Active border color for window that cannot be added to a group |

### `c.general.snap`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.general.snap.enabled` | bool | `false` |  | Enable snapping for floating windows |
| `c.general.snap.window_gap` | int | `10` | 0 to 100 | Minimum gap in pixels between windows before snapping |
| `c.general.snap.monitor_gap` | int | `10` | 0 to 100 | Minimum gap in pixels between window and monitor edges before snapping |
| `c.general.snap.border_overlap` | bool | `false` |  | If true, windows snap such that only one border's worth of space is between them |
| `c.general.snap.respect_gaps` | bool | `false` |  | If true, snapping will respect gaps between windows |

```cpp
c.general.gaps_in       = 5;
c.general.gaps_out      = Gap(10, 20);                      // vertical, horizontal
c.general.border_size   = 2;
c.general.col.active_border   = gradient({rgb(0x80b0d8), rgb(0xc8a25a)}, 45);
c.general.col.inactive_border = rgb(0x182234);
c.general.layout        = "dwindle";
c.general.resize_on_border = true;
c.general.resize_corner    = "bottom_right";                // an IntChoice: number or name
c.general.snap.enabled     = true;
```

## c.decoration

How windows are drawn: rounded corners, opacity, drop shadow, inner glow, background blur, motion blur and dimming. Sub-structs are `shadow`, `glow`, `blur` and `motion_blur`.

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.decoration.rounding` | int | `0` | 0 to 20 | Rounded corners' radius (in layout px) |
| `c.decoration.rounding_power` | float | `2` | 2 to 10 | Rounding power of corners (2 is a circle) |
| `c.decoration.active_opacity` | float | `1` | 0 to 1 | Opacity of active windows. |
| `c.decoration.inactive_opacity` | float | `1` | 0 to 1 | Opacity of inactive windows. |
| `c.decoration.fullscreen_opacity` | float | `1` | 0 to 1 | Opacity of fullscreen windows. |
| `c.decoration.dim_modal` | bool | `true` |  | Enables dimming of parents of modal windows |
| `c.decoration.dim_inactive` | bool | `false` |  | Enables dimming of inactive windows |
| `c.decoration.dim_strength` | float | `0.5` | 0 to 1 | How much inactive windows should be dimmed |
| `c.decoration.dim_special` | float | `0.2` | 0 to 1 | How much to dim the rest of the screen by when a special workspace is open. |
| `c.decoration.dim_around` | float | `0.4` | 0 to 1 | How much the dimaround window rule should dim by. |
| `c.decoration.screen_shader` | string | `""` |  | A path to a custom shader to be applied at the end of rendering. |
| `c.decoration.border_part_of_window` | bool | `true` |  | Whether the border should be treated as a part of the window. |

### `c.decoration.shadow`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.decoration.shadow.enabled` | bool | `true` |  | Enable drop shadows on windows |
| `c.decoration.shadow.range` | int | `4` | 0 to 100 | Shadow range (size) in layout px |
| `c.decoration.shadow.render_power` | int | `3` | 1 to 4 | In what power to render the falloff (more power, the faster the falloff) |
| `c.decoration.shadow.sharp` | bool | `false` |  | Whether the shadow should be sharp or not. |
| `c.decoration.shadow.color` | gradient | `0xee03060f` |  | Shadow's color. Alpha dictates shadow's opacity. |
| `c.decoration.shadow.color_inactive` | gradient | unset (falls back) |  | Inactive shadow color. (if not set, will fall back to col.shadow) |
| `c.decoration.shadow.offset` | Vec2 | `{0, 0}` | x -250 to 250, y -250 to 250 | Shadow's rendering offset. |
| `c.decoration.shadow.scale` | float | `1` | 0 to 1 | Shadow's scale. |

### `c.decoration.glow`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.decoration.glow.enabled` | bool | `false` |  | Enable inner glow on windows |
| `c.decoration.glow.range` | int | `10` | 0 to 100 | Glow range (size) in layout px |
| `c.decoration.glow.render_power` | int | `3` | 1 to 4 | In what power to render the falloff (more power, the faster the falloff) |
| `c.decoration.glow.color` | gradient | `0xee2f5fbf` |  | Glow's color. Alpha dictates glow's opacity. |
| `c.decoration.glow.color_inactive` | gradient | unset (falls back) |  | Inactive glow color. (if not set, will fall back to `c.decoration.glow.color`) |

### `c.decoration.blur`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.decoration.blur.enabled` | bool | `true` |  | Enable kawase window background blur |
| `c.decoration.blur.size` | int | `8` | 0 to 100 | Blur size (distance) |
| `c.decoration.blur.passes` | int | `1` | 0 to 10 | The amount of passes to perform |
| `c.decoration.blur.ignore_opacity` | bool | `true` |  | Make the blur layer ignore the opacity of the window |
| `c.decoration.blur.new_optimizations` | bool | `true` |  | Whether to enable further optimizations to the blur. |
| `c.decoration.blur.xray` | bool | `false` |  | If enabled, floating windows will ignore tiled windows in their blur. |
| `c.decoration.blur.noise` | float | `0.0117` | 0 to 1 | How much noise to apply. |
| `c.decoration.blur.contrast` | float | `0.8916` | 0 to 2 | Contrast modulation for blur. |
| `c.decoration.blur.brightness` | float | `1` | 0 to 2 | Brightness modulation for blur. |
| `c.decoration.blur.vibrancy` | float | `0.1696` | 0 to 1 | Increase saturation of blurred colors. |
| `c.decoration.blur.vibrancy_darkness` | float | `0` | 0 to 1 | How strong the effect of vibrancy is on dark areas. |
| `c.decoration.blur.special` | bool | `false` |  | Whether to blur behind the special workspace (note: expensive) |
| `c.decoration.blur.popups` | bool | `false` |  | Whether to blur popups (e.g. right-click menus) |
| `c.decoration.blur.popups_ignorealpha` | float | `0.2` | 0 to 1 | Works like ignorealpha in layer rules. If pixel opacity is below set value, will not blur. |
| `c.decoration.blur.input_methods` | bool | `false` |  | Whether to blur input methods (e.g. fcitx5) |
| `c.decoration.blur.input_methods_ignorealpha` | float | `0.2` | 0 to 1 | Works like ignorealpha in layer rules. If pixel opacity is below set value, will not blur. |

### `c.decoration.motion_blur`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.decoration.motion_blur.enabled` | bool | `false` |  | Enable motion blur for moving and resizing windows |
| `c.decoration.motion_blur.samples` | int | `7` | 1 to 64 | Amount of samples used for motion blur |

```cpp
c.decoration.rounding         = 6;
c.decoration.active_opacity   = 1.0;
c.decoration.inactive_opacity = 0.9;
c.decoration.shadow.enabled   = true;
c.decoration.shadow.range     = 16;
c.decoration.shadow.color     = rgba(0x020410, 0.9);
c.decoration.blur.enabled     = true;
c.decoration.blur.size        = 6;
c.decoration.blur.passes      = 2;
c.decoration.dim_inactive     = true;
c.decoration.dim_strength     = 0.2;
```

## c.animations

Only the global switches live here. Curves and the animation leaves are set with functions, see [Animations](/wiki/config/animations).

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.animations.enabled` | bool | `true` |  | Enable animations |
| `c.animations.workspace_wraparound` | bool | `false` |  | Changes the direction of slide animations between the first and last workspaces |

```cpp
c.animations.enabled = true;
c.animations.workspace_wraparound = false;
```

## c.input

Keyboard layout and repeat, pointer sensitivity and scrolling, focus-follows-mouse, plus the sub-structs `touchpad`, `touchdevice`, `virtualkeyboard`, `tablet` and `tablettool`. Per-device overrides use [`c.device`](#per-device-settings-c-device).

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.input.kb_model` | string | `""` |  | Appropriate XKB keymap parameter. |
| `c.input.kb_layout` | string | `"us"` |  | Appropriate XKB keymap parameter |
| `c.input.kb_variant` | string | `""` |  | Appropriate XKB keymap parameter |
| `c.input.kb_options` | string | `""` |  | Appropriate XKB keymap parameter |
| `c.input.kb_rules` | string | `""` |  | Appropriate XKB keymap parameter |
| `c.input.kb_file` | string | `""` |  | Appropriate XKB keymap file |
| `c.input.numlock_by_default` | bool | `false` |  | Engage numlock by default. |
| `c.input.resolve_binds_by_sym` | bool | `false` |  | Determines how keybinds act when multiple layouts are used. |
| `c.input.repeat_rate` | int | `25` | 0 to 200 | The repeat rate for held-down keys, in repeats per second. |
| `c.input.repeat_delay` | int | `600` | 0 to 2000 | Delay before a held-down key is repeated, in milliseconds. |
| `c.input.sensitivity` | float | `0` | -1 to 1 | Sets the mouse input sensitivity. Value is clamped to the range -1.0 to 1.0. |
| `c.input.accel_profile` | string | `""` | `adaptive`, `flat`, `custom` | Sets the cursor acceleration profile. [adaptive/flat/custom] |
| `c.input.force_no_accel` | bool | `false` |  | Force no cursor acceleration. |
| `c.input.rotation` | int | `0` | 0 to 359 | Sets the rotation of a device in degrees clockwise. Value is clamped to the range 0 to 359. |
| `c.input.left_handed` | bool | `false` |  | Switches RMB and LMB |
| `c.input.scroll_points` | string | `""` |  | Sets the scroll acceleration profile, when accel_profile is set to custom. |
| `c.input.scroll_method` | string | `""` | `2fg`, `edge`, `on_button_down`, `no_scroll` | Sets the scroll method. [2fg/edge/on_button_down/no_scroll] |
| `c.input.scroll_button` | int | `0` | 0 to 300 | Sets the scroll button. 0 means default. |
| `c.input.scroll_button_lock` | bool | `false` |  | If the scroll button lock is enabled, the button does not need to be held down. |
| `c.input.scroll_factor` | float | `1` | 0 to 2 | Multiplier added to scroll movement for external mice. |
| `c.input.natural_scroll` | bool | `false` |  | Inverts scrolling direction. |
| `c.input.follow_mouse` | int or name | `1` | 0 to 3; `disabled` = 0, `follow` = 1, `detached` = 2, `separate` = 3 | Specify if and how cursor movement should affect window focus. |
| `c.input.follow_mouse_threshold` | float | `0` |  | The smallest distance in logical pixels the mouse needs to travel for the window under it to get focused. |
| `c.input.focus_on_close` | int or name | `0` | 0 to 2; `next` = 0, `cursor` = 1, `mru` = 2 | Controls the window focus behavior when a window is closed. |
| `c.input.mouse_refocus` | bool | `true` |  | If disabled, mouse focus won't switch to the hovered window unless the mouse crosses a window boundary when follow_mouse=1. |
| `c.input.float_switch_override_focus` | int | `1` | 0 to 2 | If enabled (1 or 2), focus will change to the window under the cursor when changing from tiled-to-floating and vice versa. If 2, focus will also follow mouse on float-to-float switches. |
| `c.input.special_fallthrough` | bool | `false` |  | If enabled, having only floating windows in the special workspace will not block focusing windows in the regular workspace. |
| `c.input.off_window_axis_events` | int or name | `1` | 0 to 3; `ignore` = 0, `send` = 1, `clamp` = 2, `warp` = 3 | How to handle axis events around a focused window. |
| `c.input.emulate_discrete_scroll` | int or name | `1` | 0 to 2; `disable` = 0, `non_standard` = 1, `force_all` = 2 | Emulates discrete scrolling from high resolution scrolling events. |
| `c.input.follow_mouse_shrink` | int | `0` | 0 to 300 | Shrinks the inactive window hitboxes used for focus detection by the specified number of pixels. This creates a dead zone in gaps between windows where moving the cursor will not change focus. Works only with follow_mouse = 1. |

### `c.input.touchpad`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.input.touchpad.disable_while_typing` | bool | `true` |  | Disable the touchpad while typing. |
| `c.input.touchpad.natural_scroll` | bool | `false` |  | Inverts scrolling direction. |
| `c.input.touchpad.scroll_factor` | float | `1` | 0 to 2 | Multiplier applied to the amount of scroll movement. |
| `c.input.touchpad.middle_button_emulation` | bool | `false` |  | Sending LMB and RMB simultaneously will be interpreted as a middle click. |
| `c.input.touchpad.tap_button_map` | string | `""` | `lrm`, `lmr` | Sets the tap button mapping for touchpad button emulation. [lrm/lmr] |
| `c.input.touchpad.clickfinger_behavior` | bool | `false` |  | Button presses with 1, 2, or 3 fingers will be mapped to LMB, RMB, and MMB respectively. |
| `c.input.touchpad.tap_to_click` | bool | `true` |  | Tapping on the touchpad with 1, 2, or 3 fingers will send LMB, RMB, and MMB respectively. |
| `c.input.touchpad.drag_lock` | int | `0` | 0 to 2 | When enabled, lifting the finger off while dragging will not drop the dragged item. |
| `c.input.touchpad.tap_and_drag` | bool | `true` |  | Sets the tap and drag mode for the touchpad |
| `c.input.touchpad.flip_x` | bool | `false` |  | Inverts the horizontal movement of the touchpad |
| `c.input.touchpad.flip_y` | bool | `false` |  | Inverts the vertical movement of the touchpad |
| `c.input.touchpad.drag_3fg` | int or name | `0` | 0 to 2; `disable` = 0, `3_finger` = 1, `4_finger` = 2 | Whether to use 3 or 4 finger drag. |

### `c.input.touchdevice`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.input.touchdevice.transform` | int | `0` | 0 to 6 | Transform the input from touchdevices. |
| `c.input.touchdevice.output` | string | `"[[Auto]]"` (automatic) |  | The monitor to bind touch devices. |
| `c.input.touchdevice.enabled` | bool | `true` |  | Whether input is enabled for touch devices. |

### `c.input.virtualkeyboard`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.input.virtualkeyboard.share_states` | int or name | `2` | 0 to 2; `disable` = 0, `enable` = 1, `only_non_ime` = 2 | Unify key down states and modifier states with other keyboards. |
| `c.input.virtualkeyboard.release_pressed_on_close` | bool | `false` |  | Release all pressed keys by virtual keyboard on close. |

### `c.input.tablet`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.input.tablet.transform` | int | `0` | 0 to 6 | Transform the input from tablets. |
| `c.input.tablet.output` | string | `""` |  | The monitor to bind tablets. |
| `c.input.tablet.region_position` | Vec2 | `{0, 0}` | x -20000 to 20000, y -20000 to 20000 | Position of the mapped region in monitor layout. |
| `c.input.tablet.absolute_region_position` | bool | `false` |  | Whether to treat the region_position as an absolute position in monitor layout. |
| `c.input.tablet.region_size` | Vec2 | `{0, 0}` | x -100 to 4000, y -100 to 4000 | Size of the mapped region. |
| `c.input.tablet.relative_input` | bool | `false` |  | Whether the input should be relative |
| `c.input.tablet.left_handed` | bool | `false` |  | If enabled, the tablet will be rotated 180 degrees |
| `c.input.tablet.active_area_size` | Vec2 | `{0, 0}` | x 0 to 500, y 0 to 500 | Size of tablet's active area in mm |
| `c.input.tablet.active_area_position` | Vec2 | `{0, 0}` | x 0 to 500, y 0 to 500 | Position of the active area in mm |

### `c.input.tablettool`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.input.tablettool.eraser_button_mode` | int | `0` | 0 to 6 | Change the eraser button behavior on the tool. When set to 0, use the default hardware behavior of the tool. When set to 1, the eraser button on the tool sends a button event instead. |
| `c.input.tablettool.eraser_button_override` | int | `0` |  | Set a button to be button event when eraser_button_mode is set to 1. Has to be an int, cannot be a string. Must be a valid button (e.g. BTN_STYLUS) excluding fake buttons (e.g. BTN_TOOL_*) and keys (KEY_*). Check wev if you have any doubts regarding the ID. 0 means default. |
| `c.input.tablettool.pressure_range_min` | float | `-1.0` | -1.0 to 1.0 | Set the minimum pressure range for the tool, a negative number will set the default minimum pressure value. This is usually 0.0 |
| `c.input.tablettool.pressure_range_max` | float | `-1.0` | -1.0 to 1.0 | Set the maximum pressure range for the tool, a negative number will set the default maximum pressure value. This is usually 1.0 |

```cpp
c.input.kb_layout    = "us";
c.input.kb_options   = "caps:escape";
c.input.repeat_rate  = 40;
c.input.repeat_delay = 300;
c.input.follow_mouse = 1;                        // 0 = off, 1 = focus follows the mouse
c.input.sensitivity  = -0.2;
c.input.accel_profile = "flat";
c.input.touchpad.natural_scroll = true;
c.input.touchpad.tap_to_click   = true;
c.input.touchpad.disable_while_typing = true;
c.input.touchdevice.output = "eDP-1";            // bind a touchscreen to a monitor
c.input.tablet.output      = "DP-1";
```

## c.gestures

Tuning of the workspace swipe gesture. The gestures themselves are registered with `c.gesture`, see [Keybinds](/wiki/config/keybinds#gestures).

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.gestures.workspace_swipe_distance` | int | `300` | 0 to 2000 | In px, the distance of the touchpad gesture |
| `c.gestures.workspace_swipe_touch` | bool | `false` |  | Enable workspace swiping from the edge of a touchscreen |
| `c.gestures.workspace_swipe_invert` | bool | `true` |  | Invert the direction (touchpad only) |
| `c.gestures.workspace_swipe_touch_invert` | bool | `false` |  | Invert the direction (touchscreen only) |
| `c.gestures.workspace_swipe_min_speed_to_force` | int | `30` | 0 to 200 | Minimum speed in px per timepoint to force the change ignoring cancel_ratio. |
| `c.gestures.workspace_swipe_cancel_ratio` | float | `0.5` | 0 to 1 | How much the swipe has to proceed in order to commence it. |
| `c.gestures.workspace_swipe_create_new` | bool | `true` |  | Whether a swipe right on the last workspace should create a new one. |
| `c.gestures.workspace_swipe_direction_lock` | bool | `true` |  | If enabled, switching direction will be locked when you swipe past the direction_lock_threshold. |
| `c.gestures.workspace_swipe_direction_lock_threshold` | int | `10` | 0 to 200 | In px, the distance to swipe before direction lock activates. |
| `c.gestures.workspace_swipe_forever` | bool | `false` |  | If enabled, swiping will not clamp at the neighboring workspaces but continue to the further ones. |
| `c.gestures.workspace_swipe_use_r` | bool | `false` |  | If enabled, swiping will use the r prefix instead of the m prefix for finding workspaces. |
| `c.gestures.close_max_timeout` | int | `1000` | 10 to 2000 | Timeout for closing windows with the close gesture, in ms. |

### `c.gestures.scrolling`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.gestures.scrolling.move_snap_to_grid` | bool | `true` |  | When releasing the scroll move gesture, whether it shoud try to snap to the grid. |
| `c.gestures.scrolling.move_snap_cursor` | bool | `true` |  | When releasing the scroll move gesture, whether it shoud snap the cursor to the newly focused window. |

```cpp
c.gestures.workspace_swipe_distance = 300;
c.gestures.workspace_swipe_cancel_ratio = 0.2;
c.gestures.workspace_swipe_create_new = true;
```

## c.group

Tabbed window groups: behavior, border colors and the groupbar (`group.groupbar`, with its own `col`).

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.group.insert_after_current` | bool | `true` |  | Whether new windows in a group spawn after current or at group tail |
| `c.group.focus_removed_window` | bool | `true` |  | Whether Abyssland should focus on the window that has just been moved out of the group |
| `c.group.merge_groups_on_drag` | bool | `true` |  | Whether window groups can be dragged into other groups |
| `c.group.merge_groups_on_groupbar` | bool | `true` |  | Whether one group will be merged with another when dragged into its groupbar |
| `c.group.auto_group` | bool | `true` |  | Automatically group new windows |
| `c.group.drag_into_group` | int or name | `1` | 0 to 2; `disabled` = 0, `enabled` = 1, `only when dragging into the groupbar` = 2 | Whether dragging a window into a unlocked group will merge them. |
| `c.group.merge_floated_into_tiled_on_groupbar` | bool | `false` |  | Whether dragging a floating window into a tiled window groupbar will merge them |
| `c.group.group_on_movetoworkspace` | bool | `false` |  | Whether using movetoworkspace[silent] will merge the window into the workspace's solitary unlocked group |

### `c.group.col`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.group.col.border_active` | gradient | `0x663d6dcc` |  | Active group border color |
| `c.group.col.border_inactive` | gradient | `0x661a2338` |  | Inactive group border color |
| `c.group.col.border_locked_inactive` | gradient | `0x666a5fd0` |  | Inactive locked group border color |
| `c.group.col.border_locked_active` | gradient | `0x66403a80` |  | Active locked group border color |

### `c.group.groupbar`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.group.groupbar.enabled` | bool | `true` |  | Enables groupbars |
| `c.group.groupbar.disable_when_only` | bool | `false` |  | Disable if contains single window. Considered only if enabled == true |
| `c.group.groupbar.font_family` | string | `""` |  | Font used to display groupbar titles |
| `c.group.groupbar.font_weight_active` | font weight | unset |  | Weight of the font used to display active groupbar titles |
| `c.group.groupbar.font_weight_inactive` | font weight | unset |  | Weight of the font used to display inactive groupbar titles |
| `c.group.groupbar.font_size` | int | `8` | 2 to 64 | Font size of groupbar title |
| `c.group.groupbar.gradients` | bool | `false` |  | Enables gradients |
| `c.group.groupbar.height` | int | `14` | 1 to 64 | Height of the groupbar |
| `c.group.groupbar.indicator_gap` | int | `0` | 0 to 64 | Height of the gap between the groupbar indicator and title |
| `c.group.groupbar.indicator_height` | int | `3` | 1 to 64 | Height of the groupbar indicator |
| `c.group.groupbar.stacked` | bool | `false` |  | Render the groupbar as a vertical stack |
| `c.group.groupbar.priority` | int | `3` | 0 to 6 | Sets the decoration priority for groupbars |
| `c.group.groupbar.render_titles` | bool | `true` |  | Whether to render titles in the group bar decoration |
| `c.group.groupbar.scrolling` | bool | `true` |  | Whether scrolling in the groupbar changes group active window |
| `c.group.groupbar.middle_click_close` | bool | `true` |  | Whether middle clicking the groupbar closes the clicked window |
| `c.group.groupbar.rounding` | int | `1` | 0 to 20 | How much to round the groupbar |
| `c.group.groupbar.rounding_power` | float | `2` | 2 to 10 | Rounding power of groupbar corners (2 is a circle) |
| `c.group.groupbar.gradient_rounding` | int | `2` | 0 to 20 | How much to round the groupbar gradient |
| `c.group.groupbar.gradient_rounding_power` | float | `2` | 2 to 10 | Rounding power of groupbar gradient corners (2 is a circle) |
| `c.group.groupbar.round_only_edges` | bool | `true` |  | If yes, will only round at the groupbar edges |
| `c.group.groupbar.gradient_round_only_edges` | bool | `true` |  | If yes, will only round at the groupbar gradient edges |
| `c.group.groupbar.text_color` | color | `0xffffffff` |  | Color for window titles in the groupbar |
| `c.group.groupbar.text_color_inactive` | color | unset (falls back) |  | Color for inactive windows' titles in the groupbar |
| `c.group.groupbar.text_color_locked_active` | color | unset (falls back) |  | Color for the active window's title in a locked group |
| `c.group.groupbar.text_color_locked_inactive` | color | unset (falls back) |  | Color for inactive windows' titles in locked groups |
| `c.group.groupbar.gaps_out` | int | `2` | 0 to 20 | Gap between gradients and window |
| `c.group.groupbar.gaps_in` | int | `2` | 0 to 20 | Gap between gradients |
| `c.group.groupbar.keep_upper_gap` | bool | `true` |  | Keep an upper gap above gradient |
| `c.group.groupbar.text_offset` | int | `0` | -20 to 20 | Set an offset for a text |
| `c.group.groupbar.text_padding` | int | `0` | 0 to 22 | Set horizontal padding for a text |
| `c.group.groupbar.blur` | bool | `false` |  | Enable background blur for groupbars |

### `c.group.groupbar.col`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.group.groupbar.col.active` | gradient | `0x663d6dcc` |  | Active group border color |
| `c.group.groupbar.col.inactive` | gradient | `0x661a2338` |  | Inactive (out of focus) group border color |
| `c.group.groupbar.col.locked_active` | gradient | `0x666a5fd0` |  | Active locked group border color |
| `c.group.groupbar.col.locked_inactive` | gradient | `0x66403a80` |  | Inactive locked group border color |

```cpp
c.group.auto_group = true;
c.group.groupbar.enabled     = true;
c.group.groupbar.font_size   = 10;
c.group.groupbar.height      = 18;
c.group.groupbar.col.active   = rgb(0x80b0d8);
c.group.groupbar.col.inactive = rgb(0x182234);
c.group.groupbar.text_color   = rgb(0xffffff);
```

## c.misc

Everything that does not fit elsewhere: the built-in wallpaper, splash text, DPMS wake-up, window swallowing, session lock behavior and dialogs.

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.misc.disable_abyssland_logo` | bool | `false` |  | Disables the random Abyssland logo / anime girl background. :( |
| `c.misc.disable_splash_rendering` | bool | `true` |  | Disables the Abyssland splash rendering. |
| `c.misc.font_family` | string | `"Sans"` |  | Set the global default font to render the text. |
| `c.misc.splash_font_family` | string | `""` |  | Changes the font used to render the splash text. |
| `c.misc.force_default_wallpaper` | int | `-1` | -1 to 63 | Force one of the bundled default wallpapers (wall0.png, wall1.png, ...). -1 = random |
| `c.misc.vrr` | int or name | `0` | 0 to 3; `off` = 0, `on` = 1, `fullscreen` = 2, `fullscreen_game` = 3 | Controls the VRR (Adaptive Sync) of your monitors |
| `c.misc.mouse_move_enables_dpms` | bool | `false` |  | If DPMS is set to off, wake up the monitors if the mouse moves |
| `c.misc.key_press_enables_dpms` | bool | `false` |  | If DPMS is set to off, wake up the monitors if a key is pressed. |
| `c.misc.name_vk_after_proc` | bool | `true` |  | Name virtual keyboards after the processes that create them. |
| `c.misc.always_follow_on_dnd` | bool | `true` |  | Will make mouse focus follow the mouse when drag and dropping. |
| `c.misc.layers_hog_keyboard_focus` | bool | `true` |  | If true, will make keyboard-interactive layers keep their focus on mouse move. |
| `c.misc.animate_manual_resizes` | bool | `false` |  | If true, will animate manual window resizes/moves |
| `c.misc.animate_mouse_windowdragging` | bool | `false` |  | If true, will animate windows being dragged by mouse. |
| `c.misc.disable_autoreload` | bool | `false` |  | If true, the config will not reload automatically on save. |
| `c.misc.enable_swallow` | bool | `false` |  | Enable window swallowing |
| `c.misc.swallow_regex` | string | `""` |  | The class regex to be used for windows that should be swallowed. |
| `c.misc.swallow_exception_regex` | string | `""` |  | The title regex to be used for windows that should not be swallowed. |
| `c.misc.focus_on_activate` | bool | `false` |  | Whether Abyssland should focus an app that requests to be focused. |
| `c.misc.mouse_move_focuses_monitor` | bool | `true` |  | Whether mouse moving into a different monitor should focus it |
| `c.misc.allow_session_lock_restore` | bool | `false` |  | If true, will allow you to restart a lockscreen app in case it crashes. |
| `c.misc.session_lock_xray` | bool | `false` |  | Keep rendering workspaces below your lockscreen |
| `c.misc.session_lock_blur` | bool | `false` |  | Enable blur for lockscreen. You probably want to enable `session_lock_xray`. |
| `c.misc.background_color` | color | `0xff050816` |  | Change the background color. |
| `c.misc.close_special_on_empty` | bool | `true` |  | Close the special workspace if the last window is removed |
| `c.misc.on_focus_under_fullscreen` | int or name | `2` | 0 to 2; `ignore` = 0, `take_over` = 1, `exit_fullscreen` = 2 | If there is a fullscreen or maximized window, decide whether a tiled window requested to focus should replace it. |
| `c.misc.exit_window_retains_fullscreen` | bool | `false` |  | If true, closing a fullscreen window makes the next focused window fullscreen |
| `c.misc.initial_workspace_tracking` | int | `1` | 0 to 2 | If enabled, windows will open on the workspace they were invoked on. |
| `c.misc.initial_workspace_token_timeout` | int | `10` | 1 to 3600 | The time in seconds a window has to open on its invoked workspace before the tracking token expires. |
| `c.misc.middle_click_paste` | bool | `true` |  | Whether to enable middle-click-paste (aka primary selection) |
| `c.misc.render_unfocused_fps` | int | `15` | 1 to 120 | The maximum limit for renderunfocused windows' fps in the background |
| `c.misc.disable_xdg_env_checks` | bool | `false` |  | Disable the warning if XDG environment is externally managed |
| `c.misc.disable_abyssland_guiutils_check` | bool | `false` |  | Disable the warning if abyss-guiutils is missing |
| `c.misc.disable_watchdog_warning` | bool | `false` |  | Whether to disable the warning about not using start-abyssland. |
| `c.misc.lockdead_screen_delay` | int | `1000` | 0 to 5000 | The delay in ms after the lockdead screen appears. |
| `c.misc.enable_anr_dialog` | bool | `true` |  | Whether to enable the ANR (app not responding) dialog when your apps hang |
| `c.misc.anr_missed_pings` | int | `5` | 1 to 20 | Number of missed pings before showing the ANR dialog |
| `c.misc.screencopy_force_8b` | bool | `true` |  | Forces 8 bit screencopy |
| `c.misc.disable_scale_notification` | bool | `false` |  | Disables notification popup when a monitor fails to set a suitable scale |
| `c.misc.size_limits_tiled` | bool | `false` |  | Whether to apply minsize and maxsize rules to tiled windows |

### `c.misc.col`

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.misc.col.splash` | color | `0x55ffffff` |  | Changes the color of the splash text. |

```cpp
c.misc.force_default_wallpaper  = -1;      // random bundled wallpaper at start
c.misc.disable_abyssland_logo   = false;
c.misc.disable_splash_rendering = true;
c.misc.key_press_enables_dpms   = true;
c.misc.mouse_move_enables_dpms  = true;
c.misc.enable_swallow           = true;
c.misc.swallow_regex            = "^(kitty)$";
c.misc.background_color         = rgb(0x050816);
```

## c.binds

How keybinds and workspace dispatchers behave, for example back-and-forth switching and the drag threshold.

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.binds.pass_mouse_when_bound` | bool | `false` |  | If disabled, will not pass the mouse events to apps / dragging windows around if a keybind has been triggered. |
| `c.binds.scroll_event_delay` | int | `300` | 0 to 2000 | In ms, how many ms to wait after a scroll event to allow passing another one for the binds. |
| `c.binds.workspace_back_and_forth` | bool | `false` |  | If enabled, an attempt to switch to the currently focused workspace will instead switch to the previous workspace. |
| `c.binds.hide_special_on_workspace_change` | bool | `false` |  | If enabled, changing the active workspace will hide the special workspace on the monitor. |
| `c.binds.allow_workspace_cycles` | bool | `false` |  | If enabled, workspaces don't forget their previous workspace. |
| `c.binds.workspace_center_on` | int | `1` | 0 to 1 | Whether switching workspaces should center the cursor on the workspace (0) or on the last active window (1) |
| `c.binds.focus_preferred_method` | int | `0` | 0 to 1 | Sets the preferred focus finding method when using focuswindow/movewindow/etc with a direction. |
| `c.binds.ignore_group_lock` | bool | `false` |  | If enabled, dispatchers like moveintogroup, moveoutofgroup and movewindoworgroup will ignore lock per group. |
| `c.binds.movefocus_cycles_fullscreen` | bool | `false` |  | If enabled, when on a fullscreen window, movefocus will cycle fullscreen. |
| `c.binds.movefocus_cycles_groupfirst` | bool | `false` |  | If enabled, when in a grouped window, movefocus will cycle windows in the groups first. |
| `c.binds.disable_keybind_grabbing` | bool | `false` |  | If enabled, apps that request keybinds to be disabled will not be able to do so. |
| `c.binds.window_direction_monitor_fallback` | bool | `true` |  | If enabled, moving a window or focus over the edge of a monitor with a direction will move it to the next monitor. |
| `c.binds.allow_pin_fullscreen` | bool | `false` |  | Allows fullscreen to pinned windows, and restore their pinned status afterwards |
| `c.binds.drag_threshold` | int | `0` |  | Movement threshold in pixels for window dragging and c/g bind flags. 0 to disable. |

```cpp
c.binds.workspace_back_and_forth = true;   // same workspace key again = go back
c.binds.allow_workspace_cycles   = true;
c.binds.drag_threshold           = 10;
```

## c.xwayland

Behavior of the X11 compatibility layer.

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.xwayland.enabled` | bool | `true` |  | Allow running applications using X11 |
| `c.xwayland.use_nearest_neighbor` | bool | `true` |  | Uses the nearest neighbor filtering for xwayland apps, making them pixelated rather than blurry |
| `c.xwayland.force_zero_scaling` | bool | `false` |  | Forces a scale of 1 on xwayland windows on scaled displays. |
| `c.xwayland.create_abstract_socket` | bool | `false` |  | Create the abstract Unix domain socket for XWayland |

```cpp
c.xwayland.enabled = true;
c.xwayland.force_zero_scaling = true;
```

## c.opengl

Renderer workarounds.

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.opengl.nvidia_anti_flicker` | bool | `true` |  | Reduces flickering on nvidia at the cost of possible frame drops on lower-end GPUs. |

```cpp
c.opengl.nvidia_anti_flicker = true;
```

## c.render

Renderer options: direct scan-out, color management, FP16 and HDR related switches.

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.render.direct_scanout` | int or name | `0` | 0 to 2; `disable` = 0, `enable` = 1, `auto` = 2 | Enables direct scanout. |
| `c.render.expand_undersized_textures` | bool | `true` |  | Whether to expand textures that have not yet resized to be larger. |
| `c.render.xp_mode` | bool | `false` |  | Disable back buffer and bottom layer rendering. |
| `c.render.ctm_animation` | int or name | `2` | 0 to 2; `disable` = 0, `enable` = 1, `auto` = 2 | Whether to enable a fade animation for CTM changes. |
| `c.render.cm_enabled` | bool | `true` |  | Enable Color Management pipelines (requires restart to fully take effect) |
| `c.render.send_content_type` | bool | `true` |  | Report content type to allow monitor profile autoswitch |
| `c.render.cm_auto_hdr` | int or name | `1` | 0 to 2; `disable` = 0, `hdr` = 1, `hdredid` = 2 | Auto-switch to hdr mode when fullscreen app is in hdr |
| `c.render.new_render_scheduling` | bool | `false` |  | Enable new render scheduling, which should improve FPS on underpowered devices. |
| `c.render.non_shader_cm` | int or name | `3` | 0 to 3; `disable` = 0, `always` = 1, `ondemand` = 2, `ignore` = 3 | Enable CM without shader. |
| `c.render.cm_sdr_eotf` | string | `"default"` |  | Default transfer function for displaying SDR apps. |
| `c.render.commit_timing_enabled` | bool | `true` |  | Enable commit timing proto. Requires restart |
| `c.render.icc_vcgt_enabled` | bool | `true` |  | Enable sending VCGT ramps to KMS with ICC profiles |
| `c.render.use_shader_blur_blend` | bool | `false` |  | Use experimental blurred bg blending |
| `c.render.use_fp16` | int or name | `2` | 0 to 2; `disable` = 0, `enable` = 1, `auto` = 2 | Use experimental internal FP16 buffer. |
| `c.render.keep_unmodified_copy` | int or name | `2` | 0 to 2; `disable` = 0, `enable` = 1, `auto` = 2 | Keep umodified SDR frame copy for sreensharing. |
| `c.render.non_shader_cm_interop` | int or name | `2` | 0 to 2; `disable` = 0, `enable` = 1, `auto` = 2 | Non_shader_cm interaction with ctm proto (abysssunset and similar). |
| `c.render.fp16_sdr_tf` | int or name | `0` | 0 to 1; `monitor` = 0, `linear` = 1 | Internal workbuffer transfer function for fp16 in SDR mode |

```cpp
c.render.direct_scanout = 0;
c.render.cm_enabled     = true;
```

## c.cursor

Cursor theme and size (see [Environment, cursor and helpers](/wiki/config/system#cursor-theme-and-size)), hardware cursor, warping, hiding and zoom.

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.cursor.theme` | string | `""` |  | Cursor theme for native and XCursor clients; empty keeps the startup environment themes |
| `c.cursor.size` | int | `0` |  | Cursor size in logical pixels; 0 keeps the startup environment size |
| `c.cursor.invisible` | bool | `false` |  | Don't render cursors |
| `c.cursor.no_hardware_cursors` | int or name | `2` | 0 to 2; `Disabled` = 0, `Enabled` = 1, `Auto` = 2 | Disables hardware cursors. |
| `c.cursor.no_break_fs_vrr` | int or name | `2` | 0 to 2; `disable` = 0, `enable` = 1, `auto` = 2 | Disables scheduling new frames on cursor movement for fullscreen apps with VRR enabled. |
| `c.cursor.min_refresh_rate` | int | `24` | 10 to 500 | Minimum refresh rate for cursor movement when no_break_fs_vrr is active. |
| `c.cursor.hotspot_padding` | int | `0` | 0 to 20 | The padding, in logical px, between screen edges and the cursor |
| `c.cursor.inactive_timeout` | float | `0` | 0 to 20 | In seconds, after how many seconds of cursor's inactivity to hide it. Set to 0 for never. |
| `c.cursor.no_warps` | bool | `false` |  | If true, will not warp the cursor in many cases |
| `c.cursor.persistent_warps` | bool | `false` |  | When a window is refocused, the cursor returns to its last position relative to that window. |
| `c.cursor.warp_on_change_workspace` | int or name | `0` | 0 to 2; `disable` = 0, `enable` = 1, `force` = 2 | Move the cursor to the last focused window after changing the workspace. |
| `c.cursor.warp_on_toggle_special` | int or name | `0` | 0 to 2; `disable` = 0, `enable` = 1, `force` = 2 | Move the cursor to the last focused window when toggling a special workspace. |
| `c.cursor.default_monitor` | string | `""` |  | The name of a default monitor for the cursor to be set to on startup |
| `c.cursor.zoom_factor` | float | `1` | 1 to 10 | The factor to zoom by around the cursor. 1 means no zoom. |
| `c.cursor.zoom_rigid` | bool | `false` |  | Whether the zoom should follow the cursor rigidly or loosely |
| `c.cursor.zoom_disable_aa` | bool | `false` |  | If enabled, when zooming, no antialiasing will be used |
| `c.cursor.zoom_detached_camera` | bool | `true` |  | Detaches the camera from the mouse when zoomed in |
| `c.cursor.enable_abysscursor` | bool | `true` |  | Whether to enable abysscursor support |
| `c.cursor.hide_on_key_press` | bool | `false` |  | Hides the cursor when you press any key until the mouse is moved. |
| `c.cursor.hide_on_touch` | bool | `true` |  | Hides the cursor when the last input was a touch input until a mouse input is done. |
| `c.cursor.hide_on_tablet` | bool | `false` |  | Hides the cursor when the last input was a tablet input until a mouse input is done. |
| `c.cursor.use_cpu_buffer` | int or name | `2` | 0 to 2; `disable` = 0, `enable` = 1, `auto` = 2 | Makes HW cursors use a CPU buffer. |
| `c.cursor.sync_gsettings_theme` | bool | `true` |  | Sync xcursor theme with gsettings |
| `c.cursor.warp_back_after_non_mouse_input` | bool | `false` |  | Warp the cursor back to where it was after using a non-mouse input to move it. |

```cpp
c.cursor.theme = "Adwaita";
c.cursor.size  = 24;
c.cursor.hide_on_key_press = true;
c.cursor.inactive_timeout  = 5;           // hide after 5 seconds without movement
c.cursor.no_hardware_cursors = "disable"; // IntChoice: 0 or a name from the table above
```

## c.ecosystem

Switches for the update screen, the donation reminder and permission enforcement.

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.ecosystem.no_update_news` | bool | `false` |  | Disable the popup that shows up when you update abyssland to a new version. |
| `c.ecosystem.no_donation_nag` | bool | `false` |  | Disable the popup that shows up twice a year encouraging to donate. |
| `c.ecosystem.enforce_permissions` | bool | `false` |  | Whether to enable permission control. |
| `c.ecosystem.no_session_services` | bool | `false` |  | Do not start the session services: audio server and XDG autostart (without systemd), polkit agent (if none runs). |

```cpp
c.ecosystem.no_update_news   = true;
c.ecosystem.no_donation_nag = true;
```

## c.debug

Debugging aids. `c.debug.disable_logs` is on by default, set it to `false` to see `print()` output in the log.

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.debug.overlay` | bool | `false` |  | Print the debug performance overlay. |
| `c.debug.damage_blink` | bool | `false` |  | Flash damaged areas |
| `c.debug.gl_debugging` | bool | `false` |  | Enable OpenGL debugging and error checking. |
| `c.debug.disable_logs` | bool | `true` |  | Disable logging to a file |
| `c.debug.disable_time` | bool | `true` |  | Disables time logging |
| `c.debug.damage_tracking` | int or name | `2` | 0 to 2; `disable` = 0, `monitor` = 1, `full` = 2 | Redraw only the needed bits of the display. |
| `c.debug.enable_stdout_logs` | bool | `false` |  | Enables logging to stdout |
| `c.debug.manual_crash` | int | `0` | 0 to 1 | Set to 1 and then back to 0 to crash Abyssland. |
| `c.debug.suppress_errors` | bool | `false` |  | If true, do not display config file parsing errors. |
| `c.debug.disable_scale_checks` | bool | `false` |  | Disables verification of the scale factors. |
| `c.debug.error_limit` | int | `5` | 0 to 20 | Limits the number of displayed config file parsing errors. |
| `c.debug.error_position` | int or name | `0` | 0 to 1; `top` = 0, `bottom` = 1 | Sets the position of the error bar. |
| `c.debug.colored_stdout_logs` | bool | `true` |  | Enables colors in the stdout logs. |
| `c.debug.log_damage` | bool | `false` |  | Enables logging the damage. |
| `c.debug.pass` | bool | `false` |  | Enables render pass debugging. |
| `c.debug.full_cm_proto` | bool | `false` |  | Claims support for all cm proto features (requires restart) |
| `c.debug.ds_handle_same_buffer` | bool | `true` |  | Special case for DS with unmodified buffer |
| `c.debug.ds_handle_same_buffer_fifo` | bool | `true` |  | Special case for DS with unmodified buffer unlocks fifo |
| `c.debug.fifo_pending_workaround` | bool | `false` |  | Fifo workaround for empty pending list |
| `c.debug.render_solitary_wo_damage` | bool | `false` |  | Render solitary window with empty damage |
| `c.debug.vfr` | bool | `true` |  | Controls the VFR status of Abyssland. Do not turn off unless debugging |
| `c.debug.invalidate_fp16` | int or name | `1` | 0 to 2; `disable` = 0, `enable` = 1, `auto` = 2 | Allow fp16 buffer invalidation. |

```cpp
c.debug.disable_logs = false;     // needed to see print() in `abyssctl rollinglog`
c.debug.overlay      = false;
```

## c.layout

Options shared by all tiling layouts.

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.layout.single_window_aspect_ratio` | Vec2 | `{0, 0}` | x 0 to 1000, y 0 to 1000 | If specified, whenever only a single window is open, it will be coerced into the specified aspect ratio. |
| `c.layout.single_window_aspect_ratio_tolerance` | float | `0.1` | 0. to 1. | Minimum distance for single_window_aspect_ratio to take effect. |

```cpp
c.layout.single_window_aspect_ratio = Vec2{16, 9};
c.layout.single_window_aspect_ratio_tolerance = 0.1;
```

## c.dwindle

Options of the `dwindle` layout (binary tree splits).

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.dwindle.force_split` | int or name | `0` | 0 to 2; `follow_mouse` = 0, `left` = 1, `right` = 2 | Force a split direction for new windows |
| `c.dwindle.preserve_split` | bool | `false` |  | If enabled, the split will not change regardless of what happens to the container. |
| `c.dwindle.smart_split` | bool | `false` |  | If enabled, allows a more precise control over the window split direction based on the cursor's position. |
| `c.dwindle.smart_resizing` | bool | `true` |  | If enabled, resizing direction will be determined by the mouse's position on the window. |
| `c.dwindle.permanent_direction_override` | bool | `false` |  | If enabled, makes the preselect direction persist. |
| `c.dwindle.special_scale_factor` | float | `1` | 0 to 1 | Specifies the scale factor of windows on the special workspace |
| `c.dwindle.split_width_multiplier` | float | `1` | 0.1 to 3 | Specifies the auto-split width multiplier |
| `c.dwindle.use_active_for_splits` | bool | `true` |  | Whether to prefer the active window or the mouse position for splits |
| `c.dwindle.default_split_ratio` | float | `1` | 0.1 to 1.9 | The default split ratio on window open. |
| `c.dwindle.split_bias` | int or name | `0` | 0 to 1; `directional` = 0, `current` = 1 | Specifies which window will receive the split ratio. |
| `c.dwindle.precise_mouse_move` | bool | `false` |  | If enabled, bindm movewindow will drop the window more precisely depending on where your mouse is. |

```cpp
c.dwindle.preserve_split = true;
c.dwindle.smart_split    = false;
c.dwindle.force_split    = 2;           // new windows go right or below
c.dwindle.default_split_ratio = 1.0;
```

## c.master

Options of the `master` layout (one master area, a stack of slaves).

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.master.allow_small_split` | bool | `false` |  | Enable adding additional master windows in a horizontal split style |
| `c.master.special_scale_factor` | float | `1` | 0 to 1 | The scale of the special workspace windows. |
| `c.master.mfact` | float | `0.55` | 0 to 1 | The size as a percentage of the master window. |
| `c.master.new_status` | string | `"slave"` |  | `master`: new window becomes master; `slave`: new windows are added to slave stack; `inherit`: inherit from focused window |
| `c.master.new_on_top` | bool | `false` |  | Whether a newly open window should be on the top of the stack |
| `c.master.new_on_active` | string | `"none"` |  | `before`, `after`: place new window relative to the focused window; `none`: place new window according to new_on_top. |
| `c.master.orientation` | string | `"left"` |  | Default placement of the master area |
| `c.master.slave_count_for_center_master` | int | `2` | 0 to 10 | When using orientation=center, make the master window centered only when at least this many slave windows are open. |
| `c.master.center_master_fallback` | string | `"left"` |  | Set fallback for center master when slaves are less than slave_count_for_center_master |
| `c.master.center_ignores_reserved` | bool | `false` |  | Centers the master window on monitor ignoring reserved areas |
| `c.master.smart_resizing` | bool | `true` |  | If enabled, resizing direction will be determined by the mouse's position on the window. |
| `c.master.drop_at_cursor` | bool | `true` |  | When enabled, dragging and dropping windows will put them at the cursor position. |
| `c.master.always_keep_position` | bool | `false` |  | Whether to keep the master window in its configured position when there are no slave windows |
| `c.master.focus_master_on_close` | bool | `false` |  | When enabled, closing a window focuses the master window |

```cpp
c.master.new_status  = "master";    // new windows become the master
c.master.mfact       = 0.6;
c.master.orientation = "left";
c.master.new_on_top  = false;
```

## c.scrolling

Options of the `scrolling` layout (columns on an endless strip).

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.scrolling.fullscreen_on_one_column` | bool | `true` |  | When enabled, a single column on a workspace will always span the entire screen. |
| `c.scrolling.column_width` | float | `0.5` | 0.1 to 1.0 | The default width of a column. |
| `c.scrolling.focus_fit_method` | int or name | `1` | 0 to 1; `center` = 0, `fit` = 1 | When a column is focused, what method should be used to bring it into view |
| `c.scrolling.follow_focus` | bool | `true` |  | When a window is focused, should the layout move to bring it into view automatically |
| `c.scrolling.follow_min_visible` | float | `0.4` | 0.0 to 1.0 | When a window is focused, require that at least a given fraction of it is visible for focus to follow |
| `c.scrolling.explicit_column_widths` | string | `"0.333, 0.5, 0.667, 1.0"` |  | A comma-separated list of preconfigured widths for colresize +conf/-conf |
| `c.scrolling.direction` | string | `"right"` |  | Direction in which new windows appear and the layout scrolls |
| `c.scrolling.wrap_focus` | bool | `true` |  | Determines if column focus wraps around |
| `c.scrolling.wrap_swapcol` | bool | `true` |  | Determines if column movement wraps around |

```cpp
c.scrolling.column_width    = 0.5;
c.scrolling.follow_focus    = true;
c.scrolling.direction       = "right";
c.scrolling.explicit_column_widths = "0.333, 0.5, 0.667, 1.0";
```

## c.experimental

Features that may change or disappear.

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.experimental.wp_cm_1_2` | bool | `true` |  | Allow wp-cm-v1 version 2 |

```cpp
c.experimental.wp_cm_1_2 = false;
```

## c.input_capture

Options for the input-capture portal (see [Desktop portals](/wiki/portals)).

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.input_capture.capture_modifiers` | bool | `false` |  | If enabled, modifiers are also captured and sent to the program |
| `c.input_capture.enforce_barriers` | bool | `true` |  | If enabled, throw a wayland error when a invalid barrier is received |

```cpp
c.input_capture.capture_modifiers = true;
```

## c.quirks

Workarounds for specific hardware or drivers.

| Field | Type | Default | Range / values | Description |
|---|---|---|---|---|
| `c.quirks.prefer_hdr` | int or name | `0` | 0 to 2; `disable` = 0, `enable` = 1, `gamescope_only` = 2 | Prefer HDR mode. |
| `c.quirks.skip_non_kms_dmabuf_formats` | bool | `false` |  | Do not report dmabuf formats which cannot be imported into KMS |

```cpp
c.quirks.skip_non_kms_dmabuf_formats = false;
```


## Per-device settings (`c.device`)

`c.device(name, DeviceOpts)` overrides input options for one device, matched by its name (list names with `abyssctl devices`). `DeviceOpts` has one optional field per key; the key is the last part of the matching `c.input` option, for example `input:touchpad:natural_scroll` becomes `.naturalScroll`.

```cpp
c.device("logitech-mx-master", {.sensitivity = -0.5});
c.device("my-touchpad", {.naturalScroll = true, .tapToClick = true, .tags = "touchpad"});
c.device("wacom-intuos-pen", {.leftHanded = true, .output = "DP-1"});
```

Designated initializers must follow the declaration order of this table. `.tags` marks keyboards and pointers so that binds can be restricted to them with `BindOpts::devices`, see [Keybinds](/wiki/config/keybinds#bind-flags).

| Field | Key | Type |
|---|---|---|
| `.sensitivity` | `sensitivity` | float |
| `.accelProfile` | `accel_profile` | string |
| `.rotation` | `rotation` | int |
| `.kbFile` | `kb_file` | string |
| `.kbLayout` | `kb_layout` | string |
| `.kbVariant` | `kb_variant` | string |
| `.kbOptions` | `kb_options` | string |
| `.kbRules` | `kb_rules` | string |
| `.kbModel` | `kb_model` | string |
| `.repeatRate` | `repeat_rate` | int |
| `.repeatDelay` | `repeat_delay` | int |
| `.naturalScroll` | `natural_scroll` | bool |
| `.tapButtonMap` | `tap_button_map` | string |
| `.numlockByDefault` | `numlock_by_default` | bool |
| `.resolveBindsBySym` | `resolve_binds_by_sym` | bool |
| `.disableWhileTyping` | `disable_while_typing` | bool |
| `.clickfingerBehavior` | `clickfinger_behavior` | bool |
| `.middleButtonEmulation` | `middle_button_emulation` | bool |
| `.tapToClick` | `tap_to_click` | bool |
| `.tapAndDrag` | `tap_and_drag` | bool |
| `.dragLock` | `drag_lock` | int |
| `.leftHanded` | `left_handed` | bool |
| `.scrollMethod` | `scroll_method` | string |
| `.scrollButton` | `scroll_button` | int |
| `.scrollButtonLock` | `scroll_button_lock` | bool |
| `.scrollPoints` | `scroll_points` | string |
| `.scrollFactor` | `scroll_factor` | float |
| `.transform` | `transform` | int |
| `.output` | `output` | string |
| `.enabled` | `enabled` | bool |
| `.regionPosition` | `region_position` | Vec2 |
| `.absoluteRegionPosition` | `absolute_region_position` | bool |
| `.regionSize` | `region_size` | Vec2 |
| `.relativeInput` | `relative_input` | bool |
| `.activeAreaPosition` | `active_area_position` | Vec2 |
| `.activeAreaSize` | `active_area_size` | Vec2 |
| `.eraserButtonMode` | `eraser_button_mode` | int |
| `.eraserButtonOverride` | `eraser_button_override` | int |
| `.pressureRangeMin` | `pressure_range_min` | float |
| `.pressureRangeMax` | `pressure_range_max` | float |
| `.flipX` | `flip_x` | bool |
| `.flipY` | `flip_y` | bool |
| `.drag3fg` | `drag_3fg` | int |
| `.shareStates` | `share_states` | int |
| `.releasePressedOnClose` | `release_pressed_on_close` | bool |
| `.keybinds` | `keybinds` | bool |
| `.tags` | `tags` | string |

::: info Touch and tablets
All touchscreen, touchpad and tablet options are available (`c.input.touchpad`, `c.input.touchdevice`, `c.input.tablet`, `c.input.tablettool`). They have not been tested on real touch or tablet hardware yet.
:::
