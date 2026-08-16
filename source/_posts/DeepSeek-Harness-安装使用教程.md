---
title: 把 DeepSeek Harness 跑起来了，安装过程记录
date: 2026-08-16 23:40:00
permalink: posts/2026/08/16/deepseek-harness-tutorial/
categories:
  - 技术
tags:
  - DeepSeek
  - AI Agent
  - 教程
  - 效率工具
description: Harness 安装和使用的过程记录：环境、安装、配置、三个我实际在用的场景，加上踩过的几个坑。
cover: /img/dsh-tutorial.svg
---

Harness 开源那天我装了一个，Windows 和 Mac 都试了一遍。过程比想的简单，把记录放这里，给还没动手的人省点时间。

## 环境就一个 Node.js

版本要 22.19 以上，或者 24。官网下 LTS 版装上，终端里跑 `node -v` 能出数字就行。

## 安装是一行命令

```bash
npx @deepseek-ai/dsh web
```

第一次跑会自己下载，等几十秒。然后浏览器打开 `http://127.0.0.1:3080`，能看到页面就装好了。终端别关。

## 配置两步

第一步，Settings → Models 里填 DeepSeek 的 API Key，去 platform.deepseek.com 申请，有免费额度。填完保存就行，不用重启。

第二步，Choose workspace 选一个文件夹给它当工作区。这步不选的话输入框是灰的，我一开始就卡在这。

## 第一次用

新建会话，发了句「总结这个文件夹的结构，说说是什么项目，新人从哪看起」。它会自己翻文件、读代码、跑命令，最后给一份总结。

## 三个我实际在用的场景

**分析老项目。** 看不懂的代码仓库丢给它，让它先讲一遍结构，比自己硬啃快。

**自动写周报。** 让它把上周的 git 提交汇总成周报，用 headless 模式跑，一条命令的事：

```bash
git log --since="1 week ago" --pretty=format:"%h %an %ad %s" --date=short > /tmp/gitlog.txt
dsh --profile headless "根据下面的提交记录写一份中文周报，按主题归类：$(cat /tmp/gitlog.txt)"
```

再配个 cron 定时跑就行。

**定时巡检。** 让它每小时查一次磁盘、服务健康、依赖更新，有问题提醒。这个要开 schedule 插件，稍微折腾一点，官方文档有写。

## 踩过的坑

- Key 填了还报错，八成是填错位置了，确认在 Settings → Models 里填的。
- 它默认只在工作区文件夹里能改东西，其他地方只读，工作区别直接指到重要目录。
- 费用这块，工具免费，花钱的是 API。DeepSeek 现在有峰谷定价，晚上和周末便宜，批量任务排晚上跑能省一半。

装好之后到底要不要长期用，跟 Claude Code、Codex 比怎么样，我写在另一篇里了：《[用了几天 DeepSeek Harness，说几个真实感受](/posts/2026/08/16/deepseek-harness-review/)》。

> 命令和版本信息查于 2026-08-16，工具还在快速更新，以官方为准。
