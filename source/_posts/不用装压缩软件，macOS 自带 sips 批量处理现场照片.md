---
title: 不用装压缩软件，macOS 自带 sips 批量处理现场照片
date: 2026-09-06 22:35:00
categories: [数码工具]
tags: [sips, 图片压缩, HEIC, JPG, 批处理, 命令行, 现场照片, iPhone, macOS]
description: 现场照片几十张要发群、传系统，iPhone 的 HEIC 原图动辄几 MB。不想为这点事装第三方软件的话，macOS 自带的 sips 就能批量转 JPG、压尺寸、调质量，一条 for 循环跑完整个文件夹，附实测数字和竖拍方向的处理办法。
---

干工程的天天要拍照：现场进度、签证、收方，一拍就是几十张。拍完往村委群、工作群里发，或者往系统里传资料，iPhone 原图动辄几 MB，传半天，有些上传系统对单张大小还有限制。

按我的习惯，这种批量图片活不想装第三方压缩软件，系统自带的 sips 就能干，一台 Mac 不用装任何东西。

## sips 是 macOS 自带的图片处理命令

sips 全名 scriptable image processing system，macOS 一直自带。缩放、转格式、调质量都支持，也能读 iPhone 默认的 HEIC 格式——很多系统只收 JPG，这一步就绕不开。

先拿单张试一把，命令拆开看：

```bash
sips -s format jpeg -s formatOptions 80 -Z 1600 IMG_0001.HEIC --out IMG_0001.jpg
```

- `-s format jpeg`：转成 JPG
- `-s formatOptions 80`：JPG 质量 80（0–100，越大越清晰也越大）
- `-Z 1600`：最长边压到 1600 像素，短边按比例跟着缩
- `--out`：输出到新文件，不动原图

## 一个文件夹批量跑

照片一般都在同一个文件夹里，直接循环：

```bash
mkdir -p 压缩后
for f in *.HEIC *.heic; do
  [ -e "$f" ] || continue
  sips -s format jpeg -s formatOptions 80 -Z 1600 "$f" --out "压缩后/${f%.*}.jpg" >/dev/null
done
```

三处细节说一下：

1. `*.HEIC *.heic` 两个都写上，iPhone 导出来的文件名是 IMG_xxxx.HEIC，大写。
2. `[ -e "$f" ] || continue` 是防止文件夹里没有 HEIC 时，通配符原样传给 sips 报错。
3. 路径都加了引号，文件名带空格、带中文都稳。

跑完看一眼结果：

```bash
ls -lh 压缩后/
sips -g pixelWidth -g pixelHeight 压缩后/IMG_0001.jpg
```

## 质量档怎么选，实测数字参考

我拿一张 4032×3024（iPhone 1200 万像素同尺寸）的图实测，HEIC 原图 391KB，转 JPG 压到 1600px：

| 质量 | 大小 |
|---|---|
| 100 | 487KB |
| 80 | 140KB |
| 60 | 104KB |

测试图画面比较简单，实拍照片细节多，出来的文件会大一些，但量级差不多：发群、传系统用 80 就够，归档只想留个看得清的用 60，要放大看细节就 100 或者干脆去掉 `-Z 1600` 只转格式不缩尺寸。原图留在原地别删，签证照片以后还要对着原图核。

## 竖拍照片的一个现象

竖着拍的照片转完，在微信和看图软件里方向正常，但个别不认 EXIF 方向信息的系统会把竖图放横。原因是 sips 转格式时保留照片的方向标记，不重新摆像素。真遇到这种系统，先用 macOS 预览打开文件夹，全选竖图旋转 90° 另存，再跑上面的命令。

压缩这事不值得装软件。一条循环命令，以后每次拍完现场照片，两分钟交差。
