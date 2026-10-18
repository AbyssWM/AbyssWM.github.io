import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Abyss',
  description: 'A dark, minimal Wayland ecosystem – configured in code.',
  lang: 'en-US',
  base: '/',
  cleanUrls: true,
  lastUpdated: false,
  appearance: 'dark',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'
      }
    ],
    ['meta', { name: 'theme-color', content: '#050816' }]
  ],
  themeConfig: {
    logo: '/abyss-logo-512.png',
    siteTitle: 'Abyss',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Wiki', link: '/wiki/', activeMatch: '^/wiki/' },
      { text: 'Roadmap', link: '/roadmap' },
      { text: 'Credits', link: '/credits' }
    ],
    sidebar: {
      '/wiki/': [
        {
          text: 'Wiki',
          items: [
            { text: 'Overview', link: '/wiki/' },
            { text: 'Installation', link: '/wiki/getting-started' },
            { text: 'NVIDIA', link: '/wiki/nvidia' },
            { text: 'Desktop portals', link: '/wiki/portals' }
          ]
        },
        {
          text: 'Configuration guide',
          items: [
            { text: 'Quickstart', link: '/wiki/config/' },
            { text: 'Options', link: '/wiki/config/options' },
            { text: 'Monitors and workspaces', link: '/wiki/config/monitors' },
            { text: 'Keybinds and actions', link: '/wiki/config/keybinds' },
            { text: 'Rules', link: '/wiki/config/rules' },
            { text: 'Animations', link: '/wiki/config/animations' },
            { text: 'Events, idle, screensaver', link: '/wiki/config/events' },
            { text: 'Queries and notifications', link: '/wiki/config/queries' },
            { text: 'Custom layouts', link: '/wiki/config/layouts' },
            { text: 'Environment and helpers', link: '/wiki/config/system' },
            { text: 'Example configs', link: '/wiki/config/examples' }
          ]
        },
        {
          text: 'Using Abyssland',
          items: [
            { text: 'Configuration overview', link: '/wiki/configuration' },
            { text: 'Wayland protocols', link: '/wiki/protocols' },
            { text: 'abyssctl reference', link: '/wiki/abyssctl' },
            { text: 'Patching and replacing', link: '/wiki/patching' },
            { text: 'Tools', link: '/wiki/tools' }
          ]
        },
        {
          text: 'Project',
          items: [{ text: 'Ecosystem', link: '/wiki/ecosystem' }]
        }
      ]
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/AbyssWM' }],
    outline: { level: [2, 3], label: 'On this page' },
    search: { provider: 'local' },
    footer: {
      message: 'Early development. Not affiliated with or endorsed by hyprwm.',
      copyright: 'Copyright © 2026 AbyssWM'
    }
  }
})
