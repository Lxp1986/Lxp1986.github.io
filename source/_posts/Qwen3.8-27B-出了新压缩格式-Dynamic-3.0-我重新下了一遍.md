---
title: Qwen3.8-27B 出了新压缩格式 Dynamic 3.0，我重新下了一遍
date: 2026-08-20 22:29:00
permalink: posts/2026/08/20/qwen38-ud3-gguf/
categories:
  - 技术
tags:
  - Qwen
  - GGUF
  - 本地部署
  - llama.cpp
  - Ollama
description: Unsloth 给 Qwen3.8-27B 出了 Dynamic 3.0 量化格式，同样体积精度更高。记录下怎么下载、怎么跑、选哪个文件，以及换完之后的真实感受。
---

前两天刚写完 [Qwen 3.8 27B 本地部署](/posts/2026/08/17/qwen-38-27b-local/)，这两天 Unsloth 就给这个模型出了新版的量化格式，叫 Dynamic 3.0。宣传说同样大小的文件，精度能比别家量化高一截。反正模型文件本来就要重下，我干脆换了过去，把过程记一下。

## 量化是什么

先给没接触过的朋友补一句。27B 模型原始文件差不多 50 多 GB，一般电脑跑不动。量化就是把模型里的数字精度降低，文件变小、加载变快，代价是回答质量略降。GGUF 就是量化后模型的文件格式，Ollama、llama.cpp、LM Studio 这些本地工具都认它。

传统量化基本是一刀切，所有层用同一个精度。Unsloth 的 Dynamic 是逐层挑精度：重要的层多留点精度，不重要的层狠狠压。3.0 版换了新的校准数据集（校准数据就是用来决定「哪层重要」的样本），并且针对对话、写代码和中文做了优化。

官方给的数据：同样文件大小，top-1% 准确率比别家量化高 10% 以上；发布 5 天，Qwen3.8 系列量化包下载量过了 500 万。这数字是他们自己报的，我当参考看。我在意的就两件事：文件小不小，用起来跟之前差多少。

![Dynamic 3.0 和传统量化的区别，以及怎么按内存选文件](/img/ud3-choose.svg)

## 第一步 下载模型文件

文件在 Hugging Face 的 `unsloth/Qwen3.8-27B-GGUF` 仓库，所有文件都带 `UD-` 前缀（Unsloth Dynamic 的缩写），完整文件名长这样：`Qwen3.8-27B-UD-Q3_K_XL.gguf`。

国内直连 Hugging Face 基本不行，要开代理；不想开代理可以用 hf-mirror.com 镜像，直连一般能通。

按内存选文件：

1. 16GB 内存 → `UD-Q2_K_XL`（9.8GB 左右）
2. 24GB 内存 → `UD-Q3_K_XL`
3. 32GB 以上 → `UD-Q4_K_XL`
4. 想压到极限 → `UD-IQ1_S`（只有 6.2GB）

原则就一条：文件大小加上上下文占用，得小于你的内存（或显存），不然加载慢甚至跑不动。另外 8.37GB 以下的版本砍掉了 MTP 加速模块，能省 500MB 空间，这个模块只影响生成速度，不影响回答质量，砍就砍了。

命令行下载：

```bash
pip install -U "huggingface_hub[cli]"

# 国内直连 Hugging Face 不通的话，先设镜像（不用翻墙）
export HF_ENDPOINT=https://hf-mirror.com

huggingface-cli download unsloth/Qwen3.8-27B-GGUF \
  Qwen3.8-27B-UD-Q3_K_XL.gguf --local-dir ./qwen38
```

懒人办法：浏览器打开仓库页面，点文件直接下，6 到 16GB 不等。

## 第二步 跑起来

llama.cpp 最通用。Windows 去 `ggml-org/llama.cpp` 的 GitHub Releases 下载预编译包解压；macOS 直接：

```bash
brew install llama.cpp
```

终端里聊天：

```bash
llama-cli -m ./qwen38/Qwen3.8-27B-UD-Q3_K_XL.gguf -c 8192
```

想要网页界面就起个服务：

```bash
llama-server -m ./qwen38/Qwen3.8-27B-UD-Q3_K_XL.gguf -c 8192
```

然后浏览器打开 http://localhost:8080。

习惯用 Ollama 的话：本地建一个 `Modelfile`，内容一行 `FROM ./Qwen3.8-27B-UD-Q3_K_XL.gguf`，然后 `ollama create qwen38-ud -f Modelfile`，再 `ollama run qwen38-ud`。Dynamic 3.0 是刚出的格式，Ollama 内置引擎版本太老会不认这个文件，报错就回 llama.cpp 跑，别折腾。

## 感受和结论

换完的体感：加载、生成速度和之前差不多，量化主要影响体积，速度变化不大；中文回复和写代码时的小毛病感觉少了一点点——纯体感，不严谨，大家自己试。

我的判断：内存、显存紧张，追求文件越小越好的人，值得换；不缺空间的话，直接用原版或者大体积量化更省心。另外提醒一句，量化过的模型永远比原版差一点，压得越狠差得越多。IQ1 那种 6GB 版本是给实在跑不动的机器准备的，日常用 Q3 起步比较稳。

想对比新旧量化差多少，同一句话问两个文件（直接复制）：

```bash
llama-cli -m ./qwen38/Qwen3.8-27B-UD-Q3_K_XL.gguf -c 8192 \
  -p "用 Python 写一个冒泡排序，加上中文注释，最后说明它的时间复杂度"
```

哪个输出顺眼，就留哪个。
