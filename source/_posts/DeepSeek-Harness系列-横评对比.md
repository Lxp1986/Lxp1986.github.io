---
title: DeepSeek Harness 系列｜横评对比：Claude Code、Codex CLI、OpenHands 与 Harness，谁更适合你
date: 2026-08-16 23:20:00
permalink: posts/2026/08/16/deepseek-harness-compare/
categories:
  - 技术
tags:
  - DeepSeek
  - AI Agent
  - 横评
  - Claude Code
  - Codex
  - OpenHands
  - 效率工具
description: 本篇是《DeepSeek Harness 系列》第四篇。把 DeepSeek Harness 和 Claude Code、Codex CLI、OpenHands、Gemini CLI、Aider 五个主流 Agent 框架放到一张桌上比：架构、许可证、生态、价格模式、适用场景，六维打分，最后给出"谁适合选谁"的明确结论。
cover: /img/dsh-compare.svg
---

> 这是《DeepSeek Harness 系列》第四篇。前两篇讲了[深度解读](/posts/2026/08/16/deepseek-harness-guide/)和[部署](/posts/2026/08/16/deepseek-harness-deploy/)、[使用](/posts/2026/08/16/deepseek-harness-usage/)。这一篇把 Harness 放到竞品桌上：**它到底凭什么跟已经跑了几年的 Claude Code、Codex CLI 同台竞技？**

先说清一个前提：所有 star 数、版本号均查询于 **2026-08-16**，许可证以各仓库 LICENSE 为准；"成熟度/稳定性"一类的判断是个人综合评估，不是官方口径。

![Agent 框架横评：定位象限图](/img/dsh-compare.svg)

## 一、六位选手档案

| 框架 | 出品方 | 语言 | 许可证 | GitHub Stars | 形态 | 一句话定位 |
|---|---|---|---|---|---|---|
| **DeepSeek Harness** | DeepSeek | TypeScript | MIT | 127,528 | Web UI + headless CLI + Python SDK | 官方出品，"一切皆插件"的 Agent 框架 |
| **Claude Code** | Anthropic | 终端应用（仓库显示 Python 为主） | **专有**（仓库公开但非开源） | 141,636 | 终端 CLI | 终端 Agent 的事实标杆 |
| **Codex CLI** | OpenAI | Rust | Apache-2.0 | 106,229 | 终端 CLI | 轻量本地 Agent，GitHub 深度集成 |
| **OpenHands** | All Hands AI 社区 | TypeScript | MIT | 84,190 | CLI + 云 IDE + SDK | 多 Agent 研究向，Docker 沙箱 |
| **Gemini CLI** | Google | TypeScript | Apache-2.0 | 106,530 | 终端 CLI | Google 生态的通用 Agent |
| **Aider** | 社区（Paul Gauthier 发起） | Python | Apache-2.0 | 48,266 | 终端 CLI | Git 原生的结对编程工具 |

> 注：Claude Code 的 npm 包 `@anthropic-ai/claude-code` 当前版本 2.1.233，Codex CLI 的 `@openai/codex` 为 0.147.0（截至 2026-08-16）。

## 二、核心差异：四个维度逐项比

### 2.1 架构哲学

- **Harness**：**一切皆插件**，微内核 + 事件驱动。模型适配器、工具、沙箱、会话日志、调度、UI 全部是可替换插件（底层是 Cordis 插件树，无特权内核）；运行时还允许模型用 `cordis_define` **现场定义/启停插件**——让 Agent 给自己加装工具。这是它和其他所有选手最大的不同。
- **Claude Code**：单体终端应用 + 扩展机制（hooks、skills、subagents、MCP）。插件化程度中上，但内核不开源，扩展受官方 API 边界约束。
- **Codex CLI**：轻量本地 Agent，AGENTS.md 指令、本地沙箱（seatbelt/landlock 类机制），架构务实简洁，扩展主要靠配置与 MCP。
- **OpenHands**：多 Agent 协作架构（Planner/Agent 分层），事件流驱动，Docker 沙箱隔离，偏研究导向。
- **Gemini CLI**：单进程 Agent + MCP 支持，强调与 Google 生态（Gemini API、GCP）协同。
- **Aider**：极简——一个 Python 进程 + git 原生工作流（自动 commit、diff 管理），几乎不搞插件体系。

### 2.2 模型绑定与价格模式

| 框架 | 模型绑定 | 价格模式（2026-08 口径，以官方为准） |
|---|---|---|
| Harness | **多 Provider**：DeepSeek / OpenAI / Anthropic / Azure / Bedrock / Vertex / Codex / 任意 OpenAI 兼容端点 | 开源免费 + 自带模型 Key；DeepSeek API 峰谷定价（空闲半价） |
| Claude Code | 以 Claude 为主（Sonnet/Opus 系） | 订阅制（Claude Pro/Max 套餐包含）或 API 按量；无开源版 |
| Codex CLI | OpenAI 模型为主（o 系/gpt 系），可配第三方 | 订阅套餐内使用或 API 按量 |
| OpenHands | 任意（自带 Key，支持多家） | 开源免费 + 自带 Key；云托管版另计 |
| Gemini CLI | Gemini 系列为主 | Google AI 订阅或 API 按量 |
| Aider | 任意（自带 Key，OpenAI/Claude/DeepSeek/本地均可） | 开源免费 + 自带 Key |

**Harness 在模型自由度上是第一梯队**：官方模型（V4-Pro/V4-Flash）深度耦合评测，但你想用别家的模型也随便切——Provider 是插件。

### 2.3 生态与成熟度

- **Claude Code** 生态最成熟：hooks/skills 社区大量模板、MCP 服务器生态最全、企业落地案例最多——但它**不开源**，这是硬约束；
- **Codex CLI** 开源（Apache-2.0）+ GitHub 原生（`AGENTS.md` 已被 GitHub 生态广泛接受），生态仅次于 Claude Code；
- **Gemini CLI** 开源 + Google 生态加持，star 涨得很快；
- **Harness**：star 涨速历史级（3 天 12.7 万），但**开发者预览阶段**，官方明说会有破坏性变更，第三方插件刚起步（GitHub 已有 `dsh-plugin` 话题，社区在快速填坑）；
- **Aider** 小而稳，四年磨一剑的成熟度；
- **OpenHands** 生态中等，研究论文和实验场景多。

### 2.4 上手与运维

| 框架 | 安装 | 上手难度 | 运维负担 |
|---|---|---|---|
| Harness | `npx @deepseek-ai/dsh web` | 低（Web UI 图形化） | 中（配置层概念有学习曲线） |
| Claude Code | `npm i -g @anthropic-ai/claude-code` + 登录 | 极低（终端引导） | 低 |
| Codex CLI | `npm i -g @openai/codex` + 登录 | 低 | 低 |
| OpenHands | Docker + `pip install openhands-ai` | 中（要配 Docker 沙箱） | 中高 |
| Gemini CLI | `npm i -g @google/gemini-cli` | 低 | 低 |
| Aider | `pip install aider-chat` | 极低 | 极低 |

## 三、六维打分（满分 5，个人综合判断，截至 2026-08-16）

| 维度 | Harness | Claude Code | Codex CLI | OpenHands | Gemini CLI | Aider |
|---|---|---|---|---|---|---|
| 功能完整度 | 4.5 | 5.0 | 4.5 | 4.0 | 4.0 | 3.5 |
| 架构设计 | **5.0** | 3.5 | 4.0 | 4.0 | 3.5 | 3.0 |
| 生态成熟度 | 3.5 | **5.0** | 4.5 | 3.5 | 4.5 | 4.0 |
| 上手难度 | 4.0 | **5.0** | 4.5 | 3.5 | 4.5 | 4.5 |
| 成本友好度 | 4.5 | 3.0 | 3.5 | 3.5 | 3.5 | 3.5 |
| 稳定性/成熟度 | 3.0 | 4.0 | 4.0 | 3.0 | 4.0 | **4.5** |
| **总分** | **24.5** | **25.5** | **23.5** | **21.5** | **22.5** | **19.5** |

几点说明（避免误读）：

- **架构分**给 Harness 满分，是因为"一切皆插件 + 无特权内核"在 Agent 框架里确实是独一份的干净设计，而且**有可验证的机制**（`--dump-config` 能打印全部配置层）；但架构分 ≠ 好用分；
- **稳定性**给 Harness 3.0，因为它是开发者预览版，官方自己都说会有破坏性变更；Aider 4.5 是因为它多年稳定迭代、极少大改；
- **成本**给 Claude Code 3.0：订阅制对重度用户其实划算，但对"偶尔用一下"的人是沉没成本；Harness 4.5 是因为开源 + 自带 Key + DeepSeek 便宜（即便峰谷涨价后仍属低价档，见[第一篇](/posts/2026/08/16/deepseek-harness-guide/)的账本分析）；
- 打分有主观成分，别当精密仪器，当"相对位置的参考"用。

## 四、明确结论：谁适合选谁

### 选 DeepSeek Harness，如果你是——

1. **深度定制派**：想改 Agent 的每一层（工具、沙箱、调度、UI 全是插件），想写自己的插件甚至让 Agent 自己写插件；
2. **DeepSeek 模型用户**：用 V4 系模型 + 想要官方同款评测环境（厂商基准就是在 Harness 上跑的）；
3. **多 Provider 刚需**：一个框架接 DeepSeek/OpenAI/Anthropic/自建网关，还想随时切换；
4. **预算敏感 + 愿意折腾**：开源免费 + 峰谷定价的省钱窗口 + 乐意接受预览期的折腾成本。

### 选 Claude Code，如果你是——

1. **要最省心**：装完登录就能用，终端引导体验最好，出问题社区答案最多；
2. **Claude 重度用户**：已经有订阅，Sonnet/Opus 用得顺手；
3. **生产环境求稳**：生态成熟、文档齐全、厂商支持——**前提是接受闭源**。企业合规不允许闭源工具的，直接排除。

### 选 Codex CLI，如果你是——

1. **GitHub 深度用户**：AGENTS.md 生态、与 GitHub 工作流（issue/PR/CI）天然协同；
2. **想要开源 + 轻量**：Apache-2.0，本地沙箱，不想要 Web UI 和插件体系那么重的框架。

### 选 OpenHands，如果你是——

1. **研究/实验向**：多 Agent 协作、沙箱隔离、可复现实验是你关心的；
2. **Python 生态 + Docker 沙箱**的组合是你的菜。

### 选 Gemini CLI / Aider，如果你是——

- **Gemini CLI**：Google 生态用户，或想要一个开源、通用、够用的终端 Agent；
- **Aider**：只想要一个"跟我结对写代码"的极简工具，git 原生、不折腾，其他功能都是噪音。

### 一句话总结

> **省心选 Claude Code，GitHub 原生选 Codex CLI，极简选 Aider，研究向选 OpenHands，Google 生态选 Gemini CLI；要深度定制、要官方模型耦合、要开源可控、要便宜——选 DeepSeek Harness，但先接受它是开发者预览版。**

我的态度和第一篇一致：Harness 现在适合**学习架构、写插件、深度围观**，社区最活跃的窗口期就是现在；要上生产，等 1.0 或生态沉淀一两个月再评估。

## 系列导航

- 第 1 篇·深度解读：《[DeepSeek Harness 深度解读](/posts/2026/08/16/deepseek-harness-guide/)》
- 第 2 篇·部署教程：《[DeepSeek Harness 系列｜部署教程](/posts/2026/08/16/deepseek-harness-deploy/)》
- 第 3 篇·使用教程：《[DeepSeek Harness 系列｜使用教程](/posts/2026/08/16/deepseek-harness-usage/)》
- 第 4 篇·横评对比：本文
- 第 5 篇·进阶技巧与踩坑：《[DeepSeek Harness 系列｜进阶技巧与踩坑](/posts/2026/08/16/deepseek-harness-advanced/)》

## 参考来源（均查询于 2026-08-16）

- GitHub API：`deepseek-ai/deepseek-harness`（127,528★）、`anthropics/claude-code`（141,636★）、`openai/codex`（106,229★）、`All-Hands-AI/OpenHands`（84,190★）、`google-gemini/gemini-cli`（106,530★）、`Aider-AI/aider`（48,266★）
- npm：`@anthropic-ai/claude-code` 2.1.233、`@openai/codex` 0.147.0
- 各项目官方 README 与文档

> star 数、版本、价格均随时间变动；许可证与商业模式以官方最新信息为准。打分含主观判断，欢迎评论区理性讨论。
