# 执行模型路由（Codex 用；按试运行效果调整）

> Solo-Flow 文档版本：**v3.0**

选档、升级与 Issue 必写项见 [`MODEL-POLICY.md`](MODEL-POLICY.md)。本表是默认模型表；项目或部门有自己的模型表时以该表为准。

模型名称和 ID 核对日期为 2026-11-18。来源为 [OpenAI Codex 模型文档](https://learn.chatgpt.com/docs/models?surface=cli)。

| 任务 | 推荐模型 | 推荐推理档位 | 实际运行型号及可观察来源 |
|---|---|---|---|
| 普通卡（默认） | `gpt-6.2-sol` | Medium | UNKNOWN（按当次记录填写） |
| 难：跨模块/状态机/并发/恢复 | `gpt-6.2-sol` | High | UNKNOWN（按当次记录填写） |
| 高风险（定义见 WORKFLOW §1） | `gpt-6.2-astra` | High | UNKNOWN（按当次记录填写） |
| 视觉：截图/界面/桌面交互 | `gpt-6.1-terra` | Medium | UNKNOWN（按当次记录填写） |
| 快车道 / 纯文档配置 | GPT-6 Luna | Medium | UNKNOWN（按当次记录填写） |

- 普通卡为默认路由。涉及截图、界面观察或桌面交互时走视觉行；同时命中难卡或高风险条件时取更高路由，不因文件少而降级。
- XHigh/Max 仅用于罕见高难任务，不因一次失败机械升档。
- 平台可用性和 Human 的最终选择优先；模型强弱不改变权限。
- 独立验收推荐配置与实际运行型号分开记录；仅推荐值不是运行证据。实际型号无当次可观察证据写 `UNKNOWN`。
- 啊bob：非视觉运行验收推荐 `gpt-6.2-sol / Medium`；需要截图或桌面交互的运行验收推荐 `gpt-6.1-terra / Medium`。
- QA：仅 `qa` 标签触发，只读 diff 静态审查，推荐 `gpt-6.2-sol / High`；不跑测试、不写或运行独立用例、不改仓库。
- 持久化/鉴权/分页继续标 `qa`，其他高风险规则不变；是否需要啊bob由 Issue 的运行验收项决定。QA 的独立性指判断独立，不声称模型异源。当前推荐配置不证明任何历史或当次运行型号；缺证据写 `UNKNOWN`。
