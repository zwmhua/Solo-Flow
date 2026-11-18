# 验收固定入口与两轮止损（候选）

PR20、PR22已由Human合并；脚本仍为候选，从下一张真实验收卡起试用。普通卡先做本地自测与同 SHA 正式 CI；啊bob仅按 Issue 要求进行独立运行验收，QA仅对 `qa` 标签卡读 diff 静态审查，按 Issue 组合各自独立证据。QA不跑测试、不写或运行独立用例，负例需求由实现者或啊bob承接。试验期持久化/鉴权/分页继续打qa，其他高风险、白名单、安全边界、整卡业务验收及合并权限不变。

## 候选试用、转正与回退

- 阿bob前两张真实验收卡使用候选入口，第一张首次使用即真实联调，不单独建立联调卡、不重跑已收口卡凑样本。当前真实试用0/2。
- 转正条件：两张真实卡均在绑定SHA完成下述固定步骤，退出码、非零用例、保全与脱敏发布回读证据齐备，且没有脚本自身阻塞。两张卡的PR链接、SHA、日志和结果由阿卡核对后在PR记一行转正结论；仅隔离测试成功、规则合并或两次启动均不算转正。
- 任一真实卡被候选脚本自身卡住，立即停止该脚本并回退既有手动验收；保留失败、日志和已有有效证据，只补必要未测项，不删弱断言、不改产品。产品测试真实失败仍按产品FAIL处理，不借回退掩盖。
- 若试用失败，候选保持候选、转正条件未满足；后续修正沿两轮上限，不在本卡无限续修，也不另建联调卡绕过上限。需要替代试用样本时另行报告，不能自动清零重计。
- 两轮BLOCKED上限与仓外辅助修正预授权不依赖候选脚本；手动验收、脚本回退和未转正期间同样有效。

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
6. 复核tracked差异为空，并比较全部git可见文件（含未忽略安装产物）的原字节指纹，避免验收修改候选。忽略文件不在该保全范围；不删弱断言的语义核对归阿bob，qa卡另有QA静态审查，本步骤不替代它。
7. 再查当前head；将运行器、本卡独立用例与命令日志统一脱敏打包，固定大小分片发布到对应PR并逐片回读全文一致。失败保留本地包，不改写为成功，不自动重试发布。
8. 脚本只返回`CHECKS_COMPLETED`或失败，不代签QA PASS、不代阿bob、不合并。浏览器与业务E2E是否执行由独立用例和原日志证明，DTO测试不能代替。

发布前按Bearer（不分大小写）、常见token、口令/密钥赋值与私钥块脱敏；这不是任意敏感内容识别器。产品测试不得接触真实凭据或生产数据。子进程除git/gh鉴权入口外只传基本运行环境，不继承token环境变量。分片总量超过1MB则保留本地包并停止发布，不靠无限分片放大开销。

## 辅助脚本类BLOCKED

- 计数键为同一PR＋同一根因类别，跨SHA、换文件名、改打包形式不清零；产品缺陷、环境缺项、辅助脚本错误、发布错误分别记录。
- 同类辅助错误最多两轮。第二轮仍无法解除则不开始第三轮：已有证据足够时给出有覆盖边界的结论；证据不足时报Human。已有成功用例不填补未测项，不能把BLOCKED改写成PASS。
- 仓外辅助纠正只要不碰产品代码、产品/独立用例断言和预期、不弱化负例、不扩权限，只在PR留一行：时间、类别、第几轮、改动、结果与证据链接；不逐次向阿卡申请裁定。
- 触及断言/预期、产品代码、权限、安全或白名单时，仍按原X1/X2执行。产品回修计数独立保留，不能用“产品回修0”无限续修辅助脚本。
- 固定脚本发布前一次完成语法自测及隔离测试，不逐卡现场拼装。本条替代本事项此前的三轮辅助错误上限，不改产品回修上限。
- 以上两轮上限及辅助修正预授权独立生效；脚本未采用、未转正或已回退均不影响，计数不清零。

## 平台暂不支持，改为降低定时频率

平台暂不支持唤醒前过滤，本次从有效流程移除该方案，不再安排接入工作。现有定时器仍会启动完整模型回合；无新消息时不回复只减少消息，不等于免除回合。既有未接入的`changed`函数及原测试保留为历史代码，不纳入交付承诺、不删除断言，也不把隔离测试当平台支持证据。

2026-11-05读取阿卡、阿Pi、阿bob及QA的相关安排后，按Human本轮要求实际降低以下频率。所有时刻为北京时间，结果仍回各自与Human的原聊天；阿Pi账本仍写原PR。已停安排保持停止，不创建补偿轮询。

| 负责人／定时任务 | 原频率 | 新频率 | 本次调整后的首次运行 |
|---|---|---|---|
| 阿卡／任务进度兜底核对（736187ac） | 每40分钟 | 每120分钟 | 11月5日16:55 |
| 阿Pi／流程巡检（eec48604） | 每15分钟 | 每60分钟 | 11月5日15:31 |
| 阿Pi／进度汇总和收工日报（7ad3bfc3） | 每整点 | 每天10:00、14:00、18:00；18点合并日报 | 11月5日18:00 |
| 阿Pi／五项质量效率账本（01201698） | 每天17:55 | 每天17:55，保留日统计 | 11月5日17:55 |
| 阿卡／每日收工合并汇总（ced22892） | 已暂停（原18点） | 保持暂停，不恢复重复日报 | 无 |
| 阿卡／PR20等已结束的临时CI检查；阿Pi／旧R5单次催办 | 已停止 | 保持停止 | 无 |
| 阿bob、QA | 无定时任务 | 不新增 | 无 |

执行者实际执行满40分钟主动汇报、不自动停工、等待Human不计时的规则保留；120分钟只是阿卡发现漏报的兜底频率，不能保证定时精确40分钟送达。原15/20分钟异常判定阈值保留，巡检改60分钟后可能延迟至下一轮发现。合并、真实阻塞和授权决策消息照常处理，不等定时汇总。代价是发现漏报与汇总变慢；实际减少多少回合、耗时和token仍未知，不宣称已节省完整回合。

## 复盘依据：QA促成修复的5项

以下为QA角色发现→修复→复验链，不是DeepSeek模型成绩，也不代替Human独有发现正式计数。用户于2026-11-05 14:48后在本聊天确认：QA模型是人工改为GPT，角色名字沿用。

下表“无QA”是以当时同缺陷候选的CI和阿bob记录为依据的反事实推断，不是重跑结果；后续回修新增的回归测试不能倒算为事前已有拦截层。已核对三张旧候选：PR6 `82c879f88745f8373394c2c54110a2357e138ba4`、PR9 `88982275fb45187e52a06fc16901974467362c63`、PR15 `ac46507f05f3ac59d341cdd7ac727c5e3103e99c`。

| 项 | 产品问题 | 发现 | 修复 | 复验 |
|---|---|---|---|---|
| 1 | W01 Bearer大小写导致脱敏遗漏 | [PR6 F1](https://github.com/zwmhua/Solo-Flow-Workbench/pull/6#issuecomment-6623694711) | [修复](https://github.com/zwmhua/Solo-Flow-Workbench/pull/6#issuecomment-6623741893) | [新SHA QA](https://github.com/zwmhua/Solo-Flow-Workbench/pull/6#issuecomment-6623791854) |
| 2 | W02a跨仓响应冲突未拒绝 | [PR9 F1](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629266822) | [F1–F3修复](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629402344) | [新SHA QA](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629492254) |
| 3 | W02a GraphQL缺失/无效endCursor误判末页 | [PR9 F2](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629266822) | 同上 | 同上 |
| 4 | W02a REST last>当前页却缺next误判结束 | [PR9 F3](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629266822) | 同上 | 同上 |
| 5 | W02b REST prev/last矛盾被当作完整分页 | [PR15 F1](https://github.com/zwmhua/Solo-Flow-Workbench/pull/15#issuecomment-6630785235) | [修复与复验链](https://github.com/zwmhua/Solo-Flow-Workbench/pull/15#issuecomment-6631383972) | [阿bob复验及漏项说明](https://github.com/zwmhua/Solo-Flow-Workbench/pull/15#issuecomment-6631435078) |

| 项 | 无QA时拦在哪层／会漏（每项一句） |
|---|---|
| 1 Bearer大小写 | 当时[CI 9项成功](https://github.com/zwmhua/Solo-Flow-Workbench/actions/runs/41781041294)且[阿bob R01 PASS](https://github.com/zwmhua/Solo-Flow-Workbench/pull/6#issuecomment-6623702715)，未覆盖小写/混合大小写，故按当时CI+阿bob门禁会漏；Human是否另行发现未知。 |
| 2 跨仓响应冲突 | 当时[CI 21项成功](https://github.com/zwmhua/Solo-Flow-Workbench/actions/runs/41818900766)且[阿bob R01 PASS](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629244297)，未发现请求仓库与返回对象仓库冲突，故按当时两层覆盖会漏；后续其他层能否发现未知。 |
| 3 GraphQL末页游标 | 同一[CI绿色候选](https://github.com/zwmhua/Solo-Flow-Workbench/actions/runs/41818900766)和[阿bob PASS](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629244297)未发现末页endCursor缺失/非法被判完整，故当时会漏；QA指出后补的回归不能算原CI已能拦住。 |
| 4 REST last/next矛盾 | 同一[CI绿色候选](https://github.com/zwmhua/Solo-Flow-Workbench/actions/runs/41818900766)和[阿bob PASS](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629244297)未发现last在更后页却无next仍判终页，故当时会漏；没有其他已实证的拦截层。 |
| 5 REST prev/last矛盾 | 当时[CI 41项成功](https://github.com/zwmhua/Solo-Flow-Workbench/actions/runs/41827955594)且[阿bob R01 PASS](https://github.com/zwmhua/Solo-Flow-Workbench/pull/15#issuecomment-6630793766)，阿bob[后续明确承认旧8组漏掉F1](https://github.com/zwmhua/Solo-Flow-Workbench/pull/15#issuecomment-6631435078)，故当时会漏；R2补测能拦住不能倒算为原有覆盖。 |

## 此后五张qa卡的试验窗口

历史五项说明先随本修订由Human手合；之后下一张新进入验收的qa卡才起算，当前为未起算0/5。历史PR6/9/15及同卡回修、复验不计入；按唯一任务卡计数。五张包括正常完成的静态审查，即使零发现也计；无法完成审查或缺CI/阿bob对照记录的卡保留在窗口记录中标UNKNOWN，不用换卡凑数。

独有发现判据为**同一缺陷候选CI绿且阿bob已PASS仍会放行的真缺陷**；QA疑点须经实现/阿bob确认真缺陷，确认与补负例写入对应卡，QA本身不跑测试。阿卡在每卡既有PR评论登记“窗口序号／卡与SHA／CI／阿bob／QA静态审查／独有发现或UNKNOWN”，阿Pi沿既有账本汇总。缺陷按根因去重，QA提示后的补测不反推另一方事前已发现。

满5张按WORKFLOW规则6结算：核实独有发现0则取消QA步骤，非零则保留；未解决UNKNOWN报Human裁定，不把缺失资料写成0。未满窗不宣称取消QA。此处取消的是QA步骤，不是高风险标签、CI+阿bob、SHA绑定或安全红线；不新增定时任务或额外验收环节。

## 五卡窗口结算（2026-11-09，Human 2026-11-09 批准）

| 序号 | 卡与PR | 独有发现 |
|---|---|---|
| 1 | [#60 / PR64](https://github.com/zwmhua/Solo-Flow-Workbench/pull/64) | UNKNOWN（PR关闭，QA记录不全） |
| 2 | [#75 / PR80](https://github.com/zwmhua/Solo-Flow-Workbench/pull/80) | 有：S1/S2，同SHA CI绿、[阿bob R01 PASS](https://github.com/zwmhua/Solo-Flow-Workbench/pull/80#issuecomment-6678852642)后经[QA疑点](https://github.com/zwmhua/Solo-Flow-Workbench/pull/80#issuecomment-6678853246)复现并回修 |
| 3 | [#77 / PR90](https://github.com/zwmhua/Solo-Flow-Workbench/pull/90) | UNKNOWN（F01最早发现方未核清） |
| 4 | [#97 / PR98](https://github.com/zwmhua/Solo-Flow-Workbench/pull/98) | 无（QA PASS） |
| 5 | [#102 / PR103](https://github.com/zwmhua/Solo-Flow-Workbench/pull/103) | 无（F01由QA与阿bob同时发现） |

结论：独有发现非零，按WORKFLOW规则6保留QA步骤；UNKNOWN两张不改变结论。

## 模型证据（历史身份不随当前改名重写）

| PR | 当次角色 | 历史模型证据 | 精确运行身份结论 |
|---|---|---|---|
| 6 | QA-deepseek | [发现报告](https://github.com/zwmhua/Solo-Flow-Workbench/pull/6#issuecomment-6623694711)及[复验报告](https://github.com/zwmhua/Solo-Flow-Workbench/pull/6#issuecomment-6623791854)明确自述gpt-6-astra，并保留原异源门禁缺项；后由Human作例外处置 | 报告明确为gpt-6-astra；本次未取得独立后端运行元数据，不把自述升级为后台证明 |
| 9 | QA-deepseek | [当次报告](https://github.com/zwmhua/Solo-Flow-Workbench/pull/9#issuecomment-6629266822)：OpenAI Codex、会话声明GPT-6系列，精确ID及强度未暴露 | UNKNOWN |
| 15 | QA-deepseek | [当次报告](https://github.com/zwmhua/Solo-Flow-Workbench/pull/15#issuecomment-6630785235)：Codex/GPT-6系，精确后端ID及强度无可核验元数据 | UNKNOWN |

2026-11-05本次读取bot配置：角色已由`QA-deepseek`改名为`QA`，当前配置为`gpt-6.1-sol`；仅证明当前配置，不反推PR6/9/15。上表保留历史报告当时的角色名。没有证据把这5项归给DeepSeek提供方。MODEL_ROUTING与WORKFLOW已按当前配置修订，不再声称模型异源；模型由Human选择，本PR不更换bot模型。

## 验证与未验证

先写7项隔离测试，首次因运行器不存在退出1；实现后本地7项成功。隔离测试覆盖固定顺序、参数/SHA/fork、失败留痕、保全不符、发布回读不符、执行中head改变、典型秘密脱敏及状态未变化不调度。

验证命令：`node --check scripts/acceptance-runner.mjs`、`node --test test/acceptance-runner.test.mjs`、`node --test test/check-docs.test.mjs`、`node scripts/check-docs.mjs`、`git diff --check`。仓外候选副本还需核对与PR源字节一致。

本次没有对真实Workbench PR执行固定脚本全链路，没有发布模拟QA结论；下一张真实卡首次使用即验证真实npm/git/gh发布链路，不另派联调卡。现有Actions只执行原文档检查器测试和文档检查，新运行器隔离测试属于本地证据，不冒称已纳入CI。平台前置过滤已撤出有效方案；真实业务浏览器/E2E、实际减少回合、节省耗时和token均未实测。
