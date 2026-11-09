# Solo-Flow

个人开发的公用工作流（v2.4.1，2026-11-09 校准后冻结，仅试运行记录可触发修改；文件名仍沿用 v2.4）。

| 路径 | 用途 | 用法 |
|---|---|---|
| `WORKFLOW.md` | 完整流程与规则 | 大脑按链接读取 |
| `QA-HANDOFF.md` | QA 指令模板（≤25 行） | 出 QA 指令时读取 |
| `MODEL_ROUTING.md` | 执行模型路由 | 建 Issue 时读取 |
| `instructions/chatgpt-brain-v2.4.md` | 大脑自定义指令 | 每个项目的 ChatGPT Project 各贴一份，只改开头仓库信息 |
| `instructions/codex-AGENTS-v2.4.md` | Codex 指令 | 复制到项目根 `AGENTS.md` |
| `templates/.github/` | Issue / PR 模板 | 复制到每个项目仓库 `.github/` |
| `project-skeleton/` | `STATUS.md`、`docs/nodes/` 模板 | 新项目复制一次 |

项目仓库只放项目特有的：`STATUS.md`、`docs/nodes/`、`ARCHITECTURE.md`。
