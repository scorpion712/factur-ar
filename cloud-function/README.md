# Cloud Function ARCA/AFIP — Multi-Tenant Invoice Generation

> Firebase Cloud Function para generar comprobantes electrónicos (facturas, notas de crédito) vía ARCA/AFIP para múltiples clientes POS.

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Deploy to Firebase
npm run deploy
```

---

## Description

This cloud function provides multi-tenant invoice generation for the Argentine tax authority (ARCA/AFIP). Each POS client has isolated credentials and can only access their own data.

### Supported Document Types

| Type | AFIP Code |
|------|----------|
| Factura A | 1 |
| Factura B | 6 |
| Factura C | 11 |
| Nota Crédito A | 3 |
| Nota Crédito B | 8 |
| Nota Crédito C | 13 |

---

## Architecture

```
src/
├── index.ts                    # Cloud Function handlers
├── functions/
│   ├── createVoucher.ts       # Voucher creation logic
│   └── registerClient.ts      # Client registration (admin)
├── services/
│   ├── afip.ts            # AFIP SDK integration
│   ├── client-auth.ts     # Multi-client authentication
│   ├── encryption.ts   # AES-256-CBC encryption
│   ├── errors.ts     # Custom error classes
│   ├── firestore.ts # Firestore operations
│   └── rate-limiter.ts
```

### Authentication Flow

```
Client Request
    │
    ▼
┌────────────────────┐
│ Internal Key Auth  │  (x-internal-key header)
└────────┬─────────┘
         │
         ▼
┌────────────────────┐
│ Client Auth      │  (clientId + apiKey)
└────────┬─────────┘
         │
         ▼
┌────────────────────┐
│ Fetch Config     │  (from Firestore)
└────────┬─────────┘
         │
         ▼
┌────────────────────┐
│ Decrypt Creds     │  (inside CF only)
└────────┬─────────┘
         │
         ▼
┌────────────────────┐
│ AFIP API Call    │
└────────┬─────────┘
         │
         ▼
Return CAE + QR
```

---

## Endpoints

### `createAFIPVoucher` — POST

Create an invoice/comprobante.

```bash
curl -X POST https://REGION-PROJECT.web.app/createAFIPVoucher \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -H "x-client-id: client_abc123" \
  -H "x-api-key: $CLIENT_API_KEY" \
  -d '{
    "voucherData": {
      "tipoFactura": "factura_a",
      "docTipo": "CUIT",
      "docNro": 30123456789,
      "items": [
        {
          "descripcion": "Product 1",
          "cantidad": 2,
          "precioUnitario": 100.00
        }
      ]
    }
  }'
```

### `registerClientHandler` — POST (Admin)

Register a new client. Use the same internal key.

```bash
curl -X POST https://REGION-PROJECT.web.app/registerClient \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "razonSocial": "Business Name SA",
    "CUIT": "30123456789",
    "puntoVenta": 1,
    "condicionIva": "RESPONSABLE_INSCRIPTO",
    "certificado": "-----BEGIN CERTIFICATE-----\n...",
    "privateKey": "-----BEGIN PRIVATE KEY-----\n...",
    "accessToken": "your-afip-access-token"
  }'
```

Response returns `clientId` and `apiKey`. **Store apiKey securely** — it won't be shown again.

### `healthCheck` — GET

Health check endpoint.

```bash
curl https://REGION-PROJECT.web.app/healthCheck
```

---

## Success Response

```typescript
{
  "CAE": "123456789012",
  "CAEFchVto": "20260330",
  "ptoVenta": 1,
  "nroCbte": 5,
  "qrData": "https://www.afip.gob.ar/fe/qr/?p=..."
}
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ARCA_MASTER_KEY` | Master encryption key (32+ bytes) | ✅ |
| `ARCA_ENCRYPTION_KEY` | Encryption key (32+ bytes) | ✅ |
| `INTERNAL_AFIP_API_KEY` | Internal API key | ✅ |
| `GOOGLE_APPLICATION_CREDENTIALS` | GCP service account JSON | ✅ |
| `AFIP_ACCESS_TOKEN` | AFIP token (fallback) | Optional |
| `NODE_ENV` | "production" or "test" | Optional |

Generate keys:

```bash
openssl rand -hex 32
```

---

## Security

### Isolation Model

- Each client has **unique** `clientId` and `apiKey`
- Credentials stored encrypted in Firestore with **client-specific** key
- Credentials decrypted **only inside** the Cloud Function
- API key compared with **timing-safe** comparison
- No credentials in logs

### Firestore Schema

```
/
├── clients/{clientId}/
│   ├── _config/
│   │   ├── apiKeyHash: "sha256..."
│   │   ├── active: true
│   │   └── afip: { encryptedCert, encryptedKey, ... }
│   └── vouchers/{year}/{month}/
│
├── voucherNumbers/{clientId}_{puntoVenta}_{tipoFactura}/
│
└── rateLimits/{clientId}/
```

---

## Deployment

```bash
# Build TypeScript
npm run build

# Deploy to Firebase
firebase deploy --only functions

# View logs
firebase functions:log createAFIPVoucher
```

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npx vitest --coverage
```

---

## Troubleshooting

### Error: "No autorizado"

Internal key is invalid. Check `x-internal-key` header.

### Error: "Client not found"

Client ID doesn't exist. Register via `registerClient` endpoint first.

### Error: "Invalid API key"

API key doesn't match. Check client API key.

### Error: "Rate limit exceeded"

Client exceeded requests per minute/day limit.

### Error: "AFIP API error"

Check CUIT registration, certificate validity, and AFIP status.

---

## Links

- [AFIP Documentation](https://www.afip.gob.ar/fe/)
- [Firebase Functions](https://firebase.google.com/docs/functions)
- [AFIP SDK](https://www.npmjs.com/package/@afipsdk/afip.js)

---


**Last Updated**: May 2026