# 验收固定入口与两轮止损（候选）

生效条件：本PR由Human审阅并合并；Solo-Flow不走自动合并。候选源可审查、仓外副本可自测，不自动替换其他bot的入口或修改现有定时任务。Workbench双PASS、CI、白名单、安全边界及整卡业务验收不变。

## 固定入口

- 审查源：[运行器](../scripts/acceptance-runner.mjs)、[隔离自测](../test/acceptance-runner.test.mjs)。
- 仓外固定候选目录：`E:\Documents\OpenMausBot\data\workspaces\535025b7-9736-41e0-8de8-5766c142884a\tools\acceptance\v1-candidate`。
- 运行参数只有PR号和40位小写SHA：`node <固定目录>/acceptance-runner.mjs 53 <完整SHA>`。
- 本版固定目标为`zwmhua/Solo-Flow-Workbench`；不凭PR编号猜仓库，不支持跨仓fork。其他仓库须另行固定适配，不能声称通用。
- 每卡只写`cases/<PR>-<SHA>.test.mjs`，通过`process.env.CANDIDATE_DIR`导入候选模块，使用Node内置测试器写独立负例；定向即这份本卡独立用例，全量由仓库原有`npm test`执行。
- 脚本固定Node/git/gh命令及顺序；不新增依赖。Node安装需包含同目录npm CLI，gh/git已有目标仓库授权；不改凭据或权限，不在命令中传token。
- 每次运行使用新目录，保留失败；不覆盖其他验收者目录、旧证据和旧结论。不读取其他bot私有目录。
- 固定源码升级由单独版本审查处理；各卡不再重写拉取、安装、运行、归档和回读逻辑。固定目录随PR审查源更新，不自行修改产品仓库。

## 固定步骤及真实含义

1. 校验两个参数，读取PR，核对当前head等于所给SHA并拒绝fork。
2. 新clone；fetch PR head，再核对FETCH_HEAD，detached checkout；初始工作区须干净。
3. 固定`npm ci --no-audit --no-fund`，确认安装未改tracked文件；记录安装后的候选/安装产物基线。
4. 运行本卡独立用例、原全量测试、原文档检查；命令记录起止、退出码和脱敏stdout/stderr。命令失败立即停止后续检查，已有日志保留。
5. 定向和全量必须有非零测试计数证据；没有计数视为条件未满足，不把零用例当通过。
6. 复核tracked差异为空，并比较全部git可见文件（含未忽略安装产物）的原字节指纹，避免验收修改候选。忽略文件不在该保全范围；测试不删弱的语义审查仍归独立QA，本步骤不替代它。
7. 再查当前head；将运行器、本卡独立用例与命令日志统一脱敏打包，固定大小分片发布到对应PR并逐片回读全文一致。失败保留本地包，不改写为成功，不自动重试发布。
8. 脚本只返回`CHECKS_COMPLETED`或失败，不代签QA PASS、不代阿bob、不合并。浏览器与业务E2E是否执行由独立用例和原日志证明，DTO测试不能代替。

发布前按Bearer（不分大小写）、常见token、口令/密钥赋值与私钥块脱敏；这不是任意敏感内容识别器。产品测试不得接触真实凭据或生产数据。子进程除git/gh鉴权入口外只传基本运行环境，不继承token环境变量。分片总量超过1MB则保留本地包并停止发布，不靠无限分片放大开销。

## 辅助脚本类BLOCKED

- 计数键为同一PR＋同一根因类别，跨SHA、换文件名、改打包形式不清零；产品缺陷、环境缺项、辅助脚本错误、发布错误分别记录。
- 同类辅助错误最多两轮。第二轮仍无法解除则不开始第三轮：已有证据足够时给出有覆盖边界的结论；证据不足时报Human。已有成功用例不填补未测项，不能把BLOCKED改写成PASS。
- 仓外辅助纠正只要不碰产品代码、产品/独立用例断言和预期、不弱化负例、不扩权限，只在PR留一行：时间、类别、第几轮、改动、结果与证据链接；不逐次向阿卡申请裁定。
- 触及断言/预期、产品代码、权限、安全或白名单时，仍按原X1/X2执行。产品回修计数独立保留，不能用“产品回修0”无限续修辅助脚本。
- 固定脚本发布前一次完成语法自测及隔离测试，不逐卡现场拼装。本条替代本事项此前的三轮辅助错误上限，不改产品回修上限。

## 无变化不启动完整回合

前置判定必须在模型回合启动之前，由宿主执行普通程序；不是让AI醒来查询后回复“NOTHING NEW”。

宿主保存上次已处理状态指纹，状态应由已收到执行报告ID、PR head、验收/CI状态、阻塞或授权状态、任务终态组成；忽略查询时间和机器人自己的重复摘要。实际执行满新的40分钟且尚未汇报也算事件变化，以保留既有40分钟报告要求；等待Human期间不累计，无可靠起止则标未知。

运行器导出的`changed(previous, current, launch)`为可测试的前置接口：相同指纹不调用launch；缺失/无效当前指纹报错；只有launch被宿主接受后才允许持久化新指纹。首次运行使用空的previous；取数失败不按“无变化”处理，保留旧指纹并报告一次运行故障。不能先写新指纹后调用launch，避免漏任务。

**接入现状：未接入现有OpenMausBot定时器。** 本次读取其配置及最近运行，确认已有多次完整运行后输出NOTHING NEW；公开配置接口没有唤醒前比较指纹/执行普通程序的字段。本PR规定前置行为并交付可测接口，不声称改几句定时任务指令就能避免启动回合，也不擅自停掉常设汇报。宿主支持该前置接口后才能启用；合并本PR本身不等于宿主已接好。

## 复盘依据：QA促成修复的5项

以下为QA角色发现→修复→复验链，不是DeepSeek模型成绩，也不代替Human独有发现正式计数。用户于2026-11-05 14:48后在本聊天确认：QA模型是人工改为GPT，角色名字沿用。

| 项 | 产品问题 | 发现 | 修复 | 复验 |
|---|---|---|---|---|
| 1 | W01 Bearer大小写导致脱敏遗漏 | [PR6 F1](https://github.com/zwmhua/Solo-Flow-Workbench/pull/6#issuecomment-6623694711) | [修复](https://github.com/zwmhua/Solo-Flow-Workbench/pull/6#issuecomment-6623741893) | [新SHA QA](https://github.com/zwmhua/Solo-Flow-Workbench/pull/6#issuecomment-6623791854) |
| 2 | W02a跨仓响应冲突未拒绝 | [PR9 F1](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629266822) | [F1–F3修复](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629402344) | [新SHA QA](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629492254) |
| 3 | W02a GraphQL缺失/无效endCursor误判末页 | [PR9 F2](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629266822) | 同上 | 同上 |
| 4 | W02a REST last>当前页却缺next误判结束 | [PR9 F3](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629266822) | 同上 | 同上 |
| 5 | W02b REST prev/last矛盾被当作完整分页 | [PR15 F1](https://github.com/zwmhua/Solo-Flow-Workbench/pull/15#issuecomment-6630785235) | [修复与复验链](https://github.com/zwmhua/Solo-Flow-Workbench/pull/15#issuecomment-6631383972) | [阿bob复验及漏项说明](https://github.com/zwmhua/Solo-Flow-Workbench/pull/15#issuecomment-6631435078) |

| PR | 当次角色 | 历史模型证据 | 精确运行身份结论 |
|---|---|---|---|
| 6 | QA-deepseek | [发现报告](https://github.com/zwmhua/Solo-Flow-Workbench/pull/6#issuecomment-6623694711)及[复验报告](https://github.com/zwmhua/Solo-Flow-Workbench/pull/6#issuecomment-6623791854)明确自述gpt-6-astra，并保留原异源门禁缺项；后由Human作例外处置 | 报告明确为gpt-6-astra；本次未取得独立后端运行元数据，不把自述升级为后台证明 |
| 9 | QA-deepseek | [当次报告](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629266822)：OpenAI Codex、会话声明GPT-6系列，精确ID及强度未暴露 | UNKNOWN |
| 15 | QA-deepseek | [当次报告](https://github.com/zwmhua/Solo-Flow-Workbench/pull/15#issuecomment-6630785235)：Codex/GPT-6系，精确后端ID及强度无可核验元数据 | UNKNOWN |

2026-11-05本次读取bot配置：QA-deepseek当前配置为`gpt-6.1-sol`；仅证明当前配置，不反推PR6/9/15。没有证据把这5项归给DeepSeek提供方。原MODEL_ROUTING中的默认异源安排与实际配置差异在此披露，模型由Human选择；本PR不擅自更换bot模型。

## 验证与未验证

先写7项隔离测试，首次因运行器不存在退出1；实现后本地7项成功。隔离测试覆盖固定顺序、参数/SHA/fork、失败留痕、保全不符、发布回读不符、执行中head改变、典型秘密脱敏及状态未变化不调度。

验证命令：`node --check scripts/acceptance-runner.mjs`、`node --test test/acceptance-runner.test.mjs`、`node --test test/check-docs.test.mjs`、`node scripts/check-docs.mjs`、`git diff --check`。仓外候选副本还需核对与PR源字节一致。

本次没有对真实Workbench PR执行固定脚本全链路，没有发布模拟QA结论；真实npm安装/完整git/gh发布链路尚未用此新入口联调。现有Actions只执行原文档检查器测试和文档检查，新运行器隔离测试属于本地证据，不冒称已纳入CI。宿主前置过滤、真实业务浏览器/E2E、节省耗时和token均未实测。
