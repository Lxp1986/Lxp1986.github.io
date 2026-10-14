---
title: GitHub 周榜又一轮：测试、画图、建模，三个交给 agent 的开源工具
date: 2026-10-13 23:30:00
updated: 2026-10-13 23:30:00
permalink: posts/2026/10/13/github-agent-tools-test-diagram-cad/
categories:
  - AI工具
tags:
  - AI Agent
  - GitHub Trending
  - 开源项目
  - Agent Skill
description: 这周 GitHub 周榜上另外三个给 agent 用的开源项目：e2e 让 agent 跑端到端测试，diagram-design 让 agent 画像样的图，text-to-cad 让 agent 出 3D 模型。许可、功能和装法对照官方仓库核到 2026-10-14。
cover: /img/github-agent-tools-oct13-cover.png
---

![三个项目对应 agent 的三类产出：测试、图表、模型](/img/github-agent-tools-oct13-cover.png)

上周写过周榜上三个给 agent 补短板的项目。这周榜单还在，又冒出另外三个，方向不一样：不是管 agent 怎么想，是管它能交出什么东西。

一个跑测试，一个画图，一个出 3D 模型。

数字来自各仓库页面和 GitHub Trending 周榜，2026 年 10 月 14 日上午核对，会变。核对时这三个在周榜上分别排第 3、第 10、第 8。

## 一、tester-army/e2e：用一句话写端到端测试

e2e 是一个给 Web 和移动端 App 用的端到端测试框架，Apache-2.0 协议，总星数一万出头，这周涨了四千多。

写法是这样的：测试里用自然语言描述目标，比如「把工作区升级到 Pro」，agent 去操作 App 达成它；同一个测试里，再用常规的定位器和断言检查结果。

README 里有一点比较实在：agent 步骤被后面的断言验证过之后，会把动作录下来，下一次运行直接回放，不调模型，直到 App 变了为止。没有 agent 步骤的测试完全不需要模型。模型可以用自己的订阅、API key 或本地模型。

Web 端走 Playwright，支持 Chromium、Firefox、WebKit；移动端跑 iOS 模拟器和 Android 模拟器。仓库 `examples/` 里有 Vite、Next.js、Astro、Expo、SwiftUI、Jetpack Compose、Kotlin Multiplatform、Flutter 的完整示例。

起步一条命令：

```bash
npx e2e init
```

两点要知道：CLI 默认发匿名使用数据（不含测试内容和凭据），可以用 `npx e2e telemetry disable` 关掉；项目还在 1.0 之前，README 明说小版本之间 API 和配置可能变。

## 二、diagram-design：让 agent 画的图别那么丑

![agent 输出图表的示意：一份 HTML 里装着 SVG 图](/img/github-agent-tools-oct13-diagram.png)

agent 画图，常见结果是一张默认样式的 Mermaid，能看，但不好看。

diagram-design 是一个 agent skill，MIT 协议，总星数五万多，这周涨了近一万，是这三个里涨得最快的。它让 agent 把图画成一个自包含的 HTML + SVG 文件，双击就能打开。README 写的是 45 种图表类型，口号是「No shadows. No Mermaid slop.」。

用法就是直接跟 agent 说人话：画一张前端、后端、数据库、Redis 缓存的架构图；画一个按影响和投入分的四象限。agent 选类型、先说计划，再写文件。

还有一个「onboard」用法：给它一个网址，它去抓这个站的配色和字体，之后画的图都按这个风格来。README 里也提到可以从 draw.io、Mermaid、Excalidraw 导入，导出 PNG / SVG。

装法：

```bash
npx skills add cathrynlavery/diagram-design
```

Cursor、Claude Code、Codex、GitHub Copilot、Gemini CLI 这些读 Agent Skills 的工具都能用。README 特别提醒：官方版本只从这个仓库出，别处同名的列表是非官方拷贝。

## 三、text-to-cad：让 agent 出 3D 模型

![agent 生成 3D 模型的示意：从文字到零件到文件](/img/github-agent-tools-oct13-cad.png)

text-to-cad 是一个 agent 插件，MIT 协议，总星数快两万，这周涨了两千多。

它给 agent 一套本地流程，生成 STEP、GLB、STL、3MF 格式的 3D 模型；还能做可制造性检查、出工程图，并对接 3D 打印、钣金、CNC 加工服务。底层是 build123d 和 Open CASCADE，靠 uv 跑 Python。

README 列的支持对象有 Claude Code、Codex、Cursor、Gemini、Grok，以及其他支持 skills 框架的 agent。推荐装法是直接让 agent 自己装：

```text
Install text-to-cad from https://github.com/earthtojake/text-to-cad
```

自己装的话，先确认装了 uv，再按 README 里各 App 的命令来。首次启动要下载 CAD 运行时，需要联网。README 提醒：插件和单独的 skills 二选一，别都装，不然每个 skill 出现两遍。

它默认也发使用统计和崩溃报告（不含文件、路径和提示词），`uvx cadgen telemetry off` 可以关。

## 三个放一起

e2e 管「做出来的东西对不对」，diagram-design 管「讲清楚的图好不好看」，text-to-cad 管「能不能变成实物文件」。

共同点是都把 agent 当成干活的人，给它工具，而不是再包一层聊天界面。另一个共同点：e2e 和 text-to-cad 默认都开着遥测，装之前可以看一眼文档，决定要不要关。

都还在快速迭代，装之前以各仓库 README 为准。

仓库地址：

- e2e：https://github.com/tester-army/e2e
- diagram-design：https://github.com/cathrynlavery/diagram-design
- text-to-cad：https://github.com/earthtojake/text-to-cad
