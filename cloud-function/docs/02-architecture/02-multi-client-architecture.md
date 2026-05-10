# Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           POS CLIENTS                                  │
│    Client A          Client B          Client C          ...           │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                    │
│  │ API Key  │    │ API Key  │    │ API Key  │                    │
│  │ ClientID│    │ ClientID│    │ ClientID│                    │
│  └──────────┘    └──────────┘    └──────────┘                    │
└─────────────────────────────┬───────────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   FIREBASE CLOUD FUNCTION                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. AUTHENTICATION LAYER                                    │   │
│  │    - Internal key validation (x-internal-key header)         │   │
│  │    - Client ID extraction                                │   │
│  │    - API key validation + timing-safe comparison          │   │
│  │    - Rate limiting per client                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 2. CREDENTIALS RESOLUTION                                │   │
│  │    - Fetch client config from Firestore                    │   │
│  │    - Decrypt credentials with client key               │   │
│  │    - Each client has isolated credentials              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 3. AFIP PROCESSING                                       │   │
│  │    - Voucher number locking (Firestore)                │   │
│  │    - AFIP API call                                      │   │
│  │    - Save voucher to Firestore                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   FIRESTORE   │    │   SECRETS    │    │  AFIP API   │
│  (Database)  │    │  (GCP SM)   │    │  (External) │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Client Config │    │Master Key   │    │Create      │
│Vouchers    │    │Client Keys │    │Voucher    │
│Rate Limits │    │            │    │Get Last #  │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Security Isolation Model

```mermaid
graph TB
    subgraph "Client A (Isolated)"
        A[Client A Config]
        A_Certs[Cert + Key + Token]
        A_Vouchers[A's Vouchers]
    end

    subgraph "Client B (Isolated)"
        B[Client B Config]
        B_Certs[Cert + Key + Token]
        B_Vouchers[B's Vouchers]
    end

    subgraph "Client C (Isolated)"
        C[Client C Config]
        C_Certs[Cert + Key + Token]
        C_Vouchers[C's Vouchers]
    end

    A -.-> |"Can only access"| A_Certs
    B -.-> |"Can only access"| B_Certs
    C -.-> |"Can only access"| C_Certs
```

## Data Flow

```mermaid
sequenceDiagram
    participant POS as POS Client
    participant CF as Cloud Function
    participant FS as Firestore
    participant SM as Secret Manager
    participant AFIP as AFIP API

    POS->>CF: POST /createVoucher<br/>x-internal-key: [key]<br/>x-client-id: client_A<br/>x-api-key: [apiKey]
    
    CF->>CF: Validate internal key
    
    CF->>FS: fetch /clients/client_A/_config
    FS-->>CF: client config (encrypted)
    
    CF->>CF: timingSafeCompare(apiKey, apiKeyHash)
    
    Note over CF: Credentials decrypted<br/>inside CF only
    
    CF->>FS: get voucher number lock
    FS-->>CF: next number
    
    CF->>AFIP: createVoucher(cert, key, data)
    AFIP-->>CF: CAE + expiry
    
    CF->>FS: save voucher + release lock
    CF-->>POS: {CAE, expiry, qr}
```

## Edge Cases and Error Handling

```mermaid
graph TD
    A[Request Received] --> B{Valid Internal Key?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D{Valid Client ID?}
    
    D -->|No| E[400 Bad Request<br/>Missing clientId]
    D -->|Yes| F{Valid API Key?}
    
    F -->|No| G[401 Invalid API Key]
    F -->|Yes| H{Rate Limited?}
    
    H -->|Yes| I[429 Rate Limit Exceeded]
    H -->|No| J{Client Active?}
    
    J -->|No| K[401 Client Inactive]
    J -->|Yes| L{Firestore OK?}
    
    L -->|No| M[500 Firestore Error]
    L -->|Yes| N{AFIP OK?}
    
    N -->|No| O[400 AFIP Error]
    N -->|Yes| P[200 Success]
```

## Malicious Request Handling

```mermaid
graph TD
    A[Request] --> B{Request Source?}
    
    B -->|Different IP first| C[Log + Continue]
    B -->|Same IP rapid| D[Rate Limit]
    B -->|Attempting other clientId| E[401 + Log Warning]
    B -->|SQL-like injection| F[400 Validation Error]
    B -->|Tampered payload| G[400 + Log]
```

## Firestore Schema

```
/
├── clients/
│   └── {clientId}/
│       ├── _config/
│       │   ├── apiKeyHash: "sha256 of api key"
│       │   ├── active: true
│       │   ├── encryptionKeyId: "key_xxx"
│       │   └── afip/
│       │       ├── CUIT: "30-xxx"
│       │       ├── razonSocial: "Business Name"
│       │       ├── puntoVenta: 1
│       │       ├── condicionIva: "RESPONSABLE_INSCRIPTO"
│       │       ├── encryptedCert: "iv:cert"
│       │       ├── encryptedKey: "iv:key"
│       │       └── accessToken: "iv:token"
│       └── vouchers/
│           └── {year}/
│               └── {month}/
│                   └── {timestamp}_{uuid}/
│                       ├── tipoFactura: 1
│                       ├── numero: 1
│                       ├── cae: "123..."
│                       └── ...
│
├── secretKeys/
│   └── {keyId}/
│       └── encryptedKey: "iv:clientKey"
│
├── voucherNumbers/
│   └── {clientId}_{puntoVenta}_{tipoFactura}/
│       ├── lastNumber: 1
│       └── locked: false
│
├── rateLimits/
│   └── {clientId}/
│       └── logs/
│           └── {timestamp}/
│               └── timestamp
│
└── taCache/
    └── {clientId}/
        ├── token: "iv:token"
        ├── sign: "iv:sign"
        └── expiresAt: timestamp
```

## Encryption Flow

```mermaid
graph LR
    subgraph "Onboarding (Admin)"
        A[Cert + Key + Token] --> B[Generate Client Key]
        B --> C[Encrypt with Master Key]
        C --> D[Store in secretKeys]
    end

    subgraph "Runtime (CF)"
        E[Fetch encrypted] --> F[Decrypt with Master Key]
        F --> G[Decrypt Cert/Key/Token]
    end
```

## File Structure

```
src/
├── index.ts                    # Cloud Function handlers
├── functions/
│   ├── createVoucher.ts      # Business logic for vouchers
│   └── registerClient.ts      # Client registration
├── services/
│   ├── afip.ts              # AFIP SDK integration
│   ├── client-auth.ts       # Client authentication
│   ├── encryption.ts        # Encryption utilities
│   ├── errors.ts            # Custom error classes
│   ├── firestore.ts        # Firestore operations
│   └── rate-limiter.ts     # Rate limiting
├── utils/
│   └── validation.ts       # Additional validation
└── types/
    └── arca.ts            # TypeScript types
```