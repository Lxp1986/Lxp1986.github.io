---
title: 扫描件 PDF 搜不了字？ocrmypdf 中文 OCR 一次解决
date: 2026-08-28 22:33:28
categories: [数码工具]
tags: [OCR, ocrmypdf, tesseract, 扫描件, PDF, 中文识别]
description: 给扫描件 PDF 加中文文字层，让它能搜索、能复制。ocrmypdf 装完有三个坑：语言包缺失、brew 升级丢语言包、图片输入没 DPI。
---

做工程的，手上全是扫描件：图纸、报价单、合同、签证单，清一色"图片"。要找某句话只能一页页翻，要引用一段文字只能对着屏幕手敲。Spotlight 和阅读器都搜不到内容，因为 PDF 里根本没有文字层。

ocrmypdf 就是干这个的：把文字层加到 PDF 里，扫描件变成能搜、能复制的文档。装完踩了三个坑，都记下来。

## 安装

```bash
brew install ocrmypdf
```

tesseract 识别引擎会一起装好。先拿一张图试跑：

```bash
ocrmypdf -l chi_sim+eng test.png out.pdf
```

然后第一个坑就来了。

## 坑1：tesseract 默认没有中文语言包

报错：

```
OCR engine does not have language data for the following requested languages:
chi_sim
```

原因：brew 的 tesseract 公式只带 `eng`、`osd`、`snum` 三个语言包，装完时它的提示其实写了——需要其他语言就装 `tesseract-lang`。

轻量解法是只补一个文件，2.4MB：

```bash
curl -L -o /opt/homebrew/share/tessdata/chi_sim.traineddata \
  https://github.com/tesseract-ocr/tessdata_fast/raw/main/chi_sim.traineddata

tesseract --list-langs   # 确认出现 chi_sim
```

不想折腾就 `brew install tesseract-lang`，把所有语言都装上，但下载量大得多，用不上的语言纯属浪费。

## 坑2：brew 升级 tesseract 会把语言包"弄丢"

这个是我实测踩中的：放好 chi_sim 之后，我顺手 `brew install ocrmypdf`，结果 tesseract 从 5.5.1 被升到 5.5.3，再跑 OCR 又报语言包缺失，跟坑1一模一样。

查了半天才明白：`/opt/homebrew/share/tessdata` 是个软链接，指向 Cellar 里的版本目录：

```bash
ls -ld /opt/homebrew/share/tessdata
# lrwxr-xr-x ... /opt/homebrew/share/tessdata -> ../Cellar/tesseract/5.5.3/share/tessdata
```

升级后链接换到新版本目录，我放的语言包跟着旧目录"消失"了——文件其实还在 `/opt/homebrew/Cellar/tesseract/5.5.1/share/tessdata/` 里躺着。解法就是升级完再放一次。教训：每次 brew 升级 tesseract 之后，先 `tesseract --list-langs` 看一眼再跑 OCR。

## 坑3：图片输入没有 DPI 信息

手机拍的照片、很多扫描 App 导出的图片不带 DPI 元数据，直接丢给 ocrmypdf 会报：

```
DpiError: Input file is an image, but has no resolution (DPI) in its metadata.
Estimate the resolution at which image was scanned and specify it using --image-dpi.
```

按实际扫描分辨率补上就行，一般 300：

```bash
ocrmypdf --image-dpi 300 -l chi_sim+eng 扫描件.png 输出.pdf
```

如果输入本来就是 PDF（扫描仪出的那种），不需要这个参数。

## 能用的命令

```bash
# PDF 输入
ocrmypdf -l chi_sim+eng 扫描件.pdf 输出.pdf

# 图片输入（无 DPI 时）
ocrmypdf --image-dpi 300 -l chi_sim+eng 照片.png 输出.pdf

# 批量
for f in *.pdf; do ocrmypdf -l chi_sim+eng "$f" "ocr_$f"; done
```

常用参数：

- `--deskew`：自动矫正歪斜的页，手机拍的歪页有用
- `--force-ocr`：PDF 里已有文字层但质量差（比如自带乱码文字层）时强制全部重识别
- 输出默认是 PDF/A 归档格式，适合长期保存

验证文字层加没加上：用 pdftotext、或 Python 的 pypdf 提取文字试试，能提出来就成了，之后 Finder 和 Spotlight 都能搜到内容。

## 说句实话

tesseract 中文识别不是 100%，工程术语更容易错——我测试图里的"渠道清淤"被识别成了"渠道清流"。OCR 完建议抽查几页，重要数字对着原图核一遍。但拿来做全文搜索定位，几百页的说明书能搜了，省下的时间值回票价。

![](/img/ocrmypdf-flow.svg)
