---
name: unit-testing
description: Standard guidelines for writing unit tests for MediatR Query/Command handlers.
---

# Unit Testing Skill

## Guidelines
1. Test Handlers in isolation using xUnit + Moq / NSubstitute.
2. Mock `IEfUnitOfWork` and `IGenericEfRepository`.
3. Verify `Result.IsSuccess` and `Result.ErrorCode` match expected outcomes.
