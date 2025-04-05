// 自定义JavaScript - 让博客更加生动有趣

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 添加页面进入动画
  animateMainContent();
  
  // 为文章卡片添加鼠标悬停效果
  setupCardHoverEffects();
  
  // 为标题添加点击特效
  setupTitleClickEffects();
  
  // 添加回到顶部按钮的平滑滚动
  setupSmoothScrolling();
  
  // 为代码块添加复制提示效果
  enhanceCodeBlocks();
  
  // 添加图片点击放大效果
  setupImageZoom();
  
  // 添加页面离开提示
  setupPageLeaveMessage();
});

// 主内容区域的进入动画
function animateMainContent() {
  const mainContent = document.querySelector('.container');
  if (mainContent) {
    mainContent.style.opacity = '0';
    mainContent.style.transform = 'translateY(20px)';
    mainContent.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    
    setTimeout(() => {
      mainContent.style.opacity = '1';
      mainContent.style.transform = 'translateY(0)';
    }, 200);
  }
}

// 为文章卡片添加鼠标悬停效果
function setupCardHoverEffects() {
  const cards = document.querySelectorAll('.index-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-8px)';
      this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.1)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.05)';
    });
  });
}

// 为标题添加点击特效
function setupTitleClickEffects() {
  const titles = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  titles.forEach(title => {
    title.addEventListener('click', function(e) {
      // 创建波纹效果
      const ripple = document.createElement('span');
      ripple.classList.add('title-ripple');
      this.appendChild(ripple);
      
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      
      setTimeout(() => {
        ripple.remove();
      }, 1000);
    });
  });
}

// 添加平滑滚动效果
function setupSmoothScrolling() {
  const scrollToTopBtn = document.querySelector('#scroll-top-button');
  if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
  
  // 为所有内部链接添加平滑滚动
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
}

// 增强代码块功能
function enhanceCodeBlocks() {
  const codeBlocks = document.querySelectorAll('pre code');
  
  codeBlocks.forEach(block => {
    // 添加语言标签
    const language = block.className.split('-')[1];
    if (language) {
      const languageTag = document.createElement('div');
      languageTag.classList.add('code-language-tag');
      languageTag.textContent = language.toUpperCase();
      block.parentNode.insertBefore(languageTag, block);
    }
    
    // 添加复制成功提示
    const copyBtn = block.parentNode.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        const originalText = this.textContent;
        this.textContent = '复制成功！';
        
        setTimeout(() => {
          this.textContent = originalText;
        }, 1500);
      });
    }
  });
}

// 图片点击放大效果
function setupImageZoom() {
  const contentImages = document.querySelectorAll('.markdown-body img');
  
  contentImages.forEach(img => {
    img.addEventListener('click', function() {
      // 创建遮罩层
      const overlay = document.createElement('div');
      overlay.classList.add('image-zoom-overlay');
      document.body.appendChild(overlay);
      
      // 创建放大的图片
      const zoomedImg = document.createElement('img');
      zoomedImg.src = this.src;
      zoomedImg.classList.add('zoomed-image');
      overlay.appendChild(zoomedImg);
      
      // 添加关闭功能
      overlay.addEventListener('click', function() {
        this.remove();
      });
      
      // 阻止滚动
      document.body.style.overflow = 'hidden';
      
      // 添加关闭按钮
      const closeBtn = document.createElement('button');
      closeBtn.classList.add('zoom-close-btn');
      closeBtn.innerHTML = '&times;';
      overlay.appendChild(closeBtn);
      
      closeBtn.addEventListener('click', function() {
        overlay.remove();
        document.body.style.overflow = '';
      });
    });
  });
}

// 页面离开提示
function setupPageLeaveMessage() {
  const links = document.querySelectorAll('a[href^="http"]');
  
  links.forEach(link => {
    // 排除本站链接
    if (!link.href.includes(window.location.hostname)) {
      link.addEventListener('click', function(e) {
        const target = this.getAttribute('target');
        if (!target || target !== '_blank') {
          const message = '您即将离开本站，是否继续？';
          if (!confirm(message)) {
            e.preventDefault();
          }
        }
      });
    }
  });
}

// 为自定义样式添加必要的CSS
function addCustomStyles() {
  const customStyles = document.createElement('style');
  customStyles.textContent = `
    .title-ripple {
      position: absolute;
      background: rgba(79, 172, 254, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 1s linear;
      pointer-events: none;
      width: 100px;
      height: 100px;
    }
    
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    .code-language-tag {
      position: absolute;
      top: 0;
      right: 0;
      background: #4facfe;
      color: white;
      padding: 2px 8px;
      font-size: 12px;
      border-radius: 0 5px 0 5px;
    }
    
    .image-zoom-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    
    .zoomed-image {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border: 5px solid white;
      border-radius: 5px;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
    }
    
    .zoom-close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      background: white;
      color: black;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `;
  
  document.head.appendChild(customStyles);
}

// 初始化自定义样式
addCustomStyles();

// 添加打字机效果（如果页面上有指定元素）
function typeWriter(element, text, speed) {
  let i = 0;
  element.innerHTML = '';
  
  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  
  type();
}

// 为特定元素添加打字机效果
const typingElements = document.querySelectorAll('.typing-effect');
typingElements.forEach(element => {
  const originalText = element.textContent;
  typeWriter(element, originalText, 100);
});