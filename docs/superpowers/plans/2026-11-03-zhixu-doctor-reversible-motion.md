# Zhixu Doctor Panel Reversible Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix WebKit Doctor panel mid-flight flicker without changing the existing avatar, lesson engine, or judge URL.

**Architecture:** Replace two independent Motion entry/exit effects with one reversible WAAPI animation governing opacity and spatial transform. Reuse the same animation timeline while reversing; finish handler honors current aria-expanded state and resets DOM only at stable endpoints.

**Tech Stack:** Vanilla JS, browser Web Animations API, Playwright Edge/WebKit, Node test runner.

**Spec:** docs/superpowers/specs/2026-11-03-zhixu-doctor-reversible-motion.md

## Constraints
- V5 only, no new dependencies, preserve native scroll-edge and helper panel.
- Never modify V4/R3/Original or private user data, no force push.
- Reduced Motion and WebKit behavior tested separately. iPhone Safari remains unverified.

### Task 1: Reproduce and pin flicker
- [ ] Add failing source contract test in tests/v5-doctor-reversible.test.mjs.
- [ ] Run RED; confirm failure identifies duplicate animation creation.
- [ ] Capture existing Edge/WebKit close→reopen intermediate opacity in Playwright.

### Task 2: Single timeline
- [ ] Implement one WAAPI animation with reverse/play for opening/closing.
- [ ] Preserve focus, aria-expanded, hidden and keyboard-visible behavior; no extra page transition.
- [ ] Run GREEN and Edge/WebKit quick interaction tests including intermediate opacity, Esc and reduced-motion.

### Task 3: Regress, document, inspect
- [ ] Run npm test + privacy filenames + git diff --check.
- [ ] Capture matched mobile/desktop screenshots; note actual residual limits.
- [ ] Update project audit, scope diff and commit; no shared main publication without safety checks.

## Verification ledger 2026-11-03
- [x] RED->GREEN static test (old paired animation test fails; new CSS state tests pass).
- [x] Existing product-wide main at 1a953c6 reviewed; no repeated changes to P0 reset, desktop empty outline, settings hitboxes.
- [x] Edge + WebKit × 320/390/1440: fast open/close/reopen, Escape, focus return, screenshots 6/6.
- [x] Reduced Motion: Edge + WebKit × 320/390/1440, 6/6.
- [x] Full `npm test` 123/123, filename audit PASS.
- [x] Existing `npm run verify` PFL SHA256 mismatch explicitly recorded as FAIL.
- [x] Before/after scenario + source-linked docs/evidence screenshots. Real iPhone Safari remains UNVERIFIED.
- [ ] Safe commit/push and live URL Pages smoke after current remote refresh.
