---
title: 我的博客发布是一条 git push：GitHub Actions 自动部署 Hexo 流水线
date: 2026-09-04 22:30:00
categories:
  - 博客折腾
tags:
  - Hexo
  - GitHub Actions
  - 博客部署
  - 自动化
description: 把 Hexo 博客部署从本地 hexo d 改成 GitHub Actions 自动流水线后，发布就只剩 git push 一件事。这篇拆解 deploy.yml 每个关键配置和踩过的坑。
---

这篇博客现在是怎么发出去的？我在 `source/_posts/` 里放一个 md 文件，`git push origin main`，然后就没了——剩下的构建、部署全是 GitHub Actions 干的。

以前不是这样。最早我用 `hexo-deployer-git`，每次发布要在本地敲三行：`hexo clean && hexo generate && hexo d`，而且 `hexo d` 要往配置里塞一个带 token 的仓库地址。token 半年过期一次，过期就报 401，换电脑还要重新配。文章没写几篇，部署的坑倒是踩了一堆。后来把部署整个挪进 GitHub Actions，这些事一件都不剩了。这篇把流水线文件拆开讲，配置可以直接抄。

## 流水线文件长这样

仓库根目录建 `.github/workflows/deploy.yml`，这就是我的全部部署逻辑：

```yaml
name: Deploy Hexo

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build site
        run: npx hexo clean && npx hexo generate

      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
          publish_branch: gh-pages
          force_orphan: true
```

工作流大概是这么个走向：

![](/img/blog-deploy-flow.svg)

## 每个配置是干嘛的

**`on.push.branches: main` + `workflow_dispatch`**。前者是推 main 自动触发，后者是给 Actions 页面加一个"Run workflow"按钮——改主题、改配置这种不想制造假提交的情况，点一下按钮手动跑一次。

**`permissions: contents: write`**。这行不加，新版 runner 的 `GITHUB_TOKEN` 默认只读，最后一步 peaceiris 往 gh-pages 推东西会直接 403。仓库 Settings → Actions → General 里的 Workflow permissions 也可以设成读写，但更推荐在 yml 里显式声明，跟流水线放一起，别人看文件就明白权限边界。

**`npm ci` 而不是 `npm install`**。`npm ci` 按 `package-lock.json` 精确装依赖，装之前还会清空 node_modules，结果可复现；前提是 `package-lock.json` 要提交进仓库。比 install 快，还不会出现"本地能跑 Actions 挂了"的版本漂移。

**peaceiris/actions-gh-pages@v4** 是 GitHub Pages 部署的事实标准 action。`publish_dir: ./public` 是 hexo generate 的输出目录，`publish_branch: gh-pages` 是发布目标分支，`force_orphan: true` 表示每次用一条孤儿提交重建 gh-pages——分支历史永远只有一版，不会越积越厚。

## 几个真实的坑

**CNAME 要放 `source/` 下，不是仓库根。** 自定义域名靠 gh-pages 分支里的 CNAME 文件撑着，而那个分支的内容就是 `public/`。hexo 只会把 `source/` 下的文件复制进 `public/`，所以你仓库根的 CNAME 写得再对也没用——generate 根本不会带它。我仓库里两个 CNAME 都提交过，真正起作用的是 `source/CNAME` 这个。不信你删了它部署一次，Pages 设置里的自定义域名会掉，域名直接打不开。

**不用建 Personal Access Token。** 流水线里用的是 `${{ secrets.GITHUB_TOKEN }}`，每次运行 GitHub 自动生成，跑完作废，不用去 Settings 里手动塞任何 secret。我最早看教程自己建了个 PAT 放 secrets 里，纯属多余。

**`.gitignore` 要忽略 `public/` 和 `node_modules/`。** 这两个目录都是构建产物，一旦误提交进 main，每次构建结果和源码混在一起，push 还会越来越慢。我的忽略列表里还有 `db.json`（hexo 的本地数据库）和 `.deploy*/`。

## 这套东西省了什么

发布从"记得三条命令 + token 没过期"变成"一条 push"。省到极致之后，连人都可以不在了——我现在的文章有一部分是定时任务代写的，脚本写完 md 直接 commit、push，流水线自动上线，全程没人碰部署命令。机器写文章这事先不说好坏，但发布环节确实做到了零干预。
