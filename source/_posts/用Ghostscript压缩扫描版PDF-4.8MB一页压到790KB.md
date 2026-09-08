---
title: 用 Ghostscript 压缩扫描版 PDF，4.8MB 的一页能压到 790KB
date: 2026-09-08 22:31:54
categories: [数码工具]
tags: [PDF, Ghostscript, qpdf, 扫描件, 文件压缩, 命令行]
description: 现场签证、收方资料整本扫描 PDF 上百 MB，微信邮箱都传不动。用 Ghostscript 压：文字和线条不动，只把内嵌图片降到目标分辨率。本文给出 /screen、/ebook、/printer 三档怎么选，附本机实测数字（一页 4.8MB 压到 790KB），以及批量压缩、无损合并、拆页命令。
---

现场收方、签证资料我是手机拍了直接转 PDF 的，一页就是 4.8MB 那种。整本几十页下来上百 MB，微信传不动，邮箱附件传到一半就失败。网上压缩网站要先上传，几十 MB 传半天，整本资料放到别人服务器上过一遍，心里也不踏实。macOS 预览 App 能压，导出时选「减小文件大小」，但质量没得选，几十页一本手动导太烦。

后来固定用 Ghostscript（命令是 gs）压，参数就几个，压完效果自己说了算。下面是我在 macOS 上实测跑通的命令和数字，照着复制就能用。

## 原理就一句

gs 的 pdfwrite 引擎做压缩时，PDF 里的文字和矢量线条原样保留，只把内嵌的图片按目标分辨率重新采样、重新编码。扫描版 PDF 本质就是每页一张大照片，所以压缩空间全在图片上。反过来，Word 直接导出的纯文字 PDF 几乎没有可压的图，压了也小不了多少——那不是参数的问题。

macOS 不自带 gs，先装：

```bash
brew install ghostscript
```

## 档位就三个

`-dPDFSETTINGS` 指定图片降到多少 dpi，官方定义：

| 档位 | 图片降到 | 用途 |
| --- | --- | --- |
| /screen | 72 dpi | 只在屏幕上看，体积最小 |
| /ebook | 150 dpi | 发邮件、微信、上传平台，我固定用这个 |
| /printer | 300 dpi | 要打印的，文件小不了太多 |

150 dpi 在屏幕上看跟原件基本没区别，所以日常发资料我都是 /ebook。

## 压单本

```bash
gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH \
  -sOutputFile=压缩版.pdf 原件.pdf
```

本机实测（gs 10.07.1，测试页是 5120×2880 手机照片直转的 PDF，单页 4.84MB）：

| 档位 | 压完单页 | 大约是原件的 |
| --- | --- | --- |
| /screen | 244KB | 二十分之一 |
| /ebook | 790KB | 六分之一 |
| /printer | 1.24MB | 四分之一 |

按这个比例推算，一本 60 页、每页都这规格的签证册，原件接近 300MB，/ebook 压完 50MB 上下，只要求屏幕看的话 /screen 能到 15MB 左右。

## 压一整批

在装 PDF 的文件夹里跑 for 循环。输出文件名一定加前缀，别和原件同名——gs 边读边写，输出直接覆盖输入会出事：

```bash
for f in *.pdf; do
  gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH \
    -sOutputFile="压缩版_${f}" "$f"
done
```

## 合并和拆页

两个场景常碰到：好几份扫描件合成一本发；一整本太厚，拆成几份分开发。

要无损、要快用 qpdf，它不重新编码，几十 MB 也是秒完：

```bash
brew install qpdf

# 合并
qpdf --empty --pages 第一份.pdf 第二份.pdf 第三份.pdf -- 合并.pdf

# 拆出前 10 页
qpdf 整本.pdf --pages . 1-10 -- 前10页.pdf
```

拆页命令里那个点表示「还是这个输入文件」，这是 qpdf 的固定写法。想把某一页抽出来单独发，把页码范围换成 `5` 就行。

想合并的同时顺手压小，直接让 gs 一次吃多个文件，输出一个 PDF，压缩参数照旧：

```bash
gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH \
  -sOutputFile=合并压缩版.pdf 1.pdf 2.pdf 3.pdf
```

## 压完干两件事

一是打开翻几页，重点看签字、印章、表格线糊不糊。要打印存档就别低于 /printer。二是原件留一份，压缩版是给传输用的，不是给存档用的，别用压缩版把原件顶掉。

补一句：压缩和 OCR 是两码事，压完再 OCR 识别率会明显降。扫描件要能搜字，顺序是先 OCR 再压缩，这个之前写过。
