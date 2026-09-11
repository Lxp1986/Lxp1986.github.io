---
title: 渠道断面图用 matplotlib 脚本画，中文标注和平方号都不缺
date: 2026-09-11 22:35:00
categories: [工程软件]
tags: [Python, matplotlib, 断面图, 算量, 中文字体, 水利]
description: 工程量计算书里的断面示意图，用 matplotlib 按上口最大宽、淤厚、边坡系数出图，改一个数就重出全套，图上面积由脚本算、跟计算表永远一致。附 macOS 中文字体名查法、尺寸线画法、300dpi 导出插 Word 的参数，以及 m² 上标在中文黑体里缺字（Glyph 178 missing）的原因和两种改法。
---

渠道清淤的计算书里得配断面示意图，图上要标上口最大宽、淤厚、边坡，还有算出来的面积。以前这几张图我用 LibreCAD 描，一张十来分钟，问题是复核阶段淤厚改了两回、边坡从 1:1 改成 1:1.25，图上的底宽和面积全跟着要重算重标。手画的东西改一处忘一处，到最后图上写的 2.70 m 和表里写的 2.70 m，谁也不知道哪个是对的。

现在这几张图交给脚本画。一个断面就四个数：上口最大宽 B、淤厚 h、边坡系数 m、分段名称。参数改完重跑，图重出，面积是脚本按同一个公式算的。

![渠道清淤梯形断面示意图](/img/section-trapezoid.svg)

## 先把中文字体名查出来

matplotlib 认的是字体名，不是字体文件路径。你把 `/System/Library/Fonts/Supplemental/Songti.ttc` 写进配置里没用，得写 `Songti SC`。查本机有哪些：

```bash
python3 -c "from matplotlib import font_manager as fm; print(sorted({f.name for f in fm.fontManager.ttflist if 'Song' in f.name or 'Hiragino' in f.name or 'Heiti' in f.name}))"
```

macOS 上一般能看到 `['Heiti TC', 'Hiragino Sans GB', 'PingFang HK', 'Songti SC', ...]`。脚本开头写三行，中文就不会变成一个个空方块：

```python
matplotlib.rcParams["font.sans-serif"] = ["Songti SC", "Hiragino Sans GB", "Heiti TC"]
matplotlib.rcParams["axes.unicode_minus"] = False
```

`axes.unicode_minus` 管负号。标高和高差写负数的时候不设它，负号会显示成一个空框——这个不是字体没配好，是 matplotlib 默认拿数学减号去渲染了。

本机版本先确认一下，Xcode 自带的 python3 和 Homebrew 的 python3 是两套包目录，装过不代表另一个能用：

```bash
python3 -c "import matplotlib; print(matplotlib.__version__)"
```

没有就装到独立环境里，别往系统 Python 里灌：

```bash
python3 -m venv ~/.venvs/draw
~/.venvs/draw/bin/pip install matplotlib
```

用 venv 的话，之后调解释器一律写全路径 `~/.venvs/draw/bin/python`，直接敲 `python3` 会跑回系统那个，白折腾。

## m² 的平方号是真的会缺字

面积单位要写 m²。我第一版图上直接写了 `"面积 A = ... m²/m"`，出图时那块是空的，终端刷了一行：

```text
UserWarning: Glyph 178 (\N{SUPERSCRIPT TWO}) missing from font(s) Hiragino Sans GB.
```

这不是中文没配好，是 Hiragino Sans GB 的字库里压根没有 U+00B2（上标 2）这个字符。我拿 fontTools 把本机三个字体的字表翻出来对了一遍，结果是这样：

| 字体 | U+00B2（²） |
| --- | --- |
| Hiragino Sans GB W3 | 无 |
| Songti SC | 有 |
| Heiti TC | 有 |

两个改法，我选了第一个：

1. 单位用 mathtext 写，`m$^2$`。mathtext 走的是数学字体，跟正文中文字体不是一个来源，实测不再报警告。
2. 或者把 `Songti SC` 放到 `font.sans-serif` 列表第一位，它本身有这个字符。

顺手加一道自检，跑完脚本扫一眼有没有字没画出来：

```bash
python3 section_figure.py 2>&1 | grep -i "missing from font" || echo 无缺字
```

出图前把这条挂进流程里，几十张图一次跑完，一眼就知道哪张漏字了。

## 断面怎么画

淤积层就是个倒梯形：顶边是上口最大宽 B，底边是 `b = B - 2*m*h`，高度是淤厚 h。所以底宽不是量出来的，是算出来的——这也是图上数和表里数能对上的原因。面积 `A = (B + b) / 2 * h`，单位是 m²/m，乘上分段长度就是这一段的清淤量。

标注分三种：上口宽和底宽用水平双箭头尺寸线，淤厚用左侧竖箭头加旋转 90 度的文字，边坡文字斜着放在坡面旁边。完整脚本：

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""渠道清淤断面示意图批量出图：梯形淤积层 + 中文标注 + 尺寸线"""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, FancyArrowPatch

# 中文靠这三行，字体名要在终端里查出来，不是文件名
matplotlib.rcParams["font.sans-serif"] = ["Songti SC", "Hiragino Sans GB", "Heiti TC"]
matplotlib.rcParams["axes.unicode_minus"] = False
plt.rcParams["savefig.dpi"] = 300

# (名称, 上口最大宽 B, 淤厚 h, 边坡系数 m)
SECTIONS = [
    ("土渠-K0+000~K0+320", 3.50, 0.40, 1.00),
    ("溪河-K0+320~K0+580", 6.00, 0.35, 1.25),
]
OUT = "out"
os.makedirs(OUT, exist_ok=True)


def draw(name, B, h, m):
    b = B - 2 * m * h                 # 淤积层底宽
    A = (B + b) / 2 * h               # 梯形面积，m²/m
    half_t, half_b = B / 2, b / 2

    fig, ax = plt.subplots(figsize=(6.2, 3.2))
    ax.add_patch(Polygon([(-half_b, 0), (half_b, 0), (half_t, h), (-half_t, h)],
                         closed=True, facecolor="#dae8f5",
                         edgecolor="#1f4e79", linewidth=1.6, hatch="//"))
    ax.plot([-half_t - 0.6, half_t + 0.6], [0, 0], color="#555555",
            linewidth=1.2, linestyle="--")
    ax.text(half_t + 0.65, 0, "原渠底", va="center", fontsize=9, color="#555555")

    ax.add_patch(FancyArrowPatch((-half_t, h + 0.28), (half_t, h + 0.28),
                                 arrowstyle="<->", mutation_scale=10, color="#c00000"))
    ax.text(0, h + 0.34, f"上口最大宽 B={B:.2f} m", ha="center",
            fontsize=9, color="#c00000")

    ax.annotate("", xy=(-half_t - 0.25, h), xytext=(-half_t - 0.25, 0),
                arrowprops=dict(arrowstyle="<->", color="#c00000", lw=1.2))
    ax.text(-half_t - 0.32, h / 2, f"淤厚 h={h:.2f} m", ha="right", va="center",
            fontsize=9, color="#c00000", rotation=90)

    ax.text(half_t * 0.62, h * 0.78, f"边坡 1:{m:g}", fontsize=9, color="#1f4e79")
    ax.text(0, -0.60,
            f"底宽 b=B-2mh={b:.2f} m    面积 A=(B+b)/2×h={A:.3f} m$^2$/m",
            ha="center", fontsize=9.5, color="#1f4e79")
    ax.set_title(name, fontsize=11, color="#1f4e79")
    ax.set_xlim(-half_t - 1.4, half_t + 1.8)
    ax.set_ylim(-0.95, h + 0.85)
    ax.set_aspect("equal")
    ax.axis("off")
    fig.tight_layout(pad=0.3)
    path = os.path.join(OUT, f"{name}.png")
    fig.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    return path, A


for name, B, h, m in SECTIONS:
    path, A = draw(name, B, h, m)
    print(f"{name}: 面积 {A:.3f} m²/m -> {path}")
```

跑出来是两行结果加两张图：

```text
土渠-K0+000~K0+320: 面积 1.240 m²/m -> out/土渠-K0+000~K0+320.png
溪河-K0+320~K0+580: 面积 1.947 m²/m -> out/溪河-K0+320~K0+580.png
```

`aspect("equal")` 那行要留着，不然上下留白会被自动填满，图上的梯形变形，比例尺就没意义了。要出图集而不是单张图，把每个断面的横向范围对齐成同一个 xlim 就行。

## 导出和插进 Word

三个 `savefig` 参数都是踩过才知道要加的：`dpi=300`，打印出来线条是实的；`bbox_inches="tight"`，四周不留一大圈白边，插进 Word 不用再裁；`facecolor="white"`，不然透明底在某些模板里会叠到灰底上，看着发脏。

Word 里插入后宽度拉到 14 cm 上下，9~9.5 pt 的标注字缩到这个宽度大约是小五号的观感，标在图里不挤。分段桩号直接写进文件名，一次出十几张，拖进计算书按顺序排就行。

## 参数按各项目断面填

脚本里 `SECTIONS` 加一行就多一张图。边坡系数按实际断面来：土渠 1:1.0，砂性松散的溪河 1:1.25，这是这轮水毁修复项目跟业主对过的口径，别的项目按设计断面填。

改一版淤厚，跑一次 20 秒，图上数字和计算表里的数字同一个来源，不会出现图数不符被退回来重做。脚本我直接放在计算书同一个项目文件夹里，下个项目复制过去改四行参数就能用。
