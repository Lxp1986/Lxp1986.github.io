---
title: Mac App 精选二期：鼠标、日历、防休眠，三个免费开源
date: 2026-10-12 23:30:00
updated: 2026-10-12 23:30:00
permalink: posts/2026/10/12/mac-app-picks-free-oss-2/
categories:
  - 数码工具
tags:
  - Mac
  - 开源
  - KeepingYouAwake
  - LinearMouse
  - Itsycal
description: 防休眠、鼠标和触控板分开调、菜单栏日历。三个免费开源的 Mac App，许可、最低系统和装法对照官方仓库核到 2026-10-12。
cover: /img/mac-app-picks-2-cover.png
---

第二期本来计划六个，按标准筛完留下三个。

标准没变：GitHub 上的版本免费开源，在解决一个系统没解决好的小痛点，作者另有付费版或收费服务的我会写明。这期三个都没发现作者名下有付费软件，只能写「没发现」，不敢写「绝对没有」。

另外每个都查了 macOS 26 的适配记录。资料来自官方仓库、发布说明和官网，截至 2026-10-12，以后以官方为准。文中只写官方说明里的功能，不写个人使用体验。

![菜单栏、日历、杯子和鼠标围着一台显示器](/img/mac-app-picks-2-hero.png)

## <img src="/img/mac-app-icon-keepingyouawake.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> KeepingYouAwake：一键不休眠

痛点：下载、渲染、跑脚本跑到一半，Mac 自己睡了。

菜单栏点一下就不休眠，可以预设时长，电量低时自动关掉。它只是套了一层系统自带的 `caffeinate` 命令。

注意：笔记本只有开盖时才管用，合盖照睡，官方就是这么写的。

MIT 协议，免费。最新版 1.6.8（2025-09），最低 macOS 10.13。更新说明里有 macOS 26 的图标和菜单栏图标隐藏适配，仓库 2026-08 还有提交。作者 Marcel Dierkes 的 GitHub 和个人站点上，没发现付费软件。

`brew install --cask keepingyouawake`

## <img src="/img/mac-app-icon-linearmouse.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> LinearMouse：鼠标和触控板分开调

痛点：触控板想要自然滚动，外接鼠标想要滚轮方向反过来，系统设置里这两个是绑在一起的。

LinearMouse 可以分开设：鼠标反向、触控板保持自然。指针加速能关掉，按键能重映射，还能按设备、按应用、按显示器各配一套。

![触控板和鼠标各管各的滚动方向](/img/mac-app-picks-2-pointer.png)

MIT 协议，免费，当前稳定版 0.12.0（2026-10-03），最低 macOS 10.15。0.11.1 的发布说明提到为适配 macOS 26 重构了设置界面。作者只放了捐赠页，没发现付费版。

要给辅助功能权限，授权后还提示的话，官方文档的做法是：先在权限里把它删掉再加回来。

仓库现在在发 0.13 的 beta，装的时候注意别选成测试版。`brew` 装的是稳定版。

`brew install --cask linearmouse`

## <img src="/img/mac-app-icon-itsycal.png" width="40" height="40" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;"> Itsycal：菜单栏里的小日历

痛点：想看一眼日期、第几周、今天有没有事，不想专门打开日历 App。

点菜单栏图标弹出月历，直接读 Mac 自带日历里的事件，有 ISO 周数，能替换系统时钟的显示，键盘也能操作。要给日历权限。

MIT 协议，免费。0.15 系列（当前 0.15.15）最低 macOS 11，0.15.14 修了 macOS 26 的菜单栏文字变暗。0.27 系列只给 macOS 27 以上。作者官网写的是「我的 App 都免费」，只留了捐赠方式。

macOS 26 的一个坑：如果菜单栏里找不到它，去「系统设置 → 菜单栏」看是不是被系统设置藏了，这是官方帮助页写的。

`brew install --cask itsycal`

## 没放进来的

KeePassXC：免费开源，没问题。但 macOS 26 上有过打不开数据库（issue 12525）和 Touch ID 解锁失效（issue 12666）的反馈，都已关闭，我不替它背书，这期先不推。

## 小结

防休眠、滚动方向、菜单栏日历，这三件事都不大，但很常见。装之前先看一眼最低系统。
