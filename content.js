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

        // max-w系を一括解除
        document.querySelectorAll('.max-w-2xl, .max-w-\\[550px\\], .max-w-\\[36rem\\]').forEach(el => {
            el.style.setProperty('max-width', 'none', 'important');
            el.style.setProperty('width', '100%', 'important');
        });

        // 投稿・引用テキストのmax-inline-size解除
        document.querySelectorAll('.timeline-main-column p').forEach(el => {
            el.style.setProperty('max-inline-size', 'none', 'important');
            el.style.setProperty('overflow-wrap', 'break-word', 'important');
            el.style.setProperty('word-break', 'normal', 'important');
        });

        // ツールバー外側: flex-start
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

        // 返信ボタン行のみ右端 (formの中だけ)
        document.querySelectorAll('.timeline-main-column form .flex.w-full.items-center.justify-between').forEach(el => {
            el.style.setProperty('justify-content', 'flex-end', 'important');
        });

        // 「まだ返信がありません」中央揃え
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

    console.log('[KarotterFix] v11 起動');
})();
