---
title: ffmpeg把手机视频转成固定帧率，剪辑时音画不再错位
date: 2026-09-18 22:35:00
categories: [数码工具]
tags: [ffmpeg, 视频转码, 可变帧率, 剪辑, macOS, 批处理, VideoToolbox]
description: 手机拍的视频是可变帧率（VFR），放进剪辑软件时间线后音画会越走越偏，跟编码器和码率都没关系。这篇给的是完整解法：用 ffprobe 和 vfrdet 先确认源是不是 VFR，再用 ffmpeg 的 -fps_mode cfr 把视频转成固定帧率、同时用 aresample 重建音频时间轴，附可复制的批处理脚本、Mac 硬件编码参数，以及实测的校验办法和两个容易漏的细节。
cover: /img/video-cfr-flow.svg
---

手机拍的视频丢进剪辑软件，前面几秒音画是齐的，往后拖就慢慢错位：中段差半秒，片尾能差一两秒。这种偏移和编码器、码率都无关，原因是手机录出来的是**可变帧率**文件——相机界面上的「30fps」「60fps」只是目标值，实际每两帧之间的间隔并不均匀。剪辑软件按固定帧率把时间摊开，误差就一帧一帧累积起来。

解法是剪辑前先把素材转成固定帧率（CFR）。下面这套流程我在 macOS + ffmpeg 9.0.1 上跑通过，命令可以直接抄。

![手机视频转固定帧率的流程](/img/video-cfr-flow.svg)

## 先确认源文件是不是 VFR

比两个帧率字段，量一下就出来了：

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=r_frame_rate,avg_frame_rate,nb_frames \
  -of default=noprint_wrappers=1 输入.MOV
```

`r_frame_rate` 是容器里声明的基础帧率，`avg_frame_rate` 是总帧数除以总时长。两个不一样就是可变帧率。我拿一段按 60fps 目标拍的素材试，输出是 `r_frame_rate=60/1`、`avg_frame_rate=4800/119`（约 40.3），一眼就是 VFR。

要确切数值就用 `vfrdet` 滤镜，它真的去解码、量每帧间隔：

```bash
ffmpeg -i 输入.MOV -vf vfrdet -an -f null -
```

固定帧率的文件最后一行是 `VFR:0.000000 (0/59)`；可变帧率会报非零，我那段测试素材是 `VFR:0.987342 (78/1)`。命令跑完不生成文件，就是纯检测。

## 转成固定帧率

```bash
ffmpeg -i 输入.MOV \
  -fps_mode cfr -r 30 \
  -c:v h264_videotoolbox -b:v 12M -profile:v high -allow_sw 1 \
  -c:a aac -b:a 192k -ar 48000 -af "aresample=async=1000:first_pts=0" \
  -map_metadata 0 -movflags +faststart \
  输出-cfr30.mp4
```

参数逐段说清楚：

- `-fps_mode cfr -r 30`：`-r` 后面是目标栅格，`-fps_mode cfr` 要求每一帧都落在栅格上——多出来的帧丢掉，缺的位置补重复帧。`-r` 写在 `-i` 后面。老教程里的 `-vsync cfr` 已经废弃，ffmpeg 8 以后用 `-fps_mode`。
- `-c:v h264_videotoolbox`：Mac 上的硬件编码，比软件编码快很多。它有个限制——**没有 CRF、`-q:v` 这类质量参数**，只能给码率，所以 `-b:v` 必须写。1080p30 我给 12M、1080p60 给 18M、4K 给 40M 左右，这是转中间素材用的高码率，不是发网用的。想压得更小就换软件编码 `-c:v libx264 -crf 20 -preset medium`，慢但体积明显小。
- 音频那条链不能省：`-af "aresample=async=1000:first_pts=0"` 是让音频按新的视频时长重建时间轴，`first_pts=0` 让它从头开始。也正因为要滤波，音轨不能偷懒用 `-c:a copy`，只能重编码。`-ar 48000` 统一采样率。
- `-map_metadata 0` 保留拍摄时间。不写这行，转完的文件在访达里按日期排序会乱。
- `+faststart` 把索引挪到文件开头，传到网盘或网页上能边下边播。

## 批量跑整个文件夹

```bash
#!/bin/bash
SRC="$1"; OUT="$2"; FPS="${3:-30}"
mkdir -p "$OUT"
for f in "$SRC"/*.MOV "$SRC"/*.mov "$SRC"/*.MP4 "$SRC"/*.mp4; do
  [ -e "$f" ] || continue
  name=$(basename "$f"); name="${name%.*}"
  ffmpeg -hide_banner -loglevel warning -nostdin -y \
    -i "$f" -fps_mode cfr -r "$FPS" \
    -c:v h264_videotoolbox -b:v 20M -profile:v high -allow_sw 1 \
    -c:a aac -b:a 192k -ar 48000 -af "aresample=async=1000:first_pts=0" \
    -map_metadata 0 -movflags +faststart \
    "$OUT/$name-cfr$FPS.mp4" </dev/null || echo "失败 $f"
done
```

存成 `cfr.sh`，`chmod +x` 之后这样用：

```bash
./cfr.sh ~/Movies/手机视频 /Volumes/素材盘/统一帧率 30
```

两个细节值得单独说：

**`-y` 一定要加。** ffmpeg 默认遇到已存在的输出文件会交互式问你覆不覆盖，脚本里 stdin 被 `</dev/null` 关掉，它就直接报 `File 'xxx.mp4' already exists. Exiting.` 更麻烦的是，我在 macOS 上实测这个失败的退出码是 **0**，也就是说 `&& echo OK` 照样打印成功，其实一个文件都没写。所以批量跑完别只看日志，`ls` 一下产物目录确认。

**输出别放系统盘。** 1080p 转完每分钟几十到上百 MB，直接写到外置素材盘更省事，本机只留个链接。

## 跑起来会看到的几行提示

- `Color range not set for yuv420p. Using MPEG range.`：硬件编码器的提示，不是错误，转出来的文件正常。
- 没有音轨的素材（录屏、监控导出的那类）不会报错，音频参数自动忽略，会多一行 `AVOption b:a ... has not been used for any stream`。
- 目标帧率怎么定：剪辑项目是多少就转多少。60 的素材进 30 的项目就转 30；本来就 25 的监控素材转 30 只会补一堆重复帧，看着反而卡，不如项目直接建 25。

另外，别指望在剪辑软件里把项目帧率改一下就能凑合。项目帧率不匹配时，它是在原文件的基础上重采样，VFR 的源该偏还是偏。这一步骤放在导入之前做完最省事。

## 怎么算转成了

转完再跑一次前面的 ffprobe，`r_frame_rate` 和 `avg_frame_rate` 两个值相等才算成。我这批四个测试文件（含一个无音轨的）转完都是 `30/1` 配 `30/1`，音频输出为 aac、48000 Hz。
