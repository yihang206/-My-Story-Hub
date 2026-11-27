
/* ==========================================
   STORY HUB V2 - LIBRARY
   如我所书 · 私人书架
   ========================================== */

const LIBRARY_CSS = `

#home-v2[data-page="library"] .v2-nav
[aria-current="page"] {
    background: rgba(239, 202, 164, .25);
    box-shadow: inset 0 -2px #c99b70;
}

#home-v2[data-page="library"] .v2-hero h2 {
    font-size: 2.45cqw;
    letter-spacing: .1em;
}

#home-v2[data-page="library"] .v2-hero p {
    margin-top: .8cqw;
}

.library-v2-list {
    list-style: none;
    padding: 0;
    margin: .7cqw 0 0;
    max-height: 12.1cqw;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #cba78e transparent;
}

.library-v2-row {
    display: grid;
    grid-template-columns: 2em minmax(0,1fr) auto;
    align-items: center;
    gap: .9cqw;

    width: 100%;
    min-height: 3.8cqw;

    padding: .75cqw .35cqw;
    background: transparent;
    border: 0;
    border-bottom: 1px solid var(--v2-line);

    text-align: left;
    font-size: 1.02cqw;
}

.library-v2-row:hover {
    background: rgba(255,250,242,.55);
}

.library-v2-row strong {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.library-v2-number {
    color: #a57559;
    font-family: Georgia, serif;
}

.library-v2-arrow {
    color: #946951;
}

.library-v2-empty {
    padding: 1.4cqw .3cqw;
    color: var(--v2-muted);
}

.library-v2-error {
    position: absolute;
    top: 53%;
    left: 15%;
    width: 70%;
    text-align: center;
}

@media (max-width: 900px) {

    #home-v2[data-page="library"] .v2-hero h2 {
        font-size: 30px;
    }

    .library-v2-list {
        margin-top: 12px;
        max-height: 380px;
    }

    .library-v2-row {
        min-height: 48px;
        padding: 12px 5px;
        gap: 10px;
        font-size: 15px;
    }

    .library-v2-empty {
        padding: 18px 5px;
    }
}

`;


/* Decorative navigation icons */

const LIBRARY_ICONS = {

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
   Library page
   ========================================== */

export function makeLibraryV2(ctx) {

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
        createWork,
        logout,
        report
    } = ctx;


    /* Install library-specific styles only */

    if (!document.getElementById('library-v2-style')) {

        const style = document.createElement('style');

        style.id = 'library-v2-style';
        style.textContent = LIBRARY_CSS;

        document.head.appendChild(style);
    }


    async function signedArt(name) {

        const result = await db.storage
            .from('story-art')
            .createSignedUrl(name, 3600);

        return check(result).signedUrl;
    }


    function bindClick(id, fn) {

        const element = document.getElementById(id);

        if (!element) return;

        element.addEventListener('click', async () => {

            try {
                await fn();
            } catch (error) {
                report(error);
            }

        });
    }


    /* Reuse the successful Home V2 visual shell */

    function headerMarkup(admin) {

        return `

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
                     aria-label="书架导航">

                    <button id="lib-home"
                            type="button">
                        ${LIBRARY_ICONS.home}
                        首页
                    </button>

                    <button id="lib-library"
                            type="button"
                            aria-current="page">
                        ${LIBRARY_ICONS.book}
                        作品
                    </button>

                    <button id="lib-insights"
                            type="button">
                        ${LIBRARY_ICONS.chart}
                        ${admin ? '阅读反馈' : '阅读记录'}
                    </button>

                    <details class="v2-menu">

                        <summary aria-label="个人菜单">
                            ${LIBRARY_ICONS.user}
                        </summary>

                        <div class="v2-menu-panel">

                            ${admin ? `
                                <button id="lib-studio">
                                    创作管理
                                </button>
                            ` : ''}

                            <button id="lib-history">
                                我的阅读记录
                            </button>

                            <button id="lib-settings">
                                个人设置
                            </button>

                            <button id="lib-logout">
                                退出登录
                            </button>

                        </div>

                    </details>

                </nav>

            </header>

        `;
    }


    /* Real cover and work information */

    function bookMarkup(work, cover, index) {

        if (!work) {

            return `
                <div class="library-v2-empty">
                    暂无馆藏作品。
                </div>
            `;
        }

        const genshin =
            work.title === '原神'
            || work.subtitle === 'Genshin Impact';

        return `

            <button class="v2-book"
                    id="lib-open-book"
                    type="button">

                ${genshin && cover ? `

                    <img class="v2-book-cover"
                         src="${escape(cover)}"
                         alt="原神作品封面">

                ` : `

                    <div class="v2-book-cover
                                v2-placeholder-cover">

                        ${escape(work.title)}

                    </div>

                `}

                <div class="v2-book-info">

                    <span class="v2-book-meta">

                        NO. ${String(index + 1)
                            .padStart(3, '0')}

                        · 长篇小说

                    </span>

                    <h3>${escape(work.title)}</h3>

                    <i>${escape(work.subtitle)}</i>

                    <p>${escape(work.description)}</p>

                </div>

                <span class="v2-book-arrow">→</span>

            </button>

        `;
    }


    /* Main library renderer */

    return async function showLibraryV2() {

        const userId = state.user?.id;

        if (!userId) return;

        const admin = isAdmin();

        let frame;
        let cover = null;

        try {

            frame = await signedArt(
                'story-frame.webp'
            );

        } catch (error) {

            if (state.user?.id !== userId
                || state.view !== 'library') {
                return;
            }

            render(`

                <section id="home-v2"
                         data-page="library">

                    ${headerMarkup(admin)}

                    <div class="library-v2-error">

                        <p>美术素材加载失败。</p>

                        <button id="lib-retry"
                                class="secondary-button">
                            重新加载
                        </button>

                    </div>

                </section>

            `);

            bindClick('lib-retry', () =>
                navigate('library'));

            bindClick('lib-home', () =>
                navigate('home'));

            bindClick('lib-library', () =>
                navigate('library'));

            bindClick('lib-insights', () =>
                navigate(admin ? 'insights' : 'history'));

            bindClick('lib-studio', () =>
                navigate('studio'));

            bindClick('lib-history', () =>
                navigate('history'));

            bindClick('lib-settings', () =>
                navigate('settings'));

            bindClick('lib-logout', logout);

            report(error);
            return;
        }


        try {

            cover = await signedArt(
                'genshin-cover.webp'
            );

        } catch (error) {

            console.warn(
                'Cover loading:',
                error
            );
        }


        await loadWorks();

        if (state.user?.id !== userId
            || state.view !== 'library') {
            return;
        }

        const works = [...state.works];

        const featured =
            works.find(w => w.id === state.work?.id)
            || works.find(w => w.title === '原神')
            || works[0];

        const featuredIndex =
            works.findIndex(w => w.id === featured?.id);


        render(`

            <section id="home-v2"
                     data-page="library">

                ${headerMarkup(admin)}


                <!-- Literary introduction -->

                <section class="v2-hero">

                    <h2>私人书架</h2>

                    <p>
                        The Library
                    </p>

                    <p>
                        每一本书，都是一个等待展开的世界。
                    </p>

                </section>


                <!-- Featured work -->

                <section class="v2-collection">

                    <div class="v2-heading">

                        <div class="v2-heading-main">

                            ${LIBRARY_ICONS.book}

                            <h2>馆藏作品</h2>

                            <em>The Collection</em>

                        </div>

                    </div>

                    <div class="v2-books
                        ${admin ? '' : 'reader-books'}">

                        ${bookMarkup(
                            featured,
                            cover,
                            featuredIndex
                        )}

                        ${admin ? `

                            <button id="lib-add-work"
                                    class="v2-add">

                                <span>＋</span>

                                新增作品

                            </button>

                        ` : ''}

                    </div>

                </section>


                <!-- All available works -->

                <section class="v2-recent">

                    <div class="v2-heading">

                        <div class="v2-heading-main">

                            ${LIBRARY_ICONS.book}

                            <h2>全部作品</h2>

                            <em>All Works</em>

                        </div>

                    </div>

                    <ul class="library-v2-list">

                        ${works.length ? works.map(
                            (work, index) => `

                            <li>

                                <button
                                    class="library-v2-row"
                                    type="button"
                                    data-lib-work="${escape(work.id)}">

                                    <span class="library-v2-number">

                                        ${String(index + 1)
                                            .padStart(2, '0')}

                                    </span>

                                    <strong>
                                        ${escape(work.title)}
                                    </strong>

                                    <span class="library-v2-arrow">
                                        →
                                    </span>

                                </button>

                            </li>

                        `).join('') : `

                            <li class="library-v2-empty">
                                暂无开放的作品。
                            </li>

                        `}

                    </ul>

                </section>


                <!-- Mobile artwork -->

                <div class="v2-mobile-art"
                     aria-label="昔涟与如我所书">
                </div>

            </section>

        `);


        /* Apply the exact same artwork as Home V2 */

        const page = document.getElementById('home-v2');

        page.style.setProperty(
            '--v2-art',
            'url(' + JSON.stringify(frame) + ')'
        );


        /* Navigation */

        bindClick('lib-home', () =>
            navigate('home'));

        bindClick('lib-library', () =>
            navigate('library'));

        bindClick('lib-insights', () =>
            navigate(admin ? 'insights' : 'history'));

        bindClick('lib-studio', () =>
            navigate('studio'));

        bindClick('lib-history', () =>
            navigate('history'));

        bindClick('lib-settings', () =>
            navigate('settings'));

        bindClick('lib-logout', logout);

        bindClick('lib-add-work', createWork);


        /* Open a real work */

        if (featured) {

            bindClick('lib-open-book', () =>
                showWork(featured.id));

        }


        page.querySelectorAll('[data-lib-work]')
            .forEach(button => {

                button.addEventListener('click', async () => {

                    try {

                        await showWork(
                            button.dataset.libWork
                        );

                    } catch (error) {

                        report(error);
                    }

                });
            });

    };
}
