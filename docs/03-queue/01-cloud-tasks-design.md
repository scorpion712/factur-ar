# Diseño Cloud Tasks — Cola de Facturación

## Propósito
Manejar bursts de facturas y evitar rate limiting de AFIP (~100 req/hora).

---

## Cuándo Usar

- Cliente envía 10+ facturas simultáneas
- Rate limiting de AFIP alcanzado
- AFIP API lenta/timeout
- Retry automático en errores transitorios

---

## Arquitectura

```
HTTP Request (createVoucher)
         │
         ▼
   Cloud Function (validator)
         │
         ▼
   Cloud Tasks queue
    │          │
    ▼          ▼
 Worker 1   Worker 2   ... (más workers si hay más en cola)
    │          │
    ▼          ▼
   AFIP API   AFIP API
    │          │
    ▼          ▼
 response  response
```

---

## Configuración

### Task Config

```typescript
const task = {
  scheduleTime: Date.now(),           // Ejecutar ahora
  dispatchDeadline: "300s",          // 5 min timeout
  retryConfig: {
    maxAttempts: 3,
    minBackoff: "10s",
    maxBackoff: "60s",
  },
};
```

### Retry Strategy

| Attempt | Backoff | Rationale |
|---------|---------|-----------|
| 1 | 10s | Error transitorio común |
| 2 | 30s | AFIP puede estar lento |
| 3 | 60s | Último intento |

---

## Dead Letter Queue

Si fallan 3 veces → mover a dead letter:

```typescript
// tasks-config.json
{
  "maxAttempts": 3,
  "maxRetryDuration": "120s",
  "minBackoff": "10s",
  "maxBackoff": "60s"
}
```

Alertas: Notificar cuando algo entra en DLQ.

---

## Flujo Completo

```
1. Cliente → POST /createVoucher
2. CF valida input + auth
3. CF → Cloud Tasks: encolar tarea
4. Return: "processing" (202 Accepted)
5. Task → Worker: procesa voucher
6. Worker → AFIP API
7. Worker → Update Firestore (resultado)
8. Worker → Callback al cliente (optional) o pool polling
```

---

## Rate Limiting por Cliente

```typescript
// En el handler
const clientId = extractClientId(request);
const quota = await getClientQuota(clientId); // Firestore

if (quota.used >= quota.limit) {
  return {
    status: 429,
    error: "Rate limit exceeded. Retry in X minutes."
  };
}
```

Límites sugeridos:
- **Burst**: 10 concurrentes
- **Hourly**: 100 (límite real de AFIP)

---

## Costos

- **Tasks created**: 5K/mes → $0.40
- **Task operations**: incluido en free tier

**Total**: ~$0.50 USD/mes

---

## Implementación

En `src/functions/enqueueVoucher.ts`:

```typescript
import { CloudTasksClient } from "@google-cloud/tasks";

export async function enqueueVoucher(voucherData: VoucherData) {
  const client = new CloudTasksClient();
  
  const task = {
    httpRequest: {
      httpMethod: "POST",
      uri: `${process.env.FUNCTION_URL}/processVoucher`,
      body: Buffer.from(JSON.stringify(voucherData)).toString("base64"),
      headers: { "Content-Type": "application/json" },
    },
    scheduleTime: { seconds: Date.now() / 1000 },
  };
  
  await client.createTask({
    parent: queuePath,
    task,
  });
}
```