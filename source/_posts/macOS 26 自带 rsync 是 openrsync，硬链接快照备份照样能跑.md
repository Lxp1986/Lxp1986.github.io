---
title: macOS 26 自带 rsync 是 openrsync，硬链接快照备份照样能跑
date: 2026-09-10 22:45:00
categories: [开发与运维]
tags: [rsync, 备份, openrsync, macOS, 外置硬盘, 命令行, launchd]
description: macOS 从 15.4 起把系统自带的 rsync 换成了 openrsync，--info=progress2、--acls、--xattrs 直接报错，但 --link-dest 硬链接快照能用。实测 73 MB 的工程资料目录做三份每日快照只占 93 MB。附完整脚本、恢复命令、快照盘的文件系统要求和 launchd 定时配置。
---

工程资料现在两百多个 G：施工图、报价书、扫描件、甲方发来的 DXF、现场照片。硬盘上留了一份，但只有一份不够用。报价书改十遍是常事，某一版单价改错了想退回三天前看看，硬盘上只剩被覆盖之后的新文件。

Time Machine 能救，但它整盘一起备，翻单个文件夹的旧版本要进恢复界面一层层点。我想要的另一种做法是每天生成一个目录快照：每个快照就是个能直接打开的文件夹，而且不重复占磁盘。rsync 的 `--link-dest` 就是干这个的，没改动的文件做成硬链接指向上一个快照的数据块，磁盘上只存一份。

写脚本前先看了一眼版本，输出让我停了一下：

```
$ /usr/bin/rsync --version
openrsync: protocol version 29
rsync version 2.6.9 compatible
```

这不是 GNU rsync 3.x。查了一下，macOS 从 15.4 开始把 `/usr/bin/rsync` 换成了 openrsync（ISC 许可），之前那个是 2006 年的 rsync 2.6.9，一直没升级是许可证的原因。我手上这台是 macOS 26.4（build 25E246），下面这些选项都是实测出来的，不是抄文档。

## 哪些选项能用，哪些直接报错

从网上抄别人的备份脚本，最常见的是进度条那一条挂掉：

```
$ rsync -a --info=progress2 工程资料/ /Volumes/Archive/快照/09-10/
rsync: unrecognized option `--info=progress2'
```

实测结果：

| 选项 | 结果 |
| --- | --- |
| `-a`、`--delete`、`--exclude`、`--link-dest`、`-H` | 可用，快照正常建 |
| `--itemize-changes`、`--stats`、`--progress`、`-n` | 可用，够看增量和清单 |
| `--info=progress2`（总进度条） | 报 unrecognized option |
| `--acls`/`-A`、`--xattrs`/`-X`、`--iconv` | 不认，invalid option |

网上流传的说法是改 `/var/select/rsync` 软链、或者 `CHOSEN_RSYNC=rsync_samba` 切回老版 rsync。这招在 26 上没用了——`/var/select` 里只剩一个 `sh`，设了环境变量输出还是 openrsync。要保留 ACL、Finder 标签这类扩展属性只能自己装 GNU 版（`brew install rsync`，装完 `which -a rsync` 确认 `/opt/homebrew/bin` 排在 `/usr/bin` 前面）；备份工程文件用不到，我留了系统自带的。

## 备份脚本

脚本放 `~/bin/backup-snapshot.sh`，三个参数：源目录、快照根目录、保留份数。

```bash
#!/bin/bash
# 用法: backup-snapshot.sh <源目录> <快照根目录> [保留份数]
set -u
SRC="${1:?用法: backup-snapshot.sh <源目录> <快照根目录> [保留份数]}"
DSTROOT="${2:?同上}"
KEEP="${3:-14}"

# src/ 是复制目录内容，src 会把目录本身也复制进去
[ "${SRC%/}" = "$SRC" ] && SRC="$SRC/"
# --link-dest 必须绝对路径，写相对路径会退化成整份复制
case "$DSTROOT" in /*) ;; *) DSTROOT="$PWD/$DSTROOT" ;; esac

mkdir -p "$DSTROOT"
DEST="$DSTROOT/$(date +%Y-%m-%d_%H%M)"
if [ -e "$DEST" ]; then                 # 同一分钟手动再跑一次也不覆盖
  i=2; while [ -e "${DEST}_$i" ]; do i=$((i+1)); done; DEST="${DEST}_$i"
fi
LATEST=$(ls -1d "$DSTROOT"/*/ 2>/dev/null | sort | tail -1)

LINKOPT=""
[ -n "${LATEST:-}" ] && LINKOPT="--link-dest=${LATEST%/}"

mkdir -p "$DEST"
# 增量要看整个快照根目录：单个快照目录 du 会把硬链接重复计一遍，报出来的数不对
BEFORE=$(du -sk "$DSTROOT" 2>/dev/null | cut -f1); BEFORE=${BEFORE:-0}
/usr/bin/rsync -a --delete $LINKOPT \
  --exclude='.DS_Store' --exclude='.Trash' --exclude='.Spotlight-V100' \
  --exclude='.fseventsd' --exclude='*.tmp' --exclude='~$*' \
  --itemize-changes --stats \
  "$SRC" "$DEST/" > "$DSTROOT/last-run.log" 2>&1
RC=$?
AFTER=$(du -sk "$DSTROOT" | cut -f1)

# 只保留最近 $KEEP 份
COUNT=$(ls -1d "$DSTROOT"/*/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$COUNT" -gt "$KEEP" ]; then
  ls -1d "$DSTROOT"/*/ | sort | head -n "$((COUNT-KEEP))" | while read -r old; do
    rm -rf "$old"
  done
fi

echo "快照完成: $DEST"
echo "rsync 退出码 ${RC}（0 正常；23 有文件读不到；24 源文件传输中被改，下次会补）"
echo "本次增量 $(((AFTER-BEFORE)/1024)) MB   快照根目录总计 $((AFTER/1024)) MB"
```

用法：

```bash
chmod +x ~/bin/backup-snapshot.sh
~/bin/backup-snapshot.sh ~/Documents/工程资料 /Volumes/Archive/工程资料快照 14
```

有两处容易写错。`--delete` 是让每份快照忠实反映源目录当时的样子，源里已删的文件在这份快照里也没有——想找被删文件的旧版本，靠的是**上一份**快照，不是最新那份。快照根目录也绝对不能放在源目录里面，否则每一轮都会把前面的快照再备一遍，越滚越大。

## 实测占多少空间

用一个结构跟真实目录一样的测试目录跑：总平面.dwg 40 MB、给排水.dwg 25 MB、报价.xlsx 8 MB，合计 73 MB。

```
第 1 次 全量         本次增量 73 MB   快照根目录总计 73 MB
第 2 次 改了报价 8 MB、添一张 12 MB 的图
                     本次增量 20 MB   快照根目录总计 93 MB
第 3 次 源目录没动    本次增量 0 MB    快照根目录总计 93 MB
```

三份快照加起来 93 MB，同样三天内容各存一份完整拷贝是 243 MB。

这里有个容易看错的地方：不要用 `du -sh` 去看单个快照目录。硬链接在单独一次 du 里会被重复算一遍，第二、第三份快照会显示成 85 MB 这种吓人的数字。判断真实占用要看整个快照根目录的总数——一次 du 遍历会把硬链接去重，脚本里算增量就是这么算的。

中文文件名和路径都正常。想确认硬链接真建起来了，挑个没改动的文件看 link count：

```bash
$ stat -f "%N link=%l" /Volumes/Archive/工程资料快照/*/图纸/总平面.dwg
/Volumes/Archive/工程资料快照/2026-09-09_2200/图纸/总平面.dwg link=3
/Volumes/Archive/工程资料快照/2026-09-10_2200/图纸/总平面.dwg link=3
/Volumes/Archive/工程资料快照/2026-09-11_2200/图纸/总平面.dwg link=3
```

link=3 就是三份快照共用同一个数据块。想直接看哪些文件走了硬链接，给 rsync 加 `-i`，输出里 `hf` 开头的就是硬链接复用，其余是新写入的。下面这张图是三份快照和数据块的关系：

![硬链接快照结构](https://www.lxpyll.top/img/rsync-linkdest-snapshots.svg)

## 找回旧文件

单个文件直接拷出来就行，硬链接的文件拷出来是普通文件，改动不影响快照：

```bash
cp -a "/Volumes/Archive/工程资料快照/2026-09-08_2230/预算/报价书.xlsx" ~/Desktop/
```

整个目录回滚注意方向，是用快照覆盖源目录：

```bash
rsync -a --delete "/Volumes/Archive/工程资料快照/2026-09-08_2230/" ~/Documents/工程资料/
```

回滚前先把当前状态手动快照一份，等于留个后悔的余地；只回滚某个子目录，把路径换成 `.../2026-09-08_2230/预算/` 就行。

## 快照盘得是 APFS 或 HFS+

硬链接是文件系统的能力，exFAT、NTFS 不支持。备份盘要是 exFAT，快照会退化成每份都完整拷贝，白占空间。先确认：

```bash
$ diskutil info /Volumes/Archive | grep "File System Personality"
   File System Personality:   APFS
```

我那块盘是 APFS。手上只有 exFAT 盘的话，要么格成 APFS 再把资料拷回去，要么换别的方案。

## 定时跑

LaunchAgent 放 `~/Library/LaunchAgents/com.levi.backup-snapshot.plist`，每晚 22:30 跑一次：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.levi.backup-snapshot</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>/Users/levi/bin/backup-snapshot.sh</string>
    <string>/Users/levi/Documents/工程资料</string>
    <string>/Volumes/Archive/工程资料快照</string>
    <string>14</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>22</integer><key>Minute</key><integer>30</integer></dict>
  <key>StandardOutPath</key><string>/tmp/backup-snapshot.out</string>
  <key>StandardErrorPath</key><string>/tmp/backup-snapshot.err</string>
</dict>
</plist>
```

```bash
plutil -lint ~/Library/LaunchAgents/com.levi.backup-snapshot.plist   # 先验格式，输出 OK 再加载
launchctl load ~/Library/LaunchAgents/com.levi.backup-snapshot.plist
```

定时跟外置盘配有个容易忽略的地方：盘没插的时候，rsync 会照着路径在 `/Volumes/Archive` 下新建一个同名目录，结果备到本机硬盘上去了，本机还越来越小。脚本开头加一句判断，没挂载就直接退出：

```bash
mount | grep -q "on /Volumes/Archive " || { echo "备份盘没挂载，退出"; exit 1; }
```

我吃过这个亏，清本机空间时才发现备份跑歪了。加上这句，没插盘的日子就不跑，第二天插上再补。

要不要换 GNU rsync？我这边不用。openrsync 是 OpenBSD 的实现，功能是 GNU 版的子集，做本地目录快照够用，脚本一个字不用改；哪天要往远程服务器同步、或者必须保留扩展属性，再装 GNU 版。
