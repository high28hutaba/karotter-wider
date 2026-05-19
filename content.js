(function() {
    const applyAll = () => {
        const tl = document.querySelector('.timeline-main-column');
        if (tl) {
            tl.style.setProperty('max-width', 'none', 'important');
            tl.style.setProperty('width', '100%', 'important');
            tl.style.setProperty('flex', '1 1 auto', 'important');
            tl.style.setProperty('min-width', '0', 'important');
        }
        let cur = tl?.parentElement;
        while (cur && cur !== document.body) {
            const mw = parseFloat(getComputedStyle(cur).maxWidth);
            if (!isNaN(mw) && mw < window.innerWidth * 0.85) {
                cur.style.setProperty('max-width', 'none', 'important');
                cur.style.setProperty('width', '100%', 'important');
            }
            cur = cur.parentElement;
        }
        document.querySelectorAll('.max-w-2xl, .max-w-\\[550px\\], .max-w-\\[36rem\\]').forEach(el => {
            el.style.setProperty('max-width', 'none', 'important');
            el.style.setProperty('width', '100%', 'important');
        });
        document.querySelectorAll('.timeline-main-column p').forEach(el => {
            el.style.setProperty('max-inline-size', 'none', 'important');
            el.style.setProperty('overflow-wrap', 'break-word', 'important');
            el.style.setProperty('word-break', 'normal', 'important');
        });

        // メッセージ・DM系ページの幅制限を解除
        document.querySelectorAll('.max-w-4xl, .max-w-3xl').forEach(el => {
            // ページ全体コンテナのみ（小パーツは除外）
            if (el.offsetWidth > 400) {
                el.style.setProperty('max-width', 'none', 'important');
                el.style.setProperty('width', '100%', 'important');
            }
        });
        // 説明文の max-w-xl も解除
        document.querySelectorAll('.dm-groups-page .max-w-xl').forEach(el => {
            el.style.setProperty('max-width', 'none', 'important');
        });

        // 投稿ダイアログ
        document.querySelectorAll('.fixed.inset-0').forEach(overlay => {
            const modal = overlay.querySelector('.bg-white, .bg-\\[var\\(--surface\\)\\]');
            if (!modal || !modal.querySelector('form')) return;

            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const w = Math.min(Math.round(vw * 0.80), vw - 32);
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

            const form = modal.querySelector('form');
            if (form) {
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

                        const textarea = inner.querySelector('textarea');
                        if (textarea) {
                            textarea.style.setProperty('flex', '1 1 0', 'important');
                            textarea.style.setProperty('height', '100%', 'important');
                            textarea.style.setProperty('min-height', '180px', 'important');
                            textarea.style.setProperty('resize', 'none', 'important');
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
            }
        });

        document.querySelectorAll('.flex.flex-wrap.items-center.justify-between').forEach(toolbar => {
            toolbar.style.setProperty('justify-content', 'flex-start', 'important');
            toolbar.style.setProperty('gap', '8px', 'important');
            const children = toolbar.children;
            if (children.length >= 2) {
                children[1].style.setProperty('flex', '1', 'important');
                const contentBtn = children[1].querySelector('button[title*="コンテンツ"]');
                if (contentBtn) {
                    contentBtn.style.setProperty('margin-left', 'auto', 'important');
                }
            }
        });

        document.querySelectorAll('button[title="下書きを保存"]').forEach(saveBtn => {
            const parent = saveBtn.parentElement;
            if (parent && parent.firstElementChild !== saveBtn) {
                parent.insertBefore(saveBtn, parent.firstElementChild);
            }
        });

        document.querySelectorAll('.timeline-main-column form .flex.w-full.items-center.justify-between').forEach(el => {
            el.style.setProperty('justify-content', 'flex-end', 'important');
        });
        document.querySelectorAll('*').forEach(el => {
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
    console.log('[KarotterFix] v19 起動');
})();