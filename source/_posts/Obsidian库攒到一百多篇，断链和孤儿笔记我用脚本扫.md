---
title: Obsidian 库攒到一百多篇，断链和孤儿笔记我用脚本扫
date: 2026-09-12 22:30:00
categories: [知识管理]
tags: [Obsidian, Python, 自动化, iCloud, 知识管理]
cover: /img/obsidian-vault-check.svg
description: 笔记过百之后，肉眼查不出断链和孤儿笔记。这个一百来行的 Python 脚本只读库目录，一次列出断链（带文件名和行号）、重名笔记、没人链过来的孤儿笔记和缺 frontmatter 的笔记。含 iCloud 文件报 Errno 11 Resource deadlock avoided 的原因与重试写法、模板占位链接和附件链接造成的假阳性怎么排除。
---

笔记过了一百篇之后，有两件事眼睛查不了了。

一个是断链。我改文件名最勤的就是项目记录，去年那篇叫「某某记录」，今年加上日期变成「某某记录-2026-09-11」，链过去的那几篇里还写着旧名字。Obsidian 只在打开那篇笔记的时候，把断链显示成灰色的未创建链接，你不点进去就永远发现不了。另一个是孤儿笔记：当时写完顺手丢进某个章目录，没人链过来，索引里也没挂，过半年自己也找不到了。

Obsidian 想手动看也有办法，插件、图谱视图都能点，但都是「打开界面一篇篇看」。我要的是能在后台跑、把结果写成一份日志的东西，所以写了个脚本。库就是一个文件夹，`.md` 就是纯文本，Python 标准库够用，不用 pip 装任何东西。

它只读，不改你任何一个文件。改名之后要不要顺手改引用是另一回事，这个脚本只负责告诉你哪里不对。

![obsidian-check.py 的流程](/img/obsidian-vault-check.svg)

## 脚本

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Obsidian 库体检：断链、重名笔记、孤儿笔记、缺 frontmatter。只读，不改任何文件。
用法：python3 obsidian-check.py [库根目录]
"""
import os
import re
import sys
import time
from collections import defaultdict

VAULT = os.path.expanduser("~/Library/Mobile Documents/iCloud~md~obsidian/Documents")
SKIP_DIRS = {".obsidian", ".trash", ".git", ".agent-sync", "99-模板"}
ATTACH_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".svg", ".dxf",
              ".xlsx", ".docx", ".canvas", ".mp3", ".mp4", ".zip"}

# [[笔记]] / [[笔记|别名]] / [[笔记#小节]] / ![[附件.png]] / [[子目录/笔记]]
LINK_RE = re.compile(r"!?\[\[([^\[\]]+?)\]\]")
MAX_PRINT = 40


def read_text(path, tries=4, wait=1.5):
    """iCloud 文件偶尔会报 Errno 11（Resource deadlock avoided），等一下重试就好。"""
    for i in range(tries):
        try:
            with open(path, encoding="utf-8", errors="replace") as f:
                return f.read()
        except OSError as e:
            if e.errno == 11 and i < tries - 1:
                time.sleep(wait)
                continue
            raise


def walk(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames
                       if d not in SKIP_DIRS and not d.startswith(".")]
        for fn in filenames:
            yield os.path.join(dirpath, fn)


def main():
    root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else VAULT)
    if not os.path.isdir(root):
        sys.exit("目录不存在：%s" % root)

    def rel(p):
        return os.path.relpath(p, root)

    notes, attachments = [], set()
    for p in walk(root):
        if p.endswith(".md"):
            notes.append(p)
        else:
            attachments.add(os.path.basename(p))

    by_stem = defaultdict(list)
    for p in notes:
        by_stem[os.path.splitext(os.path.basename(p))[0]].append(p)

    inbound = defaultdict(int)
    broken, unreadable, no_fm = [], [], []

    for p in notes:
        try:
            text = read_text(p)
        except OSError as e:
            unreadable.append("%s  (%s)" % (rel(p), e))
            continue

        if not text.startswith("---"):
            no_fm.append(rel(p))

        for lineno, line in enumerate(text.splitlines(), 1):
            for raw in LINK_RE.findall(line):
                target = raw.split("|")[0].split("#")[0].strip()
                if not target:
                    continue                      # [[#小节]] 是本文内部锚点
                base = os.path.basename(target)
                stem, ext = os.path.splitext(base)
                if base in attachments and ext.lower() in ATTACH_EXT:
                    continue                      # 指向图片/PDF 等附件，不算断链
                if stem in by_stem:
                    if any(hit != p for hit in by_stem[stem]):
                        inbound[stem] += 1
                else:
                    broken.append((rel(p), lineno, target))

    dupes = {k: v for k, v in by_stem.items() if len(v) > 1}
    orphans = [rel(p) for p in notes
               if inbound[os.path.splitext(os.path.basename(p))[0]] == 0
               and not rel(p).startswith("00-首页")]

    print("库：%s" % root)
    print("笔记 %d 篇 | 断链 %d | 重名 %d | 孤儿 %d | 缺 frontmatter %d | 读不了 %d\n"
          % (len(notes), len(broken), len(dupes), len(orphans), len(no_fm), len(unreadable)))

    def dump(title, rows, fmt=lambda r: r):
        print("== %s（%d）" % (title, len(rows)))
        for r in rows[:MAX_PRINT]:
            print("   " + fmt(r))
        if len(rows) > MAX_PRINT:
            print("   ... 另有 %d 条" % (len(rows) - MAX_PRINT))
        print()

    dump("断链", broken, lambda r: "%s:%d  ->[[%s]]" % r)
    dump("重名笔记", sorted(dupes.items()), lambda r: "%s  x%d" % (r[0], len(r[1])))
    dump("孤儿笔记（没人链过来）", orphans)
    dump("缺 frontmatter", no_fm)
    dump("读取失败", unreadable)


if __name__ == "__main__":
    main()
```

存成 `obsidian-check.py`，不带参数就用脚本里写死的库路径，也可以顺手把别的库丢给它：

```bash
python3 obsidian-check.py
python3 obsidian-check.py "$HOME/Documents/另一个库"
```

输出是我在一个测试库上跑的样子：

```text
库：/tmp/vctest/vault
笔记 5 篇 | 断链 1 | 重名 1 | 孤儿 1 | 缺 frontmatter 1 | 读不了 0

== 断链（1）
   00-首页与索引/首页.md:5  ->[[不存在的笔记]]

== 重名笔记（1）
   笔记A  x2

== 孤儿笔记（没人链过来）（1）
   01-知识/孤立笔记.md

== 缺 frontmatter（1）
   01-知识/笔记B.md
```

我这边那个一百二十多篇的真库，整个跑完二十秒以内，一次出来 24 条断链、一组重名、6 篇孤儿。断链带上文件名和行号，直接跳过去改就行。

## 几个实际会碰到的情况

**模板里的示例链接会被算成断链。** 我那 24 条里一大半是规范文档和模板里的占位写法，像 `[[双向链接]]`、`[[相关笔记]]`、`[[笔记名]]` 这种当例子用的。它们不是错，脚本把 `99-模板` 整个目录放进了 `SKIP_DIRS`，规范文档里的那几条扫完人工划掉。

**附件要单独认。** `![[现场照片.png]]` 如果只按笔记文件名匹配，会全部变成断链。所以脚本把所有非 `.md` 的基名收进一个集合，链接指向它就跳过。

**别名和锚点要先切掉。** `[[笔记|显示成别名]]`、`[[笔记#小节]]`，真正要找的只有 `|` 和 `#` 前面那一段。不切干净，库里的断链会凭空多出一大片。另外 `[[#小节]]` 是本文内部锚点，切开后是空的，直接跳过。

**iCloud 上的库会报 Errno 11。** 这个最费时间：文件在 iCloud 里还没落到本地时，Python 里 `open()` 直接抛 `OSError: [Errno 11] Resource deadlock avoided`，而 `ls -l` 还给你显示 1643 字节，看着完全正常。它不是文件坏了，等一下再读多半就成了——我加了 4 次重试、每次隔 1.5 秒，原来 5 篇读不了的降到 4 篇，剩下那几篇脚本单独列进「读取失败」，不让它中断整次扫描。顺带说一句，同一批文件上用 `os.open()` + `os.read()` 读反而是通的，所以真卡住的话也可以用这个兜底。

**同名笔记要有人管。** 我库里有组重名：两个章目录下各放了一份同名索引，wikilink 只写文件名的时候，Obsidian 认的是路径短的那条。脚本把这组重名单独列出来，链过去到底落哪份，得自己心里有数。

## 要不要定时跑

要定时跑就交给 launchd 每天来一次，标准输出重定向到日志文件，第二天看一眼就行。有一点得先试：脚本读的是 iCloud 目录，权限是算在「执行者」身上的，launchd 跑的时候请求磁盘权限的主体不是终端，先手动跑一遍确认能读，再去配定时。

最后，脚本没做「自动改链接」。Obsidian 自己的设置里（Files & Links → Automatically update internal links）就带重命名时同步更新链接，默认是开的，我这批断链多半是当年没开或者从外部改文件名留下来的。要不要动原文，我想留给人决定，脚本只负责把该看的地方列清楚。
