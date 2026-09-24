# OpenMouse landing page

The standalone marketing/support site for OpenMouse, deployed at
[openmouse.app](https://openmouse.app). This is a separate Cloudflare Pages
project from the gated control app (control.openmouse.app), which lives in
the [openmouse](https://github.com/OpenMouse-Project/openmouse) repo's
`control-panel` branch.

## Pages

- `landing.html` — the marketing home page
- `faq.html` — frequently asked questions
- `check.html` — WebHID compatibility checker
- `supported.html` — supported device list
- `donate.html` — support/funding page

## Stack

Vite + Preact + TypeScript, no build-time server framework. `functions/api/*`
are Cloudflare Pages Functions (currently the blog comments endpoint).

## Developing

```sh
npm install
npm run dev      # local dev server
npm run build    # type-check + production build
npm test         # unit tests
```

## Scope

This repo intentionally contains only the public marketing/support pages and
their dependencies. The gated control app, its device drivers, and the admin
dashboard are out of scope here — see the `openmouse` repo instead.
