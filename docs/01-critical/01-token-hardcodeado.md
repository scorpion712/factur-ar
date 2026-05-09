# 1. Token Hardcodeado

## Problema
```typescript
// src/services/afip.ts:27
access_token: "umVjlF97JY359d7B7zVh69zGb8JDs4yX5AYbCJtClRQviupmKIEwWTUWZBrGmq6k"
```
Sobreescribe el `accessToken` del cliente con un token fijo.

## Impacto
- Todos los clientes usan el mismo token
- Si el token expira/rota, deja de funcionar para todos
- No permite multi-tenant real

## Solución
Usar el `accessToken` que viene del request:

```typescript
// afip.ts - createAfipInstance()
return new Afip({
  cert,
  key,
  CUIT: Number(credentials.CUIT),
  access_token: credentials.accessToken || process.env.AFIP_ACCESS_TOKEN,
});
```

## Archivo a modificar
- `src/services/afip.ts` — líneas 19-32

## Checklist
- [ ] Usar credentials.accessToken del request
- [ ] Mantener fallback a env var como backup
- [ ] Testear con múltiples clientes