(function () {
    if (window.__KarotterFixV30Installed) return;
    window.__KarotterFixV30Installed = true;

    const DEFAULT_SETTINGS = {
        widthFix:          true,
        modalResize:       true,
        mentionFix:        true,
        scrollBtns:        true,
        keyboardShortcuts: true,
        twitterBtn:        true,
    };

    let settings = { ...DEFAULT_SETTINGS };

    let scrollBtnContainer = null;
    let hasBoundKeyboard   = false;
    let isDragging         = false;
    let dragOffsetX        = 0;
    let dragOffsetY        = 0;

    const STORAGE_KEY     = 'karotter-scroll-btn-position-v1';
    const SCROLL_DURATION = 160;

    // ── 設定変更メッセージ受信 ────────────────────────────────────────────
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === 'SETTINGS_UPDATED') {
            settings = msg.settings;
            if (!settings.scrollBtns) removeScrollBtns();
            applyAll();
        }
    });

    // ── スクロールボタン位置保存/復元 ─────────────────────────────────────
    function loadPosition() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const pos = JSON.parse(raw);
            if (typeof pos?.left === 'number' && typeof pos?.top === 'number') return pos;
        } catch (_) {}
        return null;
    }

    function savePosition(left, top) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ left, top })); } catch (_) {}
    }

    // ── スクロール対象取得 ────────────────────────────────────────────────
    function getScrollTarget() {
        if (location.pathname.match(/^\/dm\/.+/)) {
            const dmArea = [...document.querySelectorAll('div.overflow-y-auto')]
                .filter(el => {
                    const r = el.getBoundingClientRect();
                    return r.width >= 200 && r.height >= 200 && r.left >= 350 &&
                           el.scrollHeight > el.clientHeight;
                })
                .sort((a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left)[0];
            if (dmArea) return dmArea;
        }
        const main = document.querySelector('div.overflow-x-hidden.overflow-y-auto');
        if (main) return main;
        return document.scrollingElement || document.documentElement;
    }

    function scrollToTarget(target, top, duration = SCROLL_DURATION) {
        const el     = !target || target === window
            ? document.scrollingElement || document.documentElement
            : target;
        const start  = el.scrollTop;
        const change = top - start;
        if (Math.abs(change) < 2 || duration <= 0) { el.scrollTop = top; return; }
        const startTime = performance.now();
        function animate(now) {
            const p = Math.min((now - startTime) / duration, 1);
            el.scrollTop = start + change * (1 - Math.pow(1 - p, 3));
            if (p < 1) requestAnimationFrame(animate);
            else el.scrollTop = top;
        }
        requestAnimationFrame(animate);
    }

    function shouldShowScrollBtns() {
        const p = location.pathname;
        return p === '/' || p.startsWith('/dm') || p.startsWith('/notifications');
    }

    // ── キーボードショートカット (Shift+↑/↓ のみ) ────────────────────────
    function bindKeyboardShortcuts() {
        if (hasBoundKeyboard) return;
        hasBoundKeyboard = true;

        function normalizeEvent(e) {
            let key = '';

            if (e.ctrlKey)  key += 'Ctrl+';
            if (e.shiftKey) key += 'Shift+';
            if (e.altKey)   key += 'Alt+';

            key += e.key;

            return key;
        }

        document.addEventListener('keydown', (e) => {
            if (!settings.keyboardShortcuts) return;

            const tag = document.activeElement?.tagName;

            const editing =
                tag === 'INPUT' ||
                tag === 'TEXTAREA' ||
                document.activeElement?.isContentEditable;

            if (editing) return;

            const current =
                normalizeEvent(e);

            const topKey =
                settings.keybindings?.scrollTop ||
                'Shift+ArrowUp';

            const bottomKey =
                settings.keybindings?.scrollBottom ||
                'Shift+ArrowDown';

            if (current === topKey) {
                e.preventDefault();

                scrollToTarget(
                    getScrollTarget(),
                    0
                );
            }

            if (current === bottomKey) {
                e.preventDefault();

                const t = getScrollTarget();

                scrollToTarget(
                    t,
                    t?.scrollHeight ??
                    document.body.scrollHeight
                );
            }
        }, { passive: false });
    }

    function applySavedPosition() {
        if (!scrollBtnContainer) return;
        const pos = loadPosition();
        if (!pos) return;
        scrollBtnContainer.style.left   = `${pos.left}px`;
        scrollBtnContainer.style.top    = `${pos.top}px`;
        scrollBtnContainer.style.right  = 'auto';
        scrollBtnContainer.style.bottom = 'auto';
    }

    // ── メンション候補ポップアップ位置修正 ────────────────────────────────
    function fixMentionPopupPosition() {
        if (!settings.mentionFix) return;
        const textarea =
            document.activeElement?.tagName === 'TEXTAREA' ? document.activeElement
            : document.querySelector('textarea#post-detail-reply-input')
           || document.querySelector('textarea.karotter-composer-textarea')
           || document.querySelector('textarea');
        if (!textarea) return;

        const popups = [...document.querySelectorAll('div.absolute.z-\\[150\\].overflow-auto')]
            .filter(p => {
                const r = p.getBoundingClientRect();
                return r.width >= 180 && r.width <= 520 && r.height >= 80 && r.height <= 420;
            });
        if (popups.length === 0) return;

        const textBeforeCaret = textarea.value.substring(0, textarea.selectionStart || 0);
        const lines           = textBeforeCaret.split('\n');
        const lineIdx         = lines.length - 1;
        const lineText        = lines[lineIdx];
        const charWidth       = 7.8;
        const lineHeight      = 26;
        const rect            = textarea.getBoundingClientRect();

        let left = Math.min(rect.left + 16 + Math.min(lineText.length * charWidth, rect.width - 40), window.innerWidth - 336);
        let top  = rect.top + 12 + lineIdx * lineHeight + lineHeight + window.pageYOffset + 12;

        for (const popup of popups) {
            if (popup.style.top === `${Math.round(top)}px` && popup.style.left === `${Math.round(left)}px`) continue;
            popup.style.setProperty('position',   'absolute', 'important');
            popup.style.setProperty('top',        `${Math.round(top)}px`,  'important');
            popup.style.setProperty('left',       `${Math.round(left)}px`, 'important');
            popup.style.setProperty('width',      '320px',   'important');
            popup.style.setProperty('max-height', '240px',   'important');
            popup.style.setProperty('overflow-y', 'auto',    'important');
            popup.style.setProperty('z-index',    '999999',  'important');
            popup.style.setProperty('margin',     '0',       'important');
            popup.style.setProperty('transform',  'none',    'important');
        }
    }

    // ── スクロールボタン ──────────────────────────────────────────────────
    function createScrollBtns() {
        if (scrollBtnContainer) return;

        scrollBtnContainer = document.createElement('div');
        scrollBtnContainer.id = 'karotter-scroll-btns';
        scrollBtnContainer.style.cssText = `
            position:fixed; right:20px; bottom:88px;
            display:flex; flex-direction:column; gap:10px;
            z-index:99999; user-select:none; opacity:0.45;
            transform:translateZ(0);
            transition:opacity .18s ease,transform .18s ease;
        `;

        const btnCss = `
            width:48px; height:48px; border-radius:16px;
            border:1px solid rgba(255,255,255,.08);
            background:linear-gradient(180deg,rgba(80,80,90,.72),rgba(40,40,50,.72));
            backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px);
            color:rgba(255,255,255,.92); font-size:20px; font-weight:700;
            cursor:pointer; display:flex; align-items:center; justify-content:center;
            box-shadow:0 6px 18px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.08);
            transition:transform .15s ease,box-shadow .15s ease;
        `;
        const hoverShadow  = '0 10px 24px rgba(59,130,246,.35)';
        const normalShadow = '0 6px 18px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.08)';

        const topBtn = document.createElement('button');
        topBtn.innerHTML = '↑'; topBtn.title = '一番上へ'; topBtn.style.cssText = btnCss;
        topBtn.onmouseenter = () => { topBtn.style.transform='translateY(-2px)'; topBtn.style.boxShadow=hoverShadow; };
        topBtn.onmouseleave = () => { topBtn.style.transform='translateY(0)';   topBtn.style.boxShadow=normalShadow; };
        topBtn.onclick = () => scrollToTarget(getScrollTarget(), 0);

        const botBtn = document.createElement('button');
        botBtn.innerHTML = '↓'; botBtn.title = '一番下へ'; botBtn.style.cssText = btnCss;
        botBtn.onmouseenter = () => { botBtn.style.transform='translateY(-2px)'; botBtn.style.boxShadow=hoverShadow; };
        botBtn.onmouseleave = () => { botBtn.style.transform='translateY(0)';   botBtn.style.boxShadow=normalShadow; };
        botBtn.onclick = () => {
            const t = getScrollTarget();
            scrollToTarget(t, t?.scrollHeight ?? document.body.scrollHeight);
        };

        scrollBtnContainer.appendChild(topBtn);
        scrollBtnContainer.appendChild(botBtn);
        document.body.appendChild(scrollBtnContainer);

        scrollBtnContainer.onmouseenter = () => { scrollBtnContainer.style.opacity='1'; scrollBtnContainer.style.transform='scale(1.03)'; };
        scrollBtnContainer.onmouseleave = () => { if (!isDragging) { scrollBtnContainer.style.opacity='0.45'; scrollBtnContainer.style.transform='scale(1)'; } };

        scrollBtnContainer.addEventListener('pointerdown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true;
            const r = scrollBtnContainer.getBoundingClientRect();
            dragOffsetX = e.clientX - r.left;
            dragOffsetY = e.clientY - r.top;
            scrollBtnContainer.style.opacity    = '1';
            scrollBtnContainer.style.transition = 'none';
            scrollBtnContainer.setPointerCapture?.(e.pointerId);
            e.preventDefault();
        });
        scrollBtnContainer.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            scrollBtnContainer.style.left   = `${e.clientX - dragOffsetX}px`;
            scrollBtnContainer.style.top    = `${e.clientY - dragOffsetY}px`;
            scrollBtnContainer.style.right  = 'auto';
            scrollBtnContainer.style.bottom = 'auto';
        });
        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            scrollBtnContainer.style.transition = 'opacity .18s ease,transform .18s ease';
            const r = scrollBtnContainer.getBoundingClientRect();
            savePosition(Math.round(r.left), Math.round(r.top));
        };
        scrollBtnContainer.addEventListener('pointerup',     endDrag);
        scrollBtnContainer.addEventListener('pointercancel', endDrag);

        applySavedPosition();
        bindKeyboardShortcuts();
    }

    function removeScrollBtns() {
        if (scrollBtnContainer) { scrollBtnContainer.remove(); scrollBtnContainer = null; }
    }

    function updateScrollBtns() {
        if (settings.scrollBtns && shouldShowScrollBtns()) createScrollBtns();
        else removeScrollBtns();
    }

    // ── Twitterへ投稿ボタン注入 ───────────────────────────────────────────
    function injectTwitterBtn(modal) {
        if (!settings.twitterBtn) {
            modal.querySelector('#karotter-twitter-btn')?.remove();
            return;
        }
        if (modal.querySelector('#karotter-twitter-btn')) return;

        const allBtns = [...modal.querySelectorAll('button')];
        const postBtn =
            allBtns.find(b => b.textContent.replace(/\s/g, '').includes('ポストする')) ||
            modal.querySelector('form button[type="submit"]') ||
            modal.querySelector('button[type="submit"]');
        if (!postBtn) return;

        const textarea =
            [...modal.querySelectorAll('textarea')].find(t =>
                t.getAttribute('aria-hidden') !== 'true' &&
                getComputedStyle(t).visibility !== 'hidden' &&
                t.offsetHeight > 0
            ) || modal.querySelector('textarea');
        if (!textarea) return;

        const xBtn = document.createElement('button');
        xBtn.id       = 'karotter-twitter-btn';
        xBtn.type     = 'button';
        xBtn.title    = 'Xにも同時投稿する';
        xBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.636 5.903-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>Xに投稿</span>`;
        xBtn.style.cssText = `
            display:inline-flex; align-items:center; gap:5px;
            padding:0 14px; height:36px; border-radius:9999px;
            border:1.5px solid rgba(255,255,255,.18);
            background:linear-gradient(135deg,#1a1a1a,#0f0f0f);
            color:#fff; font-size:13px; font-weight:700; cursor:pointer;
            margin-right:8px; flex-shrink:0;
            transition:background .15s,border-color .15s,transform .12s;
        `;
        xBtn.onmouseenter = () => { xBtn.style.background='linear-gradient(135deg,#2a2a2a,#1a1a1a)'; xBtn.style.borderColor='rgba(255,255,255,.35)'; xBtn.style.transform='translateY(-1px)'; };
        xBtn.onmouseleave = () => { xBtn.style.background='linear-gradient(135deg,#1a1a1a,#0f0f0f)'; xBtn.style.borderColor='rgba(255,255,255,.18)'; xBtn.style.transform='translateY(0)'; };
        xBtn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            window.open('https://x.com/intent/tweet?text=' + encodeURIComponent(textarea.value || ''), '_blank', 'noopener,noreferrer');
        };
        postBtn.parentElement.insertBefore(xBtn, postBtn);
    }

    // ── メイン処理 ────────────────────────────────────────────────────────
    const applyAll = () => {
        if (settings.widthFix && location.pathname.includes('/boards')) {
            const boardMain = document.querySelector('main.mx-auto');
            if (boardMain) {
                boardMain.style.setProperty('max-width', '100%', 'important');
                boardMain.style.setProperty('width',     '100%', 'important');
            }
        }

        const mentionOpen = document.querySelector('div.absolute.z-\\[150\\].overflow-auto');
        if (mentionOpen) {
            fixMentionPopupPosition();
            updateScrollBtns();
            return;
        }

        if (settings.widthFix) {
            const mainColumns = document.querySelectorAll('.timeline-main-column, [class*="main-column"], .flex-1.min-w-0');
            mainColumns.forEach(tl => {
                if (tl.offsetWidth > 200 || tl.className.includes('column')) {
                    tl.style.setProperty('max-width', 'none',     'important');
                    tl.style.setProperty('width',     '100%',     'important');
                    tl.style.setProperty('flex',      '1 1 auto', 'important');
                    tl.style.setProperty('min-width', '0',        'important');
                }
            });
            mainColumns.forEach(tl => {
                let cur = tl?.parentElement;
                while (cur && cur !== document.body) {
                    const mw = parseFloat(getComputedStyle(cur).maxWidth);
                    if (!isNaN(mw) && mw < window.innerWidth * 0.85) {
                        cur.style.setProperty('max-width', 'none', 'important');
                        cur.style.setProperty('width',     '100%', 'important');
                    }
                    cur = cur.parentElement;
                }
            });
            document.querySelectorAll('.max-w-2xl,.max-w-\\[550px\\],.max-w-\\[36rem\\],.max-w-xl').forEach(el => {
                el.style.setProperty('max-width', 'none', 'important');
                el.style.setProperty('width',     '100%', 'important');
            });
            document.querySelectorAll('.timeline-main-column p,[class*="main-column"] p').forEach(el => {
                el.style.setProperty('max-inline-size', 'none',       'important');
                el.style.setProperty('overflow-wrap',   'break-word', 'important');
                el.style.setProperty('word-break',      'normal',     'important');
            });
            document.querySelectorAll('.max-w-4xl,.max-w-3xl').forEach(el => {
                if (el.offsetWidth > 400) {
                    el.style.setProperty('max-width', 'none', 'important');
                    el.style.setProperty('width',     '100%', 'important');
                }
            });
        }

        document.querySelectorAll('.fixed.inset-0').forEach(overlay => {
            let modal = overlay.querySelector('.bg-white, .bg-\\[var\\(--surface\\)\\]');
            if (!modal) {
                const f = overlay.querySelector('form');
                if (f) modal = f.closest('div:not(.fixed)') || f.parentElement;
            }
            if (!modal) return;

            const form     = modal.querySelector('form');
            const textarea = modal.querySelector('textarea');

            injectTwitterBtn(modal);

            if (!form || !textarea || !settings.modalResize) return;

            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const w  = Math.min(Math.round(vw * 0.8), vw - 32);
            const h  = Math.round(vh * 0.85);

            overlay.style.setProperty('display',         'flex',       'important');
            overlay.style.setProperty('align-items',     'flex-start', 'important');
            overlay.style.setProperty('justify-content', 'center',     'important');
            overlay.style.setProperty('padding',         '2rem 1rem',  'important');
            overlay.style.setProperty('overflow-y',      'auto',       'important');

            modal.style.setProperty('width',         `${w}px`, 'important');
            modal.style.setProperty('max-width',     `${w}px`, 'important');
            modal.style.setProperty('height',        `${h}px`, 'important');
            modal.style.setProperty('max-height',    `${h}px`, 'important');
            modal.style.setProperty('margin',        '0',      'important');
            modal.style.setProperty('display',       'flex',   'important');
            modal.style.setProperty('flex-direction','column', 'important');
            modal.style.setProperty('overflow',      'hidden', 'important');

            const header = modal.querySelector('.flex.items-center.justify-between.border-b');
            if (header) {
                header.style.setProperty('position',    'relative', 'important');
                header.style.setProperty('flex-shrink', '0',        'important');
                const title = header.querySelector('h2');
                if (title) {
                    title.style.setProperty('position',  'absolute',         'important');
                    title.style.setProperty('left',      '50%',              'important');
                    title.style.setProperty('transform', 'translateX(-50%)', 'important');
                    title.style.setProperty('margin',    '0',                'important');
                }
            }

            form.style.setProperty('flex',           '1 1 0',  'important');
            form.style.setProperty('display',        'flex',   'important');
            form.style.setProperty('flex-direction', 'column', 'important');
            form.style.setProperty('overflow',       'hidden', 'important');
            form.style.setProperty('min-height',     '0',      'important');

            const spaceX3 = form.querySelector('.flex.space-x-3');
            if (spaceX3) {
                spaceX3.style.setProperty('flex',       '1 1 0', 'important');
                spaceX3.style.setProperty('display',    'flex',  'important');
                spaceX3.style.setProperty('min-height', '0',     'important');
                spaceX3.style.setProperty('overflow',   'hidden','important');
                const inner = spaceX3.querySelector('.flex-1');
                if (inner) {
                    inner.style.setProperty('display',        'flex',   'important');
                    inner.style.setProperty('flex-direction', 'column', 'important');
                    inner.style.setProperty('min-height',     '0',      'important');
                    inner.style.setProperty('overflow',       'hidden', 'important');
                    const cw = inner.querySelector('.relative.w-full');
                    if (cw) {
                        cw.style.setProperty('flex',           '1 1 0', 'important');
                        cw.style.setProperty('min-height',     '0',     'important');
                        cw.style.setProperty('display',        'flex',  'important');
                        cw.style.setProperty('flex-direction', 'column','important');
                    }
                    const ct = inner.querySelector('textarea');
                    if (ct) {
                        ct.style.setProperty('flex',       '1 1 0', 'important');
                        ct.style.setProperty('min-height', '180px', 'important');
                        ct.style.setProperty('resize',     'none',  'important');
                    }
                    const co = inner.querySelector('.karotter-composer-overlay');
                    if (co) {
                        co.style.setProperty('flex',       '1 1 0', 'important');
                        co.style.setProperty('min-height', '180px', 'important');
                    }
                }
            }
            const tb = form.querySelector('.mt-4.flex.flex-col');
            if (tb) tb.style.setProperty('flex-shrink', '0', 'important');
        });

        if (settings.widthFix) {
            document.querySelectorAll('.timeline-main-column .flex.flex-wrap.items-center.justify-between').forEach(toolbar => {
                toolbar.style.setProperty('justify-content', 'flex-start', 'important');
                toolbar.style.setProperty('gap',             '8px',        'important');
                const ch = toolbar.children;
                if (ch.length >= 2) {
                    ch[1].style.setProperty('flex', '1', 'important');
                    const cb = ch[1].querySelector('button[title*="コンテンツ"]');
                    if (cb) cb.style.setProperty('margin-left', 'auto', 'important');
                }
            });
            document.querySelectorAll('button[title="下書きを保存"]').forEach(b => {
                const p = b.parentElement;
                if (p && p.firstElementChild !== b) p.insertBefore(b, p.firstElementChild);
            });
            document.querySelectorAll('.timeline-main-column form .flex.w-full.items-center.justify-between').forEach(el => {
                el.style.setProperty('justify-content', 'flex-end', 'important');
            });
            document.querySelectorAll('*').forEach(el => {
                if (el.childElementCount === 0 && el.textContent.trim() === 'まだ返信がありません') {
                    el.style.setProperty('max-inline-size', 'none',   'important');
                    el.style.setProperty('width',           '100%',   'important');
                    el.style.setProperty('text-align',      'center', 'important');
                    el.style.setProperty('display',         'block',  'important');
                    if (el.parentElement) el.parentElement.style.setProperty('width', '100%', 'important');
                }
            });
        }

        if (settings.mentionFix) fixMentionPopupPosition();
        updateScrollBtns();
    };

    // ── 起動 ─────────────────────────────────────────────────────────────
    chrome.storage.local.get(DEFAULT_SETTINGS, (stored) => {
        settings = stored;
        applyAll();
        setTimeout(applyAll, 500);

        let lastUrl = location.href;
        new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                setTimeout(applyAll, 800);
            }
            applyAll();
        }).observe(document.body, { childList: true, subtree: true });
    });
})();
