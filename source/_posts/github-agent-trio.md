---
title: 这周 GitHub 热榜，三个给 agent 用的开源项目
date: 2026-10-11 23:30:00
updated: 2026-10-11 23:30:00
permalink: posts/2026/10/11/github-agent-trio/
categories:
  - AI工具
tags:
  - AI Agent
  - GitHub Trending
  - 开源项目
  - Agent Skill
description: 这周 GitHub 周榜上有三个给 agent 补短板的开源项目：mattpocock/skills 管怎么干活，claude-mem 管记不记得，HyperFrames 管交什么货。许可、功能和装法对照官方仓库核到 2026-10-12。
cover: /img/github-agent-trio-cover.png
---

![三个项目对应 agent 的三段工作流](/img/github-agent-trio-cover.png)

这周 GitHub 周榜上，有三个项目都是在给 agent 补短板。不是又一个聊天壳。

我挑了这三个。一个管“怎么干活”，一个管“记不记得”，一个管“交什么货”。正好是 agent 常见的三个短板。

数字来自各仓库页面和 GitHub Trending 页面，2026 年 10 月 12 日凌晨核对，会变。核对时这三个在周榜上分别排第 3、4、6。

## 一、mattpocock/skills：先别急着写代码

作者是 Matt Pocock，GitHub 简介里写的是在做 TypeScript 课程。

仓库就是他自己每天用的一堆 skill，MIT 协议。总星数二十八万多，榜单页显示这周涨了九千多。

他 README 里说得很直白：现在有些框架想把流程全包了，结果你失去控制，出 bug 也不好排查。所以他的 skill 都做得很小，能改能拼，换模型也能用。

README 里最受欢迎的是 `/grill-me` 和 `/grill-with-docs`。

意思就是让 agent 先“拷问”你。你要做什么、边界在哪、哪些不做，问清楚了再动手。

README 的判断是：agent 干错，常见原因是你和它没对齐，不是它笨。

还有一招：给项目写一份“共享词汇表”。

项目里的黑话写下来，agent 就不用每次拿二十个字去描述一个概念。他原话举的例子，一长句话最后压成一个短语。README 的说法是省 token，也让变量、文件命名更一致。

另外几个也实在：`/tdd` 让它先写会失败的测试，`/diagnosing-bugs` 把排错拆成一步一步。

安装很省事。Claude Code、Codex、Copilot、Gemini CLI 都有对应命令，其他 agent 用 `npx skills@latest add mattpocock/skills -a <agent>`。装完先在每个仓库跑一次 `/setup-matt-pocock-skills`。

## 二、claude-mem：让 agent 别失忆

每开一个新会话，agent 就跟刚认识你一样。

claude-mem 干的就是这个：自动记下 agent 用过什么工具、做过什么，压缩成摘要，下次开会话再塞回去。Apache-2.0 协议，总星数快到十万。

它的安装说明里专门有一行 Grok Bot 的：

```bash
npx claude-mem install --ide grok-bot
```

因为 Grok Bot 没有钩子可挂，它就去盯聊天记录文件。

不过要说清楚：Grok Bot 这条安装路径默认走的是托管版 CMEM Pro。通用安装器则会引导你用邮箱登录，官方写的是不需要信用卡。不想上云，装的时候加 `--provider host` 用本地模式。记忆这种东西，放哪里要先想好。

它还有个隐私开关：用 `<private>` 标签把敏感内容排除在存储之外。

![三个项目各管一段](/img/github-agent-trio-flow.png)

## 三、HyperFrames：写 HTML，出视频

这个是 HeyGen 开源的，Apache-2.0，榜单页显示这周涨了四千多星。

思路很简单：视频就是一页 HTML。

时间轴用 `data-*` 属性写，动画用 GSAP、CSS、Lottie、Three.js 等都行，最后渲染成 MP4。

为什么说它是给 agent 用的？

README 的说法是：它赌的是纯 HTML，人和 agent 都容易写。渲染时在无头 Chrome 里逐帧截取，再用 FFmpeg 编码，同样的输入出同样的视频。

仓库自带二十一个 skill。产品介绍视频、PR 讲解视频、给口播加字幕、按音乐节拍出画面，都有现成流程。

上手就三行：

```bash
npx hyperframes init my-video
npx hyperframes preview
npx hyperframes render
```

要求 Node.js 22 以上，再装个 FFmpeg。

## 怎么选

三个不用一起上，按成本排个序。

先试 mattpocock/skills。装起来最轻，是一组文本形式的 skill，MIT 协议。可以先只用 `/grill-me` 这一条思路：开工前让 agent 先问清楚要做什么、边界在哪，再动手。

claude-mem 建议放在后面。Grok Bot 这条安装路径默认走托管版，要先搞清楚它存了什么、存在哪。如果 agent 本身已经有记忆机制，叠加之前先确认两边记的是什么，别重复记。要本地跑，用 `--provider host`，敏感内容用 `<private>` 标签排除。

HyperFrames 有视频或动画需求时再试。需要 Node.js 22 以上和 FFmpeg，可以先用 `init` 和 `preview` 在浏览器里看效果，再决定要不要 `render`。

---

项目地址：

- [mattpocock/skills](https://github.com/mattpocock/skills)
- [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem)
- [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)
