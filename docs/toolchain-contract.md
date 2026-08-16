# JavaScript toolchain contract

This document defines the organization-wide JavaScript/TypeScript tooling baseline and the interface repositories expose to shared automation.

## Baseline

| Concern | Organization policy |
| --- | --- |
| Node.js | Node 24 is canonical. Node 26 is compatibility-only. |
| pnpm | `11.22.0` exactly. |
| TypeScript | `6.0.3` is canonical. TypeScript `7.0.2` may be used only as a compatibility lane where repository technology supports it. |
| Oxfmt | Repository-local. |
| Oxlint | Repository-local. |
| Oxc Parser / Resolver | Repository-local and used only where the repository requires them. |
| Turborepo | Repository-local. |

TypeScript 7 compatibility is not an organization-wide required gate. Repositories whose framework/compiler ecosystem does not support it must not add it merely to match another repository.

## Shared script interface

Applicable JavaScript repositories expose these package scripts:

- `format`
- `format:check`
- `lint`
- `architecture`
- `typecheck`
- `test`
- `build`
- `check`
- `ci`

A repository may omit an operation only when that repository type genuinely has no meaningful version of the concern. Existing validation must not be weakened to make the command surface look uniform.

`pnpm ci` is the canonical repository-owned automation contract. Shared GitHub automation performs setup and invokes that command; it does not reproduce each repository's internal validation steps.

## Responsibility boundary

**The central contract defines what repositories expose and the supported baseline. Each repository defines how its own validation works.**

The following remain repository-local:

- Oxlint configuration;
- Oxfmt configuration;
- architecture validators and dependency rules;
- TypeScript configuration;
- Turborepo task graphs and cache semantics;
- framework-specific validation;
- Vue / Volar validation;
- Storybook and accessibility checks;
- package, bundle, build, and deployment configuration.

The organization `.github` repository must not become a shared npm tooling package and must not contain Orion-, Polaris-, or Astral-specific architecture rules.

## Reusable workflow

`.github/workflows/js-quality.yml` is the generic CI entry point. The canonical job:

1. checks out the caller repository;
2. configures Node 24;
3. configures the pnpm version declared by the repository's exact `packageManager` field;
4. enables pnpm dependency caching through `actions/setup-node`;
5. performs `pnpm install --frozen-lockfile`;
6. optionally executes a caller-supplied `pre_ci_command` when repository-owned setup is required before validation;
7. runs `pnpm ci`.

The optional pre-CI command is an orchestration hook only. Its contents and necessity are owned by the caller repository and must not move framework-specific validation into the organization repository.

Callers may explicitly enable a separate Node 26 compatibility job. That job is compatibility evidence and must not silently replace Node 24 as the canonical gate.

## Reference strategy

Initial callers use `starchaser-framework/.github/.github/workflows/js-quality.yml@main` because this repository does not yet have a managed release-tag process. `main` is intentionally stable policy: changes to reusable workflows require review and validation before merge.

A future organization-governance change may introduce managed release tags and pin callers to those tags without changing the repository script contract.
