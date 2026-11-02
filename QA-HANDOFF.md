# QA 指令模板 v2.4
> 由大脑填写，只用于标了 `qa` 的 PR。QA（DeepSeek）只读，不改代码、不提交。

## 固定对象
- 仓库：
- PR：#
- 被测 commit（完整 SHA）：
- Diff 范围：`main...<SHA>`

## 重点探查（2–3 条）
1.
2.
3.

## 规则
- 只读：可读代码、可跑测试，不改文件、不推送。
- 结论只对上面这个 SHA 有效；SHA 变了结论作废（只改 STATUS / docs/nodes 的除外）。
- 项目专属风险见该项目的 `ARCHITECTURE.md`。

## 输出格式
评级：PASS / FAIL / BLOCKED / NOT_TESTED（只认这四种，没有"有条件通过"）
发现：每条一行，`文件:行 — 问题 — 证据`
未验证项：
