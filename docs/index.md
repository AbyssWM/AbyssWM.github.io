---
layout: home
title: Abyss
hero:
  name: Abyss
  text: A dark, minimal Wayland ecosystem – configured in code.
  tagline: Abyssland, a dynamic tiling compositor, and the libraries and tools around it. Your configuration is C++, compiled in – like dwm's config.h.
  image:
    src: /abyss-logo-512.png
    alt: Abyss logo
  actions:
    - theme: brand
      text: Installation
      link: /wiki/getting-started
    - theme: alt
      text: Configuration
      link: /wiki/config/
    - theme: alt
      text: GitHub
      link: https://github.com/AbyssWM
features:
  - icon: 🗡️
    title: Abysslang
    details: Your config is a C++ file with typed options. A typo is a compile error, binds are real lambdas, and abyssctl reload rebuilds and restarts the compositor.
    link: /wiki/config/
    linkText: Read the configuration guide
  - icon: ⚙️
    title: Its own libraries
    details: The whole Hyprland stack is forked and renamed – Abyssal, Abyssutils, Abyssparse and more – so the ecosystem builds and updates as one, independent of system packages.
    link: /wiki/ecosystem
    linkText: See all repositories
  - icon: 刀
    title: Katana look
    details: Ink black, cold steel blue and a little gold. Dark and minimal by default, with IBM Plex as the typeface.
    link: /roadmap
    linkText: What is planned
---

<div class="home-notice">

::: warning Early development (0.x)
Abyss is being built right now and is **not ready for daily use**. Experimental packages for Fedora, Debian, Ubuntu, Arch, Void and Gentoo are already available. See [Installation](/wiki/getting-started) for package sources and their publication status. Parts of these docs are marked *work in progress*.
:::

</div>
