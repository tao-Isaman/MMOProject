# Tasks

Write one task per `##` heading. Claude groups tasks that can run in parallel (separate git worktrees),
runs one agent per task, then merges, builds (`npm run build`) and reviews.

Fields (only the title is required):
- **What**: what you want, in a sentence or two (Thai or English)
- **Where** (optional): files/systems you know are involved
- **Done when** (optional): how you'll judge it's finished
- **Priority** (optional): high / normal / low

Status is updated by Claude: `todo` → `in progress` → `done` / `blocked: <reason>`.

---

## Skill aim mode
- What: click a skill (or press its key) → cursor changes to aim mode → pick the target or area to use it on;
  AOE skills show the size of their area while aiming
- Where: src/main.ts, src/skills.ts, src/world3d/view.ts, src/hud.ts, style.css (plan: docs/skill_aim_plan.md)
- Done when: every aimed skill kind previews correctly in the browser, typecheck/build pass, pushed
- Priority: high
- Status: done

## 
- What:
- Status: todo
