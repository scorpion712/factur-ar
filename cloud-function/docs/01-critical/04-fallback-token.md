# 4. Fallback Token Placeholder

## Problema
```typescript
// src/functions/get-arca-test-certs.ts:34
const token = process.env.AFIP_SDK_ACCESS_TOKEN || "TU_ACCESS_TOKEN";
```
Usa un token placeholder si no existe la variable de entorno.

## Impacto
- En producción, si la variable no está, usa "TU_ACCESS_TOKEN"
- AFIP rechaza el request silenciosamente
- Dificulta debugging ("¿por qué no funciona?")

## Solución
Lanzar error claro:

```typescript
const token = process.env.AFIP_SDK_ACCESS_TOKEN;
if (!token) {
  throw new Error("AFIP_SDK_ACCESS_TOKEN environment variable is required");
}
```

## Archivo a modificar
- `src/functions/get-arca-test-certs.ts` — líneas 30-40

## Checklist
- [ ] Eliminar fallback "TU_ACCESS_TOKEN"
- [ ] Lanzar error descriptivo si no hay token
- [ ] Verificar que sea consistente con fix #1