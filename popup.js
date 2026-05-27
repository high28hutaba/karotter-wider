// ═══════════════════════════════════════════════════════════════════
// 定数
// ═══════════════════════════════════════════════════════════════════
const DEFAULT_FLAGS = {
    widthFix: true,
    modalResize: true,
    mentionFix: true,
    scrollBtns: true,
    keyboardShortcuts: true,
    twitterBtn: true,
};

const DEFAULT_KEYBINDINGS = {
    scrollTop: 'Shift+ArrowUp',
    scrollBottom: 'Shift+ArrowDown',
};

const ACTION_META = [
    {
        cat: 'スクロール',
        actions: [
            { id: 'scrollTop', label: '一番上へスクロール' },
            { id: 'scrollBottom', label: '一番下へスクロール' },
        ],
    },
];

// ═══════════════════════════════════════════════════════════════════
// キー表示フォーマット
// ═══════════════════════════════════════════════════════════════════
const KEY_DISPLAY = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Enter: '↵',
    Escape: 'Esc',
    Backspace: '⌫',
    Tab: '⇥',
    ' ': 'Space',
    Delete: 'Del',
    Home: 'Home',
    End: 'End',
    PageUp: 'PgUp',
    PageDown: 'PgDn',
};

function formatBinding(binding) {
    if (!binding) return null;

    const parts = binding.split('+');
    const key = parts[parts.length - 1];
    const mods = parts.slice(0, -1);

    const kd =
        KEY_DISPLAY[key] ??
        (key.length === 1 ? key.toUpperCase() : key);

    return [...mods, kd].join(' + ');
}

// ═══════════════════════════════════════════════════════════════════
// 状態
// ═══════════════════════════════════════════════════════════════════
let currentKeybindings = { ...DEFAULT_KEYBINDINGS };
let capturingAction = null;
let capturingRow = null;

// ═══════════════════════════════════════════════════════════════════
// キーバインドリスト構築
// ═══════════════════════════════════════════════════════════════════
function buildKbList() {
    const container = document.getElementById('kbList');
    container.innerHTML = '';

    ACTION_META.forEach(({ cat, actions }) => {
        const catLabel = document.createElement('div');
        catLabel.className = 'kb-category-label';
        catLabel.textContent = cat;
        container.appendChild(catLabel);

        actions.forEach(({ id, label }) => {
            const row = document.createElement('div');
            row.className = 'kb-row';
            row.dataset.action = id;

            const lbl = document.createElement('span');
            lbl.className = 'kb-label';
            lbl.textContent = label;

            const badge = document.createElement('span');
            badge.className = 'kb-badge';
            badge.dataset.badgeFor = id;

            updateBadge(badge, currentKeybindings[id]);

            const clearBtn = document.createElement('button');
            clearBtn.className = 'kb-clear';
            clearBtn.textContent = '×';
            clearBtn.title = 'このキーをクリア';

            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();

                currentKeybindings[id] = '';
                updateBadge(badge, '');

                if (capturingAction === id) {
                    stopCapture();
                }
            });

            row.appendChild(lbl);
            row.appendChild(badge);
            row.appendChild(clearBtn);

            container.appendChild(row);

            row.addEventListener('click', () => {
                if (capturingAction === id) {
                    stopCapture();
                    return;
                }

                startCapture(id, row, badge);
            });
        });
    });
}

function updateBadge(badge, binding) {
    badge.classList.remove('unset', 'capturing-hint');

    if (!binding) {
        badge.className = 'kb-badge unset';
        badge.textContent = '未設定';
    } else {
        badge.className = 'kb-badge';
        badge.textContent = formatBinding(binding);
    }
}

// ═══════════════════════════════════════════════════════════════════
// キーキャプチャ
// ═══════════════════════════════════════════════════════════════════
function startCapture(action, row, badge) {
    if (capturingRow) {
        stopCapture();
    }

    capturingAction = action;
    capturingRow = row;

    row.classList.add('capturing');

    badge.className = 'kb-badge capturing-hint';
    badge.textContent = 'キーを押して';
}

function stopCapture() {
    if (capturingRow) {
        capturingRow.classList.remove('capturing');

        const badge =
            capturingRow.querySelector('.kb-badge');

        if (badge) {
            updateBadge(
                badge,
                currentKeybindings[capturingAction]
            );
        }
    }

    capturingAction = null;
    capturingRow = null;
}

document.addEventListener(
    'keydown',
    (e) => {
        if (!capturingAction) return;

        e.preventDefault();
        e.stopPropagation();

        if (
            ['Control', 'Shift', 'Alt', 'Meta'].includes(
                e.key
            )
        ) {
            return;
        }

        if (e.key === 'Escape') {
            stopCapture();
            return;
        }

        let binding = '';

        if (e.ctrlKey) binding += 'Ctrl+';
        if (e.shiftKey) binding += 'Shift+';
        if (e.altKey) binding += 'Alt+';

        binding += e.key;

        currentKeybindings[capturingAction] = binding;

        const badge =
            capturingRow?.querySelector('.kb-badge');

        if (badge) {
            updateBadge(badge, binding);
        }

        stopCapture();
    },
    true
);

// ═══════════════════════════════════════════════════════════════════
// タブ切り替え
// ═══════════════════════════════════════════════════════════════════
document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        document
            .querySelectorAll('.tab')
            .forEach((t) => t.classList.remove('active'));

        document
            .querySelectorAll('.tab-content')
            .forEach((c) => c.classList.remove('active'));

        tab.classList.add('active');

        document
            .getElementById('tab-' + tab.dataset.tab)
            .classList.add('active');

        if (capturingAction) {
            stopCapture();
        }
    });
});

// ═══════════════════════════════════════════════════════════════════
// 機能フラグ ヘルパー
// ═══════════════════════════════════════════════════════════════════
function collectFlags() {
    const result = {};

    Object.keys(DEFAULT_FLAGS).forEach((id) => {
        const el = document.getElementById(id);

        result[id] = el
            ? el.checked
            : DEFAULT_FLAGS[id];
    });

    return result;
}

function applyFlagsToUI(flags) {
    Object.keys(DEFAULT_FLAGS).forEach((id) => {
        const el = document.getElementById(id);

        if (el) {
            el.checked = !!flags[id];
        }
    });
}

// ═══════════════════════════════════════════════════════════════════
// 保存 / リセット
// ═══════════════════════════════════════════════════════════════════
function showSaved() {
    const n = document.getElementById('savedNotice');

    n.classList.add('show');

    setTimeout(() => {
        n.classList.remove('show');
    }, 1800);
}

function broadcastSettings(settings) {
    chrome.tabs.query(
        { active: true, currentWindow: true },
        (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs
                    .sendMessage(tabs[0].id, {
                        type: 'SETTINGS_UPDATED',
                        settings,
                    })
                    .catch(() => {});
            }
        }
    );
}

document
    .getElementById('btnSave')
    .addEventListener('click', () => {
        if (capturingAction) {
            stopCapture();
        }

        const settings = {
            ...collectFlags(),
            keybindings: {
                ...currentKeybindings,
            },
        };

        chrome.storage.local.set(settings, () => {
            broadcastSettings(settings);
            showSaved();
        });
    });

document
    .getElementById('btnReset')
    .addEventListener('click', () => {
        if (capturingAction) {
            stopCapture();
        }

        const settings = {
            ...DEFAULT_FLAGS,
            keybindings: {
                ...DEFAULT_KEYBINDINGS,
            },
        };

        chrome.storage.local.set(settings, () => {
            applyFlagsToUI(DEFAULT_FLAGS);

            currentKeybindings = {
                ...DEFAULT_KEYBINDINGS,
            };

            buildKbList();

            broadcastSettings(settings);

            showSaved();
        });
    });

// ═══════════════════════════════════════════════════════════════════
// 初期ロード
// ═══════════════════════════════════════════════════════════════════
chrome.storage.local.get(
    {
        ...DEFAULT_FLAGS,
        keybindings: DEFAULT_KEYBINDINGS,
    },
    (stored) => {
        applyFlagsToUI(stored);

        currentKeybindings = {
            ...DEFAULT_KEYBINDINGS,
            ...(stored.keybindings ?? {}),
        };

        buildKbList();
    }
);