---
name: keepRelatedTogether
description: Refactor code to colocate related types, constants, and functions by domain.
argument-hint: The module or directory to refactor
---
Refactor the code following the "keep related things close together" principle.

For each domain or feature:
1. **Colocate all related code** - Types, constants, helper functions, and main functions that belong to the same domain should live in the same file
2. **Move shared constants to their owners** - If a constant (like endpoint paths, config values) is only used by one domain, move it into that domain's file
3. **Self-contained modules** - Each domain file should be independently understandable without jumping between multiple files
4. **Minimal shared utilities** - The shared/common file should only contain truly generic utilities used across multiple domains
5. **Clear exports** - Update the index file to re-export from domain files

Apply this pattern: if you need to understand feature X, everything about X should be in one place.
