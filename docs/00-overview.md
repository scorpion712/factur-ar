# Docs — Cloud Function Stock IA

## Estructura

```
docs/
├── 01-critical/          # Fixes CRITICAL (Phase 1)
│   ├── 01-token-hardcodeado.md
│   ├── 02-clave-encriptacion-default.md
│   ├── 03-credenciales-en-logs.md
│   ├── 04-fallback-token.md
│   └── 05-timing-attack.md
│
├── 02-architecture/      # Diseño técnico
│   └── 01-firestore-design.md
│
├── 03-queue/            # Cloud Tasks
│   └── 01-cloud-tasks-design.md
│
└── 00-overview.md       # Este archivo
```

## Roadmap

| Phase | Descripción | Docs |
|-------|-------------|------|
| 1 | Fix 5 CRITICALs | `01-critical/` |
| 2 | Firestore + persistencia | `02-architecture/` |
| 3 | Cloud Tasks + queue | `03-queue/` |
| 4 | Observabilidad (logs, metrics) | — |

## Quick Ref

- **CRITICAL 1**: Token hardcodeado → usar accessToken del request
- **CRITICAL 2**: Fallback key → throw error si no hay env var
- **CRITICAL 3**: Logs con credenciales → eliminar console.log
- **CRITICAL 4**: Fallback "TU_ACCESS_TOKEN" → throw error
- **CRITICAL 5**: Timing attack → crypto.timingSafeEqual

## Links

- [SPEC.md](../SPEC.md) — Especificación completa
- [README.md](../README.md) — Uso del proyecto