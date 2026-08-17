---
title: 把 Qwen 3.8 27B 装进本地电脑，默认的深度思考先关掉
date: 2026-08-17 17:35:00
permalink: posts/2026/08/17/qwen-38-27b-local/
categories:
  - 技术
tags:
  - Qwen
  - 通义千问
  - 本地部署
  - LM Studio
  - AI
description: Qwen 3.8 27B 本地部署过程记录：LM Studio 安装、模型下载（含国内魔搭途径）、默认过度思考的坑怎么关、上下文窗口怎么调，附可复制的调用示例。
cover: /img/qwen38-local.svg
---

上周五阿里开源了 Qwen 3.8 27B，就是通义千问的最新开源版。许可证是 Apache 2.0（商用随便用），270 亿参数，还能看图，27B 这个大小笔记本也带得动，我就装了一个试试。装的过程不复杂，麻烦的是它那个默认设置，不关掉能把你等崩溃。这篇记一下全过程。

## Qwen 3.8 27B 是个什么东西

一句话：通义千问最新一代开源模型，270 亿参数，能理解图片和视频，Apache 2.0 协议，随便用。官方给了两个尺寸，27B（适合本地跑）和 2.4T-A95B（超大的混合专家版，本地跑不动，走 API）。

本地跑的好处就三点：数据不出门、不要钱、断网也能用。坏处是吃内存，下面说。

整体流程就六步，先看个全貌：

![Qwen 3.8 27B 本地部署六步流程](/img/qwen38-local.svg)

## 先说硬件门槛，别踩坑

模型量化版（Q4_K_M）文件大约 17GB，加载进内存后实际占用要 20GB 以上。

- 我的机器是 16GB 内存的 M2 MacBook，试了，跑不动。内存不够会疯狂用硬盘当交换空间，出结果以小时计
- 想跑 27B，32GB 内存起步比较稳；Mac 买统一内存大点的版本，Windows 建议 16GB 显存显卡或者 32GB 内存
- 16GB 内存的机器想玩：走官方 API（qwencloud.com 或阿里云百炼），或者等官方出更小的量化版本。官方目前只有 27B 和 2.4T-A95B 两个尺寸，社区有人转 9B 的，下载量还很小，先观望
- LM Studio 官方要求：macOS 14 以上、Apple Silicon 芯片；Windows 需要支持 AVX2 指令集（近几年的 CPU 基本都行）

## 第 1 步：装 LM Studio

去 lmstudio.ai 下载，Windows 和 Mac 都有安装包，免费。装完打开就是个聊天软件的样子。

网站挂在 Cloudflare 后面，国内直连有时候慢或者打不开，打不开就挂代理，下载好安装包之后就不用再访问它了。

## 第 2 步：下载模型

两条路，选一条：

**方法 A（界面里直接搜）**：LM Studio 主界面有搜索框，搜 `Qwen3.8-27B`，选 unsloth 出的 GGUF 量化版，挑 Q4_K_M 这个文件（约 17GB，速度和质量的平衡点）。点了下载等它跑完。

**方法 B（国内推荐，走魔搭）**：ModelScope 魔搭（modelscope.cn）上有同样的文件，国内直连不翻墙。搜 `unsloth/Qwen3.8-27B-GGUF`，下载 `Qwen3.8-27B-Q4_K_M.gguf`，然后把这个文件拖进 LM Studio 的模型文件夹，重启就能看到。

顺带说一句，Hugging Face 上这个 GGUF 下载量已经 270 多万次了，说明大家都在这么玩，路是通的。

## 第 3 步：加载模型，先问一句

左侧选到模型，点加载。加载完在聊天框里随便问一句，比如「用一句话介绍你自己」。

## 第 4 步：把默认的「深度思考」关掉，这是重点

Qwen 3.8 默认把思考强度（官方叫 reasoning_effort）拉到了最高档 xhigh，也就是说每次回答前它都要先长篇大论地自我脑补一通。

后果有多夸张？AI 博主 Simon Willison 实测：让它在默认设置下画一只骑自行车的鹈鹕（SVG 图片），它先想了 21 分钟、消耗了两万多个「思考 token」，才终于出图。把思考关掉，同一句话 137 秒就出图了。

日常问答、写代码、总结文档，根本用不上那个深度。聊天界面里找 thinking 相关的开关（有的版本叫 reasoning），关掉；或者后面走 API 的时候传参数，见第 6 步。

## 第 5 步：把上下文窗口调大

LM Studio 默认上下文只有 8192 个 token，而 Qwen 3.8 原生支持 26 万。不调的话，光它自己「思考」就能把 8K 吃光，长文档更是没法聊。

加载模型的时候把上下文长度调到 262144（保守一点 32768 也行）。内存小的机器量力而行，上下文越大越吃内存。

## 第 6 步：走 API 调用，附一个能直接复制的脚本

LM Studio 左下角切到开发者（Developer）标签，点启动本地服务器，默认地址 `http://127.0.0.1:1234`，接口完全兼容 OpenAI 格式。装个 OpenAI 的 Python 库就能调：

```bash
pip install openai
```

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:1234/v1",
    api_key="lm-studio",  # 本地服务器随便填
)

resp = client.chat.completions.create(
    model="qwen3.8-27b",
    messages=[{"role": "user", "content": "把下面这段文字压缩成三句话：……"}],
    reasoning_effort="low",   # 关键：别用默认的 xhigh
    max_tokens=1024,
)
print(resp.choices[0].message.content)
```

`reasoning_effort` 支持 `xhigh` / `medium` / `low` 三档。想彻底不要思考，官方接口还能传 `enable_thinking: False`，本地服务器支持与否看版本，试一下就知道。

## 用下来的感受

27B 这个量级里它算能打的，写代码、改 bug、总结文档都行，中文是阿里自家的，很顺。视觉方面让它框出照片里的物体（bounding box），准得有点意外。速度看机器，Apple Silicon 上大概每秒几个到十几个 token，比在线 API 慢，但胜在免费和私密。

> 版本和命令信息查于 2026-08-17，工具和模型都在快速更新，以官方文档为准。
