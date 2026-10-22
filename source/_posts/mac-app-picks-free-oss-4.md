---
title: Mac App 精选四期：查词、平铺窗口、写脚本，三个免费开源
date: 2026-10-22 23:10:00
updated: 2026-10-22 23:10:00
permalink: posts/2026/10/22/mac-app-picks-free-oss-4/
categories:
  - 数码工具
tags:
  - Mac
  - 开源
  - Easydict
  - AeroSpace
  - Hammerspoon
description: Easydict、AeroSpace、Hammerspoon，三个免费开源的 Mac App。许可、版本、最低系统对着 GitHub 仓库核到 2026-10-22。AeroSpace 还是 Beta，Hammerspoon 要自己写 Lua，先说在前面。
cover: /img/mac-app-picks-4-cover.png
---

第四期只有三个。本来想塞 DockDoor，一查作者另卖 $20 的 DockDoor Pro，按这个系列的规矩（免费、开源、作者名下没付费产品）又刷掉一个。我去，这条规矩刷人比我想的狠。

三个都是 2026-10-22 对着 GitHub 仓库核的。

![三个 App 图标](/img/mac-app-picks-4-cover.png)
*示意图：图标取自各项目 GitHub 仓库。*

## <img src="/img/mac-app-icon-easydict.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> Easydict：划词就翻

选中一段英文按快捷键，弹个小窗，几家翻译的结果并排给你。也能 OCR 截图翻译。

- 许可：GPL-3.0
- 版本：正式版 2.24.0（9 月 27 日）；10 月 19 日出了 2.25.0，**标的是预发布**
- 系统：最新版要 macOS 13 及以上，更老的系统 README 让你用 2.7.2
- 装：`brew install --cask easydict`

README 列了 20 多个服务：苹果自带词典和翻译、DeepL、Google、Bing，也能接 OpenAI、Gemini、Claude、Ollama。注意，大模型那几家要你自己填 key，钱算在你账上，不是 Easydict 送的。2.25.0 加了 Anki Connect，背单词的人可以盯一下，但预发布版别急着当主力。

## <img src="/img/mac-app-icon-aerospace.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> AeroSpace：像 i3 那样平铺

用过 Linux 上 i3 的人会秒懂：窗口自动铺满、键盘切工作区，不用拿鼠标拖。

- 许可：MIT
- 状态：**Public Beta**，最新 tag 是 v0.21.3-Beta。README 原话是能日常用，但到 1.0 之前会有破坏性改动
- 系统：macOS 13+
- 不用关 SIP，这点 README 写得很硬
- 装：`brew install --cask nikitabobko/tap/aerospace`

![AeroSpace 水平平铺截图](/img/mac-app-picks-4-aerospace.png)
*截图来源：AeroSpace GitHub 仓库 docs/assets/h_tiles.png。*

配置是一个 TOML 文件，快捷键全靠自己定。说实话门槛不低：习惯了拿鼠标拖窗口的人，头两天大概会很想卸。

## <img src="/img/mac-app-icon-hammerspoon.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> Hammerspoon：用 Lua 遥控整台 Mac

它本身几乎没界面，是个桥：你写 Lua 脚本，它帮你调系统接口。窗口挪位、连上某个 Wi-Fi 自动静音、按个键开一组 App，都能写。

- 许可：MIT
- 版本：1.1.1，2026-02-26 发布；仓库最近一次推送是 7 月
- 装：`brew install hammerspoon --cask`

更新不算勤，但这类工具本来就不常变。缺点也很直接：不写代码就别装了，装了也只是个菜单栏图标。

## 一次装完

```bash
brew install --cask easydict hammerspoon nikitabobko/tap/aerospace
```

AeroSpace 和 Hammerspoon 都能管窗口，别同时绑一样的快捷键，不然会打架。这一条是我推的，没有实测。

参考：三个项目的 GitHub 仓库 README 和 Releases 页面，以及 dockdoor.net 的 Pro 说明，核到 2026-10-22。
