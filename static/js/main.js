/* ─────────────────────────────────────────────
   RAG ACADEMY - Interactive JavaScript
   Every function is commented so you learn!
   ───────────────────────────────────────────── */

// ─── Flash Messages Auto-Dismiss ───
document.addEventListener('DOMContentLoaded', function() {
    // Click any flash message to dismiss it
    document.querySelectorAll('.flash-message').forEach(function(msg) {
        msg.addEventListener('click', function() {
            this.style.opacity = '0';
            setTimeout(() => this.remove(), 300);
        });
        // Auto-dismiss after 5 seconds
        setTimeout(function() {
            if (msg.parentNode) {
                msg.style.opacity = '0';
                setTimeout(() => msg.remove(), 300);
            }
        }, 5000);
    });
});

// ─── Copy Code Button ───
function setupCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            // Find the <code> or <pre> element sibling
            var codeBlock = this.closest('.code-block-wrapper')
                .querySelector('pre code, pre');
            var text = codeBlock ? codeBlock.textContent : '';

            navigator.clipboard.writeText(text).then(function() {
                var originalText = btn.textContent;
                btn.textContent = 'Copied!';
                btn.style.background = 'rgba(5, 150, 105, 0.3)';
                btn.style.color = '#a7f3d0';
                setTimeout(function() {
                    btn.textContent = originalText;
                    btn.style.background = '';
                    btn.style.color = '';
                }, 2000);
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', setupCopyButtons);

// ─── Interactive Code Playground ───
function runPlayground() {
    var textarea = document.getElementById('html-input');
    var output = document.getElementById('preview-frame');

    if (!textarea || !output) return;

    var html = textarea.value;

    // Wrap in a full HTML document if just tags
    if (!html.trim().startsWith('<!DOCTYPE')) {
        html = '<!DOCTYPE html>\n<html>\n<head>\n' +
            '<meta charset="UTF-8">\n' +
            '<style>\n' +
            '  body { font-family: Arial; padding: 20px; }\n' +
            '</style>\n</head>\n<body>\n' +
            html + '\n</body>\n</html>';
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

// ─── SQL Playground ───
function runQuery() {
    var queryInput = document.getElementById('sql-query');
    if (!queryInput) return;

    // Submit the form to execute the SQL query
    var form = queryInput.closest('form');
    if (form) form.submit();
}

// ─── Data Flow Animation ───
function animateDataFlow() {
    var boxes = document.querySelectorAll('.flow-box');
    if (boxes.length === 0) return;

    var current = 0;

    function activateNext() {
        // Remove active from all
        boxes.forEach(function(box) {
            box.classList.remove('active');
        });

        // Activate current
        boxes[current].classList.add('active');

        // Move to next
        current = (current + 1) % boxes.length;
    }

    // Start animation
    setInterval(activateNext, 800);
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.flow-diagram')) {
        animateDataFlow();
    }
});

// ─── Preview Form Data (shows what gets sent) ───
function previewFormData() {
    var form = document.getElementById('data-flow-form');
    var preview = document.getElementById('form-data-preview');
    if (!form || !preview) return;

    var formData = new FormData(form);
    var data = {};
    formData.forEach(function(value, key) {
        data[key] = value;
    });

    preview.textContent = JSON.stringify(data, null, 2);
    preview.style.display = 'block';
}

// ─── Live Typing Effect for Code Examples ───
function typeCode(elementId, code, speed) {
    var element = document.getElementById(elementId);
    if (!element) return;

    var index = 0;
    element.textContent = '';

    function type() {
        if (index < code.length) {
            element.textContent += code.charAt(index);
            index++;
            setTimeout(type, speed || 10);
        }
    }

    type();
}

// ─── Tab Switching ───
function switchTab(tabGroup, tabName) {
    // Hide all tab contents in this group
    document.querySelectorAll('.' + tabGroup + '-content').forEach(function(el) {
        el.style.display = 'none';
    });

    // Deactivate all tabs in this group
    document.querySelectorAll('.' + tabGroup + '-tab').forEach(function(el) {
        el.classList.remove('active');
    });

    // Show selected content
    var content = document.getElementById(tabGroup + '-' + tabName);
    if (content) content.style.display = 'block';

    // Activate selected tab
    var tab = document.querySelector('.' + tabGroup + '-tab[data-tab="' + tabName + '"]');
    if (tab) tab.classList.add('active');
}

// ─── Check All Checkboxes (for progress tracking) ───
function toggleAllCheckboxes(source) {
    var checkboxes = document.querySelectorAll('.progress-checkbox');
    checkboxes.forEach(function(cb) {
        cb.checked = source.checked;
    });
}

// ─── Live Preview for Lesson Editor ───
document.addEventListener('DOMContentLoaded', function() {
    var htmlInput = document.getElementById('html-input');
    if (htmlInput) {
        htmlInput.addEventListener('input', function() {
            // Debounce: wait 300ms after user stops typing
            clearTimeout(this._timer);
            this._timer = setTimeout(runPlayground, 300);
        });
        // Run initial preview
        setTimeout(runPlayground, 100);
    }
});

// ─── Progress Tracker ───
function updateProgress(lessonId, completed) {
    fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, completed: completed })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            // Update progress bar
            var bar = document.getElementById('progress-bar');
            if (bar) {
                bar.style.width = data.percent + '%';
                bar.textContent = data.percent + '%';
            }
        }
    })
    .catch(function(err) { console.error('Progress update failed:', err); });
}

console.log('RAG Academy loaded! Ready to learn.');
