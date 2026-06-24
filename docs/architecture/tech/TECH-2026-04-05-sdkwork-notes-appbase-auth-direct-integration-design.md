> Migrated from `docs/superpowers/specs/2026-04-05-sdkwork-notes-appbase-auth-direct-integration-design.md` on 2026-06-24.
> Owner: SDKWork maintainers

# SDKWORK Notes Appbase Auth Direct Integration Design

**Date:** 2026-04-05

## Goal

Replace the current Notes-local auth implementation with a direct integration of the reusable PC React auth module from `sdkwork-appbase`, so login, register, forgot-password, OAuth callback, and QR login all run through the same shared auth components, controller, service contracts, and theme primitives.

## Approved Constraints

- This is a new system. Compatibility with the current Notes-local auth implementation is not a goal.
- The preferred path is direct componentized integration, not a host-owned reimplementation of auth screens.
- Notes should keep its shell, app routing ownership, and product theme context, but the auth feature itself should come from the shared appbase auth package.

## Current State

- `sdkwork-notes-pc-react/packages/sdkwork-notes-auth` owns a fully local auth page and OAuth callback page.
- `sdkwork-notes-core` owns a local Zustand auth store and a handwritten auth service facade.
- `sdkwork-notes-shell` and `sdkwork-notes-user` consume auth state from `@sdkwork/notes-core`.
- The current approach duplicates auth page composition, QR polling orchestration, OAuth flow wiring, and session bootstrap behavior that already exist in `@sdkwork/auth-pc-react`.

## Target Architecture

### Shared Auth Package

Notes will directly consume `@sdkwork/auth-pc-react` for:

- `SdkworkAuthPage`
- `SdkworkAuthOAuthCallbackPage`
- `createSdkworkAuthService`
- `createSdkworkAuthController`
- `useSdkworkAuthControllerState`
- shared auth routing and redirect helpers

### Notes Auth Package

`@sdkwork/notes-auth` becomes a thin integration package with these responsibilities:

- create a Notes-specific auth service bridge that binds the Notes app SDK client into `createSdkworkAuthService`
- create and provide a Notes auth controller
- expose a lightweight app-facing auth context for shell and account pages
- wrap the shared auth pages in a Notes IAM theme provider
- provide Notes runtime config and localized message overrides for the shared auth pages

It should not own:

- primary login/register/forgot-password UI composition
- QR panel composition
- OAuth callback UI composition
- local auth workflow duplication

### Notes Shell

`@sdkwork/notes-shell` remains the owner of:

- root providers
- route guards
- layout mode switching
- Notes shell CSS and host-level auth theme tuning

But it now reads auth state from the Notes auth provider rather than from `notes-core`.

### Notes Core

`@sdkwork/notes-core` continues to own:

- app SDK client construction
- session token persistence helpers
- user settings/profile services

It stops being the source of truth for auth page behavior.

## Routing

The auth surface will move to the shared auth route shape:

- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/oauth/callback/:provider`

Protected Notes routes continue to redirect into the auth workspace with a sanitized `redirect` query.

## Theme And Visual Direction

- Shared auth pages render inside a Notes-owned IAM theme wrapper.
- The wrapper follows the current light/dark mode from the Notes host and feeds that mode into the shared SDKWORK UI theme provider.
- Notes host CSS adds targeted tuning for auth screens so the shared controls sit cleanly inside the Notes shell viewport.
- Auth screens must avoid full-screen `min-h-screen` ownership and stay aligned with the shell viewport, matching the current desktop shell contracts.

## Runtime Config

The shared auth page should only expose flows the Notes app SDK can actually execute:

- login: password, phone code, email code, OAuth, QR
- register: email, phone
- recovery: email, phone

The runtime config should be centralized in `notes-auth`, not scattered across page files.

## Testing Strategy

Use TDD and lock the direct-integration shape with tests that prove:

- Notes auth pages are wrappers around `@sdkwork/auth-pc-react`, not local reimplementations
- Notes auth provider bootstraps one shared auth controller
- shell routing uses `/auth/*` and controller-backed auth state
- account and shell UI read auth state from `@sdkwork/notes-auth`
- shell CSS provides host-level auth tuning without reintroducing viewport-height or gradient-owned auth pages

## Implementation Decision

Proceed with direct appbase integration:

1. write failing contracts for the new auth package boundary
2. add the Notes auth bridge, provider, and theme wrapper
3. replace local auth pages with shared page wrappers
4. switch shell and account consumers to `@sdkwork/notes-auth`
5. remove Notes shell dependence on the local core auth store for runtime auth decisions

