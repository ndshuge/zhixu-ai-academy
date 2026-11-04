# Zhixu VNext Learning Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Give existing V5 learners an accurate “continue learning” affordance and accessible quiz states without touching the Dock or original science engine.

**Architecture:** Reuse existing Vanilla JS state.lesson / sessionStorage, screens and bridge.grade. A scoped quiz-state presenter in views.js renders real labels/feedback and an isolated content stylesheet adds semantic appearance. v4.js persists draft selections and handles same-course resume, leaving bridge and science unchanged.

**Tech Stack:** Vanilla JS ES modules, CSS, node:test, Playwright Edge/WebKit.

**Spec:** docs/zhixu-vnext-research-20261104.md

## Global Constraints
- Frozen Dock (all material, blur, structure, controls, animation, focus/hide). No Dock files or code modifications.
- Stay on feature/zhixu-design-vnext-20261104, no main/Pages publish, no change to Original/R3/V4 or experiment scoring.
- Quiz initially unselected; explicit unselected, selected, submitted, correct, incorrect and explanation states. Never reveal initial pretest answers early.
- API credentials private; no live API tests; graceful reduced-motion and narrow viewport fallbacks.
- Preserve 9c80713 focused learning and absence of Courses.

## Review Focus
- Refresh after selecting but before submitting must preserve the actual chosen radio without autograding.
- Transfer submission must show correct/incorrect semantics based only on verified grade.
- A submitted pretest must not reveal right answer/explanation.
- Returning to the same experiment must not reset data, but choosing a different experiment must start a new lesson.
- Two quick submit actions must not create duplicate learning events; existing busy guard and bridge data must be retained.

### Task 1: Test and implement six quiz states + recovery

**Files:**
- Create: tests/v5-learning-continuity.test.mjs
- Modify: apple-editions/ai-academy-v5/views.js
- Modify: apple-editions/ai-academy-v5/v4.js
- Create: apple-editions/ai-academy-v5/v5-learning-continuity.css
- Modify: apple-editions/ai-academy-v5/index.html

**Interfaces:**
- Consumes: state.lesson fields grade, preChoice, transferChoice, experiment, step and existing bridge.grade.
- Produces: content-only data-quiz-state, data-answer-state; state.lesson.preChoice / transferChoice persistent selection; action resume-learning.

- [ ] Step 1: Write tests in tests/v5-learning-continuity.test.mjs checking initial unanswered state, selection recovery, grade states, analysis details, and HTML style/module wiring.
- [ ] Step 2: Run node --test tests/v5-learning-continuity.test.mjs — expected FAIL for missing user-facing states.
- [ ] Step 3: Implement minimum views.js/v4.js/CSS/index changes; keep V5 nav/Dock untouched.
- [ ] Step 4: Run node --test tests/v5-learning-continuity.test.mjs — expected PASS.
- [ ] Step 5: Run npm test and npm run verify, record any legacy flaky parallel test without hiding.
- [ ] Step 6: Commit only scoped files after verification.

### Task 2: Browser learning workflow and reproducibility

**Files:**
- Create: tests/browser-v5-learning-continuity.cjs
- Modify: docs/handoffs/zhixu-design-vnext.md

**Interfaces:**
- Consumes: Test 1 UI behavior, existing Playwright preview server and programmatic science adapter.
- Produces: browser test result and optional non-sensitive screenshots in evidence/browser.

- [ ] Step 1: Build browser test covering idle/unselected → selection → exit/resume → submit → next, browser back and keyboard; tests require ZHIXU_PREVIEW_ROOT.
- [ ] Step 2: Run Edge/WebKit 390 and desktop. Address actual defects, add regression tests.
- [ ] Step 3: Run existing browser-v5-focus-navigation.cjs, browser-v5-full-journey.cjs, browser-v5-byok-failures.cjs and verify source SHA.
- [ ] Step 4: Update handoff with actual outcomes and remaining iPhone Safari check.
- [ ] Step 5: Commit; verify no tracked Dock file or line changed.

### Task 3: Research-guided content transition proof (conditional)

**Files:**
- Create only if target browser UX proves a worthwhile non-Dock improvement.

- [ ] Step 1: Capture before/after in unchanged Dock, compare content transition, ensure back direction and Reduced Motion. If not fully testable, document experimental option without shipping.
- [ ] Step 2: No new renderer/CanvasKit/Skia until concrete tested requirement.
- [ ] Step 3: Report remaining G4/G5/G6 openly; do not equate no implementation with acceptance.
