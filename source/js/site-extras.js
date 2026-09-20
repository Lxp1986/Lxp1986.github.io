(() => {
  const FALLBACK = '—'

  const isUnresolved = (el) => {
    if (!el) return false
    if (el.querySelector('.fa-spinner')) return true
    const text = (el.textContent || '').replace(/\s+/g, '')
    return text === ''
  }

  const settleCounters = () => {
    ;[
      'busuanzi_value_site_uv',
      'busuanzi_value_site_pv',
      'busuanzi_value_page_pv',
      'umami-site-uv',
      'umami-site-pv'
    ].forEach((id) => {
      const el = document.getElementById(id)
      if (isUnresolved(el)) el.textContent = FALLBACK
    })

    document.querySelectorAll('.waline-pageview-count, .waline-comment-count, #umamiPV').forEach((el) => {
      if (isUnresolved(el)) el.textContent = FALLBACK
    })
  }

  const start = () => setTimeout(settleCounters, 5000)
  document.addEventListener('pjax:complete', start)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start)
  } else {
    start()
  }
})()
