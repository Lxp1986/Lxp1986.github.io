---
title: 硬盘快满了还要解 180 GB 压缩包？HatchZip 边解边把压缩包"吃掉"
date: 2026-10-29 20:00:00
updated: 2026-10-29 20:00:00
permalink: posts/2026/10/29/hatchzip-extract-in-place/
categories:
  - 数码工具
tags:
  - 开源项目
  - 压缩解压
  - Rust
  - GitHub
description: HatchZip 是一个开源解压工具（MIT 或 Apache-2.0，Rust），从压缩包末尾往前解，解完一段就把压缩包截短，空间不够时只需约等于解压后大小的空间。我在 Linux 上实跑 v0.1.8，校验通过。
cover: /img/hatchzip-cover.png
---

我去，解压这件事居然还能省硬盘。

[HatchZip](https://github.com/xevrion/hatchzip) 是 10 月 21 日才建的开源解压工具，Rust 写的，MIT 或 Apache-2.0 二选一。截至 10 月 29 日晚约 2300 star、71 fork，v0.1.8 是 10 月 29 日凌晨 1 点（北京时间）发的，一周里发了好几个版本。Windows、macOS、Linux 都有安装包，带右键菜单。

它只解决一个事：**盘不够大，解不开大压缩包**。

README 的例子：180 GB 游戏包，解开 200 GB。WinRAR、7-Zip、`unzip` 要同时放下压缩包和解出来的东西，得 380 GB；HatchZip 说只要比 200 GB 多一点。

![HatchZip 原理动图截帧：压缩包从尾部被截短，文件逐块解出（来源：HatchZip 仓库 docs/media/hatchzip.gif）](/img/hatchzip-cover.png)

## 怎么做到的

ZIP 和 7z 的目录在文件末尾。它先把目录存到旁边一个小文件，然后从最后一个文件开始往前解，每解完一批就把压缩包截短，腾出来的空间接着给下一批用。`.tar.gz` 只能从前往后解，就边解边在已经用过的部分打洞释放空间。

动手之前会先算一遍能不能装下，全程留着一段安全余量。默认就是 2 GB。中途 Ctrl+C、断电、崩溃都能接着跑。剩下没解的部分还原成普通压缩包，7-Zip 照样打得开。

## 我实跑了一下

box 上是 Linux，下了 v0.1.8 的 x86_64 包，拿 8 个 30 MB 随机文件打成 251.7 MB 的 stored ZIP：

- `hatchzip check` 报：常规解压需要 251.7 MB，它只要 **31.5 MB**（另加 2.0 GB 保留）。31.5 MB 大概就是单个文件的大小，跟 README 说的"多出来的空间≈能一次释放的最大单元"对得上。
- `hatchzip x` 解完，`game.zip` 直接没了，8 个文件 sha256 全部对上。

![我在 Linux 上实跑 HatchZip v0.1.8 的终端输出](/img/hatchzip-run.png)

我这盘有 116 GB 空闲，没真的把盘塞满去测；"快满的盘也能解"是 README 用 220 MiB tmpfs 测出来的，我没复现。

## 踩坑提醒

- **默认会删压缩包**。想留着就选"Extract here (keep archive)"或加 `--keep-archive`，那就跟普通解压一样要双倍空间。
- 7-Zip 默认设置打的 7z 是一整个 solid 块，没法分段释放，HatchZip 会直接拒绝原地解，要求按解压后的大小留空间。solid RAR 只能 keep archive 模式解。
- 下载本身坏了的话，坏点之前的文件解出来了，压缩包也已经吃掉一部分。不能重新下载的包，先加 `--verify-first`。
- btrfs / APFS 有快照包含这个压缩包时，空间要等快照删了才回来。
- 安装包还没代码签名，Windows 会弹"已保护你的电脑"，macOS 要去隐私与安全性里放行。README 自己写了 v0.1.3 在 VirusTotal 被 70 个引擎里 4 个启发式引擎报毒，Defender 说干净。
- 官方只认 GitHub releases 和 hatchzip.dev，同名的 hatchzip.com 跟它没关系，别下错。

说实话我平时盘没那么紧，但 256 GB 的 Mac 装个大游戏包，这玩意可能真能救命。默认删包这一点，我会先在设置里关掉再说。

## 链接

- 仓库：[github.com/xevrion/hatchzip](https://github.com/xevrion/hatchzip)
- 官网：[hatchzip.dev](https://hatchzip.dev)
- 原理：[How it works](https://github.com/xevrion/hatchzip/blob/main/docs/how-it-works.md)
