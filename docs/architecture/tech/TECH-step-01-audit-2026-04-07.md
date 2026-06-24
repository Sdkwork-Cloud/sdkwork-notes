> Migrated from `docs/review/step-01-基线审计-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 01 基线审计

## 1. 审计范围

- 仓库：`apps/sdkwork-notes`
- 主工程：`sdkwork-notes-pc-react`
- 审计日期：`2026-04-07`
- 审计目标：冻结当前代码、脚本、workflow 和能力边界的真实基线，为 Step 02/03 提供可靠输入

## 2. 当前事实基线

### 2.1 包结构

当前 `sdkwork-notes-pc-react/packages` 下共有 `9` 个包：

- `sdkwork-notes-auth`
- `sdkwork-notes-commons`
- `sdkwork-notes-core`
- `sdkwork-notes-desktop`
- `sdkwork-notes-i18n`
- `sdkwork-notes-notes`
- `sdkwork-notes-shell`
- `sdkwork-notes-types`
- `sdkwork-notes-user`

结论：

- 共享壳层、认证、核心能力、笔记域、桌面壳和用户域已经有清晰包落点
- 目标态中计划引入的 `notes-local / notes-search / notes-sync / notes-history / notes-observability / notes-updater` 等能力包当前仍不存在

### 2.2 脚本与验证面

- `sdkwork-notes-pc-react/scripts` 当前共有 `35` 个文件
- 已具备 workspace、env、internal packages、desktop toolchain、release workflow、shared SDK 和 Tauri 相关 contract / helper 脚本
- 说明工程脚本基础较强，但高层自动化和环境健壮性仍有改进空间

### 2.3 Workflow 面

- 当前 `.github/workflows` 下共有 `1` 条主 workflow：`sdkwork-notes-desktop-release.yml`
- 发布链结构为：`prepare -> verify-release -> desktop-release(matrix) -> publish`
- 说明当前桌面发布链已有清晰的验证与构建主线，但仍未补齐签名、SBOM、来源证明和回滚闭环

### 2.4 当前工作树状态

当前 `git status --short` 统计结果：

- 总变更项：`90`
- 已修改：`50`
- 已删除：`6`
- 未跟踪：`34`

说明：

- 当前仓库正处于活跃演进状态，而不是静态冻结状态
- 后续 Step 02/03 的推进必须尊重现有改动，不能假设仓库是“干净基线”

## 3. 当前已确认的能力边界

- Web 与 Desktop 双入口仍共享 `AppRoot`
- `notes-shell` 已承担共享业务壳角色
- `notes-auth` 已具备认证页面、主题和 store/service 边界
- `notes-core` 已承接 SDK 客户端、app store 与通用服务边界
- `notes-notes` 仍是工作区、编辑器、store、repository 和页面编排的主承载包
- `notes-desktop` 已形成 runtime、bootstrap、tauri bridge 和 Rust capability 边界
- `notes-user` 已有账户页能力

## 4. 高风险改动区域

从当前脏工作树看，以下区域为后续 Step 的高风险区：

- `packages/sdkwork-notes-auth`：认证页面、store、service、theme、导出面均在变化
- `packages/sdkwork-notes-core`：SDK 客户端、服务、store 索引面在变化
- `packages/sdkwork-notes-shell`：路由、Provider、布局和样式在变化
- `packages/sdkwork-notes-notes`：页面、编辑器、侧栏、repository、selector、store 在变化
- `packages/sdkwork-notes-desktop`：Vite 配置、Cargo lock、桌面壳测试面在变化
- `scripts/*`：应用模式、内部 packages turbo、workspace boundary、env contract 等脚本在变化
- `.env.*`：环境配置样本与多环境配置文件新增

结论：

- Step 02 和 Step 03 的推进必须先看这些区域的真实改动意图，再决定收敛策略
- 当前最不适合的动作是“大爆炸式目录迁移”

## 5. 验证结果

### 5.1 命令尝试

已尝试以下命令：

- `pnpm test:workspace:contracts`
- `pnpm test:desktop:contracts`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd test:desktop:contracts`

### 5.2 结果结论

- 直接使用 `pnpm` 时，PowerShell 执行策略阻止 `pnpm.ps1`
- 切换 `pnpm.cmd` 后，命令可启动，但 `scripts/workspace-boundary-contract.test.mjs` 失败，错误为 `spawn EPERM`
- 该问题当前记录为“本地执行环境 / 子进程权限约束”，并不直接证明产品能力实现失败

### 5.3 审计意义

- 说明仓库已具备 contract 验证入口
- 说明当前环境下验证链还不稳定，后续需要在质量门禁与脚本层继续治理

## 6. 当前结论

- 当前仓库已经具备高质量的共享壳、认证、工作区和桌面壳骨架
- 当前仓库尚未进入本地优先、搜索、同步、版本历史等目标态能力包阶段
- 当前最重要的下一步不是继续加功能，而是先完成 Step 02 的共享壳层与工程骨架收敛，并为 Step 03 的会话安全与配置治理收口
- 当前脏工作树意味着后续执行必须偏向“渐进收敛”而不是“重写”

