# Cloud Function — ARCA/AFIP Invoice Generation API

**Firebase Cloud Function** for secure, multi-tenant electronic invoice generation via ARCA/AFIP (Argentine tax authority). 

- **Consumers**: POS systems, e-commerce platforms, webhook integrations
- **Supported docs**: Facturas A/B/C, Notas de Crédito A/B/C
- **Security**: Client isolation, AES-256 encryption, rate limiting, signed requests
- **Status**: v2.0.0 (production)

---

## 🚀 Quick Start (5 min)

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start Firebase emulator (includes Cloud Function)
npm run serve

# Run tests
npm test

# Deploy to Firebase
npm run deploy
```

**First invoice**: Call the API with test credentials (see [Testing](#testing) below).

---

## 📋 Core Features

| Feature | Details |
|---------|---------|
| **Multi-tenant** | Each client has isolated credentials, API key, encryption context |
| **ARCA/AFIP Integration** | Direct connection to AFIP; handles auth, voucher generation, CAE assignment |
| **Security** | Dual-key API auth, encrypted credential storage, timing-safe comparisons |
| **Rate Limiting** | Per-client quotas (requests/min, requests/day; configurable per client) |
| **Logging** | Audit trail in Firestore; no secrets logged |
| **Error Handling** | Detailed error messages; client-safe error codes |

---

## 🎯 Key Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/createAFIPVoucher` | POST | Client API key | Generate invoice/nota de crédito |
| `/registerClient` | POST | Internal key | Admin: Register new client (one-time) |
| `/healthCheck` | GET | None | Ping; verify function is live |

---

## 🏗️ Project Structure

```
src/
├── index.ts                   # Cloud Function entry point (handlers)
├── functions/
│   ├── createVoucher.ts      # Invoice generation logic
│   ├── registerClient.ts     # Client onboarding (admin)
│   └── healthCheck.ts        # Status endpoint
├── services/
│   ├── afip.ts               # AFIP SDK wrapper
│   ├── client-auth.ts        # Dual-key verification + rate limits
│   ├── encryption.ts         # AES-256-CBC decrypt/encrypt
│   ├── errors.ts             # Custom error classes
│   ├── firestore.ts          # DB ops (clients, vouchers, audit)
│   └── rate-limiter.ts       # In-memory quota tracking
├── types/
│   ├── client.ts             # Client interface
│   ├── voucher.ts            # VoucherRequest, VoucherResponse
│   └── api.ts                # HTTP request/response types
├── utils/
│   ├── validators.ts         # Input validation (Zod schemas)
│   ├── constants.ts          # App constants (doc types, etc.)
│   └── helpers.ts            # Utility functions
└── middleware/
    ├── auth.ts               # Header parsing, API key verification
    └── errorHandler.ts       # Unified error response

test/
├── unit/
│   ├── afip.test.ts
│   ├── encryption.test.ts
│   ├── rate-limiter.test.ts
│   └── validators.test.ts
├── integration/
│   ├── createVoucher.test.ts
│   ├── registerClient.test.ts
│   └── client-auth.test.ts
└── fixtures/
    ├── mock-afip.ts
    ├── mock-firestore.ts
    └── test-data.ts
```

---

## 🔐 Authentication & Authorization

### Internal Key (Admin API)

For `registerClient` — used by admin panel.

```bash
Header: x-internal-key: $INTERNAL_AFIP_API_KEY
```

**Verification**: Constant-time string comparison.

### Client API Key (Invoice Generation)

For `createAFIPVoucher` — used by POS systems.

```bash
Header: x-client-id: client_abc123
Header: x-api-key: secret_xyz789
```

**Flow**:
1. `x-client-id` → Fetch client config from Firestore
2. `x-api-key` → Hash and compare with stored `apiKeyHash` (constant-time)
3. Rate limit check (per-client quotas)
4. Decrypt credentials (inside function, not at rest)
5. Call AFIP API

**Never**: Return or log the raw API key.

---

## 📡 Endpoints

### 1. Create AFIP Voucher (Invoice)

**POST** `/createAFIPVoucher`

Generate an invoice or nota de crédito and fetch CAE from AFIP.

**Headers**:
```http
x-internal-key: [internal-key]          # OR
x-client-id: client_abc123
x-api-key: secret_xyz789
Content-Type: application/json
```

**Request Body**:
```json
{
  "voucherData": {
    "tipoFactura": "factura_a",
    "docTipo": "CUIT",
    "docNro": 30123456789,
    "conceptoFactura": 1,
    "dateVoucher": "2026-05-10",
    "dueDate": "2026-05-10",
    "items": [
      {
        "descripcion": "Producto 1",
        "cantidad": 2.0,
        "precioUnitario": 100.00,
        "alicuota": 21.0
      }
    ],
    "importeOtrosTributos": 0.0
  }
}
```

**Success Response (200)**:
```json
{
  "CAE": "12345678901",
  "CAEFchVto": "20260610",
  "ptoVenta": 1,
  "nroCbte": 42,
  "qrData": "https://www.afip.gob.ar/fe/qr/?p=..."
}
```

**Error Response (400/403/500)**:
```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Client exceeded daily request limit",
  "timestamp": "2026-05-10T14:30:00Z"
}
```

**Common Errors**:
| Code | Cause | Solution |
|------|-------|----------|
| `INVALID_API_KEY` | API key doesn't match | Verify `x-api-key` header |
| `CLIENT_NOT_FOUND` | Client doesn't exist | Register via `registerClient` first |
| `RATE_LIMIT_EXCEEDED` | Daily/minute quota hit | Wait or increase quota in Firestore |
| `AFIP_ERROR_XYZ` | AFIP API rejected request | Check AFIP status, cert validity, CUIT |
| `INTERNAL_ERROR` | Server issue | Contact devops; check logs |

---

### 2. Register Client (Admin)

**POST** `/registerClient`

Create a new client account. Called once during onboarding.

**Headers**:
```http
x-internal-key: [internal-key]
Content-Type: application/json
```

**Request Body**:
```json
{
  "razonSocial": "Empresa SA",
  "CUIT": "30123456789",
  "puntoVenta": 1,
  "condicionIva": "RESPONSABLE_INSCRIPTO",
  "certificado": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  "accessToken": "AFIP_token_xyz"
}
```

**Success Response (201)**:
```json
{
  "clientId": "client_abc123",
  "apiKey": "secret_xyz789",
  "message": "Client registered. Store apiKey securely — it won't be shown again."
}
```

**Error Response (400/409/500)**:
```json
{
  "code": "CLIENT_ALREADY_EXISTS",
  "message": "Client with CUIT 30123456789 already registered",
  "timestamp": "2026-05-10T14:30:00Z"
}
```

---

### 3. Health Check

**GET** `/healthCheck`

Verify function is live and database is accessible.

**Response (200)**:
```json
{
  "status": "ok",
  "timestamp": "2026-05-10T14:30:00Z",
  "firestoreOk": true
}
```

---

## 🗄️ Firestore Schema

```
/clients
  /{clientId}/
    _config/
      razonSocial: string
      CUIT: string
      puntoVenta: number
      condicionIva: string
      apiKeyHash: string                  # SHA256 of API key
      active: boolean
      createdAt: Timestamp
      updatedAt: Timestamp
      rateLimits: {
        requestsPerMinute: number         # Default: 10
        requestsPerDay: number            # Default: 1000
      }
      afip: {
        encryptedCertificate: string      # AES-256-CBC
        encryptedPrivateKey: string
        encryptedAccessToken: string
        puntoVenta: number
      }

  /{clientId}/vouchers/
    /{year}/
      /{month}/
        /{docType}__{nroCbte}: {
          tipoFactura: string
          docTipo: string
          docNro: string
          CAE: string
          CAEFchVto: string
          createdAt: Timestamp
          createdByIp: string
        }

/voucherNumbers
  /{clientId}_{puntoVenta}_{tipoFactura}: {
    lastNro: number
    updatedAt: Timestamp
  }

/rateLimits
  /{clientId}/
    requestsThisMinute: number
    requestsThisDay: number
    lastReset: Timestamp
    lastDayReset: Timestamp

/auditLog
  /{timestamp}_{uuid}: {
    action: string                        # "create_voucher", "register_client", etc.
    clientId: string
    success: boolean
    errorCode?: string
    timestamp: Timestamp
    ipAddress: string
  }
```

---

## 🔐 Security Details

### Encryption Model

```
Master Key (env: ARCA_MASTER_KEY)
├─ Client-specific key derived (HKDF)
└─ AES-256-CBC encrypt credentials
    └─ Store in Firestore
       └─ Decrypt only inside Cloud Function
```

**Why**: Even if Firestore is breached, credentials are useless without the master key (which is in Cloud Function environment, not in Firestore).

### Rate Limiting

```javascript
// Per-client quotas (configurable)
{
  requestsPerMinute: 10,
  requestsPerDay: 1000
}

// Tracking (in-memory, resets on function cold start)
{
  clientId: {
    minute: { count: 5, resetAt: Timestamp },
    day: { count: 450, resetAt: Timestamp }
  }
}
```

**Note**: In-memory is sufficient for most clients. For high-traffic clients, upgrade to Firestore-based tracking or Redis.

### Credential Handling

✅ **Do**:
- Decrypt credentials only when needed
- Use constant-time comparisons for API keys
- Log only metadata (clientId, action, success/failure)
- Rotate API keys periodically (admin task)

❌ **Never**:
- Log API keys, certificates, or private keys
- Store credentials in plaintext
- Return credentials to client
- Cache decrypted credentials across requests

---

## 🧪 Testing

### Unit Tests

```bash
npm test          # Run all tests (Vitest)
npm run test:watch
```

**Coverage**:
- Auth (API key verification, timing-safe comparisons)
- Encryption (AES-256-CBC)
- Validation (Zod schemas)
- Rate limiting
- Error handling

### Integration Tests

- Full request flow with Firestore emulator
- AFIP API mocked (returns known responses)
- Auth middleware + handler chain

### Test Files

```
test/
├── unit/
│   ├── encryption.test.ts      # AES-256 encrypt/decrypt
│   ├── client-auth.test.ts     # API key verification
│   ├── rate-limiter.test.ts    # Quota enforcement
│   └── validators.test.ts      # Input validation
├── integration/
│   ├── createVoucher.test.ts   # Full invoice flow
│   ├── registerClient.test.ts  # Onboarding
│   └── errorHandler.test.ts    # Error responses
└── fixtures/
    └── test-data.ts
```

### Running Tests Locally

```bash
npm test                    # Run all tests once
npm run test:watch         # Watch mode (auto-rerun)
npx vitest --coverage      # Coverage report
```

---

## 📦 Dependencies

| Package | Version | Use |
|---------|---------|-----|
| **firebase-admin** | 13.0.1 | Firestore + Cloud Function SDK |
| **firebase-functions** | 7.2.3 | CF runtime |
| **@afipsdk/afip.js** | 1.2.3 | AFIP API integration |
| **zod** | 3.22.0 | Input validation |
| **typescript** | 5.7.3 | Type safety (strict mode) |

---

## 🛠️ Development

### Setup

```bash
# Install Node 22+
node --version  # Should be v22+

# Install deps
npm install

# Start Firebase emulator
npm run serve
```

**Endpoints** (when running locally):
- Function: `http://localhost:5001/[project]/[region]/createAFIPVoucher`
- Firestore emulator: `http://localhost:8080`

### Making Changes

1. Edit `src/functions/` or `src/services/`
2. `npm run build` (TypeScript compilation)
3. Tests auto-run if watching: `npm run test:watch`
4. Restart emulator: `Ctrl+C` → `npm run serve`

### Environment Variables

**`.env.local`** (local development):
```bash
ARCA_MASTER_KEY=openssl rand -hex 32          # Generated
ARCA_ENCRYPTION_KEY=openssl rand -hex 32
INTERNAL_AFIP_API_KEY=test-internal-key
AFIP_ACCESS_TOKEN=test-afip-token
NODE_ENV=test
```

**Production** (Firebase Cloud Function → Project Settings → Environment Variables):
```bash
ARCA_MASTER_KEY=[production key]
ARCA_ENCRYPTION_KEY=[production key]
INTERNAL_AFIP_API_KEY=[production key]
AFIP_ACCESS_TOKEN=[production token]
NODE_ENV=production
```

Generate keys:
```bash
openssl rand -hex 32
```

---

## 🚀 Deployment

### Prerequisites

```bash
# Firebase CLI
npm install -g firebase-tools

# Auth
firebase login
firebase use [project-id]
```

### Deploy

```bash
# Build
npm run build

# Deploy function
firebase deploy --only functions

# View logs in real-time
firebase functions:log
```

### Verify Deployment

```bash
# Health check
curl https://[region]-[project].web.app/healthCheck

# Create test voucher (with valid client credentials)
curl -X POST https://[region]-[project].web.app/createAFIPVoucher \
  -H "x-client-id: [clientId]" \
  -H "x-api-key: [apiKey]" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **"No autorizado"** | Check `x-internal-key` (admin) or `x-api-key` (client); verify `.env` |
| **"Client not found"** | Register via `registerClient` endpoint first |
| **"Rate limit exceeded"** | Client quota hit; wait or increase in Firestore `rateLimits` doc |
| **"AFIP API error: no autorizado"** | AFIP certificate/key invalid; check PEM format, expiration, CUIT |
| **"Invalid input"** | Check request body against schema (see Zod errors); validate JSON |
| **Emulator won't start** | Kill process: `lsof -i :5001` → `kill -9 [PID]` |
| **Firebase auth fails locally** | Run `firebase login` and `firebase use [project]` |

**Logs**: `firebase functions:log` or check emulator console output.

---

## 📈 Performance

- **Typical latency**: 2-5 seconds (includes AFIP API call)
- **Cold start**: ~5s (first request after deploy)
- **Warm**: ~2s (subsequent requests)
- **Concurrency**: Default 1000 concurrent executions (Firebase limit)

**Optimization**:
- Minimize Firestore reads during voucher creation
- Cache client config in-memory (already done)
- Use async/await for AFIP API calls (non-blocking)

---

## 📚 References

| Doc | Link | When to read |
|-----|------|--------------|
| **Parent Project** | [`../README.md`](../README.md) | Architecture, monorepo, security model |
| **Spec** | [`SPEC.md`](SPEC.md) | Detailed functional requirements |
| **Admin Dashboard** | [`../factur-ar-admin/README.md`](../factur-ar-admin/README.md) | Client registration flow |
| **AFIP SDK** | https://www.npmjs.com/package/@afipsdk/afip.js | API docs, examples |
| **Firebase Functions** | https://firebase.google.com/docs/functions | Deployment, environment setup |

---

## 🤝 Contributing

### Commit Style

```
feat(afip): add support for nota de crédito
fix(auth): timing-safe API key comparison
test(rate-limiter): add edge case coverage
docs(readme): update deployment steps
```

### PR Checklist

- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] No secrets in code or logs
- [ ] Firestore rules reviewed (if changed)
- [ ] Changelog updated (if adding feature)

---

## 📄 License

Proprietary — POS-Jero Inc.

---

## 👥 Support

- **Issues**: Create a GitHub issue with reproducible steps
- **Logs**: Check Firebase Functions dashboard or `firebase functions:log`
- **AFIP help**: Contact AFIP support (https://www.afip.gob.ar/) or check AFIP SDK docs

---

**Version**: 2.0.0  
**Last updated**: May 2026  
**Stack**: Node 22 + TypeScript + Firebase Functions + AFIP SDK  
**Status**: Production
