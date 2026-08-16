# JavaScript toolchain contract

This document defines the organization-wide JavaScript/TypeScript tooling baseline, software supply-chain admission policy, and interface repositories expose to shared automation.

## Baseline

| Concern | Organization policy |
| --- | --- |
| Node.js | Node 24 is canonical. Node 26 is compatibility-only. |
| pnpm | `11.20.0` exactly. |
| TypeScript | `6.0.3` is canonical. TypeScript `7.0.2` may be used only as a compatibility lane where repository technology supports it. |
| Package release age | A package version must be at least 7 days old before normal adoption (`minimumReleaseAge: 10080`, strict enforcement). |
| Exotic subdependencies | Block by default where supported (`blockExoticSubdeps: true`). |
| Oxfmt | Repository-local. |
| Oxlint | Repository-local. |
| Oxc Parser / Resolver | Repository-local and used only where the repository requires them. |
| Turborepo | Repository-local. |

TypeScript 7 compatibility is not an organization-wide required gate. Repositories whose framework/compiler ecosystem does not support it must not add it merely to match another repository.

## Dependency admission

Dependency trust is evaluated in this order:

**supplier/project approval → version eligibility → compatibility validation → adoption**

Approval of a supplier or project does not make every release from that supplier eligible. A release must independently satisfy the seven-day quarantine and repository compatibility requirements. CI success is compatibility evidence, not supply-chain approval.

Package-manager failures caused by these controls must fail the operation. Repositories must not silently disable, reduce, or bypass release-age enforcement.

Release-age exclusions are exceptional controls, not convenience mechanisms. Any future exception must be explicitly documented with, at minimum:

```text
Package:
Version:
Reason:
Security/advisory reference if applicable:
Why waiting seven days is unacceptable:
Scope:
Approver/owner:
Date introduced:
Review/removal date:
```

Popularity, being the latest release, green CI, being only slightly younger than seven days, or use by another repository are not sufficient reasons for an exception. A security release may justify an exception only after verifying that the advisory affects the artifact actually consumed.

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

The root `ci` package script is the canonical repository-owned automation contract. Shared GitHub automation invokes it with `pnpm run ci`; it does not use pnpm's built-in `pnpm ci` clean-install command or reproduce each repository's internal validation steps.

## Responsibility boundary

**The central contract defines what repositories expose and the supported baseline. Each repository defines how its own validation works.**

The following remain repository-local:

- direct dependencies and repository-specific dependency exceptions;
- dependency build-script allow-lists;
- Oxlint configuration;
- Oxfmt configuration;
- architecture validators and dependency rules;
- TypeScript configuration;
- Turborepo task graphs and cache semantics;
- framework-specific validation;
- Vue / Volar validation;
- Storybook and accessibility checks;
- package, bundle, build, and deployment configuration.

The organization `.github` repository must not become a shared npm tooling package, centralize application dependency manifests, or contain Orion-, Polaris-, or Astral-specific architecture rules.

## Immutable automation

All external GitHub Actions must be referenced by a reviewed full commit SHA. Keep the corresponding release version in an inline comment so human review remains practical. Mutable major tags such as `@v4`, `@v6`, or other moving refs are not acceptable trust boundaries.

Reusable organization workflows are also immutable dependencies. Application repositories must call `.github/.github/workflows/js-quality.yml` using one reviewed full `.github` commit SHA, not `@main`. The same reviewed revision should be used by all participating repositories unless a documented transition requires otherwise.

Dependabot may propose future Action-SHA or dependency changes. A Dependabot PR is a candidate, not an approval. It must still pass supplier review, release-age eligibility, vulnerability/security review, compatibility checks, and repository/human approval.

## Reusable workflow

`.github/workflows/js-quality.yml` is the generic CI entry point. The canonical job:

1. checks out the caller repository using an immutable Action SHA;
2. configures Node 24;
3. verifies the repository declares exactly `pnpm@11.20.0`;
4. configures pnpm from the repository's exact `packageManager` field;
5. enables pnpm dependency caching through `actions/setup-node`;
6. performs `pnpm install --frozen-lockfile`;
7. optionally executes a caller-supplied `pre_ci_command` when repository-owned setup is required before validation;
8. runs `pnpm run ci`.

The optional pre-CI command is an orchestration hook only. Its contents and necessity are owned by the caller repository and must not move framework-specific validation into the organization repository.

Callers may explicitly enable a separate Node 26 compatibility job. That job is compatibility evidence and must not silently replace Node 24 as the canonical gate.

For pull requests, shared automation may perform a generic dependency review when GitHub dependency-graph support is available. Application-specific dependency rules remain repository-owned.

## Lockfiles

Lockfiles are generated only with the canonical `pnpm 11.20.0`. The executing `pnpm --version` must be verified before regeneration. CI installs use `pnpm install --frozen-lockfile`; CI must never silently regenerate a lockfile.

## Reference strategy

The long-term trust boundary for the reusable organization workflow is a reviewed full `.github` commit SHA. `@main` is not an acceptable final reference. When the shared workflow changes, repositories adopt the new SHA through ordinary reviewed dependency-change PRs.
