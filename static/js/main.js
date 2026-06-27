/* ─────────────────────────────────────────────
   RAG ACADEMY — Main JavaScript
   Vanilla JS, no frameworks, under 400 lines.
   Every section is commented so you learn.
   ───────────────────────────────────────────── */

/* ==================================================================
   1. THEME TOGGLE
   Toggles data-theme on <html> between 'light' and 'dark'.
   Persists choice to localStorage key 'clay-theme'.
   The button shows 🌙 in light mode, ☀️ in dark mode.
   ================================================================== */
(function initThemeToggle() {
  var toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  var html = document.documentElement;

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('clay-theme', theme);
    toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // Initialize icon to match current theme (set by inline <script> in <head>)
  var current = html.getAttribute('data-theme') || 'light';
  toggle.textContent = current === 'dark' ? '☀️' : '🌙';

  toggle.addEventListener('click', function () {
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });
})();

/* ==================================================================
   2. SCROLL-TRIGGERED REVEAL ANIMATIONS
   IntersectionObserver watches elements with class .clay-scroll-reveal.
   When they enter the viewport, adds .is-visible (CSS handles the
   actual animation). Root margin pulls the trigger 50px before the
   element would normally become visible for a smoother feel.
   ================================================================== */
(function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    // Graceful fallback: show everything immediately
    document.querySelectorAll('.clay-scroll-reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Stop observing once revealed — each element animates only once
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -50px 0px', threshold: 0.1 }
  );

  document.querySelectorAll('.clay-scroll-reveal').forEach(function (el) {
    observer.observe(el);
  });
})();

/* ==================================================================
   3. ACTIVE NAV LINK HIGHLIGHTING
   On page load, checks window.location.pathname and adds class 'active'
   to the matching link inside .clay-nav__links.
   ================================================================== */
(function initActiveNav() {
  var links = document.querySelectorAll('.clay-nav__links a');
  if (links.length === 0) return;

  var path = window.location.pathname;

  // Map path prefixes to link text content (case-insensitive match)
  var routeMap = {
    '/':              'Home',
    '/lessons':       'Lessons',
    '/python-playground': 'Python',
    '/database':      'Database',
    '/data-flow':     'Data Flow',
    '/rag-demo':      'RAG Demo',
    '/resources':     'Resources'
  };

  // Walk the routeMap keys (longer paths first so /lessons matches before /)
  var keys = Object.keys(routeMap).sort(function (a, b) {
    return b.length - a.length;
  });

  // Normalise path by stripping trailing slash (except root)
  var normalised = path;
  if (normalised.length > 1 && normalised.endsWith('/')) {
    normalised = normalised.slice(0, -1);
  }

  var matchLabel = null;
  for (var i = 0; i < keys.length; i++) {
    if (normalised === keys[i] || (keys[i] !== '/' && normalised.startsWith(keys[i]))) {
      matchLabel = routeMap[keys[i]];
      break;
    }
  }

  if (!matchLabel) return;

  links.forEach(function (link) {
    if (link.textContent.trim() === matchLabel) {
      link.classList.add('active');
    }
  });
})();

/* ==================================================================
   4. FLASH MESSAGE AUTO-DISMISS
   Click to dismiss any .flash-message. Auto-dismiss after 5 seconds
   with a fade-out. Uses the existing clay-alert classes for styling.
   ================================================================== */
(function initFlashMessages() {
  var messages = document.querySelectorAll('.flash-message');
  if (messages.length === 0) return;

  messages.forEach(function (msg) {
    // Click to dismiss
    msg.addEventListener('click', function () {
      dismiss(msg);
    });

    // Auto-dismiss after 5 seconds
    setTimeout(function () {
      if (msg.parentNode) dismiss(msg);
    }, 5000);
  });

  function dismiss(el) {
    el.style.transition = 'opacity 0.3s ease';
    el.style.opacity = '0';
    setTimeout(function () {
      if (el.parentNode) el.remove();
    }, 300);
  }
})();

/* ==================================================================
   5. COPY CODE BUTTONS
   Clicking a .clay-code-block__copy button copies the text from its
   sibling <pre> or <code> element. Shows 'Copied!' feedback for 2 s.
   ================================================================== */
(function initCopyButtons() {
  var buttons = document.querySelectorAll('.clay-code-block__copy');
  if (buttons.length === 0) return;

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      // Find the code container — the button lives inside .clay-code-block
      var block = btn.closest('.clay-code-block');
      if (!block) return;

      var code = block.querySelector('pre code, pre');
      var text = code ? code.textContent : '';

      navigator.clipboard.writeText(text).then(function () {
        var original = btn.textContent;
        btn.textContent = 'Copied!';
        var oldBg = btn.style.background;
        var oldColor = btn.style.color;
        btn.style.background = 'rgba(5, 150, 105, 0.3)';
        btn.style.color = '#a7f3d0';

        setTimeout(function () {
          btn.textContent = original;
          btn.style.background = oldBg;
          btn.style.color = oldColor;
        }, 2000);
      }).catch(function () {
        // Clipboard API may fail in insecure contexts — silently ignore
      });
    });
  });
})();

/* ==================================================================
   6. DATA FLOW ANIMATION
   Cycles through .clay-flow__box elements, adding/removing .active
   to create a sequential "data flowing" highlight effect.
   Only activates when a .flow-diagram wrapper is present.
   ================================================================== */
(function initDataFlowAnimation() {
  var diagram = document.querySelector('.flow-diagram');
  if (!diagram) return;

  var boxes = diagram.querySelectorAll('.clay-flow__box');
  if (boxes.length === 0) return;

  var current = 0;

  setInterval(function () {
    boxes.forEach(function (box) { box.classList.remove('active'); });
    boxes[current].classList.add('active');
    current = (current + 1) % boxes.length;
  }, 800);
})();

/* ==================================================================
   7. LESSON SEARCH / FILTER
   On the lessons page, listens for input on #lesson-search and hides
   lesson cards whose title text doesn't match the query.
   ================================================================== */
(function initLessonSearch() {
  var searchInput = document.getElementById('lesson-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', function () {
    var query = searchInput.value.toLowerCase().trim();
    var cards = document.querySelectorAll('.lesson-card');

    cards.forEach(function (card) {
      // The lesson title lives inside a <strong> element within the card
      var titleEl = card.querySelector('strong');
      var title = titleEl ? titleEl.textContent.toLowerCase() : '';
      card.style.display = (!query || title.indexOf(query) !== -1) ? '' : 'none';
    });
  });
})();

/* ==================================================================
   8. SMOOTH SCROLL (JS FALLBACK)
   CSS already uses scroll-behavior: smooth, but this provides a JS
   fallback for older browsers. Intercepts anchor-link clicks.
   ================================================================== */
(function initSmoothScroll() {
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    var targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;

    var target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();

/* ==================================================================
   9. CODE PLAYGROUND — Live HTML Preview
   Preserved from the original. Reads #html-input, renders it inside
   an iframe within #preview-frame so users can see their HTML live.
   Called by the "▶ Run" button in playground.html.
   ================================================================== */
function runPlayground() {
  var textarea = document.getElementById('html-input');
  var output = document.getElementById('preview-frame');
  if (!textarea || !output) return;

  var html = textarea.value;

  // Wrap bare HTML in a complete document if it isn't already one
  if (!html.trim().startsWith('<!DOCTYPE')) {
    html =
      '<!DOCTYPE html>\n<html>\n<head>\n' +
      '<meta charset="UTF-8">\n' +
      '<style>\n' +
      '  body { font-family: Arial; padding: 20px; }\n' +
      '</style>\n</head>\n<body>\n' +
      html +
      '\n</body>\n</html>';
  }

  var iframe = output.querySelector('iframe') || document.createElement('iframe');
  if (!output.querySelector('iframe')) {
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    output.appendChild(iframe);
  }

  var blob = new Blob([html], { type: 'text/html' });
  iframe.src = URL.createObjectURL(blob);
}

// Auto-preview debounce on the playground page
(function initPlaygroundLivePreview() {
  var htmlInput = document.getElementById('html-input');
  if (!htmlInput) return;

  htmlInput.addEventListener('input', function () {
    clearTimeout(this._timer);
    this._timer = setTimeout(runPlayground, 300);
  });
  // Initial render
  setTimeout(runPlayground, 100);
})();
