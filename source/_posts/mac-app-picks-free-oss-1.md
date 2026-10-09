---
title: Mac App 精选一期：六个免费开源，我几乎每天都开
date: 2026-10-09 19:54:00
updated: 2026-10-09 19:54:00
permalink: posts/2026/10/09/mac-app-picks-free-oss-1/
categories:
  - 数码工具
tags:
  - Mac
  - 开源
  - Loop
  - Maccy
  - Thaw
  - Stats
  - IINA
  - LocalSend
description: 窗口、剪贴板、菜单栏、监控、看视频、局域网传文件。六个免费开源的 Mac App，许可、最低系统和装法对照官方仓库核到 2026-10-09。
cover: /img/mac-app-picks-1-cover.png
---

Mac 上的小工具，付费的、订阅的、试用到期就弹窗的，太多了。

这期的标准：GitHub 上的版本免费开源，我会高频打开，真在解决一个系统没解决好的痛点。作者另有付费版或收费服务的，我在对应小节里写明。

许可、系统要求和 brew 名字都对着官方核过（2026-10-09），以后以官方为准。

![六块色块围着一台显示器](/img/mac-app-picks-1-hero.png)

## <img src="/img/mac-app-icon-loop.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> Loop：分屏别再用鼠标拖

痛点：左右分屏、四角排窗，手动拖又慢又歪。

按住触发键，鼠标往哪边一划，窗口就贴到哪边。常用位置能配快捷键，也能拖到屏幕边缘吸附。

我写东西习惯左边编辑器、右边浏览器，这种分屏正好用得上。

GPL-3.0，免费。作者只收 GitHub Sponsors 捐赠，没发现他名下有付费软件。

要给辅助功能权限。macOS 13 以上，已适配 macOS 26。

`brew install --cask loop`

## <img src="/img/mac-app-icon-maccy.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> Maccy：剪贴板不能只有一条

痛点：系统剪贴板没有历史，刚复制的东西被下一次复制盖掉。

默认 Shift+Cmd+C 呼出历史，打字就能搜，回车选中。GitHub 版 MIT 协议，免费。

另外，Mac App Store 上有个 9.99 美元的 Maccy，官网首页链过去，描述写明是卖来支持开发的。版本号和 GitHub 版一样，也没提多什么功能。想支持作者可以买，不买就用 brew 装免费版。

工地改表、改桩号，来回复制特别凶。没有历史我会疯。

官网只有 maccy.app，有仿站带恶意软件，别下错。要 macOS 14 以上。

`brew install --cask maccy`

## <img src="/img/mac-app-icon-thaw.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> Thaw：菜单栏图标太挤

痛点：刘海屏一挡，菜单栏图标放不下，有的直接躲到刘海后面。

Thaw 把不常用的图标收进隐藏区，悬停、点击或按快捷键再露出来。

它是接着 Ice 的代码往下做的，仓库里最早那批提交就出自 Ice 的作者。GPL-3.0，免费，没发现付费版。

**只支持 macOS 26 以上。**

要给辅助功能权限，用来挪图标。屏幕录制可以不给。

我的用法是把不常点的收起来，常点的 Stats 留在外面。

`brew install --cask thaw`

## <img src="/img/mac-app-icon-stats.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> Stats：看 CPU 不用开活动监视器

痛点：风扇响了才想起开活动监视器。我只想一眼看到 CPU、内存、网速。

它把这些做成菜单栏小组件。MIT 协议，免费。

另外，作者还做了收费的 System Stats 远程监控：免费档 5 台机器，Pro 按月 7 欧元、按年 60 欧元，更大的档按机器数计价。Stats 的 Remote 模块要登录这个账号，不开它，本地监控不受影响。

我常开着 CPU、内存、网络三项。

macOS 12 以上。macOS 26 上图标不出来，去系统设置的菜单栏里把 Stats 打开。

`brew install --cask stats`

![菜单栏右边几个小指示，下拉出监控面板，左边是收起来的项](/img/mac-app-picks-1-menubar.png)

## <img src="/img/mac-app-icon-iina.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> IINA：QuickTime 打不开的视频交给它

痛点：mkv、一些编码、外挂字幕，QuickTime 经常不认。

IINA 基于 mpv，常见格式拖进去就能放。同名字幕会自动匹配，也能在线搜字幕。画中画、触控板手势都有。

GPL-3.0，免费。官网只有捐赠入口，没发现付费版。

Apple 芯片要 macOS 12 以上，Intel 要 11 以上。1.5.0 已适配 macOS 26。

`brew install --cask iina`

## <img src="/img/mac-app-icon-localsend.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> LocalSend：不在苹果生态也能隔空传

痛点：对面是 Android 或 Windows，隔空投送用不了，微信传文件又慢又压图。

LocalSend 走局域网，不经过公网服务器。Mac、Windows、Linux、Android、iOS 都有。Apache-2.0 协议，免费，没发现付费版。

同一个 Wi‑Fi 下两边打开就能互相发现。大图、录像、表格，工地收资料我用过多次。

Mac 上要 macOS 11 以上。找不到对方，先查系统设置里的「本地网络」权限。

`brew install --cask localsend`

![笔记本和手机之间两条箭头，走局域网](/img/mac-app-picks-1-localsend.png)

## 一次装完

```bash
brew install --cask loop maccy stats iina localsend
# macOS 26 以上再加这一个
brew install --cask thaw
```

权限弹窗会来：辅助功能、屏幕录制、本地网络。不给，对应功能就用不了。

## 没放进来的

Rectangle：更老牌的分屏工具，免费版 MIT。作者另卖 Rectangle Pro、Multitouch 授权，App Store 上也有他的付费 App。窗口管理这期只收一个，选了 Loop，想用 Rectangle 去它官网。

AltTab、DockDoor：按窗口切、看缩略图，源码都开放。AltTab 的搜索等功能要买 Pro；DockDoor 免费版没有付费墙，作者另有付费的 DockDoor Pro。这期只收六个，同类先不收。

Ice：Thaw 的前身。正式版停在 2024 年 10 月，macOS 26 的兼容问题还挂着。

Pearcleaner：许可是 Apache 2.0 加 Commons Clause，不算纯开源。
