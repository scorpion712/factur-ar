# 3. Credenciales en Logs

## Problema
```typescript
// src/services/afip.ts:69-71
console.log(credentials);
console.log(decrypt(credentials.encryptedKey||""));
console.log(decrypt(credentials.encryptedCert||""));
```
Escribe certificados y claves desencriptadas en Cloud Logging.

## Impacto
- Exposición de credenciales en logs de producción
- Cualquier persona con acceso a logs puede ver las claves
- Violación de seguridad básica

## Solución
Eliminar logs y usar logging estructurado sin datos sensibles:

```typescript
// En lugar de console.log(credentials)
// Logger de Firebase
logger.info("Creating voucher", {
  puntoVenta: voucherData.puntoVenta,
  tipoFactura: voucherData.tipoFactura,
  // NO incluir credentials, cert, key
});
```

## Archivo a modificar
- `src/services/afip.ts` — líneas 57-71, 146-152

## Checklist
- [ ] Eliminar todo console.log de credenciales
- [ ] Usar logger de firebase-functions
- [ ] Loguear solo metadata (tipo, punto de venta, resultado)
- [ ] Verificar que no queden en otros archivos