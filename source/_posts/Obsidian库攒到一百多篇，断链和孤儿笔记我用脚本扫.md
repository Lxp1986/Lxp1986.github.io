---
title: Obsidian 库攒到一百多篇，断链和孤儿笔记我用脚本扫
date: 2026-09-12 22:30:00
updated: 2026-09-12 22:45:00
categories: [知识管理]
tags: [Obsidian, Python, 自动化, iCloud, 知识管理]
cover: /img/obsidian-vault-check.svg
description: 笔记过百之后，肉眼查不出断链和孤儿笔记。这个 Python 脚本只读库目录，一次列出断链（带文件名和行号）、重名笔记、没人链过来的孤儿笔记和缺 frontmatter 的笔记。含三类假阳性怎么排除：代码块里的示例链接、名字带小数点的笔记被 os.path.splitext 误判、附件链接；以及 iCloud 文件报 Errno 11 Resource deadlock avoided 的重试写法。
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

# [[笔记]] / [[笔记|别名]] / [[笔记#小节]] / ![[附件.png]] / [[子目录/笔记]]
LINK_RE = re.compile(r"!?\[\[([^\[\]]+?)\]\]")
MAX_PRINT = 40


def no_ext(name):
    """去掉 .md 后缀。不能用 os.path.splitext——「报告1.5」里的点会被当成扩展名。"""
    return name[:-3] if name.endswith(".md") else name


def strip_code(text):
    """代码块和行内代码里的 [[链接]] 是示例，不算断链。用空行占位以保住行号。"""
    def blank(m):
        return "\n" * m.group(0).count("\n")
    text = re.sub(r"```.*?```", blank, text, flags=re.S)
    text = re.sub(r"~~~.*?~~~", blank, text, flags=re.S)
    return re.sub(r"`[^`\n]*`", lambda m: " " * len(m.group(0)), text)


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

    notes, attach_names, attach_stems = [], set(), set()
    for p in walk(root):
        base = os.path.basename(p)
        if base.endswith(".md"):
            notes.append(p)
        else:
            attach_names.add(base)
            attach_stems.add(os.path.splitext(base)[0])

    by_stem = defaultdict(list)
    for p in notes:
        by_stem[no_ext(os.path.basename(p))].append(p)

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

        for lineno, line in enumerate(strip_code(text).splitlines(), 1):
            for raw in LINK_RE.findall(line):
                target = raw.split("|")[0].split("#")[0].strip()
                if not target:
                    continue                      # [[#小节]] 是本文内部锚点
                base = os.path.basename(target)
                if base in attach_names or no_ext(base) in attach_stems:
                    continue                      # 指向图片/PDF 等附件，不算断链
                stem = no_ext(base)
                if stem in by_stem:
                    if any(hit != p for hit in by_stem[stem]):
                        inbound[stem] += 1
                else:
                    broken.append((rel(p), lineno, target))

    dupes = {k: v for k, v in by_stem.items() if len(v) > 1}
    orphans = [rel(p) for p in notes
               if inbound[no_ext(os.path.basename(p))] == 0
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

输出是我在一个小测试库上跑的样子：

```text
库：/tmp/vctest/vault
笔记 8 篇 | 断链 3 | 重名 1 | 孤儿 3 | 缺 frontmatter 1 | 读不了 0

== 断链（3）
   00-首页与索引/首页.md:5  ->[[不存在的笔记]]
   01-知识/代码块笔记.md:5  ->[[不存在的A]]
   01-知识/引小数点的.md:5  ->[[不存在的Z]]

== 重名笔记（1）
   笔记A  x2
```

## 三类假阳性，清了才算能用

第一版扫完我的库报了 24 条断链，我逐条点进去看，一半以上是假的。假阳性不清掉，这种脚本看两次就没人再看了。

**代码块里的示例链接。** 我库里那些规范文档本身就在教人怎么写链接，正文里贴了一段示例代码，里面的 `[[双向链接]]`、`[[笔记名]]` 是给人看的样板，不是真链接。所以提取链接之前先剥掉围栏代码块（` ``` ` 和 `~~~`）和行内代码，用等量空行占位、保住行号。光这一条，24 条就掉到 12 条。

**名字里带小数点的笔记。** 这个是我自己写出来的 bug：`os.path.splitext("报告1.5版")` 返回的是 `("报告1", ".5版")`，它把「1.5」里的点当成扩展名了。拿这个结果去和文件名索引对，凡是名字里有小数点的笔记——比如版本号、`1.5.2` 这种——全被判成断链，而且报出来还特别像真的。改成按 `.md` 后缀判断就干净了。剩下的 12 条里有 6 条是这么来的。

**指向附件的链接。** `![[现场照片.png]]` 这种如果只按笔记名匹配，全是断链。脚本把所有非 `.md` 的文件收进集合，并且带上「去掉扩展名」的版本，`[[现场照片]]` 和 `[[现场照片.png]]` 两种写法都能认。

清完之后，我这边 124 篇笔记的真实数字是：断链 6 条，1 组重名，4 篇孤儿，1 篇没有 frontmatter。剩下那 6 条断链都是指向模板类笔记的（模板目录整个被跳过了），属于要么建、要么把引用去掉。

## iCloud 上的库会报 Errno 11

这个最费时间。文件在 iCloud 里还没落到本地时，Python 里 `open()` 直接抛 `OSError: [Errno 11] Resource deadlock avoided`，而 `ls -l` 还给你显示 1643 字节，看着完全正常。它不是文件坏了，等一下再读多半就成了——脚本里加了 4 次重试、每次隔 1.5 秒，原来 5 篇读不了的降到 4 篇，剩下那几篇单独列进「读取失败」，不让它中断整次扫描。

顺带说一句，同一批文件上用 `os.open()` + `os.read()` 读反而是通的。所以真卡住的话可以用它兜底。

## 要不要定时跑

要定时跑就交给 launchd 每天来一次，标准输出重定向到日志文件，第二天看一眼。有一点得先试：脚本读的是 iCloud 目录，磁盘权限算在「执行者」身上，launchd 跑的时候请求权限的主体不是终端，先手动跑通一遍再去配定时。

最后，脚本没做「自动改链接」。Obsidian 设置里的 Files & Links → Automatically update internal links 就带重命名时同步更新链接，默认是开的，我这批断链多半来自从外部改文件名。要不要动原文我想留给人决定，脚本只负责把该看的地方列清楚。
