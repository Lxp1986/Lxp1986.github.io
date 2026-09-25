---
title: Grok Bot、Codex、Hermes 三个 agent 我都在用，客观比一比
date: 2026-09-26 14:00:00
permalink: posts/2026/09/26/grokbot-codex-hermes/
categories:
  - AI工具
tags:
  - Grok Bot
  - Codex
  - Hermes Agent
  - AI Agent
  - 横评
description: Grok Bot、OpenAI Codex、Nous Research 的 Hermes Agent，三个 agent 我都实际用过。按官方页面核对价格、模型选择、超额处理、维护成本、记忆与定时任务、远程指令，再按场景说谁适合谁。
cover: /img/agent-trio-compare.svg
---

先给结论：**写代码、跑生产任务，而且家里本来就有一台常开电脑的人，Codex 加 Hermes 这套组合更便宜也更灵活；不想自己维护、要在一堆网页应用里处理杂事的人，Grok Bot 更省心。** 三个都不是"全面更好"，差别主要在三处：钱怎么算，模型能不能换，出了问题谁来修。

这三个我都在用：Codex 主要用来写代码、改脚本；Hermes 装在我自己的 Mac mini 上，出门时用 Telegram 给它派活；Grok Bot 用来处理邮件、GitHub、网页后台这类杂事。下面的事实部分都对照了官方页面（核对到 2026-09-26），链接在文末；感受部分我会明说是我自己的判断。额度细节站内已经写过一篇《[按月付的钱，按周给的额度：Codex、Grok 和 Cursor 的限额我算不明白](/posts/2026/09/21/付的是月费赌的是额度-吐槽Codex和Grok的订阅限额/)》，这里不重复，只补跟对比有关的部分。

## 先认清三个东西各是什么

**Codex** 是 OpenAI 的编程 agent，有 CLI、IDE 插件、桌面端、网页端。它不单独卖，含在 ChatGPT 套餐里，也可以直接用 API Key 按量付费。

**Hermes** 这里指的是 Nous Research 开源的 Hermes Agent。我装的就是它：本机安装目录的 git 远程指向 GitHub 上的 `NousResearch/hermes-agent`，包名是 `hermes-agent`。官方 README 写的是 MIT 协议，可以装在自己的电脑、VPS 或云主机上，模型随便接：Nous Portal、OpenRouter、OpenAI、自建端点都行，用 `hermes model` 切换。

**Grok Bot** 是 SpaceXAI 推出的 agent 产品，桌面端（macOS / Windows）和 iOS 都能用。官方的卖点是：每个用户有一台常开的云端电脑，带浏览器和终端，Bot 能登录你的应用在里面干活；可以同时开好几个 Bot 分工，放进一个群聊里互相传活。它没有单独订阅，用量记在 Cursor 账户上。

## 一张表看差别

| 维度 | Codex | Hermes Agent | Grok Bot |
| --- | --- | --- | --- |
| 价格 | 含在 ChatGPT 套餐里：Go 8 美元、Plus 20 美元、Pro 起价 100 美元/月；也可用 API Key 按量付费 | 软件免费开源（MIT），花的是模型 API 费和自己的机器 | 无单独订阅，含在 Cursor Pro（20 美元/月）及以上、Cursor Teams、SuperGrok 各档里 |
| 模型选择 | 默认用 OpenAI 模型；CLI 可以在 `config.toml` 里配自定义 provider，但对方要兼容 Responses API | 随便接，官方列了 Nous Portal、OpenRouter、OpenAI、自建端点等 | 官方页面没有提供接入自己模型或 API Key 的选项 |
| 超额怎么办 | 可以买额外 credits；也可以用 API Key 按标准 API 价继续跑本地会话 | 没有"额度"，按 API 用量付钱，自己设预算 | 周额度用完后，开了 On-demand 就按 token 计费继续跑，没开就停到下次重置 |
| 维护成本 | 低，官方托管；CLI 要自己更新 | 高：安装、升级、网关、授权、排障全靠自己 | 最低，云电脑由官方维护 |
| 记忆 / 定时任务 | 官方功能表里有定时任务；Memories 目前只在部分地区可用 | 自带记忆（agent 自己整理，可跨会话搜索）和 cron 调度 | 有长期记忆，可以设定时 Routines，也能监听其他应用的事件触发 |
| 远程指令 | 功能表里有手机远程控制（Mobile remote control） | 一个网关进程接 Telegram、Discord、Slack、WhatsApp、Signal 等 | 手机 App 和桌面端共用同一条对话 |

有两点跟我原来的印象不一样。第一，定时任务和手机远程控制现在 Codex 也有了，不是 Grok Bot 独有。第二，Grok Bot 额度用完并不一定"只能停"，开了按量付费就能接着跑。

## Codex：写代码最顺手，额度是主要约束

**价格。** 按官方 Codex 定价页，Codex 含在 ChatGPT 的 Free、Go、Plus、Pro、Business、Edu、Enterprise 套餐里。个人档是 Go 8 美元/月、Plus 20 美元/月，Pro "From $100/month"，可选比 Plus 高 5 倍或 20 倍的额度。20 倍那档就是 OpenAI 帮助中心说的 Pro 200 美元（Pro 20X）。这里有个最新变化：**OpenAI 从 2026-09-10 起暂停了 Pro 200 美元档的新订阅和升级**，已有订阅不受影响，100 美元档照常可买。

**额度。** 定价页给的是"每 5 小时本地消息数"的估算区间，而且强调不是固定上限，跟模型、上下文、任务复杂度有关，另外"Weekly limits may also apply"。拿 Plus 举例：最强的 GPT-6 Astra 是 5–45 条，GPT-6 Sol 是 15–150 条，GPT-5.5 是 15–80 条。Pro 5x、20x 基本按倍数往上放。具体怎么被 5 小时窗和周额度卡住，站内那篇写过，这里不展开。

**超额之后。** 官方写了三条路：

1. 当前这一轮做到一半撞上限，agent 可以把这一轮做完（受合理使用约束）；
2. Plus 和 Pro 可以买额外 credits，不用升级套餐；
3. 所有用户都可以用 API Key 跑额外的本地会话，按标准 API 价格计费。

**能不能换第三方模型把中断的任务接着做？** 能，但有条件，官方也没有一套专门的"超额切换"流程。我对照文档核实到的做法是：

- 在用户级的 `~/.codex/config.toml` 里定义 `[model_providers.<id>]`，写上 `base_url` 和 `env_key`（放 API Key 的环境变量名），再用 `model_provider` 指过去。官方示例里有 Mistral、本地 Ollama、LLM 代理。项目目录里的 `.codex/config.toml` 不能改 provider，会被忽略。
- 关键限制是：`wire_api` 目前只支持 `responses`。也就是说，第三方服务得兼容 OpenAI 的 Responses API 才接得上，只有 Chat Completions 接口的服务直接配进去用不了。
- 接回原来的会话用 `codex resume`。官方 CLI 参考写明它"accepts the same global flags as codex, including model and sandbox overrides"，所以可以带上 `--profile` 或 `-c model_provider=...`，换一个 provider 继续跑。至于换了模型之后工具调用、推理习惯是不是还跟得上，得自己试。

我的体感是：Codex 在读仓库、改代码、跑测试这条线上最顺，是三个里最像"写代码的同事"的。短板是额度看不透，还有 Pro 20x 现在买不到。

## Hermes：最灵活，也最费心

**价格结构最透明。** Hermes 本身不收钱，官方 README 写的是 MIT 开源，你花的钱就两块：模型 API 费，加上跑它的那台机器。我用的是本来就 24 小时开着的 Mac mini，所以机器这块几乎没有额外成本。模型可以按任务挑，贵的留给难活，便宜的跑日常。官方也提供 Nous Portal 订阅，把模型、搜索、生图、TTS 这些打包，不想一个个收集 API Key 的人可以用，但不是必须。

**功能不少。** 官方 README 列的有：

- 一个网关进程接 Telegram、Discord、Slack、WhatsApp、Signal 和 CLI；
- agent 自己整理记忆，跨会话全文检索；
- 内置 cron 调度，结果可以推到任意平台；
- 能派子 agent 并行干活；
- 技能（skills）系统，复杂任务做完会自己沉淀成技能。

我日常最常用的就是 Telegram 派活，出门在外发一句，它在家里的机器上跑完再回我。

**代价是维护全在自己身上。** 这不是缺点清单里凑数的一条，是实打实的时间成本：版本升级要自己跟；网关进程挂了要自己发现；每个模型、每个平台的授权要自己管；日志要自己翻；出了错没有客服，只能看 issue 或者自己读代码。机器上存着一堆 API Key，安全也得自己负责。喜欢折腾的人会觉得这是自由，不喜欢的人会觉得这是第二份工作。

## Grok Bot：最省事，但钱和模型都不由你

**价格以官方为准。** Grok Bot 没有单独订阅。按 SpaceXAI 官网和 Cursor 帮助中心，它含在 Cursor Pro、Pro+、Ultra、Cursor Teams，以及 SuperGrok、SuperGrok Plus、SuperGrok Heavy 里，X Premium+ 也能关联领一份用量。官网定价区标的是 Cursor Pro 20 美元/月、SuperGrok 30 美元/月、Teams 40 美元/席位/月；Pro+ 和 Ultra 在 Cursor 定价页分别是 60 和 200 美元/月。各档给多少周用量，官方只写了"Pro 低于 Pro+，Pro+ 低于 Ultra"这种相对说法，没有具体数字。

**超额处理。** 官方写得很清楚：先用每周重置的包含额度（Weekly usage）；用完后，如果开了 On-demand，就按 token 成本继续计费，走 Cursor 账单，受你设的月度上限约束；没开 On-demand，就停到下周重置。另外，Cursor 套餐和 SuperGrok 关联的用量**不叠加**。

**多 Bot 更费额度。** 官方说试用额度是"按 agent 步数和 token"消耗的，不是按你发了几条消息算。多个 Bot 互相传话、各自调用工具，步数和 token 都会叠上去。所以"几个专职 Bot 协作"这种用法，同一件事的消耗通常比单个 agent 高。这是我按官方计量方式推出来的，也跟我自己的体感一致；官方没有给过具体倍数。

**优点确实是现成。** 一台常开的云端电脑（官方说同一用户的所有 Bot 共用这一台，文件、浏览器、登录状态都共享），Bot 直接登录网页应用干活，能设定时 Routines，也能盯着 Slack 线程或 GitHub PR 触发，手机和桌面接同一条对话。不用装任何东西，也不用管进程死没死。

**缺点要说清楚：**

- 模型不由你选。官方页面没有自带模型或 API Key 的选项，想用更便宜的模型压成本做不到。
- 额度用完，要么停，要么按量加钱，没有"换个便宜模型接着跑"这条路。
- 对已经有一台常开 Mac、跑着 Hermes 的人，"常开电脑 + 远程派活 + 定时任务"这几项是重叠的。有意思的是，官方自己的工程指南里也提到，Grok Bot 可以把 Cursor 云端 agent 派到你自己的机器上跑，比如一台闲置的 Mac mini。换句话说，官方也承认这两类用法是可以互相替代的。

## 按场景选

**写代码、跑生产任务，家里有常开电脑：Codex + Hermes。** Codex 负责写代码，额度紧了就买 credits 或切 API Key；Hermes 负责长期在线、定时任务、Telegram 远程派活，模型按任务挑，便宜的活用便宜的模型。前提是你愿意花时间维护。这个结论核对下来成立。

**不想维护、杂事多、跨很多网页应用：Grok Bot。** 邮件分拣、网页后台、要登录各种 SaaS 的活，Grok Bot 的现成云电脑和多 Bot 分工最省心。要接受的代价是模型不能换，超额要么等要么加钱，多 Bot 协作更费额度。

**两边都要：** 我现在就是混着用。Codex 写代码，Hermes 跑本机长任务和定时活，Grok Bot 处理那些需要登录网页、我懒得自己点的杂事。三份钱确实有重叠，我也在考虑砍掉一个，还没想好砍哪个。

## 收尾

一句话：**Codex 最会写代码，Hermes 最自由但最费心，Grok Bot 最省事但最不由你。** 选之前先问自己两个问题：有没有一台愿意长期开着、自己维护的电脑？额度用完的时候，你更想换模型，还是更想加钱？

> 本文价格和功能核对于 2026-09-26，写于 2026-09-26。三家的套餐、额度和功能都在快速变化，以官方最新页面为准。

## 参考来源

- OpenAI：[Codex Pricing](https://developers.openai.com/codex/pricing)、[Codex 高级配置（自定义 model provider）](https://developers.openai.com/codex/config-advanced)、[Codex 配置参考](https://developers.openai.com/codex/config-reference)、[Codex CLI 参考（resume）](https://developers.openai.com/codex/cli/reference)、[What is ChatGPT Plus?（含 Pro 200 美元档暂停说明）](https://help.openai.com/en/articles/6950777-chatgpt-free-tier-faq)
- Hermes Agent：[NousResearch/hermes-agent（GitHub 官方仓库 README）](https://github.com/NousResearch/hermes-agent)
- Grok Bot：[SpaceXAI Grok Bot 官网](https://x.ai/bot)、[Grok Bot is now included with more plans](https://x.ai/news/grok-bot-more-plans)、[Cursor 帮助中心：Grok Bot Plans and billing](https://cursor.com/help/grok-bot/plans)、[Grok Bot for Engineering](https://x.ai/bot/guides/grok-bot-for-engineering)
- Cursor：[Models & Pricing](https://cursor.com/docs/models-and-pricing)
