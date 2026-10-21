---
title: OpenAI 模型上了 Google Cloud：Astra / Sol / Luna，微软还是主云
date: 2026-10-21 23:20:00
updated: 2026-10-21 23:20:00
permalink: posts/2026/10/21/openai-on-google-cloud-model-garden/
categories:
  - AI工具
tags:
  - OpenAI
  - Google Cloud
  - GPT-6
  - Codex
description: 10 月 21 日 OpenAI 和 Google Cloud 同天发通告：GPT-6 Astra、6.1 Sol、Luna 以企业私有预览进 Model Garden，走 Marketplace 账单、可抵扣 GCP 承诺消费；Codex CLI / Desktop 也能接到 Gemini 平台。微软仍写明是主云。价目表没公开。对照两边官方通告核到当天。
cover: /img/openai-gcp-cover.png
---

OpenAI 今天（10 月 21 日）丢了条短通告：frontier 模型和 Codex 要进 Google Cloud 的 Model Garden。Google Cloud 那篇更啰嗦，直接点了三个型号——GPT-6 Astra、GPT-6.1 Sol、GPT-6 Luna。

我去，微软还是主云。OpenAI 通告末尾原句就那么写的：*Microsoft remains OpenAI's primary cloud partner*。不是换东家，是 GCP 终于能在自家控制台里点 OpenAI 了。

![OpenAI 官方通告配图](/img/openai-gcp-cover.png)
*图片来源：OpenAI 通告页 OpenAI models are coming to Google Cloud（2026-10-21）。*

## 现在能确认的

阶段是 **私有预览**，面向「部分企业客户」，不是你我今天就能开。OpenAI 说 GA 在 *coming weeks*，没给日子。

付钱方式写得很清楚：走 Google Cloud Marketplace，用量进 **同一张 GCP 账单**，可以抵扣已有的 **GCP 承诺消费**，也算进 Flexible Savings Plans（FSP）。对已经在 GCP 上砸了承诺消费的团队，这大概是最大的实际好处——少开一张 OpenAI / Azure 发票。

开发者这边：通告说可以通过 API 调；本地 **Codex CLI / Desktop** 能接到 Gemini 平台做推理。延迟多少、鉴权怎么走、模型 ID 叫啥，一篇都没写。我没 GCP 企业号，进不去预览，这几项标未知。

还写了「即将」但今天用不了的：Google Antigravity、Gemini Agent / Gemini for business 里也能选 OpenAI 模型。ZDR（Zero Data Retention）、Confidential Compute 同样是 *coming soon*。别把「即将」当成现成功能。

Google Cloud 自己给三个型号的定位（原文大意）：

- Astra：编码、电脑操作、专业活、科研，偏吃能力的。
- Sol：接近 Astra，更便宜，面向 agent 编码那类。
- Luna：更快更省，日常大批量。

治理话术他们写了一大段：提示词和输出留在你指定的数据边界，**不用来训练基础模型**。听着好看，真假得等进了预览再验。

![Google Cloud 通告头图](/img/openai-gcp-google-hero.png)
*图片来源：Google Cloud Blog《Google Cloud brings OpenAI models to customers》（2026-10-21）。*

## 谁用得上，谁先别追

说实话，**只开着 ChatGPT Plus / Pro、口袋里没有 GCP 账号的人，这事跟你无关。** 通告里全是企业客户、Marketplace、承诺消费，不是网页版换个登录页。

已经在 GCP 跑数据和流水线、承诺消费还烧不完的团队，可以去填申请表。把 Astra / Sol / Luna 丢进现有的模型对比里，看延迟和账单。人在 OpenAI API 或 Azure 上用得好好的——等价目表和 GA 日期出来再看也不迟。官方 **没公开** token 单价、速率限制、区域列表，现在算不出账。

Google 自称「唯一能提供三大闭源 LLM 的超大规模云」。采购话术有用。写代码的人更在意：预览批不批得下来，以及价目表什么时候挂出来。

## 局限（别忽略）

- 私有预览 ≠ 全员可用，申请了也不保证马上过。
- 价目表、配额、区域，通告里没有。
- ZDR、Confidential Compute 都是即将，不是今天。
- 微软仍是主云伙伴，别读成「OpenAI 叛逃」。
- 我进不了预览，没法替你点控制台。

参考：OpenAI《OpenAI models are coming to Google Cloud》、Google Cloud Blog《Google Cloud brings OpenAI models to customers》，核到 2026-10-21。
