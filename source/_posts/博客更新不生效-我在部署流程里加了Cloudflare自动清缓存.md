---
title: 博客更新不生效，我在部署流程里加了 Cloudflare 自动清缓存
date: 2026-08-26 22:30:00
categories: [开发与运维]
tags: [Cloudflare, CDN, GitHub Actions, Hexo, 缓存, 教程]
description: 博客套 Cloudflare CDN 后发文章不生效的坑：默认不缓存 HTML，缓存了就得手动清。建一个最小权限 API Token，在 GitHub Actions 部署流程末尾加一步 purge_cache，以后 git push 完缓存自动清。
---

博客是 Hexo 压 GitHub Pages，前面套了层 Cloudflare CDN。有段时间发完文章，手机刷半天还是旧页面，一度以为 Actions 部署挂了，打开日志一看，构建、部署都成功了，就是页面不更新。

后来才搞明白：Cloudflare 默认根本不缓存 HTML（官方文档原话：the CDN does not cache HTML or JSON by default）。我当时为了提速，照着教程给博客加了「缓存 HTML」的规则——静态博客嘛，HTML 全站缓存，回源压力小，打开快。代价就是：文章页 URL 永远不变，边缘节点一直把旧 HTML 甩给访客。

手动解法很简单：Cloudflare 后台 → Caching → Purge Everything，一键全清，立竿见影。但每次发文章都进后台点一下，发得勤就烦了。干脆把清缓存写进部署流程。

![发布流程](https://www.lxpyll.top/img/cf-auto-purge-flow.svg)

## 思路

git push 之后，Actions 依次干三件事：构建 → 部署到 gh-pages → 调 Cloudflare API 把缓存清了。全程不用管。

## 1. 建 API Token（最小权限）

后台右上角头像 → My Profile → API Tokens → Create Token。权限按最小来：

- Zone → Cache Purge → Purge
- Zone Resources 限定自己的域名（lxpyll.top）

别用 Global API Key，那个权限是整个账号。建完先验证一下：

```bash
curl "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CF_API_TOKEN"
```

返回 `"status": "active"` 就说明 token 没问题。

## 2. 拿 Zone ID

域名 Overview 页面右侧就有 Zone ID，复制下来。不想翻页面就用 API 查：

```bash
curl "https://api.cloudflare.com/client/v4/zones?per_page=50" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq -r '.result[] | "\(.id) \(.name)"'
```

## 3. 仓库加两个 Secrets

GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret：

- `CF_API_TOKEN`：刚建的 token
- `CF_ZONE_ID`：Zone ID

## 4. 部署流程末尾加一步

在 `.github/workflows/deploy.yml` 的 Deploy to gh-pages 步骤后面加：

```yaml
      - name: Purge Cloudflare cache
        env:
          CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
          CF_ZONE_ID: ${{ secrets.CF_ZONE_ID }}
        run: |
          curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
            -H "Authorization: Bearer $CF_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything": true}'
```

网上有现成的第三方 action 干这事，但本质就是调这个接口，curl 三行搞定，少引一个依赖。想精确一点可以清指定 URL，`files` 参数传数组，一次最多 30 条、每分钟限额 1000 条——博客这种全站刷新更省事，`purge_everything` 一了百了，静态站回源那点流量可以忽略，免费版也能用。

## 验证

push 一次，看 Actions 日志里这步返回 `"success": true`，然后手机浏览器打开新文章，能看到了就成。以后写文章就是 git push 一件事，剩下的 Actions 自己干完。

几个坑记一下：

1. token 权限给最小，就算泄露了，最坏情况就是被人清缓存，不伤别的。
2. 排查这类问题先看响应头：`curl -I https://www.lxpyll.top/`，`cf-cache-status: HIT` 说明是 CF 缓存在作怪；不是的话再查浏览器缓存、GitHub Pages 那层。
3. 不想全站缓存 HTML 的话，也可以在 Cache Rules 里给 HTML 单独设个短 TTL（比如 10 分钟），但部署后 purge 更干脆，我现在一直用这个方案。
