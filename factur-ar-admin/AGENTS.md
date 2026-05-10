# AI Development Patterns — FacturAr Admin

> This guide documents AI-assisted development patterns, conventions, and skills for this project.  
> **When**: Use this as reference when pairing with AI on features, refactoring, or debugging.  
> **Who**: Developers, code reviewers, AI assistants.

---

## 🤖 Project Profile

| Aspect | Details |
|--------|---------|
| **Type** | React SPA (Vite + React 19) |
| **Scale** | ~1500 LOC (small, focused dashboard) |
| **Patterns** | Zustand 5 + React Hook Form + Zod + TypeScript strict |
| **UI** | CSS variables + Tailwind 4 (no UI library) |
| **Testing** | Unit tests planned (Vitest + RTL); E2E with Playwright |
| **Build** | Vite (instant HMR), no heavy bundling |

---

## 🎯 AI-Friendly Practices

### 1. Use Skill Triggers

When working with AI on this project, reference these skill names:

| Skill | Trigger | When to load |
|-------|---------|--------------|
| **react-19** | Writing components, hooks, Server Actions | Building UI, optimizing renders |
| **react-hook-form** | Client-side form validation, useForm, useWatch | Building controlled forms |
| **zod** | Input validation schemas, safeParse | Adding form or API validation |
| **zustand-5** | State management, store creation | Building stores or managing global state |
| **tailwind-4** | Styling with Tailwind 4 CSS variables | Adding CSS classes or theming |
| **typescript** | Type safety, interfaces, generics | Writing types, strict mode checks |
| **frontend-design** | UI components, pages, design quality | Beautifying components, building features |

**Example request**:
```
Load the react-hook-form skill, then help me add email validation 
using Zod schema for the customer creation form.
```

### 2. Type-First Development

Always define types before writing component/state code.

```typescript
// ✅ Good: Types first
interface CustomerFormState {
  razonSocial: string;
  CUIT: string;
  loading: boolean;
  errors: Partial<Record<keyof Pick<CustomerFormState, 'razonSocial' | 'CUIT'>, string>>;
}

// ❌ Bad: No types, magic strings
const [razonSocial, setRazonSocial] = useState('');
const [errors, setErrors] = useState({});
```

### 3. Single Responsibility

- **Pages**: Orchestrate page layout, data fetching, routing
- **Components**: Reusable, accept props, emit callbacks
- **Hooks**: Extract common logic (fetch, validation, state patterns)
- **Stores**: Global state + async operations (Zustand)
- **Services**: Firebase operations, API calls

### 4. Form Pattern (React Hook Form + Zod)

```typescript
// 1. Define schema (types/forms.ts)
export const customerSchema = z.object({
  razonSocial: z.string().min(1, 'Required'),
  CUIT: z.string().regex(/^\d{11}$/, 'Must be 11 digits'),
});

// 2. Use in component
const { control, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(customerSchema),
  defaultValues: { razonSocial: '', CUIT: '' },
});

// 3. Bind inputs (use register OR control)
<input {...register('razonSocial')} />
{errors.razonSocial && <span>{errors.razonSocial.message}</span>}
```

**AI prompt**: "Use React Hook Form + Zod to add [field] validation with this schema: [schema]"

### 5. Zustand Store Pattern

```typescript
import { create } from 'zustand';
import type { Customer } from '../types/customer';

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCustomers: () => Promise<void>;
  addCustomer: (data: CustomerFormData) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  loading: false,
  error: null,

  fetchCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const data = await customerService.list();
      set({ customers: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error' });
    } finally {
      set({ loading: false });
    }
  },

  addCustomer: async (data) => {
    set({ loading: true, error: null });
    try {
      const newCustomer = await customerService.create(data);
      set((state) => ({ customers: [...state.customers, newCustomer] }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error' });
    } finally {
      set({ loading: false });
    }
  },

  deleteCustomer: async (id) => {
    try {
      await customerService.delete(id);
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error' });
    }
  },
}));
```

**AI prompt**: "Create a Zustand store for [entity] with actions: [list], [create], [delete]"

### 6. Component File Structure

```typescript
// ✅ Good structure
import { useMemo, useState } from 'react';
import type { Customer } from '../types/customer';
import { cn } from '../lib/utils';

interface YourComponentProps {
  customers: Customer[];
  onSelect?: (id: string) => void;
}

export function YourComponent({ customers, onSelect }: YourComponentProps) {
  const [filter, setFilter] = useState('');

  // Derived state (prefer useMemo for expensive calcs)
  const filtered = useMemo(
    () => customers.filter((c) => c.razonSocial.includes(filter)),
    [customers, filter]
  );

  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {filtered.map((c) => (
        <button key={c.id} onClick={() => onSelect?.(c.id)}>
          {c.razonSocial}
        </button>
      ))}
    </div>
  );
}
```

**Avoid**: Direct Zustand access in UI components. Pass as props or via hooks.

### 7. Styling Pattern (CSS Variables + Tailwind)

```tsx
// ✅ Use CSS variables for theme-aware colors
<div className="bg-[var(--color-card)] text-[var(--color-foreground)]">
  <h1 className="text-xl font-bold">Title</h1>
  <p className="text-sm text-[var(--color-muted-foreground)]">Subtitle</p>
</div>

// ✅ Use Tailwind for spacing, sizing, layout
<div className="max-w-3xl mx-auto px-6 py-8">
  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
    ...
  </div>
</div>

// ❌ Avoid: Hardcoded colors, var() in className
<div style={{ color: 'var(--color-foreground)' }}>  // Wrong
<div className="text-red-500">  // Wrong (use CSS vars)
```

### 8. Error Handling Pattern

```typescript
// ✅ Consistent error handling
try {
  const result = await customerService.create(data);
  // Handle success
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  set({ error: message });
  console.error('Failed to create customer:', message);
}

// ❌ Avoid
} catch (err) {
  console.log(err);  // Lost type info
  alert('Failed');   // Poor UX
}
```

---

## 📝 Code Review Checklist

When reviewing PRs, use this with AI:

- [ ] **Types**: All components/hooks have TypeScript types; no `any`
- [ ] **Props**: Props are clear, typed, documented
- [ ] **State**: Zustand for global, `useState` for local UI
- [ ] **Forms**: Use React Hook Form + Zod for validation
- [ ] **Styling**: CSS variables, Tailwind, no hardcoded colors
- [ ] **Accessibility**: Buttons have labels, forms have `<label>`, ARIA attrs
- [ ] **Errors**: Try/catch with proper error messages, no silent failures
- [ ] **Performance**: No unnecessary re-renders; useMemo for expensive calcs
- [ ] **Testing**: Unit tests added for logic, E2E for flows (if applicable)

---

## 🧪 Testing Patterns

### Unit Tests (Vitest)

```typescript
// components/YourComponent.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('renders customers list', () => {
    const customers = [{ id: '1', razonSocial: 'Empresa A' }];
    render(<YourComponent customers={customers} />);
    expect(screen.getByText('Empresa A')).toBeInTheDocument();
  });

  it('filters customers by name', async () => {
    const customers = [
      { id: '1', razonSocial: 'Empresa A' },
      { id: '2', razonSocial: 'Empresa B' },
    ];
    render(<YourComponent customers={customers} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'A');
    expect(screen.getByText('Empresa A')).toBeInTheDocument();
    expect(screen.queryByText('Empresa B')).not.toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/customer-create.spec.ts
import { test, expect } from '@playwright/test';

test('create customer flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[type=email]', 'admin@test.com');
  await page.fill('input[type=password]', 'Test@123');
  await page.click('button:has-text("Login")');
  await expect(page).toHaveURL('/');

  // Create customer
  await page.click('button:has-text("Add Customer")');
  await page.fill('input[name=razonSocial]', 'Empresa Test');
  await page.fill('input[name=CUIT]', '30123456789');
  await page.click('button:has-text("Save")');

  // Verify
  await expect(page.locator('text=Empresa Test')).toBeVisible();
});
```

**AI prompt**: "Write Vitest unit tests for [component] covering: [scenarios]"

---

## 🚀 Development Workflow with AI

### Feature Implementation

1. **Define types first**
   ```
   AI: Create TypeScript types for [feature]: [requirements]
   ```

2. **Build store** (if state needed)
   ```
   AI: Create Zustand store for [entity] with actions: [list], [create]
   ```

3. **Build UI** (pages → components → tests)
   ```
   AI: Build React component for [feature] using [constraints]
   ```

4. **Add validation** (forms)
   ```
   AI: Add React Hook Form + Zod validation for [fields]
   ```

5. **Review & test**
   ```
   npm run lint && npm run test
   ```

### Debugging with AI

```
I'm getting [error message]. Here's my code: [code snippet]. 
What's wrong? Use the react-19 skill to help.
```

### Refactoring with AI

```
Refactor [component name] to use [new pattern]. 
Consider [constraints]. Load the frontend-design skill.
```

---

## 📚 Key Files & Conventions

| File/Folder | Convention | When to edit |
|-------------|-----------|--------------|
| `src/types/` | Define all TypeScript interfaces + enums | Adding new entities |
| `src/store/` | Zustand stores (one file per entity) | Adding global state |
| `src/services/` | Firebase/API calls (one file per domain) | Adding API methods |
| `src/components/` | Reusable UI components | Building common UI pieces |
| `src/pages/` | Full page routes | Building new pages |
| `src/styles/globals.css` | CSS variables, theme config | Updating design system |
| `src/lib/utils.ts` | Helper functions, classname merging | Adding common utilities |

---

## 🔧 Useful Commands (with AI)

**When working with AI, use these prompts**:

```bash
# Check types
"Run: npx tsc --noEmit"
"Check for TypeScript errors in [file]"

# Format & lint
"Run: npm run lint --fix"
"Auto-format my code"

# Test
"Write unit tests for [component]"
"Run tests and fix failures"

# Build
"Build the project and report errors"
"Check if production build succeeds"
```

---

## ⚠️ Common Pitfalls (Avoid)

| Pitfall | Why it's bad | Solution |
|---------|------------|----------|
| **No types** | Lost at refactor time | Always define `interface` for props/state |
| **Hardcoded colors** | Dark mode breaks | Use CSS variables (`var(--color-*)`) |
| **Zustand in components** | Tight coupling | Pass as props or via custom hooks |
| **Forget error handling** | Silent failures | Wrap async in try/catch, set error state |
| **No validation** | Bad data stored | Use Zod schema + React Hook Form |
| **render() everywhere** | Re-render hell | Use `useMemo`, memoize components |
| **Magic strings** | Hard to refactor | Use enums or constants |
| **Console.log in prod** | Leaks secrets | Use proper logging; remove debug logs |

---

## 🤝 Pair Programming with AI

### Effective Prompts

```
# ✅ Good (specific, actionable)
"Using the react-hook-form skill, add email validation to the customer form.
The field should reject non-RFC 5322 emails. Show the error below the input."

# ❌ Bad (vague, open-ended)
"Make the form better"
"Fix the validation"
```

### Review Loop

1. **You**: Request a feature + load relevant skills
2. **AI**: Generates code following project conventions
3. **You**: Review, run tests, spot issues
4. **AI**: Fix or explain reasoning
5. **You**: Commit with proper message

### Error Handling in Pair Sessions

```
AI generates code with an issue.

You: "This won't compile because [error]. Fix it."
AI: "You're right. Here's the corrected version..."

OR

You: "I'm stuck on [problem]. Load [skill] and help me."
AI: "Let me help. First, can you share [file/code]?"
```

---

## 📖 Additional Resources

| Resource | Link | When to use |
|----------|------|------------|
| **React 19 Docs** | https://react.dev | Learning React fundamentals |
| **Zustand Docs** | https://github.com/pmndrs/zustand | State management patterns |
| **React Hook Form** | https://react-hook-form.com/ | Form handling |
| **Zod Docs** | https://zod.dev | Schema validation |
| **Tailwind 4** | https://tailwindcss.com/docs | Styling reference |
| **Vite Docs** | https://vitejs.dev | Build tool reference |
| **Firebase Docs** | https://firebase.google.com/docs | Auth, Firestore, hosting |

---

## 🎯 Quick Reference: Skill Triggers

Paste these in your AI requests:

```
Load react-19 skill for: components, hooks, useState, composition
Load react-hook-form skill for: form validation, useForm, useWatch
Load zod skill for: input schemas, safeParse, error handling
Load zustand-5 skill for: state stores, actions, middleware
Load tailwind-4 skill for: Tailwind 4 CSS, dark mode, theme vars
Load typescript skill for: type safety, generics, interfaces
Load frontend-design skill for: UI/UX, component beautification
```

---

**Last updated**: May 2026  
**Version**: 1.0  
**Maintainer**: Development Team
