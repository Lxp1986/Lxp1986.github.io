---
title: Muse Spark Open 放权重了：816B，Meta 说两台 Mac Studio 能跑
date: 2026-10-16 23:20:00
updated: 2026-10-16 23:20:00
permalink: posts/2026/10/16/muse-spark-open-weights/
categories:
  - AI工具
tags:
  - AI 模型
  - 开源模型
  - Meta
  - Mac
  - OpenRouter
description: Meta 10 月 15 日放出 Muse Spark Open 的权重，816B 总参数、42B 激活、1M 上下文。三条用法、许可证里的几个坑、官方跑分表里没赢的地方，数字核到 2026-10-16 晚。
cover: /img/muse-spark-open-cover.png
---

![Muse Spark Open：816B 总参数，42B 激活，1M 上下文](/img/muse-spark-open-cover.png)

Meta 昨天（美国时间 10 月 15 日）把 Muse Spark Open 的权重挂上了 Hugging Face。

Meta 给它的头衔是「美国最强开权重模型」。这话是他们自己说的，先不管，看看能拿来干嘛。

数字来自 Meta 官方博客、Hugging Face 模型卡和 OpenRouter 模型 API，2026-10-16 晚核对，会变。

## 规格

816B 总参数，MoE，256 个专家每次挑 8 个，单个 token 实际只动 42B。上下文 1M。

文本、图片、视频、音频都能喂，吐出来只有文字。权重给了 BF16 和 NVFP4 两版。

模型卡里写的用途基本全是 agent 那一套：长任务，连着调工具，调失败了自己重试，写代码修 bug。

## 三条路，门槛差很远

![三种用法：API、两台 Mac Studio、自建 GPU](/img/muse-spark-open-paths.png)

最省事的是 API。官方点名了七家：Baseten、Fireworks、Groq、Modal、Nebius、OpenRouter、Together。

OpenRouter 上 ID 叫 `meta/muse-spark-open`。挂牌价每百万 token，输入 1.25 美元，输出 4.25 美元，缓存读 0.15 美元。

有点好笑的是，这价跟 Meta 自家的 Muse Spark 1.3 在 OpenRouter 上一模一样。

第二条是两台 Mac Studio，这个最有意思。Meta 说用最新的 MLX，两台 M5 Ultra 的 Mac Studio 就能把整个模型装下。理由是每台统一内存最多 512 GB，GPU 能直接用，两台凑一起差不多 1 TB；内存带宽 1.2 TB/s，每个 token 只读那 42B 的一小片，够快。

他们拿这套跑了 Muse Code，在开源 Mastodon 客户端 Ice Cubes 上改 bug、加功能、完整编译，还让它逐帧看素材去剪 DaVinci Resolve。这都是 Meta 自己的演示，没在我这边实测。每秒能出多少 token，博客里没写。

第三条自己上 GPU。模型卡写的门槛：NVFP4 至少 700 GB 显存，BF16 要 2 TB。支持 SGLang、vLLM、TensorRT-LLM、Transformers、llama.cpp、Unsloth。这条个人就别想了....

## 许可证不是 MIT

叫 Muse Model License。乍看挺大方，免费用、改、微调、蒸馏、再分发、拿去卖，全写了。

但细看有坑：

用了它，或者用它调出来的衍生模型，界面、文档、官网、设置页总得有个地方醒目写「Built with Muse Spark Open」。

拿它对外卖模型 API，公司 12 个月总营收又过了 2000 万美元，得先跟 Meta 打招呼另签协议。自己产品里嵌个功能、内部用、做研究，不算。

不面向 18 岁以下。后面还挂了一长串禁止用途，军事、写恶意代码、冒充真人都在里面。

![许可证三条要点：署名、2000 万美元营收线、18 岁以上](/img/muse-spark-open-license.png)

小团队、个人基本碰不到营收那条。署名那条倒是谁都躲不掉。

## 跑分表里没赢的地方

Meta 自己贴的对比表，其实没全赢，这点还挺老实。

Artificial Analysis 综合指数它才 39。同一张表里 GLM 5.3 有 45，Kimi K3 44，Qwen3.8 那个 2.4T 的 40。Terminal-Bench 2.1 它 76.4，Kimi K3 是 85.0，差一截。

能打的是 agent 那几栏。MCP-Atlas 89.2，表里最高。JobBench 61.8，也压了 GLM 一点点。

安全倒是下了狠手，StrongREJECT 自适应攻击这项越低越好，它 0.5，表里别家 62.9 到 86.4....

「美国」「开权重」这俩限定词，一个都不是白加的。

## 一个容易烧钱的默认值

模型卡里 `reasoning_effort` 有 low、medium、high、xhigh 四档，**默认是 xhigh**。

不传参数，它每次都往死里想。写复杂代码还行，拿来做个摘要、分个类，输出 token 白烧。短活手动调 low 或 medium，乱填别的值会直接报错。

推荐采样参数也给了：temperature 1.0，top_p 1.0，不开 top_k。

## 原文

- Meta 官方博客：[Introducing Muse Spark Open](https://research.meta.ai/blog/muse-spark-open)
- Hugging Face 合集：[meta-models/muse-spark-open](https://huggingface.co/collections/meta-models/muse-spark-open)（下载要先登录同意许可）
- OpenRouter：[meta/muse-spark-open](https://openrouter.ai/meta/muse-spark-open)
