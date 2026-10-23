# Publishing / safety design

This repository stores the full public-source edition of the local Zhixu AI Academy,
including Node.js server source, scientific adapters, original doctoral art,
and tests. It is derived from `E:\CHATGPT\projects\ai-academy`.

## Canonical source
- `public/`: full, original frontend (11 original Doctor state images).
- `server.mjs`, `model-provider.mjs`, `adapters/`, `quiz-bank.mjs`: original backend and science.
- `pages-overlay/`: explicit, auditable GitHub Pages BYOK/browser adaptations.
- `scripts/build_pages_from_source.py`: deterministic static site build.
- `docs/`: generated site for branch-based Pages fallback.
- `.github/workflows/deploy-pages.yml`: builds **from canonical source** on push and deploys Pages.

## Runtime distinction
GitHub Pages **cannot run Node.js server functions**. Browser-only Pages uses
local mathematical computation plus explicit, opt-in user-supplied DeepSeek key.
The real server source is published but is not hosted by Pages. Do not claim
multi-user auth, server persistence, anti-cheat, or DeepSeek live tests in an
isolated video until independently verified.

Excluded from the public release: videos, evidence, submission material,
assets-inbox, personal exports, environment config and API keys.
