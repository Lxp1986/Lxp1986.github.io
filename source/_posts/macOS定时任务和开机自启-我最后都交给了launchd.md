---
title: macOS定时任务和开机自启，我最后都交给了launchd
date: 2026-08-30 22:27:48
categories: [macOS]
tags: [launchd, 定时任务, 开机自启, macOS, 运维]
description: 用 launchd 跑定时任务和开机自启的完整记录：plist 放哪、Label 规则、环境变量和日志两个坑、调试命令，附一个我真实在用的例子。
---

我机器上有几个"到点就该干活"的东西：每 5 分钟同步一次多智能体的记忆文件、每 30 分钟重打一次补丁、开机自动把后台网关拉起来。以前用过登录项、用过 crontab，折腾一圈之后全换成了 launchd。理由很简单：launchd 是 macOS 亲生的调度器，开机就接管，不依赖你进不进桌面，还能做到进程挂了自动拉起。写起来不难，坑倒是不少，都记在下面。

## plist 放哪里

当前用户的放 `~/Library/LaunchAgents/`。第一个坑常出在这：放到了 `/Library/LaunchAgents`（系统级，要 root，权限不对就静默失败），或者目录放对了但文件名和 Label 对不上。

## Label 规则

`<key>Label</key>` 的值必须和文件名一致。`com.levi.agent-sync.plist` 里 Label 就必须是 `com.levi.agent-sync`。不一致时 `launchctl load` 会报错，或者加载了但 `launchctl list` 里找不到——这种无声失败最坑。

## 一个最小可用的例子

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.levi.demo</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/echo</string>
        <string>hello</string>
    </array>
    <key>StartInterval</key>
    <integer>300</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/launchd-demo.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/launchd-demo.err</string>
</dict>
</plist>
```

保存成 `~/Library/LaunchAgents/com.levi.demo.plist`，然后：

```bash
plutil -lint ~/Library/LaunchAgents/com.levi.demo.plist   # 先查语法，输出 OK 再往下走
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.levi.demo.plist
```

老教程会让你用 `launchctl load -w`，这条命令还能用，但新系统推荐 bootstrap/bootout 这一对。

## 三种触发方式

- **StartInterval**：每隔多少秒跑一次，配 `RunAtLoad=true` 就是"开机先跑一次，之后每 N 秒一次"。注意它是"每隔"，不是"每天几点"，要定点跑用下面这个。
- **StartCalendarInterval**：指定几点几分，字典里写 `Hour`、`Minute`。
- **KeepAlive=true**：进程死了自动拉起，常驻服务用这个，我的网关就是 KeepAlive 挂着的。

## 环境变量是第一个坑

launchd 起来的环境很干净，PATH 基本只有系统那几条，`/opt/homebrew/bin` 这种 brew 路径不在里面。脚本里用到 brew 装的命令，要么写绝对路径，要么在 plist 里用 `EnvironmentVariables` 传进去。我那个同步脚本的 plist 就是把 iCloud 目录路径通过 EnvironmentVariables 传的，脚本自己不用猜路径。

## 日志要自己接

launchd 默认不保存脚本输出，任务"看起来没跑"的时候最抓瞎。plist 里加 `StandardOutPath` 和 `StandardErrorPath` 指向两个文件，stdout 和 stderr 就都进文件了。我的习惯是每条任务先接好日志再上线，不然出问题只能 `log show` 捞系统日志。

## 改完要重载，光 load 没用

改 plist 之后必须 bootout 再 bootstrap（旧命令是 unload 再 load），否则 launchd 还是跑老配置。想立刻手动跑一次验证：

```bash
launchctl kickstart -k gui/$(id -u)/com.levi.demo   # -k 表示先杀掉正在跑的再起
launchctl list | grep com.levi.demo                 # 第二列是上次退出码，0 正常，非 0 就是脚本挂了
launchctl print gui/$(id -u)/com.levi.demo          # 看详细状态
launchctl bootout gui/$(id -u)/com.levi.demo        # 卸载
```

## 贴一个我真实在用的

下面这个是我机器上的 `com.levi.agent-sync.plist`，每 300 秒跑一次多智能体记忆同步脚本，开机先跑一遍，日志和 iCloud 根路径都显式传好：

```xml
<dict>
    <key>Label</key>
    <string>com.levi.agent-sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/levi/.local/bin/levi-agent-sync.sh</string>
        <string>now</string>
    </array>
    <key>StartInterval</key>
    <integer>300</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/levi/.local/state/levi-agent-sync/sync.out</string>
    <key>StandardErrorPath</key>
    <string>/Users/levi/.local/state/levi-agent-sync/sync.err</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>AGENT_SYNC_ICLOUD_ROOT</key>
        <string>/Users/levi/Library/Mobile Documents/iCloud~md~obsidian/Documents</string>
    </dict>
</dict>
```

`launchctl list | grep agent-sync` 看到 `- 0` 就是正常状态：没在跑（任务执行完就退），上次退出码 0。

我的判断：macOS 上要定时、要自启、要保活，launchd 一张 plist 全搞定。踩过的坑就这四个——文件位置、Label 一致、环境变量、日志。记住基本不会翻车。
