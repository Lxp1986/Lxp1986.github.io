---
title: GitHub Copilot 会点 macOS 桌面了，我先不敢把工程资料交给它
date: 2026-10-06 10:30:00
permalink: posts/2026/10/06/copilot-computer-use-macos/
categories:
  - AI工具
tags:
  - GitHub Copilot
  - macOS
  - Computer Use
  - AI Agent
description: GitHub Copilot 的 computer use 已进入公开预览，能读屏、点击、输入和拖动。我看完公告有点兴奋，也有点发怵：它碰到工程资料时，我会先怎么试、哪些权限不会随手给。
cover: /img/copilot-computer-use-cover.svg
---

看到 GitHub 说 Copilot 现在能操作桌面，我第一反应是：这下连鼠标都不用我动了。第二反应紧跟着就来了：我桌面上开着的那些 PDF、报价表和聊天窗口，它是不是也看得见？

这个念头让我有点兴奋，也有点发怵。要是它能替我在预览里找页码、把资料从一个窗口挪到另一个窗口，确实省手；可窗口切错、按钮点歪，最后要解释的人还是我。Copilot 不会替我接业主电话。

GitHub 在 2026 年 10 月 1 日把 computer use 放进 GitHub Copilot CLI 和 Copilot 桌面应用的公开预览，支持 macOS 和 Windows。它能读取应用的辅助功能内容，需要看视觉信息时也能读窗口画面，然后点击控件、输入和修改文字、按键、滚动、拖动，在多个应用之间跑流程。官方列的场景包括整理浏览器通知、改演示文稿，以及在没有 API、命令行或 MCP 的旧软件里填资料。([GitHub 公告](https://github.blog/changelog/2026-10-01-github-copilot-can-now-interact-with-desktop-apps/))

![Copilot 的鼠标指针停在 macOS 窗口前，审批按钮还等着人点](/img/copilot-computer-use-cover.svg)

## 它不是“看一眼屏幕”这么简单

我以前把 AI 看屏幕想得比较轻：截张图，问它“这是什么”。computer use 多走了好几步。它可以从屏幕和辅助功能树里读信息，也可以真的点、输入、拖动。换句话说，它不只是在旁边看你操作，有些操作会由它接过去做。

macOS 上还要给辅助功能权限，让它能操作应用控件；需要看窗口画面时，还要给屏幕录制权限。功能默认关闭，企业管理员也可以禁用。Copilot 会遵循当前会话的工具权限设置：有的设置会弹出审批，有的可以预先授权。选择“始终允许”后，应用级批准会保存在本机，并同时适用于 Copilot App 和 CLI。以后你能在 App 里查看或移除已保存的批准。([GitHub 文档：computer use](https://docs.github.com/en/copilot/concepts/agents/computer-use))

这几项权限放在一起，我就没法把它当作普通的聊天功能看了。屏幕里也许有合同、签证单、联系人，甚至一个没关掉的网银页面。你让它整理一个文件，它未必只看到那个文件。

![computer use 读到的屏幕内容、可执行操作和权限控制](/img/copilot-computer-use-capabilities.svg)

## 我会先拿一份无关紧要的 PDF 试

如果这功能在我的 Copilot 客户端里已经能用，我会先复制一份公开的说明书或空白表格，放进单独的测试文件夹。不要拿真实工程资料起步，也别在窗口后面挂着邮箱、微信或云盘。

第一轮只让它做一个能核对的小动作，比如：

```text
请在当前打开的 PDF 里找到“安全注意事项”所在页。
只报告页码和对应标题，不要修改文件，不要打开其他应用。
如果窗口里不是这份 PDF，先停下来问我。
```

找到页码后，我再试第二步：把一段文字复制到测试用的空白文档里。每一步都看它到底读了什么、点了哪里，再决定要不要继续。要是它把窗口切错，或者开始自作主张改内容，我就按 Stop；CLI 可以连按两次 `Esc` 中断。([GitHub computer use 使用说明](https://docs.github.com/en/copilot/concepts/agents/computer-use))

这个试法听起来很谨慎，甚至有点扫兴。但我宁愿先看它在一份没价值的 PDF 上犯什么错，也不想第一次就拿有签字、有姓名的资料替它交学费。

![先复制资料、只留目标窗口、从只读操作开始，最后检查结果](/img/copilot-computer-use-test.svg)

## 哪些地方我会赞成，哪些地方我会踩刹车

碰上只能点界面、没有 API 或命令行的老软件，桌面操作确实有用。工程软件、旧版资料系统、格式古怪的桌面表格，都可能遇到这种“功能在那儿，自动化入口没有”的情况。能把几个重复步骤交给 Agent 跑，挺让人期待。

但只要电脑里有更直接的入口，我还是会先用那个。GitHub 文档也建议：如果 API、MCP、终端、文件工具或专用浏览器工具能完成任务，结构化工具通常更可预测。屏幕上的按钮会变位置，窗口可能被遮挡，控件也可能长得不像普通按钮；GitHub 明确提醒，computer use 可能点错、把字输到错误位置，或者在复杂流程里卡住。([GitHub 文档：限制与风险](https://docs.github.com/en/copilot/concepts/agents/computer-use))

所以我现在的态度是：新鲜，想试；权限，不急着给。尤其“始终允许”这四个字，我会多看两眼。官方说明说，保存的应用批准会落在本机，之后 App 和 CLI 都能复用；如果应用里有敏感信息，或者能执行高影响操作，最好别随手设成始终允许。

这功能可能会很好用，也可能把“点错了”升级成“替我点错了”。我愿意给它一份副本、一个明确目标和一次会话的权限。等它真能稳定做完这类小活，再谈把工程资料交过去。现在就让它常驻操作我的桌面？先别，我还没那么信任它。

## 官方资料

- [GitHub 公告：Copilot 可以操作桌面应用](https://github.blog/changelog/2026-10-01-github-copilot-can-now-interact-with-desktop-apps/)
- [GitHub Docs：About computer use in GitHub Copilot](https://docs.github.com/en/copilot/concepts/agents/computer-use)
