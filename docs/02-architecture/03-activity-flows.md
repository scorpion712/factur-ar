# Activity Diagrams

## Normal Flow: Create Voucher

```mermaid
sequenceDiagram
    participant POS as POS Client
    participant CF as Cloud Function
    participant FS as Firestore
    participant AFIP as AFIP API

    Note over POS,AFIP: Normal Voucher Creation Flow

    POS->>CF: POST /createVoucher<br/>x-internal-key: [key]<br/>x-client-id: client_A<br/>x-api-key: [apiKey]<br/>voucherData

    CF->>CF: Validate x-internal-key

    alt Invalid internal key
        CF-->>POS: 401 Unauthorized
    end

    CF->>CF: Extract clientId + apiKey
    CF->>FS: GET /clients/client_A/_config

    alt Client not found
        FS-->>CF: null
        CF-->>POS: 401 Client Not Found
    end

    CF->>CF: timingSafeCompare(apiKey, apiKeyHash)

    alt Invalid API key
        CF-->>POS: 401 Invalid API Key
    end

    CF->>FS: Check rate limits

    alt Rate limited
        CF-->>POS: 429 Rate Limit Exceeded
    end

    CF->>FS: GET /clients/client_A/_config (with credentials)

    Note over CF: Decrypt credentials internally

    CF->>FS: BEGIN TRANSACTION<br/>Get voucher number lock

    CF->>AFIP: createVoucher(cert, key, data)
    AFIP-->>CF: CAE + expiry

    CF->>FS: COMMIT TRANSACTION<br/>Save voucher + release lock

    CF-->>POS: 200 {CAE, expiry, qrData}
```

## Registration Flow: New Client

```mermaid
sequenceDiagram
    participant Admin as Admin Dashboard
    participant CF as Cloud Function
    participant FS as Firestore
    participant SM as Secret Manager

    Note over Admin,SM: Client Onboarding Flow

    Admin->>CF: POST /registerClient<br/>x-internal-key: [key]<br/>clientData

    CF->>CF: Validate x-internal-key

    alt Invalid internal key
        CF-->>Admin: 401 Unauthorized
    end

    CF->>CF: Validate request schema

    alt Invalid schema
        CF-->>Admin: 400 Validation Error
    end

    CF->>CF: Generate clientId (client_xxx)
    CF->>CF: Generate apiKey (64 hex chars)
    CF->>CF: Generate encryptionKeyId (key_xxx)

    CF->>CF: Generate client key (32 random bytes)

    CF->>CF: Encrypt cert with clientKey
    CF->>CF: Encrypt key with clientKey
    CF->>CF: Encrypt accessToken with clientKey

    CF->>CF: Encrypt clientKey with Master Key

    CF->>FS: SET /clients/{clientId}/_config<br/>{apiKeyHash, encrypted cert/key/token, etc}

    CF->>FS: SET /secretKeys/{encryptionKeyId}<br/>{encrypted clientKey}

    CF-->>Admin: 201 {clientId, apiKey}<br/>⚠️ Store apiKey - not shown again
```

## Edge Cases: Error Handling

### Invalid Internal Key

```mermaid
graph TD
    A[Request] --> B{Valid x-internal-key?}
    B -->|No| C[Log warning<br/>IP: request.ip]
    B -->|Yes| D[Continue]

    C --> E[401 Unauthorized<br/>Invalid internal key]
```

### Invalid Client ID

```mermaid
graph TD
    A[Request] --> B{Valid x-internal-key?}
    B -->|No| E[401]
    B -->|Yes| C{Client exists in Firestore?}

    C -->|No| D[Log warning<br/>Client: clientId]
    C -->|Yes| F[Continue]

    D --> G[401 Client Not Found]
```

### Invalid API Key (Timing Attack Safe)

```mermaid
graph TD
    A[Request] --> B{Valid internal key?}
    B -->|No| E[401]
    B -->|Yes| C{Client exists?}

    C -->|No| F[401]
    C -->|Yes| D{timingSafeCompare(apiKey, hash)}

    D -->|Yes| G[Continue to rate limit]
    D -->|No| H[Log warning<br/>Invalid API key attempt]
    H --> I[401 Invalid API Key]

    Note over D,I: All comparisons take same time<br/>prevents timing attacks
```

### Rate Limit Exceeded

```mermaid
graph TD
    A[Request] --> B{Valid auth?}
    B -->|No| E[401]
    B -->|Yes| C{Check minute limit}

    C -->|Exceeds| D[429 Rate Limit<br/>Minute]
    C -->|OK| F{Check day limit}

    F -->|Exceeds| G[429 Rate Limit<br/>Day]
    F -->|OK| H[Continue]
```

### Client Inactive

```mermaid
graph TD
    A[Request] --> B{Client active?}
    B -->|No| C[Log warning<br/>Client inactive]
    B -->|Yes| D[Continue]

    C --> E[401 Client Inactive]
```

### AFIP API Error

```mermaid
graph TD
    A[AFIP Call] --> B{AFIP responds?}
    B -->|Error| C[Log error<br/>AFIP message]
    B -->|Success| D[Continue]

    C --> E[400 AFIP Error<br/>with message]
```

## Malicious Request Handling

### Attempting to Access Other Client Data

```mermaid
graph TD
    A[Request with clientId_B] --> B{Client B exists?}
    B -->|No| C[401 Client Not Found]
    B -->|Yes| D{API key matches?}

    D -->|No for B| E[401 Invalid API Key]

    Note over D: Even if clientId exists,<br/>wrong API key = rejection
```

### SQL Injection Attempt

```mermaid
graph TD
    A[Request with payload] --> B{Validate Zod schema}

    B -->|Invalid| C[400 Validation Error<br/>List of field errors]
    B -->|Valid| D[Continue]

    C --> D
```

### Replay Attack Prevention

```mermaid
graph TD
    A[Request] --> B{Timestamp in payload?}

    B -->|Old (>5 min)| C[400 Request Expired]
    B -->|Recent| D[Continue]

    Note over B,D: Each request should have<br/>timestamp and be recent
```

### Credential Stuffing

```mermaid
graph TD
    A[Multiple attempts<br/>different apiKeys] --> B{Attempts > threshold?}

    B -->|Yes| C[Log suspicious activity<br/>IP: x, clientId: y]
    B -->|No| D[Continue]

    C --> E[Temporarily block IP]

    Note over A,E: System logs all auth failures<br/>for security monitoring
```

## Health Check Flow

```mermaid
sequenceDiagram
    participant Client
    participant CF as Cloud Function

    Client->>CF: GET /healthCheck

    alt OPTIONS
        CF-->>Client: 204 No Content
    end

    CF-->>Client: 200 {status: "healthy", timestamp}
```

## Data Isolation Verification

```mermaid
graph TD
    subgraph "Client A"
        A1[Client A Certificates]
        A2[Client A Vouchers]
    end

    subgraph "Client B"
        B1[Client B Certificates]
        B2[Client B Vouchers]
    end

    A1 --> |"Can only access"| A2
    B1 --> |"Can only access"| B2

    A1 -.-> |"Cannot access"| B1
    B1 -.-> |"Cannot access"| A1

    Note over A1,B1: Firestore rules ensure<br/>clients can only read<br/>their own data
```

## Encryption Flow Detail

```mermaid
sequenceDiagram
    participant Admin
    participant CF
    participant FS
    participant SM as Secret Manager

    Note over Admin,SM: Registration

    Admin->>CF: Plain cert, key, token
    CF->>CF: Generate 32-byte clientKey
    CF->>CF: Encrypt data with clientKey
    CF->>SM: Encrypt clientKey with Master Key
    CF->>FS: Save encrypted data

    Note over Admin,SM: Runtime (Decryption)

    FS->>CF: Fetch encrypted config
    SM->>CF: Fetch encrypted clientKey
    CF->>CF: Decrypt clientKey with Master Key
    CF->>CF: Decrypt cert, key, token with clientKey

    Note over CF: Sensitive data only<br/>exists in memory briefly
```