---
title: 手机拍照转扫描件，Apple Vision 透视矫正踩坑记
date: 2026-09-02 22:29:44
categories: [macOS]
tags: [Swift, Vision, CoreImage, 扫描件, 命令行]
description: 做工程交资料免不了扫描件，没有扫描仪就用手机拍。本文用 macOS 自带 Vision 框架的文档检测 + Core Image 透视矫正，写了个本地命令行工具把斜拍的照片拉正成扫描件，记录了坐标原点翻转、找不到纸、电子截图别矫正三个坑。代码已实测可跑。
cover: /img/docscan-coords.svg
---

做工程免不了交扫描件。前几天给公司报名供应商建库，营业执照、法人身份证、授权书，全是「请提供扫描件」。手边没有扫描仪，镇上打印店的机器还得专门跑一趟。手机拍倒是快，但拍出来是斜的——纸成梯形，字越远越小。

手机备忘录自带的扫描能拍正，但一张张在手机上框边、导出，量一多就烦。第三方扫描 App 倒是一拍就正，可证件类资料要传它的服务器，还要看会员脸色。身份证照片我不想交给不认识的服务器，就在 Mac 上想办法本地解决。

## Vision 找纸，Core Image 拉正

macOS 自带 Vision 框架里有个 `VNDetectDocumentSegmentationRequest`，专门干「在一张照片里找出像纸的区域」这件事，iPhone 备忘录的「扫描文稿」底层检测就是它。我的方案就两步：

1. Vision 找出纸张的四个角
2. Core Image 的 `CIPerspectiveCorrection` 滤镜把四边形拉成矩形

Swift 写命令行工具不需要建 Xcode 工程，一个 .swift 文件直接跑。前提是装过 Command Line Tools（没装先跑 `xcode-select --install`）。

完整代码存成 `docscan.swift`：

```swift
#!/usr/bin/env swift
// docscan.swift —— 手机拍照转扫描件：Vision 找纸张边缘 + 透视拉正
// 用法: swift docscan.swift 输入图片 [输出图片] [--enhance]
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
guard args.count >= 2 else {
    print("用法: swift docscan.swift 输入图片 [输出图片] [--enhance]")
    exit(1)
}
let inputPath = args[1]
let outputPath = args.count >= 3 && !args[2].hasPrefix("--") ? args[2] : "scan.png"
let enhance = args.contains("--enhance")

// 读图，转成 CGImage
guard let img = NSImage(contentsOfFile: inputPath),
      let tiff = img.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let cgImage = rep.cgImage else {
    print("读不了图片: \(inputPath)")
    exit(1)
}

// 1. Vision 找文档四角
let request = VNDetectDocumentSegmentationRequest()
let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
do {
    try handler.perform([request])
} catch {
    print("识别失败: \(error)")
    exit(1)
}
guard let doc = request.results?.first else {
    print("没找到文档边缘。把纸放深色背景上拍，四角要拍全。")
    exit(1)
}

// 2. 坐标换算：Vision 是归一化坐标且原点在左下，像素坐标原点在左上
let ciImage = CIImage(cgImage: cgImage)
let W = ciImage.extent.width
let H = ciImage.extent.height

func toPixel(_ p: CGPoint) -> CGPoint {
    CGPoint(x: p.x * W, y: (1 - p.y) * H)
}

let params: [String: Any] = [
    "inputTopLeft": CIVector(cgPoint: toPixel(doc.topLeft)),
    "inputTopRight": CIVector(cgPoint: toPixel(doc.topRight)),
    "inputBottomLeft": CIVector(cgPoint: toPixel(doc.bottomLeft)),
    "inputBottomRight": CIVector(cgPoint: toPixel(doc.bottomRight))
]

// 3. 透视矫正；纸质件反光发灰时加个对比增强更像扫描件
var out = ciImage.applyingFilter("CIPerspectiveCorrection", parameters: params)
if enhance {
    out = out.applyingFilter("CIColorControls", parameters: [
        "inputContrast": 1.15,
        "inputSaturation": 0.8
    ])
}

// 4. 存成 PNG（要 PDF 用 sips 转：sips -s format pdf scan.png --out scan.pdf）
let ctx = CIContext()
try ctx.writePNGRepresentation(of: out, to: URL(fileURLWithPath: outputPath),
                               format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print("完成: \(outputPath)")
```

## 用法

单张：

```bash
chmod +x docscan.swift
./docscan.swift 拍的照片.jpg scan.png --enhance
```

`--enhance` 会加一点对比度，纸面反光发灰的时候输出更像扫描件。批量就把文件名交给 shell：

```bash
for f in *.jpg; do
  ./docscan.swift "$f" "scan-${f%.jpg}.png" --enhance
done
```

要 PDF 用 sips 转一下就行，不用改代码：

```bash
sips -s format pdf scan.png --out scan.pdf
```

## 踩过的坑

### 坑一：坐标原点是反的

Vision 返回的角点坐标是归一化小数（0~1），而且原点在左下角；图片像素坐标原点在左上角。我第一次直接拿 `x × 宽、y × 高` 去算，输出上下颠倒。正确换算是 `y′ = (1 − y) × 高`，关系见图：

![Vision 坐标转像素坐标示意](/img/docscan-coords.svg)

另外别自己拿 boundingBox 凑角点，`VNRectangleObservation` 直接给了 topLeft / topRight / bottomLeft / bottomRight 四个点，用现成的就行。

### 坑二：找不到纸

纸上内容太少、背景和纸颜色接近、纸没拍全，都会报「没找到文档边缘」。拍的时候把纸放深色桌面上、四角留出边，成功率明显高。白纸贴白墙拍大概率失败，别问我是怎么知道的。

### 坑三：电子截图不要矫正

手机截图、网页截图本来就是正的，跑透视矫正反而把边裁歪。截图类的我直接用，顶多加个对比度，不碰矫正。

## 现在的流程

手机拍 → AirDrop 到 Mac → 跑一下 → PNG 或 PDF 直接交。M 芯片上处理 iPhone 原图，识别加输出基本一秒内。对「拍得还行」的照片成功率很高；但整片反光、拍糊了救不回来，老老实实重拍——这工具解决的是「拍正了但透视歪」，不解决「没拍好」。

代码丢在 `~/bin/` 里，几十行，以后再要扫描件就是一条命令的事。全程照片不出本机，营业执照、身份证这类东西，交得放心点。
