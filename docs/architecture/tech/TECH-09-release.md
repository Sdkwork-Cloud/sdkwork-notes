> Migrated from `docs/step/09-桌面壳能力与可信发布链升级.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 09 - 桌面壳能力与可信发布链升级

## 1. 目标与范围

本 step 用于在现有 `notes-desktop` 基础上，完成桌面能力治理、updater 入口预留和可信发布链一期建设。

### 1.1 执行输入

- Step 03 会话与配置治理结果
- Step 08 同步与本地能力结果
- `docs/架构/06`、`08`
- 当前 desktop workflow、scripts、capability 与 runtime payload 配置

### 1.2 本步非目标

- 不在本 step 内一次性完成完整多渠道自动更新
- 不在本 step 内扩张高风险桌面权限

### 1.3 最小输出

- 更稳定的 desktop runtime 边界
- `notes-updater` 或等价 updater 落点
- 签名、SBOM、来源证明、notarization 的一期计划与门禁接入

## 2. 架构对齐

- `docs/架构/06-业务流程-应用接口与集成设计.md`
- `docs/架构/08-安全-测试-安装-部署-发布设计.md`

## 3. 当前现状与问题

当前桌面壳较成熟，但发布链仍存在明显短板：

- 自动更新闭环未完成
- 可信发布链不完整
- 元数据层和实际 workflow 在 Web / Desktop 交付职责上仍存在语义张力

## 4. 设计

### 4.1 桌面能力原则

- 继续坚持最小权限和 capability 白名单
- updater、secure storage、tray/runtime 信息都通过平台壳收口

### 4.2 发布治理原则

- 元数据、制品模板、workflow 门禁保持单一事实来源
- 先补签名、SBOM、来源证明和 dry-run，再谈自动更新默认启用

## 5. 实施落地规划

1. 冻结 updater 模块落点与 manifest 消费策略
2. 收敛桌面能力扩展规则和 capability 审查流程
3. 升级 desktop release workflow 与 release contract
4. 引入可信发布链一期检查项

## 6. 测试计划

- desktop bridge / runtime 单测
- workflow contract test
- release dry-run
- capability 边界检查

## 7. 结果验证

完成后必须满足：

- 桌面能力边界仍然克制
- 可信发布链开始具备真实门禁
- 自动更新和发布通道有清晰落点与实施顺序

## 8. 检查点

- `CP09-1`：桌面能力扩展规则冻结
- `CP09-2`：updater 落点和 manifest 策略冻结
- `CP09-3`：release workflow 一期升级完成
- `CP09-4`：可信发布链 dry-run 证据齐全

### 8.1 推荐 review 产物

- `docs/review/step-09-桌面治理审计-YYYY-MM-DD.md`
- `docs/review/step-09-可信发布链验证-YYYY-MM-DD.md`

### 8.2 推荐并行车道

- `09-A`：desktop runtime / updater
- `09-B`：workflow / release chain
- `09-C`：capability / 文档 / 运维决议

### 8.3 架构能力闭环判定

若桌面壳扩展仍缺少权限审查和可信交付门禁，本 step 不算闭环。

### 8.4 快速并行执行建议

- updater 和 workflow 可以并行，但 capability 审核必须由单一 owner 收口

### 8.5 完成后必须回写的架构文档

- `docs/架构/06-业务流程-应用接口与集成设计.md`
- `docs/架构/08-安全-测试-安装-部署-发布设计.md`

### 8.6 本 Step 完成后必须兑现的架构能力

- 桌面 runtime、secure storage、updater 等能力统一通过平台壳收口
- capability 白名单、权限审查和桌面扩展规则全部冻结
- 可信发布链一期具备 dry-run、签名、SBOM 和来源证明的最小闭环

### 8.7 最快完成的并行执行顺序

1. 先冻结桌面能力矩阵和 updater 落点
2. 再并行推进 runtime 适配与 release workflow 升级
3. 然后统一做 capability 审查和 dry-run 验证
4. 最后回写桌面治理和发布链文档

## 9. 风险与回滚

### 9.1 风险

- 若直接启用 updater 而没有可信链，风险会被放大

### 9.2 回滚

- updater 先保留为受控能力，不作为默认发布开关

## 10. 完成定义

- 桌面能力治理、updater 落点和可信发布链一期已经明确并可验证

## 11. 下一步准入条件

进入 step 10 前必须确认：

- 高层测试与质量门禁可以覆盖新的桌面和发布链变更

