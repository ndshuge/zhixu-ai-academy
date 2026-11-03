# Zhixu Apple V5 final verification and learning closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore exact-source provenance and verify a real V5 learning journey without altering the stable judge URL or historical editions.

**Architecture:** Pin the original PFL artifact by hash instead of rebundling unreproducibly; use an isolated provenance verifier that resolves upstream paths explicitly or safely reports their absence. Add browser-level route/learning tests and small accessible UI fixes only where tests fail.

**Tech Stack:** Vanilla JS, Node 24, GitHub Pages, Git worktrees, Playwright Edge/WebKit.

**Spec:** docs/superpowers/specs/2026-11-03-zhixu-final-closure.md

### Task 1: PFL exact restore and verifiable source portability
- [ ] Write failing tests for pinned bundle and secure dependency resolution.
- [ ] Prove failure before modifying bundle or verifier.
- [ ] Restore exact SHA locked adapter from original project archive (requires verifying source SHA before copy).
- [ ] Correct upstream comparison for worktrees: never silently skip; warn on unavailable path; fail for tampered bundled bytes.
- [ ] Verify passing `npm run verify` without replacing provenance hash.

### Task 2: End-to-end student flow
- [ ] Inventory existing tests/routes and reproduce data persistence behavior.
- [ ] Add browser test for 320/390/768/1440 as appropriate, fake only public data, no private API keys.
- [ ] Fix demonstrated problems with test-first cycle; rerun unit/Edge/WebKit.

### Task 3: Apple UI accessibility and responsive checks
- [ ] Check minimum tap targets, focus, zoom 200%, reduced-motion/transparency, keyboard, contrast, no 404.
- [ ] Fix failing cases in V5 styles without changing historical versions; inspect screenshot comparisons.

### Task 4: Verify and publish
- [ ] npm test; npm run verify; build script / relevant smoke tests; git diff --check; scoped file list.
- [ ] Release via safe HTTPS script with non-force push; confirm GitHub Pages and unchanged original judge URL.
- [ ] Update audit and AGENTS.md with proven changes, failure/uncertainty, release SHA.

## Execution ledger, 2026-11-03
- [x] Task 1: RED->GREEN exact artifact + upstream trust tests; 13 pinned files recovered from verified original snapshot; PFL/Evo checked against unchanged SHA evidence. npm run verify now PASS.
- [x] Task 2: Actual browser E2E: Edge/WebKit x Logistic/Evo (4/4), 1 real science run each, user-generated test learning evidence, persistence, export and cancel-delete.
- [x] Task 3: V5 scientific helper text >=13px in scoped containers; compact 195 CSS px mobile zoom uses 3 accessible buttons >=44px; Edge/WebKit 195/320/390 6/6. Regular 320/390/768/1440 route layout also checked.
- [x] Task 4: npm test 134/134; npm run verify PASS; audit:filenames PASS; git diff --check PASS.
- [ ] Commit and fresh Windows worktree checkout; verify exact bytes independent of original working tree; then Pages deploy and live judge URL smoke.
- [ ] Real iPhone Safari/VoiceOver/true system Dynamic Type and authentic BYOK calls require external device/user key and remain UNVERIFIED.
- Ruling: legacy backend browser scripts timed out after 28s in the bounded Mice Hole executor, so they cannot be marked passing; new V5 E2E is independently recorded without misrepresenting legacy test coverage.
