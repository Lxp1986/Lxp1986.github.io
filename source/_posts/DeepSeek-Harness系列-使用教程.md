---
title: DeepSeek Harness 系列｜使用教程：仓库分析、自动周报、定时巡检，三个真实任务跑通全流程
date: 2026-08-16 23:10:00
permalink: posts/2026/08/16/deepseek-harness-usage/
categories:
  - 技术
tags:
  - DeepSeek
  - AI Agent
  - 教程
  - 效率工具
  - Python
  - 自动化
description: 本篇是《DeepSeek Harness 系列》第三篇。不泛泛介绍，直接拿三个真实任务走完整流程：① 用 Web UI 分析一个代码仓库（规划/子代理/审批全流程）；② 用 headless + cron 自动写周报（shell 脚本可复制）；③ 用 schedule 插件做会话内定时巡检。最后用 Python SDK 把 Harness 嵌进自己的程序。
cover: /img/dsh-usage.svg
---

> 这是《DeepSeek Harness 系列》第三篇。前两篇讲了[深度解读](/posts/2026/08/16/deepseek-harness-guide/)和[部署教程](/posts/2026/08/16/deepseek-harness-deploy/)。这一篇**不讲概念，只跑任务**：三个真实场景，每种姿势（Web UI / headless / schedule / Python SDK）各配一个任务，命令和提示词全部可复制。

![DeepSeek Harness 使用教程：三个真实任务全流程](/img/dsh-usage.svg)

## 姿势总览：先选对工具

| 姿势 | 交互形态 | 适合场景 | 典型用法 |
|---|---|---|---|
| Web UI | 浏览器图形界面 | 交互式任务、需要人审批 | 仓库分析、代码修改、调研 |
| headless | 一次性 CLI 任务 | 脚本 / cron 定时批处理 | 周报、巡检、CI 门禁 |
| schedule 插件 | 会话内持久提醒 | 浏览器挂着、到点干活 | 定时巡检、定时汇报 |
| Python SDK | 程序内嵌 | 自研工具链、流水线 | 批量分析、报告生成 |

## 任务一：用 Web UI 分析一个代码仓库

### 1.1 准备

假设部署已完成（没部署的先看[第二篇](/posts/2026/08/16/deepseek-harness-deploy/)），`dsh web` 已跑在 `http://127.0.0.1:3080`。我们要分析的是任意一个本地仓库，比如你自己正在开发的项目。

### 1.2 四步操作

1. **Settings → Models** 确认 API Key 已配置（DeepSeek 或你选的其他 provider）；
2. **Choose workspace** 添加仓库目录并选中——**不选工作区，输入框是灰的**，这是新手最常见的卡点；
3. 新建会话，输入任务：

> 总结这个仓库的结构，识别主要包和模块边界，说明技术栈、入口点、构建方式，最后给出"如果你是新人，从哪里开始读代码"的建议。

4. 观察 agent 的动作流：它会先 `glob` / `grep` 摸清文件布局，`read` 关键文件（README、package.json、源码），必要时 `bash` 跑构建或测试，最后输出一份 markdown 报告。

### 1.3 让大仓库分析更快：子代理并行

仓库很大时，让主代理自己逐个文件读会又慢又烧上下文。更好的做法是**把研究任务委派给 subagent**（对应工具是 `subagent`，默认配置下是 continuable 模式、**默认后台运行**，跑完自动把结果投递回来）。你可以在对话里直接说：

> 用 3 个 subagent 分别研究 modules/a、modules/b、modules/c 三个目录的结构和职责，等结果回来后汇总成一份仓库分析报告。

或者自己拆任务逐个发。注意 subagent **看不到当前对话上下文**，所以委派时提示词要自包含（"完整、独立的提示词"），把目标路径、要看什么、输出格式写清楚。

### 1.4 关键交互机制

- **审批**：操作超出当前权限策略（新会话默认 `workspace-write`）时，Web UI 会弹审批问你"这个操作能不能做"。危险命令被拦下来问人是常态，不是故障；
- **Plan 模式**：让 agent 先列计划再动手。任务开头加"先给我一个计划，确认后再执行"，它会走 `plan/mode`，批准后才退出规划模式开始干活；
- **todo_write**：长任务里 agent 会维护待办清单，UI 实时渲染成勾选列表，进度一目了然；
- **会话可回放**：任何会话的日志遵循"模型可见即已记录"，可以 fork 出一个分支继续，不会污染原会话。

## 任务二：自动写周报（headless + cron）

真实场景：每个周一早上 8 点，自动把上周的 git 提交汇总成一份周报。headless 模式跑完即退、不占端口，天生适合 cron。

### 2.1 采集素材脚本

```bash
#!/usr/bin/env bash
# /opt/dsh/weekly.sh
set -euo pipefail

REPO=/path/to/your/repo
OUT=/path/to/weekly-report.md
cd "$REPO"

# ① 采集上周提交素材（作者/日期/主题）
git log --since="1 week ago" --pretty=format:"%h | %an | %ad | %s" --date=short > /tmp/gitlog.txt

# ② 统计数字
commits=$(wc -l < /tmp/gitlog.txt)
changed=$(git diff --shortstat "$(git log --since='1 week ago' --format=%H | tail -1)^" 2>/dev/null | tail -1 || echo "")

# ③ 把素材喂给 headless，让它生成周报
REPORT=$(dsh --profile headless "你是一名技术管理者。根据下面的 git 提交记录生成一份中文周报：
- 按模块/主题归类，不要逐条罗列
- 每类给 1-2 句总结，指出风险和下一步
- 用 markdown 格式
- 统计：本周 $commits 次提交
$changed

提交记录：
$(cat /tmp/gitlog.txt)")

# ④ 写入周报文件（追加到本周文档）
{
  echo "## 本周周报（$(date +%F)）"
  echo "$REPORT"
  echo ""
} >> "$OUT"

echo "周报已生成：$OUT"
```

### 2.2 注册 cron

```bash
crontab -e
# 每周一 08:00 执行（想省钱就挪到空闲时段，见下）
0 8 * * 1 /opt/dsh/weekly.sh >> /var/log/dsh-weekly.log 2>&1
```

headless 的退出码约定（CLI 参考文档）：任务以 `completed` 结束返回 **0**，否则返回 **1**。所以脚本里 `set -e` + `dsh --profile headless` 天然构成"失败即中断"，日志里能看到非零退出码。

### 2.3 省钱技巧：把批处理排到空闲时段

系列第一篇讲过 8·17 起的峰谷定价：高峰 7 小时（9:00–12:00、14:00–18:00），其余 17 小时空闲价 = 高峰价 × 0.5。周报、巡检这类非实时任务，cron 直接改到空闲段（比如 07:00 或 19:00），API 成本直接砍半：

```bash
# 周一 07:00（空闲时段，输出价半价）
0 7 * * 1 /opt/dsh/weekly.sh
```

### 2.4 headless 的环境变量

| 变量 | 作用 |
|---|---|
| `DSH_MODEL` | 指定模型，如 `deepseek-v4-flash`（默认即 flash 系） |
| `DSH_SYSTEM_PROMPT` | 自定义系统提示词 |
| `DEEPSEEK_API_KEY` | 凭据 |
| `DEEPSEEK_BASE_URL` | 走 OpenAI 兼容代理时指定端点 |
| `DSH_PERMISSION_MODE` | 权限预设后备值（默认新会话 `workspace-write`） |
| `DSH_TOOLS_MODE` | `native` / `code` / `both`，工具模式 |

## 任务三：定时巡检（schedule 插件）

场景：浏览器里挂着一个 Harness 会话，希望它每小时检查一次某服务的健康状态、磁盘水位和依赖更新。这是 schedule 插件的典型用法——它是**会话内的持久提醒**，到点以普通对话轮次的形式回到原会话，不打断当前工作。

### 3.1 启用 schedule（需要源码 checkout）

schedule 不在默认组合里，官方给了一个 overlay（`examples/web-schedule/cordis.yml`，内容就是把 `@deepseek-ai/dsh-time-context` 和 `@deepseek-ai/dsh-schedule` 两个插件插进去）：

```bash
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install && pnpm run build
pnpm dsh web --patch examples/web-schedule/cordis.yml
```

### 3.2 在会话里创建提醒

```text
每小时检查一次：
1. 本机磁盘使用率（df -h）
2. 服务 health 端点（curl -fsS http://127.0.0.1:8080/health）
3. 是否有可更新的依赖（npm outdated 2>/dev/null | head）
把结果整理成简报，异常项标红。
```

模型会调用 `schedule_create`，参数规则（v1，官方文档）：

| 规则 | 含义 | 约束 |
|---|---|---|
| `after_seconds` | 延时 N 秒后触发一次 | 正整数 |
| `at` | 绝对时刻 | 带偏移的 RFC 3339 字符串，或 `{date, time, time_zone}` 本地日历对象 |
| `every_seconds` | 固定速率重复 | **下限 300 秒**，以创建时刻为锚点对齐 |

配套工具：`schedule_list` 查看、`schedule_delete` 删除（用返回的确切 id）。

### 3.3 schedule 的三个"边界"（重要）

1. **只在原会话内交付（session-local）**：没有邮件、短信、浏览器推送等任何外部通知渠道——提醒作为后续轮次回到原 live 会话；
2. **会话必须 live**：进程关了或会话 cold，内存计时器停摆但**记录不丢**；重开会话自动恢复，逾期的提醒会补交付（overdue 状态）；
3. **没有 Cron 表达式**：只有 after / at / every 三种规则，日历规则（"每周一"）不支持。想表达"每周一早上"，请用任务二的 cron + headless。

还有两个容易忽略的语义：fork 出的子会话**不继承**父会话的提醒；错过多个周期的 every 提醒只补**最新一次**，不会积压。

### 3.4 schedule 排错

错误码（官方文档列出的稳定错误）：`invalid_prompt`、`invalid_selector`、`invalid_rule`、`invalid_time_zone`、`not_future`（目标必须在未来）、`frequency_too_high`（低于 5 分钟）、`corrupt_schedule_log`。夏令时缺口会被拒绝、重叠时段取较早时刻，记录只存规范化后的 UTC 目标——回放不依赖环境时区。

## 任务四：把 Harness 嵌进自己的程序（Python SDK）

官方提供 Python SDK（`deepseek-harness-sdk`），它自带内置运行时，**装完不需要系统里有 Node.js**。

### 4.1 环境要求与安装

- Python 3.10+
- Linux x64 / Linux arm64 / macOS 14+（arm64）
- 一个 DeepSeek 兼容的 API 端点和凭据
- 一个 agent 可以随便改的**隔离 workspace**（SDK 的示例组合用的是 `danger-full-access`，Bash 和编辑器能碰进程可见的任何路径——只能在可丢弃的目录或容器里跑）

```bash
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
python -m venv .venv && . .venv/bin/activate
python -m pip install deepseek-harness-sdk
```

### 4.2 最小示例：分析仓库并跑测试

```bash
export DEEPSEEK_API_KEY=sk-你的Key
# 走 OpenAI 兼容代理时：
# export DEEPSEEK_BASE_URL=http://127.0.0.1:8000/v1
# export DSH_MODEL=deepseek-v4-flash
```

```bash
python examples/jsonrpc-agent/minimal.py \
  --workspace /absolute/path/to/workspace \
  --session-root /absolute/path/to/sessions \
  --session-id example-001 \
  "检查这个仓库，修复失败的测试"
```

脚本会打印 assistant 的最终回复；`sessions` 目录会收到 JSONL 会话日志（含组装后的模型请求和工具调用）——这就是"模型可见即已记录"在程序侧的形态。

### 4.3 在自己代码里调用

```python
from pathlib import Path

from deepseek_harness import DeepSeekHarness

config = Path("examples/jsonrpc-agent/minimal.cordis.yml").resolve()
workspace = Path("/absolute/path/to/workspace").resolve()
sessions = Path("/absolute/path/to/sessions").resolve()

with DeepSeekHarness(
    provider="deepseek-official",
    model="deepseek-v4-flash",
    max_tokens=49_152,
    cwd=str(workspace),
    session_root=str(sessions),
    cordis=str(config),
) as harness:
    result = harness.run(
        "Inspect the repository and fix the failing tests.",
        session_id="example-001",
    )

print(result.final_response)
```

### 4.4 SDK 的五个关键语义

1. **运行时懒启动 + 复用**：`DeepSeekHarness` 进入上下文时启动内置运行时，退出时释放；同一个实例和 session id 会**保留该会话的 Bash 进程**（工作目录、导出变量、shell 函数都在）；
2. **session id 即对话身份**：独立任务用新 id；只有想延续同一段持久对话时才复用旧 id；
3. **最小组合**：示例组合只面向模型暴露持久 `bash` 和 `str_replace_editor` 两个工具（Bash 超时 300 秒、编辑器输出上限 16,000 字符），没有 skill、没有 web 工具、压缩关闭——要更多能力就换/改 cordis 组合；
4. **系统提示词**：默认 `You are a helpful software engineer assistant.`，用 `DSH_SYSTEM_PROMPT` 覆盖；
5. **安全**：`danger-full-access` 意味着必须用隔离环境，这是文档原话级别的警告，别在真实生产目录里跑。

## 小结：三个任务 × 四种姿势怎么选

| 你的场景 | 选它 | 为什么 |
|---|---|---|
| 我要看着它干活、随时审批 | Web UI | 交互完整，Plan/审批/todo 都是为这个设计的 |
| 无人值守、定时跑 | headless + cron | 跑完即退、退出码可判断、不占端口 |
| 浏览器挂着、到点提醒我巡检 | schedule 插件 | 提醒回到原会话，上下文不丢 |
| 我要写自己的工具链 | Python SDK | 程序内嵌、会话状态可复用 |

下一篇是《[横评对比](/posts/2026/08/16/deepseek-harness-compare/)》：Harness vs Claude Code / Codex CLI / OpenHands / Gemini CLI / Aider，谁适合谁，一张表说清。进阶玩法（subagent 深度控制、插件开发、性能优化与踩坑）在[第五篇](/posts/2026/08/16/deepseek-harness-advanced/)。

## 系列导航

- 第 1 篇·深度解读：《[DeepSeek Harness 深度解读](/posts/2026/08/16/deepseek-harness-guide/)》
- 第 2 篇·部署教程：《[DeepSeek Harness 系列｜部署教程](/posts/2026/08/16/deepseek-harness-deploy/)》
- 第 3 篇·使用教程：本文
- 第 4 篇·横评对比：《[DeepSeek Harness 系列｜横评对比](/posts/2026/08/16/deepseek-harness-compare/)》
- 第 5 篇·进阶技巧与踩坑：《[DeepSeek Harness 系列｜进阶技巧与踩坑](/posts/2026/08/16/deepseek-harness-advanced/)》

## 参考来源（均查询于 2026-08-16）

- GitHub `deepseek-ai/deepseek-harness`：`docs/user/guide/index.md`（Web UI 指南）、`docs/user/guide/python-sdk.md`（Python SDK 快速上手）、`docs/subsystems/schedule.md`（Schedule）、`docs/subsystems/subagent.md`、`apps/cli/reference/README.md`、`examples/web-schedule/`
- npm：`@deepseek-ai/dsh` v0.1.0-rc.6；PyPI：`deepseek-harness-sdk`
- 官方 API 定价页（峰谷定价，2026-08-17 生效）

> 版本与行为以官方最新文档为准；提示词和脚本中的模型名、路径按你的环境替换。
