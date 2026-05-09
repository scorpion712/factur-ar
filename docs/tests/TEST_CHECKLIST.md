# Test Documentation

## Overview

This document describes the test suite for the ARCA/AFIP Cloud Function. All tests are designed to validate security, functionality, and edge cases.

## Test Structure

```
test/
├── services/
│   ├── encryption.test.ts      # Encryption service tests
│   └── afip.test.ts         # AFIP service tests
├── functions/
│   ├── createVoucher.test.ts
│   └── registerClient.test.ts
└── docs/
    └── TEST_CHECKLIST.md
```

## Test Categories

### 1. Encryption Service Tests

| Test | Description | Expected Result |
|------|------------|---------------|
| encrypt/decrypt basic | Encrypt sensitive data and decrypt | Data matches original |
| encrypt random IV | Same plaintext produces different ciphertext | Different output each time |
| decrypt invalid | Invalid ciphertext passed | Throws DecryptionError |
| timingSafeCompare equal | Identical strings | Returns true |
| timingSafeCompare different | Different strings | Returns false |
| timingSafeCompare length | Different length strings | Returns false |
| hashSHA256 consistency | Same input produces same hash | Consistent output |
| hashSHA256 uniqueness | Different input produces different hash | Unique output |
| generateClientId format | Generate valid format | Matches `/^client_[a-f0-9]{16}$/` |
| generateClientId uniqueness | 100 generations | All unique |
| generateApiKey format | 32-byte hex | 64 chars, hex only |
| generateEncryptionKeyId format | Format: `key_xxx` | Matches `/^key_[a-f0-9]{16}$/` |

### 2. Client Authentication Tests

| Test | Description | Expected Result |
|------|------------|---------------|
| authenticateClient valid | Valid clientId + apiKey | Returns config |
| authenticateClient not found | Non-existent clientId | Throws ClientNotFoundError |
| authenticateClient inactive | Inactive client | Throws ClientInactiveError |
| authenticateClient invalid key | Wrong API key | Throws InvalidApiKeyError |
| decryptClientCredentials | Valid encrypted credentials | Returns cert/key/token |

### 3. AFIP Service Tests

| Test | Description | Expected Result |
|------|------------|---------------|
| createVoucherWithAfip valid | Valid credentials + data | Returns CAE |
| createVoucherWithAfip missing token | No access token | Throws AFIPApiError |
| createVoucherWithAfip missing cert | No certificate | Throws AFIPApiError |
| getLastVoucherNumber | Valid request | Returns last number |
| AFIP API error handling | AFIP returns error | Throws AFIPApiError |

### 4. Create Voucher Function Tests

| Test | Description | Expected Result |
|------|------------|---------------|
| valid request | Valid voucher data | Success response |
| invalid tipoFactura | Invalid bill type | Validation error |
| invalid items | Empty items array | Validation error |
| invalid docNro | Negative document number | Validation error |
| calcularIVA facturaA | $121 total | $100 net + $21 IVA |
| calcularIVA facturaB | $121 total | $100 net + $21 IVA |
| calcularIVA facturaC | $121 total | $121 net + $0 IVA |

### 5. Rate Limiter Tests

| Test | Description | Expected Result |
|------|------------|---------------|
| within limit | Under limit | No error |
| over minute limit | Exceeds per-minute | Throws RateLimitError |
| over day limit | Exceeds per-day | Throws RateLimitError |

## Security Tests

### Timing Attack Prevention

```typescript
it("should prevent timing attacks", () => {
  const key1 = "test-key-1";
  const key2 = "test-key-2";

  const times1 = [];
  const times2 = [];

  for (let i = 0; i < 100; i++) {
    const start1 = Date.now();
    timingSafeCompare(key1, key2);
    times1.push(Date.now() - start1);

    const start2 = Date.now();
    timingSafeCompare(key1, key1);
    times2.push(Date.now() - start2);
  }

  const avg1 = times1.reduce((a, b) => a + b) / times1.length;
  const avg2 = times2.reduce((a, b) => a + b) / times2.length;

  // Times should be similar (within 20% variance)
  expect(Math.abs(avg1 - avg2) / avg2).toBeLessThan(0.2);
});
```

### No Credentials in Logs

All tests verify that sensitive data is not logged:

```typescript
it("should not log credentials", () => {
  const consoleSpy = vi.spyOn(console, "log");

  encrypt("sensitive-data");

  const allLogs = consoleSpy.mock.calls.flat().join(" ");
  expect(allLogs).not.toContain("sensitive-data");
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific file
npm test -- test/services/encryption.test.ts

# Run in watch mode
npm run test:watch
```

## Test Checklist

Before deployment, verify:

- [ ] All encryption tests pass
- [ ] All authentication tests pass
- [ ] All AFIP service tests pass
- [ ] All createVoucher tests pass
- [ ] Timing attack tests pass
- [ ] No credentials in logs test passes
- [ ] 80%+ code coverage
- [ ] No console.log in production code

## Expected Coverage

| Module | Target |
|--------|--------|
| encryption.ts | 100% |
| client-auth.ts | 90%+ |
| afip.ts | 80%+ |
| createVoucher.ts | 90%+ |
| firestore.ts | 80%+ |
| rate-limiter.ts | 80%+ |

## CI Integration

Tests run in CI on:
- Every PR
- Every push to main
- Before deployment

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 22
      - run: npm ci
      - run: npm test
      - run: npm run lint
```