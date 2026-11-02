# Brands

One React Native codebase that ships as many branded apps. Each brand gets its own app name, icon, bundle ID and colors at build time. Each brand's home screen layout, theme overrides and feature flags come from a FastAPI server at runtime, so they change without an app release.

```
brands/
├── mobile/            Expo app (one codebase, many brands)
│   ├── brands/<id>/   brand.json (build-time identity) + default-config.json (offline fallback)
│   └── src/
│       ├── config/    load config: network → cache → bundled default
│       ├── sdui/      server-driven UI: block registry + renderer + error boundary
│       ├── blocks/    the actual UI blocks (BalanceCard, Banner, RewardList)
│       └── theme/     brand colors merged with server overrides
└── server/            FastAPI config service
    └── configs/<id>.json
```

🎥 **Loom:** _link coming soon_

<details>
<summary><strong>2. Tech stack and why</strong></summary>

<br>

### Mobile

| Tool | Why |
|---|---|
| **Expo (SDK 58) + React Native 0.88** | One codebase for iOS and Android. A dynamic `app.config.ts` lets one project produce a different native app per brand (`BRAND=a`) through Continuous Native Generation, so there are no hand-maintained `ios/` or `android/` folders. |
| **TypeScript** | The config moves between JSON files, the server and components. Types catch mismatches at compile time, for example `defineBlock` checks that a block's schema matches its component's props. |
| **Zod** | Server JSON is untrusted input. Zod checks it at runtime and gives TypeScript types from the same schema. A bad block or color is dropped instead of crashing the app. |
| **AsyncStorage** | Caches the last good config so the app opens with real content when offline. |
| **expo-splash-screen** | Keeps the splash screen up until the first config has loaded, so users never see an empty or default screen flash first. |
| **Jest (jest-expo) + React Native Testing Library** | Unit tests for config loading (including ETags) and the block renderer, run against React Native's environment. |
| **patch-package** | Applies a local fix to `expo-modules-jsi` automatically on every install. |

### Server

| Tool | Why |
|---|---|
| **FastAPI** | Small, typed and quick to build. Query validation (`brand` must match `^[a-z0-9_-]+$`) and header parsing come built in. |
| **Uvicorn** | The standard server that runs FastAPI apps. |
| **pytest + TestClient** | Tests the HTTP endpoints without starting a server. |

### Patterns

| Pattern | Why |
|---|---|
| **Server-driven UI (SDUI)** | The server sends a list of `{ id, type, props }` blocks and the app maps each `type` to a component it already ships. Brands can change layout and content without a store release. |
| **Network → cache → default fallback** | The app always renders something: live config, then the last cached config, then the config bundled with that brand. |
| **Polling + ETag / `304 Not Modified`** | Server changes show up within seconds without restarting the app. Polls are cheap because unchanged configs return an empty `304`. |
| **Per-block error boundary** | One broken block hides only itself, not the whole screen. |

</details>

<details>
<summary><strong>3. Settings: rebuild or server?</strong></summary>

<br>

The rule: **anything the operating system or app store reads must be built into the app. Anything only our JavaScript reads can come from the server.**

- **Rebuild** means a new native build and a store release.
- **JS release** means a new JavaScript bundle. Today that is also a rebuild. With EAS Update it could ship over the air without store review.
- **Server** means edit `server/configs/<brand>.json`. It goes live within about 5–10 seconds, with no release.

### Brand identity (`mobile/brands/<id>/brand.json`)

| Setting | Source | Why |
|---|---|---|
| `name` | **Rebuild** | The name under the home-screen icon is written into the native app files (Info.plist / AndroidManifest). |
| `bundleId` | **Rebuild** | The app's identity in the App Store and Play Store, and what signing is tied to. It can never change for a published app. |
| `slug` / `scheme` | **Rebuild** | The deep-link URL scheme (`brew-rewards://`) is registered with the OS at install time. |
| `icon` | **Rebuild** | The OS reads app icons from the native build. |
| `colors.primary` | **Rebuild** for the Android icon background. **Server** for the in-app color. | The Android adaptive icon background is a native resource. Inside the app it is only the fallback and can be overridden by `theme.primary` from the server. |
| `colors.onPrimary` | **JS release** (fallback) / **Server** (override) | Fallback text color on the primary color. The server can override it with `theme.onPrimary`. |
| `colors.background` | **JS release** | Screen background. It is not in the server schema yet, so changing it needs a release. |
| `id` | **Rebuild** | Picks which brand folder is built, and is the `?brand=` the app asks the server for. |

### Runtime config (`server/configs/<id>.json`)

| Setting | Source | Why |
|---|---|---|
| `theme.primary`, `theme.onPrimary` | **Server** | Only used by our own components. Invalid hex values are ignored and the brand color is used instead. |
| `flags.*` (e.g. `showRewards`) | **Server** | Turn features on and off without a release. Blocks with `requiresFlag` are hidden when their flag is off. |
| `home` (block list, order, props) | **Server** | This is the server-driven UI. Reorder, add, remove or re-text blocks instantly. |
| `version` | **Server** | Labels the config. Shown in the dev debug line, and the block list re-mounts when it changes. |

### App behavior and code

| Setting | Source | Why |
|---|---|---|
| `default-config.json` | **JS release** | Bundled offline fallback. It has to ship in the app to work with no network. |
| **New block types** (`src/sdui/registry.ts`) | **JS release** (**Rebuild** if they add native code) | The server can only use components the app already contains. Unknown types are skipped safely. |
| `EXPO_PUBLIC_API_URL` | **JS release** | Built into the JavaScript bundle at build time. |
| `POLL_MS` (5 s), fetch timeout (3 s) | **JS release** | Constants in `ConfigProvider.tsx` and `loadConfig.ts`. |
| `Cache-Control` (`max-age=5`) | **Server deploy** | Set in `server/main.py`. Controls how long a CDN or the device may reuse a response. |

</details>

<details>
<summary><strong>4. What breaks going from 2 to 1,000 brands</strong></summary>

<br>

### Builds and releases
- **Builds are manual and per brand.** Each brand needs `BRAND=x expo prebuild --clean` and a local build, run by hand. 1,000 brands means 1,000 builds for every native change.
- **Store overhead grows with every brand.** Each brand is its own store listing, signing key or certificate, screenshots and review. A single bug fix becomes 1,000 submissions.
- **Every brand ships every block.** All block code goes into every app. A change to one block affects every brand at once, and the app grows as blocks are added.

### Brand onboarding
- **Brands live in the repo.** `mobile/brands/` would hold 1,000 folders with icons, and adding a brand needs a code change and a developer.
- **No validation of brand files.** A bad value only fails deep inside the native build. This already happened once: `"primary": "pink"` broke the Android build because Android only accepts hex colors.

### Server
- **Configs are files on one machine.** `server/configs/*.json` can't be shared across several server instances, has no edit history, and has no admin UI or access control.
- **No validation of server configs.** The app ignores bad data safely, but a typo silently hides a block for every user of that brand.
- **Polling load grows with users, not brands.** Without a CDN, every device's 5-second poll reaches FastAPI directly. ETags make each poll cheap, but the requests still arrive.
- **No targeting by app version.** Every app version gets the same config, so a new block type is skipped on older apps with no way to send them something else.

### Operations
- **No visibility in production.** Dropped blocks and failed fetches only log in development, so problems in one brand go unnoticed.
- **One API URL per build.** There's no clean way to set separate staging and production URLs per brand.

### Solutions (short)
| Problem | Direction |
|---|---|
| Manual builds and store submissions | Automate in CI: an EAS Build matrix over brands, EAS Submit for stores, EAS Update for JS-only changes. |
| Brands in the repo | Store brand data in a database or CMS, and generate `brand.json` and icons at build time. |
| No validation | One shared schema (JSON Schema or Zod) checked in CI, in the admin UI, and by the server before saving. |
| Config files on disk | Store configs in a database or S3, behind a CDN with ETag caching. Clear the CDN cache when a config is saved. |
| Load grows with devices | CDN in front of `/config`. Later, a push signal (managed pub/sub or FCM topics) with polling as the fallback. |
| Every brand ships every block | Gate blocks per brand with flags. Target configs by app version. |
| No visibility in production | Crash and error reporting (e.g. Sentry) and a metric for dropped blocks. |

</details>

<details>
<summary><strong>5. Next build steps</strong></summary>

<br>

1. **Validate `brand.json`** in `app.config.ts`: hex colors, an icon that exists, a valid bundle ID. Fail fast with a clear message.
2. **Validate configs on the server** against the same schema the app uses, so bad configs are rejected before they go live.
3. **Put a CDN in front of `/config`.** The cache headers and ETags are already in place.
4. **Move configs to a database or S3** with a small admin API (or CMS), including edit history and access control.
5. **Set up EAS builds per brand**: build profiles, a CI matrix over `mobile/brands/*`, and EAS Update for JS-only changes.
6. **Add app-version targeting**: the app sends its version and the server returns only blocks that version supports.
7. **Add a push signal for instant updates**: "brand X changed" over managed pub/sub or FCM topics, with polling as the fallback.
8. **Add observability**: Sentry for crashes, plus reporting for dropped blocks and failed fetches.
9. **Add navigation and more blocks**: Expo Router screens, with server-driven content beyond the home screen.
10. **Add end-to-end tests** (e.g. Maestro) that build each brand and check its home screen renders.

</details>

<details>
<summary><strong>6. Where AI was used</strong></summary>

<br>

AI (Claude Code) helped with the following. All changes were reviewed, run and tested before being committed.

| Area | What AI helped with |
|---|---|
| **Initial scaffolding** | Monorepo layout, the Expo + FastAPI skeleton, per-brand `brand.json` / `default-config.json`, and the `select-brand` script. |
| **SDUI renderer** | `BlockRenderer`, the block registry with compile-time schema-to-props checking, and the per-block `BlockBoundary` error boundary. |
| **Tests** | The Jest suites (config loading, block rendering) and the pytest suite for the server. |
| **Android build fixes** | Found why the Gradle download timed out and got the build tool downloaded. Traced a `mergeDebugResources` failure to `"primary": "pink"` in a `brand.json` (Android only accepts hex colors). |
| **Live config updates** | Polling while the app is open, paused in the background, with no re-render when nothing changed. |
| **Caching for scale** | ETag / `304 Not Modified` support on server and client, CDN-friendly `Cache-Control` headers, tests, and the scaling plan in sections 4–5. |
| **This README** | Drafted from the codebase. |

</details>
