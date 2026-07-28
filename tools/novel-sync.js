#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const CONFIG_PATH = path.join(__dirname, 'novel-sync.config.json')

function sanitizeName (name) {
  return name.replace(/[「」"'""]/g, '').trim()
}

function chapterSlug (num, chapterName, titleSlugs) {
  const padded = String(num).padStart(2, '0')
  const clean = sanitizeName(chapterName)
  const slug = titleSlugs[clean] || titleSlugs[chapterName] || clean
    .toLowerCase()
    .replace(/[　\s·]+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/gi, '')
    .replace(/^-+|-+$/g, '')
  return `${padded}-${slug || 'chapter'}`
}

function normalizeBody (body) {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const output = []
  let paragraph = []
  let inFence = false

  const flushParagraph = () => {
    if (!paragraph.length) return
    output.push(paragraph.join('').trim())
    paragraph = []
  }

  const isStandaloneMarkdown = line => (
    /^#{1,6}\s/.test(line) ||
    /^---+$/.test(line) ||
    /^[-*+]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^>\s?/.test(line) ||
    /^(?:"[^"]*"|“[^”]*”|「[^」]*」|『[^』]*』)$/.test(line)
  )

  for (const rawLine of lines) {
    const hasExplicitBreak = / {2,}$/.test(rawLine)
    const line = rawLine.trim().replace(/^　+/, '')

    if (/^```/.test(line)) {
      flushParagraph()
      output.push(line)
      inFence = !inFence
      continue
    }

    if (inFence) {
      output.push(rawLine)
      continue
    }

    if (!line) {
      flushParagraph()
      if (output.length && output[output.length - 1] !== '') output.push('')
      continue
    }

    if (isStandaloneMarkdown(line)) {
      flushParagraph()
      output.push(line)
      continue
    }

    paragraph.push(line)
    if (hasExplicitBreak) {
      flushParagraph()
      output[output.length - 1] += '  '
    }
  }

  flushParagraph()
  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function firstParagraph (body) {
  const line = normalizeBody(body).split('\n').map(s => s.trim()).find(s => {
    if (!s.length) return false
    if (/^---+$/.test(s)) return false
    if (/^#{1,6}\s/.test(s)) return false
    return true
  }) || ''
  return line.replace(/^　+/, '').replace(/\*\*/g, '').slice(0, 80)
}

// # 一级标题 = 独立章节；## 二级标题 = 章内分节，保留在正文中
function parseChapters (text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const partRe = /^#\s*(\d+)\.(.+)$/
  const chapters = []
  let current = null

  for (const line of lines) {
    const match = line.match(partRe)
    if (match) {
      if (current) chapters.push(current)
      const num = parseInt(match[1], 10)
      const name = sanitizeName(match[2])
      current = {
        num,
        name,
        title: `${match[1]}.${name}`,
        lines: []
      }
      continue
    }
    if (current) current.lines.push(line)
  }
  if (current) chapters.push(current)

  return chapters
    .map(ch => ({
      num: ch.num,
      name: ch.name,
      title: ch.title,
      body: ch.lines.join('\n').trim().replace(/^(?:---\s*\n)+/, '')
    }))
    .sort((a, b) => a.num - b.num)
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
  return normalizeBody(body)
}

function filenameFor (chapter) {
  return `重生-第${String(chapter.num).padStart(2, '0')}章-${chapter.name}.md`
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

  let manifest = {}
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  }

  const sourceText = fs.readFileSync(sourcePath, 'utf8')
  const chapters = parseChapters(sourceText)

  if (!chapters.length) {
    console.error('未在源文件中找到章节（# 1.标题）')
    process.exit(1)
  }

  const results = { created: [], updated: [], unchanged: [] }
  const nextManifest = {}

  for (const chapter of chapters) {
    const key = String(chapter.num)
    let entry = manifest[key]

    if (!entry || entry.title !== chapter.title) {
      const slug = chapterSlug(chapter.num, chapter.name, config.title_slugs || {})
      entry = {
        filename: filenameFor(chapter),
        permalink: `novels/${config.novel_slug}/${slug}/`,
        title: chapter.title,
        date: (entry && entry.date) || new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
      if (!manifest[key]) console.log(`+ 新章节：${chapter.title}`)
      else console.log(`~ 章节调整：${manifest[key].title} → ${chapter.title}`)
      console.log(`  链接：/${entry.permalink}`)
    }

    nextManifest[key] = entry

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

  fs.writeFileSync(manifestPath, JSON.stringify(nextManifest, null, 2) + '\n', 'utf8')

  const filenames = new Set(Object.values(nextManifest).map(e => e.filename))
  for (const file of fs.readdirSync(postsDir)) {
    if (!file.startsWith('重生-') || !file.endsWith('.md')) continue
    if (!filenames.has(file)) {
      fs.unlinkSync(path.join(postsDir, file))
      console.log(`- 移除旧章节：${file}`)
    }
  }

  console.log('\n同步完成')
  if (results.created.length) console.log(`  新建：${results.created.join('、')}`)
  if (results.updated.length) console.log(`  更新：${results.updated.join('、')}`)
  if (results.unchanged.length) console.log(`  无变化：${results.unchanged.join('、')}`)
  console.log(`  共 ${chapters.length} 章（# 一级标题）`)
  const sections = (sourceText.match(/^##\s/gm) || []).length
  if (sections) console.log(`  第2章内含 ${sections} 个分节（## 二级标题，保留在正文中）`)
  console.log('\n本地预览：npm run novel:preview')
}

main()
