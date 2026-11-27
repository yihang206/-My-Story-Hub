
/* ==========================================
   STORY HUB V2.1
   Shared Visual Theme
   如我所书 · 全站公共视觉系统
   ========================================== */

const THEME_CSS = `

/* 01. Shared visual design */

body:has(#app:not([hidden]))
:not(:has(#home-v2))
:not(.reading-mode) {
    background: #f5e8e5;
}

body:has(#app:not([hidden])):not(:has(#home-v2)):not(.reading-mode) {
    --ink: #49332e;
    --ink-secondary: #927568;
    --gold: #bf9468;
    --gold-light: #dfc1a2;
    --border: rgba(180,133,97,.28);
    --paper: #fcf5ed;
    --paper-soft: #f4e6dd;
    --panel: #fbf2e9;
    background: #f5e8e5;
}

body:not(.reading-mode):not(:has(#home-v2))
#app:not([hidden]) {
    position: relative;
    isolation: isolate;
    container-type: inline-size;
    width: 100%;
    max-width: 1800px;
    min-height: 100dvh;
    margin: 0 auto;

    background: linear-gradient(
        180deg,
        #f7e5dc,
        #faf0e7 42%,
        #efe0ed 100%
    );
}

/* Never show the old two-image background */

body:has(#app:not([hidden])):not(:has(#home-v2)):not(.reading-mode)
.world-background,

body:has(#app:not([hidden])):not(:has(#home-v2)):not(.reading-mode)
.ambient-overlay {
    display: none !important;
}

/* 02. Original artwork - upper frame */

body:not(.reading-mode):not(:has(#home-v2))
#app:not([hidden])::before {

    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;

    aspect-ratio: 1536 / 550;

    background-image: var(--shared-frame, none);
    background-size: 100% auto;
    background-position: center top;
    background-repeat: no-repeat;

    -webkit-mask-image: linear-gradient(
        black 0%,
        black 56%,
        transparent 100%
    );

    mask-image: linear-gradient(
        black 0%,
        black 56%,
        transparent 100%
    );

    pointer-events: none;
    z-index: -1;
}

/* 03. Shared header */

body:not(.reading-mode):not(:has(#home-v2))
.site-header {

    position: relative;

    width: 100%;
    max-width: none;

    aspect-ratio: 1536 / 320;

    padding: 0;
    margin: 0;

    z-index: 20;
}

body:not(.reading-mode):not(:has(#home-v2))
.header-meta {

    position: absolute;

    top: 27%;
    left: 24.4%;
    right: 25.5%;

    padding: 0;
    border: 0;

    color: #49332e;

    font-size: 1.02cqw;
    font-family: Georgia, var(--serif);
    letter-spacing: .04em;
}

body:not(.reading-mode):not(:has(#home-v2))
.brand-block {

    position: absolute;

    top: 39%;
    left: 25%;
    width: 50%;

    padding: 0;
    text-align: center;
}

body:not(.reading-mode):not(:has(#home-v2))
.brand-block .ornament {
    display: none;
}

body:not(.reading-mode):not(:has(#home-v2))
.brand-block .brand-title {

    margin: 0;

    color: #795044;
    font-family: "Times New Roman", Georgia, serif;

    font-size: 4.6cqw;
    font-style: italic;
    font-weight: 400;
    letter-spacing: -.035em;
    line-height: 1.2;

    text-shadow: 0 1px 0 #fff8ef;
}

body:not(.reading-mode):not(:has(#home-v2))
.brand-block .brand-subtitle {

    margin: .9cqw 0 0;

    font-size: 1.18cqw;
    letter-spacing: .14em;
    color: #49332e;
}

/* Hide the old navigation */

body:not(.reading-mode):not(:has(#home-v2))
#main-nav {
    display: none !important;
}

/* 04. Unified navigation */

.shared-nav {

    position: absolute;
    top: 81.8%;
    left: 23.1%;

    width: 54.9%;
    height: 13.6%;

    display: grid;
    grid-template-columns: 1fr 1fr 1.15fr .36fr;

    align-items: stretch;

    z-index: 30;
}

.shared-nav button,
.shared-menu summary {

    display: flex;
    justify-content: center;
    align-items: center;

    gap: .55cqw;

    padding: 0 .65cqw;
    margin: 0;

    border: 0;
    background: transparent;

    color: #49332e;
    font-family: var(--serif);
    font-size: 1.15cqw;

    white-space: nowrap;
    cursor: pointer;
}

.shared-nav > button + button {
    border-left: 1px solid rgba(175,130,95,.12);
}

.shared-nav svg {

    width: 1.2em;
    height: 1.2em;

    color: #95654f;
    flex-shrink: 0;
}

.shared-nav button:hover,
.shared-nav button.active,
.shared-menu summary:hover {
    background: rgba(241,204,165,.28);
}

.shared-menu {
    position: relative;
}

.shared-menu summary {

    width: 100%;
    height: 100%;

    list-style: none;
}

.shared-menu summary::-webkit-details-marker {
    display: none;
}

.shared-menu-panel {

    position: absolute;

    top: calc(100% + 8px);
    right: 0;

    min-width: 180px;

    padding: 8px;

    background: #fbf1e8;

    border: 1px solid #d8b99d;
    border-radius: 8px;

    box-shadow:
        0 10px 35px rgba(103,62,52,.14);
}

.shared-menu-panel button {

    width: 100%;

    display: block;

    padding: 12px 16px;

    text-align: left;
    font-size: 14px;
}

/* 05. Shared manuscript panel */

body:not(.reading-mode):not(:has(#home-v2))
#main-content {

    position: relative;

    width: 88%;
    max-width: 1450px;

    min-height: 360px;

    margin: 0 auto;

    padding: 36px 5% 44px;

    background: linear-gradient(
        145deg,
        rgba(255,249,241,.98),
        rgba(249,236,230,.98)
    );

    border: 1px solid #cda77e;

    border-radius:
        30px 30px 42px 42px;

    box-shadow:
        0 0 0 3px rgba(255,244,222,.65),
        0 15px 50px rgba(146,99,89,.07);

    overflow-wrap: anywhere;
}

/* Fine inner gold border */

body:not(.reading-mode):not(:has(#home-v2))
#main-content::before {

    content: "";

    position: absolute;
    inset: 7px;

    border: 1px solid rgba(198,151,106,.4);

    border-radius:
        24px 24px 35px 35px;

    pointer-events: none;
}

/* Decorative corner ornaments */

body:not(.reading-mode):not(:has(#home-v2))
#main-content::after {

    content: "";

    position: absolute;
    inset: 0;

    border-radius: inherit;

    background:
        radial-gradient(
            ellipse at top left,
            rgba(222,177,126,.14),
            transparent 22%
        ),
        radial-gradient(
            ellipse at bottom right,
            rgba(222,177,126,.14),
            transparent 22%
        );

    pointer-events: none;
}

body:not(.reading-mode):not(:has(#home-v2))
.section-heading {

    position: relative;

    padding-bottom: 12px;

    border-bottom:
        1px solid rgba(183,131,88,.48);
}

body:not(.reading-mode):not(:has(#home-v2))
.section-heading::after {

    content: "✧";

    position: absolute;
    right: -3px;
    bottom: -11px;

    color: #bd936d;
    font-size: 14px;
}

body:not(.reading-mode):not(:has(#home-v2))
.section-heading h2 {

    font-size: 25px;
    letter-spacing: 1px;
    font-weight: 600;
}

body:not(.reading-mode):not(:has(#home-v2))
.section-heading .caption {

    font-family: Georgia, serif;
    font-style: italic;

    color: #986f5c;
}

/* 06. Real book covers */

.shared-book-cover {

    display: block;

    width: 132px;
    height: auto;

    aspect-ratio: 147 / 174;

    object-fit: cover;

    flex-shrink: 0;

    background: #e5d8cb;

    border: 1px solid #cda77e;
    border-radius: 5px 9px 5px 9px;

    box-shadow:
        0 3px 10px rgba(102,68,50,.12);
}

.work-detail .shared-book-cover {
    width: 150px;
}

/* 07. Library */

body:not(:has(#home-v2))
#app[data-story-view="library"]
.library-grid {

    display: grid;

    grid-template-columns:
        repeat(auto-fit, minmax(min(100%,330px),1fr));

    gap: 22px;
}

@media (min-width: 901px) {

    body:not(:has(#home-v2))
    #app[data-story-view="library"]
    .library-grid:has(> .add-work:nth-child(2):last-child) {

        grid-template-columns: 3fr 1fr;
    }
}

body:not(.reading-mode):not(:has(#home-v2))
.work-card,

body:not(.reading-mode):not(:has(#home-v2))
.book-card {

    position: relative;

    display: flex;

    align-items: flex-start;

    min-width: 0;
    min-height: 185px;

    padding: 14px 18px;

    gap: 24px;

    background: rgba(255,250,245,.24);

    border: 1px solid rgba(191,147,107,.36);

    border-radius: 6px 10px 6px 10px;

    box-shadow: none;
}

body:not(.reading-mode):not(:has(#home-v2))
.work-card:hover {

    background: rgba(255,252,247,.7);

    transform: translateY(-2px);

    box-shadow:
        0 5px 20px rgba(128,85,65,.08);
}

.work-card .work-info h3 {

    font-size: 30px;

    margin: 6px 0;
}

.work-card .work-info .muted {

    color: #a47458;

    font-family: Georgia, serif;
}

body:not(:has(#home-v2))
.add-work {

    min-height: 185px;

    border: 1px dashed #d3b094;

    border-radius: 8px;

    background: rgba(255,248,238,.12);

    color: #816052;
}

/* 08. Integrated Cyrene footer for library */

body:not(:has(#home-v2))
#app[data-story-view="library"]
.story-footer {

    width: 100%;
    max-width: none;

    position: relative;

    margin: -5px auto 0;

    overflow: hidden;
}

body:not(:has(#home-v2))
#app[data-story-view="library"]
.story-footer .cyrene-art,

body:not(:has(#home-v2))
#app[data-story-view="library"]
.story-footer .footer-text {

    display: none;
}

body:not(:has(#home-v2))
#app[data-story-view="library"]
.story-footer::before {

    content: "";

    display: block;

    width: 100%;

    aspect-ratio: 1536 / 290;

    background-image: var(--shared-frame, none);

    background-size: 100% auto;
    background-position: center bottom;
    background-repeat: no-repeat;

    -webkit-mask-image: linear-gradient(
        transparent,
        black 18%,
        black 100%
    );

    mask-image: linear-gradient(
        transparent,
        black 18%,
        black 100%
    );
}

/* 09. Work details and chapter directory */

body:not(:has(#home-v2))
.work-detail {

    margin-bottom: 30px;

    padding-bottom: 25px;

    border-bottom: 1px solid var(--border);
}

body:not(.reading-mode):not(:has(#home-v2))
.volume-group {

    border: 1px solid var(--border);

    border-radius: 6px;

    background: rgba(255,250,242,.26);

    margin: 14px 0;
}

body:not(.reading-mode):not(:has(#home-v2))
.volume-title {

    background: rgba(231,205,184,.25);

    padding: 16px 20px;

    font-weight: 600;

    color: #67483d;
}

body:not(.reading-mode):not(:has(#home-v2))
.chapter-row {

    padding: 14px 22px;

    font-size: 16px;
}

body:not(.reading-mode):not(:has(#home-v2))
.chapter-row:hover {

    background: rgba(236,209,186,.28)
        !important;
}

/* 10. Studio and analytics */

body:not(:has(#home-v2))
.studio-sidebar {

    background: rgba(236,218,205,.45);

    border: 1px solid var(--border);

    border-radius: 6px;
}

body:not(:has(#home-v2))
.editor-content,

body:not(:has(#home-v2))
.manuscript-editor {

    background: #fffaf3;

    border-color: #d6bda7;

    box-shadow:
        inset 0 0 25px rgba(195,155,118,.045);
}

body:not(.reading-mode):not(:has(#home-v2))
.stat-card,

body:not(.reading-mode):not(:has(#home-v2))
.panel {

    background: rgba(255,250,243,.65);

    border: 1px solid var(--border);

    border-radius: 6px;

    box-shadow: none;
}

body:not(.reading-mode):not(:has(#home-v2))
.stat-value {

    color: #9a6c58;
}

body:not(.reading-mode):not(:has(#home-v2))
.primary-button {

    color: #fffaf3;

    background: #a57b69;

    border-color: #a57b69;
}

body:not(.reading-mode):not(:has(#home-v2))
.primary-button:hover {
    background: #8f6454;
}

body:not(.reading-mode):not(:has(#home-v2))
.secondary-button {

    background: rgba(255,249,241,.6);

    border-color: rgba(184,137,98,.4);
}

/* 11. Immersive reader
   No character illustration in the reading area.
*/

body.reading-mode #app {

    width: 100%;
    max-width: none;

    background: var(--paper);
}

body.reading-mode #app::before {

    display: none;
}

body.reading-mode .reader-toolbar {

    border-bottom: 1px solid var(--border);

    padding: 12px 24px;

    background: var(--paper);
}

body.reading-mode .reader-content {

    color: var(--ink);

    padding-top: 65px;
}

body.reading-mode .reader-content h1 {

    position: relative;

    padding-bottom: 28px;
    margin-bottom: 35px;
}

body.reading-mode .reader-content h1::after {

    content: "✧";

    position: absolute;

    bottom: 0;
    left: 50%;

    transform: translateX(-50%);

    width: 75%;

    color: var(--gold);
    font-size: 17px;

    background: linear-gradient(
        90deg,
        transparent,
        var(--gold),
        transparent
    ) center / 100% 1px no-repeat;

    text-align: center;
}

body.reading-mode .reader-content h2 {

    font-weight: 600;

    text-align: center;
}

body.reading-mode .reader-content .caption {

    text-indent: 0;

    text-align: center;

    color: var(--ink-secondary);
}

body.reading-mode .reader-directory {

    background: var(--paper-soft);
}

@media (min-width: 901px) and (orientation: landscape) {

    body.reading-mode .reader-directory {

        position: sticky;

        top: 75px;

        align-self: start;

        max-height: calc(100dvh - 75px);
    }
}

body.reading-mode .reader-footer {

    padding-top: 20px;
    padding-bottom: 25px;

    border-top: 1px solid var(--border);
}

body.reading-mode[data-theme="paper"] {

    --paper: #fbf5ed;
    --paper-soft: #f4eae0;
    --ink: #3b302b;
    --gold: #c5a17c;
}

body.reading-mode[data-theme="warm"] {

    --paper: #f2e5ca;
    --ink: #44382b;
}

body.reading-mode[data-theme="dark"] {

    --paper: #222124;
    --paper-soft: #2c292e;
    --ink: #ddd3c8;
    --gold: #b79b78;
}

/* 12. Tablet and mobile */

@media (max-width: 900px) {

    body:not(.reading-mode):not(:has(#home-v2))
    #app:not([hidden])::before {

        aspect-ratio: auto;

        height: 360px;

        background-size: auto 720px;
        background-position: center top;

        mask-image: linear-gradient(
            black,
            black 45%,
            transparent
        );

        -webkit-mask-image: linear-gradient(
            black,
            black 45%,
            transparent
        );
    }

    body:not(.reading-mode):not(:has(#home-v2))
    .site-header {

        aspect-ratio: auto;

        padding: 26px 18px 18px;
    }

    body:not(.reading-mode):not(:has(#home-v2))
    .header-meta {

        position: static;

        font-size: 11px;
        letter-spacing: .03em;
    }

    body:not(.reading-mode):not(:has(#home-v2))
    .brand-block {

        position: static;

        width: 100%;

        padding: 25px 0;
    }

    body:not(.reading-mode):not(:has(#home-v2))
    .brand-block .brand-title {

        font-size: clamp(44px,9vw,76px);
    }

    body:not(.reading-mode):not(:has(#home-v2))
    .brand-block .brand-subtitle {

        font-size: 14px;

        margin-top: 12px;
    }

    .shared-nav {

        position: relative;

        top: auto;
        left: auto;

        width: 100%;
        height: 48px;

        border: 1px solid #d3ae8c;

        border-radius: 8px;

        background:
            rgba(255,248,240,.94);
    }

    .shared-nav button,
    .shared-menu summary {

        font-size: 13px;

        gap: 6px;
        padding: 6px;
    }

    body:not(.reading-mode):not(:has(#home-v2))
    #main-content {

        width: calc(100% - 36px);

        padding: 24px;

        border-radius:
            20px 20px 28px 28px;
    }

    body:not(.reading-mode):not(:has(#home-v2))
    #main-content::before {

        inset: 5px;

        border-radius: 16px;
    }

    body:not(:has(#home-v2))
    #app[data-story-view="library"]
    .story-footer::before {

        aspect-ratio: auto;

        height: clamp(165px,31vw,300px);

        background-size: 115% auto;
    }

    .shared-book-cover {
        width: 110px;
    }

    body.reading-mode .reader-content {

        padding-top: 45px;
    }
}

/* Phone */

@media (max-width: 480px) {

    body:not(.reading-mode):not(:has(#home-v2))
    #main-content {

        width: calc(100% - 24px);

        padding: 20px 18px;
    }

    .shared-nav button,
    .shared-menu summary {
        font-size: 12px;
    }

    body:not(.reading-mode):not(:has(#home-v2))
    .section-heading h2 {

        font-size: 21px;
    }

    body:not(.reading-mode):not(:has(#home-v2))
    .work-card {

        gap: 14px;

        padding: 12px;

        min-height: 145px;
    }

    .shared-book-cover,
    .work-detail .shared-book-cover {

        width: 85px;
    }

    .work-card .work-info h3 {

        font-size: 25px;
    }

    body:not(:has(#home-v2))
    .add-work {

        min-height: 65px;
    }

    body.reading-mode .reader-toolbar {

        padding: 8px 12px;
    }

    body.reading-mode .reader-content {

        width: calc(100% - 36px);

        padding-top: 35px;
    }
}

@media (prefers-reduced-motion: reduce) {

    .shared-nav *,
    .work-card {

        transition: none !important;
    }
}

`;


/* ==========================================
   13. Shared navigation icons
   ========================================== */

const ICONS = {

    home: `
        <svg viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            stroke-width="1.4">
            <path d="M3 11L12 3L21 11"/>
            <path d="M5.5 10V21H10V14H14V21H18.5V10"/>
        </svg>
    `,

    book: `
        <svg viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            stroke-width="1.4">
            <path d="M12 5V21"/>
            <path d="M12 5C8 2 4 3 2 5V19C6 17 9 18 12 21"/>
            <path d="M12 5C16 2 20 3 22 5V19C18 17 15 18 12 21"/>
        </svg>
    `,

    chart: `
        <svg viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            stroke-width="1.4">
            <path d="M3 3V21H22"/>
            <path d="M6 18V10H9V18"/>
            <path d="M12 18V5H15V18"/>
            <path d="M18 18V12H21V18"/>
        </svg>
    `,

    user: `
        <svg viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            stroke-width="1.4">
            <circle cx="12" cy="7" r="4"/>
            <path d="M4 21C4 11 20 11 20 21Z"/>
        </svg>
    `
};


/* ==========================================
   14. Theme installation
   ========================================== */

export function installThemeV2(ctx) {

    const {
        db,
        state,
        navigate,
        isAdmin,
        logout,
        report,
        escape
    } = ctx;

    const app = document.getElementById('app');

    const header =
        document.getElementById('site-header');

    const assets = {};

    let style =
        document.getElementById('shared-theme-v2');

    if (!style) {

        style = document.createElement('style');

        style.id = 'shared-theme-v2';

        style.textContent = THEME_CSS;

        document.head.appendChild(style);
    }


    /* Create a consistent navigation bar */

    const nav = document.createElement('nav');

    nav.className = 'shared-nav';

    nav.setAttribute('aria-label', '主导航');

    nav.innerHTML = `

        <button type="button"
                data-shell-view="home">

            ${ICONS.home} 首页

        </button>

        <button type="button"
                data-shell-view="library">

            ${ICONS.book} 作品

        </button>

        <button type="button"
                id="shared-insights"
                data-shell-view="history">

            ${ICONS.chart}

            <span id="shared-insights-label">
                阅读记录
            </span>

        </button>

        <details class="shared-menu">

            <summary aria-label="个人菜单">

                ${ICONS.user}

            </summary>

            <div class="shared-menu-panel">

                <button type="button"
                    data-shell-view="studio"
                    data-shell-admin
                    hidden>

                    创作管理

                </button>

                <button type="button"
                    data-shell-view="history">

                    我的阅读记录

                </button>

                <button type="button"
                    data-shell-view="settings">

                    个人设置

                </button>

                <button type="button"
                    data-shell-logout>

                    退出登录

                </button>

            </div>

        </details>

    `;

    header.appendChild(nav);


    /* Handle navigation without changing core logic */

    nav.addEventListener('click', async event => {

        const button =
            event.target.closest('button');

        if (!button) return;

        const menu =
            nav.querySelector('.shared-menu');

        if (menu) menu.open = false;

        try {

            if (button.hasAttribute('data-shell-logout')) {

                await logout();

                return;
            }

            const view =
                button.dataset.shellView;

            if (view) {

                await navigate(view);
            }

        } catch (error) {

            report(error);
        }
    });


    /* Download private artwork into memory only */

    async function loadAsset(name) {

        const userId = state.user?.id;

        if (!userId) return;

        const result = await db.storage
            .from('story-art')
            .download(name);

        if (result.error) {

            console.warn(
                'Shared theme artwork:',
                name,
                result.error
            );

            return;
        }

        if (state.user?.id !== userId || app.hidden) {

            return;
        }

        const newUrl = URL.createObjectURL(
            result.data
        );

        if (assets[name]) {

            URL.revokeObjectURL(assets[name]);
        }

        assets[name] = newUrl;

        if (name === 'story-frame.webp') {

            app.style.setProperty(
                '--shared-frame',
                'url(' + JSON.stringify(newUrl) + ')'
            );
        }
    }


    async function loadArt() {

        await Promise.allSettled([

            loadAsset('story-frame.webp'),

            loadAsset('genshin-cover.webp')

        ]);
    }


    /* Use the actual Genshin artwork everywhere */

    function cover(work) {

        if (!work) return null;

        const isGenshin =
            work.title === '原神'
            || work.subtitle === 'Genshin Impact';

        const url =
            assets['genshin-cover.webp'];

        if (!isGenshin || !url) {

            return null;
        }

        return `

            <img
                class="work-cover shared-book-cover"
                src="${escape(url)}"
                alt="${escape(work.title)}作品封面">

        `;
    }


    /* Update theme when a page changes */

    function refresh() {

        app.dataset.storyView = state.view;

        const admin = isAdmin();

        const insights =
            document.getElementById('shared-insights');

        const insightsLabel =
            document.getElementById(
                'shared-insights-label'
            );

        insights.dataset.shellView =
            admin ? 'insights' : 'history';

        insightsLabel.textContent =
            admin ? '阅读反馈' : '阅读记录';

        nav.querySelectorAll('[data-shell-admin]')
            .forEach(element => {

                element.hidden = !admin;
            });

        const currentView =
            state.view === 'work'
                ? 'library'
                : state.view;

        nav.querySelectorAll('[data-shell-view]')
            .forEach(button => {

                button.classList.toggle(
                    'active',
                    button.dataset.shellView === currentView
                );
            });

        if (state.view === 'reader') {

            document
                .querySelectorAll('.reader-content')
                .forEach(element => {

                    element.style.fontFamily =
                        state.preferences.font_family === 'sans'
                            ? 'var(--sans)'
                            : 'var(--serif)';
                });
        }
    }


    /* Remove artwork URLs when logged out */

    function clear() {

        Object.values(assets).forEach(url => {

            URL.revokeObjectURL(url);
        });

        Object.keys(assets).forEach(name => {

            delete assets[name];
        });

        app.style.removeProperty('--shared-frame');

        delete app.dataset.storyView;
    }

    const observer = new MutationObserver(() => {

        if (app.hidden) {

            clear();
        }
    });

    observer.observe(app, {

        attributes: true,

        attributeFilter: ['hidden']
    });

    return {

        loadArt,

        cover,

        refresh
    };
}
