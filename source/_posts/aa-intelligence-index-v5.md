---
title: Artificial Analysis 榜单换成 v5 了：六成私有题，开源权重被拉开 12 分
date: 2026-10-28 20:00:00
updated: 2026-10-28 20:00:00
permalink: posts/2026/10/28/aa-intelligence-index-v5/
categories:
  - AI工具
tags:
  - Artificial Analysis
  - 基准测试
  - 大模型评测
description: Artificial Analysis 于 10 月 27 日发布 Intelligence Index v5：九项评测，首次有六成权重落在私有/留出题集。官方自报 Claude Opus 5.5 (max) 58 分领先；已发布权重开源模型最高约 32，与榜首差 26 分。
cover: /img/aa-index-v5-cover.png
---

Artificial Analysis 10 月 27 日把 Intelligence Index 升到了 **v5**。一句话：九项评测重组，**六成权重**第一次压在私有题集或留出答案上——他们自己说是为了减污染。

顺手还开了 Progress Index v1，用来跨年份比能力。日常选型他们仍让看 Intelligence Index。

我去，公开榜刷腻了，终于有人把题藏严一点。

![Intelligence Index v5 排行（来源：Artificial Analysis 官方博文配图）](/img/aa-index-v5-cover.png)

## 怎么加权

四块各 25%：

- Knowledge Work：AA-Briefcase 15%、AutomationBench-AA 5%、GDP.pdf 5%
- Coding：FrontierCode 2.0 15%、Terminal-Bench 4.0 10%
- Science：Terminal-Bench-Science 15%、CritPt v2 hard 10%
- General：AA-Omniscience v1.1 15%（准度 10% + 非幻觉 5%）、HLE-Diamond 10%

新进来两样：Cognition 的 **FrontierCode 2.0**（132 个真实开源仓库改动，按“维护者会不会 merge”打分，题私有，跑 3 次）；**Terminal-Bench-Science**（70 个终端里的科研流程）。

拿掉的：GDPval-AA v2.1、SciCode、AA-LCR v1.1。

## 官方自报结果（他们的榜，打个折）

- **Claude Opus 5.5 (max) 58** 第一；GPT-6 Astra (max) 57、GPT-6.1 Sol (max) 55。前五被 Anthropic / OpenAI 占满，Gemini 4 Argon (high) 50。
- 开源权重差距从 v4.3 的 **3 分**拉到 **12 分**。未放权重的 Kimi K3.1 Pro 46；**已发布权重**里 DeepSeek V4.1 Flash 1017 (max) 和 GLM-5.3 (max) 最高 **32**——比榜首低 26，还不如 Claude Haiku 5.5 (max, 36)。
- 前十成本差超过 **13 倍**：GPT-6.1 Terra (max) 约 $0.96 / Index 任务，Claude Fable 5.1 (max) 约 $13.04。Opus 5.5 (max) 约 $10.04；Sol (max) 约 $1.27，分差 4 分内却便宜一个数量级。

没有模型通吃九项。Opus 5.5 赢三项，另外五项冠军散落在 GPT-6 Astra、Sonnet 5.5、Kimi K3.1 Pro、Gemini 4 Argon、Muse Wonder Full。

![成本与开源差距相关图（来源：同上官方博文）](/img/aa-index-v5-cost.png)

## 我觉得有用的两句

私有题占比上来，至少比“全家背过公开榜”靠谱一点。但评分、harness（他们叫 Stirrup）、努力档（low/max）全是自家设定——换 harness 排名会不会翻，他们没证伪。

effort 影响变大了：Opus 5.5 low 35、max 58，成本从约 $0.98 跳到 $10.04。看榜不看 effort，容易踩坑。

输出也更费：相对 v4.3，每任务输出 token 中位数从 35k 涨到 59k；agent 类几项占权重约 55%，却吃掉中位约 90% 的输出 token。

开源这边说实话有点扎心：已发布权重卡在 32 附近，跟闭源顶流不是一个台阶。想跟风“开源已追平”的人，这张 v5 不太给面子。

数字全来自 [官方博文](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5)，我没复现。

## 链接

- [Announcing Intelligence Index v5](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5)（2026-10-27）
- [评测页](https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index)
- [方法论](https://artificialanalysis.ai/methodology/intelligence-benchmarking)
