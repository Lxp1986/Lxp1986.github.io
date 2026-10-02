---
title: 从 0 写出第一个 AI Skill：我踩过的坑和现在的写法
date: 2026-10-02 21:00:00
permalink: posts/2026/10/02/ai-skill-first-tutorial/
categories:
  - AI工具
tags:
  - AI Skill
  - 教程
  - Claude Code
  - Agent
description: 今天 GitHub 热榜前十里六个跟 AI Skill 相关。我从去年开始攒 skill，现在手里有 11 个。这篇写怎么从 0 写出第一个能用的 skill：SKILL.md 怎么写、目录怎么组织、哪几个坑别踩。
cover: /img/ai-skill-first-cover.svg
---

先给结论：**skill 就是"给 AI 的说明书"，一个带名字的 Markdown 文件加一堆配套文件，告诉 AI 什么时候调你、怎么调你。** 写 skill 不需要学新框架，核心就一个文件：`SKILL.md`。我第一个 skill 从动手到能用花了不到一小时，返工最多的地方是 description 写得太烂，AI 根本不调它。

为什么现在写这个：今天（2026-10-02）GitHub 热榜前十里，Agent-Reach、caveman、superpowers、mattpocock/skills、marketingskills、google/skills，六个跟 skill 相关。caveman 靠"砍 65% token"直接 viral。中文世界里系统讲这个的还很少，现在写不算晚。

## Skill 到底是个什么东西

一句话：**可复用的 AI 能力包**。跟 prompt 的区别是：prompt 用一次就扔，skill 存下来，AI 下次遇到类似任务会自动想起你。

物理形态很简单，一个目录：

```text
my-skill/
  SKILL.md        ← 必需，说明书
  bin/xxx.py      ← 可选，配套工具
  references/     ← 可选，参考资料
```

`SKILL.md` 开头有一段 front-matter，相当于 skill 的身份证：

```yaml
---
name: "my-skill"
description: "一句话说清这个 skill 干什么、什么时候用"
---
```

**description 是最重要的字段。** AI 靠它决定要不要加载你。写砸了的典型："一个有用的工具 skill"——这种描述 AI 永远不会调。写对的典型："调用 Jev 决策模型做结构化判断，用于消息分流、批量打分等高频判断场景"——场景越具体，被想起的概率越高。

## 动手：15 分钟写一个最小可用 skill

拿我今天刚建的 `video-director` 举例，它解决的问题是：让 AI 当视频编导，而不是当传话筒。

第一步，建目录和文件：

```bash
mkdir -p ~/workspace/skills/video-director
```

第二步，写 `SKILL.md`。我的结构固定四段，屡试不爽：

1. **职责**：这个 skill 是谁，管什么不管什么
2. **工作流**：分几步，每步干什么
3. **已知坑与对策**：表格，左边坑右边解法——这是 skill 里最值钱的部分
4. **派单模板**：如果要把活派给 subagent，brief 怎么写

`video-director` 的"已知坑"长这样（都是今天真实踩的）：

| 坑 | 对策 |
|---|---|
| 结尾人物停下来摆姿势（AI 通病） | 提示里写"结尾仍在动作中，不要停下来" |
| 多人物长得一样 | 提示中明确体型/服装/发型差异 |
| 续拍穿帮 | 开拍前列连续性清单：场景、人物、衣着、光影、动作衔接 |

第三步，起个好名字。名字就是调用时的暗号，要短、好记、见名知意。`video-director` 比 `my-video-helper-v2-final` 强一百倍。

写完就能用了，不需要编译不需要注册。AI 读到 `description` 对上当前任务，就会自动加载全文。

## 从一个 skill 到资产库

一个 skill 是工具，十个 skill 就是资产。我的做法：

- 本地 `~/workspace/skills/<name>/` 是工作区，改完就同步
- GitHub 公开仓库是资产库，所有 AI 共用，不只服务某一个客户端
- 配一个机器可读的 `skills.json` 索引：名字、描述、路径、入口文件，其他 agent 不用读全文就能挑

![skill 资产库工作流](/img/ai-skill-workflow.svg)

这套东西最大的好处是**跨 agent 复用**。我在 Muse 里攒的 skill，换到 Codex、Hermes 上照样能用，因为载体就是 Markdown，没有私有格式。caveman 能 viral 也是这个道理：skill 是现在 AI 圈子里流通性最强的知识形态。

## 三个坑，别踩

**第一，secret 写进 skill。** API key、token 永远不要出现在 `SKILL.md` 里。我的做法是只写"凭证已存，用某某方式调用"，具体值走系统的凭证库。skill 是要公开分享的东西，写进去就等于发出去了。

**第二，description 写成正确的废话。** "提高效率的实用 skill"——这种话 AI 看了等于没看。改成"什么时候用、解决什么问题"，比如"视频编导：把用户一句话需求拆成可执行方案，用于做视频、短片的场景"。

**第三，一上来就想写大而全的。** skill 越小越好用，一个 skill 只干一件事。我最早写的几个 skill 都犯过这个毛病，一个文件里塞了三种场景，最后 AI 每次都只用其中一段。拆开之后调用率明显上去了。

## 我的判断

skill 这波热度不是泡沫。它解决的是 AI 落地最疼的一环：**人的经验怎么沉淀下来、传给 AI。** 以前靠口口相传的"这个任务要这么干"，现在可以写成文件、放进仓库、被所有 agent 调用。会写 skill 的人，相当于在给 AI 写"操作手册"，这个能力未来两年的溢价只会越来越高。

下一篇准备写《给 AI 省 token 的实战技巧》，对标 caveman 那个 65%。想看的可以留言。

---

*配图说明：封面与插图均为手写 SVG，透明背景。*
