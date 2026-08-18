# Feature Development Trajectory Workflow

1. **Requirements & Domain Analysis**: Check `SYSTEM_CAPABILITIES_AND_ROADMAP.md` for existing capabilities.
2. **Domain & Entity Update**: Add/modify entities in `Domain/` if needed.
3. **CQRS Command/Query**:
   - Create `[FeatureName]Query.cs` / `[FeatureName]Command.cs` in `Features/[Domain]/[Queries|Commands]/[FeatureName]`.
   - Create `[FeatureName]QueryHandler.cs` / `[FeatureName]CommandHandler.cs` in a separate file.
4. **API / gRPC Exposure**:
   - Add Controller endpoint in `Controllers/` or gRPC method in `GrpcServers/` (using `ISender.Send`).
5. **Frontend Integration**:
   - Add React service method + TanStack Query hook in `features/[feature]/hooks/`.
   - Update UI Component with Zod validation + Modal portal if applicable.
6. **Build Verification**: Run `dotnet build Microservices.sln` and `npx tsc --noEmit`.
7. **Session End Auto-Sync Protocol**: Check for newly added features/patterns and update `.agents/context/01_business_capabilities.md`, `readme.md`, and `.antigravity/scratchpad.md`.
