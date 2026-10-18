# Custom layouts

Abyssland ships the layouts `dwindle`, `master`, `scrolling` and `monocle`. With Abysslang you can write your own tiling layout in the config, in plain C++. There are two ways:

1. **Simple:** a function that places boxes. No state of its own, no resize or swap logic.
2. **Full power:** derive from `abyss::TiledLayout` and override whatever you want. One instance exists per workspace, so member variables are per-workspace state.

::: warning Work in progress
Custom layouts are new. The API below is what the current headers (`abyss/layout.hpp`) declare. The full-power base exposes compositor concepts that are not a stable API yet.
:::

## Selecting a layout

```cpp
c.general.layout = "grid";                               // every workspace
c.workspaceRule("3", {.layout = "grid"});                // one workspace
c.bind(SUPER, "F3", setLayout("grid"));                  // at runtime, all workspaces without a layout in a workspace rule
```

`abyssctl dispatch setlayout grid` does the same from a shell, and `abyssctl layouts` lists every layout that exists. `abyssctl dispatch layoutmsg <text>` is delivered to the active workspace's layout.

If a layout disappears from the config (after a reload), its workspaces fall back to dwindle and keep all their windows.

## The simple API

```cpp
void addLayout(std::string name, LayoutFn fn, LayoutHooks hooks = {});
using LayoutFn = std::function<void(LayoutCtx&)>;
```

The function is called whenever the windows of a workspace need to be placed. It receives a `LayoutCtx`:

```cpp
c.addLayout("grid", [](LayoutCtx& l) {
    const auto cells = l.grid(l.count());
    for (size_t i = 0; i < l.count(); ++i)
        l.place(i, cells[i]);
});
c.general.layout = "grid";
```

### LayoutCtx

`LayoutCtx` is valid only during the call.

| Member | Meaning |
|---|---|
| `area` | `Box`: the work area of the workspace in global coordinates (monitor minus bars and reserved areas) |
| `targets` | `std::vector<LayoutTarget>`: the tiled windows, in order |
| `workspace` | the workspace id |
| `message` | in `onMsg`: the layout message text; empty otherwise |
| `count()` | number of tiled windows |
| `grid(n)` | tiles `n` cells into `area`: `ceil(sqrt(n))` columns, `ceil(n / cols)` rows, the last row is stretched over the full width |
| `gridCell(i, cols, rows = 0)` | cell `i` (0-based) of a regular `cols` x `rows` grid inside `area`; `rows = 0` means as many rows as needed for `count()` cells |
| `column(i, n)`, `row(i, n)` | the `i`-th (0-based) of `n` equally wide columns, equally tall rows of `area` |
| `LayoutCtx::split(box, side, ratio)` | static: `ratio` (0 to 1) of `box` from the given `Side` (`Left`, `Right`, `Top`, `Bottom`) |
| `place(i, box)` | puts window `i` (0-based) into `box`, same as `targets[i].place(box)` |

Compositor gaps and borders are applied on top of what you place; negative sizes become `0`.

### Box

| Member | Meaning |
|---|---|
| `x`, `y`, `w`, `h` | position and size, `double` |
| `right()`, `bottom()` | `x + w`, `y + h` |
| `inset(px)` | the box shrunk by `px` on every side (never negative) |

### Examples

::: code-group

```cpp [Columns]
// every window gets an equally wide column
c.addLayout("columns", [](LayoutCtx& l) {
    for (size_t i = 0; i < l.count(); ++i)
        l.place(i, l.column(i, l.count()));
});
```

```cpp [Fibonacci]
// each window takes half of what is left, alternating left and top
c.addLayout("fibonacci", [](LayoutCtx& l) {
    Box rest = l.area;
    for (size_t i = 0; i < l.count(); ++i) {
        if (i + 1 == l.count()) {
            l.place(i, rest);
            break;
        }
        const bool horizontal = i % 2 == 0;
        const Box  first      = LayoutCtx::split(rest, horizontal ? Side::Left : Side::Top, 0.5);
        l.place(i, first);
        rest = horizontal ? Box{first.right(), rest.y, rest.w - first.w, rest.h}
                          : Box{rest.x, first.bottom(), rest.w, rest.h - first.h};
    }
});
```

```cpp [Main and stack]
// the first window takes the left 60 percent, the others share the right side
c.addLayout("main-stack", [](LayoutCtx& l) {
    if (l.count() == 0)
        return;
    if (l.count() == 1) {
        l.place(0, l.area);
        return;
    }
    l.place(0, LayoutCtx::split(l.area, Side::Left, 0.6));
    const Box right = LayoutCtx::split(l.area, Side::Right, 0.4);
    for (size_t i = 1; i < l.count(); ++i)
        l.place(i, Box{right.x, right.y + right.h * double(i - 1) / double(l.count() - 1), right.w, right.h / double(l.count() - 1)});
});
```

:::

### Hooks

Hooks are observers that run **in addition** to the built-in behavior: the window list is always reordered on swap or move and the layout function re-runs after every change. Use them for layout messages, resizing and swapping.

```cpp
struct LayoutHooks {
    std::function<std::string(LayoutCtx&, std::string_view msg)> onMsg;       // abyssctl dispatch layoutmsg <msg>; return "" for success or an error message
    std::function<void(LayoutCtx&, size_t index, Vec2 delta)>    onResize;    // window `index` is being resized by delta (pixels); the layout is re-run after
    std::function<void(LayoutCtx&, size_t a, size_t b)>          onSwap;      // windows a and b (0-based, in the new order) were swapped or moved by the user
};
```

A layout with state shares it between the function and the hooks through a captured pointer. This one keeps a master ratio that you change with `abyssctl dispatch layoutmsg "ratio 0.7"` or by dragging a border:

```cpp
auto ratio = std::make_shared<double>(0.55);

c.addLayout("ratio-columns",
    [ratio](LayoutCtx& l) {
        if (l.count() == 1) {
            l.place(0, l.area);
            return;
        }
        l.place(0, LayoutCtx::split(l.area, Side::Left, *ratio));
        const Box rest = LayoutCtx::split(l.area, Side::Right, 1.0 - *ratio);
        for (size_t i = 1; i < l.count(); ++i)
            l.place(i, Box{rest.x, rest.y + rest.h * double(i - 1) / double(l.count() - 1), rest.w, rest.h / double(l.count() - 1)});
    },
    LayoutHooks{
        .onMsg = [ratio](LayoutCtx&, std::string_view msg) -> std::string {
            if (!msg.starts_with("ratio "))
                return "unknown message, try: ratio <0.1 to 0.9>";
            try {
                *ratio = std::clamp(std::stod(std::string(msg.substr(6))), 0.1, 0.9);
            } catch (...) {
                return "ratio expects a number";
            }
            return "";
        },
        .onResize = [ratio](LayoutCtx& l, size_t, Vec2 delta) {
            if (l.area.w > 0)
                *ratio = std::clamp(*ratio + delta.x / l.area.w, 0.1, 0.9);
        },
    });
```

```sh
abyssctl dispatch setlayout ratio-columns
abyssctl dispatch layoutmsg "ratio 0.7"
```

### LayoutTarget

A `LayoutTarget` is one tiled window as the layout sees it: a cheap value you can copy around. Two handles of the same window compare equal.

| Member | Meaning |
|---|---|
| `index` | position in the layout order (`SIZE_MAX` if not in the list) |
| `window` | the `PHLWINDOW` (null only for exotic targets) |
| `box` | where the window was when the handle was made |
| `floating` | whether the window is floating |
| `place(box)` | puts the window into `box` |

## The full-power API

Derive from `abyss::TiledLayout`, register it with `c.addLayout<MyAlgo>("name")`, and override what you need. Only `recalculate()` is required.

```cpp
template <typename A> void addLayout(std::string name);   // A derives from TiledLayout and is default-constructible
```

By default the layout keeps the tiled windows in a list, calls `recalculate()` after every change, swap and move-in-direction reorder the list, and `getNextCandidate` cycles through the list.

| Virtual function | Called when | Default |
|---|---|---|
| `void recalculate()` | **required**: position all windows with `targets()` and `place()` | none |
| `void newTarget(const LayoutTarget& t)` | a window entered | adds it to the list |
| `void movedTarget(const LayoutTarget& t, std::optional<Vec2> focalPoint)` | a window moved in from another workspace | adds it to the list |
| `void removeTarget(const LayoutTarget& t)` | a window left | removes it from the list |
| `void resizeTarget(Vec2 delta, const LayoutTarget& t, Corner corner)` | a window is being resized by `delta` pixels at `corner` | just recalculates |
| `void swapTargets(const LayoutTarget& a, const LayoutTarget& b)` | `swapwindow` or a drag-swap | reorders the list |
| `void moveTargetInDirection(const LayoutTarget& t, Dir dir, bool silent)` | `movewindow l / r / u / d` | reorders the list |
| `std::string layoutMsg(std::string_view msg)` | `abyssctl dispatch layoutmsg <msg>`; return `""` if handled, an error message otherwise | ignores the message |
| `std::optional<LayoutTarget> getNextCandidate(const LayoutTarget& old)` | which window gets focus when `old` goes away | the next one in the list |
| `std::optional<Vec2> predictSizeForNewTarget()` | the size a new window opens with | the work area |

Call `TiledLayout::newTarget(t)` (and so on) from an override to keep the default list handling.

Helpers available in a derived class:

| Helper | Returns |
|---|---|
| `targets()` | the live tiled windows, in order (`std::vector<LayoutTarget>`) |
| `workArea()` | the usable area in global coordinates, an empty box if the layout is not attached |
| `workspaceId()` | the workspace id |
| `place(t, box)` | static, same as `t.place(box)` |
| `m_list` | the list order used by the defaults (protected); edit it freely in your overrides |

`Corner` is a set of bits: `CornerTop`, `CornerBottom`, `CornerLeft`, `CornerRight`, combined for a corner (`CornerTop | CornerLeft`), `CornerNone` when the resize is not interactive.

### A complete example: centered master

The first window sits in the middle and the others are split between a left and a right column. `abyssctl dispatch layoutmsg "ratio +0.05"` (or `"ratio 0.6"`) changes the width of the middle window, and dragging a border does the same.

```cpp
#include <abyss/config.hpp>

#include <algorithm>
#include <charconv>

using namespace abyss;

struct CenteredMaster : TiledLayout {
    // per-workspace state: one instance of this class exists for every workspace that uses the layout
    double m_ratio = 0.5;

    void recalculate() override {
        const auto T = targets();
        const auto A = workArea();
        if (T.empty())
            return;

        // one window: everything; two: master + one side column
        if (T.size() == 1) {
            place(T[0], A);
            return;
        }

        const bool   twoOnly = T.size() == 2;
        const double masterW = A.w * m_ratio;
        const double masterX = twoOnly ? A.x : A.x + (A.w - masterW) / 2.0;
        place(T[0], {masterX, A.y, masterW, A.h});

        // the rest alternates: right column first, then left
        std::vector<LayoutTarget> right, left;
        for (size_t i = 1; i < T.size(); ++i)
            ((i % 2 == 1) ? right : left).push_back(T[i]);

        const double sideW = (A.w - masterW) / (twoOnly ? 1.0 : 2.0);
        auto         stack = [&](const std::vector<LayoutTarget>& col, double x) {
            for (size_t i = 0; i < col.size(); ++i)
                place(col[i], {x, A.y + A.h * double(i) / double(col.size()), sideW, A.h / double(col.size())});
        };
        stack(right, masterX + masterW);
        stack(left, A.x);
    }

    // dragging a border resizes the master
    void resizeTarget(Vec2 delta, const LayoutTarget&, Corner) override {
        const auto A = workArea();
        if (A.w > 0)
            m_ratio = std::clamp(m_ratio + delta.x / A.w, 0.2, 0.9);
        recalculate();
    }

    std::string layoutMsg(std::string_view msg) override {
        if (!msg.starts_with("ratio "))
            return "unknown message, try: ratio <0.2..0.9 | +x | -x>";

        std::string_view arg = msg.substr(6);
        const bool       rel = arg.starts_with('+') || arg.starts_with('-');
        double           v   = 0;
        const char*      b   = arg.data() + (arg.starts_with('+') ? 1 : 0);
        const auto [p, ec]   = std::from_chars(b, arg.data() + arg.size(), v);
        if (ec != std::errc{} || p != arg.data() + arg.size())
            return "ratio expects a number";

        m_ratio = std::clamp(rel ? m_ratio + v : v, 0.2, 0.9);
        recalculate();
        return "";
    }
};

void configure(Config& c) {
    c.addLayout<CenteredMaster>("centered-master");
    c.general.layout = "centered-master";
}
```

The class can live in its own header (for example `~/.config/abyss/centered-master.hpp`) that `config.hpp` includes. The Abyssland source tree ships this one as `examples/centered-master.hpp`.

## Layout messages

`layoutMsg("...")` as an action (or `abyssctl dispatch layoutmsg ...`) goes to the layout of the active workspace. Custom layouts receive it in `onMsg` or `TiledLayout::layoutMsg`. The built-in layouts understand, among others:

| Layout | Messages |
|---|---|
| `dwindle` | `togglesplit`, `swapsplit`, `rotatesplit [angle]`, `movetoroot [window] [unstable]`, `preselect <direction>`, `splitratio <delta>` or `splitratio <value> exact` |
| `master` | `swapwithmaster`, `focusmaster`, `cyclenext`, `cycleprev`, `swapnext`, `swapprev`, `addmaster`, `removemaster`, `rollnext`, `rollprev`, `mfact <delta>` or `mfact exact <value>`, `orientationleft`, `orientationright`, `orientationtop`, `orientationbottom`, `orientationcenter`, `orientationcycle`, `orientationnext`, `orientationprev` |
| `scrolling` | `move`, `focus`, `colresize`, `fit`, `promote`, `consume`, `expel`, `swapcol`, `center` |
| `monocle` | `cyclenext`, `cycleprev` |

```cpp
c.bind(SUPER, "M", layoutMsg("swapwithmaster"));
c.bind("SUPER+CTRL+right", layoutMsg("mfact +0.05"), {.repeat = true});
c.bind("SUPER+CTRL+left", layoutMsg("mfact -0.05"), {.repeat = true});
c.bind(SUPER, "J", layoutMsg("togglesplit"));
```

The layout options of the built-ins are in [Options](/wiki/config/options#c-dwindle) (`c.dwindle`, `c.master`, `c.scrolling`, `c.layout`).
