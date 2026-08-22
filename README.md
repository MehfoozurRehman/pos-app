# Retail & Restaurant POS Monorepo

An enterprise point-of-sale (POS) monorepo system containing a native desktop checkout application (Electron) and a web management administration portal (Turborepo).

## Overview

The `pos-app` monorepo manages retail store checkouts and administrative backend operations across two distinct applications orchestrated with [Turborepo](https://turbo.build/):
- **Desktop POS (`apps/pos-electron`)**: High-speed offline-first desktop cashier terminal with thermal receipt printing and barcode scanning.
- **Admin Panel (`apps/admin-panel`)**: Web-based store inventory, employee shifts, sales reporting, and product catalog management portal.

## Tech Stack

- **Monorepo Engine**: [Turborepo](https://turbo.build/) (v2), pnpm workspaces
- **Cashier Terminal**: Electron, React, TypeScript
- **Administration Portal**: Next.js / React, TypeScript
- **Tooling**: Prettier, TypeScript, ESLint

## Prerequisites

- Node.js (v18 or higher recommended)
- Package manager (`pnpm` v10 recommended)

## Getting Started

1. **Install all workspace dependencies**:
   ```bash
   pnpm install
   ```

2. **Run All Workspaces Concurrently**:
   ```bash
   pnpm dev
   ```

3. **Running Specific Applications**:
   - Cashier Desktop Terminal:
     ```bash
     pnpm --filter pos-electron dev
     ```
   - Store Admin Portal:
     ```bash
     pnpm --filter admin-panel dev
     ```

## Available Scripts

- `pnpm dev` - Runs all applications in development mode with Turbo pipeline.
- `pnpm build` - Compiles both Electron client and web admin for production.
- `pnpm lint` - Runs linting across all monorepo workspaces.
- `pnpm type-check` - Performs TypeScript verification across packages.
- `pnpm format` - Formats the entire repository using Prettier.

## Author

Created by [Mehfooz-ur-Rehman](https://github.com/MehfoozurRehman).
