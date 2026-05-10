# FacturAr — Multi-tenant Invoice Generation for Argentina

**Electronic invoice platform integrating ARCA/AFIP** for businesses in Argentina. Two-tier system: backend cloud functions handle secure invoice generation; admin dashboard manages customers and their AFIP credentials.

- **For end users**: Seamless invoice generation at checkout (not included here; managed by POS integrations)
- **For admins**: Manage customer accounts, certificates, payment status, plans, and points of sale
- **For developers**: REST API + TypeScript types, Firebase-native, single-tenant isolation

---

## 📁 Project Structure

| Workspace | Purpose | Tech Stack | Consumers |
|-----------|---------|-----------|-----------|
| **`cloud-function/`** | ARCA/AFIP invoice API (Firebase Cloud Function) | Node 22 + TypeScript + Firebase Admin | POS clients, web hook integrations |
| **`factur-ar-admin/`** | Admin dashboard (Vite React SPA) | React 19 + Vite + Tailwind 4 + Zustand 5 | Admin staff, customer onboarding |

**Monorepo management**: Git monorepo. Each project is independent; no shared npm packages yet.

---

## 🚀 Quick Start (5 min)

### Setup Cloud Function

```bash
cd cloud-function
npm install
npm run build
npm run serve  # Start Firebase emulator + function
```

**Tests**: `npm test` — Full coverage for auth, encryption, rate limiting, AFIP integration.

### Setup Admin Dashboard

```bash
cd factur-ar-admin
npm install
npm run dev    # Vite dev server, port 5173
npm run build  # Production build
npm run lint   # ESLint + TypeScript checks
```

**Browser**: Open http://localhost:5173 after `npm run dev`

---

## 🏗️ Architecture at a Glance

```
┌─────────────────────────────────────────────────┐
│         POS Client / Web Integration            │
└──────────────────┬──────────────────────────────┘
                   │
                   │ HTTP POST + API Key
                   ▼
┌────────────────────────────────┐
│  Cloud Function (Node 22)      │
│  ├─ Multi-tenant auth          │
│  ├─ AFIP credential isolation  │
│  ├─ Invoice generation         │
│  └─ Firestore logging          │
└────────────────────────────────┘
           ▲          │
           │          │ Read/Write
           │          ▼
    Firestore Database
           ▲
           │ Read/Write
           │
┌────────────────────────────────┐
│  Admin Dashboard (React 19)    │
│  ├─ Customer CRUD              │
│  ├─ Certificate upload         │
│  ├─ Payment tracking           │
│  └─ Plan management            │
└────────────────────────────────┘
```

---

## 📋 Common Tasks

### Add a New Customer (Admin)

1. Open dashboard → **Customers** → **Add Customer**
2. Fill: Razón Social, CUIT, IVA Condition, Access Token
3. Upload certificate (.crt) + private key (.key)
4. Click **Save** → Customer receives `clientId` + `apiKey`
5. Admin shares credentials securely with customer

### Generate an Invoice (POS Client)

```bash
curl -X POST https://[region]-[project].web.app/createAFIPVoucher \
  -H "x-internal-key: $INTERNAL_KEY" \
  -H "x-client-id: client_abc123" \
  -H "x-api-key: $CLIENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "voucherData": {
      "tipoFactura": "factura_a",
      "docTipo": "CUIT",
      "docNro": 30123456789,
      "items": [...]
    }
  }'
```

**Response**: CAE + QR code → Client displays on invoice PDF.

### Test Locally

**Cloud Function**:
```bash
cd cloud-function
npm run test          # Run all tests
npm run test:watch   # Watch mode
```

**Admin Dashboard**:
```bash
cd factur-ar-admin
npm run lint          # Check style + types
# (E2E tests in progress — see Roadmap)
```

---

## 🔐 Security Model

| Layer | Mechanism |
|-------|-----------|
| **Admin API** | Firebase Authentication (email + password) |
| **Client API** | Dual-key: `x-client-id` + `x-api-key` (API key hashed in Firestore) |
| **Credentials** | Encrypted at rest (AES-256); decrypted only inside Cloud Function |
| **Isolation** | Each client has unique encryption key + Firestore rules enforce client-only reads |
| **Rate limiting** | Per-client quotas: requests/min, requests/day (configurable) |

**Never**:
- ❌ Log credentials or API keys
- ❌ Return unencrypted credentials to client
- ❌ Store plaintext private keys

---

## 📊 Data Model Overview

### Customer (Admin tracks)

```typescript
interface Customer {
  id: string;                  // Unique ID (clientId)
  razonSocial: string;        // Company name
  CUIT: string;               // Tax ID (11 digits)
  puntoVenta: number;          // POS terminal number
  condicionIva: CondicionIva; // IVA status (RESPONSABLE_INSCRIPTO, etc.)
  active: boolean;             // Can use the API
  paymentValid: boolean;       // Payment status (billing)
  lastPaymentCheck?: Date;     // Last payment validation
  plan?: string;               // Subscription tier
  createdAt: Date;
  updatedAt: Date;
}
```

### Invoice (Cloud Function generates)

```typescript
interface VoucherResponse {
  CAE: string;                 // AFIP authorization code
  CAEFchVto: string;          // CAE validity date (YYYYMMDD)
  ptoVenta: number;            // POS number
  nroCbte: number;             // Invoice number assigned by AFIP
  qrData: string;              // Full QR URL for PDF
}
```

---

## 🧪 Testing Strategy

### Cloud Function

- **Unit tests**: Auth, encryption, rate limiting, Firestore operations
- **Integration tests**: Full request flow with Firestore emulator
- **Mock AFIP**: Stubbed responses; real AFIP calls in staging only
- **Coverage target**: >85%

**Run**: `npm test`

### Admin Dashboard

- **Component tests**: Form validation, state updates, UI interactions (coming soon)
- **E2E tests**: Login → Create customer → View details (coming soon)

---

## 📚 Guides & References

| Document | Location | When to read |
|----------|----------|--------------|
| **Cloud Function Details** | `cloud-function/README.md` | Deploying, endpoints, environment variables |
| **Admin Dashboard Guide** | `factur-ar-admin/README.md` | Building components, styling, state management |
| **Cloud Function SPEC** | `cloud-function/SPEC.md` | Detailed functional requirements |
| **Admin PRD** | `factur-ar-admin/PRD.md` | Original product requirements |

---

## 🔧 Development Setup

### Prerequisites

- Node 22+ (check with `node --version`)
- npm or yarn
- Git
- Firebase CLI (for emulator): `npm install -g firebase-tools`

### Environment Files

**cloud-function/.env**:
```bash
ARCA_MASTER_KEY=<32-byte hex>          # openssl rand -hex 32
ARCA_ENCRYPTION_KEY=<32-byte hex>
INTERNAL_AFIP_API_KEY=<secret>
AFIP_ACCESS_TOKEN=<token>              # Optional; use via ARCA
NODE_ENV=test                          # or "production"
```

**factur-ar-admin**: No .env needed for local dev (uses Firebase emulator).

### Commands Reference

**Cloud Function**:
```bash
npm run build          # Compile TypeScript
npm run serve         # Start emulator
npm test              # Run tests (vitest)
npm run deploy        # Deploy to Firebase
npm run logs          # View live logs
```

**Admin Dashboard**:
```bash
npm run dev           # Start Vite dev server
npm run build         # Build for production
npm run lint          # ESLint + TypeScript
npm run preview       # Preview production build locally
```

---

## 🤝 Contributing

### Branch Strategy

- `main` — production-ready
- `develop` — integration branch (feature PRs merge here first)
- `feature/*` — individual features (`feature/customer-detail-page`)
- `bugfix/*` — bug fixes (`bugfix/payment-validation`)

### Commit Style

```
type(scope): description

feat(customers): add customer detail page with payment history
fix(auth): prevent API key leaks in error logs
docs(cloud-function): update deployment guide
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### PR Checklist

- [ ] Feature branch off `develop`
- [ ] Tests pass locally (`npm test`)
- [ ] ESLint passes (`npm run lint`)
- [ ] No hardcoded secrets or credentials
- [ ] PR description explains what and why (not just code)
- [ ] Link to relevant issue or PRD

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **"No autorizado" when calling API** | Check `x-internal-key` header; verify in `.env` |
| **"Client not found"** | Register via admin dashboard first; verify `x-client-id` |
| **Certificate upload fails** | File must be PEM format (.crt); max 5MB |
| **AFIP API errors (timeout, "no autorizado")** | AFIP may be down; check status page; verify cert/key valid |
| **Emulator won't start** | Kill existing Firebase process; try `npm run serve` again |

---

## 📈 Roadmap

| Phase | Goal | Status |
|-------|------|--------|
| **V1** | Core invoicing + admin dashboard | ✅ In production |
| **V2** | Payment history, plan management, POS registry | 🔄 In progress (see [Customer Detail Spec](factur-ar-admin/specs/customer-detail.md)) |
| **V3** | E2E testing, webhook integrations | 📋 Planned |
| **V4** | Multi-language (ES/PT/EN), analytics | 📋 Future |

---

## 📄 License

Proprietary — POS-Jero Inc.

---

## 👥 Support

- **Questions**: Create an issue in this repo
- **Production issues**: Contact devops@[company].com
- **AFIP integration help**: See AFIP SDK docs at https://www.npmjs.com/package/@afipsdk/afip.js

---

**Last updated**: May 2026  
**Maintainers**: Development Team  
**Repository**: https://github.com/POS-Jero/factur-ar
