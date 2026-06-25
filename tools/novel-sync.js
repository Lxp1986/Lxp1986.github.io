#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const CONFIG_PATH = path.join(__dirname, 'novel-sync.config.json')

const CN_NUM = {
  零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4,
  五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10
}

function parseChineseNumber (raw) {
  if (/^\d+$/.test(raw)) return parseInt(raw, 10)
  if (raw.length === 1 && CN_NUM[raw] !== undefined) return CN_NUM[raw]
  if (raw.startsWith('十')) {
    const tail = raw.slice(1)
    return 10 + (tail ? (CN_NUM[tail] || 0) : 0)
  }
  if (raw.endsWith('十')) {
    const head = raw.slice(0, -1)
    return (CN_NUM[head] || 0) * 10
  }
  const tenIdx = raw.indexOf('十')
  if (tenIdx > 0) {
    const head = raw.slice(0, tenIdx)
    const tail = raw.slice(tenIdx + 1)
    return (CN_NUM[head] || 0) * 10 + (CN_NUM[tail] || 0)
  }
  return null
}

function chapterSlug (num, chapterName, titleSlugs) {
  const padded = String(num).padStart(2, '0')
  const slug = titleSlugs[chapterName] || chapterName
    .toLowerCase()
    .replace(/[　\s]+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/gi, '')
    .replace(/^-+|-+$/g, '')
  return `${padded}-${slug || 'chapter'}`
}

function firstParagraph (body) {
  const line = body.split('\n').map(s => s.trim()).find(s => s.length > 0) || ''
  return line.replace(/^　+/, '').slice(0, 80)
}

function parseChapters (text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const headingRe = /^##\s*第([一二三四五六七八九十百千零〇两\d]+)章[　\s]*(.*)$/
  const chapters = []
  let current = null

  for (const line of lines) {
    const match = line.match(headingRe)
    if (match) {
      if (current) chapters.push(current)
      const num = parseChineseNumber(match[1])
      if (!num) throw new Error(`无法解析章节号：${match[1]}`)
      current = {
        num,
        name: match[2].trim(),
        lines: []
      }
      continue
    }
    if (current) current.lines.push(line)
  }
  if (current) chapters.push(current)

  return chapters.map(ch => ({
    num: ch.num,
    name: ch.name,
    title: `第${String(ch.num).padStart(2, '0')}章 ${ch.name}`,
    body: ch.lines.join('\n').trim()
  }))
}

function readFrontMatter (filePath) {
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf8')
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return null
  return { meta: match[1], body: match[2] }
}

function buildFrontMatter (config, chapter, manifestEntry) {
  const date = manifestEntry.date || new Date().toISOString().slice(0, 19).replace('T', ' ')
  const description = firstParagraph(chapter.body)

  return [
    '---',
    `title: ${chapter.title}`,
    `date: ${date}`,
    'categories:',
    '  - 小说',
    'tags:',
    ...config.tags.map(tag => `  - ${tag}`),
    `series: ${config.series}`,
    `novel: ${config.novel}`,
    `novel_slug: ${config.novel_slug}`,
    `chapter: ${chapter.num}`,
    'layout: post',
    `permalink: ${manifestEntry.permalink}`,
    `description: ${description}`,
    'toc: false',
    'cover: false',
    'top_img: false',
    'aside: true',
    '---',
    ''
  ].join('\n')
}

function ensureIndent (body) {
  return body.split('\n').map(line => {
    if (!line.trim()) return ''
    if (line.startsWith('　')) return line
    return `　　${line.trim()}`
  }).join('\n')
}

function main () {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  const sourcePath = config.source
  const postsDir = path.join(ROOT, config.posts_dir)
  const manifestPath = path.join(ROOT, config.manifest)

  if (!fs.existsSync(sourcePath)) {
    console.error(`找不到源文件：${sourcePath}`)
    console.error('请确认 One-Markdown 已同步到本机 iCloud。')
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const sourceText = fs.readFileSync(sourcePath, 'utf8')
  const chapters = parseChapters(sourceText)

  if (!chapters.length) {
    console.error('未在源文件中找到章节（## 第一章　标题）')
    process.exit(1)
  }

  const results = { created: [], updated: [], unchanged: [] }

  for (const chapter of chapters) {
    const key = String(chapter.num)
    let entry = manifest[key]

    if (!entry) {
      const slug = chapterSlug(chapter.num, chapter.name, config.title_slugs || {})
      entry = {
        filename: `重生-第${String(chapter.num).padStart(2, '0')}章-${chapter.name}.md`,
        permalink: `novels/${config.novel_slug}/${slug}/`,
        title: chapter.title,
        date: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
      manifest[key] = entry
      console.log(`+ 新章节：${chapter.title}`)
      if (!config.title_slugs || !config.title_slugs[chapter.name]) {
        console.log(`  提示：可在 scripts/novel-sync.config.json 的 title_slugs 里为「${chapter.name}」设置英文 slug`)
      }
    }

    const filePath = path.join(postsDir, entry.filename)
    const body = ensureIndent(chapter.body)
    const nextContent = buildFrontMatter(config, chapter, entry) + body + '\n'
    const prev = readFrontMatter(filePath)

    if (prev && prev.body.trim() === body.trim()) {
      results.unchanged.push(entry.filename)
      continue
    }

    fs.writeFileSync(filePath, nextContent, 'utf8')
    if (prev) results.updated.push(entry.filename)
    else results.created.push(entry.filename)
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')

  console.log('\n同步完成')
  if (results.created.length) console.log(`  新建：${results.created.join('、')}`)
  if (results.updated.length) console.log(`  更新：${results.updated.join('、')}`)
  if (results.unchanged.length) console.log(`  无变化：${results.unchanged.join('、')}`)
  console.log(`  共 ${chapters.length} 章`)
  console.log('\n本地预览：npm run novel:preview')
}

main()