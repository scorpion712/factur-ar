# Deployment Guide

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Firebase Project** created
3. **Node.js 22+** installed
4. **Firebase CLI** installed

```bash
npm install -g firebase-tools
```

## Environment Setup

### 1. Create Firebase Project

```bash
firebase login
firebase projects:create my-arca-functions
firebase use my-project
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
# Edit .env with your keys
```

### 3. Generate Required Keys

```bash
# Master key
openssl rand -hex 32

# Encryption key
openssl rand -hex 32

# Internal API key
openssl rand -hex 32
```

Store these in:
- GCP Secret Manager (recommended)
- Firebase Functions config

## GCP Setup

### 1. Enable Required APIs

```bash
gcloud services enable \
  firestore.googleapis.com \
  cloudfunctions.googleapis.com \
  secretmanager.googleapis.com
```

### 2. Create Service Account

```bash
gcloud iam service-accounts create arca-function \
  --display-name="ARCA Function"

# Grant roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:arca-function@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/firestore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:arca-function@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Store Secrets

```bash
# Store master key
echo "your-master-key" | gcloud secrets create ARCA_MASTER_KEY --replication-policy=automatic --data-file=-

# Store encryption key
echo "your-encryption-key" | gcloud secrets create ARCA_ENCRYPTION_KEY --replication-policy=automatic --data-file=-

# Store internal API key
echo "your-internal-key" | gcloud secrets create INTERNAL_AFIP_API_KEY --replication-policy=automatic --data-file=-
```

## Firestore Setup

### 1. Initialize Firestore

```bash
firebase firestore:init
```

### 2. Create Indexes (if needed)

```typescript
// firestore.indexes.json
{
  "indexes": [],
  "fieldOverrides": []
}
```

## Build and Deploy

### 1. Install Dependencies

```bash
npm install
```

### 2. Build TypeScript

```bash
npm run build
```

### 3. Deploy Functions

```bash
# Deploy all
firebase deploy

# Deploy specific function
firebase deploy --only functions:createAFIPVoucher
```

## Verifying Deployment

### 1. Check Function Status

```bash
firebase functions:log createAFIPVoucher
```

### 2. Test Health Check

```bash
curl https://$REGION-$PROJECT.web.app/healthCheck
```

### 3. Test Voucher Creation

```bash
curl -X POST https://$REGION-$PROJECT.web.app/createAFIPVoucher \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_AFIP_API_KEY" \
  -H "x-client-id: $CLIENT_ID" \
  -H "x-api-key: $CLIENT_API_KEY" \
  -d '{
    "voucherData": {
      "tipoFactura": "factura_a",
      "docTipo": "CUIT",
      "docNro": 30111111112,
      "items": [{
        "descripcion": "Product 1",
        "cantidad": 1,
        "precioUnitario": 121
      }]
    }
  }'
```

## Client Onboarding

### 1. Register New Client

```bash
curl -X POST https://$REGION-$PROJECT.web.app/registerClient \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_AFIP_API_KEY" \
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

### 2. Store Credentials Securely

The response will contain:
- `clientId` - Use this in API calls
- `apiKey` - **STORE SECURELY** - It won't be shown again

## Monitoring

### 1. View Logs

```bash
firebase functions:log createAFIPVoucher --until=1h
```

### 2. Set Up Alerts

In Google Cloud Console:
- Cloud Functions > createAFIPVoucher > Alerts
- Add alert for errors > 5%

## Rollback

```bash
# Rollback to previous version
firebase functions:rollback createAFIPVoucher
```

## Security Checklist

- [ ] Master key stored in Secret Manager
- [ ] Encryption key stored in Secret Manager
- [ ] Internal API key stored securely
- [ ] Service account has minimum required roles
- [ ] Firestore rules configured
- [ ] CORS origins restricted
- [ ] No credentials in logs (verified)
- [ ] Rate limiting enabled
- [ ] Health check working
- [ ] Monitoring configured

## Troubleshooting

### Function Not Found
```bash
firebase functions:delete createAFIPVoucher
firebase deploy --only functions
```

### Cold Start
First call may take 5-10 seconds due to cold start. This is normal.

### Rate Limit Errors
Check rate limit configuration in `services/rate-limiter.ts`

### AFIP Errors
Check AFIP API status at https://status.afip.gob.ar