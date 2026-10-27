---
title: Opera 把 WebAI 塞进浏览器了：本机跑 Gemma，网站也能调
date: 2026-10-27 20:00:00
updated: 2026-10-27 20:00:00
permalink: posts/2026/10/27/opera-webai-local-browser-ai/
categories:
  - AI工具
tags:
  - Opera
  - 本地推理
  - WebAI
  - 浏览器
description: Opera 10 月 27 日宣布 WebAI 以 early preview 进入 Opera One：拟议的 Web 标准，让网站和扩展调用浏览器里的本机模型。首发含 Google Gemma，Mac 上还可接 Apple 端侧基础模型；默认关闭，按站授权。
cover: /img/opera-webai-cover.png
---
Opera 今天（10 月 27 日）把本地模型塞进浏览器了。第一枪叫 **WebAI**，early preview 进 Opera One；GX、Neon 后面跟。

干啥用？网站和扩展可以调跑在**你电脑上**的模型，不必每条都打云、也不必再开一个 AI 订阅。官方举例：扩展整理标签页、标标题党、筛招聘帖——数据不出本机。

我去，浏览器厂又来抢本地 AI 这一桌。

![Opera WebAI 侧栏：可选本机 Completions / Embeddings 模型（来源：Opera 新闻稿配图）](/img/opera-webai-cover.png)

## 它是啥

WebAI 是一份**拟议 Web 标准**，Opera 说有 Google、Microsoft backing。浏览器当主机，页面/扩展走 API 用本地推理。

开发者博文写了三套 API：Prompt、Decision、Semantic Embeddings——生成、分类、找内容关系。演示扩展能把文章句子画成星座图，界面写着 “on device - nothing uploaded”。

首发可接 Google Gemma；Apple silicon Mac 还能用 Apple 端侧基础模型。官方说 model-agnostic，后面还要加更多按设备优化的开源权重。

## 容易踩坑的几处

默认关着。设置里不打开，什么都不下；站点还要单独授权。这点比一装就后台拉模型老实。

平台：新闻稿写 64 位 Windows（Intel/AMD）和 Apple silicon Mac。性能看机器——没给最低配置，弱本别指望丝滑。

“标准”不等于已经进 Chrome。这是 proposed，Opera 先落地；别家何时跟，没时间表。

还有个小不一致：新闻稿写 One 先上、GX/Neon 随后；开发者博文有一处写成三款都在 early preview。我按新闻稿记：先当 One 能用。

![官方演示：文章句子做成星座可视化，标注 on device（来源：Opera 新闻稿配图）](/img/opera-webai-inline.png)

开发者能加 AI 却不用自建机房、不用按 token 付——听着香。网页一旦能调本机模型，权限面板就得当回事；乱点“允许”，踩坑路径跟乱装扩展差不多。

够试扩展、做不碰云的小工具。指望它替代云端大模型写长代码？本机那点算力，别指望。

## 链接

- [Opera 新闻稿](https://press.opera.com/2026/10/27/opera-doubles-down-on-local-ai-shipping-models-directly-in-its-browsers/)（2026-10-27）
- [WebAI 开发者说明](https://next.opera.com/blog/web-ai-local-ai/)
- [Opera 139 Stable](https://blogs.opera.com/desktop/2026/10/opera-139-stable/)
