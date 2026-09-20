---
title: 交资料做卷内目录，PDF页数用qpdf一条循环跑完
date: 2026-09-20 22:35:00
categories: [办公自动化]
tags: [qpdf, PDF, 卷内目录, 工程资料, 命令行, CSV, Excel, macOS, Bash]
description: 工程资料移交要填卷内目录，页数栏一份份点开看太慢。用 qpdf --show-npages 取页数，外面套一层 while 循环，直接把序号、文件题名、页数、页次做成带 BOM 的 CSV，Excel 打开就能贴进模板。附中文名不乱码、自然排序、页次累计的处理办法。
cover: /img/pdftoc-flow.svg
---

上个月交一批水毁修复的施工资料，业主给的卷内目录模板上要填页数和页次。资料拆成一百多份 PDF，我点开前七八份看页数就开始烦了 —— 文件名和题名对不上、看完还要记数字再誊到表格里，这种活纯粹是耗人。后面那批我改成用命令跑，几秒钟出表。

## 一句话原理

`qpdf` 有个参数 `--show-npages`，读一份 PDF 的页数，直接打印一个数字。它一次只能吃一个文件，所以想批量就得自己在外面套循环。循环里顺手把序号和累计页次也算出来，写进 CSV。

![卷内目录页数批量统计流程](/img/pdftoc-flow.svg)

## 先装 qpdf 并试一份

```bash
brew install qpdf
qpdf --show-npages 001-开工报告.pdf
# 输出：2
```

`--show-npages` 读的是 PDF 内部结构，跟有没有文字层无关，扫描件照样能读出页数。注意它一次只处理一个文件，写成 `qpdf --show-npages *.pdf` 会直接报 `no output file may be given for this option`。

macOS 自带的 `mdls` 也能取页数，但它依赖 Spotlight 索引：

```bash
mdls -name kMDItemNumberOfPages -raw 001-开工报告.pdf
```

在放资料的目录里（尤其是外置盘、临时目录、被排除索引的文件夹）经常返回 `(null)`，我实测过，同一份文件拷到两个位置结果不一样。所以我自己固定用 qpdf，mdls 只当没装 qpdf 时的备用。

## 整批出表

在资料目录里建一个脚本，比如 `mk卷内目录.sh`：

```bash
#!/bin/bash
set -u
out=卷内目录.csv
printf '\xEF\xBB\xBF序号,文件题名,页数,页次\n' > "$out"

i=0
start=1
while IFS= read -r f; do
  p=$(qpdf --show-npages "$f" 2>/dev/null) || continue
  case "$p" in ''|*[!0-9]*) continue;; esac
  i=$((i+1))
  printf '%d,%s,%d,%d\n' "$i" "$f" "$p" "$start" >> "$out"
  start=$((start+p))
done < <(ls *.pdf | sort -V)

echo "共 $i 份，合计 $((start-1)) 页"
```

给它执行权限，然后在放资料的目录里跑：

```bash
chmod +x mk卷内目录.sh
./mk卷内目录.sh
```

跑完同目录下多一个 `卷内目录.csv`。我实测一份 5 个 PDF 的测试目录，输出是这样的：

```
序号,文件题名,页数,页次
1,2-说明.pdf,1,1
2,3 图纸 总平面.pdf,2,2
3,10-图纸.pdf,2,4
4,a.pdf,2,6
5,b.pdf,1,8
```

共 5 份，合计 8 页。

## 三个地方说明一下，都是踩过才改的

**页码序用 `sort -V` 而不是直接 `ls`。** 资料文件名基本都带编号，`ls` 排出来是 `1、10、11、2、20`，抄进表格顺序全乱。`sort -V` 是自然排序，`2` 在 `10` 前面。

**循环用 `while IFS= read -r`，不用 `for f in $(ls *.pdf)`。** 图纸名、资料名带空格太常见了（上面那行 `3 图纸 总平面.pdf` 就是），用 `for` 加 `$( )` 会被空格切成三个词，qpdf 直接报 `unknown argument`。`read -r 加引号`才吃得住空格。顺带说一句，`while ... done < <(命令)` 这种写法在 bash 和 zsh 里都能跑，但 `/bin/sh` 不行 —— macOS 的 `/bin/sh` 是 bash 3.2 的 POSIX 模式，喂进去直接 `syntax error near unexpected token '<'`。所以脚本开头老老实实写 `#!/bin/bash`，别为了通用写成 `#!/bin/sh`。

**开头那句 `printf` 是给 Excel 写 BOM。** 少了它，CSV 里全是中文文件名的列在 Excel 里打开就是一串乱码。`\xEF\xBB\xBF` 是 UTF-8 BOM 的转义写法，bash 和 zsh 的 `printf` 都认。Numbers 和 OnlyOffice 不吃这个也能正常显示，但既然要发给别人，顺手带上没坏处。

## 页次这一栏，两种填法

页次到底填什么，看业主给的表格怎么要求，一般是两种：

一种是「页次」填这份文件在整卷里的起始页，也就是我上面脚本算的累计值（1、2、4、6、8 这样）。这种装订时必须整卷连续编页，所以纸质的页码要另外处理，表里的数字只是誊抄上去。

另一种是每份文件自己从 1 编页，这时候页次那一栏直接手写「1」或者留空，把第 4 列改掉就行。脚本里 `start=$((start+p))` 那一行删掉，第 4 列改成跟第 3 列一样，跑出来就是每份自己的页数。

表格里还有一栏「责任者」，脚本没法猜，要么是本单位、要么是监理，你自己看着填，或者按资料类别批量替换，这个用 Excel 的填充更快。

## 用之前注意两件事

脚本只读不写，不动原文件，跑十遍也没关系，可以放心在正式资料目录里试。但 `out=卷内目录.csv` 每次是覆盖写的，重跑之前把上一版另存或者改名，别把人工改过的表覆盖掉。

资料多的时候（我那次一百多份），先跑一遍看「共 N 份」对不对得上手上资料份数，再打开 CSV 核几个页数。数字对不上的基本就两种情况：混进了别的 PDF（比如说明页、封面），或者文件名后缀大写成 `.PDF`。后者把脚本里的 `ls *.pdf` 改成 `ls *.pdf *.PDF` 收进来。

一百多份资料，原来一个个点开看页数要一两个小时，现在改完文件名之后一条命令出表，剩下的人工只花在核对和填责任者上。
