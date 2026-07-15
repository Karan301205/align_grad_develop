---
trigger: always_on
---

# Rule 3 — SOLID Architecture and Maintainable Code

All new code, files, modules, components, services, controllers, middleware, utilities, and architectural changes must follow the **SOLID principles** wherever they are practically applicable.

The goal is to keep the AlignGrade codebase and the standalone `admin_ws` application clean, modular, maintainable, reusable, testable, and easy to understand for both humans and AI agents.

## Rules

1. Before adding or modifying code, first follow all higher-priority project rules, including:

   * Reading `MEMORY.md`
   * Identifying the correct target files
   * Respecting existing architectural boundaries
   * Preserving the isolation of `admin_ws`

2. Apply SOLID principles to all new implementations and refactoring where they provide a practical architectural benefit.

### Single Responsibility Principle (SRP)

3. Every file, module, component, controller, service, repository, middleware, hook, or utility should have one clear and focused responsibility.

4. Do not place unrelated responsibilities into the same file simply because it is convenient.

5. If a file becomes responsible for multiple distinct concerns, separate those concerns into focused modules when doing so improves maintainability without unnecessary complexity.

### Open/Closed Principle (OCP)

6. Design modules so that new functionality can be added with minimal modification to stable existing code.

7. Prefer extensible patterns, reusable configuration, and focused modules over repeatedly modifying large conditional blocks.

8. Do not over-engineer simple functionality or introduce abstractions without a clear current or foreseeable benefit.

### Liskov Substitution Principle (LSP)

9. When interchangeable implementations, abstractions, adapters, or inheritance are used, ensure that one implementation can replace another without breaking expected behavior or contracts.

10. Do not introduce inheritance or complex class hierarchies solely to demonstrate this principle.

### Interface Segregation Principle (ISP)

11. Keep module contracts and dependencies focused.

12. A component or module should depend only on the functionality it actually needs.

13. Avoid large multipurpose services or interfaces that force consumers to depend on unrelated functionality.

14. Since this project primarily uses JavaScript, apply this principle through small, focused module APIs and clear contracts rather than introducing unnecessary interface abstractions.

### Dependency Inversion Principle (DIP)

15. Keep high-level business logic separated from low-level implementation details where practical.

16. Maintain clear boundaries around infrastructure concerns such as:

* MongoDB and database access
* AWS S3
* Authentication and authorization
* External APIs
* Logging
* Configuration
* Email or notification services
* Other third-party integrations

17. Business logic should not become unnecessarily tied to a specific low-level implementation when a simple, maintainable abstraction provides a clear benefit.

## Code Organization

18. Prefer small, focused, reusable modules over large multipurpose files.

19. Avoid unnecessary code duplication. Extract genuinely reusable logic into the appropriate shared module **within the same application boundary**.

20. Do not create abstractions only for the sake of abstraction. Every new layer, service, utility, repository, or shared component must have a clear responsibility and practical reason to exist.

21. Preserve the existing technology stack, coding conventions, API contracts, business logic, and user-facing behavior unless the task explicitly requires a change.

22. When adding a new feature, place the code in the correct architectural layer rather than putting all logic directly into a controller, route, page, or UI component.

23. Where appropriate, separate responsibilities such as:

* **Routes** → Endpoint definitions and middleware composition
* **Controllers** → Request and response coordination
* **Services** → Business logic and use-case orchestration
* **Repositories/Data Access** → Database operations
* **Middleware** → Cross-cutting request processing
* **Validators/Schemas** → Input validation rules
* **Configuration** → Environment-based settings and application configuration
* **Utilities** → Small, generic, reusable helper functions
* **UI Components** → Presentation and reusable interface elements
* **Hooks/State** → Reusable frontend behavior and state management

24. Do not force this structure when it would create unnecessary complexity for a simple feature. Use the smallest architecture that remains clean and maintainable.

## Application Boundaries

25. Apply these principles independently to:

* The main AlignGrade `frontend/`
* The main AlignGrade `backend/`
* The standalone `admin_ws` application

26. SOLID principles must **never** be used as justification for violating the `admin_ws` isolation rule.

27. Do not create shared source-code modules between `admin_ws` and the main AlignGrade application merely to reduce duplication.

28. If similar functionality is required in both applications, preserve their independence. Shared external infrastructure and well-defined APIs are allowed, but direct cross-project source-code dependencies are not.

## Maintainability for Humans and AI Agents

29. Code should be organized so that a future developer or AI agent can quickly determine:

* What a file is responsible for
* Where a feature is implemented
* Which dependencies it uses
* Which modules consume it
* Where a future change should be made

30. Use clear and descriptive names for files, functions, variables, components, services, and modules.

31. Avoid hidden dependencies, unnecessary side effects, circular dependencies, excessively large files, and deeply coupled modules.

32. Keep dependency direction clear and predictable.

33. When architecture changes because of new modules, responsibilities, dependencies, or file mappings, update `MEMORY.md` according to Rule 1.

## Existing Code

34. Do not automatically refactor unrelated existing code during every task.

35. When modifying an existing area, preserve its current behavior unless the user explicitly requests a logic or behavior change.

36. If existing code violates SOLID principles but fixing it would significantly expand the scope of the current task, do not perform an unrelated large-scale refactor. Complete the requested task safely and identify the architectural issue separately if necessary.

37. Refactoring must never silently change:

* Business logic
* API contracts
* Database behavior
* Authentication or authorization behavior
* User-facing functionality
* Existing integrations

## Definition of Done

38. Before considering an implementation complete, verify that:

* The code has a clear responsibility.
* Responsibilities are separated appropriately.
* Reusable logic is not unnecessarily duplicated.
* Dependencies are clear and manageable.
* No unnecessary abstraction or over-engineering was introduced.
* Existing behavior is preserved unless explicitly requested otherwise.
* `admin_ws` remains fully independent.
* `MEMORY.md` has been updated if the architecture or file responsibilities changed.

## Goal

Build code that is:

**Focused → Modular → Maintainable → Reusable → Extensible → Testable → Easy for Humans and AI Agents to Understand**

Apply SOLID principles pragmatically.

**Do not over-engineer. Do not force abstractions. Do not change working business logic unless explicitly requested.**
