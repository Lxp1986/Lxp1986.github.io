---
title: 素材和密钥误提交进仓库，用 git filter-repo 从历史里删干净
date: 2026-09-16 22:34:00
categories:
  - 开发运维
tags:
  - git
  - filter-repo
  - 仓库清理
  - 密钥
description: git rm 删的只是最新那棵树，blob 还躺在历史里。用 git filter-repo 2.47 定位占体积的路径、清掉误传的大文件和密钥，附实测命令、核对方法，以及 GitHub 侧旧 SHA 仍可访问这件事。
---

我给素材定的规矩是全部放外置盘，仓库里只留引用路径——本机硬盘太小，一个视频工程就能占满。规矩好定，历史不好改：早先有一批素材是真的提交进仓库过，我当时在 Finder 里删掉，再 commit 一笔「删除文件」。这个动作看着干净，其实一点用没有。

我拿测试仓库实测过：塞一个 3MB 的文件提交，再 `git rm` 掉、再提交一次。`git count-objects -vH` 里的 size-pack 一直是 3,000,934 字节，一分没少。因为 `git rm` 删的是工作区和最新那棵树，那个 blob 对象还在历史里躺着，谁来 clone 都得把它拉回去。想真删，只能重写历史。

![git filter-repo 清理流程](/img/git-filter-repo-flow.svg)

Git 官方早就不推荐 `git filter-branch` 干这事了（它自己的帮助文档开头就写着这命令毛病多、慢、容易出错，建议改用 git filter-repo）。我机器上是用 brew 装的：

```bash
brew install git-filter-repo
git filter-repo --version
```

装完在 `/opt/homebrew/bin/git-filter-repo`，是个 Python 脚本，可以直接当 git 子命令调用，我这边版本 2.47.0。

## 先看清楚谁在占体积

重写之前先跑只读分析，这一步不改任何东西：

```bash
git filter-repo --analyze
```

它在 `.git/filter-repo/analysis/` 下生成一堆报告文件：`blob-shas-and-paths.txt`（每个大对象的 sha 和路径）、`path-all-sizes.txt`（按累计体积排的路径）、`path-deleted-sizes.txt`（已删除但历史里还占体积的路径）、`extensions-all-sizes.txt`、`directories-all-sizes.txt`。

我基本只看前两个。测试仓库里 `path-deleted-sizes.txt` 直接给出答案：

```
Format: unpacked size, packed size, date deleted, path name
     3000000    3000934 2026-09-16 big.bin
          26         42 2026-09-16 .env
           6         21 <present>  readme.md
```

标 `<present>` 的是还留在最新提交里的，带日期的就是「文件已经没了、对象还在」。要挖的就是这几行。

## 动手前先复制一份

filter-repo 有个默认安全机制：仓库如果「不像新 clone」，它会拒绝跑。我第一次就撞上了：

```
Aborting: Refusing to destructively overwrite repo history since
this does not look like a fresh clone.
  (refs/heads/main exists, but refs/remotes/origin/main not found)
Please operate on a fresh clone instead.  If you want to proceed
anyway, use --force.
```

这个拦截是对的。正规做法是 `git clone` 一份到临时目录，在副本上跑，确认结果没毛病再回到主副本操作。要直接在主副本上跑就加 `--force`，但得知道它跑完会把 origin 删掉（我验证过，跑完 `git remote -v` 是空的），就是防止你顺手把重写后的历史推上去。

## 三种清法，按情况挑

删某个路径的全部历史，比如一个错的素材目录：

```bash
git filter-repo --force --path 素材/旧图/ --invert-paths
```

`--invert-paths` 是取反的意思，把匹配到的路径从所有提交里剔除，而不是只保留它。

不管路径、只按体积清：

```bash
git filter-repo --force --strip-blobs-bigger-than 10M
```

密钥写进了一个还要保留的配置文件，这种情况删文件没用，得改内容。建一个替换规则 `expressions.txt`：

```
DB_PASS=Hunter2xyz==>***REMOVED***
regex:AKIA[0-9A-Z]{16}==>AKIA_REDACTED
```

不带前缀的是字面量替换，`regex:` 开头按正则匹配。然后：

```bash
git filter-repo --force --replace-text expressions.txt
```

实测结果是文件保住了，内容被换掉：

```
***REMOVED***
AWS=AKIA_REDACTED
```

不过密钥这类东西，第一步永远是去后台把它作废、重新签发，清历史只是第二步。密钥一旦推上去就该当成已经泄露处理，公开仓库上的扫描爬虫比你手快，历史清干净也不代表之前没被扫走。

## 改完怎么核对

```bash
git log --all --oneline -- big.bin      # 应该一行都没有
cat .git/filter-repo/commit-map         # 旧 sha -> 新 sha 对照表
git count-objects -vH | grep size-pack
```

`.git/filter-repo/commit-map` 里如果某行的「新 sha」全是 0，说明那笔提交重写后变成空提交、被整条丢掉了。我那个测试仓库就是这样，那笔「删掉大文件」的提交本身没别的内容，清理后直接消失。

体积从 3,000,934 字节降到 1.32 KiB。老对象是真没了——`git cat-file -t <旧 blob sha>` 直接报 `could not get object info`，`git fsck --unreachable` 也是空的。filter-repo 自己会做 reflog 过期和 repack，不用再手动跑 `git gc`（老教程里 filter-branch 那一串清理命令是必须的，这里不需要）。

## 推回远端，还有两件删不掉的事

重写后 origin 被摘掉了，要手动加回来再强推：

```bash
git remote add origin git@github.com:you/repo.git
git push --force --all && git push --force --tags
```

推完不等于干净。GitHub 官方文档写得很直白：force push 之后，那些旧提交仍然能通过 SHA-1 在缓存的页面上被直接访问；要彻底清掉得去 GitHub Support 开工单，而他们只处理敏感数据，普通的大文件不会帮你删。已经被 fork 或 clone 出去的副本更管不着，对方必须以 rebase 方式同步——一次 merge 就能把脏历史带回来。

所以对误传的密钥：先作废重签，再清历史。对误传的素材：清完历史就够了，反正目的只是让 clone 体积回到正常。

## 我现在的习惯

`.gitignore` 第一段就写素材盘路径和 `*.mp4`、`*.psd` 这类大件后缀，提交前扫一眼 `git status --short`，只 commit 明确要提交的路径，不用 `git add -A` 图省事。素材全部落外置盘，仓库里只留引用。

最后一句实话：重写历史会换掉所有 commit 的 SHA，有人在用的仓库得挑个没人动的时段做，推完通知对方重新 clone。
