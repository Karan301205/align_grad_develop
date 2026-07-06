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

Goal:
MEMORY.md → Target Files → Implementation

Avoid:
Task → Full Repository Scan