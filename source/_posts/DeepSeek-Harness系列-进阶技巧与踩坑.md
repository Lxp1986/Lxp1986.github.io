---
title: DeepSeek Harness 系列｜进阶技巧与踩坑：调度、Subagent、插件开发与性能优化
date: 2026-08-16 23:30:00
permalink: posts/2026/08/16/deepseek-harness-advanced/
categories:
  - 技术
tags:
  - DeepSeek
  - AI Agent
  - 插件开发
  - 踩坑
  - 性能优化
  - 教程
description: 本篇是《DeepSeek Harness 系列》第五篇（收尾篇）。进阶玩法全在这：schedule 调度插件的全部规则与边界、subagent 六种后端与后台委派、从零开发一个工具插件并打包发布成组合包（bundle）、性能与成本优化，最后是官方 postmortem 和文档里挖出来的 10 个常见坑。
cover: /img/dsh-advanced.svg
---

> 这是《DeepSeek Harness 系列》第五篇，也是收尾篇。前面四篇讲了[深度解读](/posts/2026/08/16/deepseek-harness-guide/)、[部署](/posts/2026/08/16/deepseek-harness-deploy/)、[使用](/posts/2026/08/16/deepseek-harness-usage/)、[横评](/posts/2026/08/16/deepseek-harness-compare/)。这一篇上强度：**调度、subagent、插件开发、性能优化**，以及我从官方 postmortem 和文档里挖出来的 10 个坑。

![Harness 进阶：微内核与扩展点全景](/img/dsh-advanced.svg)

## 一、调度插件：schedule 的完整规则与边界

（基础用法见[第三篇](/posts/2026/08/16/deepseek-harness-usage/)的任务三，这里讲透规则。）

### 1.1 三种规则，都是"记录级"语义

| 规则 | 触发 | 持久化形态 |
|---|---|---|
| `after_seconds` | 延时 N 秒后触发**一次** | 一次性记录，dispatch 即终结 |
| `at` | 绝对时刻触发**一次** | 同上；只存规范化后的 UTC 目标 |
| `every_seconds` | 固定速率重复，**下限 300 秒** | 以创建时刻为锚点对齐，每次 dispatch 推进到下一个锚点 |

创建时每个初始目标都会被规范化为四位年份的 RFC 3339 UTC `scheduledAt`——**回放不依赖环境时区**。

### 1.2 四个容易踩的语义

1. **错过不积压**：会话 cold 或 busy 期间错过多个周期的 every 提醒，只补**最新一次**到期触发，直接推进到下一个锚点；
2. **fork 不继承**：fork 出的子会话保留历史，但**不接管父会话的活动提醒**；
3. **批次合并**：多个 every 提醒同时到期时，合并成**一个** follow-up 批次，各带各的触发时刻；
4. **"至少一次"而非"恰好一次"**：队列准入后、持久化前的崩溃窗口可能让提醒内容重复交付——官方文档明说的边界。

### 1.3 冷启动恢复

关闭进程或会话 cold 会停掉内存计时器，但**记录不删**；重新打开同一个会话会重建 timer，已过期的目标进入 `overdue` 状态并补交付。查看 cold 历史**不会**激活提醒。

## 二、Subagent 深度控制

### 2.1 六个后端，按需选用

subagent 是**能力缝**（seam），同一上下文里可以**共存多个提供方**，按名称注册在 `ctx.subagents`。官方提供六个兄弟包：

| 提供方 | 用途 |
|---|---|
| `dsh-subagent-spawn-in-process` | 进程内子 agent（默认，上下文/会话全共享） |
| `dsh-subagent-spawn-fork` | 派生子进程跑子 agent |
| `dsh-subagent-acp` | 走 ACP（Agent Client Protocol）协议对端 |
| `dsh-subagent-codex` | 直接委派给 Codex CLI 后端 |
| `dsh-subagent-claude-code` | 直接委派给 Claude Code 后端 |
| `dsh-subagent-dsh-sdk` | 委派给另一个 dsh 运行时 |

产品组合默认会为每个后端加载一次工具包，所以模型看到的委派工具不止一个：`subagent`（continuable，**省略参数默认后台跑**）和 `subagent_fork`（one-shot，默认前台跑）。

### 2.2 后台委派三板斧

```text
subagent 工具参数：
- prompt       完整自包含的任务描述（它看不到你的对话上下文）
- run_in_background: true   后台跑，返回 job id
- output_schema / tool_filter / persona / max_depth   可选约束
```

后台任务用通用 `job_*` 三件套管理（来自 `@deepseek-ai/dsh-tool-jobs`，与后台 bash、PTY 发送共用同一套）：

- `job_list` 列出后台任务；
- `job_output` 收集结果；
- 停止任务用 `job_kill`。

### 2.3 全局控制与子级汇报

- `send_message` / `interrupt_agent` / `list_agents`（`@deepseek-ai/dsh-tool-subagent-control`）：给后台 subagent 发消息、打断它、列出所有存活 agent；
- `report`（`@deepseek-ai/dsh-tool-subagent-report`）：**只注册在可继续的进程内子级内部**——子 agent 用它把阶段性结果回报给直接父会话，受工具过滤器保护；
- 能力协商是"**响亮失败**"：请求了后端不支持的能力（如 `outputSchema`、`depthLimit`、`toolFilter`、`persona`），启动时直接报 `UNSUPPORTED_CAPABILITY`，绝不静默忽略。

### 2.4 实战建议

- 委派提示词必须**自包含**：目标、约束、输出格式全部写进去；
- 大仓库分析（见第三篇任务一）用多个后台 subagent 并行 + 主代理汇总，是当前最划算的用法；
- 想控制子 agent 能碰什么，用 `tool_filter`（子级提示词里直接消失 + 拒绝执行，双保险）；想限制委派深度防失控，用 `max_depth`。

## 三、插件开发：从 hello 到发布

### 3.1 最小插件：三行核心

插件就是一个导出 `apply` 函数的 TypeScript 模块（函数/对象/类三种形态，函数最常用）。在源码 checkout 的 `scratch-plugin/src/my-plugin.ts`：

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'hello-plugin'

export function apply(ctx: Context) {
  console.log('[hello-plugin] plugin loaded!')
}
```

注册到 `scratch-plugin/cordis.yml`（**路径必须是绝对路径**），再用 overlay 启动：

```yaml
- insert:
    - id: hello
      name: '/absolute/path/to/deepseek-harness/scratch-plugin/src/my-plugin.ts'
```

```bash
pnpm dsh web --patch ./scratch-plugin/cordis.yml
```

浏览器开 `http://127.0.0.1:3080`，终端会打印 `[hello-plugin] plugin loaded!`。通过 `ctx` 注册的任何东西（事件监听、工具、定时器）在插件卸载时**自动清理**，不用手动 removeListener；有外部资源（网络连接等）用 `ctx.effect()` 声明清理函数。要用别的服务就声明 `inject: ['tools']`，框架保证依赖就绪后才加载你。

### 3.2 开发一个工具：defineTool

```ts
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'greet-tool'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'greet',
    description: 'Greet someone by name.',
    parameters: {
      name: { type: 'string', required: true, description: 'The name to greet' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      return `Hello, ${args.name}!`
    },
  }))
}
```

`defineTool` 按 `parameters` 推导并校验 `args`；`execute` 返回 `output.schema` 声明的规范值，`output.render` 转成面向模型的内容。然后在会话里发：`Use the greet tool to greet Ada.` 模型会调用它并收到结果。

### 3.3 钩子：以权限门禁为例

扩展点（全部是事件监听，**没有任何一行修改循环本身**）：

| 扩展点 | 用途 |
|---|---|
| `tools/pre-execute` | 权限门禁：返回 `{kind:'deny', reason}` 拒绝，或 `next()` 放行；`ask` 走审批 |
| `tools/execute` | 包裹真实分发：超时/重试/指标（只可替换 `exec.signal`） |
| `tools/post-execute` / `tools/result` | 结果变换 / 不可变结果观察与审计 |
| `ctx.tools.guard()` | 需要单调最终拒绝时用 |
| `session/event` | UI 插件渲染（`assistant/chunk` 文本流）+ `followup()`/`steer()` 驱动输入 |
| `system-prompt/assemble` | 系统提示词分段组装 |
| `agent/pre-step` / `agent/request-error` | 自动压缩压力检查 / 溢出恢复 |

一个权限门禁示例（钩子插件，不需要外部协议）：

```ts
import type { Context } from '@deepseek-ai/cordis'
import type { PreToolDecision, ToolExecution } from '@deepseek-ai/dsh-tools'

declare function isAllowed(exec: ToolExecution): Promise<boolean>

export const name = 'permission-gate'

export function apply(ctx: Context) {
  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
    if (!(await isAllowed(exec))) {
      return { kind: 'deny', reason: 'Denied by policy.' }
    }
    return next()
  })
}
```

产品功能 → 插件机制映射（官方文档的对照表，节选）：钩子系统 = `agent/session-start`/`tools/pre-execute` 等监听器（`dsh-hooks-claude-code` / `dsh-hooks-codex` 桥接器还能把 Claude Code / Codex 的 hooks 配置文件映射过来）；MCP = 每服务器一个插件，发现工具 → `ctx.tools.register()`；记忆 = section 提供方 + 工具；上下文压缩 = `ctx.compaction` seam + `dsh-compaction-basic`。

### 3.4 打包发布成组合包（bundle）

本地插件 → 可分发组合包，三个文件：

```
hello-plugin/
├── package.json       # 声明 dsh.bundle
├── cordis.patch.yml   # 组合包贡献的配置层
└── index.js           # 插件本体
```

```json
{
  "name": "dsh-hello-plugin",
  "version": "0.1.0",
  "type": "module",
  "main": "index.js",
  "files": ["index.js", "cordis.patch.yml"],
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
}
```

```yaml
- insert:
    - id: hello
      name: dsh-hello-plugin
```

安装进 profile（`dsh plugin` 在 profile 目录里转发给 pnpm，所以 **pnpm 必须在 PATH 上**）：

```bash
dsh plugin --profile demo add ./hello-plugin
dsh --profile demo --dump-config   # 能看到 "# == dsh-hello-plugin" 层
dsh --profile demo
```

验证无误后，两种分发方式：**发布到 npm**（`pnpm publish`，用户 `dsh plugin add dsh-hello-plugin`），或 **`pnpm pack` 交付 tarball**（用户 `dsh plugin add ./dsh-hello-plugin-0.1.0.tgz`）。发布后给仓库加 `dsh-plugin` 话题（GitHub Topics），官方文档指定的发现渠道。

## 四、性能与成本优化

1. **空闲时段调度**（最立竿见影）：DeepSeek API 8·17 起峰谷定价，空闲 17 小时半价。批量任务、巡检、渲染全部排到空闲段，成本直接砍半（账本细节见[第一篇](/posts/2026/08/16/deepseek-harness-guide/)）；
2. **`DSH_TOOLS_MODE=code`**：让模型写 TypeScript 编排多步流程，比一步步调工具省 token；`minimal` agent preset（只有持久 bash + `str_replace_editor`）用于最小化验证，省上下文；
3. **上下文压缩**：`dsh-compaction-basic` 在 `agent/pre-step` 自动做压力检查，溢出恢复走 `agent/request-error`——长会话不手动清理也能续命；`str_replace_editor` 输出上限 16,000 字符，防止工具结果撑爆上下文；
4. **subagent 并行**：大任务拆给多个后台 subagent，总耗时和单会话上下文双降；
5. **遥测关掉**：默认本就本地保留，环境里显式 `DSH_TELEMETRY_DISABLED=1` 一票否决，避免任何意外外传（官方默认无脱敏规则，误开 FULL 可能导出消息文本和 workspace 路径）；
6. **权限够用就好**：`workspace-write` 是默认，别为省事开 `danger-full-access`——后者只该出现在可丢弃的容器里（Python SDK 示例就是这么用的）；
7. **headless 不占端口**：一次性任务用 headless，别为跑个脚本挂 Web 服务。

## 五、踩坑清单（官方 postmortem + 文档实证）

### 坑 1：`!!js` 表达式只在插件 `config` 内求值

官方 postmortem 0002 实录：有人试图用 `disabled: !!js ...` 条件式启用文件系统插件，结果 Cordis 只对插件 `config` 内部求值表达式，`disabled` 元数据直接拿 truthy 对象，导致**文件系统栈在所有模式下永久禁用**，而且 YAML 语法合法、加载过程零报错。教训：**条件式组合要用显式 overlay（patch 文件），别在配置元数据里玩表达式**。

### 坑 2：`--host 0.0.0.0` 是被有意禁用的

CLI 参考文档原文：CLI 目前有意不支持 `--host 0.0.0.0`，会以用法错误退出。想远程访问：Nginx 反代（`proxy_pass 127.0.0.1:3080`）+ `--trusted-host` 加域名，或 SSH 隧道。**别浪费时间找"让它绑 0.0.0.0 的办法"，方向就错了。**

### 坑 3：从 GitHub 装插件，pnpm ≥10 默认拒绝构建脚本

`dsh plugin --profile demo add github:you/hello-plugin` 第一次必失败，报 pnpm 的 `allowBuilds` 提示。修法：把 pnpm 打印的确切包键复制进该 profile 的 `pnpm-workspace.yaml`：

```yaml
allowBuilds:
  dsh-hello-plugin: true
```

然后重跑 `add`。**这是让该包代码在你机器上执行**（且不在 agent 沙箱内）——只对源码可信的包授权，并锁定 commit（`github:you/hello-plugin#<sha>`）。不想让用户做这个授权的，就发 npm 包或 tarball（预构建产物，不需要构建权限）。

### 坑 4：schedule 没有 Cron、没有外部通知

只有 after / at / every（下限 300 秒），提醒只回原 live 会话。想"每周一早上跑批处理"——去用 cron + headless（第三篇任务二），别在 schedule 上硬凑。

### 坑 5：API Key 只写不读回

保存后页面只显示脱敏描述符，明文在 `$DSH_HOME/.credentials.yaml`。**想确认"我存对了吗"→ 直接发一个请求测试**，别找回显。

### 坑 6：自定义视觉模型必须声明图片模态

手动录入的模型默认按纯文本对待，发图片会被**发送前拒绝**并点名该模型。修法：`settings.yaml` 里给模型加 `input: [text, image]`，或路由级 `defaultInput`。反向坑：声明了端点并不提供的图片能力，请求会被 provider 拒掉，且附加的图片留在会话日志里反复重试——改配置后**开新会话**。

### 坑 7：headless 的退出码与参数边界

- 无任务文本调用 headless 是**用法错误**（必填位置参数）；
- 完成返回 0，否则 1——脚本判断成败就靠它；
- 启动器 flag 必须写在应用参数**之前**：`dsh --profile web --port 8080` 里 `--port` 是 web 应用的；要给应用传字面量 `--`，得写 `-- --`。

### 坑 8：进程信号语义

SIGTERM = 监督进程的常规停止，所有模式**以 0 退出**；SIGINT 报告 **130**；**第二次信号立即强杀**；插件树 dispose 最多 5 秒。systemd 里 `KillSignal=SIGTERM` + 合理 `TimeoutStopSec` 就能优雅停机。

### 坑 9：patch 是整行替换，不深度合并

覆盖前面层的配置行时（比如覆盖 `dsh-web-app` 覆盖 `dsh-base` 的那行），**必须重述该行需要的每一个键**，只写改动的键 = 其余键全丢。给用户留配置空间：把"大概率会保留"的值写成默认。

### 坑 10：版本与环境细节

- 源码仓库 `engines` 要求 Node `^22.19.0 || >=24.0.0`，npm 包虽未声明 engines，也别用太老的 Node；
- 凭据解析顺序：继承环境 → `.credentials.yaml` → 调用目录 `.env` → `$DSH_HOME/.env`——Key 填错位置就报 `MISSING_CREDENTIAL`；
- `web_search` 用 `DEEPSEEK_API_KEY`（可用 `DEEPSEEK_SEARCH_BASE_URL` 换端点），`web_fetch` 要 patch 插 provider 才可用；
- MCP 服务器默认**不启用**（`@deepseek-ai/dsh-mcp-client` 随包提供），因为每条服务器命令都是沙箱外的受信可执行代码。

## 六、结语

Harness 目前是开发者预览版，坑会变、API 会变，但**"一切皆插件 + 无特权内核"的架构骨架大概率会留下来**——现在学的东西，1.0 之后依然值钱。五篇写完，从看懂到部署、上手、横评、进阶，这条学习路径你走通了，剩下的就是拿它去解决你自己的真实问题。

## 系列导航

- 第 1 篇·深度解读：《[DeepSeek Harness 深度解读](/posts/2026/08/16/deepseek-harness-guide/)》
- 第 2 篇·部署教程：《[DeepSeek Harness 系列｜部署教程](/posts/2026/08/16/deepseek-harness-deploy/)》
- 第 3 篇·使用教程：《[DeepSeek Harness 系列｜使用教程](/posts/2026/08/16/deepseek-harness-usage/)》
- 第 4 篇·横评对比：《[DeepSeek Harness 系列｜横评对比](/posts/2026/08/16/deepseek-harness-compare/)》
- 第 5 篇·进阶技巧与踩坑：本文

## 参考来源（均查询于 2026-08-16）

- GitHub `deepseek-ai/deepseek-harness` 文档：`docs/subsystems/schedule.md`、`docs/subsystems/subagent.md`、`docs/subsystems/jobs.md`、`docs/subsystems/approval.md`、`docs/cookbook/extension-cookbook.md`、`docs/user/develop/basic/`（第一个插件/工具/打包发布）、`docs/postmortem/0002`（`!!js` 求值事故）、`docs/config-catalog.md`、`apps/cli/reference/README.md`
- npm：`@deepseek-ai/dsh` v0.1.0-rc.6
- 官方文档：模型配置指南、Python SDK 快速上手

> 开发者预览期行为可能变化，以官方最新文档为准。
