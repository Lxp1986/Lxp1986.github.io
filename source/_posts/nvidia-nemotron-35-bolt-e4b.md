---
title: NVIDIA 放出 Nemotron 3.5 Bolt E4B：冲着本地语音助手去的 4GB 小模型
date: 2026-10-24 20:00:00
updated: 2026-10-24 20:00:00
permalink: posts/2026/10/24/nvidia-nemotron-35-bolt-e4b/
categories:
  - AI工具
tags:
  - NVIDIA
  - 开源模型
  - 本地推理
  - 小模型
description: NVIDIA 10 月 23 日正式放出 Nemotron 3.5 Bolt E4B 4GB，基于 Gemma 4 E4B 后训练，目标是 GeForce / Jetson 上的本地语音和设备助手。官方自称平均质量比上一代高约 40%，输出 token 最多少 80%。
cover: /img/nemotron-bolt-e4b-cover.png
---
NVIDIA 10 月 23 日把 Nemotron 3.5 Bolt E4B 4GB 正式放出来了。底座 Google Gemma 4 E4B，NVIDIA 自己做后训练。官方写的目标场景挺直白：本地语音助手、设备控制、游戏 NPC、机器人接口，跑在 GeForce RTX、Jetson、RTX Spark、DGX Spark 上。

参数量写的是 8B（有效 4B），Q4_K_M 冲着大约 4GB 显存。许可证 OpenMDW-1.1，不是 Apache，商用前自己读条款。

我去，又一个“小而强”。这次数字给得细，我挑能核的说。

![官方“Smart and Fast”对比图：横轴首 token 延迟，纵轴代表基准均分，气泡大小是显存（来源：NVIDIA Nemotron 研究页 / Hugging Face 模型卡）](/img/nemotron-bolt-e4b-cover.png)

## 官方自测（打个折看）

研究页两句口号：相对自家上一代，关键对话 agent 基准平均质量大约高 40%；相对同档对手，输出 token 最多少大约 80%。注意后头那个“最多”，不是平均。

细表几条（BF16，NVIDIA 自测）：

| 基准 | Bolt E4B | Gemma 4 E4B | Qwen 3.5 4B | Nano 4B |
|---|---|---|---|---|
| MultiChallenge | 53.1 | 42.1 | 51.8 | 35.3 |
| RoleMRC | 80.6 | 74.6 | 65.8 | 47.0 |
| IHEval | 84.8 | 67.0 | 60.6 | 51.3 |
| BFCL-v3 | 68.5 | 66.4 | **70.9** | 61.1 |
| Tau2-Bench | 55.1 | 38.5 | **75.1** | 29.2 |

工具调用那两行有点打脸：BFCL、Tau2 上 Qwen 3.5 4B 更高。NVIDIA 自己的表也没藏。对话、人设、指令层级这块涨得猛，说“全面碾压同档”我不敢。

延迟和显存（Q4_K_M，batch=1，llama.cpp CUDA）：

- RTX 5070 12GB，3K 入 / 50 出：显存 3.5GB，首 token 548ms，133 token/s
- Jetson Orin Nano 8GB，同样负载：显存 4.2GB，首 token **5.1 秒**，15.5 token/s

Jetson 那行说实话离谱。挂着“本地语音助手”卖，首字等五秒，对话得靠缓存和短答硬撑。RTX 这边还像回事。

![左：质量 vs 首 token 延迟；右：质量 vs 啰嗦程度（来源：NVIDIA Nemotron 研究页）](/img/nemotron-bolt-e4b-charts.png)

## 几个我觉得靠谱的设计

能关思考。chat template 里有 `enable_thinking`，复杂题开、闲聊关，还能给 thinking 设预算。本地语音最怕模型在那儿“嗯……让我想想”，这开关是刚需。

专门有 conversational mode，官方说打开后更短、更像能直接念出来的口语。他们还整了个 Brevity Bench 量“又准又短”，基准本身要晚些才公开——现在没法第三方复现，记一笔。

带 DFlash 草稿模型：一次前向吐一串 draft token，目标模型并行校验。官方说相对 Gemma 4 E4B 原厂 MTP，吞吐最多高 21%。要低延迟可以一起拉。

## 别忽略

许可证 OpenMDW-1.1，底座 Gemma 4 走 Apache 2.0。合规比纯 MIT/Apache 仓库多一步。

上面那堆分全是自测；Brevity Bench、When2Call-MT 还没公开。第三方榜单出来前，我只当方向。

“少吐 80% token”是相对某些 peer、开着 reasoning 比的峰值，不是你随便问一句就省八成。

Jetson Orin Nano 的 TTFT 已经说明：边缘板子能跑，不等于能跑成顺畅语音对话。

手里有块 GeForce、想本机挂短答语音助手或 NPC、又不想把对话送上云——可以试。想拿它写长代码、刷通用大榜，隔壁更大的模型更合适，这不是它的活。

## 链接

- 研究页：[NVIDIA Nemotron 3.5 Bolt E4B 4GB](https://research.nvidia.com/labs/nemotron/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB/)
- Hugging Face：[nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB)（另有 BF16 与 DFlash 草稿）
- 技术报告 PDF：[同页链出](https://research.nvidia.com/labs/nemotron/files/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB-Technical-Report.pdf)
- 许可证：[OpenMDW 1.1](https://openmdw.ai/license/1-1/)
