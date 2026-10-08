---
title: 我刚把 Jev 用顺，OpenAI 又开了 Decisions API
date: 2026-10-09 10:30:00
updated: 2026-10-09 10:30:00
permalink: posts/2026/10/09/jev-vs-decisions-api/
categories:
  - AI工具
tags:
  - Jev
  - OpenAI API
  - Decisions API
  - System One
description: OpenAI 新开的 Decisions API 和 Jev 都能做结构化判断，但“快 10 倍”不是两者的对比。我把接口、问题类型和价格摆在一起，也列出真正公平的实测方法。
cover: /img/jev-decisions-cover.svg
---

9 月我写过一篇 Jev 的使用感受。那篇里有个挺打脸的小事：让它替我挑选题，它给了 0.88 的高置信推荐，我还是没听。Jev 有用，但分数再漂亮，也不等于它替我做主。

10 月 6 日，OpenAI 开放了 Decisions API beta。我看到介绍时，第一反应是：这和 Jev 好像啊。都不打算陪你聊半天，而是把一个问题变成有限选项，再把结构化答案交给程序。

我先把两边的说明翻了一遍。结论先放前面：确实值得放在一起看，但我还没做同一批样本的对照测试，所以这里不报“谁准、谁快”的实测成绩。官方写的快 10 倍，也不是拿 Jev 当对手测出来的。

![两套判断接口面对同一组测试样本](/img/jev-decisions-cover.svg)

## “快 10 倍”比的是谁

OpenAI 的文档说，Decisions API 对文本或图片返回结构化判断，速度比 Responses API 快约 10 倍。现在它还在公开 beta，文档列出的模型只有 `gpt-6-luna`，请求走单独的 `POST /v1/decisions` 接口。这个 10 倍的参照物是 Responses API，不是 Jev。([OpenAI Decisions 文档](https://developers.openai.com/api/docs/guides/decisions))

这句很容易被标题党拿去写成“OpenAI 的判断模型比 Jev 快 10 倍”。先别急，官方没这么说。TypeSafe 对 Jev 的延迟、价格也有自己的公开数据，但测试环境和工作流都不一样，把两边的宣传数字直接相除没什么意义。([TypeSafe：System One Models 与 Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev))

## 它们接的活确实相近

拿“这条留言要不要人工跟进”举例。问题边界写清楚后，两边都能返回一个真假倾向；如果是类别选择或严重程度打分，也能设好选项和等级，让程序拿结果继续跑。

| 项目 | Jev / System One | OpenAI Decisions API |
| --- | --- | --- |
| 问题类型 | Choice、Noul、Score | Predicate、Choice、Score |
| 输出 | 预设选项、概率或有序分数 | 对应类型的结构化答案、概率分布与置信度 |
| 接口 | TypeSafe 自己的 System One JSON 接口 | OpenAI SDK 的 Decisions 接口 |
| 当前状态 | 我之前已接进本机工作流 | 公开 beta；文档目前列出 GPT-6 Luna |
| 官方公布的输入价 | $0.042 / 百万 tokens | $0.10 / 百万 tokens |
| 官方速度说法 | TypeSafe 公布自家端到端数据 | OpenAI 称比 Responses API 快约 10 倍 |

名字不完全一样，但对做工作流的人来说，相似的地方比名字更重要：先把输入和规则定下来，接口再给程序一个有类型的答案。Decisions 可以在一次请求里对同一份输入问多个相互独立的问题；Jev 也支持一次并行提交多个判断。([OpenAI 多问题说明](https://developers.openai.com/api/docs/guides/decisions) · [TypeSafe Introduction](https://docs.typesafe.ai/introduction))

价格也值得看一眼。TypeSafe 公布 Jev 输入价是每百万 tokens $0.042；OpenAI 的 Decisions 文档列的是 $0.10。都按输入 tokens 计，厂商说明输出不收费。不过这只是标价，不等于每条任务的最终账单：提示长短、重复调用和缓存都会让总量变掉。([TypeSafe 公告](https://typesafe.ai/blog/introducing-system-one-models-and-jev) · [OpenAI Decisions 文档](https://developers.openai.com/api/docs/guides/decisions))

![Jev 和 Decisions API 的问题类型与返回值对照](/img/jev-decisions-map.svg)

## 用一条留言走一遍 Decisions API

下面是一个最小示例：判断一条工程留言是否需要人工尽快跟进。它只演示接口怎么用，不是我这次跑过的 benchmark。运行前要准备可调用 OpenAI API 的项目和 `OPENAI_API_KEY`，API 费用按实际输入计；官方 Python 示例要求 OpenAI SDK 3.26.0 或更新版本。([OpenAI Python API reference](https://developers.openai.com/api/reference/python/resources/decisions/methods/create))

```python
from openai import OpenAI

client = OpenAI()  # 从 OPENAI_API_KEY 环境变量读取密钥

result = client.decisions.create(
    model="gpt-6-luna",
    input="留言：渠道边坡坍塌，已经影响道路通行，今天能安排复核吗？",
    questions=[
        {
            "type": "predicate",
            "name": "needs_human_follow_up",
            "instructions": (
                "判断这条留言是否需要人工尽快跟进。"
                "只有明确提到安全风险或已经影响施工、通行时才判为 true。"
            ),
        }
    ],
)

answer = result.answers[0]
if answer.type == "predicate":
    print(answer.probability)
elif answer.type == "refusal":
    print("模型拒绝判断")
```

要拿 Jev 做同题比较，可以把同一条留言、同一条规则交给 `noul`，然后把两边返回的概率和人工标签记下来。别把样本换了，也别在一边写得很细、另一边只扔一句“判断一下”。那样测出来的差异，可能只是提问方式不一样。

## 真要横评，我会这么测

我会先自己写一小批虚构留言，逐条标好“要跟进 / 不用跟进”，把样本冻结。接着让两边吃完全相同的文本和判断规则，测准确数、漏报和误报。速度在同一台机器、同一网络下多跑几轮，记录中位数；费用看 API 返回的用量，不按宣传页上的极限数字估。

这只是小样本体验，不能冒充严谨的模型评测。它至少能回答几个实际问题：简单的门槛题谁更顺手？相近的留言会不会一会儿判要、一会儿又不要？接进我现有的脚本要改多少？要是概率都挤在 0.5 附近，漂亮的接口也救不了糊涂规则。

测试输入我会用虚构材料，不会把真实业主留言、签证信息或个人资料直接送去做对照。要测工具，没必要先拿敏感内容开刀。

![一组冻结样本分别经过两种接口，再按人工标签核对](/img/jev-decisions-test.svg)

## 现在就换吗？我还不急

Decisions API 的好处很直观：如果项目已经在用 OpenAI SDK，想直接拿到分类、真假判断或有序分数，少一层解析文本的活。它能把文本和图片放进同一套判断流程，返回的数据也按预设类型组织。需要长解释、自定义 JSON 或工具调用，OpenAI 文档仍然建议看 Responses API 的结构化输出和 function calling，不必硬把所有任务塞进 Decisions。([OpenAI Decisions 文档](https://developers.openai.com/api/docs/guides/decisions))

我已经把 Jev 接进几条本机工作流，也知道它哪些地方会飘。光因为 OpenAI 多了一个新接口就迁移，听着像折腾，暂时看不出省了什么。Decisions 还在 beta，模型选择也少；Jev 这边，问题措辞、criteria 写法和接入位置一样会影响结果。两个都不是装上就替你承担判断责任的东西。

所以我对这次更新是好奇，但没到“Jev 要下岗了”的程度。先拿同一批虚构样本跑一遍，再决定值不值得改现有流程。OpenAI 的 10 倍速度说明它在和 Responses API 比；我真正关心的，还是它能不能把我眼前这点小活做得更省心。

## 官方资料

- [OpenAI API：Decisions](https://developers.openai.com/api/docs/guides/decisions)
- [OpenAI API：Decisions Python API reference](https://developers.openai.com/api/reference/python/resources/decisions/methods/create)
- [OpenAI API changelog：2026 年 10 月 6 日发布 Decisions beta](https://developers.openai.com/api/docs/changelog)
- [TypeSafe：Introducing System One Models & Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
- [TypeSafe 文档：Introduction](https://docs.typesafe.ai/introduction)
- [TypeSafe 文档：Score](https://docs.typesafe.ai/primitives/score)
