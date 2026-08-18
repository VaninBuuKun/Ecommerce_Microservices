# Bug Fixing Trajectory Workflow

1. **Log Inspection**: Inspect un-truncated error logs from build/run output or log files.
2. **Root Cause Analysis**: Trace code path from UI hook -> Axios -> Controller -> MediatR Handler -> DB/gRPC.
3. **Targeted Fix**: Apply fix without superficial symptom patching.
4. **Verification**: Run build check (`dotnet build Microservices.sln` or `npx tsc --noEmit`) to verify clean resolution.
