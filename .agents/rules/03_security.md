# 03. Security & Best Practices

1. **No Hardcoded Secrets**: Secrets, connection strings, API keys MUST be injected via `appsettings.json`, environment variables, or secrets manager.
2. **Authentication**: All user endpoints MUST require JWT Bearer token authentication (`[Authorize]`).
3. **gRPC Scope**: gRPC ports MUST be exposed only within private container network, never exposed publicly.
4. **Input Sanitization**: Validate all inputs at both FE (Zod) and BE (FluentValidation).
