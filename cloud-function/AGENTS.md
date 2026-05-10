# AI Development Patterns — Cloud Function

> This guide documents AI-assisted development patterns, conventions, and skills for this project.  
> **When**: Use this as reference when pairing with AI on features, refactoring, or debugging.  
> **Who**: Developers, backend engineers, AI assistants.

---

## 🤖 Project Profile

| Aspect | Details |
|--------|---------|
| **Type** | Firebase Cloud Function (Node 22 backend) |
| **Scale** | ~500 LOC (focused, single responsibility) |
| **Patterns** | Functional, async/await, Zod validation, custom error handling |
| **Database** | Firestore (admin SDK) |
| **External APIs** | AFIP SDK (Argentine tax authority) |
| **Encryption** | AES-256-CBC (credential isolation) |
| **Testing** | Vitest + Firestore emulator + mocked AFIP |

---

## 🎯 AI-Friendly Practices

### 1. Use Skill Triggers

When working with AI on this project, reference these skill names:

| Skill | Trigger | When to load |
|-------|---------|--------------|
| **nodejs-backend-patterns** | Building Express/Fastify APIs, middleware, auth | Building request handlers |
| **nodejs-best-practices** | Framework selection, async patterns, error handling | Architecture decisions |
| **typescript** | Type safety, interfaces, strict mode | Writing types |
| **zod** | Input validation schemas, safeParse | Adding request validation |
| **security-checks** | Authentication, encryption, rate limiting | Security-critical code |

**Example request**:
```
Load the nodejs-backend-patterns skill, then help me add 
error middleware to catch all async errors and return safe responses.
```

### 2. Type-First Development

Always define types for request/response, internal state, and Firestore documents.

```typescript
// ✅ Good: Types first
interface VoucherRequest {
  voucherData: {
    tipoFactura: string;
    docTipo: string;
    docNro: number;
    items: VoucherItem[];
  };
}

interface VoucherResponse {
  CAE: string;
  CAEFchVto: string;
  ptoVenta: number;
  nroCbte: number;
  qrData: string;
}

interface ClientConfig {
  razonSocial: string;
  CUIT: string;
  apiKeyHash: string;
  afip: {
    encryptedCertificate: string;
    encryptedPrivateKey: string;
  };
  rateLimits: { requestsPerMinute: number; requestsPerDay: number };
  active: boolean;
}

// ❌ Bad: No types, magic strings
const createVoucher = (req, res) => {
  const { tipoFactura, docNro, items } = req.body;
  // ...
}
```

### 3. Single Responsibility (Layered Architecture)

```
┌─────────────────────┐
│   HTTP Handlers     │  (index.ts, functions/*.ts)
│   ├─ Parse request  │
│   ├─ Validate input │
│   └─ Call service   │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│     Services        │  (services/*.ts)
│   ├─ Business logic │
│   ├─ AFIP calls     │
│   ├─ Firestore ops  │
│   └─ Encryption     │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   External APIs     │  (firebase, AFIP SDK)
│   ├─ Firestore      │
│   └─ AFIP           │
└─────────────────────┘
```

**Rules**:
- **Handlers** (HTTP) → parse + validate + call service, return response
- **Services** (business logic) → pure functions or async operations
- **Utils** → helpers, constants, validators (Zod schemas)
- **Middleware** → auth, error handling, logging (cross-cutting concerns)

### 4. Request Validation Pattern (Zod)

```typescript
// 1. Define schema (types/voucher.ts or utils/validators.ts)
import { z } from 'zod';

export const voucherRequestSchema = z.object({
  voucherData: z.object({
    tipoFactura: z.string().refine((val) => TIPO_FACTURA_OPTIONS.includes(val)),
    docTipo: z.string(),
    docNro: z.number().int().positive(),
    items: z.array(
      z.object({
        descripcion: z.string(),
        cantidad: z.number().positive(),
        precioUnitario: z.number().positive(),
      })
    ),
  }),
});

// 2. Parse in handler
export async function createAFIPVoucher(req, res) {
  try {
    const payload = voucherRequestSchema.parse(req.body);
    // Safe to use payload — types guaranteed
    const result = await voucherService.create(payload.voucherData);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ code: 'INVALID_INPUT', issues: err.errors });
    }
    // Handle other errors...
  }
}
```

### 5. Error Handling Pattern

```typescript
// 1. Custom error class (services/errors.ts)
export class VoucherError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'VoucherError';
  }
}

export class RateLimitError extends VoucherError {
  constructor() {
    super('RATE_LIMIT_EXCEEDED', 'Client exceeded rate limit', 429);
  }
}

// 2. Service throws custom errors
async function verifyApiKey(clientId: string, apiKey: string): Promise<void> {
  const client = await getClientConfig(clientId);
  if (!client) {
    throw new VoucherError('CLIENT_NOT_FOUND', `Client ${clientId} not found`, 404);
  }
  if (!timingSafeCompare(apiKey, client.apiKeyHash)) {
    throw new VoucherError('INVALID_API_KEY', 'API key mismatch', 403);
  }
}

// 3. Handler catches and responds
export async function createAFIPVoucher(req, res) {
  try {
    const { clientId, apiKey } = extractHeaders(req);
    await verifyApiKey(clientId, apiKey);
    // ... rest of handler
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof VoucherError) {
      return res.status(err.statusCode).json({
        code: err.code,
        message: err.message,
      });
    }
    // Fallback for unexpected errors
    console.error('[Unhandled Error]', err);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  }
}
```

**Never log secrets**: API keys, certificates, private keys, tokens.

### 6. Async/Await Best Practices

```typescript
// ✅ Good: Concurrent operations
async function createVoucher(voucherData) {
  // Parallel: fetch client config and decrypt credentials
  const [clientConfig, nextVoucherNumber] = await Promise.all([
    getClientConfig(clientId),
    getNextVoucherNumber(clientId, puntoVenta, tipoFactura),
  ]);

  const credentials = decryptCredentials(clientConfig.afip);
  // ... proceed with AFIP call
}

// ❌ Bad: Sequential when could be parallel
async function createVoucher(voucherData) {
  const clientConfig = await getClientConfig(clientId);
  const nextVoucherNumber = await getNextVoucherNumber(clientId, puntoVenta, tipoFactura);
  // Both awaited sequentially — slower
}

// ❌ Bad: Unhandled promise rejection
async function createVoucher(voucherData) {
  const afipCall = afipService.createVoucher(data); // No await
  // If this rejects, error is unhandled
}
```

### 7. Firestore Operations Pattern

```typescript
// ✅ Good: Transaction for consistency
async function createVoucher(clientId, voucherData) {
  return db.runTransaction(async (transaction) => {
    // 1. Read current voucher number (atomic)
    const voucherNumberDoc = await transaction.get(
      doc(db, 'voucherNumbers', `${clientId}_${ptoVenta}_${tipoFactura}`)
    );
    const lastNro = voucherNumberDoc.data()?.lastNro || 0;
    const nroCbte = lastNro + 1;

    // 2. Call AFIP with new number
    const afipResult = await afipService.createVoucher({
      ...voucherData,
      nroCbte,
    });

    // 3. Update voucher number (transaction write)
    transaction.update(voucherNumberDoc.ref, { lastNro: nroCbte });

    // 4. Store voucher in audit trail
    const voucherRef = doc(
      db,
      'clients',
      clientId,
      'vouchers',
      `${afipResult.CAE}_${nroCbte}`
    );
    transaction.set(voucherRef, {
      tipoFactura: voucherData.tipoFactura,
      CAE: afipResult.CAE,
      createdAt: Timestamp.now(),
    });

    return afipResult;
  });
}

// ✅ Good: Batch write for multiple documents
async function auditLog(action, clientId, success, errorCode?) {
  const batch = writeBatch(db);
  const logRef = doc(db, 'auditLog', `${Date.now()}_${randomId()}`);
  batch.set(logRef, {
    action,
    clientId,
    success,
    errorCode,
    timestamp: Timestamp.now(),
  });
  await batch.commit();
}
```

### 8. Rate Limiting Pattern

```typescript
// ✅ Good: In-memory cache with reset logic
class RateLimiter {
  private limits: Map<string, { minute: number; day: number; resetMin: number; resetDay: number }> = new Map();

  checkLimit(clientId: string, config: RateLimitConfig): void {
    const now = Date.now();
    let entry = this.limits.get(clientId);

    if (!entry) {
      entry = { minute: 0, day: 0, resetMin: now + 60000, resetDay: now + 86400000 };
      this.limits.set(clientId, entry);
    }

    // Reset if interval expired
    if (now > entry.resetMin) {
      entry.minute = 0;
      entry.resetMin = now + 60000;
    }
    if (now > entry.resetDay) {
      entry.day = 0;
      entry.resetDay = now + 86400000;
    }

    // Check quotas
    if (entry.minute >= config.requestsPerMinute) {
      throw new RateLimitError('Minute limit exceeded');
    }
    if (entry.day >= config.requestsPerDay) {
      throw new RateLimitError('Day limit exceeded');
    }

    // Increment
    entry.minute++;
    entry.day++;
  }
}
```

---

## 📝 Code Review Checklist

- [ ] **Types**: All functions have input/output types; no `any`
- [ ] **Validation**: Zod schema validates all external input
- [ ] **Error handling**: Custom errors with proper status codes; never expose internals
- [ ] **Security**: No secrets in logs; API keys hashed; timing-safe comparisons
- [ ] **Async**: Promise.all for parallel ops; proper error propagation
- [ ] **Transactions**: Firestore writes use transaction/batch for consistency
- [ ] **Tests**: Unit + integration tests for all major functions
- [ ] **Logging**: Debug logs removed; audit logs structured
- [ ] **Comments**: Explain WHY, not WHAT (code is self-documenting)

---

## 🧪 Testing Patterns

### Unit Test (Vitest)

```typescript
// test/unit/rate-limiter.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../../src/services/rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  it('allows requests within quota', () => {
    const config = { requestsPerMinute: 10, requestsPerDay: 100 };
    expect(() => {
      for (let i = 0; i < 10; i++) {
        limiter.checkLimit('client_1', config);
      }
    }).not.toThrow();
  });

  it('rejects request exceeding minute quota', () => {
    const config = { requestsPerMinute: 2, requestsPerDay: 100 };
    limiter.checkLimit('client_1', config); // 1st
    limiter.checkLimit('client_1', config); // 2nd
    expect(() => limiter.checkLimit('client_1', config)).toThrow('Minute limit');
  });
});
```

### Integration Test (Firestore Emulator)

```typescript
// test/integration/createVoucher.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { createAFIPVoucher } from '../../src/functions/createVoucher';

describe('createAFIPVoucher (integration)', () => {
  let db;

  beforeEach(() => {
    const app = initializeApp({ projectId: 'test-project' });
    db = getFirestore(app);
    connectFirestoreEmulator(db, 'localhost', 8080);
  });

  it('creates voucher and stores in Firestore', async () => {
    const req = {
      headers: {
        'x-client-id': 'test_client',
        'x-api-key': 'test_key',
      },
      body: {
        voucherData: { /* ... */ }
      }
    };

    const res = { status: (code) => ({ json: (data) => ({ code, data }) }) };
    const result = await createAFIPVoucher(req, res);

    expect(result.code).toBe(200);
    expect(result.data).toHaveProperty('CAE');
  });
});
```

---

## 🚀 Development Workflow with AI

### Feature Implementation

1. **Define types + schema**
   ```
   AI: Create TypeScript types + Zod schema for [endpoint]
   ```

2. **Build validation**
   ```
   AI: Add Zod validation and error handling for [input]
   ```

3. **Build service logic**
   ```
   AI: Implement [service function] with [requirements]
   ```

4. **Build handler**
   ```
   AI: Build HTTP handler for [endpoint] using the service
   ```

5. **Test + verify**
   ```
   npm test && npm run build
   ```

### Debugging with AI

```
I'm getting [error]. Here's the handler: [code].
Load the nodejs-backend-patterns skill and help me fix it.
```

---

## 📚 Key Patterns & Conventions

| Pattern | File | When to use |
|---------|------|------------|
| Custom errors | `src/services/errors.ts` | Throw from services; catch in handlers |
| Zod validation | `src/utils/validators.ts` | Validate all request bodies |
| Firestore ops | `src/services/firestore.ts` | Abstract DB logic; use transactions |
| Encryption | `src/services/encryption.ts` | Encrypt/decrypt sensitive data |
| Rate limiting | `src/services/rate-limiter.ts` | Check quotas before processing |
| Middleware | `src/middleware/` | Auth, error handling, logging |

---

## 🔧 Useful Commands (with AI)

```bash
# Check types
"Run: npx tsc --noEmit"

# Run tests
"Run: npm test"
"Run: npm run test:watch"
"Add test coverage: npx vitest --coverage"

# Build & deploy
"Run: npm run build && firebase deploy --only functions"
"Check logs: firebase functions:log"
```

---

## ⚠️ Common Pitfalls (Avoid)

| Pitfall | Why it's bad | Solution |
|---------|------------|----------|
| **No type checking** | Runtime errors in production | Use TypeScript strict mode |
| **Unvalidated input** | Malformed requests crash function | Use Zod; validate early |
| **Logging secrets** | Credentials leak in logs | Never log API keys, certs, tokens |
| **Sequential async** | Slow performance | Use Promise.all for parallel ops |
| **No error codes** | Hard to debug on client | Use custom errors with codes |
| **Missing transactions** | Data inconsistency | Use transaction for multi-step operations |
| **No rate limiting** | DDoS vulnerability | Check quotas; enforce per-client limits |
| **Hardcoded constants** | Hard to change | Use utils/constants.ts |

---

## 🤝 Pair Programming with AI

### Effective Prompts

```
# ✅ Good (specific)
"Load nodejs-backend-patterns. I need to add rate limiting middleware
that checks per-client quotas. Here's my current handler: [code]"

# ❌ Bad (vague)
"Make this faster"
"Fix the errors"
```

---

## 📖 Additional Resources

| Resource | Link |
|----------|------|
| **Node.js Best Practices** | https://nodejs.org/en/docs/ |
| **Zod Docs** | https://zod.dev |
| **Firebase Functions** | https://firebase.google.com/docs/functions |
| **Firestore Emulator** | https://firebase.google.com/docs/emulator-suite |
| **AFIP SDK** | https://www.npmjs.com/package/@afipsdk/afip.js |

---

## 🎯 Quick Reference: Skill Triggers

```
Load nodejs-backend-patterns for: middleware, request handlers, async patterns
Load nodejs-best-practices for: architecture, error handling, security
Load typescript for: type safety, interfaces, generics
Load zod for: input validation, parsing, error messages
Load security-checks for: auth, encryption, rate limiting, credential handling
```

---

**Last updated**: May 2026  
**Version**: 1.0  
**Maintainer**: Development Team
