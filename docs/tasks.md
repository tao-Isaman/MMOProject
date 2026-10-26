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

## v0.6 class balance: more passives, longer buffs/debuffs
- What: every class branch gets at least 2 passives, more for higher jobs (2/3/4/5); buffs and soft
  debuffs last ×1.5 (stun/freeze unchanged)
- Where: src/progression.ts, src/trees/**, runtime defaults (plan: docs/v06_balance_plan.md)
- Done when: tree_check 0 problems, typecheck/build pass, review clean
- Priority: high
- Status: in progress (7 parallel agents)

## 
- What:
- Status: todo
