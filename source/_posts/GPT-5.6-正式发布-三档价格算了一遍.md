---
title: GPT-5.6 正式发布，我把 Sol/Terra/Luna 三档的价格算了一遍
date: 2026-08-18 22:30:00
permalink: posts/2026/08/18/gpt-56-tiers-pricing/
cover: /img/gpt56-tiers.svg
categories:
  - 技术
tags:
  - GPT-5.6
  - OpenAI
  - AI API
  - 价格
description: GPT-5.6 今天全面上线，Sol/Terra/Luna 三档模型的 API 价格公开。这篇把三档定位、单价、订阅用户怎么用都算清楚，最后附一个能直接跑的调用示例。
---

今天 OpenAI 把 GPT-5.6 全家族放出来了，不是单个模型，是三个档位：Sol、Terra、Luna。官方说未来 24 小时内全球逐步开放。

先说结论，省的往下翻：**大多数人用 Luna 或 Terra 就够，写代码、跑长任务的再考虑 Sol。** 档位之间价格差 5 倍，日常那点活，Sol 的优势你体感不出来。

![GPT-5.6 三档模型对比：定位、价格、适合谁](/img/gpt56-tiers.svg)

## 三档到底差在哪

数字 5.6 是代数，Sol / Terra / Luna 是档位名。官方说这三档以后各自按自己的节奏升级，不用傻等下一代全家桶。

- **Sol**：旗舰。写代码、复杂分析、长任务，官方所有评测的顶分基本都是它
- **Terra**：均衡。日常写作、整理资料、做表格，性能跟上一代旗舰 GPT-5.5 差不多
- **Luna**：最快最便宜。翻译、摘要、批量处理，官方数据说性能还压过 Claude Opus 4.8

## 价格，我算给你看

API 按「每 100 万 token」计费（token 是模型处理文字的最小单位，大概 1 个英文单词 ≈ 1.3 个 token，中文一个字 ≈ 1-2 个 token）：

| 档位 | 输入（每 1M token） | 输出（每 1M token） |
|---|---|---|
| Sol | $5 | $30 |
| Terra | $2.5 | $15 |
| Luna | $1 | $6 |

单看数字没感觉，换算一下：输出 1 万个 token，差不多是一篇 6000-10000 字中文文章的量——Luna 花 $0.06，Terra 花 $0.15，Sol 花 $0.30。写一篇 2000 字的短文，Luna 的成本就是一两分钱人民币的量级。真正拉开差距的是大规模批量任务，比如清洗几千条数据记录，或者批量生成几百份文档。

另外这不是第一次调价了。7 月 30 日官方就宣布过：Luna 降价 80%、Terra 降价 20%。Luna 原来卖 Sol 一个价，现在只有它的五分之一。价格战的味道很浓。

## 订阅用户怎么用

如果你用 ChatGPT 网页版或 App，不用管上面那套 API 单价：

- **Free / Go 用户**：ChatGPT Work 和 Codex 里能用 Terra
- **Plus 及以上**：Sol / Terra / Luna 三档都能选，还能调思考力度（medium、xhigh 这些档位）
- **Pro / 企业用户**：多了 Sol Pro 和 ultra——ultra 是让四个 AI 并行干一件活，复杂任务出结果更快

ultra 普通人基本用不上，属于「钱多时间少」的人的选择。

## 我的建议

- 预算敏感、量大管饱 → **Luna**。翻译、摘要、批量改写这种活，它干得又快又便宜
- 日常主力 → **Terra**。写文档、回邮件、整理会议纪要，性能跟 GPT-5.5 平级，价格只有 Sol 的一半
- 写代码、跑长任务 → **Sol**。程序员和重度用户值得多花这份钱，尤其是一次要跑很久的活

## 动手试一下

最便宜的 Luna 就能干不少活。有 API key 的话（在 platform.openai.com 创建，国内访问需要自备网络条件），一条 curl 就能跑：

```bash
curl https://api.openai.com/v1/responses \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.6-luna",
    "input": "用三句话给我讲清楚什么是 token，别用术语"
  }'
```

模型 ID 别照抄，去 platform.openai.com 的模型列表里看实际名称，一般是 `gpt-5.6-` 加档位名。想省钱的可以开 prompt 缓存（同一段输入反复用，缓存读取打九折），官方 API 文档里有说明。

说句实在的：这波三档定价把「旗舰贵、日常便宜」摆到了明面上。只想用 AI 处理日常事务的话，真不用追着旗舰跑，Luna 起步，不够再往上升级就行。
