---
title: pip 装完还报 ModuleNotFoundError，因为我跑的不是装包那个 python
date: 2026-09-19 22:29:00
categories:
  - 开发运维
tags:
  - python
  - pip
  - venv
  - macOS
description: 包明明 Successfully installed，脚本还是 No module named。这篇用本机实测输出讲清 Mac 上多个 python 各自装各自的包，给出 python3 -m pip -V、sys.executable、python3 -m site 三步定位法，以及 PYTHONPATH 插队和用户目录污染的解除方法。
cover: /img/py-import-path.svg
---

给一个抓网页的小脚本装 beautifulsoup4，pip 打印了 `Successfully installed beautifulsoup4-4.14.3`，转头跑脚本：

```
ModuleNotFoundError: No module named 'bs4'
```

装的时候没报错，跑的时候找不到。这不是 pip 抽风，是我装包用的 python 和跑脚本用的 python 不是一个——一个 3.9，一个 3.14。Mac 上这种事太容易发生，因为 `python3` 这个名字同时有好几个候选。

## Mac 上为什么有好几个 python3

本机 `which -a python3` 的输出：

```
/usr/bin/python3
/Users/levi/.hermes/hermes-agent/venv/bin/python3
/opt/homebrew/bin/python3
```

三个。第一个其实是 Xcode 里带的 3.9.6（`/usr/bin/python3` 只是个壳子，真身在 `/Applications/Xcode.app/Contents/Developer/usr/bin/python3`）；第三个是 Homebrew 装的 3.14；中间那个是某个项目的 venv。`python3` 敲下去落到谁身上，只看 PATH 从上往下谁先命中。

问题是每个解释器都有自己的一份 site-packages。3.9 装的包，3.14 一点都看不见，而且不会有任何提示。实测：

```
$ python3 -c "import bs4; print(bs4.__file__)"
/Users/levi/Library/Python/3.9/lib/python/site-packages/bs4/__init__.py

$ /opt/homebrew/bin/python3 -c "import bs4; print(bs4.__file__)"
ModuleNotFoundError: No module named 'bs4'
```

同一个包名，一个能 import 一个不能。所以报 ModuleNotFoundError 时，别急着重新装——先查清楚装到哪、谁在跑。

![import 时的目录搜索顺序](/img/py-import-path.svg)

## 三步定位

**第一步，看 pip 会把包装到哪。**

```
$ python3 -m pip -V
pip 25.1 from /Users/levi/Library/Python/3.9/lib/python/site-packages/pip (python 3.9)
```

这一行把三件事一次说清：这个 pip 属于 python 3.9、包会进 `~/Library/Python/3.9/lib/python/site-packages`、这是用户级目录不是 venv。

一定用 `python3 -m pip`，别用裸 `pip3`。`pip3` 是个带 shebang 的独立脚本，它写死的解释器可能跟你以为的那个不一样；`-m` 用的是你刚敲的那个解释器本身，跑不偏。

**第二步，看脚本实际用的解释器，以及有没有在 venv 里。**

```
$ python3 -c "import sys; print(sys.executable); print('in_venv =', sys.prefix != sys.base_prefix)"
/Applications/Xcode.app/Contents/Developer/usr/bin/python3
in_venv = False
```

`in_venv = False` 说明我没在虚拟环境里，装包会撒到系统或用户目录去，全机器共用。换成一个真 venv 跑，结果是这样：

```
$ .venv/bin/python -c "import sys; print(sys.executable); print('in_venv =', sys.prefix != sys.base_prefix)"
/private/tmp/pydemo/.venv/bin/python
in_venv = True
```

**第三步，把搜索路径整个拿出来看。**

```
$ python3 -m site
sys.path = [
    '/Users/levi',
    '/Applications/Xcode.app/.../lib/python39.zip',
    '/Applications/Xcode.app/.../lib/python3.9',
    '/Users/levi/Library/Python/3.9/lib/python/site-packages',
    '/Applications/Xcode.app/.../lib/python3.9/site-packages',
]
USER_SITE: '/Users/levi/Library/Python/3.9/lib/python/site-packages' (exists)
ENABLE_USER_SITE: True
```

四五行而已，比翻文档快。要找某个包到底从哪来的，直接问它：

```
python3 -c "import PIL; print(PIL.__file__)"
```

输出来的是哪个目录，就说明它归哪份 site-packages 管。

## 三种成因，对应三种改法

**一、装包和跑脚本的解释器不是同一个。** 就是开头这个。改法是把事情收进项目 venv，并且别依赖 activate：

```
/opt/homebrew/bin/python3.14 -m venv .venv
.venv/bin/python -m pip install beautifulsoup4
.venv/bin/python script.py
```

直接把 venv 里解释器的路径写出来跑，比 `source activate` 之后再敲 `python` 稳，因为不存在「忘了 activate」和「activate 之后 PATH 又被别的工具改回去」这两种情况。

**二、PATH 顺序决定了 `python3` 是谁。** `which -a python3` 把同名的全列出来，从上往下第一个就是实际执行的那个。想让 Homebrew 的版本优先，就把它在 `~/.zshrc` 里的位置提到前面；但更省心的做法是脚本、shebang、launchd 的 plist 里统一写死解释器绝对路径，跟 PATH 脱钩。已经跑起来的服务想确认用的哪个解释器，看进程命令行就行：

```
ps -Ao pid,command | grep 脚本名
```

**三、PYTHONPATH 插队，遮蔽 venv 里的包。** 这条最阴，因为环境看着完全正常。实测（3.14 的 venv，把 `/tmp/pydemo/fake` 塞进 PYTHONPATH）：

```
$ PYTHONPATH=/tmp/pydemo/fake .venv/bin/python -c "import sys;[print(i,p) for i,p in enumerate(sys.path[:7])]"
0
1 /tmp/pydemo/fake
2 /opt/homebrew/Cellar/python@3.14/.../lib/python314.zip
3 /opt/homebrew/Cellar/python@3.14/.../lib/python3.14
4 /opt/homebrew/Cellar/python@3.14/.../lib/python3.14/lib-dynload
5 /private/tmp/pydemo/.venv/lib/python3.14/site-packages
```

venv 的 site-packages 排在第 5 位，PYTHONPATH 那个目录排在第 1 位。也就是说 venv 里装的包，只要 PYTHONPATH 目录里有同名文件，赢的永远是那份插队的；同名文件不存在时也不报错，只是行为变得莫名其妙。这条通常是从 `~/.zshenv` 或某个装过的命令行工具的启动脚本里带进来的，查一行就够：

```
echo "PYTHONPATH=[$PYTHONPATH]"
unset PYTHONPATH
```

要长期解决，把那行 `export PYTHONPATH=...` 从 `~/.zshenv`、`~/.zshrc` 里删掉。临时跑一次性脚本可以加 `-I`，它会同时忽略 PYTHONPATH 和用户级目录：

```
$ PYTHONPATH=/tmp/pydemo/fake python3 -I -c "import sys;print(sys.path[:2])"
['/Applications/Xcode.app/.../lib/python39.zip', ...]
```

输出里 `/tmp/pydemo/fake` 已经不见了。

顺带一个相关的：没有 venv 时 pip 会把包装进 `~/Library/Python/3.9/...`，这个目录对该版本所有项目都生效，属于隐性共享。想临时屏蔽它：

```
$ PYTHONNOUSERSITE=1 python3 -c "import sys;print([p for p in sys.path if 'Python/3.9' in p])"
[]
```

## 我现在的固定习惯

- 装包只用 `python3 -m pip install`，不敲裸 `pip`/`pip3`
- 一个项目一个 venv，调用一律写解释器路径（`.venv/bin/python xxx.py`）
- 脚本报 ModuleNotFoundError 时，先跑 `python3 -m pip -V` 和 `sys.executable` 两行，对不上就换解释器，而不是反复重装
- 被 PYTHONPATH 折腾过之后，`~/.zshenv` 里再没放过 python 相关的 export

ModuleNotFoundError 的字面意思只是「没找到」，不是「没装」。这两行命令十秒钟就能分清是哪种：

```
python3 -m pip -V
python3 -c "import sys; print(sys.executable, sys.prefix != sys.base_prefix)"
```
