---
title: DeepSeek Harness 系列｜部署教程：本机、Docker、服务器三步走，多 Provider 一次配齐
date: 2026-08-16 23:00:00
permalink: posts/2026/08/16/deepseek-harness-deploy/
categories:
  - 技术
tags:
  - DeepSeek
  - AI Agent
  - 部署
  - Docker
  - 教程
  - 效率工具
description: 本篇是《DeepSeek Harness 系列》第二篇。从零部署 DeepSeek Harness：本机 npx 5 分钟跑通、Docker 容器化、VPS 服务器 systemd + Nginx 常驻，再配齐 DeepSeek / OpenAI / Anthropic / Azure / 自定义 OpenAI 兼容端点等多 Provider。命令逐条可复制，含启动验证三连与常见报错排查。
cover: /img/dsh-deploy.svg
---

> 这是《DeepSeek Harness 系列》第二篇。上一篇《[DeepSeek Harness 深度解读](/posts/2026/08/16/deepseek-harness-guide/)》讲了它是什么、为什么火、架构怎么设计的；这一篇直接动手：**从零把它跑起来**。

DeepSeek Harness（`dsh`）截至 2026-08-16 22:50 查询，GitHub 已到 127,528 星（比首篇发布时又涨了两千），npm 包 `@deepseek-ai/dsh` 版本 0.1.0-rc.6。本文覆盖三条部署路径 + 多 Provider 配置，所有命令均可在终端逐条复制。

![DeepSeek Harness 部署拓扑：三条路径 + 多 Provider](/img/dsh-deploy.svg)

## 〇、先定环境：Node.js 就够了

官方对运行环境的要求只有 **Node.js**。源码仓库的 `package.json` 声明 `engines: node ^22.19.0 || >=24.0.0`，所以：

- 本机 / 服务器：装 **Node.js 22 LTS（≥22.19）或 24**，npm 随附；
- 从源码跑需要 **pnpm**（仓库用 pnpm 11.x 管理）；
- 安装版（npm 包）**不需要 pnpm**——只有用 `dsh plugin` 装第三方插件时才要求 pnpm 在 PATH 上（后面会讲到）。

检查版本：

```bash
node --version   # 期望 v22.19.0+ 或 v24.x
npm --version
```

## 一、路径一：本机 5 分钟跑通（推荐先做这个）

### 1.1 启动 Web UI

```bash
npx @deepseek-ai/dsh web
```

首次运行会自动初始化 `web` profile（由 `@deepseek-ai/dsh-base` + `@deepseek-ai/dsh-web-app` 两个内置组合包构成），然后启动服务，默认地址 `http://127.0.0.1:3080`。`dsh web` 是 `dsh --profile web` 的硬编码别名。

### 1.2 四个必做步骤

1. 浏览器打开 `http://127.0.0.1:3080`；
2. **Settings → Models**：DeepSeek 卡片里填入 API Key 并保存。密钥**只写不读回**（页面永远收不到明文回显），明文存在 `$DSH_HOME/.credentials.yaml`。**无需重启服务**，下一次请求即生效；
3. **Choose workspace**：把启动 `dsh` 时所在的项目目录（或任意想让它干活的工作目录）添加并选中——不选工作区，会话输入框是不可用的；
4. 新建会话，发个任务试试：`总结这个仓库的结构，并识别主要包`。

> `$DSH_HOME` 默认是 `~/.dsh`，没设置过就不用管。里面放的是：`.credentials.yaml`（凭据）、`settings.yaml`（高级配置）、`profiles/`（各 profile 目录）、`cordis.patch.yml`（机器级配置覆盖）、`.env`（环境变量文件）。

### 1.3 启动验证三连（任何部署方式通用）

```bash
# ① 配置树体检：打印生效的插件组合，每一层标注来源文件
dsh --profile web --dump-config

# ② 无头冒烟：跑一个一次性任务，完成打印结果即退出，不占端口
dsh --profile headless "用一句话介绍你自己"

# ③ 页面可达
curl -I http://127.0.0.1:3080
```

`--dump-config` 打印的任何条目都可以用你自己的 patch 覆盖——这是"没有特权内核"的直观体现。headless 任务的退出码有讲究：任务以 `completed` 结束返回 **0**，否则返回 **1**，脚本里可以直接 `if dsh --profile headless "..." ; then ...`。

### 1.4 想换端口 / 绑 host？

```bash
dsh web --port 8080 --host 127.0.0.1
```

**注意一个官方文档明说的设计**：CLI 有意不支持 `--host 0.0.0.0`，传了会直接以用法错误退出。服务默认只绑回环地址，远程访问请走反向代理或隧道（见路径三），这是刻意的安全设计，不是 bug。

## 二、路径二：Docker 容器化（隔离环境 / CI 用）

### 2.1 先说结论：官方目前没有 Docker 镜像

我查了仓库完整文件树（截至 2026-08-16）：**没有 Dockerfile、没有 compose 文件**。所以容器化是社区自建方案，本文给一个最小可用模板，标注清楚哪些是官方行为、哪些是社区实践。

### 2.2 最小 Dockerfile

```dockerfile
FROM node:22-slim

# 安装 dsh 本体 + 启用 corepack（装第三方插件时 dsh plugin 会转发给 pnpm）
RUN npm install -g @deepseek-ai/dsh && corepack enable

WORKDIR /workspace
ENV DSH_HOME=/root/.dsh
VOLUME /root/.dsh

# 关键：dsh 只监听 127.0.0.1，容器内用 3081，把 3080 留给反代
EXPOSE 3080
CMD ["dsh", "web", "--port", "3081"]
```

配套一个同容器 Nginx 把 `0.0.0.0:3080` 反代到 `127.0.0.1:3081`（也可以只写一个入口脚本用 `socat` 转发，二选一即可）：

```nginx
server {
    listen 0.0.0.0:3080;
    location / {
        proxy_pass http://127.0.0.1:3081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

构建与启动：

```bash
docker build -t dsh .
docker run -d --name dsh \
  -p 3080:3080 \
  -v dsh-home:/root/.dsh \
  -e DEEPSEEK_API_KEY=sk-你的Key \
  dsh
```

> 为什么这么绕？因为 `--host 0.0.0.0` 被有意禁用，而 Docker 端口映射（`-p`）是转发到容器网卡而不是容器回环地址——直接 `-p 3080:3080` 配 `dsh web` 会连不上。容器内反代是干净解。**如果只是本机自用，别用 Docker，直接 npx 最省事**；Docker 的价值在 CI、多版本隔离、或"用完即弃"的沙箱（配合 SDK 的 `danger-full-access` 预设，见系列第三篇）。

数据卷挂 `$DSH_HOME` 后，凭据和会话日志都在卷里，容器重建不丢。API Key 走 `-e` 环境变量注入，不要写进镜像。

## 三、路径三：VPS / 云服务器常驻（systemd + Nginx）

适合想 7×24 挂着、多人/多设备访问的场景。

### 3.1 建用户、装 Node、装 dsh

```bash
# 以 root 或 sudo 执行
useradd -m -s /bin/bash dsh
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs nginx
npm install -g @deepseek-ai/dsh
```

### 3.2 systemd 服务单元

```ini
# /etc/systemd/system/dsh.service
[Unit]
Description=DeepSeek Harness Web UI
After=network-online.target
Wants=network-online.target

[Service]
User=dsh
Group=dsh
WorkingDirectory=/home/dsh/workspace
Environment=DSH_HOME=/home/dsh/.dsh
EnvironmentFile=/etc/dsh.env
# 默认 workspace-write 权限即可；要更宽再改 DSH_PERMISSION_MODE
# Environment=DSH_PERMISSION_MODE=danger-full-access
# 工具模式：native / code / both
# Environment=DSH_TOOLS_MODE=both
ExecStart=/usr/bin/dsh web --port 3080
Restart=on-failure
RestartSec=5
# 优雅关闭：SIGTERM 会以 0 退出，二次信号才强杀
KillSignal=SIGTERM
TimeoutStopSec=10

[Install]
WantedBy=multi-user.target
```

密钥放 `/etc/dsh.env`（权限 600），不写进单元文件：

```bash
# /etc/dsh.env —— 属主 root:dsh，权限 600
DEEPSEEK_API_KEY=sk-你的Key
# 走 OpenAI 兼容代理时：
# DEEPSEEK_BASE_URL=https://你的网关/v1
# DSH_MODEL=deepseek-v4-flash
```

启动并验证：

```bash
chown root:dsh /etc/dsh.env && chmod 600 /etc/dsh.env
systemctl daemon-reload
systemctl enable --now dsh
systemctl status dsh
curl -I http://127.0.0.1:3080
```

### 3.3 Nginx 反代 + HTTPS

`dsh` 绑 127.0.0.1，Nginx 在同机终结 TLS 后转给它：

```nginx
# /etc/nginx/sites-available/dsh
server {
    listen 443 ssl http2;
    server_name dsh.你的域名.com;

    ssl_certificate     /etc/letsencrypt/live/dsh.你的域名.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dsh.你的域名.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

证书用 certbot 一条命令签发。**还有一个 Web UI 专属参数值得加**：`--trusted-host`（可重复）把域名加进 `/api` 的浏览器信任围栏：

```ini
ExecStart=/usr/bin/dsh web --port 3080 --trusted-host https://dsh.你的域名.com
```

### 3.4 不想暴露公网？SSH 隧道即可

```bash
# 本地执行，把服务器的 3080 隧道到本地 3080
ssh -N -L 3080:127.0.0.1:3080 user@你的VPS
```

浏览器开 `http://127.0.0.1:3080` 就是服务器上的 Harness。零公网暴露、零 TLS 配置，个人自用最推荐。

### 3.5 服务器上的安全清单

1. **凭据最小化**：`/etc/dsh.env` 权限 600，属主 root 或专用用户；`.credentials.yaml` 同样只给 dsh 用户读；
2. **权限预设**：新会话默认 `workspace-write`（Bash 和文件系统修改仅限会话工作区与临时目录，读取和网络不受限），够用就别放宽；
3. **遥测默认关闭**：官方默认不导出遥测（`DSH_TELEMETRY_MODE` 未设置即本地保留）；万一环境里有 `DSH_TELEMETRY_MODE=FULL` 之类的旧设置，用 `DSH_TELEMETRY_DISABLED=1` 一票否决；
4. **备份 `$DSH_HOME`**：会话日志、凭据、配置都在这里，`rsync` 到备份盘即可；
5. **`--dump-config` 体检**：每次升级 npm 包后跑一遍，确认组合树没有意外变化。

## 四、多 Provider 配置：DeepSeek 之外都能接

Harness 的模型提供方是可插拔的（"一切皆插件"的直接体现）。两种方式：

### 4.1 Web UI 图形化配置（推荐新手）

**设置 → 模型**页有三个入口：

| 入口 | 用途 | 配置要点 |
|---|---|---|
| DeepSeek 卡片 | 官方端点 | 只填 API Key |
| **添加提供方** | 目录提供方 | 选 Anthropic / OpenAI / Azure / Bedrock / Vertex / Codex，填各自凭据 |
| **添加自定义提供方** | 任意 OpenAI 兼容端点 | 公司网关、自托管 vLLM/Ollama 代理等 |

原生认证的提供方需要各自的**原生凭据**，光填 API Key 不行：Azure 要 `api-version`，Bedrock 要 AWS 凭据 + 区域，Vertex 要 ADC 项目，Codex 走 OAuth。

自定义提供方表单里，**Provider ID 必须是小写**，而且它是**永久**的——请求、已保存会话、模型默认值、凭据引用都引用它。想改名只能新建 + 删旧。填完点**获取可用模型**（会调 OpenAI 兼容的 `GET /models`），选中的模型会更新草稿，保存才生效。

### 4.2 手写 `settings.yaml`（适合脚本化/版本管理）

所有图形化配置最终都落在 `$DSH_HOME/settings.yaml`。下面这个例子同时配了：官方 DeepSeek 路由、一个带 API Key 环境变量的 OpenAI 兼容网关、以及给视觉模型声明图片输入：

```yaml
llm-pi-ai:
  providers:
    deepseek-official:
      api: deepseek-chat          # 官方适配器
      apiKeyEnv: DEEPSEEK_API_KEY
      models:
        - id: deepseek-v4-pro
        - id: deepseek-v4-flash
    my-gateway:                    # 自定义 OpenAI 兼容端点
      apiKeyEnv: GATEWAY_API_KEY
      api: openai-completions
      baseURL: https://gateway.example.com/v1
      models:
        - id: legacy-chat
        - id: vision-preview
          input: [text, image]     # 关键：自定义视觉模型必须显式声明图片模态
```

两个易踩的配置细节（官方文档原话）：

1. **图片模态要声明**：手动录入的模型默认按纯文本对待，`input: [text, image]` 只作用于该模型；整条路由都吃图的用 `defaultInput: [text, image]` 做回退值；
2. **凭据解析顺序**（CLI 文档）：继承环境 → `$DSH_HOME/.credentials.yaml` → 调用目录的 `.env` → `$DSH_HOME/.env`。所以"填了 Key 却报 `MISSING_CREDENTIAL`"，八成是 Key 写在了错误的位置。

### 4.3 Provider 排错速查

| 报错 | 含义 | 处理 |
|---|---|---|
| `MISSING_CREDENTIAL` | 找不到凭据 | 模型页存 Key，或补对应环境变量 |
| `UNKNOWN_MODEL` | 模型不在已配置列表 | 选已配置模型，或给自定义提供方补模型 |
| 获取可用模型 401 | Key 不对 | 检查 Key；端点不支持 `GET /models` 就手动输入模型 |
| 图片发送前被拒 | 模型未声明图片模态 | 自定义模型加 `input: [text, image]` |

## 五、升级与卸载

```bash
# 升级（npm 包，保持与源码 engines 一致）
npm install -g @deepseek-ai/dsh@latest

# 从源码升级
cd deepseek-harness && git pull && pnpm install && pnpm run build

# 彻底卸载：删包 + 删配置目录（会丢全部会话与凭据，先备份）
npm uninstall -g @deepseek-ai/dsh
rm -rf ~/.dsh
```

> 开发者预览期的提醒：官方明说"将出现破坏兼容性的变更"，升级前先 `--dump-config` 存档，必要时备份整个 `$DSH_HOME`。

## 六、小结

| 路径 | 适合谁 | 一句话要点 |
|---|---|---|
| 本机 npx | 尝鲜、个人开发 | 一条命令跑通，Key 存 `~/.dsh/.credentials.yaml` |
| Docker | CI、隔离、沙箱 | 官方无镜像；容器内反代 3080→3081，卷挂 `$DSH_HOME` |
| VPS + systemd | 常驻、多人访问 | `--trusted-host` 加域名；SSH 隧道是零暴露的最优解 |

部署完成后，下一步就是让它干活了——系列第三篇《[使用教程](/posts/2026/08/16/deepseek-harness-usage/)》会用"分析代码仓库 / 自动写周报 / 定时巡检"三个真实任务走完整流程（Web UI + headless + Python SDK）。

## 系列导航

- 第 1 篇·深度解读：《[DeepSeek Harness 深度解读：3 天 12.7 万星的开源 Agent 框架，值不值得上车？](/posts/2026/08/16/deepseek-harness-guide/)》
- 第 2 篇·部署教程：本文
- 第 3 篇·使用教程：《[DeepSeek Harness 系列｜使用教程](/posts/2026/08/16/deepseek-harness-usage/)》
- 第 4 篇·横评对比：《[DeepSeek Harness 系列｜横评对比](/posts/2026/08/16/deepseek-harness-compare/)》
- 第 5 篇·进阶技巧与踩坑：《[DeepSeek Harness 系列｜进阶技巧与踩坑](/posts/2026/08/16/deepseek-harness-advanced/)》

## 参考来源（均查询于 2026-08-16）

- GitHub `deepseek-ai/deepseek-harness`：README、`docs/user/guide/providers.md`、`apps/cli/reference/README.md`（CLI 行为参考）、`package.json`（engines）
- npm：`@deepseek-ai/dsh` v0.1.0-rc.6
- 官方文档：模型配置指南、Web UI 指南、Python SDK 快速上手

> 版本与价格变动频繁，以官方最新文档为准。欢迎在评论区分享你的部署踩坑经历。
