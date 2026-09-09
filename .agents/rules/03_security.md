# 03. Security & Best Practices

1. **No Hardcoded Secrets & Cascading Configuration Architecture**:
   - `appsettings.json` (Committed): Base architecture configuration and self-contained template. NEVER contains real secrets, credentials, or production passwords. Uses safe dev defaults or placeholders (`YOUR_*`).
   - `appsettings.Developer.json` (Git-Ignored via `*.Developer.json`): Developer's actual local secrets. Automatically loaded and deep-merged over `appsettings.json` via `AddCustomConfiguration()` in `BuildingBlocks.Logging`.
   - Production / Docker: All credentials should be injected via Environment Variables (`ConnectionStrings__Database=...`).
2. **Authentication**: All user endpoints MUST require JWT Bearer token authentication (`[Authorize]`).
3. **gRPC Scope**: gRPC ports MUST be exposed only within private container network, never exposed publicly.
4. **Input Sanitization**: Validate all inputs at both FE (Zod) and BE (FluentValidation).
