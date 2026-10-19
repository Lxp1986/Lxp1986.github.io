---
title: GitHub 周榜上的 VoiceStudio：本地版 ElevenLabs，先看清哪些能免费商用
date: 2026-10-19 23:30:00
updated: 2026-10-19 23:30:00
permalink: posts/2026/10/19/voicestudio-local-voice-cloning/
categories:
  - AI工具
tags:
  - GitHub
  - 开源
  - 语音合成
  - VoiceStudio
description: VoiceStudio 这周在 GitHub 周榜上涨了 1.6 万多星，号称开源、全本地的 ElevenLabs 替代：克隆声音、配音、听写、转写都在一个桌面 App 里。装之前要看清三件事：Intel Mac 跑不了本地后端，默认模型权重是 CC-BY-NC，Pro 版是闭源收费的。数字对照官方仓库核到 2026-10-19。
cover: /img/voicestudio-cloning.png
---

这周翻 GitHub 周榜，前几名还是各种 agent 插件和 skill，看多了有点审美疲劳。夹在中间的 VoiceStudio 是个例外：它不是给 agent 用的，是给人用的桌面软件。README 第一句写的是「开源、完全本地的 ElevenLabs 替代」。

我截稿时看了一下：仓库总星数 76,945，这一周涨了 16,569。仓库是 2026 年 4 月才建的，半年涨到这个数，算很猛了。最新版本是 v0.5.6。

## 它能干什么

打开就是一个桌面 App，里面分好几个工作区：

- **声音克隆**：给一段干净的参考录音，输入文字，用这个声音念出来。
- **声音设计**：没有参考录音，就用文字描述一个声音。
- **视频配音**：按时间轴把译文配回视频。
- **听写**：一个浮动小窗，说话直接出字。
- **转写、有声书、批量任务**：长文本、多段音频排队跑。

![VoiceStudio 声音克隆工作区截图](/img/voicestudio-cloning.png)
*截图来源：VoiceStudio GitHub 仓库 README（docs/media/electron）。*

默认语音引擎是 k2-fsa 的 OmniVoice。README 说支持 646 种语言，这个数是引擎层面的，中文实际效果怎样还得自己试。好处是引擎可以换：功能目录里列了 CosyVoice 3、IndexTTS 2.5、GPT-SoVITS、MLX-Audio 等十几个；转写默认用 WhisperX，也能换成 Faster-Whisper、FunASR、Parakeet。做中文的话，CosyVoice 和 FunASR 都可以挑。

它还带本地 API 和 MCP 服务，别的程序也能调。不过这篇重点不在这儿。

![VoiceStudio 视频配音工作区截图](/img/voicestudio-dubbing.png)
*截图来源：VoiceStudio GitHub 仓库 README（docs/media/electron）。*

## 装之前要看清的三件事

### 一、Intel Mac 只能当个壳

官方 macOS 安装文档写得很直白：**Intel Mac 跑不了本地后端，只能开界面**，再连到别的机器上的后端。原因是 PyTorch 2.2 之后不再出 Intel Mac 的包，而 VoiceStudio 的依赖要更新版本的 torch。

Apple Silicon 的要求是 macOS 13.3 及以上，预留约 10 GB 磁盘给 App、Python 环境和模型，Metal 加速会自动打开。Python、FFmpeg、模型都在第一次启动时自动下载，不用自己配环境。Windows 和 Linux 有 NVIDIA 显卡走 CUDA；没有独显也能用 CPU 跑，就是慢。

装法有两种：去 Releases 下载 DMG（M 系列芯片选 `arm64`），或者用官方脚本装：

```bash
curl -fsSL https://voicestudio.sh/install | sh
```

我习惯先下 DMG，跟 release 里的 `SHA256SUMS.txt` 对一下校验值再装，比直接管道给 `sh` 放心一些。

### 二、App 开源，默认模型不能商用

这一条最容易误会。VoiceStudio 本身是 AGPL-3.0，官方许可说明写明可以免费商用，包括企业内部使用。但 **模型权重的条款是另外算的**：

- 默认的 OmniVoice，代码是 Apache-2.0，**预训练权重是 CC-BY-NC**，也就是不能商用。
- 它的 audio tokenizer 还另外带着 Higgs Audio 2 和 Llama 社区许可的条款。
- 模型管理器会把每个模型的许可信息标出来，但官方也说，这些标注 **不构成商用授权**。

换句话说，自己做个有声书听听、给家里视频配个音没问题；要拿去接活、给客户交付，得换成许可允许商用的引擎，再一个个核对条款。

### 三、有个闭源的 Pro 版

免费版是开源的，功能已经很全。另外还有个 **闭源的 Pro 版**：每人每年 99 美元，买断 299 美元，最多 3 台设备，卖点是「商业授权（给客户干活用）」、多设备、新功能抢先用。

这里有个细节：AGPL 本来就允许商用 App 本身。Pro 卖的主要是「不想遵守 AGPL 开源义务」的授权和抢先体验。而且官方特意说了，就算买了 Pro，模型的条款也照样要遵守。个人用户用免费版就够了。

## 我会怎么用

如果是 Apple Silicon 的 Mac，我建议先装免费版，试两件事：

1. 用自己的声音克隆，念一段博客正文，听听中文发音和断句。
2. 拿一段几分钟的英文视频，试一下配音，看对口型和时间轴准不准。

效果过得去，以后写长文就能顺手出个音频版。都是自己用，不碰商用，许可的问题也就不用操心。

最后提醒一句：克隆别人的声音之前，先拿到对方同意。README 的许可说明里也写了这一条。

参考：VoiceStudio GitHub 仓库 README、LICENSE-NOTICE.md、docs/install/macos.md、docs/feature-catalog.md，以及官网 Pro 定价页，核到 2026-10-19。
