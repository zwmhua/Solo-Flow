<!-- Solo-Flow 文档版本：v3.1 -->
关联：closes #N（快车道写：快车道：<一句说明>）
改动文件：
测试命令：
未验证项：
本地交付转 PR（如适用）：记录集成检查、单独推送授权及最终远端候选 SHA。
CI覆盖逐项判断及依据（引用 Issue；缺判断不等于免验）：
适用验收：无需独立验收 / 仅需啊bob / 仅需 QA / 两者都需要（按 Issue）。
证据：本地自测 / 同 SHA 正式 CI / 啊bob 独立运行验收（如要求）/ QA 同 SHA 静态审查（仅 qa 标签）；分别记录候选 SHA、实际运行型号与来源，无当次证据写 UNKNOWN。若 Actions 检出 GitHub 测试合并提交，记录 PR head SHA、该次运行的 base SHA 和实际检出的测试 SHA，核对 head 是当前候选、测试提交由该 head 与 base 生成。换 SHA 按影响范围复核并绑定新候选，旧 SHA 结论仅作历史引用。
qa试验记录（仅qa卡）：窗口序号 / 卡与SHA / CI绿及阿bob PASS链接 / QA真缺陷证据 / 独有发现：无或缺陷或UNKNOWN。

<!-- 测试结果看 Actions；手跑结果由啊bob 在评论贴（含所测 commit 与原始日志）。 -->
<!-- 独有发现=同缺陷候选CI绿且阿bob已PASS仍会放行的真缺陷；缺证UNKNOWN。起点及满5张去留按WORKFLOW规则6，不计历史修复或同卡复验。 -->
