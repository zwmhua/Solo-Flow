# Solo-Flow 当前结构

> Solo-Flow 文档版本：**v3.1**

本文描述当前仓库内容与文档检查的实现边界，不定义新流程或产品设计。
Solo-Flow 是个人开发工作流、角色指令、模板和 Workbench 数据契约的规范仓库。
这里没有 Workbench 服务或 UI 实现；契约落地不等于产品已接通。

## 仓库入口

- [README.md](README.md)：仓库用途和供项目复制的文件入口。
- [WORKFLOW.md](WORKFLOW.md)：角色、执行主线、停机条件、证据和试运行规则。
- [MODEL-POLICY.md](MODEL-POLICY.md)：模型选择规则；[MODEL_ROUTING.md](MODEL_ROUTING.md) 是未自备模型表时的默认表；[QA-HANDOFF.md](QA-HANDOFF.md) 是独立 QA 的交接模板。
- [instructions/](instructions/)：大脑自定义指令与供项目复制为根 AGENTS.md 的 Codex 指令。
- [templates/.github/](templates/.github/)：下游项目可复制的 Issue 和 PR 模板。
- [project-skeleton/](project-skeleton/)：下游项目可复制的 STATUS 和节点档案模板。
- [docs/workbench/data-contract-v0.md](docs/workbench/data-contract-v0.md)：Workbench 的标签、原生事实及读取边界约定。
- [STATUS.md](STATUS.md)：本仓当前阶段、下一步和风险记录。

`templates/` 和 `project-skeleton/` 是供下游复制的模板，不是正在运行的产品。
本仓没有 `package.json` 或依赖安装入口；检查器使用 Node.js 内置模块。

## 文档检查

[scripts/check-docs.mjs](scripts/check-docs.mjs) 从运行时的当前目录作为仓库根目录，
读取四个必需根文档 README、WORKFLOW、MODEL_ROUTING、QA-HANDOFF，以及必需的 Workbench 契约；
同时递归收集 `docs/` 下的 Markdown 文件。必需文档缺失、不可读、不是文件或为空会报错。
根目录的 ARCHITECTURE.md 不在当前必需列表，也不在 `docs/` 下，因此目前不被该检查器扫描。

检查器识别其支持的 Markdown 行内链接、图片链接和引用定义，检查本地目标是否存在并留在仓库内；
模板和 skeleton 本身不作为扫描源，但被已扫描文档链接到时，其目标路径会被检查。
围栏代码块和行内代码中的示例不参与链接检查；扫描或目标错误会输出来源及原因并以非零状态退出。
外部网址、纯锚点和查询链接被跳过；不验证外站可用性、锚点存在性或完整 CommonMark 语法。

## 当前自动检查

[.github/workflows/docs.yml](.github/workflows/docs.yml) 在 pull request 和推送 main 时运行，
使用 Ubuntu 24.04 与 Node.js 24.11.0，记录版本、检出 commit 和 GITHUB_SHA，然后依次执行：

```sh
node --test test/check-docs.test.mjs
node scripts/check-docs.mjs
```

[test/check-docs.test.mjs](test/check-docs.test.mjs) 用临时夹具测试必需文档、链接及边界情况；
权限和符号链接用例依运行环境可能跳过。工作流只检查文档和检查器，不验证 Workbench 产品端到端行为。
历史参考：[PR #16](https://github.com/zwmhua/Solo-Flow/pull/16) 与其合并后的
[main CI 运行](https://github.com/zwmhua/Solo-Flow/actions/runs/41844004586)；
这些历史记录不代表后续候选提交的检查结果。
