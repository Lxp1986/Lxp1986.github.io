---
title: Mac App 精选三期：取色、开会、查更新、滚轮，四个免费开源小工具
date: 2026-10-17 23:00:00
updated: 2026-10-17 23:00:00
permalink: posts/2026/10/17/mac-app-picks-free-oss-3/
categories:
  - 数码工具
tags:
  - Mac
  - 开源
  - Pika
  - MeetingBar
  - Latest
  - Mos
description: Pika 刚出 2.0.1，顺手凑了第三期。取色、菜单栏会议提醒、查 App 更新、鼠标滚轮平滑，四个免费开源的 Mac App，许可和版本对照官方仓库核到 2026-10-17。
cover: /img/mac-app-picks-3-cover.png
---

这期起因很简单：Pika 这周连发了 2.0 和 2.0.1。我本来只想写它一个，翻了一圈自己的菜单栏，又挑出三个常驻的小东西，凑成第三期。

规矩和前两期一样：免费、开源，作者名下没有收费版或付费产品。版本号、许可证都是 2026-10-17 对着 GitHub 仓库核的。本来想放 AltTab，查了官网发现它现在有 AltTab Pro（9.99 美元），按规矩只好拿掉。

![四个 App 的图标，图标来自各自 GitHub 仓库](/img/mac-app-picks-3-cover.png)
*示意图：图标取自各项目 GitHub 仓库。*

## <img src="/img/mac-app-icon-pika.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> Pika：屏幕上任意一点的颜色

写博客做配图，经常要从截图里抠一个颜色。Pika 就干这一件事：点一下，放大镜对准像素，颜色值直接复制走。

- 许可证：MIT
- 最新版：2.0.1，2026-10-16 12:00（UTC+8）发布
- 安装：`brew install --cask pika`

2.0 是 10 月 12 日发的，作者自己说是「迄今最大的一次更新」：取色器重写，放大镜实时显示对比度和颜色名，数值可以直接点、打、用方向键微调，Display P3 广色域也保住了。2.0.1 把直装版的更新框架换到 Sparkle 2，修了更新器里的一个安全问题，还修了副屏取色。用直装版的，建议这周就升上去。

## <img src="/img/mac-app-icon-meetingbar.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> MeetingBar：下一个会在菜单栏里

线上会一多，我最烦的是到点了还在日历里翻会议链接。MeetingBar 把当前或下一个会议挂在菜单栏，点一下就进会。

- 许可证：Apache 2.0
- 最新版：v4.11.6，2025-06-13 发布；仓库到今天还在提交
- 系统要求：macOS 12 及以上
- 安装：`brew install --cask meetingbar`

它从日历事件里识别会议链接，支持系统日历和 Google 日历，README 写的是能认 50 多种会议服务，Google Meet、Zoom、Teams、Webex、Discord 都在里面。

![MeetingBar 菜单栏截图](/img/mac-app-picks-3-meetingbar.png)
*截图来源：MeetingBar GitHub 仓库 README。*

## <img src="/img/mac-app-icon-latest.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> Latest：一次看完哪些 App 该更新

App Store 里的会自己提醒，直接下载的那些就各管各的，有的要打开才提示。Latest 把它们放到一个列表里：哪些有新版、改了什么，能直接点更新。

- 许可证：GPL-3.0
- 最新版：0.11，2025-06-13 发布
- 安装：`brew install --cask latest`

要注意它的范围：只支持 Mac App Store 的 App 和用 Sparkle 做更新的 App。0.11 开始把「完全支持」和「有限支持」的 App 分开，后者默认不显示，要在设置里打开。用 Homebrew 装的东西，还是 `brew upgrade` 更靠谱。

![Latest 主界面截图](/img/mac-app-picks-3-latest.png)
*截图来源：Latest GitHub 仓库。*

## <img src="/img/mac-app-icon-mos.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> Mos：普通鼠标滚轮也能顺

接外置鼠标的人大概都有感觉：macOS 上普通滚轮一格一格地跳，跟触控板差太多。Mos 接管滚轮事件，把滚动插值成平滑的，还能按应用、按方向单独设。

- 许可证：CC BY-NC 4.0（源码公开、免费，但禁止商用，跟 MIT 那类不是一回事）
- 最新版：4.2.1，2026-05-31 发布
- 系统要求：macOS 10.13 及以上
- 安装：`brew install --cask mos`

第一次打开会要辅助功能权限，它得读写滚动事件，这一步躲不开。

## 一次装完

```bash
brew install --cask pika meetingbar latest mos
```

## 小结

四个都很小，装完基本就不用管：Pika 用到才唤出来，MeetingBar 和 Mos 常驻，Latest 一周打开一次就够。要是只装一个，我选 Pika，正好赶上 2.0 这一波更新。
