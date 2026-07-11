---
trigger: always_on
---

# Rule 2 — Admin Portal Isolation

The `admin_ws` directory is an independent application.

Rules:

1. Never couple `admin_ws` with the main AlignGrade `frontend/` or `backend/`.
2. Treat `admin_ws` as a standalone full-stack project with its own:
   - frontend
   - backend
   - dependencies
   - configuration
   - package files
   - environment variables
   - routing
3. Do not import files, components, utilities, or services directly from the root `frontend/` or `backend/` folders.
4. Do not create cross-project dependencies that would prevent `admin_ws` from being moved into its own repository.
5. Any communication between `admin_ws` and the main AlignGrade application must occur only through well-defined APIs or shared external services (MongoDB, AWS S3, etc.), never through direct file imports.
6. Design every feature assuming `admin_ws` may become a completely separate repository in the future.
7. When implementing new functionality, ensure that removing the entire `admin_ws` folder from the AlignGrade repository does not break the main Student or Recruiter applications.
8. If a proposed implementation introduces tight coupling between `admin_ws` and the main application, reject that approach and propose a decoupled architecture instead.

Goal:

`admin_ws` should always remain portable, maintainable, independently deployable, and production-ready.