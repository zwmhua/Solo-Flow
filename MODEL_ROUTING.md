# 执行模型路由（从 v2.3.5 第 4 节迁出，按试运行效果调整）

| 任务 | 模型 | 档位 |
|---|---|---|
| 文档/提取/简单配置 | GPT-6 Luna | Low |
| 单模块/普通 Bug/补测 | GPT-6.1 Sol | Medium |
| 跨模块/状态机/恢复 | GPT-6.1 Sol | High |
| 安全/权限/并发/一致性/重大架构（高风险） | GPT-6 Astra | High |
| UI、截图、桌面交互、明确局部修复 | GPT-6.1 Terra | Medium |
| 确定单文件 | GPT-6 Luna | Medium |
| 独立代码 QA | GPT-6.1 Sol | High |
| 关键安全 QA / 根因 | GPT-6 Astra | High |

- XHigh/Max 仅用于罕见高难任务，不因一次失败机械升档。
- 平台可用性和 Human 的最终选择优先；模型强弱不改变权限。
