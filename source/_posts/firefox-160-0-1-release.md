---
title: Firefox 160.0.1 今天进了正式通道，Wayland 配色和部分站点崩溃都在修复名单里
date: 2026-11-17 23:10:00
updated: 2026-11-17 23:10:00
permalink: posts/2026/11/17/firefox-160-0-1-release/
categories:
  - 数码工具
tags:
  - Firefox
  - 浏览器
  - 软件
description: Mozilla 于 2026-11-17 向正式通道提供 Firefox 160.0.1。官方发行说明列出 7 项修复，包括 Linux Wayland 上 WebGL 和 canvas 颜色不正确，以及部分站点标签页崩溃。这不是功能版本，功能变化仍以 11 月 10 日的 160.0 说明为准。我没有复现这些故障，下文只对照官方页面。
cover: /img/firefox-16001-cover.png
---

今天打开 Firefox 的发行说明，正式通道已经是 **160.0.1** 了。[官方这一页](https://www.firefox.com/en-US/firefox/160.0.1/releasenotes/) 写的是 160.0.1 Firefox Release，日期 **2026-11-17**，并写了 first offered to Release channel users on November 17, 2026。页面上没有更精确的钟点。

别指望这里有新功能。整页几乎只有 Fixed，一共 7 条。新功能还在一周前、11 月 10 日进正式通道的 [160.0 发行说明](https://www.firefox.com/en-US/firefox/160.0/releasenotes/) 里。我没拿自己的浏览器去复现这些故障，也没记下这台机器有没有自动弹到 160.0.1，下面只按那一页转述。

![示意图：Firefox 160.0.1 于 2026-11-17 进入正式通道](/img/firefox-16001-cover.png)

<small>示意图，按官方发行说明整理，不是浏览器设置或更新弹窗截图。</small>

## 说明里那 7 条

我按原文意思转述，Bug 号也留着。

Windows 那条挺具体：PDF 里的细线，在部分打印机上会打成又粗又黑的方块（Bug 2091728）。Mac 如果是 AMD 显卡，PDF、网页图形和 WebGL 可能直接空白或者花掉，官方举的例子是 Google 表格里出现黑格子（Bug 2091596）。Linux 则点名了 **Wayland**：部分系统上，游戏、Google Meet 背景这类 WebGL 和 canvas 颜色会不对（Bug 2089043）。

站点那边写了两条。有的链接会转很久才打开，官方点名了 Google Store（Bug 2087787）。还有的标签页会崩，说明里写 most notably ChatGPT（Bug 2088486）。这是他们自己举的例子，不是我去点过哪个站。

剩下两条更偏底层。网站要是短时间狂发数据报，WebTransport 连接可能后面就发不出去了（Bug 2092532）。网页已经禁止滚动时，触控板或鼠标滑动有时还是会把页面带走（Bug 2086786）。这条官方没写死是哪一个系统。

![示意图：160.0.1 官方发行说明里的 7 条修复](/img/firefox-16001-fixes.png)

<small>示意图，对照官方发行说明整理；不是完整变更清单，也不是我实测。</small>

## 新功能还在 160.0 那页

160.0 那篇才有 New。比较容易注意到的是：画中画多了 **0.25x 到 2.0x** 的速度，而且只在播放器窗口到中等或更大时才出现；还有 **Mini Window**，能把一个标签页或页面里选中的一块放到始终置顶的窗口。官方把 Mini Window 写成 early version，还说欢迎到 Mozilla Connect 反馈。别的新条目今天不展开，直接看 160.0 那页就行。

同一篇说明末尾有一句 Various security fixes。对应的安全公告是 [MFSA 2026-125](https://www.mozilla.org/en-US/security/advisories/mfsa2026-125/)，日期 2026-11-10，针对的是 Firefox 160。160.0.1 这页里我没看到新的安全小节，所以没把今天这次当成又一轮安全公告。

下载还是走官方发行说明页的各平台链接。已经装着的，也可以在软件里看更新。我没在这台机器上走完更新，也不把这篇写成安装步骤。

我的理解（推断）：自己要是在 Linux 上用 Wayland，或者在 AMD 显卡的 Mac 上看表格、网页图形，这 7 条里至少有两条对得上平时会碰到的场景，我会先把版本跟上。至于你那台会不会踩中说明里的故障，官方没打包票，我也没条件逐条验证。
