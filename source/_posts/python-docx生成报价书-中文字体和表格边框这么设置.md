---
title: python-docx 生成报价书，中文字体和表格边框这么设置
date: 2026-08-24 22:28:44
categories: [办公自动化]
tags: [python-docx, Word, 报价书, 自动化, python]
description: python-docx 生成中文报价书，font.name 设了宋体却不生效——中文显示走 eastAsia 属性。罗马数字用 ASCII、表格要 Table Grid、表头底纹走 XML，几个坑一次说清。
cover: /img/rfonts-eastasia.svg
---

干工程劳务这行，报价书是高频产出。一个项目清单几十行，单价改来改去，每次都在 Word 里重新排版：字体字号、表格边框、表头底纹，烦得很。后来我把报价书改成脚本生成，改单价只改一个 Python 列表，几秒钟出一份新文档。

但第一个坑马上就来了：设置了 `font.name = '宋体'`，Word 里打开，中文还是默认字体。查了一圈才知道，这事没那么简单。

## 坑一：font.name 只管西文，中文要走 eastAsia

docx 的 XML 里，一段文字的字体声明 `rFonts` 分三个属性：`ascii` 管西文字母数字，`hAnsi` 管西文高字节，`eastAsia` 才管中文。python-docx 的 `font.name` 只写前两个，中文显示读的是 eastAsia，没设就退回文档默认字体——这就是「宋体不生效」的原因。

正确写法是补一句：

```python
from docx.oxml.ns import qn

run.font.name = '宋体'
run._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
```

嫌每处都写麻烦，就封装成函数，所有 run 统一走它：

```python
def set_run_font(run, name='宋体', size=12, bold=False):
    run.font.name = name
    run._element.rPr.rFonts.set(qn('w:eastAsia'), name)
    run.font.size = Pt(size)
    run.font.bold = bold
```

样式也要同样处理。`doc.styles['Normal']` 只设 `style.font.name` 的话，没手动设字体的段落照样乱：

```python
normal = doc.styles['Normal']
normal.font.name = '宋体'
normal._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
```

![python-docx 中文字体设置原理](/img/rfonts-eastasia.svg)

## 坑二：罗马数字用 ASCII，别用 Unicode

报价书章节号习惯用 I、II、III。写代码时千万别用 Unicode 那组罗马数字（Ⅰ、Ⅱ、Ⅲ，U+2160 起那批）——它们在宋体下看着正常，换字体、换平台（比如甲方用 WPS 或者 Mac 打开）就容易变方框、样式不统一。普通大写字母 I、II、III 任何字体都有，直接拼字符串 `'I. 编制说明'` 最稳。

## 坑三：表格边框和表头底纹

`doc.add_table()` 出来的表格默认没边框，要边框就套内置样式：

```python
table.style = 'Table Grid'
```

表头浅蓝底纹 python-docx 没有现成接口，得直接操作 XML。`w:shd` 是单元格底纹声明，fill 是颜色值：

```python
from docx.oxml import OxmlElement

def shade_cell(cell, fill='DCE6F1'):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:fill'), fill)
    tcPr.append(shd)
```

DCE6F1 是 Word 主题里的浅蓝，打印出来很淡，表头不抢眼。单价、金额列记得数字用 `'0.00'` 格式，报价书最忌一串 480.00000001。

## 坑四：生成完翻一遍，检查末页

脚本生成省的是排版时间，检查不能省。之前复核一份报价书，最后一页基本是空的——脚本多带出来的空段落把签章区顶到下一页，要删掉尾部空段落或者把签章区前移。生成后转 PDF 翻一遍，重点看末页和表格有没有撑破。

## 验证方法

docx 本质是个 zip，可以解包直接看 XML 有没有写对：

```bash
unzip -p 报价书.docx word/document.xml | grep -o 'w:eastAsia="宋体"' | wc -l
```

我在 Mac 上习惯用 LibreOffice 转 PDF 检查排版：

```bash
soffice --headless --convert-to pdf 报价书.docx
```

python-docx 现在稳定版是 1.2.0，`pip install python-docx` 直接装。

这套脚本我用了一年多，改单价、加项目都是改列表重新生成，比手工排版快得多。坑就这四个，写下来免得下次再踩一遍。
