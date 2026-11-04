# utm-keeper

**English** · [Русский](README.ru.md)

Keep campaign tags across pages and carry them into every form.

**654 bytes min+gzip** (1,156 bytes minified ESM). Zero runtime dependencies. ESM, CommonJS and TypeScript declarations.

```js
import { utmKeeper, get } from 'utm-keeper';
const stop = utmKeeper();
console.log(get()); // { utm_source: 'newsletter', ... }
```

Run after the DOM is available. Saves `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`, `gclid`, `yclid` and `fbclid` from the query string. A new arrival with nonempty tracking parameters replaces the saved set; untagged pages keep it. Tags persist in localStorage until replaced or cleared. `get(options?)` returns a fresh object.

Current and dynamically inserted forms receive hidden inputs. A submit capture listener covers forms created immediately before submission. Existing hidden inputs are updated; visible inputs are preserved. Call `stop()` to disconnect observers and listeners. If storage is blocked, tags remain in memory for this page only. Initialization is safe during SSR.

| Option | Default | Behavior |
| --- | --- | --- |
| `storageKey` | `'utm-keeper'` | localStorage key; pass the same option to `get()`. |

## What it doesn't do

It does not send data, identify visitors, assign attribution, enforce consent, decorate links, or access cross-origin storage. It does not reach forms inside shadow roots or iframes, intercept direct `form.submit()` calls, or expire saved tags. Load it according to your site's consent policy.

## Development

`npm ci`, `npm test`, `npm run build`. Build prints minified ESM and gzip bytes (Node 22, level 9), without tree shaking. MIT © 2026 Daniel Raskopin. A standalone extraction of the tracker form-decoration pattern, with local campaign persistence.

Part of roitrail → https://github.com/web-frank/roitrail

## Live demo

Open [`demo/index.html`](demo/index.html) directly in your browser. The standalone file includes the library and works offline, without a server or build. `npm run build` refreshes its embedded library from the source.
