(function () {
    if (window.__KarotterFixV30Installed) return;
    window.__KarotterFixV30Installed = true;

    let scrollBtnContainer = null;
    let hasBoundKeyboard = false;
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const STORAGE_KEY = 'karotter-scroll-btn-position-v1';
    const SCROLL_DURATION = 160;

    function loadPosition() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const pos = JSON.parse(raw);
            if (typeof pos?.left === 'number' && typeof pos?.top === 'number') {
                return pos;
            }
        } catch (_) {}
        return null;
    }

    function savePosition(left, top) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ left, top }));
        } catch (_) {}
    }

    function getScrollTarget() {
        if (location.pathname.match(/^\/dm\/.+/)) {
            const candidates = [...document.querySelectorAll('div.overflow-y-auto')];

            const dmArea = candidates
                .filter((el) => {
                    const r = el.getBoundingClientRect();
                    if (r.width < 200 || r.height < 200) return false;
                    if (r.left < 350) return false;
                    if (el.scrollHeight <= el.clientHeight) return false;
                    return true;
                })
                .sort((a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left)[0];

            if (dmArea) return dmArea;
        }

        const main = document.querySelector('div.overflow-x-hidden.overflow-y-auto');
        if (main) return main;

        return document.scrollingElement || document.documentElement;
    }

    function scrollToTarget(target, top, duration = SCROLL_DURATION) {
        const el = !target || target === window ? document.scrollingElement || document.documentElement : target;
        const start = el.scrollTop;
        const change = top - start;

        if (Math.abs(change) < 2 || duration <= 0) {
            el.scrollTop = top;
            return;
        }

        const startTime = performance.now();

        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            el.scrollTop = start + change * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                el.scrollTop = top;
            }
        }

        requestAnimationFrame(animate);
    }

    function shouldShowScrollBtns() {
        const path = location.pathname;
        return path === '/' || path.startsWith('/dm') || path.startsWith('/notifications');
    }

    function bindKeyboardShortcuts() {
        if (hasBoundKeyboard) return;
        hasBoundKeyboard = true;

        document.addEventListener(
            'keydown',
            (e) => {
                const tag = document.activeElement?.tagName;
                const editing = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;

                if (editing) return;

                if (e.shiftKey && e.key === 'ArrowUp') {
                    e.preventDefault();
                    scrollToTarget(getScrollTarget(), 0);
                }

                if (e.shiftKey && e.key === 'ArrowDown') {
                    e.preventDefault();
                    const t = getScrollTarget();
                    const height = t?.scrollHeight ?? document.body.scrollHeight;
                    scrollToTarget(t, height);
                }
            },
            { passive: false }
        );
    }

    function applySavedPosition() {
        if (!scrollBtnContainer) return;
        const pos = loadPosition();
        if (!pos) return;

        scrollBtnContainer.style.left = `${pos.left}px`;
        scrollBtnContainer.style.top = `${pos.top}px`;
        scrollBtnContainer.style.right = 'auto';
        scrollBtnContainer.style.bottom = 'auto';
    }

    function fixMentionPopupPosition() {
        const textarea =
            document.activeElement?.tagName === 'TEXTAREA' ? document.activeElement : (
            document.querySelector('textarea#post-detail-reply-input') ||
            document.querySelector('textarea.karotter-composer-textarea') ||
            document.querySelector('textarea'));

        if (!textarea) return;

        const popups = [...document.querySelectorAll('div.absolute.z-\\[150\\].overflow-auto')].filter(
            (popup) => {
                const r = popup.getBoundingClientRect();
                return r.width >= 180 && r.width <= 520 && r.height >= 80 && r.height <= 420;
            }
        );

        if (popups.length === 0) return;

        const textValue = textarea.value;
        const selectionStart = textarea.selectionStart || 0;
        const textBeforeCaret = textValue.substring(0, selectionStart);
        const lines = textBeforeCaret.split('\n');
        const currentLineIndex = lines.length - 1;
        const currentLineText = lines[currentLineIndex];

        const charWidth = 7.8;
        const lineHeight = 26;
        const rect = textarea.getBoundingClientRect();

        const baseLeft = rect.left + 16;
        const baseTop = rect.top + 12;

        const caretOffsetLeft = Math.min(currentLineText.length * charWidth, rect.width - 40);
        const caretOffsetTop = currentLineIndex * lineHeight;

        let left = baseLeft + caretOffsetLeft;
        let top = baseTop + caretOffsetTop + lineHeight + window.pageYOffset + 12;

        const popupWidth = 320;
        const popupHeight = 240;
        left = Math.min(left, window.innerWidth - popupWidth - 16);

        for (const popup of popups) {
            if (popup.style.top === `${Math.round(top)}px` && popup.style.left === `${Math.round(left)}px`) {
                continue;
            }

            popup.style.setProperty('position', 'absolute', 'important');
            popup.style.setProperty('top', `${Math.round(top)}px`, 'important');
            popup.style.setProperty('left', `${Math.round(left)}px`, 'important');
            popup.style.setProperty('width', `${popupWidth}px`, 'important');
            popup.style.setProperty('max-height', `${popupHeight}px`, 'important');
            popup.style.setProperty('overflow-y', 'auto', 'important');
            popup.style.setProperty('z-index', '999999', 'important');
            popup.style.setProperty('margin', '0', 'important');
            popup.style.setProperty('transform', 'none', 'important');
        }
    }

    function createScrollBtns() {
        if (scrollBtnContainer) return;

        scrollBtnContainer = document.createElement('div');
        scrollBtnContainer.id = 'karotter-scroll-btns';
        scrollBtnContainer.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 88px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 99999;
            user-select: none;
            opacity: 0.45;
            transform: translateZ(0);
            transition: opacity 0.18s ease, transform 0.18s ease;
        `;

        const btnStyle = `
            width: 48px;
            height: 48px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.08);
            background: linear-gradient(180deg, rgba(80,80,90,0.72), rgba(40,40,50,0.72));
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            color: rgba(255,255,255,0.92);
            font-size: 20px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 6px 18px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08);
            transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
        `;

        const topBtn = document.createElement('button');
        topBtn.innerHTML = '↑';
        topBtn.title = '一番上へ';
        topBtn.style.cssText = btnStyle;
        topBtn.onmouseenter = () => {
            topBtn.style.transform = 'translateY(-2px)';
            topBtn.style.boxShadow = '0 10px 24px rgba(59,130,246,0.35)';
        };
        topBtn.onmouseleave = () => {
            topBtn.style.transform = 'translateY(0)';
            topBtn.style.boxShadow = '0 6px 18px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)';
        };
        topBtn.onclick = () => scrollToTarget(getScrollTarget(), 0);

        const botBtn = document.createElement('button');
        botBtn.innerHTML = '↓';
        botBtn.title = '一番下へ';
        botBtn.style.cssText = btnStyle;
        botBtn.onmouseenter = () => {
            botBtn.style.transform = 'translateY(-2px)';
            botBtn.style.boxShadow = '0 10px 24px rgba(59,130,246,0.35)';
        };
        botBtn.onmouseleave = () => {
            botBtn.style.transform = 'translateY(0)';
            botBtn.style.boxShadow = '0 6px 18px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)';
        };
        botBtn.onclick = () => {
            const t = getScrollTarget();
            scrollToTarget(t, t?.scrollHeight ?? document.body.scrollHeight);
        };

        scrollBtnContainer.appendChild(topBtn);
        scrollBtnContainer.appendChild(botBtn);
        document.body.appendChild(scrollBtnContainer);

        scrollBtnContainer.onmouseenter = () => {
            scrollBtnContainer.style.opacity = '1';
            scrollBtnContainer.style.transform = 'scale(1.03)';
        };

        scrollBtnContainer.onmouseleave = () => {
            if (!isDragging) {
                scrollBtnContainer.style.opacity = '0.45';
                scrollBtnContainer.style.transform = 'scale(1)';
            }
        };

        scrollBtnContainer.addEventListener('pointerdown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true;

            const rect = scrollBtnContainer.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;

            scrollBtnContainer.style.opacity = '1';
            scrollBtnContainer.style.transition = 'none';
            scrollBtnContainer.setPointerCapture?.(e.pointerId);
            e.preventDefault();
        });

        scrollBtnContainer.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            scrollBtnContainer.style.left = `${e.clientX - dragOffsetX}px`;
            scrollBtnContainer.style.top = `${e.clientY - dragOffsetY}px`;
            scrollBtnContainer.style.right = 'auto';
            scrollBtnContainer.style.bottom = 'auto';
        });

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            scrollBtnContainer.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
            const rect = scrollBtnContainer.getBoundingClientRect();
            savePosition(Math.round(rect.left), Math.round(rect.top));
        };

        scrollBtnContainer.addEventListener('pointerup', endDrag);
        scrollBtnContainer.addEventListener('pointercancel', endDrag);

        applySavedPosition();
        bindKeyboardShortcuts();
    }

    function removeScrollBtns() {
        if (scrollBtnContainer) {
            scrollBtnContainer.remove();
            scrollBtnContainer = null;
        }
    }

    function updateScrollBtns() {
        if (shouldShowScrollBtns()) createScrollBtns();
        else removeScrollBtns();
    }

    const applyAll = () => {
        // 【パッチ：掲示板一覧(/boards) の幅制限をピンポイント解除】
        if (location.pathname.includes('/boards')) {
            const boardMain = document.querySelector('main.mx-auto');
            if (boardMain) {
                boardMain.style.setProperty('max-width', '100%', 'important');
                boardMain.style.setProperty('width', '100%', 'important');
            }
        }

        const mentionOpen = document.querySelector('div.absolute.z-\\[150\\].overflow-auto');

        if (mentionOpen) {
            fixMentionPopupPosition();
            updateScrollBtns();
            return;
        }

        const mainColumns = document.querySelectorAll('.timeline-main-column, [class*="main-column"], .flex-1.min-w-0');
        mainColumns.forEach((tl) => {
            if (tl.offsetWidth > 200 || tl.className.includes('column')) {
                tl.style.setProperty('max-width', 'none', 'important');
                tl.style.setProperty('width', '100%', 'important');
                tl.style.setProperty('flex', '1 1 auto', 'important');
                tl.style.setProperty('min-width', '0', 'important');
            }
        });

        mainColumns.forEach((tl) => {
            let cur = tl?.parentElement;
            while (cur && cur !== document.body) {
                const mw = parseFloat(getComputedStyle(cur).maxWidth);
                if (!isNaN(mw) && mw < window.innerWidth * 0.85) {
                    cur.style.setProperty('max-width', 'none', 'important');
                    cur.style.setProperty('width', '100%', 'important');
                }
                cur = cur.parentElement;
            }
        });

        document.querySelectorAll('.max-w-2xl, .max-w-\\[550px\\], .max-w-\\[36rem\\], .max-w-xl').forEach((el) => {
            el.style.setProperty('max-width', 'none', 'important');
            el.style.setProperty('width', '100%', 'important');
        });

        document.querySelectorAll('.timeline-main-column p, [class*="main-column"] p').forEach((el) => {
            el.style.setProperty('max-inline-size', 'none', 'important');
            el.style.setProperty('overflow-wrap', 'break-word', 'important');
            el.style.setProperty('word-break', 'normal', 'important');
        });

        document.querySelectorAll('.max-w-4xl, .max-w-3xl').forEach((el) => {
            if (el.offsetWidth > 400) {
                el.style.setProperty('max-width', 'none', 'important');
                el.style.setProperty('width', '100%', 'important');
            }
        });

        document.querySelectorAll('.fixed.inset-0').forEach((overlay) => {
            const modal = overlay.querySelector('.bg-white, .bg-\\[var\\(--surface\\)\\]');
            if (!modal) return;

            const form = modal.querySelector('form');
            const textarea = modal.querySelector('textarea');
            if (!form || !textarea) return;

            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const w = Math.min(Math.round(vw * 0.8), vw - 32);
            const h = Math.round(vh * 0.85);

            overlay.style.setProperty('display', 'flex', 'important');
            overlay.style.setProperty('align-items', 'flex-start', 'important');
            overlay.style.setProperty('justify-content', 'center', 'important');
            overlay.style.setProperty('padding', '2rem 1rem', 'important');
            overlay.style.setProperty('overflow-y', 'auto', 'important');

            modal.style.setProperty('width', `${w}px`, 'important');
            modal.style.setProperty('max-width', `${w}px`, 'important');
            modal.style.setProperty('height', `${h}px`, 'important');
            modal.style.setProperty('max-height', `${h}px`, 'important');
            modal.style.setProperty('margin', '0', 'important');
            modal.style.setProperty('display', 'flex', 'important');
            modal.style.setProperty('flex-direction', 'column', 'important');
            modal.style.setProperty('overflow', 'hidden', 'important');

            const header = modal.querySelector('.flex.items-center.justify-between.border-b');
            if (header) {
                header.style.setProperty('position', 'relative', 'important');
                header.style.setProperty('flex-shrink', '0', 'important');

                const title = header.querySelector('h2');
                if (title) {
                    title.style.setProperty('position', 'absolute', 'important');
                    title.style.setProperty('left', '50%', 'important');
                    title.style.setProperty('transform', 'translateX(-50%)', 'important');
                    title.style.setProperty('margin', '0', 'important');
                }
            }

            form.style.setProperty('flex', '1 1 0', 'important');
            form.style.setProperty('display', 'flex', 'important');
            form.style.setProperty('flex-direction', 'column', 'important');
            form.style.setProperty('overflow', 'hidden', 'important');
            form.style.setProperty('min-height', '0', 'important');

            const spaceX3 = form.querySelector('.flex.space-x-3');
            if (spaceX3) {
                spaceX3.style.setProperty('flex', '1 1 0', 'important');
                spaceX3.style.setProperty('display', 'flex', 'important');
                spaceX3.style.setProperty('min-height', '0', 'important');
                spaceX3.style.setProperty('overflow', 'hidden', 'important');

                const inner = spaceX3.querySelector('.flex-1');
                if (inner) {
                    inner.style.setProperty('display', 'flex', 'important');
                    inner.style.setProperty('flex-direction', 'column', 'important');
                    inner.style.setProperty('min-height', '0', 'important');
                    inner.style.setProperty('overflow', 'hidden', 'important');

                    const composerWrap = inner.querySelector('.relative.w-full');
                    if (composerWrap) {
                        composerWrap.style.setProperty('flex', '1 1 0', 'important');
                        composerWrap.style.setProperty('min-height', '0', 'important');
                        composerWrap.style.setProperty('display', 'flex', 'important');
                        composerWrap.style.setProperty('flex-direction', 'column', 'important');
                    }

                    const composerTextarea = inner.querySelector('textarea');
                    if (composerTextarea) {
                        composerTextarea.style.setProperty('flex', '1 1 0', 'important');
                        composerTextarea.style.setProperty('min-height', '180px', 'important');
                        composerTextarea.style.setProperty('resize', 'none', 'important');
                    }

                    const composerOverlay = inner.querySelector('.karotter-composer-overlay');
                    if (composerOverlay) {
                        composerOverlay.style.setProperty('flex', '1 1 0', 'important');
                        composerOverlay.style.setProperty('min-height', '180px', 'important');
                    }
                }
            }

            const toolbarBottom = form.querySelector('.mt-4.flex.flex-col');
            if (toolbarBottom) {
                toolbarBottom.style.setProperty('flex-shrink', '0', 'important');
            }
        });

        document.querySelectorAll('.timeline-main-column .flex.flex-wrap.items-center.justify-between').forEach((toolbar) => {
            toolbar.style.setProperty('justify-content', 'flex-start', 'important');
            toolbar.style.setProperty('gap', '8px', 'important');

            const children = toolbar.children;
            if (children.length >= 2) {
                children[1].style.setProperty('flex', '1', 'important');
                const contentBtn = children[1].querySelector('button[title*="コンテンツ"]');
                if (contentBtn) contentBtn.style.setProperty('margin-left', 'auto', 'important');
            }
        });

        document.querySelectorAll('button[title="下書きを保存"]').forEach((saveBtn) => {
            const parent = saveBtn.parentElement;
            if (parent && parent.firstElementChild !== saveBtn) {
                parent.insertBefore(saveBtn, parent.firstElementChild);
            }
        });

        document.querySelectorAll('.timeline-main-column form .flex.w-full.items-center.justify-between').forEach((el) => {
            el.style.setProperty('justify-content', 'flex-end', 'important');
        });

        document.querySelectorAll('*').forEach((el) => {
            if (el.childElementCount === 0 && el.textContent.trim() === 'まだ返信がありません') {
                el.style.setProperty('max-inline-size', 'none', 'important');
                el.style.setProperty('width', '100%', 'important');
                el.style.setProperty('text-align', 'center', 'important');
                el.style.setProperty('display', 'block', 'important');
                if (el.parentElement) {
                    el.parentElement.style.setProperty('width', '100%', 'important');
                }
            }
        });

        fixMentionPopupPosition();
        updateScrollBtns();
    };

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
})();