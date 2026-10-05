---
title: Mac App 精选一期：六个免费开源，我几乎每天都开
date: 2026-10-06 16:00:00
permalink: posts/2026/10/06/mac-app-picks-free-oss-1/
categories:
  - 数码工具
tags:
  - Mac
  - 开源
  - Rectangle
  - Maccy
  - Ice
  - Stats
  - AltTab
  - LocalSend
description: 不写付费订阅主角。窗口、剪贴板、菜单栏、监控、切窗、局域网传文件——六个免费开源 App，对照公开仓库/官网核到 2026-10-06。
cover: /img/mac-app-picks-1-cover.png
---

付费菜单栏工具、启动器年费、清理软件弹窗——Mac 上这些太多了。

这篇只收同时满足四条的：

**免费。开源。我会高频打开。真在解决系统痛点。**

付费订阅、只有试用期、闭源「看起来很开源」的，不当主角。许可和价格核到 **2026-10-06（Asia/Shanghai）**，以官方仓库／官网为准；以后变了以官方为准。

六个：Rectangle、Maccy、Ice、Stats、AltTab、LocalSend。

![六个小图标围着一台 Mac，底下没有价签](/img/mac-app-picks-1-hero.png)

## Rectangle：窗口别再用鼠标慢慢拖

痛点：左右分屏、一角四分，系统自带的舞台经理／手动拖，又慢又容易歪。

Rectangle 免费开源。快捷键或拖到边缘就能拍到位。官网写 Free and Open Source。

**别和 Rectangle Pro 搞混。** Pro 是另一个付费 App，这篇不写它。免费版日常分屏够用。

我自己：写东西左边编辑器、右边浏览器，基本靠它。

## Maccy：剪贴板不能只有一条

痛点：刚复制的密码被下一句盖掉。系统剪贴板没有历史。

Maccy，MIT，免费。菜单栏／快捷键翻历史，键盘优先。官网和 GitHub 都写开源且一直免费。

装的时候认准 **maccy.app**。外面有仿站，别下错。

工地改表、改桩号，来回复制特别凶。没有历史我会疯。

## Ice：菜单栏被图标挤爆

痛点：刘海一上，菜单栏图标不够站。付费的 Bartender 一类很常见。

Ice，GPL-3.0，免费。藏图标、悬停再露出，刘海机还能单独一条 Ice Bar。要 macOS 14+。

需要辅助功能／屏幕录制权限——为了能挪图标，官方说明里有。

我不是把图标藏到「永远找不到」，是把不常点的收起来。常点的 Stats、Ice 自己，留着。

## Stats：别为了看 CPU 开活动监视器

痛点：风扇响了才想起开活动监视器。想一眼看 CPU／内存／网速／电池。

Stats，MIT，免费。菜单栏小组件。维护者写明：源码开源，但不是「谁都能提 PR 就合」那种 open-contribution——这不影响你免费用。

对标心智是 iStat Menus 那种付费监控。Stats 不收费。

我常开着：CPU、内存、网络。风扇那项他们自己也说维护不多，别指望太深。

![菜单栏一溜小字：CPU 内存 网速，左边是收起来的图标](/img/mac-app-picks-1-menubar.png)

## AltTab：切窗口要能看见长什么样

痛点：系统 Cmd+Tab 切的是 App，不是窗口。一个 Chrome 十个窗口时很痛苦。

AltTab，GPL-3.0，免费。Windows 那种带预览的切窗。

我改成自己顺手的快捷键，避免和系统习惯死磕。装完先花两分钟改键，不然容易骂人。

## LocalSend：隔空投送不在同一生态就卡

痛点：手机是 Android，或对面是 Windows。隔空投送／微信传文件又慢又绕。

LocalSend，Apache-2.0，免费。局域网传文件和消息，不走公网服务器。Mac／Win／Linux／Android／iOS 都有。官方定位就是开源、跨平台的隔空投送替代。

同一 Wi‑Fi（或可互访的局域网）两边打开就能发现。大图、录像、表格，工地收资料我用过多次。

它不是「系统壳」工具，是**每天都会碰到的传文件痛点**。所以这一期把它放进来，换掉改键那个更偏硬核的选项。

![手机和平板和小电脑中间一条短箭头，不经过云朵](/img/mac-app-picks-1-localsend.png)

## 我怎么装（感受，非教程）

能 Homebrew 就 Homebrew，版本好跟。

`brew install --cask rectangle maccy stats alt-tab localsend`

Ice 看官网／GitHub Release（cask 名以你本机 `brew search` 为准，写死容易过时）。

权限弹窗会来：辅助功能、屏幕录制、本地网络。不给，对应功能就是死的。这不是厂家敲诈，是系统门槛。

## 刻意没写进主角的

Raycast／Alfred：启动器强，但不是「免费开源当主角」这条线。

Bartender：菜单栏付费老牌。Ice 已经盖了免费开源切口。

Rectangle Pro：付费。

Pearcleaner：清理好用，许可带 Commons Clause，按本期标准不当纯开源主角。

Karabiner-Elements：改键很强，也开源免费；这一期名单换成 LocalSend，改键留给以后想写键盘专题再单开。

## 收一下

六个都是：**不花钱，能看源码，解决我每周都会撞的磕碰。**

窗口、剪贴板、菜单栏、监控、切窗、局域网传文件。

下一期如果还写，可能轮到 OnlySwitch、LinearMouse、KeepingYouAwake 这类——同样先过免费开源这关。
