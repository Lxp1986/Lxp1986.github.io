---
title: 十月中旬该盯的三处 AI 额度变化
date: 2026-10-12 23:30:00
updated: 2026-10-12 23:30:00
permalink: posts/2026/10/12/ai-quota-october-deadlines/
categories:
  - AI工具
tags:
  - Claude
  - ChatGPT
  - Cursor
  - 额度
description: Claude Artifact 半价额度 10 月 15 日停、ChatGPT Pro 200 祖父额度撑到 10 月 29 日、Cursor 拆成两套用量池。数字对照 Anthropic / OpenAI / Cursor 官方说明核到 2026-10-12。
cover: /img/ai-quota-oct-cover.png
---

![三处额度节点示意：半价窗口、日历日期、两套用量池](/img/ai-quota-oct-cover.png)

额度这东西，平时不看。

用到一半突然卡住，最烦。

十月中旬正好撞上三处变化。下面数字都对着官方说明核过（2026-10-12）。以后以官方为准，会变。

![三条时间线节点示意](/img/ai-quota-oct-timeline.png)

## Claude：Artifact 半价，15 号停

Anthropic 帮助中心写的：在 Claude 或 Claude Cowork 里创建、编辑 Artifact 之后，后续一段工作对「五小时会话额度」按 50% 计。

谁能用、用到哪天：
- Pro / Max / Team：10 月 1 日到 15 日
- Free：10 月 7 日起，也到 15 日
- Enterprise：不参加

聊天里大概是这样：弄出 Artifact 之后，接下来 10 条消息打折；单条回复最多前 15 个步骤算折扣。Cowork 云端任务另有约 45 分钟或 80 步那套规则。

只动五小时额度，不动周额度。Claude Code、API、Slack、本机 Cowork，都不算。

今天 10 月 12 日了。还在靠这个省额度的，这几天抓紧。过了 15 号，按原价扣。

## ChatGPT Pro 200：旧额度撑到 29 号

OpenAI 帮助中心「About ChatGPT Pro tiers」里，Pro 现在三档：
- Pro 100：$100 / 月，无 Ultrafast
- Pro 200：$200 / 月，无 Ultrafast
- Pro 500：$500 / 月，含 Ultrafast

有一段祖父条款。如果你在 2026-09-22 到 2026-09-29 上午 10 点（太平洋时间）之间任意时刻开着 Pro 200，就能继续用「旧的 included allowance」，用到 2026-10-29。之后自动切到更低的 included allowance。月费还是 $200。

官方这页没写死具体砍了多少倍。只说新订阅用不了旧额度，受影响的人会收到邮件。自己剩多少，看 Settings → Usage。

还有一句容易误会：保住旧额度，不等于升到 Pro 500，也拿不到 Ultrafast。

## Cursor：两套池，别混着烧

![两套用量池示意：一侧较满，一侧较低](/img/ai-quota-oct-pools.png)

Cursor 官方 Models & Pricing 文档把用量拆成两池，按月重置。

一池叫 Cursor Models：Grok 4.7 / 4.6 / 4.5、Composer 2.5，这池相对大方。

另一池叫 Other Models：第三方模型，按各自 API 价扣。

个人档大概：Pro $20、Pro+ $60、Ultra $200（未税）。印度有个 Start ₹649，只含 Cursor Models 那池。

官方自己给的体感：每天主要 Tab，多数够用；每天开 Agent，常见总用量大约 $60–$100 / 月；多 Agent、自动化重度，常见 $200+。

Composer 2.5 标价 input $0.5 / output $2.5（每百万 token）。想少烧贵的那池，优先用 Cursor Models 池里的模型——这也是文档里写的思路。

额度用完可以开 on-demand，按同样 API 价继续，或者升档。用不完不结转。

## 三处放一起

Claude 是促销到期，盯 10 月 15 日。

OpenAI 是老用户额度回落，盯 10 月 29 日。

Cursor 是池子拆开了，选错模型会先烧贵的那池。

自己账户里的剩余数字，以各家 Settings / Usage / Spending 为准。这篇只核对规则，不替任何人算账。
