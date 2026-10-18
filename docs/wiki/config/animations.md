# Animations

Animations are built from three things: **curves** (a bezier or a spring), **leaves** (the things that animate: windows, layers, workspaces, ...) and **styles** (how a leaf moves, for example `popin` or `slide`). The master switch is `c.animations.enabled`.

```cpp
c.animations.enabled = true;
c.bezier("easeOutQuint", 0.23, 1, 0.32, 1);
c.spring("easy", 1, 878.5, 59.29);          // a spring instead of a bezier
c.animation("global", true, 10, "default");
c.animation("windowsIn", true, 4.1, "easeOutQuint", "popin 87%");
c.animation("workspaces", true, 1.94, "easy", "fade");
```

## Curves

```cpp
void bezier(std::string name, double x0, double y0, double x1, double y1);
void spring(std::string name, double mass, double stiffness, double damping);
```

| Function | Arguments | Limits |
|---|---|---|
| `c.bezier(name, x0, y0, x1, y1)` | a cubic bezier with the control points `(x0, y0)` and `(x1, y1)` | each coordinate from `-1` to `2`, the name must not be empty |
| `c.spring(name, mass, stiffness, damping)` | a spring | all three greater than `0.5` (the implementation rejects `0.5` itself, although the header says "at least 0.5") |

A curve is referred to by its name from `c.animation(...)`. The built-in curve `"default"` can be used without defining it, the default config does so for `global`.

```cpp
c.bezier("easeOutQuint", 0.23, 1, 0.32, 1);
c.bezier("easeInOutCubic", 0.65, 0.05, 0.36, 1);
c.bezier("linear", 0, 0, 1, 1);
c.bezier("overshoot", 0.05, 0.9, 0.1, 1.05);       // slight overshoot, a "bouncy" feel
c.spring("snappy", 1, 878.5, 59.29);                // mass 1, stiffness 878.5, damping 59.29
```

::: tip Springs
A spring has no fixed duration: it settles by itself, so the `speed` of the animation matters less. Raise the stiffness for a snappier feel and the damping to remove wobble.
:::

## c.animation

```cpp
void animation(std::string leaf, bool enabled, double speed = 1.0, std::string curve = "default", std::string style = "");
```

| Argument | Meaning |
|---|---|
| `leaf` | which animation to configure, see the table below. An unknown leaf is an error |
| `enabled` | `false` switches the leaf off (speed and curve are then ignored) |
| `speed` | greater than `0` and at most `100`; a bigger number is a slower animation (the unit is 100 ms per step) |
| `curve` | the name of a bezier or a spring; an unknown name is an error |
| `style` | optional, depends on the leaf, see [Styles](#styles) |

A leaf that is not configured inherits from its parent: `windowsIn` falls back to `windows`, which falls back to `global`. Configure the parent once and override only what you need.

```cpp
c.animation("global",     true, 10, "default");
c.animation("windows",    true, 4.8, "easeOutQuint");
c.animation("windowsOut", true, 1.5, "linear", "popin 87%");   // closing is faster
c.animation("fade",       false);                              // no fading at all
```

### Leaves

| Leaf | Parent | Animates |
|---|---|---|
| `global` | none | the root, everything falls back to it |
| `windows` | `global` | all window animations |
| `windowsIn` | `windows` | a window opening |
| `windowsOut` | `windows` | a window closing |
| `windowsMove` | `windows` | a window moving or resizing |
| `layers` | `global` | layer surfaces |
| `layersIn`, `layersOut` | `layers` | a layer surface opening, closing |
| `fade` | `global` | all fades |
| `fadeIn`, `fadeOut` | `fade` | a window fading in, out |
| `fadeSwitch` | `fade` | the fade when the focused window changes (active and inactive opacity) |
| `fadeShadow`, `fadeGlow`, `fadeDim` | `fade` | shadow, glow and dim fades |
| `fadeLayers` | `fade` | layer fades, with children `fadeLayersIn` and `fadeLayersOut` |
| `fadePopups` | `fade` | popup fades, with children `fadePopupsIn` and `fadePopupsOut` |
| `fadeDpms` | `fade` | the fade when a monitor switches on or off |
| `border` | `global` | border color changes |
| `borderangle` | `global` | the rotation of a gradient border (styles `loop`, `once`) |
| `shadowangle`, `glowangle` | `global` | the rotation of a gradient shadow or glow |
| `workspaces` | `global` | workspace switches |
| `workspacesIn`, `workspacesOut` | `workspaces` | the workspace coming in, going out |
| `specialWorkspace` | `workspaces` | special workspaces (scratchpads), with children `specialWorkspaceIn` and `specialWorkspaceOut` |
| `zoomFactor` | `global` | cursor zoom |
| `monitorAdded` | `global` | a monitor being added |

`abyssctl animations` prints what is configured right now.

### Styles

The `style` string is only accepted for some leaves. A bad style is reported when the config loads.

| Leaves | Styles |
|---|---|
| `windows`, `windowsIn`, `windowsOut`, `windowsMove` | `slide`, `slide <side>` (for example `slide bottom`), `popin` or `popin <percent>%` (for example `popin 87%`), `gnome`, `gnomed` |
| `layers`, `layersIn`, `layersOut` | `fade`, `slide`, `slide <side>`, `popin`, `popin <percent>%` |
| `workspaces`, `workspacesIn`, `workspacesOut`, `specialWorkspace`, `specialWorkspaceIn`, `specialWorkspaceOut` | `slide`, `slidevert`, `fade`, `slide <percent>%` |
| `borderangle`, `shadowangle`, `glowangle` | `loop` or `once` |
| every other leaf | none, the style must stay empty |

## Examples

::: code-group

```cpp [Quick and quiet]
c.animations.enabled = true;
c.bezier("quick", 0.15, 0, 0.1, 1);
c.animation("global", true, 4, "quick");
c.animation("workspaces", true, 3, "quick", "slide");
```

```cpp [Spring based]
c.animations.enabled = true;
c.spring("easy", 1, 878.5, 59.29);
c.bezier("linear", 0, 0, 1, 1);
c.animation("global",     true, 10, "default");
c.animation("windows",    true, 5,  "easy");
c.animation("windowsIn",  true, 4,  "easy",   "slide bottom");
c.animation("windowsOut", true, 1.5, "linear", "slide top");
c.animation("border",     true, 5,  "easy");
c.animation("workspaces", true, 3,  "easy", "slidevert");
```

```cpp [Animated border]
// a gradient border that rotates slowly
c.general.col.active_border = gradient({rgb(0x80b0d8), rgb(0xc8a25a), rgb(0x80b0d8)}, 0);
c.animation("borderangle", true, 60, "linear", "loop");
```

```cpp [Off]
c.animations.enabled = false;
```

:::

For the full set the default config uses, see `config.def.hpp` or [Example configs](/wiki/config/examples).

## Per-window and per-workspace animation

- A window rule can change the style of one window, or switch its animation off: `c.windowRule({.cls = "^(mpv)$"}, {.animation = "popin 60%"})` and `{.noAnim = true}`. Layer rules have the same `.animation` and `.noAnim`. See [Rules](/wiki/config/rules).
- A workspace rule can set the workspace animation style: `c.workspaceRule("3", {.animation = "slidevert"})`, see [Monitors and workspaces](/wiki/config/monitors#workspaces).

## Visual effects

Blur, shadows, glow, dimming, motion blur and rounding are options, not functions. They are listed in [Options](/wiki/config/options#c-decoration):

```cpp
c.decoration.blur.enabled        = true;
c.decoration.shadow.range        = 16;
c.decoration.glow.enabled        = true;
c.decoration.motion_blur.enabled = true;
```

Window rules can switch them per window with `.noBlur`, `.noShadow`, `.noDim`, `.opacity`, `.rounding` and `.dimAround`, see the effect table in [Rules](/wiki/config/rules#windoweffects).
