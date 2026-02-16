# Lxp1986 Blog (Hexo)

这是一个基于 **Hexo + Butterfly** 的个人博客。

## 本地运行

```bash
npm install
npm run server
```

默认访问：`http://localhost:4000`

## 常用命令

```bash
npm run clean
npm run build
npm run server
```

## 自动部署（GitHub Actions）

仓库已包含工作流：`.github/workflows/deploy.yml`

- 推送到 `main` 后自动构建
- 构建产物发布到 `gh-pages` 分支

## GitHub Pages 设置

在仓库 `Settings -> Pages` 中设置：

- Source: `Deploy from a branch`
- Branch: `gh-pages` / `/ (root)`

当前自定义域名：`https://www.lxpyll.top/`（由 `source/CNAME` 管理）。

## 评论与留言（免注册）

已接入 `Waline`，访客无需注册即可直接评论。

- 文章页：可直接评论
- 留言板：`/message/`

当前默认使用公开示例服务地址，仅用于快速可用。  
建议后续部署你自己的 Waline 服务，并替换 `_config.butterfly.yml` 中的 `waline.serverURL`。
