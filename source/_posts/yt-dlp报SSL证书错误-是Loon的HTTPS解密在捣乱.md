---
title: yt-dlp报SSL证书错误-是Loon的HTTPS解密在捣乱
date: 2026-08-27 22:32:35
categories:
  - macOS
tags:
  - yt-dlp
  - SSL
  - 代理
  - Loon
  - 排障
description: yt-dlp 下载 YouTube 报 CERTIFICATE_VERIFY_FAILED，网上教的 SSL_CERT_FILE 办法都试了没用。排查到底发现是 Loon 的 HTTPS 解密在中间捣乱：macOS 自带工具认钥匙串，OpenSSL 3 只认 cert.pem 文件。把代理根证书导出来合并进 CA bundle 就解决了。
---

# yt-dlp 报 SSL 证书错误，是 Loon 的 HTTPS 解密在捣乱

今天用 yt-dlp 下个 YouTube 视频，直接给我报这个错：

```
ERROR: [youtube] [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed:
unable to get local issuer certificate
```

网上搜了一圈，十有八九让你 `export SSL_CERT_FILE=/etc/ssl/cert.pem`，或者 `pip install certifi` 之后把 certifi 的路径指过去。我全试了，没用，还是报一样的错。

![yt-dlp SSL 报错排查路径](/img/yt-dlp-ssl-loon-flow.svg)

## 排查：问题根本不在证书文件

先做个排除。curl 能不能访问 YouTube？

```bash
curl -sI https://www.youtube.com -o /dev/null -w "%{http_code}"
# 200，正常
```

系统 Python 呢？

```bash
/usr/bin/python3 -c "import urllib.request; print(urllib.request.urlopen('https://www.youtube.com', timeout=15).status)"
# 200，也正常
```

网络没问题、系统证书没问题，那就是 yt-dlp 自己用的 Python 有问题。看它到底跑在哪个解释器上：

```bash
head -1 "$(which yt-dlp)"
# #!/Users/levi/.local/share/uv/tools/yt-dlp/bin/python
```

原来 yt-dlp 是 `uv tool` 装的，跑在 uv 的独立 Python 里。直接用这个 Python 访问 YouTube：

```bash
~/.local/share/uv/tools/yt-dlp/bin/python -c \
  "import urllib.request; print(urllib.request.urlopen('https://www.youtube.com', timeout=15).status)"
# 报一样的 SSL 错
```

锁定到解释器了。但为什么同一个证书文件，系统 Python 能过、uv 的 Python 过不了？关键区别：系统 Python 用的是 LibreSSL，**认 macOS 系统钥匙串**；uv/brew 的 Python 用 OpenSSL 3.x，**只认 cert.pem 文件**。

那 cert.pem 文件里缺了什么？用 openssl 直接连一下看证书：

```bash
/opt/homebrew/opt/openssl@3/bin/openssl s_client -connect www.youtube.com:443 -brief </dev/null
# depth=0 O=Loon, CN=xn--ck8h.com
# verify error:num=20:unable to get local issuer certificate
```

看到 `O=Loon` 就明白了：本机挂着 Loon 代理，开了 HTTPS 解密（MITM），YouTube 的真实证书被 Loon 用自己的根证书重新签了一遍。macOS 的工具走钥匙串，信任 Loon 装进去的根证书，所以没事；OpenSSL 3 只读文件，文件里没有 Loon 的根证书，于是验证失败。

## 解决：把代理的根证书合并进 CA bundle

Loon 的根证书其实已经装进系统钥匙串了（代理工具安装时都会装），把它导出来：

```bash
mkdir -p ~/.config/ssl
security find-certificate -c "LOON" -p /Library/Keychains/System.keychain > ~/.config/ssl/loon-ca.pem
```

和系统证书合并成一个 bundle：

```bash
cat /private/etc/ssl/cert.pem ~/.config/ssl/loon-ca.pem > ~/.config/ssl/combined.pem
```

然后指给 SSL_CERT_FILE（写进 `~/.zshenv` 持久生效）：

```bash
export SSL_CERT_FILE="$HOME/.config/ssl/combined.pem"
```

验证一下：

```bash
yt-dlp --simulate --print "%(title)s | %(format_id)s" \
  -f "bv*+ba/b" --merge-output-format mp4 "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
# OK 标题: Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster) | 格式: 401+251
```

能正常提取了。

## 这类坑的通用规律

装过 Loon、Surge、Clash、Stash 这类代理，又开了 HTTPS 解密的机器，命令行工具突然报 SSL 证书错，**先怀疑代理的中间人证书，别急着折腾系统证书**。两条路：要么把代理根证书导出来合并进 CA bundle（上面这套命令，Surge/Stash 的证书名改成你自己的就行），要么在代理里把要访问的域名加进解密豁免名单。

顺带说一句，我这套 combined.pem 还合并了 Agent-Reach 的 CA 文件（`/opt/homebrew/etc/ca-certificates/agent-reach-sys-ca.pem`，之前为修另一个工具的信任链导的），三个来源合成一份，OpenSSL 系的工具一个文件全覆盖，以后再报错就少一个怀疑对象。
