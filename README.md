# alfon.so — devfolio

My personal website ([alfon.so](https://alfon.so)), built as a tiny **desktop-OS**
in the browser: draggable windows, a taskbar, a start menu, desktop icons, and a
handful of mini-apps (terminal, notes, file explorers, a web browser, and a few
canvas games). On small screens it falls back to a plain, content-first mobile view.

Built with **Astro 6** + **React 19** + **Tailwind v4**, shipped as a single React
island so the desktop never loads on mobile.

## Stack

- **Astro 6** — static site, routing, SEO/head, and the blog content collection.
- **React 19** — the desktop island (windows, apps, games), hydrated via
  `client:media` only on wider viewports.
- **Tailwind v4** — inline utilities + shared token strings (`src/styles/tokens.ts`)
  + a small `@layer components` set in `src/styles/` for what utilities can't express.
- **framer-motion** for window/menu animation, **marked** for in-app markdown,
  **sharp** for build-time image optimization.

## Getting started

Requires Node `>=24.16` (see `.nvmrc`) and **pnpm** (`corepack enable` will pick up
the pinned version from `package.json`).

```sh
pnpm install
pnpm dev        # local dev server at http://localhost:4321
```

## Commands

| Command                     | What it does                                      |
| :-------------------------- | :------------------------------------------------ |
| `pnpm dev`                  | Start the dev server (`localhost:4321`)           |
| `pnpm build`                | Production build to `./dist/`                      |
| `pnpm preview`              | Preview the production build locally              |
| `pnpm test`                 | Run the Vitest suite                              |
| `pnpm test:watch`           | Vitest in watch mode                              |
| `pnpm lint`                 | ESLint over `src`                                 |
| `pnpm check`                | `astro check` (TypeScript diagnostics)            |
| `pnpm format`               | Prettier-format `src`                             |
| `pnpm wallpapers:optimize`  | Re-optimize the source wallpapers in `src/assets` |

CI runs `lint`, `check`, `test`, and `build` on every push.

## Project layout

```
src/
├── pages/            Astro routes (home desktop, blog)
├── layouts/          Base + post layouts
├── components/       Astro UI + site chrome
├── content/          Blog content collection (Markdown)
├── lib/              Blog + theme helpers
├── styles/           tokens.ts + global.css + component CSS partials
└── desktop/          The React desktop island
    ├── state/        Window manager, icons, theme, wallpaper
    ├── window/       Window chrome + geometry/gestures
    ├── shell/        Icons grid, taskbar, start menu, boot overlay
    ├── apps/         The mini-apps + the single registry.ts
    ├── wrappers/     The defineApp / browserApp / explorerApp authoring kit
    └── lib/          Leaf helpers (layout constants, viewport math, …)
```

### Adding a desktop app

Append one `defineApp` / `browserApp` / `explorerApp` call to `src/desktop/apps/registry.ts`.
The runtime derives window defs, desktop icons, taskbar metadata, the start menu,
and the terminal's `ls` from that one list — there's no second place to register.

## Testing

Unit tests run under **Vitest** + jsdom and cover pure logic, hooks, and component
behavior (see `vitest.config.ts`). Astro virtual modules (`astro:content`,
`astro:assets`) are stubbed in `test/stubs`. Tests live next to the code they cover.
