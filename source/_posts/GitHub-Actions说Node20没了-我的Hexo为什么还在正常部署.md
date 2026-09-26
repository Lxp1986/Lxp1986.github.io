---
title: GitHub Actions 说 Node 20 没了，我的 Hexo 为什么还在正常部署
date: 2026-09-27 01:00:00
permalink: posts/2026/09/27/github-actions-node20-hexo-deploy/
categories:
  - 博客折腾
tags:
  - GitHub Actions
  - Node.js
  - Hexo
  - GitHub Pages
  - CI/CD
description: GitHub Actions 宣布不再提供 Node 20 运行时，但我的 Hexo 工作流仍然部署成功。问题在于 Actions 运行时和 setup-node 安装的构建 Node 不是同一个东西。
cover: /img/github-actions-node20-hexo.svg
---

先说结论：**GitHub 说的“Node 20 没了”，指的是 GitHub Actions 运行 JavaScript Action 时使用的 Node 版本，不是说工作流里的 `node-version: '20'` 今天就不能用了。**

我的 Hexo 博客工作流里，仍然明确写着 Node 20：

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: npm
```

后面再执行 `npm ci`、`npx hexo clean` 和 `npx hexo generate`。GitHub 在 2026 年 9 月 23 日宣布这次调整后，我刚推送的博客仍然正常构建并发布到了 `gh-pages`。看起来矛盾，其实是把两个不同层次的 Node 混在了一起。

![GitHub Actions 运行时和 Hexo 构建 Node 的区别](/img/github-actions-node20-hexo.svg)

## GitHub 到底把什么换成了 Node 24

GitHub 的原文说得很明确：Actions runner 不再使用 Node 20 来运行 JavaScript Action，runner 现在使用 Node 24；自己维护 JavaScript Action 的人，要把 `runs.using` 更新为 `node24`。

这里的 JavaScript Action，是下面这些由 `uses:` 调进来的动作：

```yaml
uses: actions/checkout@v4
uses: actions/setup-node@v4
uses: peaceiris/actions-gh-pages@v4
```

这些 Action 自己有一层运行环境。GitHub runner 负责把它们启动起来，Node 24 是这一层的运行时。

官方还提醒，使用 JavaScript Action 的工作流应该更新到支持 Node 24 的最新 Action 版本。这个提醒主要针对 Action 的维护者和版本升级，不等于把所有项目的构建工具链强制改成 Node 24。

## `node-version: '20'` 又是什么

`actions/setup-node` 的 `node-version` 是在工作流里准备一套给后续命令使用的 Node 工具链。我的工作流逻辑是：

```text
GitHub runner
  ├─ 用 Node 24 启动 checkout / setup-node / deploy 这些 JavaScript Actions
  └─ setup-node 准备 Node 20
       └─ npm ci → Hexo clean → Hexo generate
```

也就是说，下面两句话可以同时成立：

1. GitHub Actions 的 JavaScript 运行时已经切到 Node 24。
2. Hexo 构建步骤仍然可以使用 Node 20。

这也是为什么我没有看到“Node 20 立刻失效”的报错。工作流里的 `node-version` 和 Action 内部的 `runs.using`，根本不是同一个配置入口。

## 我的博客这次实际跑通了吗

跑通了。仓库最新提交是 `33cc963`，对应的部署运行记录显示：

- `actions/checkout@v4` 成功；
- `actions/setup-node@v4` 成功准备 Node 20；
- `npm ci` 成功；
- Hexo 生成静态文件成功；
- `peaceiris/actions-gh-pages@v4` 成功更新 `gh-pages`。

运行记录可以直接看 GitHub Actions 的公开页面：[Deploy Hexo · run 36167232714](https://github.com/Lxp1986/Lxp1986.github.io/actions/runs/36167232714)。

在本地检查自己的工作流，也不用凭感觉猜：

```bash
rg -n "actions/(checkout|setup-node)|node-version|hexo" .github/workflows
gh run list --workflow deploy.yml --limit 5
```

如果最新运行是 `success`，说明当前工作流至少在 GitHub-hosted runner 上跑通了。这里的“跑通”只证明当前这条工作流成功，不代表以后所有旧版 Action 都永远不用升级。

## 现在要不要把 Node 20 改成 Node 24

我的答案是：**不要因为标题里出现“Node 20 没了”就直接改。**

先把问题拆开：

### 第一层：Action 版本

检查 `actions/checkout`、`actions/setup-node` 和部署 Action 是否有支持 Node 24 的新版本。GitHub 的建议是使用最新版本的 Action；如果升级，先在这个博客仓库里跑一遍完整部署。

### 第二层：Hexo 构建 Node

`node-version: '20'` 是否要改，应该由 Hexo、主题和插件的兼容性决定。改成 22 或 24 以后，要重新跑：

```bash
npm ci
npx hexo clean
npx hexo generate
```

只要没有做过这组验证，就不要把“Action 运行时升级”顺手扩大成“项目构建 Node 也升级”。构建工具链升级失败时，报错往往会落在原本无关的主题插件、原生依赖或锁文件上。

### 第三层：自托管 runner

这次公告还有一个容易被忽略的边界：Node 24 不兼容 macOS 13.4 及更早版本，也不支持 ARM32。我的博客使用的是 `ubuntu-latest`，所以没有碰到这个自托管 runner 问题；如果你自己维护一台旧 Mac 作为 runner，就要单独检查系统版本和架构。

## 这次公告真正值得记住的东西

我觉得这次最值得记住的不是“Node 20 消失了”，而是 GitHub Actions 里至少有三层版本不能混看：

| 层次 | 由谁控制 | 这次是否直接换成 Node 24 |
| --- | --- | --- |
| JavaScript Action 运行时 | GitHub runner / Action 元数据 | 是 |
| `setup-node` 准备的构建 Node | 工作流里的 `node-version` | 不会因为公告自动改变 |
| Hexo、主题和插件兼容性 | 项目依赖与 `package-lock.json` | 需要单独测试 |

所以，我的 Hexo 还能正常部署，并不是 GitHub 的公告失效了，而是公告调整的那一层，和 Hexo 实际用来生成网站的那一层不同。

以后看到 GitHub Actions 的运行时弃用通知，我会先问两个问题：**它改的是 Action 自己的运行时，还是我的构建工具链？** 确认层次以后，再决定要不要改 `node-version`。

## 官方来源

- [Node 20 is no longer available in GitHub Actions](https://github.blog/changelog/2026-09-23-node-20-is-no-longer-available-in-github-actions/)
- [GitHub Actions：使用 JavaScript Action 的版本说明](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#runsusing-for-javascript-actions)
- [三色风博客的部署工作流](https://github.com/Lxp1986/Lxp1986.github.io/blob/main/.github/workflows/deploy.yml)

> 本文核对时间：2026-09-27。GitHub Actions 的 runner、Action 版本和 Node 支持策略会继续变化，文章里的运行记录是当前仓库的一次实测，不是对未来运行结果的保证。
