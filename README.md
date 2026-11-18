# Solo-Flow

个人开发的公用工作流（v2.4.5，2026-11-18；v2.4.1 校准后冻结说明仍有效，仅试运行记录或 Human 批准可触发修改；文件名仍沿用 v2.4）。

| 路径 | 用途 | 用法 |
|---|---|---|
| `WORKFLOW.md` | 完整流程与规则 | 大脑按链接读取 |
| `QA-HANDOFF.md` | QA 指令模板（≤25 行） | 出 QA 指令时读取 |
| `MODEL-POLICY.md` | 模型选择规则（档位、升级、Issue 必写、费用红线） | 建 Issue 时读取并写入模型、推理档位与理由 |
| `MODEL_ROUTING.md` | 默认模型表（具体模型名；项目或部门可自备） | 按 MODEL-POLICY 对照选型号 |
| `instructions/chatgpt-brain-v2.4.md` | 大脑自定义指令 | 每个项目的 ChatGPT Project 各贴一份，只改开头仓库信息 |
| `instructions/codex-AGENTS-v2.4.md` | Codex 指令 | 复制到项目根 `AGENTS.md` |
| `templates/.github/` | Issue / PR 模板 | 复制到每个项目仓库 `.github/` |
| `project-skeleton/` | `STATUS.md`、`docs/nodes/` 模板 | 新项目复制一次 |

项目仓库只放项目特有的：`STATUS.md`、`docs/nodes/`、`ARCHITECTURE.md`。
