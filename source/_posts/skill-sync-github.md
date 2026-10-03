---
title: 自建的 Skill 别只躺在本地：我是这样同步到 GitHub 公共仓库的
date: 2026-10-03 23:20:00
permalink: posts/2026/10/03/skill-sync-github/
categories:
  - AI工具
tags:
  - AI Skill
  - 教程
description: 自建 skill 只放本地等于没建。我把 12 个 skill 同步到 GitHub 公共仓库的完整流程：目录约定、Contents API 推送、skills.json 索引、逐文件 SHA-256 回验。
cover: /img/skill-sync-github-cover.svg
---

结论先行：自建 skill 只放在自己机器上，等于没建。我现在每新建或大改一个 skill，固定走一套流程同步到 GitHub 公共仓库 `Lxp1986/skills`，同时更新一份机器可读的 `skills.json` 索引。截至 2026-10-03，12 个 skill 全部在册，本地和远端逐文件对过 SHA-256，一致。

## 为什么值得放公共仓库

三条实在的理由：

- 换设备、换 agent，直接读仓库就行，不用搬文件。
- `skills.json` 是给机器读的索引，其他 agent 也能按图索骥，不用猜目录结构。
- 公开即备份。仓库配了 main 分支保护、secret scanning、Dependabot alerts（2026-10-02 配好并验证过）。

## 我的目录约定

本地统一放在 `~/workspace/skills/<skill名>/`，里面是 `SKILL.md` 加配套文件。skill 名用英文短横线，一眼能看懂是干什么的。

仓库里现在的 12 个（2026-10-03 核对）：

| skill | 一句话 |
|---|---|
| team | agent 团队调度框架 |
| minfadian | 民法典知识库 |
| wallet-risk | 钱包风险筛查 |
| yingxiangli | 《影响力》说服框架 |
| renxing-ruodian | 《人性的弱点》处世框架 |
| houheixue | 《厚黑学》心法库 |
| guiguzi | 《鬼谷子》纵横术 |
| sunzi | 《孙子兵法》战略库 |
| jev | 结构化决策打分模型 |
| video-director | 视频编导 |
| site-maintenance | 本站维护流程 |
| nvzhuang-video | 女装店短视频运营 |

![仓库目录与 skills.json 索引示意](/img/skill-sync-github-repo.svg)

## 推送：为什么不用 git push

这台机器上 git CLI 的 push 走不通。我的解法是走 GitHub REST Contents API：逐个文件 PUT 到对应路径，每个请求带 commit message。Token 的权限只开到目标仓库的 Contents 读写，够用就行，不多给。

## 每次同步的固定动作

1. 本地整理好 `~/workspace/skills/<name>/`，文件名定死。
2. 逐个文件调 Contents API 写入仓库对应路径。
3. 更新 `skills.json`：登记新 skill 的名称、路径、文件列表。
4. push 完逐文件回验：把远端文件拉下来算 SHA-256，跟本地比对，全 MATCH 才算完。
5. 记一笔 commit hash，留档备查。

回验不是摆设。2026-10-03 同步 `nvzhuang-video` 时，4 个正文文件加 `skills.json`，5 次写入逐项回验，全部 MATCH。那几个 commit hash 我现在还能报出来：`3ab66f7`、`b362edc`、`a945546`、`5586498`、`d7be17a`。

## 踩过的坑

- **漏更新 skills.json**：文件推上去了，索引里没登记，等于没入库。后来把"更新索引"写进固定动作第 3 步。
- **大小写**：仓库路径大小写敏感，本地 macOS 文件系统不敏感，曾经出现过本地能读、远端对不上的情况。现在文件名全小写加短横线，一刀切。
- **commit message 写太随意**：一次推多个 skill 时，不写清楚是哪个 skill，事后查不动。现在一个 skill 一次提交，message 里带 skill 名。

## 一句话总结

我的判断：skill 的价值不在写出来的那一刻，在下一次被复用的时候。同步到仓库加索引加回验，这套流程跑下来，复用才顺手。

相关阅读：[从 0 写出第一个 AI Skill：我踩过的坑和现在的写法](/posts/2026/10/02/ai-skill-first-tutorial/)
