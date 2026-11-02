# 执行模型路由（Codex 用；按试运行效果调整）

| 任务 | 模型 | 档位 |
|---|---|---|
| 普通卡（默认） | GPT-6.1 Sol | Medium |
| 难：跨模块/状态机/并发/恢复 | GPT-6.1 Sol | High |
| 高风险（定义见 WORKFLOW §1） | GPT-6 Astra | High |
| 快车道 / 纯文档配置 | GPT-6 Luna | Medium |

- 多行命中取最高，不因文件少而降级。
- 需要看截图或桌面交互的卡用 GPT-6.1 Terra Medium；同时命中"难"或"高风险"时，以后者为准。
- XHigh/Max 仅用于罕见高难任务，不因一次失败机械升档。
- 平台可用性和 Human 的最终选择优先；模型强弱不改变权限。
- QA 不在本表：QA 由 DeepSeek 做（与 Codex 异源），只对 `qa` 标签 PR。
