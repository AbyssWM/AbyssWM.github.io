# Patching and replacing

Everything in Abyss can be patched or replaced: your own [portal](/wiki/portals), your own helper programs, your own code in the config, your own build of Abyssland. This page lists the extension points and the rules that come with them.

::: warning Your responsibility
Without changes you get the default behavior, and that is the supported setup. If you replace something, you own the result: when it breaks, it is a **user issue**, not a platform issue. `abyssctl doctor` shows what differs from the default, so a report can start from the facts.
:::

| What | How | Page |
|---|---|---|
| Portal | own `portals.conf` | [Desktop portals](/wiki/portals) |
| Wayland protocols | `c.protocol(...)`, `c.protocols.*` | [Choosing Wayland protocols](/wiki/protocols) |
| GPU and backend | `c.gpu` | [GPU options](#gpu-options-c-gpu) |
| Helper programs | `c.helpers` | [Helper programs](#helper-programs-c-helpers) |
| Own commands and events | `c.command`, `abyss::emit` | [Commands and user events](#commands-and-user-events) |
| Activation environment | `ABYSSLAND_ACTIVATION_ENV` | [Activation environment](#activation-environment) |
| Your own build | edit the source tree, `abyssctl reload` | [abyssctl reference](/wiki/abyssctl#reload) |
| Check what differs | `abyssctl doctor` | [Doctor](/wiki/abyssctl#doctor) |

## GPU options (`c.gpu`)

`c.gpu` is the typed form of the `ABYSSAL_*` variables (see [NVIDIA](/wiki/nvidia)).

```cpp
c.gpu.devices        = {"/dev/dri/by-path/pci-0000:0b:00.0-card", "/dev/dri/card1"};
c.gpu.noModifiers    = true;
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
- The values are read once at start, before the backend exists. A reload that changes them only warns (it takes effect after a restart).

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
| `updateScreen` | `abyss-update-screen` | shown once after an update as `<updateScreen> --new-version <version>`, only without `ecosystem:no_update_news` |
| `donateScreen` | `abyss-donate-screen` | donation reminder, no arguments, only without `ecosystem:no_donation_nag` |

An empty value never starts the helper. For the dialog, the request is then treated like a closed dialog: a permission prompt is denied and "app not responding" shows nothing. A helper that is not found is logged when the config loads.

### Dialog contract

```
my-dialog --title "<title>" --text "<text>" --buttons "<a>;<b>;..."
```

The program shows the dialog, prints the label of the pressed button on stdout and exits. Any program that follows this works, a script included.

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
- Names may contain letters, digits, `_`, `-` and `.`. Registering a name twice replaces it.
- A reload drops all commands, and the config registers them again.
- `fn` can be any callable taking `std::string_view` and returning `void` or something convertible to `std::string`.

`abyss::emit(name, data)` sends the event `user.<name>>>data` to every socket2 listener, the same socket as the built-in events. It returns `false` for a bad name, and newlines in `data` become spaces.

```cpp
c.bind(SUPER, "F9", [] { abyss::emit("mic", "muted"); return ok(); });
```

```sh
# read the events from a script or a bar
socat -U - UNIX-CONNECT:"$XDG_RUNTIME_DIR/abyss/$ABYSSLAND_INSTANCE_SIGNATURE/.socket2.sock" |
  while IFS= read -r line; do
    case $line in user.mic'>>'*) echo "mic: ${line#user.mic>>}";; esac
  done
```

## Activation environment

At start (and again on exit) Abyssland hands a list of variables to `systemctl --user` and `dbus-update-activation-environment`, so services started by D-Bus or systemd see the session. Both use one list. `ABYSSLAND_ACTIVATION_ENV` adds more names to it:

```sh
ABYSSLAND_ACTIVATION_ENV="MY_VAR OTHER_VAR"     # separated by space, colon or comma
```

Names may only contain letters, digits and underscores. Because the list ends up in a shell command, a single other character makes Abyssland ignore the whole variable. Set the variable in the environment that starts Abyssland, for example in your session launcher.

## Checking what differs

`abyssctl doctor` reports every deviation from the defaults, see [abyssctl reference](/wiki/abyssctl#doctor).
