---
title: BOSS 直聘团队开源 Nanbeige4.3-33B：DeepSWE 自报 65.5，SWE-Bench Pro 却没赢 Qwen
date: 2026-10-25 20:00:00
updated: 2026-10-25 20:00:00
permalink: posts/2026/10/25/nanbeige43-33b-oss/
categories:
  - AI工具
tags:
  - 开源模型
  - Nanbeige
  - Hugging Face
  - 编程模型
description: BOSS 直聘 Nanbeige LLM Lab 开源 Nanbeige4.3-33B（Apache 2.0，512K 上下文）。模型卡自报 DeepSWE 65.5，但 SWE-Bench Pro 输给 Qwen3.8-27B。
cover: /img/nanbeige43-cover.png
---
说个事：BOSS 直聘下面的 Nanbeige LLM Lab，10 月 24 日在 Hugging Face 放了 Nanbeige4.3-33B。Apache 2.0，中英都有，上下文写到 524,288 token（512K）。组织页自己写的，实验室挂在 BOSS Zhipin 名下。

定位不绕弯——先当 ~30B 档教师模型，再往 Nanbeige4.3-3B 蒸馏。本地想跑 coding agent 的人这几天应该已经刷到了。

我去，DeepSWE 自报 65.5，同表里 Qwen3.8-27B 只有 42.5。差这么大，第一反应是“又刷榜了”。翻完表发现 SWE-Bench Pro 它反而输了（60.3 vs 61.7），GPQA 也没过 Gemma。所以别只截赢的行。

![Nanbeige4.3-33B 官方基准概览图（来源：Hugging Face 模型卡 figures/nanbeige43-benchmarks.png）](/img/nanbeige43-cover.png)

## 数字从模型卡抄的

对比对象是 Qwen3.8-27B、Muse-Glimmer-30B、Gemma4-31B，全部最高 thinking。脚注写了：Terminal-Bench 2.1 用 Terminus 2，DeepSWE / Terminal-Bench 4 用 mini-swe-agent v2.4.6，有几项还套了 Claude Code。作者自报，我没复现。

| 基准 | Nanbeige | Qwen3.8-27B | Gemma4-31B |
|---|---|---|---|
| Terminal-Bench 2.1 | **80.9** | 73.0 | 47.2 |
| DeepSWE | **65.5** | 42.5 | 2.7 |
| SWE-Atlas-QnA | **50.8** | 41.9 | 3.3 |
| Automation Bench | **54.2** | 38.3 | 9.7 |
| JobBench | **44.8** | 34.5 | 9.0 |
| SWE-Bench Pro | 60.3 | **61.7** | 51.2 |
| GDPval | 84.8 | **86.4** | 71.4 |
| GPQA Diamond | 89.5 | 89.2 | **91.3** |

终端、多步改仓库那几项确实拉开了。SWE-Bench Pro、GDPval、GPQA 没赢。我的读法就一句：agentic coding 这块像是重点练过，纯推理只是跟得上。

![同图放大版（来源：同上模型卡）](/img/nanbeige43-benchmarks.png)

## 容易踩坑的两处

评测表用的是 `preserve_thinking=true`。这个开关决定多轮要不要把上一轮推理留在上下文——官方建议普通聊天关掉，工具调用 / code-agent 打开。你拿默认聊天设置去对分，数字对不上别怪模型。

工具调用他们推荐 XML，JSON 也能跑。温度：agent 1.0 / top_p 0.95，纯聊天 0.6。后端写了 Transformers、SGLang、vLLM。33B BF16 不是笔记本玩具；GGUF 社区已经在出，官方没报量化显存数字，我也不编。

512K 上下文听着爽，长仓库能塞。能不能真用满，卡上没给长文实测，先当规格看。

想自建 coding agent、数据不想出域的，可以当教师模型试一把。官方自己也说后面有 3B——真上边缘等小杯。第三方复现出来之前，DeepSWE / Terminal 那些分我只当强信号，不当成绩单。

## 链接

- [Nanbeige/Nanbeige4.3-33B](https://huggingface.co/Nanbeige/Nanbeige4.3-33B)
- [Nanbeige/Nanbeige4.3-33B-Base](https://huggingface.co/Nanbeige/Nanbeige4.3-33B-Base)
- [组织页](https://huggingface.co/Nanbeige)（写明隶属 BOSS Zhipin）
