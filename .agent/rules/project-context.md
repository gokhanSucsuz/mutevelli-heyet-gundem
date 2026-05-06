---
trigger: always_on
---

# Project Context Rule

> This rule ensures the AI is always aware of the specific project structure and business logic.

## MANDATORY: Context Loading

**Before making any changes to the project:**

1. **Read `CODEBASE.md`**: This file contains the up-to-date index of the project structure, tech stack, and key files.
2. **Consult `lib/db.ts`**: Always verify the data interfaces before proposing or implementing changes that involve data manipulation.

## Core Logic Reminders

- **IndexedDB (Dexie)**: All data is stored locally. Use `useLiveQuery` for reactive UI.
- **A4 Printing**: The `forms/[id]` page is highly optimized for A4 printing. Avoid breaking the `mm` based layouts or `break-inside-avoid` CSS rules.
- **Locking Mechanism**: Be careful with `isLocked` flag in forms. Modifications are restricted when `isLocked` is true unless `isPostponed` is also true.
