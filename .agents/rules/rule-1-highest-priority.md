---
trigger: always_on
---

# Project Memory Rules

MEMORY.md is the single source of truth for project architecture.

For every task:

1. Read MEMORY.md first.
2. Identify target files from MEMORY.md.
3. Open only:
   - target files
   - direct dependencies
   - direct consumers
4. Do not recursively scan the repository.
5. Repository-wide scans are forbidden unless:
   - MEMORY.md is missing
   - MEMORY.md is outdated
   - feature is not indexed
   - imports cannot be resolved
   - user requests a full audit
6. Before coding, output:
   - Target Files
   - Dependencies
   - Skipped Files
7. Implement changes only after file identification.
8. Update MEMORY.md whenever architecture changes.
9. After completing any implementation, determine whether the project architecture, folder structure, API routes, database schema, dependencies, environment variables, workflows, or major feature mappings have changed.
10. If any such changes exist, immediately update the corresponding `MEMORY.md` before considering the task complete.
11. This rule applies to **both**:
    - The main AlignGrade application (`frontend/` and `backend/`)
    - The standalone Admin Portal (`admin_ws/`)
12. The `MEMORY.md` must always reflect the latest architecture and implementation. It should never become outdated after a completed task.
13. If a task introduces new folders, files, modules, APIs, dashboards, services, database collections, environment variables, integrations, or architectural decisions, document them in the appropriate section of `MEMORY.md`.
14. A task is **not considered complete** until both the implementation and the corresponding `MEMORY.md` updates have been finished.
15. Before submitting the final response, verify that `MEMORY.md` accurately reflects every architectural or structural change made during the task. If no updates are required, explicitly state that no changes to `MEMORY.md` were necessary.

Goal:
MEMORY.md → Target Files → Implementation

Avoid:
Task → Full Repository Scan