# Diseño Firestore — Voucher Numbers + Cache

## Propósito
Persistir datos para evitar race conditions y cachear tokens AFIP.

---

## Colecciones

### 1. `/clients/{clientId}`

Configuración de cada cliente/empresa.

```typescript
interface Client {
  id: string;                    // clientId
  CUIT: string;                  // "20407713606"
  razonSocial: string;
  puntoVenta: number;
  condicionIva: "RESPONSABLE_INSCRIPTO" | "MONOTRIBUTO";
  encryptedCert: string;         // Encriptado
  encryptedKey: string;          // Encriptado
  accessToken: string;           // Encriptado o plain
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Lectura**: Una vez al iniciar, cachear en memoria (1 hora).

---

### 2. `/voucherNumbers/{clientId}_{puntoVenta}_{tipoFactura}`

Último número de voucher emitido. Evita race conditions.

```typescript
interface VoucherNumber {
  id: string;                     // "client1_1_1" (CUIT_pVenta_tipo)
  clientId: string;
  puntoVenta: number;
  tipoFactura: number;
  lastNumber: number;            // Último usado
  lastUpdated: Timestamp;
  locked: boolean;              // Para locking concurrente
}
```

**Locking**: Usar transacción de Firestore:
```
1. Leer documento
2. Si locked por otro proceso → esperar o reintentar
3. Incrementar lastNumber
4. Marcar locked: false
5. Commit
```

---

### 3. `/taCache/{clientId}`

Cache del Token de Acceso AFIP.

```typescript
interface TACache {
  id: string;                    // clientId
  token: string;
  sign: string;
  expirationTime: Timestamp;
  refreshBefore: Timestamp;     // Renew 5 min antes
}
```

**Estrategia**:
- Leer de cache → si `now < refreshBefore` → usar
- Si no existe o expiró → generar nuevo desde AFIP
- Guardar en cache con TTL (8 horas típico)

---

##读写 Patrones

| Operación | reads | writes |
|-----------|-------|--------|
| Crear voucher | 2 (client + voucherNumber) | 2 (update number + log) |
| Cache TA hit | 1 (cache) | 0 |
| Cache miss | 2 (cache + client) | 1 (cache update) |

---

## Costos Estimados

- **Client reads**: 1K clientes × 1 read/day = 30K reads/mes
- **Voucher writes**: 5K vouchers × 2 writes = 10K writes/mes
- **TA cache**: 1K reads + 100 writes/mes

**Total**: ~$0.50-1.00 USD/mes

---

## Implementación

Crear `src/services/firestore.ts`:

```typescript
// Pseudo-código
export async function getNextVoucherNumber(
  clientId: string,
  puntoVenta: number,
  tipoFactura: number
): Promise<number> {
  const docRef = firestore.doc(`voucherNumbers/${clientId}_${puntoVenta}_${tipoFactura}`);
  
  return await firestore.runTransaction(async (t) => {
    const doc = await t.get(docRef);
    const data = doc.data() || { lastNumber: 0 };
    
    const newNumber = data.lastNumber + 1;
    t.set(docRef, { lastNumber: newNumber, lastUpdated: now() });
    return newNumber;
  });
}
```