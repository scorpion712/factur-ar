# Skill Registry — factur-ar-admin

## Project
- **Name**: factur-ar-admin
- **Path**: C:\Users\Lautaro\Desktop\Projects\POS-Jero\factur-ar-admin
- **Stack**: React 19 + Vite 6 + TypeScript
- **Persistence Mode**: engram (local-only)

---

## Project Skills (local)

Located at `.agents/skills/`:

| Skill | Trigger | Path |
|-------|---------|------|
| zod | Zod schemas | .agents/skills/zod/SKILL.md |
| react-hook-form | React Hook Form patterns | .agents/skills/react-hook-form/SKILL.md |
| vite | Vite configuration | .agents/skills/vite/SKILL.md |
| accessibility | WCAG 2.2 audit | .agents/skills/accessibility/SKILL.md |
| frontend-design | Modern UI design | .agents/skills/frontend-design/SKILL.md |
| nodejs-best-practices | Node.js principles | .agents/skills/nodejs-best-practices/SKILL.md |
| nodejs-backend-patterns | Backend services | .agents/skills/nodejs-backend-patterns/SKILL.md |
| seo | Search optimization | .agents/skills/seo/SKILL.md |
| react-best-practices | React patterns | .agents/skills/react-best-practices/SKILL.md |
| composition-patterns | Component patterns | .agents/skills/composition-patterns/SKILL.md |
| typescript-advanced-types | TypeScript advanced | .agents/skills/typescript-advanced-types/SKILL.md |

---

## User Skills (global)

Relevant to stack:

| Skill | Trigger | Path |
|-------|---------|------|
| react-19 | React 19 patterns | ~/.config/opencode/skills/_shared/react-19/SKILL.md |
| zustand-5 | Zustand state | ~/.config/opencode/skills/_shared/zustand-5/SKILL.md |
| zod-4 | Zod 4 breaking changes | ~/.config/opencode/skills/_shared/zod-4/SKILL.md |
| typescript | TypeScript strict | ~/.config/opencode/skills/_shared/typescript/SKILL.md |
| tailwind-4 | Tailwind CSS 4 | ~/.config/opencode/skills/_shared/tailwind-4/SKILL.md |
| eslint-patterns | ESLint patterns | ~/.config/opencode/skills/_shared/eslint-patterns/SKILL.md |
| security-checks | Security best practices | ~/.config/opencode/skills/_shared/security-checks/SKILL.md |
| playwright | E2E testing | ~/.config/opencode/skills/_shared/playwright/SKILL.md |

---

## SDD Skills

| Skill | Trigger | Path |
|-------|---------|------|
| sdd-init | Initialize SDD | ~/.config/opencode/skills/sdd-init/SKILL.md |
| sdd-explore | Explore ideas | ~/.config/opencode/skills/sdd-explore/SKILL.md |
| sdd-propose | Create proposal | ~/.config/opencode/skills/sdd-propose/SKILL.md |
| sdd-spec | Write specs | ~/.config/opencode/skills/sdd-spec/SKILL.md |
| sdd-design | Technical design | ~/.config/opencode/skills/sdd-design/SKILL.md |
| sdd-tasks | Break into tasks | ~/.config/opencode/skills/sdd-tasks/SKILL.md |
| sdd-apply | Implement tasks | ~/.config/opencode/skills/sdd-apply/SKILL.md |
| sdd-verify | Verify tests | ~/.config/opencode/skills/sdd-verify/SKILL.md |
| sdd-archive | Archive change | ~/.config/opencode/skills/sdd-archive/SKILL.md |

---

## Compact Rules Summary

### react-19
- No manual useMemo/useCallback — React Compiler optimizes
- Named imports: `import { useState } from "react"`
- Auto "use client" for interactive components

### zustand-5
- Typed store: `create<StoreInterface>()`
- Prevent duplicate fetches: `if (get().loading) return`
- Never mutate: `set((s) => ({ items: [...s.items] }))`

### zod-4 (breaking changes from v3)
- No `.email()` — use `z.email()`
- No `.nonempty()` — use `.min(1)`
- Error in object: `z.object({}, { error: "Required" })`

### tailwind-4
- Use `cn()` utility, not `clsx` + `twMerge`
- No `var()` in className — use theme variables directly
- New `@apply` syntax with `@layer`

### security-checks
- Validate all user input with Zod
- Sanitize HTML to prevent XSS
- Use HTTPS for all external requests
- Implement CSRF protection for forms

---

## Project Conventions

1. **UI Framework**: shadcn/ui (user specified)
2. **Forms**: Formik + Zod (user specified — different from PRD which says React Hook Form)
3. **CSS**: Tailwind CSS 4 (user specified — different from PRD which says plain CSS)
4. **Themes**: Pastel light + dark themes (Vercel dark style but with pastel colors)
5. **State**: Zustand for global state
6. **Auth**: localStorage token (mock auth)
7. **Testing**: No test runner detected — TDD unavailable

---

## Important Notes

⚠️ **Conflicts with PRD detected**:
- PRD says: React Hook Form + plain CSS
- User says: Formik + Tailwind CSS + shadcn/ui

Resolution: User's request takes precedence. UI will use shadcn + Tailwind with Formik.

---

## Next Steps

1. Run `/sdd-explore` or `/sdd-new` to start a change
2. No test framework — strict TDD is disabled
3. Use engram artifacts for persistence (local-only, not shared)