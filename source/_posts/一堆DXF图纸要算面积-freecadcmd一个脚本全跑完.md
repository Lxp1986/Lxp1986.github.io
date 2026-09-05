---
title: 一堆 DXF 图纸要算面积，freecadcmd 一个脚本全跑完
date: 2026-09-05 22:35:00
categories: [工程软件]
tags: [FreeCAD, DXF, freecadcmd, 面积, 批处理, 命令行, 算量]
description: 收方、算量总逃不开"这块多少平方"。LibreCAD 量面积要一个对象点一次，图纸一多就烦。用 FreeCAD 自带的 freecadcmd 写了个脚本，整个文件夹的 DXF 批量导入、闭合线成面、按图层汇总面积，还能识别图纸声明的单位自动换算，未闭合的线会单独提示。
cover: /img/fc-dxf-area-flow.svg
---

干工程的总逃不掉一个动作：收方、算量，最后落到"这块多少平方"。图纸来了，要么是设计院丢过来的 DXF，要么是自己画的图，反正最后都得要个面积数。

日常画图我用 LibreCAD 为主，量面积要一个封闭对象点一次，点完还得自己拿笔记。几十个井盖、地块，图一多就烦。

后来想到：FreeCAD 不是一直装在机器上吗？它带一个命令行版 freecadcmd，能不能直接读 DXF，把面积批量算出来？试了一下，能。写成了脚本，现在整个文件夹拖进去，几秒钟出一张表。

## freecadcmd 是 FreeCAD 的命令行版

装好 FreeCAD 就自带，不用额外装东西。macOS 上在这个位置（本机 FreeCAD 1.1.3 实测）：

```bash
/Applications/FreeCAD.app/Contents/Resources/bin/freecadcmd
```

它是 FreeCAD 的无界面版，能跑 Python 脚本，脚本里能调 FreeCAD 的 Python API：导入 DXF、读几何、算面积。GUI 里点半天的事，脚本几行完事。

原理三步：

1. `importDXF` 把 DXF 读进来，多段线、圆变成 FreeCAD 对象
2. 闭合的线围成面，面的 `Area` 就是面积；圆这类没有线的，单条闭合边也能成面
3. 按图层分组汇总，输出

![freecadcmd 批处理 DXF 面积的流程](/img/fc-dxf-area-flow.svg)

## 脚本全文

存成 `dxf_area.py`。一个提醒：freecadcmd 会拦截 `--` 开头的参数，所以脚本只用了位置参数，两种跑法都能用：

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# dxf_area.py —— freecadcmd 批量算 DXF 面积
# 注意: freecadcmd 会拦截 -- 开头的参数, 所以本脚本只用位置参数
# 用法:
#   freecadcmd dxf_area.py 图纸.dxf                 # 单文件, 按 mm 图算
#   freecadcmd dxf_area.py 图纸.dxf m               # 图纸按米画(文件没声明单位)
#   freecadcmd dxf_area.py 图纸目录/ m              # 整个目录按米画
#   freecadcmd dxf_area.py 图纸.dxf m 井盖 绿化     # 只统计指定图层(可多个)
# 用普通 python3 跑也一样: python3 dxf_area.py 图纸.dxf m
import argparse, glob, io, os, sys
from contextlib import redirect_stdout

# freecadcmd 的 sys.argv = [freecadcmd, 脚本.py, 参数...], 把脚本路径剥掉
# 让 freecadcmd dxf_area.py x.dxf 和 python3 dxf_area.py x.dxf 两种跑法一致
if len(sys.argv) > 1 and sys.argv[1].endswith(".py") and os.path.exists(sys.argv[1]):
    del sys.argv[1]

import FreeCAD as App
import Part, importDXF

# DXF 头 $INSUNITS 声明: 1 个绘图单位 = 多少 mm
SCALE = {0: None, 1: 25.4, 2: 304.8, 4: 1.0, 5: 10.0, 6: 1000.0}
UNIT_MM = {"mm": 1.0, "m": 1000.0}

def read_insunits(path):
    """从 DXF 头部读 $INSUNITS, 没声明返回 None"""
    try:
        head = open(path, "rb").read(8192).decode("utf-8", "ignore")
        head = head.replace("\r\n", "\n").replace("\r", "\n")
        lines = head.split("\n")
        for i, ln in enumerate(lines):
            if ln.strip() == "$INSUNITS":
                for j in range(i + 1, min(i + 15, len(lines))):
                    if lines[j].strip() == "70" and j + 1 < len(lines):
                        try:
                            return int(lines[j + 1].strip())
                        except ValueError:
                            return None
        return None
    except OSError:
        return None

def feature_area(feature):
    """返回 (面积列表, 未闭合线数量)"""
    areas, open_n = [], 0
    shp = feature.Shape
    if shp.Wires:
        for w in shp.Wires:
            if w.isClosed():
                try:
                    areas.append(Part.Face(w).Area)
                except Exception:
                    open_n += 1
            else:
                open_n += 1
    for e in shp.Edges:            # 圆/椭圆这类没有 wire 的
        if e.Closed:
            try:
                areas.append(Part.Face(Part.Wire([e])).Area)
            except Exception:
                open_n += 1
    return areas, open_n

def collect_by_layer(doc):
    """返回 [(图层名, [几何对象...])]"""
    result, seen = [], set()
    for o in doc.Objects:
        if o.TypeId == "App::DocumentObjectGroupPython":   # LayerContainer
            for lay in getattr(o, "Group", []):
                feats = [f for f in getattr(lay, "Group", []) if f.TypeId == "Part::Feature"]
                if feats:
                    result.append((lay.Label, feats))
                    seen.update(id(f) for f in feats)
    top = [o for o in doc.Objects if o.TypeId == "Part::Feature" and id(o) not in seen]
    if top:
        result.append(("(未分层)", top))
    return result

def process(path, unit, layers):
    ins = read_insunits(path)
    declared = ins in SCALE and SCALE[ins] is not None
    if declared:
        # 文件声明了单位, FreeCAD 已把数值缩放成 mm 存储(数值即 mm²)
        mm_per_unit, note = SCALE[ins], "文件声明单位(INSUNITS=%d), FreeCAD 已按 mm 换算" % ins
    else:
        # 未声明, FreeCAD 按 1 单位 = 1 mm 存数值, 用 mm/m 参数解释真实尺寸
        mm_per_unit, note = UNIT_MM[unit], "未声明单位, 按 1 绘图单位 = 1 %s 读" % unit
    if declared:
        to_m2 = lambda s: s / 1e6          # 数值已是 mm²
        num_note = "mm²"
    else:
        to_m2 = lambda s: s * (mm_per_unit / 1000.0) ** 2
        num_note = "绘图单位²"
    App.newDocument("dxfwork")
    try:
        with redirect_stdout(io.StringIO()):
            importDXF.insert(path, "dxfwork")
        doc = App.getDocument("dxfwork")
        lines, total_s, total_open = [], 0.0, 0
        for label, feats in collect_by_layer(doc):
            if layers and label not in layers:
                continue
            s, closed_n, open_n = 0.0, 0, 0
            for f in feats:
                areas, on = feature_area(f)
                s += sum(areas)
                closed_n += len(areas)
                open_n += on
            total_s += s
            total_open += open_n
            if closed_n:
                lines.append("  图层 %-10s 闭合 %2d 处  数值面积 %12.2f %s = %12.6f m²"
                             % (label, closed_n, s, num_note, to_m2(s)))
            if open_n:
                lines.append("  图层 %-10s 有 %2d 条线未闭合, 没算进去" % (label, open_n))
        print(os.path.basename(path))
        print("  " + note)
        print("\n".join(lines))
        print("  合计: 数值 %.2f %s = %.6f m²" % (total_s, num_note, to_m2(total_s)))
        if total_open:
            print("  警告: 共 %d 条线未闭合, 在 CAD 里围合后再跑" % total_open)
        print()
    finally:
        App.closeDocument("dxfwork")

def main():
    ap = argparse.ArgumentParser(description="freecadcmd 批量算 DXF 面积")
    ap.add_argument("target", help="dxf 文件或目录")
    ap.add_argument("unit", nargs="?", choices=["mm", "m"], default="mm",
                    help="图纸实际绘图单位, 用于文件未声明单位时 (mm/m, 默认 mm)")
    ap.add_argument("layer", nargs="*", help="只统计这些图层 (可多个)")
    args = ap.parse_args()
    files = []
    if os.path.isdir(args.target):
        for pat in ("*.dxf", "*.DXF"):
            files += glob.glob(os.path.join(args.target, pat))
    else:
        files = [args.target]
    if not files:
        sys.exit("没找到 DXF 文件")
    for f in sorted(files):
        process(f, args.unit, args.layer)

main()  # freecadcmd 下 __name__ 不是 __main__, 不能套 guard
```

## 怎么用

图纸按米画、文件又没声明单位的（老图常见），这样跑：

```bash
/Applications/FreeCAD.app/Contents/Resources/bin/freecadcmd dxf_area.py 平面图.dxf m
```

输出长这样，按图层分开列，一眼能看到哪层多少：

```text
平面图.dxf
  未声明单位, 按 1 绘图单位 = 1 m 读
  图层 主体          闭合  1 处  数值面积       300.00 绘图单位² =   300.000000 m²
  图层 井盖          闭合  1 处  数值面积        12.57 绘图单位² =    12.566371 m²
  图层 标注线        有  1 条线未闭合, 没算进去
  合计: 数值 312.57 绘图单位² = 312.566371 m²
  警告: 共 1 条线未闭合, 在 CAD 里围合后再跑
```

一张图只想算某几层，把图层名跟在后面：

```bash
freecadcmd dxf_area.py 平面图.dxf m 井盖 绿化
```

一个文件夹几十张图，直接给目录：

```bash
freecadcmd dxf_area.py 图纸目录/ m
```

嫌每次敲一长串路径麻烦，先 `alias fc=/Applications/FreeCAD.app/Contents/Resources/bin/freecadcmd`，之后就是 `fc dxf_area.py 图纸目录/ m`。

## 单位问题脚本替你兜了一半

DXF 文件头部有个 `$INSUNITS` 变量，声明这张图 1 个单位是毫米还是米。实测 FreeCAD 的行为：

- 文件声明了单位，导入时自动按声明缩放，比如声明 Meters 的图数值会放大 1000 倍存成 mm，脚本识别后直接除 1e6 给你平方米，不用管
- 文件没声明（很多设计院导出的图就是这样），FreeCAD 一律按 1 单位 = 1 mm 读，脚本就按你给的 mm 或 m 参数解释

所以拿不准的图，先量一段标了尺寸的线对一下：标注 10 的墙量出来是 10，图就是按米画的，跑的时候带个 m；量出来是 10000，才是毫米图。这个习惯比信任何默认值都靠谱。

## 两个提醒

不闭合的线不会参与计算，脚本会把数量列出来提示你——断面图、半截线多的时候，先看警告再抄数。

一张图里如果有好几个不相干的区域，脚本会把它们加在一起。要么按图层把要算的分开（图层的活 CAD 里顺手就做了），要么把需要的部分单独另存一张 DXF。收方这种事，数错了后面全是麻烦，宁可多跑一遍核对。
