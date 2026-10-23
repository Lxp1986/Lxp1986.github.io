---
title: 腾讯微信视觉开源 WeVisOne-VL：4B 小模型一口气做检测、计数、OCR 和抠图
date: 2026-10-23 20:00:00
updated: 2026-10-23 20:00:00
permalink: posts/2026/10/23/tencent-wevisone-vl-4b/
categories:
  - AI工具
tags:
  - 视觉语言模型
  - 开源模型
  - 腾讯
  - Hugging Face
description: 腾讯微信视觉团队在 Hugging Face 放出 WeVisOne-VL 2B/4B，基于 Qwen3-VL，加一个 960 万参数的像素解码器，不靠 SAM 就能出分割和抠图结果。
cover: /img/wevisone-vl-cover.png
---

腾讯微信视觉团队 10 月 22 日在 Hugging Face 放了两个模型：WeVisOne-VL-2B 和 WeVisOne-VL-4B，Apache 2.0 许可。卖点一句话就能说完：一个 4B 的视觉语言模型，把检测、指代定位、计数、指点、OCR、分割、抠图全包了，抠图还不用外挂 SAM。

我去，4B 干这么多活，第一反应是“又一个刷榜的”。翻完 README 和 benchmark 表，说实话比我预想的扎实，不过有几处水分得拎出来。

![WeVisOne-VL 概览图（来源：Tencent/WeVisOne-VL GitHub 仓库）](/img/wevisone-vl-cover.png)

## 它到底是什么

底座是 Qwen3-VL。官方的做法是把框和点都变成坐标 token（`<0>` 到 `<1000>`，归一化坐标），模型直接按 token 吐结构化结果；目标不存在时返回 `None`。

像素级的活交给仓库里附带的 `mask_decoder.pt`，参数量 9,609,764，也就是约 960 万。它读 Qwen3-VL 视觉编码器的多层特征，再按预测出来的框去出 mask 和 alpha matte。README 明说这个文件是必需组件，没它分割和抠图都跑不了。

支持的任务就这几类：

- `detection` / `referring`：开放词表检测、按一句话找目标
- `point`、`count_box` / `count_point`：指点和计数
- `ocr` / `ocr_grounding`：认字，或者找某段文字在哪
- `segmentation` / `matting`：二值分割和 alpha 抠图

## 官方数字

下面全是 README 里的自报成绩，对比对象是作者挑的“各项最强开源基线”（Qwen3-VL / Qwen3.5 到 9B、Rex-Omni、LocateAnything 等）。我没复现，看的时候自己打个折。

| 任务 | 基准 | 最强基线 | WeVisOne-VL-4B |
|---|---|---|---|
| 检测 | LVIS F1 Mean | 50.7 | 55.3 |
| 密集检测 | Dense200 F1 Mean | 58.7 | 71.3 |
| 拒识 | WeRef-Bench 拒识率 | 73.0 | 96.4 |
| 计数 | PixMo-Count 准确率 | 82.8 | 89.6 |
| OCR | TotalText F1 Mean | 43.3 | 52.0 |
| 框提示抠图 | P3M-500-NP MAD（越低越好） | 15.4 | 7.3 |

最离谱的是检测那张细表：Qwen3.5-9B 在 Dense200 上只有 18.0，WeVisOne-VL-4B 是 71.3。通用大模型数密集小目标一直拉胯，这个差距我信方向，具体数值等第三方。

拒识那一项要多看一眼：WeRef-Bench 和 WeRefMat 名字就带 We，看着是团队自己的基准（这是我的推断，README 没展开）。自家考卷考第一，参考价值要往下调。

![抠图示例：输入、预测的 alpha matte、抠图结果（来源：Tencent/WeVisOne-VL GitHub 仓库 demo）](/img/wevisone-vl-matting.png)

## 我在意的就两三件事

不用 SAM 这点是真省事。以前想让 VLM 出 mask，基本是 VLM 出框、再丢给 SAM 去切，两个模型两套依赖，部署的时候光对版本就能折腾半天。这回一个模型加一个 960 万参数的小头就完事了。

还有拒识。很多 grounding 模型你问“图里的狗在哪”，图里压根没狗，它也硬给你框一个，踩坑了好几回的人应该懂。这个模型专门训了返回 `None`，做质检、相册搜索的会很在意。

4B 本地也跑得动，推理包支持 `transformers` 和 `vllm`，`device` 能填 cuda、npu、cpu。显存要多少 README 没写，那我也不瞎编。

## 限制，官方自己写了

- 头发丝这种细边缘，对分辨率、遮挡、透明物体和提示词写法都敏感
- 不做 CoT，只支持单轮单图，视频会被像素解码器直接拒掉
- 官方说用途是研究，不建议拿去做自动化高风险决策或识别具体个人
- Hugging Face 上下载量还显示 0，GitHub 仓库 22 日才建，现在 71 star，社区反馈基本等于没有

做电商抠图、文档 OCR 定位、工业计数这类窄场景的人，可以拉下来跑跑自己的图，比追通用大模型实在。拿它当聊天 VLM？别了，它压根不是干这个的。

## 链接

- Hugging Face：[tencent/WeVisOne-VL-4B](https://huggingface.co/tencent/WeVisOne-VL-4B)、[tencent/WeVisOne-VL-2B](https://huggingface.co/tencent/WeVisOne-VL-2B)
- GitHub：[Tencent/WeVisOne-VL](https://github.com/Tencent/WeVisOne-VL)
- 在线 Demo：[Hugging Face Space](https://huggingface.co/spaces/hugging-apps/wevisone-vl-4b)
- 技术报告：[arXiv 2610.31329](https://arxiv.org/abs/2610.31329)
