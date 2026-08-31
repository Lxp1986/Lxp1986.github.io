---
title: Obsidian笔记放iCloud同步的坑-冲突副本和旧版本回滚
date: 2026-08-31 22:28:22
categories: [知识管理]
tags: [Obsidian, iCloud, 同步, 知识库, macOS]
description: Obsidian 库放 iCloud Drive 同步，会碰上冲突副本、旧版本回滚、.icloud 占位文件三个坑。排查命令、brctl 强制下载、哈希盯梢和治本习惯都在这。
---

我的 Obsidian 知识库直接放在 iCloud：`~/Library/Mobile Documents/iCloud~md~obsidian/Documents`。MacBook、另一台机器、还有几个自动脚本都在读写这个库，好处是啥设备打开都是同一份，坏处是 iCloud 根本没有冲突处理机制——它不合并、不提示，出了冲突自己拿主意，拿错主意就是丢内容。

最近一个月碰上两件事：一是笔记内容变回旧版，昨天写的东西睡一觉起来没了；二是目录里冒出一堆「xxx 2.md」。都排查明白了，记下来。

## 坑1：两台设备同时写一个笔记，出来个「xxx 2.md」

现象：MacBook 上开着「项目清单.md」在改，另一台机器上的脚本也在往这个文件里追加内容。两边都保存了，谁也没看到谁的版本。过一会儿 iCloud 的处理方式是：两个版本都留着，把后到的那份改名叫「项目清单 2.md」放回原地。

冲突副本的命名规律就是「原文件名 空格 数字」，冲突多了还有「xxx 3.md」「xxx 4.md」。先查全库有多少：

```bash
find "$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents" -name "* 2.md" -o -name "* 3.md" -o -name "*conflicted copy*"
```

路径带空格，引号一定要加，不然 find 直接报错。

删之前先 diff，别上来就删。大多数「xxx 2.md」和原文件一模一样，是 iCloud 瞎复制出来的，直接删；但有的里面就藏着只有那一份才有的段落：

```bash
diff "项目清单.md" "项目清单 2.md"
```

有差异就先合并再删，顺手把指向重复文件的内部链接改回来。

冲突副本的产生过程，画成图就是这样：

![并发写冲突副本的产生](/img/obsidian-icloud-conflict.svg)

## 坑2：旧版本回滚，这个最阴

冲突副本好歹是明着来，旧版本回滚是暗着来。现象：脚本写好的文件，内容过一段时间悄悄变回更早的版本——iCloud 把另一台设备上传的旧版同步回来，覆盖了新版，没有任何提示。

我自己就中过招：多智能体记忆同步目录 `.agent-sync` 里的记忆文件被旧重复版污染过，一开始没发现，后来某条记录越看越眼熟，一查才知道被回滚了。从那以后关键文件一律用哈希盯梢：

```bash
shasum -a 256 "$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/.agent-sync/hermes-memory/"*.md > /tmp/memory-hashes.txt
```

隔一段时间（或每次脚本同步完）再算一遍对比，变了就说明文件被动过，去查被改成了什么样。想省事就把对比逻辑写进脚本，挂 launchd 定时跑，我这套定时任务本来就走的 launchd。

## 坑3：.icloud 占位文件，打开是空的

文件还在云端没下载下来时，本地只有一个 `.icloud` 占位文件。Obsidian 这时候打开笔记，轻则卡一下，重则显示空内容——要是这时候手一抖保存了，云端那份就被空文件覆盖，0 字节笔记就是这么来的。

两个办法：

一是 Finder 里对知识库文件夹右键 →「始终保留在此设备上」，把整个库钉在本地，不产生占位。这是官方推荐做法，最省心。

二是用 brctl 命令强制下载（macOS 自带的 iCloud 文件工具，在 /usr/bin 下）：

```bash
brctl download "~/Library/Mobile Documents/iCloud~md~obsidian/Documents/某笔记.md"
```

注意传给 brctl 的路径不带 `.icloud` 后缀。整个库批量下载：

```bash
find "$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents" -name '.*icloud' | \
  perl -pe 's|(.*)/\.(.*)\.icloud|$1/$2|s' | \
  while read f; do brctl download "$f"; done
```

## 治本的习惯

1. 同一篇笔记别同时在两台设备上开着编辑。改完等 iCloud 上传完成（Finder 里云图标变实心）再动另一台。
2. 别把 git 仓库放进 iCloud。`.git` 里全是高频写入的小文件，iCloud 同步必坏，我见过仓库索引直接废掉的。
3. 脚本写库之前先确认文件已经下载到本地（`brctl status` 看一眼），写完留哈希。
4. 冲突真的频繁，就考虑 Obsidian 官方 Sync（有合并和版本历史），或者本地库干活、iCloud 只放镜像。

我的结论：单用户全 Apple 设备，iCloud 方案还能用，但心里要清楚它没有冲突解决机制，关键数据自己留哈希、留备份，别指望它跟 git 一样聪明。
