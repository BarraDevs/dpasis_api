---
name: nestjs-casl-integration
description: Integrate CASL authorization (RBAC + claims-based) into an existing NestJS project. Use this skill whenever the user asks to add, set up, or integrate CASL, role-based access control, claims-based authorization, or permission systems into a NestJS API. Also trigger when the user mentions implementing guards, decorators for permissions, ability factories, or access control in NestJS — even if they don't say "CASL" explicitly. Covers analysis of existing code, implementation following clean architecture, migration from legacy auth systems, and rigorous test creation.
---

# NestJS CASL Integration

This skill integrates CASL-based authorization (RBAC + claims) into an existing NestJS project. It follows a strict 4-phase pipeline. Each phase must complete before moving to the next.

## Overview

The system implements a hybrid authorization model:
- **Roles** determine which controller a user can access (macro level)
- **Claims** in `module:action` format determine which endpoints within that controller a user can execute (micro level)
- **Static claims** are hardcoded in memory for non-admin roles (change requires deploy)
- **Dynamic claims** are stored in database for admin roles (changeable at runtime via frontend)

## Phase Pipeline

```
Phase 1: Analyze → Phase 2: Implement → Phase 3: Migrate → Phase 4: Test
```

Never skip phases. Never start a phase without completing the previous one. Present a summary to the user at the end of each phase and wait for confirmation before proceeding.

---

## Phase 1: Analyze the Existing Codebase

**Goal**: Understand the project structure, existing auth system, and business domain before writing a single line of code.

Read `references/phase1-analyze.md` for the detailed checklist.

The deliverable for this phase is a structured report containing:
1. Project structure map (folder tree, architecture pattern detected)
2. Existing auth inventory (guards, decorators, strategies, middleware)
3. Role catalog (all roles found in the code)
4. Endpoint catalog (every controller + route + current protection)
5. Database schema relevant to auth (users, roles, permissions tables)
6. Dependencies already installed (passport, jwt, etc.)
7. Risk assessment (breaking changes, migration complexity)

Present this report to the user and ask for confirmation before proceeding.

---

## Phase 2: Implement CASL

**Goal**: Add CASL authorization respecting the project's existing architecture and clean architecture principles.

Read `references/phase2-implement.md` for the full implementation guide.

High-level steps:
1. Install dependencies (`@casl/ability`, `@casl/nestjs`)
2. Create the authorization module under the correct layer/folder
3. Define the Ability Factory with static claims per role and dynamic claims for admin
4. Create the `@RequireClaims()` decorator
5. Create the `ClaimsGuard` (works with CASL abilities)
6. Create the `RolesGuard` (controller-level protection)
7. Wire everything into the NestJS module system
8. Apply guards and decorators to all existing controllers/endpoints

All files must be placed following the project's existing folder conventions. If the project uses clean architecture, domain-driven design, or any layered pattern — respect it.

---

## Phase 3: Migrate from Legacy Auth

**Goal**: Remove the old authorization system cleanly without breaking authentication.

Read `references/phase3-migrate.md` for the migration checklist.

Critical distinction: **authentication ≠ authorization**. This phase removes only authorization artifacts (role checks, permission guards, access control logic). Authentication (JWT validation, Passport strategies, session management) must remain untouched.

Steps:
1. Identify all legacy authorization artifacts (from Phase 1 inventory)
2. For each artifact, verify it has a CASL replacement from Phase 2
3. Remove legacy guards, decorators, and middleware related to authorization
4. Remove unused imports and dead code
5. Update module registrations
6. Verify the app compiles and starts without errors

---

## Phase 4: Create Tests

**Goal**: Write rigorous tests that cover every authorization scenario.

Read `references/phase4-test.md` for the testing strategy.

Tests must cover:
1. **Guard unit tests**: ClaimsGuard and RolesGuard in isolation
2. **Ability factory tests**: Correct abilities for each role (static and dynamic)
3. **Decorator tests**: Metadata is correctly set
4. **Integration tests (e2e)**: Full request pipeline with mocked JWT for each role
5. **Edge cases**: expired tokens, missing claims, role escalation attempts, invalid claim formats, empty claim arrays, concurrent dynamic claim updates

Every test must have a descriptive name that reads like a specification:
```
"should deny access when seller tries to access admin controller"
"should allow admin with client:create claim to create a client"
"should deny admin without client:create claim even though role is admin"
"should reflect dynamic claim changes without server restart"
```

---

## Important Principles

- **Never assume structure** — always analyze first. Two NestJS projects can look completely different.
- **Respect existing patterns** — if the project uses barrels, use barrels. If it uses index files, use index files. Match naming conventions.
- **Preserve authentication** — only touch authorization. JWT, Passport, sessions must remain intact.
- **Claims format is `module:action`** — e.g., `client:create`, `seller:list`, `product:update`. This is non-negotiable.
- **Static claims live in code** — defined as constants/enums, loaded into memory at startup.
- **Dynamic claims live in database** — queried when building abilities for admin users.
- **Each role has its own controller** — the role determines controller access, claims determine endpoint access within that controller.
