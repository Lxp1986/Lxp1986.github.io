---
title: Context Mode 和 XERJ：少让 agent 把上下文塞满
date: 2026-10-15 23:05:00
updated: 2026-10-15 23:05:00
permalink: posts/2026/10/15/context-mode-xerj-cut-agent-tokens/
categories:
  - AI工具
tags:
  - AI Agent
  - token
  - 开源项目
  - MCP
  - GitHub Trending
description: 十月中旬 GitHub 热榜上两个专治 agent 烧 token 的项目：Context Mode 把工具输出挡在沙箱外，XERJ 用本地索引代替 grep 读全文。星数、许可和官方数字核到 2026-10-15。
cover: /img/context-mode-xerj-cover.png
---

![工具输出进沙箱、代码用索引查，少往上下文里灌](/img/context-mode-xerj-cover.png)

十月初写过省 token 的习惯。那篇讲的是写法。

今天换工具。GitHub 日榜上两款都在吵同一件事：别让 agent 把窗口塞满。一个管工具吐出来的烂摊子，一个管搜代码别整文件往里灌。

数字来自 GitHub API、各自 README 和官网，2026-10-15 晚核对，会变。

## 一、mksglu/context-mode：工具输出先过沙箱

仓库：[mksglu/context-mode](https://github.com/mksglu/context-mode)

TypeScript，约 2.96 万星，主页 [context-mode.com](https://context-mode.com)。许可是 Elastic License 2.0：源码能看、能改、能自用，不能拿去当托管服务卖。不是 MIT 那种随便再打包成竞品 SaaS。

它干的事很直白。MCP 工具一跑，Playwright 快照、日志、大 JSON 会直接砸进上下文。README 举例：Playwright 快照 56 KB，20 条 GitHub Issues 59 KB。Context Mode 把原始数据留在沙箱子进程里，只把 stdout 或检索片段塞回对话。官方基准表写：一整场会话 315 KB 原始输出压到 5.4 KB，宣称约 98% 缩减；单场景 Playwright 56.2 KB → 299 B。

另外两块也写进了 README。会话压缩前，把文件编辑、任务、决策记进本地 SQLite，压缩后按需捞回来，别一 compact 就失忆。再就是逼 agent「写脚本算结果」——五十个文件别全读进窗口再数行数，让 `ctx_execute` 跑完只回一行答案。

装法看客户端。Claude Code 可走插件市场；也有 `npx -y context-mode` 的 MCP 装法。README 写支持约 17 个客户端，含 Cursor、Codex、Gemini CLI、OpenCode 等。Cursor 的 Marketplace 插件截至核对时仍在等上架，本地可用 symlink 或手动 hooks。聊天里打 `ctx stats` 能看本轮省了多少。

官网还卖一套网关：改 base URL，按请求计费，带 Protect 规则。那是另一条产品线。本文只谈仓库里这套本地 MCP，别和网关混着看。数字没在我这边实测，以你机器上的 `ctx stats` 为准。

![Context Mode README 基准表：大输出进沙箱，对话里只留摘要](/img/context-mode-sandbox.png)

图：github.com/mksglu/context-mode README「Benchmarks」截图（2026-10-15）

## 二、xerj-org/xerj：先建索引，再问一句

仓库：[xerj-org/xerj](https://github.com/xerj-org/xerj)

Rust，约 4960 星，Apache-2.0，官网 [xerj.org](https://xerj.org)。一条静态二进制，讲 Elasticsearch 那套 HTTP API，现有客户端能直接怼。

痛点和 Context Mode 错开。Agent 用 grep 找到行号之后，还是要把整文件读进上下文才能判断。XERJ 的打法是：`xerj autoindex` 扫文件夹，代码走 tree-sitter，问的时候拿回段落和 `file:line`，别整文件灌。

官方 case study（8 个任务、4 种语言、每臂 16 次、真实 `claude -p` 账单）：相对「只靠记忆」输出 token 约少 26 倍；相对「grep 驱动」约少 2.7 倍，同为 16/16 解题。仓库简介还写过「比 grep 少 40 倍 token」——以 case study 页面为准，简介更冲。他们自己也老实写：对模型已经背熟的热门库帮助有限，对私有、冷门、截断后的代码更有用。

本机起步大致是：

```bash
curl -fsSL https://xerj.org/get | sh
xerj --insecure --data-dir ./data &
xerj autoindex ~/my-project
```

`--insecure` 关 TLS 和鉴权，只适合本机 `127.0.0.1`。共享机器别这么开。还有 `xerj init` 一键接到 Claude Code / Cursor（MCP + skill），以及 `xerj mcp` 给桌面 agent 用。可选的 Jev 重排会把结果文本送到 TypeSafe 服务器，默认关着；本地 `/_decide` 那条不外传。

![XERJ case study：输出 token 与解题数对比](/img/xerj-index-search.png)

图：xerj.org/case-studies/reference-coding 截图（2026-10-15）

## 怎么选

烧在「工具一吐一大坨」→ 先看 Context Mode。  
烧在「搜代码却整文件往里读」→ 先看 XERJ。

一个偏会话中间件，一个偏本地搜索引擎。都能 MCP 接进日常 agent 工作流。星数会变，数字以官方页面为准。
