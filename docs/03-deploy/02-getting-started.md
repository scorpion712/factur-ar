# Getting Started — ARCA/AFIP Cloud Function

> Complete step-by-step guide to set up, configure, and test the multi-tenant invoice generation system using curl from your terminal.

---

## Overview

```
Admin workstation                    Cloud Functions (Firebase)
┌──────────────────────┐          ┌──────────────────────────────────┐
│ 1. Generate keys      │          │                                  │
│ 2. Encrypt certs/key  │          │                                  │
│ 3. Register clients ────────────→ registerClientHandler             │
│                       │          │     ↓ Firestore                  │
│                       │          │                                  │
│ Client 1 (POS App)    │          │                                  │
│ 4. Create invoice ───────────────→ createAFIPVoucher                │
│                       │          │     ↓ AFIP → CAE                 │
│ Client 2 (POS App)    │          │     ↓ Firestore                  │
│ 5. Create invoice ───────────────→ createAFIPVoucher                │
│                       │          └──────────────────────────────────┘
└──────────────────────┘
```

---

## Step 1 — Environment Setup

### Generate Keys

```bash
# Generate 3 independent random keys (32 bytes hex = 64 chars each)
openssl rand -hex 32
# → copy output → ARCA_MASTER_KEY

openssl rand -hex 32
# → copy output → ARCA_ENCRYPTION_KEY

openssl rand -hex 32
# → copy output → INTERNAL_AFIP_API_KEY
```

### Create `.env` file

```bash
# .env — DO NOT COMMIT THIS FILE
ARCA_MASTER_KEY=<output-from-first-openssl>
ARCA_ENCRYPTION_KEY=<output-from-second-openssl>
INTERNAL_AFIP_API_KEY=<output-from-third-openssl>
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"your-project",...}
NODE_ENV=test
```

### Get GCP Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com) → IAM → Service Accounts
2. Download a JSON key for your service account
3. Set `GOOGLE_APPLICATION_CREDENTIALS` as a single-line JSON string

---

## Step 2 — Start Local Functions

```bash
npm run serve
# → Function URL: http://localhost:5001/region/project/us-central1/createAFIPVoucher
```

Take note of the base URL — you'll use it in every curl command below. Let's save it:

```bash
BASE_URL=http://localhost:5001/us-central1
INTERNAL_KEY=<your-INTERNAL_AFIP_API_KEY>
```

---

## Step 3 — Encrypt Client Credentials

Before registering, encrypt each client's AFIP certificate and key **locally**. The system never accepts raw credentials.

### Option A — Use the built-in script

```bash
# Edit scripts/encrypt-client-credentials.ts with your cert paths and run:
npx tsx scripts/encrypt-client-credentials.ts
# → outputs: encryptedCert, encryptedKey, encryptedAccessToken
```

### Option B — Manual one-liner (macOS/Linux)

```bash
# Replace MASTER_KEY and the raw cert strings, then run:
MASTER_KEY=<your-ARCA_MASTER_KEY>
KEY_BUF=$(printf '%-32s' "$MASTER_KEY" | head -c 32)
ENCRYPTED_CERT=$(echo -n "$(cat cert.pem)" | openssl enc -aes-256-cbc -A -a -K $(echo -n "$KEY_BUF" | xxd -p) -iv 0 | base64)
ENCRYPTED_KEY=$(echo -n "$(cat key.pem)" | openssl enc -aes-256-cbc -A -a -K $(echo -n "$KEY_BUF" | xxd -p) -iv 0 | base64)
ENCRYPTED_TOKEN=$(echo -n "your-afip-access-token" | openssl enc -aes-256-cbc -A -a -K $(echo -n "$KEY_BUF" | xxd -p) -iv 0 | base64)
```

> **Important:** Both the IV (first 32 hex chars) and the ciphertext are base64 encoded. The cloud function expects this exact format.

---

## Step 4 — Register a Client

```bash
curl -X POST "$BASE_URL/registerClientHandler" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "razonSocial": "Tienda Mi Jefa SA",
    "CUIT": "20393425920",
    "puntoVenta": 1,
    "condicionIva": "RESPONSABLE_INSCRIPTO",
    "encryptedCert": "<output-from-encryption-step>",
    "encryptedKey": "<output-from-encryption-step>",
    "encryptedAccessToken": "<output-from-encryption-step>"
  }'
```

**Successful response:**
```json
{
  "success": true,
  "data": {
    "clientId": "client_abc1234def5678",
    "apiKey": "a1b2c3d4e5f6...",
    "message": "Client registered. Save apiKey - it won't be shown again."
  }
}
```

> **⚠️ Save the `apiKey`** — it won't be shown again. The `clientId` is public, but `apiKey` is the secret.

---

## Step 5 — Create an Invoice (Voucher)

Once registered, clients create invoices by sending their `clientId`, `apiKey`, and `voucherData`.

### Factura A (with IVA)

```bash
curl -X POST "$BASE_URL/createAFIPVoucher" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "clientId": "client_abc1234def5678",
    "apiKey": "a1b2c3d4e5f6...",
    "voucherData": {
      "tipoFactura": "factura_a",
      "docTipo": "CUIT",
      "docNro": 20123456789,
      "items": [
        {"descripcion": "Producto A", "cantidad": 2, "precioUnitario": 1210.00},
        {"descripcion": "Servicio B", "cantidad": 1, "precioUnitario": 605.00}
      ],
      "descuento": 0
    }
  }'
```

> Note: `factura_a` includes 21% IVA automatically. The prices above include tax (1210 = 1000 + 210).

### Factura B (with IVA, consumer)

```bash
curl -X POST "$BASE_URL/createAFIPVoucher" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "clientId": "client_abc1234def5678",
    "apiKey": "a1b2c3d4e5f6...",
    "voucherData": {
      "tipoFactura": "factura_b",
      "docTipo": "DNI",
      "docNro": 12345678,
      "items": [
        {"descripcion": "Venta minorista", "cantidad": 1, "precioUnitario": 1210.00}
      ],
      "descuento": 0
    }
  }'
```

### Factura C (sin IVA)

```bash
curl -X POST "$BASE_URL/createAFIPVoucher" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "clientId": "client_abc1234def5678",
    "apiKey": "a1b2c3d4e5f6...",
    "voucherData": {
      "tipoFactura": "factura_c",
      "docTipo": "CUIT",
      "docNro": 20123456789,
      "items": [
        {"descripcion": "Producto exento", "cantidad": 1, "precioUnitario": 1000.00}
      ],
      "descuento": 0
    }
  }'
```

### Nota de Crédito A (credit note for Factura A)

```bash
curl -X POST "$BASE_URL/createAFIPVoucher" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "clientId": "client_abc1234def5678",
    "apiKey": "a1b2c3d4e5f6...",
    "voucherData": {
      "tipoFactura": "nota_credito_a",
      "docTipo": "CUIT",
      "docNro": 20123456789,
      "items": [
        {"descripcion": "Devolución producto", "cantidad": 1, "precioUnitario": 1210.00}
      ],
      "descuento": 0,
      "nroAsociado": 5
    }
  }'
```

> `nroAsociado` is the invoice number being credited.

### Factura A con descuento

```bash
curl -X POST "$BASE_URL/createAFIPVoucher" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{
    "clientId": "client_abc1234def5678",
    "apiKey": "a1b2c3d4e5f6...",
    "voucherData": {
      "tipoFactura": "factura_a",
      "docTipo": "CUIT",
      "docNro": 20123456789,
      "items": [
        {"descripcion": "Producto con descuento", "cantidad": 1, "precioUnitario": 1210.00}
      ],
      "descuento": 10
    }
  }'
```

> `descuento: 10` applies 10% off the subtotal before tax calculation.

**Successful response:**
```json
{
  "CAE": "12345678901234",
  "CAEFchVto": "20260630",
  "ptoVenta": 1,
  "nroCbte": 6,
  "qrData": "https://www.afip.gob.ar/fe/qr/?p=...",
  "tipoFactura": 1,
  "numero": 6
}
```

**Error response:**
```json
{
  "error": "VALIDATION_ERROR",
  "details": {"code": "VALIDATION_ERROR", "message": "items must contain at least 1 item"}
}
```

---

## Step 6 — Error Handling

### Missing x-internal-key → 401

```bash
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/createAFIPVoucher" \
  -H "Content-Type: application/json" \
  -d '{"clientId":"x","apiKey":"x","voucherData":{}}'
# → 401
```

### Missing clientId/apiKey → 400

```bash
curl -s "$BASE_URL/createAFIPVoucher" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{"voucherData":{}}'
# → {"error":"Bad Request","message":"Missing clientId or apiKey"}
```

### Invalid bill type → 400

```bash
curl -s "$BASE_URL/createAFIPVoucher" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d '{"clientId":"x","apiKey":"x","voucherData":{"tipoFactura":"invalid"}}'
# → {"error":"VALIDATION_ERROR","details":{...}}
```

### Health check

```bash
curl -s "$BASE_URL/healthCheck"
# → {"status":"healthy","timestamp":1712345678901}
```

---

## Step 7 — Full Multi-Tenant Flow (Two Clients)

```bash
# === CLIENT 1 SETUP ===
# Encrypt Client 1 certs
CLIENT1_CERT_ENC=$(echo "-----BEGIN CERT-----" | openssl enc -aes-256-cbc -A -a -K $(printf '%-32s' "$MASTER_KEY" | head -c 32 | xxd -p) -iv 0 | base64)
CLIENT1_KEY_ENC=$(echo "-----BEGIN KEY-----" | openssl enc -aes-256-cbc -A -a -K $(printf '%-32s' "$MASTER_KEY" | head -c 32 | xxd -p) -iv 0 | base64)

# Register Client 1
RESP1=$(curl -s -X POST "$BASE_URL/registerClientHandler" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d "{\"razonSocial\":\"Tienda Norte SA\",\"CUIT\":\"30123456789\",\"puntoVenta\":1,\"condicionIva\":\"RESPONSABLE_INSCRIPTO\",\"encryptedCert\":\"$CLIENT1_CERT_ENC\",\"encryptedKey\":\"$CLIENT1_KEY_ENC\",\"encryptedAccessToken\":\"$CLIENT1_CERT_ENC\"}")
echo "Client 1: $RESP1"

# Extract Client 1 credentials
CLIENT1_ID=$(echo $RESP1 | grep -o '"clientId":"[^"]*' | cut -d'"' -f4)
CLIENT1_KEY=$(echo $RESP1 | grep -o '"apiKey":"[^"]*' | cut -d'"' -f4)

# === CLIENT 2 SETUP ===
# Encrypt Client 2 certs
CLIENT2_CERT_ENC=$(echo "-----BEGIN CERT2-----" | openssl enc -aes-256-cbc -A -a -K $(printf '%-32s' "$MASTER_KEY" | head -c 32 | xxd -p) -iv 0 | base64)
CLIENT2_KEY_ENC=$(echo "-----BEGIN KEY2-----" | openssl enc -aes-256-cbc -A -a -K $(printf '%-32s' "$MASTER_KEY" | head -c 32 | xxd -p) -iv 0 | base64)

RESP2=$(curl -s -X POST "$BASE_URL/registerClientHandler" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d "{\"razonSocial\":\"Distribuidora Sur SA\",\"CUIT\":\"30234567890\",\"puntoVenta\":2,\"condicionIva\":\"MONOTRIBUTO\",\"encryptedCert\":\"$CLIENT2_CERT_ENC\",\"encryptedKey\":\"$CLIENT2_KEY_ENC\",\"encryptedAccessToken\":\"$CLIENT2_CERT_ENC\"}")
echo "Client 2: $RESP2"

CLIENT2_ID=$(echo $RESP2 | grep -o '"clientId":"[^"]*' | cut -d'"' -f4)
CLIENT2_KEY=$(echo $RESP2 | grep -o '"apiKey":"[^"]*' | cut -d'"' -f4)

# === CREATE INVOICES ===
# Client 1 invoices
curl -s -X POST "$BASE_URL/createAFIPVoucher" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d "{\"clientId\":\"$CLIENT1_ID\",\"apiKey\":\"$CLIENT1_KEY\",\"voucherData\":{\"tipoFactura\":\"factura_c\",\"docTipo\":\"CUIT\",\"docNro\":20123456789,\"items\":[{\"descripcion\":\"Producto\",\"cantidad\":2,\"precioUnitario\":1000}],\"descuento\":0}}"

# Client 2 invoices
curl -s -X POST "$BASE_URL/createAFIPVoucher" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_KEY" \
  -d "{\"clientId\":\"$CLIENT2_ID\",\"apiKey\":\"$CLIENT2_KEY\",\"voucherData\":{\"tipoFactura\":\"factura_c\",\"docTipo\":\"CUIT\",\"docNro\":30123456789,\"items\":[{\"descripcion\":\"Insumos\",\"cantidad\":5,\"precioUnitario\":500}],\"descuento\":0}}"

# Verify isolation in Firestore:
# /clients/$CLIENT1_ID/vouchers/... → only Client 1 invoices
# /clients/$CLIENT2_ID/vouchers/... → only Client 2 invoices
```

---

## Request Reference

### Headers (all requests)

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Always | `application/json` |
| `x-internal-key` | Always | Your `INTERNAL_AFIP_API_KEY` — server-to-server auth |

### Body — registerClientHandler

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `razonSocial` | string | Yes | Business name |
| `CUIT` | string (11 digits) | Yes | Tax ID number |
| `puntoVenta` | number (1–9999) | Yes | POS terminal number |
| `condicionIva` | string | Yes | `RESPONSABLE_INSCRIPTO`, `MONOTRIBUTO`, `CONSUMIDOR_FINAL`, etc. |
| `encryptedCert` | string | Yes | Encrypted `.pem` certificate |
| `encryptedKey` | string | Yes | Encrypted private key |
| `encryptedAccessToken` | string | Yes | Encrypted AFIP access token |

### Body — createAFIPVoucher

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `clientId` | string | Yes | From registration response |
| `apiKey` | string | Yes | From registration response |
| `voucherData.tipoFactura` | enum | Yes | `factura_a`, `factura_b`, `factura_c`, `nota_credito_a`, `nota_credito_b`, `nota_credito_c` |
| `voucherData.docTipo` | enum | No | `CUIT`, `DNI`, `CUIL`, `LE`, `LC` (default: `DNI`) |
| `voucherData.docNro` | number | Yes | Document number |
| `voucherData.items` | array | Yes | At least 1 item |
| `voucherData.items[].descripcion` | string | Yes | Product/service name |
| `voucherData.items[].cantidad` | number | Yes | Quantity (positive int) |
| `voucherData.items[].precioUnitario` | number | Yes | Unit price (inc. tax for `factura_a`) |
| `voucherData.items[].ivaId` | number | No | Override tax rate (1–6), default 21% |
| `voucherData.descuento` | number | No | Discount % (0–100), default 0 |
| `voucherData.nroAsociado` | number | Cond. | Required for `nota_credito_*` — invoice being credited |

### Response Codes

| HTTP Code | Meaning |
|----------|---------|
| 200 | Success — invoice created |
| 201 | Success — client registered |
| 204 | Success — CORS preflight |
| 400 | Bad request — validation error |
| 401 | Unauthorized — bad internal key or client credentials |
| 500 | Server error |

---

## Deploy to Firebase

```bash
# Set env vars in Firebase
firebase functions:config:set \
  arca.master_key="$ARCA_MASTER_KEY" \
  arca.encryption_key="$ARCA_ENCRYPTION_KEY" \
  arca.internal_api_key="$INTERNAL_AFIP_API_KEY"

# Deploy
firebase deploy --only functions

# Update BASE_URL in scripts:
BASE_URL=https://us-central1-<your-project>.cloudfunctions.net
```
