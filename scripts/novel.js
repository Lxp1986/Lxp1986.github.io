'use strict'

const urlFor = require('hexo-util').url_for.bind(hexo)

function getChapters (site, novelSlug) {
  return site.posts
    .filter(post => post.novel_slug === novelSlug)
    .sort('chapter', 1)
    .toArray()
}

hexo.extend.helper.register('novel_chapters', function (novelSlug) {
  return getChapters(this.site, novelSlug)
})

hexo.extend.helper.register('novel_latest_chapter', function (novelSlug) {
  const chapters = getChapters(this.site, novelSlug)
  return chapters.length ? chapters[chapters.length - 1] : null
})

hexo.extend.helper.register('novel_recent_updates', function (limit) {
  const size = limit || 8
  return this.site.posts
    .toArray()
    .filter(post => post.novel_slug)
    .sort((a, b) => b.date - a.date)
    .slice(0, size)
})

hexo.extend.helper.register('novel_nav', function (post) {
  if (!post.novel_slug) return null

  const chapters = getChapters(this.site, post.novel_slug)
  const index = chapters.findIndex(item => item.path === post.path)
  const novel = this.site.data.novels[post.novel_slug] || {}
  const tocPath = `/novels/${post.novel_slug}/`

  return {
    toc: urlFor(tocPath),
    tocTitle: novel.title || post.novel || post.series,
    prev: index > 0 ? chapters[index - 1] : null,
    next: index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null,
    current: post.chapter,
    total: chapters.length
  }
})

function buildNavHtml (nav) {
  if (!nav) return ''

  const prevBlock = nav.prev
    ? `<a class="novel-chapter-nav__link novel-chapter-nav__prev" href="${nav.prev.path}"><span class="novel-chapter-nav__label">上一章</span><span class="novel-chapter-nav__title">${nav.prev.title}</span></a>`
    : '<span class="novel-chapter-nav__placeholder"></span>'

  const nextBlock = nav.next
    ? `<a class="novel-chapter-nav__link novel-chapter-nav__next" href="${nav.next.path}"><span class="novel-chapter-nav__label">下一章</span><span class="novel-chapter-nav__title">${nav.next.title}</span></a>`
    : '<span class="novel-chapter-nav__placeholder"></span>'

  return `<nav class="novel-chapter-nav" role="navigation" aria-label="章节导航">${prevBlock}<a class="novel-chapter-nav__toc" href="${nav.toc}"><i class="fas fa-list"></i><span>${nav.tocTitle} · 目录</span><span class="novel-chapter-nav__progress">第 ${nav.current} / ${nav.total} 章</span></a>${nextBlock}</nav>`
}

function getNovelNav (post) {
  if (!post.novel_slug) return null

  const posts = hexo.locals.get('posts')
  if (!posts) return null

  const chapters = posts
    .filter(item => item.novel_slug === post.novel_slug)
    .sort('chapter', 1)
    .toArray()
  const index = chapters.findIndex(item => item.source === post.source)
  const novelData = hexo.model('Data').findOne({ _id: 'novels' })
  const novel = novelData && novelData[post.novel_slug]

  return {
    toc: urlFor(`/novels/${post.novel_slug}/`),
    tocTitle: (novel && novel.title) || post.novel || post.series,
    prev: index > 0 ? { title: chapters[index - 1].title, path: urlFor(chapters[index - 1].path) } : null,
    next: index >= 0 && index < chapters.length - 1
      ? { title: chapters[index + 1].title, path: urlFor(chapters[index + 1].path) }
      : null,
    current: post.chapter,
    total: chapters.length
  }
}

hexo.extend.helper.register('novel_list', function () {
  return this.site.data.novels || {}
})

hexo.extend.helper.register('novel_meta', function (novelSlug) {
  return this.site.data.novels && this.site.data.novels[novelSlug] || null
})

hexo.extend.filter.register('before_post_render', data => {
  if (!data.novel_slug || data.layout !== 'post') return data

  data.prev = null
  data.next = null

  const nav = getNovelNav(data)
  const navHtml = buildNavHtml(nav)
  if (navHtml) {
    data.content = `${navHtml}\n${data.content}\n${navHtml}`
  }

  return data
})

hexo.extend.generator.register('index', function (locals) {
  const { config } = this
  const paginationDir = config.pagination_dir || 'page'
  const posts = locals.posts.filter(post => !post.novel_slug).sort('-date')
  const pagination = require('hexo-pagination')

  return pagination('index', posts, {
    perPage: config.index_generator.per_page || 10,
    layout: 'index',
    path: 'index.html',
    format: paginationDir === '' ? 'index.html' : `${paginationDir}/%d/`
  })
})