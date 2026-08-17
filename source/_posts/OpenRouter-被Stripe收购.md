---
title: OpenRouter 被 Stripe 收购了，聊聊它是什么、怎么用
date: 2026-08-17 18:00:00
permalink: posts/2026/08/17/openrouter-stripe-acquisition/
categories:
  - 技术
tags:
  - OpenRouter
  - Stripe
  - AI API
  - 市场观察
description: 据 TechCrunch 报道，支付巨头 Stripe 将以 70 亿美元以上收购 AI 网关 OpenRouter。这篇写清楚 OpenRouter 是什么、怎么注册怎么调 API、和直接用官方 API 比差在哪，以及这事对普通用户意味着什么。
cover: /img/openrouter-stripe.svg
---

昨晚看到新闻：Stripe（做支付的那家美国公司）据说要花 70 亿美元收购 OpenRouter。消息来自 TechCrunch，报道里标了「reportedly」，也就是说还没官宣，但业内都在传。

OpenRouter 这名字，不碰 AI 编程的人可能没听过，但跑过 agent（AI 助手）的人基本都绕不开它。写一篇说清楚它是什么、怎么用、被收购对普通用户有什么影响。

## OpenRouter 是什么

一句话：一个 AI 模型「中转站」，用一个 API key 就能调用几百个模型。

现在主流大模型有四五家：Anthropic 的 Claude、OpenAI 的 GPT、Google 的 Gemini、DeepSeek、通义千问，接口和计价各搞一套。OpenRouter 把这些都聚合到自己这里，你只需要注册一个账号、充一笔钱、拿一个 key，代码里换一个模型名字就能切模型，不用每家用一家就重新接一次接口。

官方口径的几个数字：500+ 模型、80+ 供应商、月处理 200 万亿 token、1000 万以上用户。像 Hermes Agent、Replit、Kilo Code 这些 AI 编程工具，背后用的就是它。

它整体的工作方式是这样一张图：

![OpenRouter 工作原理：一个 key 调几百个模型](/img/openrouter-stripe.svg)

## 它解决了什么问题

- **模型路由**：同一个问题，它可以帮你自动挑模型。某个供应商挂了，自动切到另一家，服务不中断
- **统一计费**：充 credits（点数）按量扣费，不用开一堆订阅。试新模型花几毛钱就行
- **OpenAI 兼容**：接口格式跟 OpenAI 一样，代码几乎不用改
- **数据策略**：可以设置只把数据发给信任的供应商

## 怎么用，三步

**第 1 步，注册。** 打开 openrouter.ai，用 Google 或 GitHub 账号登录。

**第 2 步，充值。** 右上角买 credits，最低充 5 美元（约 36 元）就能玩。注意两点：网站走 Cloudflare，国内直连时好时坏，需要稳定的网络环境；支付要用支持外币的卡（Visa/Mastercard）。

**第 3 步，拿 key 调 API。** 拿一个 API key，代码长这样（Python）：

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-你的key",
)

resp = client.chat.completions.create(
    model="deepseek/deepseek-chat",   # 模型名按 厂商/模型 格式
    messages=[{"role": "user", "content": "用一句话解释什么是 KV 缓存"}],
)
print(resp.choices[0].message.content)
```

模型列表在官网 Models 页看，想换模型只改 `model` 那一个字符串。

## 和直接用官方 API 比，差在哪

**好的地方：** 一个 key 全搞定，切换模型不用改代码；小模型便宜，很多免费模型可以随便试；供应商出故障能自动切换，稳定性反而好。

**不好的地方：** 中间多了一层，价格通常比官方原价略高（它要抽成）；数据经过第三方，正式业务要注意合规；国内访问不稳定，生产环境用着不踏实。

我的判断：个人开发者、经常试新模型的人、跑 agent 想省钱的人，适合用。大公司正式业务、对数据敏感的，直接用各家官方 API 更省心。

## 被 Stripe 收购意味着什么

Stripe 是干嘛的？全球最大的在线支付基础设施之一，很多网站的收款、订阅都是它做的。它买 OpenRouter，图的是 AI 应用的钱袋子——以后 AI 应用的计费、订阅、开发者支付，都可能走 Stripe 的管道。

对普通用户来说，短期内大概率什么都没变：OpenRouter 该用用，价格服务照旧。中期要盯两件事：一是 credits 计费规则会不会变，二是数据政策会不会变。我的建议是别一次性充太多钱，观望为主。

> 收购消息为 TechCrunch 2026-08-16 报道（标有 reportedly），尚未官宣；OpenRouter 功能信息查于 2026-08-17，以官网为准。
