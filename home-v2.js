
/* ==========================================
   STORY HUB - HOME V2
   如我所书 · 融合式首页
   Reference canvas: 1536 x 1024
   ========================================== */

const V2_CSS = `

/* 01. Remove the old home layout only */

body:has(#home-v2) {
    margin: 0;
    background: #eee0e4;
}

body:has(#home-v2) #world-background,
body:has(#home-v2) .ambient-overlay,
body:has(#home-v2) #site-header,
body:has(#home-v2) #story-footer {
    display: none !important;
}

body:has(#home-v2) #main-content {
    width: 100%;
    max-width: none;
    min-height: 100dvh;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
}

/* 02. Original illustration canvas */

#home-v2 {
    --v2-ink: #49302d;
    --v2-muted: #886457;
    --v2-gold: #c99b70;
    --v2-line: rgba(178,125,85,.32);

    position: relative;
    container-type: inline-size;

    width: min(100%, max(1000px, 150dvh));
    aspect-ratio: 1536 / 1024;

    margin: 0 auto;

    background-image: var(--v2-art);
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;

    color: var(--v2-ink);
    font-family: var(--serif);

    font-size: 1cqw;
    line-height: 1.65;
}

#home-v2 * {
    box-sizing: border-box;
}

#home-v2 button {
    font-family: inherit;
    color: inherit;
    cursor: pointer;
}

#home-v2 svg {
    display: inline-block;
    width: 1.2em;
    height: 1.2em;
    vertical-align: -.15em;
    flex-shrink: 0;
}

#home-v2 button:focus-visible,
#home-v2 summary:focus-visible {
    outline: 2px solid #b78383;
    outline-offset: 4px;
}

/* 03. Header positioning */

.v2-meta {
    position: absolute;
    top: 8.65%;
    left: 24.4%;
    right: 25.5%;

    display: flex;
    align-items: center;
    justify-content: space-between;

    font-family: Georgia, var(--serif);
    font-size: 1.02cqw;
    letter-spacing: .04em;
}

.v2-brand {
    position: absolute;
    top: 12.4%;
    left: 25%;
    width: 50%;
    text-align: center;
}

.v2-brand h1 {
    margin: 0;

    font-family: "Times New Roman", Georgia, serif;
    font-size: 4.6cqw;
    font-weight: 400;
    font-style: italic;
    letter-spacing: -.035em;
    line-height: 1.2;

    color: #795044;
    text-shadow: 0 1px 0 #fff8ef;
}

.v2-subtitle {
    margin: .9cqw 0 0;
    font-size: 1.18cqw;
    letter-spacing: .14em;
}

/* 04. Navigation inside the original gold frame */

.v2-nav {
    position: absolute;
    top: 25.6%;
    left: 23.1%;
    width: 54.9%;
    height: 4.25%;

    display: grid;
    grid-template-columns: 1fr 1fr 1.15fr .36fr;
    align-items: stretch;

    z-index: 10;
}

.v2-nav > button,
.v2-menu > summary {
    background: transparent;
    border: 0;
    padding: 0 .7cqw;
    margin: 0;

    display: flex;
    align-items: center;
    justify-content: center;
    gap: .55cqw;

    white-space: nowrap;
    font-size: 1.15cqw;
    line-height: 1.3;
}

.v2-nav > button:hover,
.v2-menu > summary:hover {
    background: rgba(255,233,209,.36);
}

.v2-nav > button + button {
    border-left: 1px solid rgba(174,128,94,.12);
}

.v2-nav > button svg,
.v2-menu > summary svg {
    color: #95654f;
}

.v2-menu {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.v2-menu > summary {
    width: 100%;
    height: 100%;
    cursor: pointer;
    list-style: none;
}

.v2-menu > summary::-webkit-details-marker {
    display: none;
}

.v2-menu-panel {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;

    width: max-content;
    min-width: 155px;
    padding: 8px;

    background: #fbf2e8;
    border: 1px solid #d8b99d;
    border-radius: 8px;

    box-shadow: 0 8px 30px rgba(90,50,50,.12);
}

.v2-menu-panel button {
    display: block;
    width: 100%;
    padding: 12px 18px;

    border: none;
    background: transparent;

    font-size: 14px;
    text-align: left;
}

.v2-menu-panel button:hover {
    background: #f0e1d8;
}

/* 05. Literary introduction */

.v2-hero {
    position: absolute;
    top: 32.5%;
    left: 17.1%;
    width: 31%;
}

.v2-hero h2 {
    margin: 0 0 .7cqw;

    font-size: 2.08cqw;
    font-weight: 600;
    letter-spacing: .025em;
    line-height: 1.36;
}

.v2-hero p {
    margin: 0;

    color: var(--v2-muted);
    font-family: Georgia, serif;
    font-style: italic;
    font-size: 1.04cqw;
    line-height: 1.45;
}

/* 06. Collection and recent updates */

.v2-collection {
    position: absolute;
    top: 48.65%;
    left: 10.9%;
    width: 43.3%;
}

.v2-recent {
    position: absolute;
    top: 48.65%;
    left: 60.6%;
    width: 28.3%;
}

.v2-heading {
    height: 2.8cqw;

    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: .5cqw;
}

.v2-heading-main {
    display: flex;
    align-items: center;
    gap: .7cqw;
}

.v2-heading h2 {
    font-size: 1.52cqw;
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
}

.v2-heading em {
    font-family: Georgia, serif;
    font-size: .98cqw;
    color: var(--v2-muted);
    font-weight: 400;
    white-space: nowrap;
}

.v2-heading svg {
    color: #ae774b;
    font-size: 1.4cqw;
}

.v2-all {
    align-self: flex-end;

    border: 0;
    background: transparent;
    padding: 0 0 .15cqw;

    font-size: .8cqw;
    white-space: nowrap;
}

.v2-all:hover {
    text-decoration: underline;
}

/* 07. Dynamic book cards */

.v2-books {
    display: grid;
    grid-template-columns: 1fr 23.6%;
    gap: 1.35cqw;
    margin-top: .65cqw;
}

.v2-books.reader-books {
    grid-template-columns: 1fr;
}

.v2-book {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 1.8cqw;

    width: 100%;
    height: 12.1cqw;

    padding: .55cqw 1.05cqw;
    border: 1px solid var(--v2-line);
    border-radius: 6px 9px 6px 9px;

    background: rgba(255,250,242,.14);
    text-align: left;

    transition: background .2s;
}

.v2-book:hover {
    background: rgba(255,250,242,.55);
}

.v2-book-cover {
    width: 9.4cqw;
    height: 11cqw;
    flex-shrink: 0;

    object-fit: cover;
    border: 1px solid #cda777;
    border-radius: 5px 9px 5px 9px;

    box-shadow: 0 2px 8px rgba(106,69,49,.12);
}

.v2-placeholder-cover {
    display: grid;
    place-content: center;
    padding: 8px;

    text-align: center;

    color: #fff8ed;
    background: linear-gradient(
        135deg,
        #cbb7a7,
        #9c889e
    );

    font-size: 1.5cqw;
}

.v2-book-info {
    min-width: 0;
    flex: 1;
    padding-top: .35cqw;
}

.v2-book-meta {
    display: block;
    font-size: .84cqw;
    letter-spacing: .04em;
}

.v2-book-info h3 {
    margin: .35cqw 0 .2cqw;
    font-size: 2.1cqw;
    line-height: 1.25;
}

.v2-book-info i {
    display: block;
    font-family: Georgia, serif;
    color: #a47255;
    font-size: 1.07cqw;
}

.v2-book-info p {
    margin-top: .8cqw;
    font-size: .96cqw;
    line-height: 1.6;

    overflow: hidden;

    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.v2-book-arrow {
    position: absolute;
    right: 1.45cqw;
    bottom: .9cqw;

    color: #946951;
    font-size: 1.65cqw;
}

.v2-add {
    height: 12.1cqw;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    border: 1px dashed var(--v2-line);
    border-radius: 8px;

    background: transparent;
    font-size: 1.05cqw;
}

.v2-add span {
    font-size: 2.4cqw;
    font-weight: 300;
    line-height: 1.4;
}

.v2-add:hover {
    background: rgba(255,250,242,.5);
}

/* 08. Real published chapter updates */

.v2-updates {
    list-style: none;
    margin: .7cqw 0 0;
    padding: 0;
}

.v2-update {
    display: grid;
    grid-template-columns: 1.5em minmax(0,1fr) auto;
    align-items: center;
    gap: .9cqw;

    width: 100%;
    min-height: 3.82cqw;

    background: transparent;
    border: 0;
    border-bottom: 1px solid var(--v2-line);

    padding: .85cqw .3cqw;
    text-align: left;
    font-size: .89cqw;
}

.v2-update:hover {
    background: rgba(255,250,242,.55);
}

.v2-update-number {
    color: #a57559;
    font-family: Georgia, serif;
}

.v2-update-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v2-update-date {
    white-space: nowrap;
    font-family: Georgia, serif;
    color: var(--v2-muted);
}

.v2-empty {
    color: var(--v2-muted);
    padding: 1.4cqw .3cqw;
    font-size: .95cqw;
}

/* The full artwork already contains Cyrene */

.v2-mobile-art {
    display: none;
}

/* 09. Tablet and mobile reading access */

@media (max-width: 900px) {

    #home-v2 {
        width: 100%;
        min-height: 100dvh;
        aspect-ratio: auto;

        background: #f9eee8;
        font-size: 15px;
    }

    .v2-top {
        position: relative;

        padding: 30px 18px 16px;

        background-image:
            linear-gradient(
                transparent 65%,
                #f9eee8 100%
            ),
            var(--v2-art);

        background-position: center top;
        background-repeat: no-repeat;
        background-size: 100% 100%, 115% auto;
    }

    .v2-meta,
    .v2-brand,
    .v2-nav,
    .v2-hero,
    .v2-collection,
    .v2-recent {
        position: static;
        width: auto;
        height: auto;
    }

    .v2-meta {
        font-size: 11px;
        padding: 0 10px;
    }

    .v2-brand {
        padding: 24px 0;
    }

    .v2-brand h1 {
        font-size: clamp(44px, 9vw, 76px);
    }

    .v2-subtitle {
        font-size: 14px;
        margin-top: 10px;
    }

    .v2-nav {
        grid-template-columns: 1fr 1fr 1.15fr .5fr;

        border: 1px solid #d3ae8c;
        background: rgba(255,248,240,.94);
        border-radius: 7px;
    }

    .v2-nav > button,
    .v2-menu > summary {
        min-height: 46px;
        font-size: 14px;
        gap: 6px;
        padding: 5px;
    }

    .v2-hero {
        padding: 22px 7% 20px;
    }

    .v2-hero h2 {
        font-size: clamp(25px, 4.5vw, 34px);
        margin-bottom: 12px;
    }

    .v2-hero p {
        font-size: 14px;
    }

    .v2-collection,
    .v2-recent {
        padding: 10px 7% 22px;
    }

    .v2-heading {
        height: auto;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--v2-line);
    }

    .v2-heading-main {
        gap: 8px;
        flex-wrap: wrap;
    }

    .v2-heading h2 {
        font-size: 21px;
    }

    .v2-heading em {
        font-size: 12px;
    }

    .v2-heading svg {
        font-size: 19px;
    }

    .v2-all {
        font-size: 12px;
    }

    .v2-books {
        margin-top: 14px;
        gap: 12px;
        grid-template-columns: 1fr 25%;
    }

    .v2-book {
        height: auto;
        min-height: 155px;
        gap: 15px;
        padding: 12px;
    }

    .v2-book-cover {
        width: 95px;
        height: 125px;
    }

    .v2-book-meta {
        font-size: 11px;
    }

    .v2-book-info {
        padding: 0;
    }

    .v2-book-info h3 {
        font-size: 25px;
        margin: 7px 0;
    }

    .v2-book-info i {
        font-size: 13px;
    }

    .v2-book-info p {
        font-size: 13px;
        margin-top: 9px;
    }

    .v2-book-arrow {
        font-size: 20px;
        right: 10px;
        bottom: 5px;
    }

    .v2-add {
        height: auto;
        min-height: 155px;
        font-size: 13px;
    }

    .v2-add span {
        font-size: 28px;
    }

    .v2-updates {
        margin-top: 8px;
    }

    .v2-update {
        min-height: 50px;
        padding: 12px 4px;
        gap: 8px;
        font-size: 13px;
    }

    .v2-empty {
        padding: 18px 4px;
        font-size: 14px;
    }

    /* Preserve the original integrated footer art */

    .v2-mobile-art {
        display: block;

        width: 100%;
        height: clamp(165px, 31vw, 300px);

        background-image: var(--v2-art);
        background-size: 115% auto;
        background-position: center bottom;
        background-repeat: no-repeat;

        -webkit-mask-image: linear-gradient(
            transparent,
            #000 23%
        );

        mask-image: linear-gradient(
            transparent,
            #000 23%
        );
    }
}

@media (max-width: 480px) {

    .v2-nav > button,
    .v2-menu > summary {
        font-size: 12px;
    }

    .v2-heading em {
        display: none;
    }

    .v2-books {
        grid-template-columns: 1fr;
    }

    .v2-add {
        min-height: 65px;
        flex-direction: row;
        gap: 12px;
    }

    .v2-book-cover {
        width: 80px;
        height: 110px;
    }

    .v2-update {
        font-size: 12px;
    }
}

@media (prefers-reduced-motion: reduce) {
    #home-v2 * {
        transition: none !important;
    }
}

`;


/* ==========================================
   10. Original-style line icons
   ========================================== */

const V2_ICONS = {

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
    `,

    feather: `
        <svg viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            stroke-width="1.2">
            <path d="M3 21L18 6"/>
            <path d="M6 17C4 7 15 2 22 2C22 12 14 19 6 17Z"/>
            <path d="M10 13H16M13 10V6"/>
        </svg>
    `
};


/* ==========================================
   11. Home V2 integration
   ========================================== */

export function makeHomeV2(ctx) {

    const {
        db,
        state,
        escape,
        check,
        render,
        loadWorks,
        isAdmin,
        navigate,
        showWork,
        openReader,
        createWork,
        logout,
        report,
        toast,
        fallback
    } = ctx;

    if (!document.getElementById('home-v2-style')) {

        const style = document.createElement('style');

        style.id = 'home-v2-style';
        style.textContent = V2_CSS;

        document.head.appendChild(style);
    }

    function bindClick(id, fn) {

        const element = document.getElementById(id);

        if (!element) return;

        element.addEventListener(
            'click',
            async () => {
                try {
                    await fn();
                } catch (error) {
                    report(error);
                }
            }
        );
    }

    async function signedArt(name) {

        const result = await db.storage
            .from('story-art')
            .createSignedUrl(name, 3600);

        return check(result).signedUrl;
    }

    function formatDate(value) {

        if (!value) return '';

        const d = new Date(value);

        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0')
        ].join('.');
    }

    function bookMarkup(work, cover) {

        if (!work) {
            return `
                <div class="v2-empty">
                    尚无开放的馆藏作品。
                </div>
            `;
        }

        return `
            <button
                type="button"
                id="v2-open-book"
                class="v2-book">

                ${work.title === '原神' && cover
                    ? `
                        <img
                            class="v2-book-cover"
                            src="${escape(cover)}"
                            alt="原神作品封面">
                    `
                    : `
                        <div class="v2-book-cover
                                    v2-placeholder-cover">
                            ${escape(work.title)}
                        </div>
                    `
                }

                <div class="v2-book-info">

                    <span class="v2-book-meta">
                        NO. 001 · 长篇小说
                    </span>

                    <h3>${escape(work.title)}</h3>

                    <i>${escape(work.subtitle)}</i>

                    <p>${escape(work.description)}</p>

                </div>

                <span class="v2-book-arrow">→</span>

            </button>
        `;
    }

    return async function showHomeV2() {

        let frame;
        let cover;

        try {

            frame = await signedArt('story-frame.webp');

        } catch (error) {

            console.error(error);

            toast('新版美术底图加载失败，已使用原首页');

            return fallback();
        }

        try {

            cover = await signedArt('genshin-cover.webp');

        } catch (error) {

            console.warn('Cover loading:', error);
            cover = null;
        }

        await loadWorks();

        const recent = check(
            await db.from('chapters')
                .select(
                    'id,title,published_at,' +
                    'volumes(title,works(title))'
                )
                .eq('status', 'published')
                .order('published_at', {
                    ascending: false
                })
                .limit(3)
        ) || [];

        if (state.view !== 'home' || !state.user) {
            return;
        }

        const firstWork = state.works.find(
            work => work.title === '原神'
        ) || state.works[0];

        const admin = isAdmin();

        render(`

            <section id="home-v2">

                <header class="v2-top">

                    <div class="v2-meta">

                        <span>VOL. 01</span>

                        <span>故事 · 创作 · 阅读</span>

                        <span>SINCE 2026</span>

                    </div>

                    <div class="v2-brand">

                        <h1>Story Hub</h1>

                        <p class="v2-subtitle">
                            私人小说创作与阅读空间
                        </p>

                    </div>

                    <nav class="v2-nav"
                         aria-label="首页导航">

                        <button id="v2-home">
                            ${V2_ICONS.home}
                            首页
                        </button>

                        <button id="v2-library">
                            ${V2_ICONS.book}
                            作品
                        </button>

                        <button id="v2-insights">
                            ${V2_ICONS.chart}
                            ${admin
                                ? '阅读反馈'
                                : '阅读记录'}
                        </button>

                        <details class="v2-menu">

                            <summary aria-label="个人菜单">
                                ${V2_ICONS.user}
                            </summary>

                            <div class="v2-menu-panel">

                                ${admin ? `
                                    <button id="v2-studio">
                                        创作管理
                                    </button>
                                ` : ''}

                                <button id="v2-history">
                                    我的阅读记录
                                </button>

                                <button id="v2-settings">
                                    个人设置
                                </button>

                                <button id="v2-logout">
                                    退出登录
                                </button>

                            </div>

                        </details>

                    </nav>

                </header>

                <section class="v2-hero">

                    <h2>
                        让故事，<br>
                        以另一种方式延续。
                    </h2>

                    <p>
                        Turn the stories from games<br>
                        into novels worth reading.
                    </p>

                </section>

                <section class="v2-collection">

                    <div class="v2-heading">

                        <div class="v2-heading-main">

                            ${V2_ICONS.book}

                            <h2>馆藏作品</h2>

                            <em>The Collection</em>

                        </div>

                        <button id="v2-all-works"
                                class="v2-all">
                            全部作品 →
                        </button>

                    </div>

                    <div class="v2-books
                        ${admin ? '' : 'reader-books'}">

                        ${bookMarkup(firstWork, cover)}

                        ${admin ? `
                            <button id="v2-add-work"
                                    class="v2-add">

                                <span>＋</span>

                                新增作品

                            </button>
                        ` : ''}

                    </div>

                </section>

                <section class="v2-recent">

                    <div class="v2-heading">

                        <div class="v2-heading-main">

                            ${V2_ICONS.feather}

                            <h2>最近更新</h2>

                            <em>Recent Updates</em>

                        </div>

                    </div>

                    <ul class="v2-updates">

                        ${recent.length
                            ? recent.map((chapter, index) => `

                                <li>

                                    <button
                                        class="v2-update"
                                        data-v2-chapter="${escape(chapter.id)}">

                                        <span class="v2-update-number">
                                            ${String(index + 1)
                                                .padStart(2, '0')}
                                        </span>

                                        <span class="v2-update-title"
                                            title="${escape(chapter.title)}">

                                            《${escape(
                                                chapter.volumes?.works?.title
                                            )}》

                                            ${escape(
                                                chapter.volumes?.title
                                            )}

                                            ·

                                            ${escape(chapter.title)}

                                        </span>

                                        <time class="v2-update-date">

                                            ${formatDate(
                                                chapter.published_at
                                            )}

                                        </time>

                                    </button>

                                </li>

                            `).join('')
                            : `
                                <li class="v2-empty">
                                    故事尚未开始。
                                </li>
                            `
                        }

                    </ul>

                </section>

                <div class="v2-mobile-art"
                     aria-label="昔涟与如我所书">
                </div>

            </section>

        `);

        const page = document.getElementById('home-v2');

        page.style.setProperty(
            '--v2-art',
            'url(' + JSON.stringify(frame) + ')'
        );

        bindClick('v2-home', () => navigate('home'));

        bindClick('v2-library', () => navigate('library'));

        bindClick('v2-all-works', () => navigate('library'));

        bindClick('v2-insights', () =>
            navigate(admin ? 'insights' : 'history')
        );

        bindClick('v2-studio', () => navigate('studio'));

        bindClick('v2-history', () => navigate('history'));

        bindClick('v2-settings', () => navigate('settings'));

        bindClick('v2-logout', logout);

        bindClick('v2-add-work', createWork);

        if (firstWork) {
            bindClick('v2-open-book', () =>
                showWork(firstWork.id)
            );
        }

        document.querySelectorAll('[data-v2-chapter]')
            .forEach(button => {

                button.addEventListener('click', () => {

                    openReader(button.dataset.v2Chapter)
                        .catch(report);

                });

            });

    };

}
