# 2. Clave de Encriptación por Defecto

## Problema
```typescript
// src/services/encryption.ts:7-8
const DEFAULT_KEY = "default-secret-key-32-chars-long!!";
const secretKey = process.env.ARCA_ENCRYPTION_KEY || DEFAULT_KEY;
```
Si no hay variable de entorno, usa una clave hardcodeada insegura.

## Impacto
- Credenciales encriptadas son fácilmente desencriptables
- Si alguien accede al código, tiene la clave
- No hay forma de rotar la clave

## Solución
Lanzar error si no existe la clave:

```typescript
// encryption.ts
const secretKey = process.env.ARCA_ENCRYPTION_KEY;
if (!secretKey) {
  throw new Error("ARCA_ENCRYPTION_KEY environment variable is required");
}
```

## Archivo a modificar
- `src/services/encryption.ts` — líneas 1-15

## Checklist
- [ ] Eliminar DEFAULT_KEY
- [ ] Lanzar error si no hay env var
- [ ] Documentar en README las variables requeridas