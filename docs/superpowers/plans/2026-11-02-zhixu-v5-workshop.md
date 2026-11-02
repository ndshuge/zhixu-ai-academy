# Zhixu Apple V5 Judge Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve immutable V4, build a scientifically truthful Apple V5 workshop, and route the original judge URL to V5 following verification.

**Architecture:** Copy V4 to V5 as independent owned frontend, retaining sibling Motion/Glass assets and same-origin Original ScienceBridge. Use small V5-specific CSS and page composition overrides, no core scoring changes. Edit static Pages router and deployment workflow. Update Galaxy version hub separately if safe.

**Tech Stack:** HTML/CSS/ES modules, Node built-in test runner, Python static Pages builder, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-02-zhixu-v5-workshop-design.md`

## Global Constraints
- Never edit or delete existing V4/R3/Original pages or science engine as part of migration.
- Keep the formal URL and all edition query options.
- Deploy only through safe fresh-main non-force push, CI success, verified live browser outcome.
- Never invent real AI connections, proof of learning gains or Safari-native refraction.

## Review Focus
- Original old hash/query preserves query and anchor.
- Same-origin scientific iframe path works from the deeper V5 path.
- Empty localStorage gives truthful counts, not fake mastery.
- iOS mobile bottom navigation never obscures the primary CTA.
- Reduced-motion disables or minimizes transitions.

---

### Task 1: Immutable snapshot and new V5 page
**Files:** Copy `apple-editions/ai-academy-v4/` → `apple-editions/ai-academy-v5/`; create `tests/apple-v5.test.mjs`.
- [ ] RED: tests for V5 existence, V4 checksum and stable required science APIs.
- [ ] GREEN: copy V4 entirely; create V5-specific README, stylesheet and boot script as needed.
- [ ] Verify static load without needing a paid model.

### Task 2: Judge-oriented home and scientific experience
**Files:** `apple-editions/ai-academy-v5/views.js`, `apple-editions/ai-academy-v5/index.html`, `apple-editions/ai-academy-v5/v5-workshop.css`, `apple-editions/ai-academy-v5/v4.js`.
- [ ] RED: tests require primary tutor CTA, experiment CTA, 4-step learning narrative, scientific previews and reduced motion.
- [ ] GREEN: build one-screen compelling hero + split learning/lab cards, accurate learning event displays, smooth motion.
- [ ] Check desktop 1440 and mobile 390, empty evidence & rule mentor distinction.

### Task 3: Safe edition router and published version hub
**Files:** `docs/index.html`, `.github/workflows/deploy-pages.yml`, `tests/competition-router.test.mjs`, `tests/apple-editions.test.mjs`, `README.md`.
- [ ] RED: new routing test fails before changes; Old V4 always manually accessible.
- [ ] GREEN: default V5; compatibility `edition=v4/r3/original`; build includes V5 and assets; update docs.
- [ ] Rebuild Pages, full `npm test`, diff check, static URL smoke.

### Task 4: Release and verification
- [ ] Commit scoped V5 files in isolated worktree.
- [ ] Safe push freshly fetched main (never force).
- [ ] Verify GitHub Pages run completed success; original URL resolves to V5; V4, R3 and Original still accessible.
- [ ] If practical and safe, update Galaxy version selector to surface V5 and V4 history.
- [ ] Report genuine remaining browser/Safari and inherited verification limitations.