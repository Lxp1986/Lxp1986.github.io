---
title: MoneyPrinterTurbo 跑解说视频流水线，从部署到跑通
date: 2026-09-03 22:28:49
categories: [AI工具]
tags: [MoneyPrinterTurbo, 视频, 本地AI, Edge TTS, ffmpeg, 教程]
description: MoneyPrinterTurbo 把「文案→配音→拼画面→字幕→成片」串成一条命令，适合批量做中文解说短视频。本地实测跑通后有三个坑绕不开：task-id 必须是 UUID、字幕字体必须放 resource/fonts 里、素材 key 为空时只能 --video-source local 喂本地素材。附能直接复制的完整命令和抽帧核验画面匹配的方法。
cover: /img/mpt-pipeline.svg
---

我要做一批中文解说短视频——城市航拍、乡村风光那种，画面配旁白。手动剪太慢，就试了开源的 MoneyPrinterTurbo（Python 写的），它把文案、配音、拼素材、烧字幕、合成一条命令串完。文案走 DeepSeek 的接口（兼容 OpenAI 格式），配音用 Edge TTS，这俩都不要钱，素材用自己手头的视频。跑通之后发现真正卡人的不是部署，是下面这三个坑。

## 先分清两个入口

项目跑起来是两个独立进程，别只开一个：

```bash
# 后端 API（FastAPI），监听 8080
python main.py
# 浏览器开 http://127.0.0.1:8080/docs 才是接口文档，根路径只是落地页

# WebUI 操作界面（Streamlit），监听 8501
chmod +x webui.sh    # 这文件 clone 下来默认没有执行权限，不 chmod 直接报 permission denied
./webui.sh
```

我一般不用 WebUI，直接命令行跑，参数可控、好重复。

## 坑一：task-id 必须是 UUID

想给任务起个能看懂的名字？不行。传 `yangchun_seasons` 这种自定义字符串，直接报：

```
task-id must be a valid UUID
```

任务 ID 老老实实用 `uuidgen` 生成，跑完去 `storage/tasks/<uuid>/` 里拿产物。

## 坑二：字幕字体不能填系统字体名

中文视频要烧中文字幕，`--font-name` 传系统字体名（比如 `Songti SC`）会报：

```
subtitle font file must exist inside ./resource/fonts
```

必须把字体文件本身放进 `resource/fonts/` 目录，传文件名。项目自带 `MicrosoftYaHeiNormal.ttc` 和 `STHeitiMedium.ttc`，直接用前者就行。中文默认字体经常有版权问题，这个自带的是最省事的。

## 坑三：素材 key 全空时，在线素材一个都用不了

`config.toml` 里 pexels、pixabay 的 key 不填，在线素材源就等于没有。实测 curl Pexels 直链还被 Cloudflare 403 挡。所以只能：

```bash
cd ~/MoneyPrinterTurbo
.venv/bin/python cli.py \
  --video-source local \
  --video-materials "/path/素材1.mp4,/path/素材2.mp4,/path/素材3.mp4" \
  --video-concat-mode sequential \
  --video-script $'第一段文案\n第二段文案\n第三段文案' \
  --video-language zh-CN \
  --video-aspect 16:9 \
  --font-name "MicrosoftYaHeiNormal.ttc" \
  --stop-at video
```

`--video-script` 里每行 `\n` 是一段独立配音，这样文案完全自己定，跳过 LLM 生成那步，最可控。输出在 `storage/tasks/<uuid>/` 下：`final-1.mp4` 是带字幕成片，`combined-1.mp4` 是没字幕的拼接，`audio.mp3` 和 `subtitle.srt` 是中间产物。

## 素材从哪来：B 站能搜到，但有版权水印

要拍特定地方（比如我搜阳春的航拍），B 站能搜到真素材：

```bash
yt-dlp --ignore-config --cookies-from-browser chrome "bilisearch6:阳春航拍"
```

两个注意点：`--ignore-config` 必须加，否则和 yt-dlp 全局配置里的 cookies 参数重复写会出问题；读 Chrome 的 cookie 需要 macOS 给终端「完全磁盘访问」权限，没授权会报找不到 cookie 数据库。但 B 站素材带着水印、是别人的版权，成片直接发不干净，自己商用前想清楚。Wikimedia 免 key 能下，可内容基本是外国河流瀑布，撑不起精确主题。最干净的出路还是自己拍的素材。

## 画面和文案要对得上，别只看文件名

第一次跑我按素材标题写文案，结果成片里文案说「江水穿城、田园村落」，画面却是夜景城市——素材实际是昼夜混剪的。文件名和标题根本说明不了画面内容。

核验办法是抽帧看：用 ffmpeg 从成片里抽几帧拼一起检查。这里有个坑，多个时间点写进同一条命令会抽成同一帧：

```bash
# 这样写不行——两个 -ss 混一条命令，抽出来是同一帧
ffmpeg -ss 3 -ss 30 -i final-1.mp4 -frames:v 1 f.png

# 要一条命令只抽一个点
ffmpeg -y -v error -ss 3 -i final-1.mp4 -frames:v 1 f1.png
ffmpeg -y -v error -ss 30 -i final-1.mp4 -frames:v 1 f2.png
```

这工具适合手里有自己素材、要批量做解说的人；指望全自动出一个能直接发布的成品，目前还不行，素材版权这关谁也绕不过去。
