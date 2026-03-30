# sdkwork-notes

SDKWork Notes is a standalone workspace for the Notes product line.

The current primary deliverable is the desktop application in `sdkwork-notes-pc-react`, built with a pnpm workspace architecture, split packages, and a Tauri desktop shell. The repository is prepared for future expansion with `sdkwork-notes-mobile-react` and `sdkwork-notes-mobile-flutter`.

## English

### Overview

This repository contains the Notes application workspace with:

- A React + Vite + pnpm workspace desktop app
- A Tauri desktop shell with tray support and cross-platform packaging
- Split package architecture for auth, shell, notes, user, desktop, i18n, commons, and core
- A GitHub Actions release workflow for Windows, Linux, and macOS desktop bundles

### Current Status

Implemented and verified:

- Desktop Notes application workspace in `sdkwork-notes-pc-react`
- Tauri desktop architecture with tray behavior and packaging
- Local development mode using source/relative shared SDK dependencies
- Release mode using git-backed shared SDK dependencies
- GitHub release workflow for multi-platform and multi-architecture desktop builds

Reserved for future work:

- `sdkwork-notes-mobile-react`
- `sdkwork-notes-mobile-flutter`

### Repository Structure

```text
sdkwork-notes/
├─ .github/
│  └─ workflows/
│     └─ sdkwork-notes-desktop-release.yml
├─ sdkwork-notes-pc-react/
│  ├─ packages/
│  │  ├─ sdkwork-notes-auth/
│  │  ├─ sdkwork-notes-commons/
│  │  ├─ sdkwork-notes-core/
│  │  ├─ sdkwork-notes-desktop/
│  │  ├─ sdkwork-notes-i18n/
│  │  ├─ sdkwork-notes-notes/
│  │  ├─ sdkwork-notes-shell/
│  │  ├─ sdkwork-notes-types/
│  │  └─ sdkwork-notes-user/
│  ├─ scripts/
│  └─ src/
├─ sdkwork-notes-mobile-react/
└─ sdkwork-notes-mobile-flutter/
```

### Tech Stack

- Node.js 22 recommended
- pnpm 10
- TypeScript
- React
- Vite
- Tailwind CSS
- Tauri 2
- Rust / Cargo
- Turbo

### Prerequisites

Before running the desktop app locally, make sure you have:

1. Node.js and pnpm installed
2. Rust and Cargo installed
3. Tauri platform dependencies installed for your operating system
4. The shared SDK repositories available locally for source-mode development, or rely on git mode for release

### Local SDK Dependency Modes

The desktop workspace supports two shared SDK modes:

- `source`
  - Used by local desktop development commands such as `tauri:dev`, `tauri:build`, and `tauri:info`
  - Prefers local sibling SDK sources
- `git`
  - Used by release commands such as `release:desktop`
  - Materializes shared SDK dependencies from git repositories

Environment overrides are also supported:

- `SDKWORK_SHARED_SDK_APP_LOCAL_ROOT`
- `SDKWORK_SHARED_SDK_COMMON_LOCAL_ROOT`

For a standalone `sdkwork-notes` repository layout, local source mode expects these sibling repositories by default:

- `../spring-ai-plus-app-api`
- `../sdk`

If your local layout is different, set the override environment variables above.

### Quick Start

From the repository root:

```bash
cd sdkwork-notes-pc-react
pnpm install
pnpm dev
```

### Desktop Development Commands

Run these inside `sdkwork-notes-pc-react`:

```bash
pnpm test
pnpm check:desktop
pnpm typecheck
pnpm build
pnpm tauri:info
pnpm tauri:dev
pnpm tauri:build
pnpm release:desktop -- --target x86_64-pc-windows-msvc
```

### Release Workflow

GitHub Actions workflow:

- `.github/workflows/sdkwork-notes-desktop-release.yml`

Trigger modes:

- Push a tag matching `sdkwork-notes-release-*`
- Manual `workflow_dispatch`

Current desktop release matrix includes:

- Windows x64
- Windows arm64
- Linux x64
- Linux arm64
- macOS Intel
- macOS Apple Silicon

### Notes on Packaging

The Tauri desktop application is configured for:

- Tray-based desktop behavior
- Multi-platform desktop packaging
- Multi-architecture release builds
- Release asset publication through GitHub Releases

### Verification

The current desktop workspace has been verified with:

- `pnpm test`
- `pnpm check:desktop`
- `pnpm typecheck`
- `pnpm build`

### Development Scope

This repository is currently centered on the desktop Notes product. The mobile directories are intentionally preserved as placeholders so the repository can grow into a multi-client Notes workspace without changing its top-level layout later.

---

## 中文

### 仓库说明

`sdkwork-notes` 是 Notes 产品线的独立工作区仓库。

当前已经完成的核心交付物是 `sdkwork-notes-pc-react`，它采用 pnpm workspace + 分包架构，并集成了 Tauri 桌面端外壳。仓库同时预留了 `sdkwork-notes-mobile-react` 和 `sdkwork-notes-mobile-flutter` 两个目录，便于后续扩展多端形态。

### 当前已完成内容

- `sdkwork-notes-pc-react` 桌面端 Notes 工作区
- React + Vite + pnpm workspace 架构
- Tauri 桌面端架构、托盘行为与跨平台打包能力
- 本地开发使用相对路径 / source 模式共享 SDK
- Release 打包使用 git 模式共享 SDK
- GitHub Actions 多平台、多架构桌面端发布工作流

### 目录结构

仓库顶层结构如下：

- `.github/workflows`
  - 仓库自身的桌面端 release workflow
- `sdkwork-notes-pc-react`
  - 当前主应用，包含桌面端 Notes 工作区
- `sdkwork-notes-mobile-react`
  - React 移动端预留目录
- `sdkwork-notes-mobile-flutter`
  - Flutter 移动端预留目录

### 技术栈

- Node.js 22
- pnpm 10
- TypeScript
- React
- Vite
- Tailwind CSS
- Tauri 2
- Rust / Cargo
- Turbo

### 本地运行前提

在本地运行桌面端前，请确认：

1. 已安装 Node.js 和 pnpm
2. 已安装 Rust 与 Cargo
3. 已安装当前操作系统所需的 Tauri 依赖
4. 已准备共享 SDK 的本地源码，或者在 release 场景下使用 git 模式自动拉取

### 共享 SDK 模式说明

当前桌面工作区支持两种共享 SDK 模式：

- `source`
  - 用于本地开发命令，例如 `tauri:dev`、`tauri:build`、`tauri:info`
  - 优先使用本地相对路径 SDK
- `git`
  - 用于发布命令，例如 `release:desktop`
  - 通过 git 仓库准备共享 SDK 依赖

如需自定义本地共享 SDK 目录，可使用以下环境变量：

- `SDKWORK_SHARED_SDK_APP_LOCAL_ROOT`
- `SDKWORK_SHARED_SDK_COMMON_LOCAL_ROOT`

默认情况下，独立仓库模式会优先查找这些同级目录：

- `../spring-ai-plus-app-api`
- `../sdk`

### 快速开始

在仓库根目录执行：

```bash
cd sdkwork-notes-pc-react
pnpm install
pnpm dev
```

### 桌面端常用命令

在 `sdkwork-notes-pc-react` 目录下执行：

```bash
pnpm test
pnpm check:desktop
pnpm typecheck
pnpm build
pnpm tauri:info
pnpm tauri:dev
pnpm tauri:build
pnpm release:desktop -- --target x86_64-pc-windows-msvc
```

### Release 工作流

仓库已内置桌面端 release workflow：

- `.github/workflows/sdkwork-notes-desktop-release.yml`

触发方式：

- 推送符合 `sdkwork-notes-release-*` 规则的 tag
- 手动触发 `workflow_dispatch`

当前已配置的桌面端发布矩阵包括：

- Windows x64
- Windows arm64
- Linux x64
- Linux arm64
- macOS Intel
- macOS Apple Silicon

### 当前定位

当前仓库重点是桌面端 Notes 产品。移动端目录暂时作为占位保留，后续可以在不改变顶层仓库结构的前提下继续扩展为完整的多端 Notes 工作区。
