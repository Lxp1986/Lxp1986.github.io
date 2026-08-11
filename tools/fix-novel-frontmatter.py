#!/usr/bin/env python3
"""重建《重生》沙盒版章节的 novels 模块 frontmatter"""
import re, os, datetime

DIR = "/Users/levi-macbook/code/blog/source/_posts/重生"

# 章节顺序：文件名前缀 -> (title, chapter, slug)
CHAPTERS = [
    ("00-楔子：末日.md",       "楔子：末日",   0, "00-xiezi-mori"),
    ("01-第一章 醒来.md",     "第一章 醒来",  1, "01-xinglai"),
    ("02-第二章 老地方.md",   "第二章 老地方", 2, "02-lao-difang"),
    ("03-第三章 承诺.md",     "第三章 承诺",  3, "03-chengnuo"),
    ("04-第四章 除夕.md",     "第四章 除夕",  4, "04-chuxi"),
    ("05-第五章 深圳.md",     "第五章 深圳",  5, "05-shenzhen"),
    ("06-第六章 陈老板.md",   "第六章 陈老板", 6, "06-chen-laoban"),
    ("07-第七章 大顶.md",     "第七章 大顶",  7, "07-dading"),
    ("08-第八章 大顶之后.md", "第八章 大顶之后", 8, "08-dading-zhihou"),
    ("09-第九章 地铺兄弟.md", "第九章 地铺兄弟", 9, "09-dipu-xiongdi"),
]

BASE_DATE = datetime.datetime(2026, 8, 9, 12, 0, 0)

for i, (fname, title, chapter, slug) in enumerate(CHAPTERS):
    path = os.path.join(DIR, fname)
    with open(path, encoding="utf-8") as f:
        content = f.read()

    # 拆分 frontmatter 与正文
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", content, re.S)
    if not m:
        print(f"SKIP {fname}: no frontmatter")
        continue
    fm = m.group(1)
    body = m.group(2)

    date = BASE_DATE + datetime.timedelta(hours=i)

    new_fm = f"""title: {title}
date: {date.strftime('%Y-%m-%d %H:%M:%S')}
categories:
  - 小说
tags:
  - 重生
  - 彭敬寅
series: 重生
novel: 重生
novel_slug: chongsheng
chapter: {chapter}
layout: post
permalink: novels/chongsheng/{slug}/
toc: false
cover: false
top_img: false
aside: true"""

    with open(path, "w", encoding="utf-8") as f:
        f.write(f"---\n{new_fm}\n---\n{body}")

    print(f"OK {fname} -> chapter {chapter}, permalink novels/chongsheng/{slug}/, date {date:%Y-%m-%d %H:%M:%S}")
