# 工作流 v2.4.4（2026-11-18）

> 底子：v2.3.5 红线 + HAC 骨架（Issue/PR、停机条件、规则只减不加）。
> 本文给 AI 窗口读，称呼固定，不用"你/我"。
> **冻结**：只有试运行里的记录才能触发修改。
> **v2.4.1（2026-11-09，Human 批准）**：按 v2.4 试运行数据校准行数口径、卡面估算、QA 结算与验收留痕，见 [PR26](https://github.com/zwmhua/Solo-Flow/pull/26)。旧贴入的 v2.4 指令需替换。
> **v2.4.2（2026-11-13，Human 批准）**：新增 [MODEL-POLICY.md](MODEL-POLICY.md)；拆卡时按该规则选模型与推理档位，并写入 Issue。具体模型表在项目或部门配置，未自备时用 [MODEL_ROUTING.md](MODEL_ROUTING.md)。
> **v2.4.3（2026-11-18）**　项目根 `AGENTS.md` 由通用模板和项目补充组成。大脑收到设计文档后主动拆卡，提供功能拆分、依赖顺序、逐卡验收点和首张待执行 Issue。[PR #31](https://github.com/zwmhua/Solo-Flow/pull/31)
> **v2.4.4（2026-11-18）**
> - 已确认且未变化的具体旧现场原样保留，从最新 main 隔离开工，不逐卡重复解除 X1。
> - 卡内同范围有效资源许可不因回修换 SHA 作废；新 SHA 仍须重跑并重新绑定验收，红线与平台审批不变。

## 0. 角色

| 角色 | 是什么 | 做什么 | 不做什么 |
|---|---|---|---|
| Human | 项目负责人（本人） | 提需求、拍板快车道、验收、合并前在网页上改 STATUS 和节点档案、合并、授权 | — |
| 大脑 | ChatGPT 窗口 | 三问、收到设计文档后主动拆卡、按模板建 Issue | 不写代码、不跑测试、不合并 |
| Codex | 本地 Codex | 按 Issue 写测试和代码、提 PR | 不合并，不改白名单外的文件 |
| GitHub Actions | CI | 每个 commit 自动跑测试 | — |
| 啊bob | 独立运行验收角色 | 每卡验收；补CI未覆盖的运行验证，承接卡内负例需求 | 不写卡、不改业务代码、不合并、不代签 QA PASS |
| QA | 静态审查角色；当前配置 gpt-6.2-sol | 仅对 `qa` 标签 PR 读 diff；判断独立，不宣称模型异源 | 不跑测试、不写或运行独立用例、不改仓库 |

## 1. 风险判定（快车道和 `qa` 标签共用）

碰到以下任一项即为**高风险**：
- 写入、删除或改格式的持久化数据
- 鉴权、支付、迁移、依赖变更、不可逆操作

**拿不准按高风险。** 高风险必须标 `qa`，不得走快车道。AI 只按清单提醒，快车道由 Human 拍板。

持久化、鉴权、分页卡打 `qa`；支付、迁移、依赖及不可逆操作等高风险边界不变。非 `qa` 卡默认门禁为同SHA的 CI 成功 + 阿bob PASS；仅 `qa` 标签卡另要求 QA 对同SHA的 diff 静态审查 PASS，不把未调用QA写成QA通过。需要补负例时由大脑写进实现或阿bob的卡，由该责任人补测；QA只指出疑点位置与契约依据。

## 2. 行数口径

- 一个 PR 的行数 = 业务代码 + 测试的新增与删除之和。不算锁文件、自动生成的文件、STATUS 和 docs。
- **行数阈值只在此定义**（Human 2026-11-09 批准）：普通卡上限 400 行。项目根 `AGENTS.md`「执行更新」另有行数节时以项目为准（如 Workbench 600）；指令模板、大脑指令和 Issue 模板不再写具体数字。
- 卡面只写估算（业务、测试分列），不写自定上限；X2 行数停线只认本节或项目 `AGENTS.md` 的阈值。估算超过就拆卡；实际 diff 超过就按"超范围"走 X2 停下。
- 快车道上限 20 行。
- 这个数靠试运行校准：多数卡都顶到上限、被拆碎了就调高；从来碰不到就不动。2026-11-09 依据：普通卡多顶在 159–191 行，200 行口径冲突误停 5 次；401–600 行卡真缺陷回修率 7/16 高于 ≤200 行的 2/22，故调到 400 而非 600。自本修订起满 10 张普通卡后按回修记录再校准。
- UI V2 迁移专项（2026-11-03 试运行）已结束并撤销（Human 2026-11-09 批准）：实际 4 卡（HoSaiLei PR19/26/27/29，业务+测试 593/276/455/817 行），原按 200 行设计约 13 卡；2 卡被 QA 拦下真缺陷、各回修 1 次。不推广到其他迁移。

## 3. 流程图（只画主线和停机点）

```mermaid
flowchart TD
    S([新窗口：读 STATUS.md + 列出 open PR/Issue]) --> A[Human 提需求]
    A --> FAST{Human 拍板：快车道？}
    FAST -->|是：Human 在指令里写白名单| G
    FAST -->|否| B{大脑三问<br>先读 ARCHITECTURE.md 和相关节点档案}
    B --> E[按模板建 Issue<br>超适用行数上限则拆卡]
    E --> G[Codex 核对 repo/分支/commit/白名单]
    G -->|不符| X1[停下报告]
    G --> H[先测试后代码]
    H -->|冲突/新依赖/超范围/超行数上限| X2[停下问]
    H --> P[PR]
    P --> T[同SHA的 CI 成功 + 阿bob PASS]
    T --> Q{标了 qa？}
    Q -->|否| V
    Q -->|是| L[QA 只读 diff 静态审查<br>写明所审 commit]
    L --> V{Human 验收<br>检查 Files changed}
    V -->|ACCEPTED| W[Human 在网页上改<br>STATUS / 节点档案，有变化才改]
    W --> M[Human Squash 合并]
    M --> S

    classDef stop fill:#fdd,stroke:#c00
    class X1,X2 stop
```

**回路（不画线，按文字执行）**
- 测试失败 / QA FAIL 代码错 / REJECTED 代码问题 → 回 Codex 修。**第 3 次回修之前停下，回大脑三问。**
- QA FAIL 规则或需求错 / REJECTED 需求理解错 → 回大脑三问。
- NOT_TESTED（整份 QA 无法进行）按 BLOCKED 处理。
- BLOCKED 第 1 次 → 补条件重测；第 2 次 → Human 决定修环境还是跳过，跳过要在 PR 里写明风险。
- 辅助脚本类 BLOCKED 按下述“验收减负”专项：同一 PR 同类最多两轮，不进入第三轮；不涉及产品代码与断言的仓外纠正只留一行，不逐次发裁定。其他 BLOCKED 保持原规则。
- 拆卡不回到 Human 提需求，直接建多张 Issue。
- 大脑收到设计文档后必须主动拆卡，交付功能拆分、依赖顺序、每张卡可独立验证的验收点，并给出第一张待执行 Issue。不能只完成设计入库便停止，也不能等待 Human 逐张点名。不新增审批层，不自动执行所有卡；沿用三问、Issue、行数、WIP 及其他安全门禁。
- 每次停机（X1/X2）、回修、BLOCKED，都在 Issue 或 PR 评论里留一行。没留痕的，就算没触发过。
- X1/X2 的具体触发条件以 Codex 指令为准。

**已确认旧现场与隔离开工**

- 经 Human 明确确认且有可核对记录的既有遗留改动，须限定具体范围；同一未变化旧现场可原样保留，后续从最新 main 建独立干净工作树开工，不为其每卡重复解除 X1。不得删除、stash、reset、提交或覆盖旧现场。
- 此例外不适用于任意脏文件：新未知改动、范围或内容变化、隔离无法证明、仓库基线不明、新工作树脏，仍按 X1 停。

## 4. 三问（每问一句话，答不出就回 Human）

先读 ARCHITECTURE.md 和相关节点档案，再答：
1. 真实目标是什么
2. 哪些可以砍
3. 最可能在哪出错（写进 Issue 的"验收点"）

## 5. 状态放在哪（每样只放一处）

| 内容 | 放哪 |
|---|---|
| 卡、白名单、行数、要不要 QA、模型与推理（按 [MODEL-POLICY.md](MODEL-POLICY.md)） | Issue |
| 在途的卡 | GitHub 上开着的 PR / Issue |
| 测试结果 | Actions run（手跑的贴在 PR 评论） |
| QA 结论、停机和回修记录 | PR / Issue 评论 |
| Human 验收结论 | PR 评论一行 `ACCEPTED <SHA前12位>`，Human 合并以此为准（Human 2026-11-09 批准） |
| 已合并的内容 | git log |
| 阶段、下一步、已知风险和跳过项 | `STATUS.md` |
| 踩过的坑和做过的决定 | `docs/nodes/<节点>.md`，有才追加，三问前要读 |

**永远不在 Codex 白名单里**：`.github/workflows/`、`STATUS.md`、`docs/nodes/`。

## 6. 规则

1. **快车道**：由 Human 拍板，只限低风险且 ≤20 行。省掉三问和 Issue，但仍要走 G 和停机条件，白名单由 Human 在指令里写明。PR 第一行写"快车道：<一句说明>"。
2. **WIP 上限**：同时最多 2 个没合并的 PR，快车道的 PR 也算。
3. **测试证据**：
   - 默认证据是 Actions run：命令在 workflow 里，退出码看检查状态，日志看 run 页面，commit 看 run 的 SHA。
   - Actions 跑不了的测试（硬件、本地数据、桌面端 E2E）由啊bob 手跑，并贴出命令、退出码、Human 能打开的原始日志和所测的 commit。
   - 手跑证据写所测 commit，QA结论写所审 commit；与 PR 最新 commit 不一致则作废，运行验收重新核验，QA重新读diff静态审查，不要求QA跑测试。
   - 唯一豁免：在 QA 之后，如果新 commit 只改了 `STATUS.md` 和 `docs/nodes/`，QA 不用重做。Human 合并前在 Files changed 里确认确实只改了这两处。
   - **卡内测试资源许可**：同一卡、同用途、同资源与权限范围、仍有效的明确授权，不仅因回修换 SHA 就作废；新 SHA 必须重跑并重新绑定 CI、阿bob、必要 QA。资源许可延续不等于沿用旧 SHA 的验收结论。
   - **许可边界**：新任务、扩大范围或权限、凭据变更、服务启停、真实下单、部署、破坏动作均不自动授权；已拒绝、撤销、过期或已耗尽的一次性许可不得复活。
   - 平台自身强制审批照常，不可绕过；不默认读取秘密，不构成永久授权。
4. **回修上限**：第 3 次回修之前停下，回大脑三问。
5. **部分完成**：ACCEPTED 但有没做完的部分，直接新开 Issue，不留口头的"有条件验收"。
6. **QA（2026-11-09 结算，保留）**（Human 2026-11-09 批准）：五张 `qa` 卡窗口（Workbench PR64/80/90/98/103）已满；PR80 为独有发现（同SHA CI 绿、阿bob R01 PASS 后经 QA 疑点复现 S1/S2），按原规则保留 QA 步骤。PR64、PR90 记录不全标 UNKNOWN，不影响结论。结算记录见[验收说明](docs/acceptance-automation.md)。
7. **红线不变**：没有 Human 授权，不合并、不部署、不做不可逆操作；不覆盖未知改动、日志和测试证据。
8. **规则只减不加**：同一个问题漏过两次才加规则。每 10 张卡，按停机、回修、BLOCKED、部分完成的记录，删掉从没触发过的**事件类规则**（回修上限、BLOCKED、部分完成、快车道）。**防护类规则**（红线、WIP 上限、commit 绑定、永久禁区、风险判定）不按触发次数删。
9. **报告上墙**：每张卡做完，结论必须进 PR 评论，摘要在上、原文用 `<details>` 折叠在下。
   - Codex：交付时自己把执行报告贴到 PR 评论（含所测 commit）。
   - QA：完成后自己用 `gh pr comment` 把结论贴到 PR 评论（含所测 commit），评论第一行固定写 `QA：`（它用 Human 账号发评论，靠这行区分）。历史旧前缀不改写。贴不上时 Human 把原文转给啊bob，由啊bob 原样贴上，不改结论。
   - 大脑出的回修/补证据卡里写明这一条，缺报告评论的 PR 不进验收。

## 7. 模板（只放一处，以文件为准）

- 模型选择规则：[`MODEL-POLICY.md`](MODEL-POLICY.md)（具体模型表在项目或部门配置；未自备时用 [`MODEL_ROUTING.md`](MODEL_ROUTING.md)）
- 验收减负（PR20/PR22）：候选脚本试用与回退、定时安排详见[验收说明](docs/acceptance-automation.md)；辅助错误两轮止损见第 3 节回路（Human 2026-11-09 批准）。
- Issue 模板：[`templates/.github/ISSUE_TEMPLATE/task.md`](templates/.github/ISSUE_TEMPLATE/task.md)
- PR 模板：[`templates/.github/pull_request_template.md`](templates/.github/pull_request_template.md)
- STATUS 模板：[`project-skeleton/STATUS.md`](project-skeleton/STATUS.md)
- 节点档案模板（有坑才追加）：[`project-skeleton/docs/nodes/_TEMPLATE.md`](project-skeleton/docs/nodes/_TEMPLATE.md)
- 测试结果看 Actions，手跑的由啊bob 贴在评论里。

## 8. 开跑前的一次性准备（不走流程）

1. 啊bob 配好 Actions（Windows runner），先只挂核心测试。私有仓库的 Windows 分钟数按倍率计费，具体倍率以 GitHub 当前的计费页为准。
2. 如果账号方案支持，给 main 开分支保护：只能通过 PR 合并，检查必须通过，勾上"包含管理员"。不支持时，由 Human 合并前确认 CI 为绿。
3. 在仓库里建好 `STATUS.md`、`docs/nodes/`、Issue 模板和 PR 模板。
4. 给啊bob 的凭据用 fine-grained token 或独立 bot 账号，只授权所需仓库，不用 Human 本人账号登录。

## 9. 试运行

- 普通试运行范围：M0 收尾之后的卡。
- 普通卡跑满 10 张，按规则 8 清理一次；行数上限按第 2 节校准。
