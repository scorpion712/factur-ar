# FacturAr Admin — Customer Management Dashboard

**Web admin panel** for managing customers and their AFIP invoice generation credentials. Built with React 19, Vite, and Tailwind 4.

- **Target users**: Admin staff, customer onboarding teams
- **Key features**: Customer CRUD, certificate upload, payment tracking, plan management, POS registry
- **Deployment**: Vite SPA (static build) → Firebase Hosting or any static CDN
- **Status**: v0.0.0 (active development; see [Roadmap](#roadmap))

---

## 🚀 Quick Start (3 min)

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Check code quality
npm run lint
```

**First login**: Use test credentials from `.env` or Firestore emulator.

---

## 📋 Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Login/Auth** | ✅ Done | Firebase email/password, token in localStorage |
| **Customer List** | ✅ Done | Table with search, filter, pagination |
| **Customer CRUD** | ✅ Done | Create, read, edit, delete with validation |
| **Certificate Upload** | ✅ Done | .crt + .key files, PEM format validation |
| **Payment Status** | ✅ Done | Toggle `paymentValid` flag per customer |
| **Customer Detail** | 🔄 In progress | View payments, plans, POS, update status (see [specs/customer-detail.md](specs/customer-detail.md)) |

---

## 🏗️ Architecture

```
src/
├── pages/
│   ├── Login.tsx              # Auth entry point
│   ├── Dashboard.tsx          # Customer list
│   ├── CustomerForm.tsx       # Create/edit customer
│   └── CustomerDetail.tsx     # Detail view (coming soon)
├── components/
│   ├── CustomerTable.tsx      # Reusable table component
│   ├── CustomerFormFields.tsx # Form field logic
│   ├── Modal.tsx              # Generic modal
│   ├── Badge.tsx              # Status badges
│   └── ui/                    # Headless UI components
├── store/
│   ├── auth.ts               # Authentication state (Zustand)
│   ├── customers.ts          # Customer data (Zustand)
│   └── notifications.ts      # Toast/alerts (coming)
├── services/
│   ├── customer.service.ts   # API calls to Firestore
│   ├── firebase.ts           # Firebase setup
│   └── encryption.ts         # Cert/key encryption (if needed)
├── types/
│   ├── customer.ts           # Customer interface + enums
│   ├── forms.ts              # Form validation schemas (Zod)
│   └── api.ts                # API response types
├── hooks/
│   └── useCustomer.ts        # Custom hooks for customer ops
├── lib/
│   ├── utils.ts              # classname merging, helpers
│   └── constants.ts          # App-wide constants
└── styles/
    ├── globals.css           # Tailwind + CSS variables
    └── index.css
```

---

## 🎨 Design System

**Philosophy**: Minimal, modern, functional. Follows the PRD design specs.

### Colors (CSS Variables)

```css
--color-foreground:          #1a1a1a     /* Text */
--color-muted-foreground:    #6b7280     /* Dimmed text */
--color-background:          #fafafa     /* Page background */
--color-card:                #ffffff     /* Card/panel surface */
--color-border:              #e5e7eb     /* Dividers, borders */
--color-muted:               #f3f4f6     /* Subtle background */
--color-primary:             #2563eb     /* Interactive elements */
--color-success:             #059669     /* Success state */
--color-warning:             #d97706     /* Warning state */
--color-destructive:         #dc2626     /* Error, delete */
```

**Theme support**: Light mode by default; dark mode via `next-themes` (optional).

### Components (No UI Library)

- **Badges**: Status indicators (Activo/Inactivo, Válido/Pendiente)
- **Buttons**: Text, primary, destructive variants
- **Inputs**: Text, email, file, with error states
- **Tables**: Responsive, hoverable rows with actions
- **Modals**: Centered overlays with backdrop
- **Cards**: Rounded, bordered, shadowed containers

**Convention**: Inline `cn()` utility for className merging (via `clsx` + `tailwind-merge`).

---

## 🔄 State Management (Zustand 5)

### Auth Store

```typescript
useAuthStore()
  .user        // { uid, email, idToken }
  .login()     // (email, password) → Firebase
  .logout()    // Clear session
  .isLoading   // Boolean
```

### Customer Store

```typescript
useCustomerStore()
  .customers        // Customer[]
  .getCustomerById()
  .addCustomer()    // Create + sync Firestore
  .updateCustomer() // Patch + sync
  .deleteCustomer() // Remove (soft or hard)
  .isLoading
```

**Philosophy**: Stores are thin wrappers around Firestore. No complex derived state; prefer React component state for UI flags.

---

## 🎯 Common Tasks

### Adding a New Component

1. **Create file**: `src/components/YourComponent.tsx`
2. **Use TypeScript + React 19**:
   ```typescript
   interface YourComponentProps {
     data: string;
     onAction?: (value: string) => void;
   }

   export function YourComponent({ data, onAction }: YourComponentProps) {
     return <div>{data}</div>;
   }
   ```
3. **Import and use**: `import { YourComponent } from '../components/YourComponent'`
4. **Export from barrel** (if shared): Add to `components/index.ts`

### Adding a Form with Validation

1. **Define Zod schema**:
   ```typescript
   // types/forms.ts
   export const customerSchema = z.object({
     razonSocial: z.string().min(1, 'Required'),
     CUIT: z.string().regex(/^\d{11}$/, 'Must be 11 digits'),
   });
   ```
2. **Use React Hook Form**:
   ```typescript
   const { register, handleSubmit, formState: { errors } } = useForm({
     resolver: zodResolver(customerSchema),
     defaultValues: { razonSocial: '', CUIT: '' },
   });
   ```
3. **Bind inputs**:
   ```tsx
   <input {...register('razonSocial')} />
   {errors.razonSocial && <span className="text-red-600">{errors.razonSocial.message}</span>}
   ```

### Updating Firestore Services

1. **Edit `services/customer.service.ts`**
2. **Add method**:
   ```typescript
   async getPaymentHistory(customerId: string) {
     const ref = collection(db, 'customers', customerId, 'payments');
     return getDocs(query(ref, orderBy('date', 'desc')));
   }
   ```
3. **Call from store or page**
4. **Test with Firestore emulator** (`npm run dev` includes it)

---

## 🧪 Testing (Roadmap)

**Current**: Manual testing only.
**Planned**:
- **Vitest + React Testing Library**: Unit tests for components
- **Playwright**: E2E tests (login → create customer → verify)
- **Target**: >70% coverage

```bash
# Coming soon
npm run test
npm run test:watch
```

---

## 📦 Dependencies

| Package | Version | Use | Notes |
|---------|---------|-----|-------|
| **react** | 19.0.0 | UI framework | React Compiler (auto-memoization) |
| **vite** | 6.0.5 | Build tool | Fast HMR, native ESM |
| **typescript** | 5.6.2 | Type safety | Strict mode enabled |
| **tailwindcss** | 4.0.0 | Styling | No custom CSS plugins |
| **zustand** | 5.0.3 | State | Lightweight, immer-like updates |
| **react-hook-form** | 7.54.2 | Forms | Uncontrolled, performant |
| **zod** | 3.24.1 | Validation | Schema validation |
| **firebase** | 12.13.0 | Backend | Auth, Firestore |
| **react-router-dom** | 7.1.1 | Routing | SPA navigation |
| **lucide-react** | 0.469.0 | Icons | ~1500 SVG icons |

**No UI library** (Material, shadcn, etc.) — CSS variables + Tailwind only.

---

## 🔐 Security Checklist

- ✅ Password validation: 6-8 chars, 1 uppercase, 1 special, 1 number
- ✅ Session token in localStorage (JWT from Firebase)
- ✅ Logout clears token
- ✅ Sensitive files (.key, .crt) never logged
- ✅ Firebase Firestore rules enforce user isolation (admin only)
- ✅ No credentials in URL or form submission logs

**Next**: Add CORS, CSP headers, and X-Frame-Options headers in production build.

---

## 🚀 Deployment

### Firebase Hosting (Recommended)

```bash
# 1. Build
npm run build

# 2. Deploy
firebase deploy --only hosting

# 3. View logs
firebase hosting:list
```

### Static CDN (Netlify, Vercel, etc.)

```bash
npm run build  # Creates ./dist/
# Upload ./dist to CDN
```

**Environment**: Cloud Function URL hardcoded in Firestore emulator config. For production, set via environment variable or `.env.production`.

---

## 🛠️ Development Workflow

### Setup

```bash
npm install
npm run dev
# Open http://localhost:5173
# Vite auto-opens browser, HMR enabled
```

### Making Changes

1. **Edit code** → Vite HMR refreshes instantly
2. **Check types**: `npx tsc --noEmit` (background)
3. **Lint**: `npm run lint` before committing
4. **Commit**: Follow [conventional commits](https://www.conventionalcommits.org/)

### Before Pushing

```bash
npm run lint      # Fix issues: eslint --fix .
npm run build     # Verify production build works
git push          # Make sure branch is up to date with main
```

---

## 📚 Key Patterns

### Responsive Tables

```tsx
<div className="overflow-x-auto">
  <table className="w-full border-collapse">
    <thead>
      <tr className="border-b border-[var(--color-border)]">
        <th className="px-6 py-3 text-left font-medium">Name</th>
      </tr>
    </thead>
    <tbody>
      {items.map(item => (
        <tr key={item.id} className="border-b hover:bg-[var(--color-muted)]/30">
          <td className="px-6 py-4">{item.name}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Modal Patterns

```tsx
<Modal open={isOpen} onClose={() => setIsOpen(false)}>
  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
    <h2 className="text-xl font-bold">Confirm</h2>
    <p>Are you sure?</p>
    <button onClick={handleConfirm}>Confirm</button>
    <button onClick={() => setIsOpen(false)}>Cancel</button>
  </div>
</Modal>
```

### Form Validation

```tsx
const { control, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});

<input {...control.register('field')} />
{errors.field && <span className="text-red-600">{errors.field.message}</span>}
```

---

## 🐛 Debugging

### React DevTools

Install: [React DevTools Browser Extension](https://react-devtools-tutorial.vercel.app/)

### Zustand DevTools

Install: [Zustand DevTools Extension](https://github.com/chrisui/zustood)

### Firestore Emulator

Running `npm run dev` starts Firestore emulator on `localhost:8080`. Check:
```
http://localhost:4000/firestore
```

### Network Requests

Open **DevTools → Network** tab. Look for POST/GET to Firestore REST API.

---

## 📈 Roadmap

| Phase | Features | Status |
|-------|----------|--------|
| **V1 (Done)** | Login, customer list, CRUD, cert upload | ✅ |
| **V2 (Current)** | Customer detail page, payment history, plan management | 🔄 See [specs/customer-detail.md](specs/customer-detail.md) |
| **V3 (Planned)** | E2E tests, notifications, analytics | 📋 |
| **V4 (Future)** | Dark mode, i18n (ES/PT/EN), advanced filtering | 📋 |

---

## 🤝 Contributing

See [AGENTS.md](AGENTS.md) for AI-assisted development patterns and skills.

### Commit Style

```
feat(customers): add customer detail page
fix(auth): prevent token leak in console
docs(readme): update setup instructions
```

### Pull Requests

1. Branch off `develop`
2. Make changes
3. `npm run lint` ✅
4. `npm run build` ✅
5. Push + create PR with description
6. Link related issues

---

## 📞 Support

- **Questions**: Create an issue
- **Bugs**: Include steps to reproduce + browser/OS
- **Feature requests**: Open as discussion first

---

## 📄 References

| Doc | Link | When to read |
|-----|------|--------------|
| **Parent Project** | [`../README.md`](../README.md) | Architecture, deployment, monorepo setup |
| **Product Requirements** | [`PRD.md`](PRD.md) | Original specs, user stories, acceptance criteria |
| **Cloud Function API** | [`../cloud-function/README.md`](../cloud-function/README.md) | Endpoint specs, auth flows |
| **Customer Detail Spec** | [`specs/customer-detail.md`](specs/customer-detail.md) | Next feature (in progress) |

---

**Version**: 0.0.0  
**Last updated**: May 2026  
**Stack**: React 19 + Vite + TypeScript + Tailwind 4 + Zustand 5  
**License**: Proprietary (POS-Jero Inc.)
