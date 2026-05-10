# 5. Timing Attack en Comparación de API Key

## Problema
```typescript
// src/index.ts:35
if (!internalKey || internalKey !== expectedKey)
```
Usa comparación estricta (`!==`) que es vulnerable a timing attacks.

## Impacto
- Atacante puede medir tiempos de respuesta para adivinar la API key
- Cada carácter correcto = tiempo ligeramente diferente
- Con suficientes intentos, deduce la clave

## Solución
Usar comparación de tiempo constante:

```typescript
import { createHash } from "crypto";

// index.ts
function safeCompare(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  
  //.crypto.timingSafeEqual requiere mismos length
  return crypto.timingSafeEqual(bufA, bufB);
}

// Luego en el handler:
if (!internalKey || !safeCompare(internalKey, expectedKey)) {
  // Unauthorized...
}
```

## Alternativa (más simple)
Usar hashing constante:
```typescript
const hashMatch = createHash('sha256')
  .update(internalKey)
  .digest('hex') === createHash('sha256')
  .update(expectedKey)
  .digest('hex');
```

## Archivo a modificar
- `src/index.ts` — líneas 31-45 y 99-113

## Checklist
- [ ] Implementar safeCompare o hashing
- [ ] Aplicar a ambos handlers (createVoucher + getArcaTestCerts)
- [ ] Testear que funciona igual que antes