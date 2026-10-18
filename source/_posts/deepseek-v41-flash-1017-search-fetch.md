---
title: DeepSeek 没涨价，只换了个 Flash：1017 版和要收费的 Search / Fetch
date: 2026-10-18 23:00:00
updated: 2026-10-18 23:00:00
permalink: posts/2026/10/18/deepseek-v41-flash-1017-search-fetch/
categories:
  - AI工具
tags:
  - DeepSeek
  - AI 模型
  - 开源模型
  - 额度
description: DeepSeek 10 月 17 日把 deepseek-flash 换成 V4.1-Flash-1017，模型名和价格都没动，权重 MIT 开源。真正要记的是 Search / Fetch：每千次 0.75 美元，经 Harness、Claude Code、Codex 调用的免费期到 11 月 1 日 0 点（北京时间）结束。数字对照 DeepSeek 官方文档核到 2026-10-18。
cover: /img/deepseek-1017-perf-cost.png
---

DeepSeek 昨天（10 月 17 日）发了 V4.1-Flash-1017。名字后面那四位数是日期，意思是 9 月 10 日那版 V4.1-Flash 的一次更新，不是新一代。

我第一反应是看要不要改配置。答案是不用：API 模型名还是 `deepseek-flash`，价格表一个数没动，老名字 `deepseek-v4-flash` 也照样能用，后台已经全部指向 1017。这类更新本来没什么好写的，值得记一笔的是顺带上线的 Search / Fetch API，因为它有一个明确的收费日期。

## 模型：分数全涨，输出变短

官方公告的原话是：跑分更高、完成任务更快、输出更短，「在性能和成本上都是帕累托改进」。Hugging Face 模型卡里和 9 月版的对比，挑几个我在意的：

| 基准 | 1017 | 9 月 V4.1-Flash |
| --- | --- | --- |
| Terminal-Bench 4.0 | 42.3 | 31.2 |
| DeepSWE v1.1 | 77.0 | 74.2 |
| ProgramBench | 29.1 | 20.3 |
| HLE（不用工具） | 42.6 | 36.8 |

Terminal-Bench 涨了 11 分，是这次最大的一块。不过同一张表里，Opus 5 的 Terminal-Bench 是 51.8、ProgramBench 是 37.0、HLE 是 56.3，都还在 1017 前面。说它追平最强闭源模型是夸大，说它是「便宜档里最能打的那个」比较贴切。

![DeepSWE v1.1 Pass@1 与单任务成本对比图](/img/deepseek-1017-perf-cost.png)
*图片来源：DeepSeek API 文档 DeepSeek-V4.1-Flash-1017 发布公告。横轴是单任务平均成本（对数刻度），数据为 DeepSeek 自己整理的。*

这张图比跑分表更有用。1017 在 max 档拿到 77.0%，单任务成本约 0.2 美元，图上同等分数段的其他模型都在它右边好几格。图是厂商自己画的，横向比较的成本口径我没法复核，看个大概就好。

权重当天上了 Hugging Face 和 ModelScope，许可证是 MIT。架构没变，还是 552B 总参数的 MoE，输入激活 8B、输出激活 16B，1M 上下文。家里那台机器肯定跑不动，这个开源主要是给要自己部署的公司用的。

## 价格：一分没动，但分高峰

现在的 `deepseek-flash` 价格（每百万 token，美元）：

| | 闲时 | 高峰 |
| --- | --- | --- |
| 输入（缓存命中） | 0.003 | 0.006 |
| 输入（缓存未命中） | 0.15 | 0.3 |
| 输出 | 0.6 | 1.2 |

高峰时段是周一到周五 UTC 01:00–04:00 和 06:00–10:00，换成北京时间就是 **上午 9 点到 12 点、下午 2 点到 6 点**，正好是上班时间。周末和国内法定节假日全天按闲时算，便宜一半。

国内用户要注意：白天写代码，跑的基本都是高峰价。能挪的批量任务，比如整理资料、跑测试、批量改稿，放到晚上或周末，账单直接砍半。

## Search / Fetch：真正要设提醒的是这个

这次顺带开放了两个独立 API：Search 搜网页，Fetch 抓网页正文，背后是 DeepSeek 自己的搜索引擎。

- 价格：两个都是 **每 1000 次成功请求 0.75 美元**，按次计费，跟 token 分开算。
- 免费期：通过 DeepSeek Harness、Claude Code、Codex 使用 DeepSeek API 时，服务端工具调用会走 Search / Fetch，这部分目前免费。
- 收费开始：**2026 年 11 月 1 日 0 点（北京时间）**，也就是 10 月 31 日 16:00 UTC。

0.75 美元一千次听起来不多，但 agent 搜东西不是一次两次。一个调研任务搜十几轮、每轮再抓几个页面，一天跑下来几百次很正常。按每天 500 次算，一个月一万五千次左右，约 11 美元。Flash 的 token 这么便宜，搜索费很可能反过来成了大头。

所以这笔钱要不要花，取决于你现在在 Claude Code、Codex 里接 DeepSeek 时开没开搜索。我的打算是：

1. 这两周照常用，顺便看看后台 Search / Fetch 的调用次数，先摸清自己一天大概多少次。
2. 10 月底前决定要不要关掉服务端搜索，改用本地已有的搜索工具。
3. 如果用量不大，就留着，省得自己再维护一套。

## 小结

这次更新对日常使用几乎是白捡：模型名不改、价格不涨，分数和速度都上去了。要记的只有两件事：白天是高峰价；Search / Fetch 11 月 1 日开始收费。现在就去日历上设个 10 月 31 日的提醒吧。

参考：DeepSeek API 文档的 V4.1-Flash-1017 发布公告、Models & Pricing 页面，以及 Hugging Face 上的 deepseek-ai/DeepSeek-V4.1-Flash-1017 模型卡。
