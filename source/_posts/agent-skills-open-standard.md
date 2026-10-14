---
title: Agent Skills 开放标准：一个 SKILL.md，多款 agent 都能认
date: 2026-10-14 23:10:00
updated: 2026-10-14 23:10:00
permalink: posts/2026/10/14/agent-skills-open-standard/
categories:
  - AI工具
tags:
  - Agent Skills
  - SKILL.md
  - 开源
  - AI Agent
description: Agent Skills 已经有公开规范站点 agentskills.io。对照 anthropics/skills、addyosmani/agent-skills 和已弃用的 openai/skills，把格式、装法和星数核到 2026-10-14。
cover: /img/agent-skills-open-standard-cover.png
---

![Agent Skills 渐进加载：先看到名字，用到再读全文](/img/agent-skills-open-standard-cover.png)

十月初写过「怎么写出第一个 skill」。那段时间大家还在各自攒 Markdown。

现在不一样了。规范有了公开站点：[agentskills.io](https://agentskills.io)。Cursor、Claude Code、Codex、Gemini CLI、GitHub Copilot 这些客户端，站点上都挂着各自的 skills 文档入口。

![agentskills.io 首页：skill 就是一个带 SKILL.md 的目录](/img/agent-skills-open-standard-site.png)

图：agentskills.io 首页截图（2026-10-14）

格式是 Anthropic 先做出来的，后来放开成开放标准。站点自己这么写。下面数字都对着 GitHub API 和官方页面核过（2026-10-14 晚），会变。

## 一个 skill 长什么样

规范写得很死：一个目录，里面至少要有 `SKILL.md`。

开头两行 frontmatter 是硬要求：`name` 和 `description`。`name` 最多 64 字符，只能小写、数字、连字符，不能首尾连字符，也不能连续两个 `--`。`description` 最多 1024 字符，要说清楚干什么、什么时候用。可选字段有 `license`、`compatibility`、`metadata`。

下面随便写 Markdown 说明。需要脚本、参考资料、模板，就放进 `scripts/`、`references/`、`assets/`。

加载分三步，官方叫 progressive disclosure：

1. 启动时只读名字和描述
2. 任务对上了，再读整份 `SKILL.md`
3. 脚本和参考文件用到才拉

这样上下文不会一上来被几十个 skill 撑满。规范还建议主文件别超过大约 500 行，细的东西拆出去。

## 两套现成仓库，方向不一样

### anthropics/skills：官方示例库

仓库：[anthropics/skills](https://github.com/anthropics/skills)

GitHub API 核对：181079 星，2025-09-22 建库。README 写明：这是 Anthropic 给 Claude 的 skills 实现样例；规范本身去 agentskills.io。

里面有创意、开发、企业沟通、文档几类示例。不少示例是 Apache-2.0；`docx` / `pdf` / `pptx` / `xlsx` 那几个文档 skill 是 source-available，不是开源，README 自己写清楚了。

Claude Code 可以这样加 marketplace：

```bash
/plugin marketplace add anthropics/skills
```

再装 `document-skills` 或 `example-skills`。Claude.ai 付费档也能用这些示例；API 侧有 Skills API。

它适合当「格式长什么样」的参考，不是「把工程流程全包了」的那一类。

### addyosmani/agent-skills：工程全流程包

仓库：[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)

GitHub API 核对：106525 星，MIT，主页 [skills.addy.ie](https://skills.addy.ie)，2026-02-15 建库。

一共 25 个 skill，外加 9 个斜杠命令：`/spec`、`/plan`、`/build`、`/test`、`/review`、`/ship` 这一路。每个 skill 带步骤、验证门槛，还有一张「agent 常见借口 vs 反驳」表。

通用装法（官方 README）：

```bash
npx skills add addyosmani/agent-skills
```

这条走的是 [vercel-labs/skills](https://github.com/vercel-labs/skills)（34879 星，MIT，主页 skills.sh）。README 写能装进 70 多个 agent。Claude Code、Cursor、Codex、Gemini CLI 也各有一段原生装法。

它跟 anthropics 仓库的差别很明显：一边是示例和文档能力；一边是「从需求到上线」的工程纪律。

## 还有一个要注意：openai/skills 已弃用

[openai/skills](https://github.com/openai/skills) 现在 28067 星，但 README 置顶写了：仓库已 deprecated。新例子去 OpenAI Plugins 仓库；自己要给 Codex 加 skill，按官方 Build plugins 指南。

星数还在，不等于还该装。装之前先看一眼 README 顶上那条。

## 写 skill 时别忘的两件事

第一，`description` 决定它会不会被想起。写「提高效率的工具」等于没写；写成「什么任务触发、解决什么具体问题」才有用。

第二，别把密钥写进 `SKILL.md`。规范鼓励分享和复用，写进去就等于公开。

十月初那篇讲怎么从零写；这篇只补地图：标准在哪、两套现成库差在哪、哪一个别再当最新入口。

装之前以各仓库 README 和 [agentskills.io](https://agentskills.io) 为准。
