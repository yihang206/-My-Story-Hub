
/* ==========================================
   MY STORY HUB V1.0
   如我所书 · Private Story Library
   ========================================== */

import { createClient } from
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm';

// 01. Supabase Configuration

const SUPABASE_URL =
    'https://wkwwudednbgywllndjtc.supabase.co';

const SUPABASE_KEY =
    'sb_publishable_hSB9p0Mn13Z2oy1C7RN08A_81jMUjxa';

const db = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const $ = id => document.getElementById(id);

const state = {
    user: null,
    profile: null,
    works: [],
    work: null,
    volume: null,
    chapter: null,
    section: null,
    view: 'home',
    reader: null,
    draft: null,
    draftTimer: null,
    art: {},
    preferences: {
        font_family: 'serif',
        font_size: 20,
        line_height: 1.9,
        theme: 'paper',
        reading_width: 760
    }
};

const isAdmin = () =>
    state.profile?.role === 'admin';

const escape = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const typeNames = {
    main: '主线',
    extra: '番外',
    background: '背景故事'
};

function check(result) {
    if (result.error) throw result.error;
    return result.data;
}

function toast(message) {
    $('toast').textContent = message;
    $('toast').hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
        $('toast').hidden = true;
    }, 3500);
}

function report(error) {
    console.error(error);
    toast(error?.message || '操作失败，请重试');
}

function duration(seconds) {
    const m = Math.floor((seconds || 0) / 60);
    if (m < 60) return `${m} 分钟`;
    return `${Math.floor(m / 60)} 小时 ${m % 60} 分钟`;
}

function dateText(value) {
    return value
        ? new Date(value).toLocaleDateString('zh-CN')
        : '暂无记录';
}

function action(label, fn, className = 'secondary-button') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', async () => {
        try {
            await fn();
        } catch (error) {
            report(error);
        }
    });
    return button;
}

function bind(id, fn) {
    const element = $(id);
    if (!element) return;
    element.addEventListener('click', async event => {
        try {
            await fn(event);
        } catch (error) {
            report(error);
        }
    });
}

function render(html) {
    $('main-content').innerHTML = html;
}

function selectOptions(rows, selected) {
    return rows.map(row => `
        <option value="${escape(row.id)}"
            ${row.id === selected ? 'selected' : ''}>
            ${escape(row.title)}
        </option>
    `).join('');
}

// 02. Authentication

$('login-form').addEventListener(
    'submit',
    async event => {
        event.preventDefault();

        $('login-button').disabled = true;
        $('login-message').textContent = '正在登录……';

        try {
            const result = await db.auth.signInWithPassword({
                email: $('login-email').value.trim(),
                password: $('login-password').value
            });

            check(result);

            await initialize(result.data.user);

            $('login-password').value = '';
            $('login-message').textContent = '';

        } catch (error) {
            $('login-message').textContent =
                '登录失败：' + error.message;
        } finally {
            $('login-button').disabled = false;
        }
    }
);

async function initialize(user) {
    state.user = user;

    const profile = check(
        await db.from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()
    );

    if (!profile || !profile.is_active) {
        await db.auth.signOut();
        state.user = null;
        state.profile = null;
        throw new Error('该账号尚未获得藏书馆访问权限');
    }

    state.profile = profile;

    document.querySelectorAll('[data-admin-only]')
        .forEach(element => {
            element.hidden = !isAdmin();
        });

    $('login-screen').hidden = true;
    $('app').hidden = false;

    await loadPreferences();
    await loadArt();
    await navigate('home');
}

async function logout() {
    await flushDraft();
    await stopReading();

    check(await db.auth.signOut());

    state.user = null;
    state.profile = null;
    state.works = [];
    state.art = {};
    state.draft = null;

    $('world-background').style.backgroundImage = '';
    $('cyrene-image').removeAttribute('src');
    $('cyrene-image').hidden = true;

    $('main-content').innerHTML = '';
    $('app').hidden = true;
    $('login-screen').hidden = false;

    document.body.classList.remove('reading-mode');
    document.body.dataset.theme = 'paper';
}

bind('logout-button', logout);

// 03. Private Art

async function loadArt() {
    for (const name of ['scene.webp', 'cyrene.webp']) {
        const result = await db.storage
            .from('story-art')
            .createSignedUrl(name, 3600);

        if (result.error) {
            console.warn('Art loading:', name, result.error);
            continue;
        }

        state.art[name] = result.data.signedUrl;
    }

    if (state.art['scene.webp']) {
        $('world-background').style.backgroundImage =
            `linear-gradient(
                rgba(255,240,225,.12),
                rgba(255,235,230,.25)
             ), url("${state.art['scene.webp']}")`;
    }

    if (state.art['cyrene.webp']) {
        $('cyrene-image').src =
            state.art['cyrene.webp'];
        $('cyrene-image').hidden = false;
    }
}

// 04. Navigation

async function navigate(view) {
    if (!state.user) return;

    if (['studio', 'insights'].includes(view)
        && !isAdmin()) {
        return;
    }

    await flushDraft();
    await stopReading();

    state.view = view;

    document.body.classList.remove('reading-mode');
    document.body.dataset.theme = 'paper';

    $('site-header').hidden = false;

    $('story-footer').hidden = view !== 'home'
        && view !== 'library';

    document.querySelectorAll('[data-view]')
        .forEach(button => {
            button.classList.toggle(
                'active',
                button.dataset.view === view
            );
        });

    render('<div class="loading-state">正在展开故事……</div>');

    if (view === 'home') await showHome();
    if (view === 'library') await showLibrary();
    if (view === 'history') await showHistory();
    if (view === 'studio') await showStudio();
    if (view === 'insights') await showInsights();
    if (view === 'settings') await showSettings();

    window.scrollTo(0, 0);
}

document.querySelectorAll('[data-view]')
    .forEach(button => {
        button.addEventListener('click', () =>
            navigate(button.dataset.view).catch(report)
        );
    });

// 05. Works and Library

async function loadWorks() {
    state.works = check(
        await db.from('works')
            .select('*')
            .order('sort_order')
            .order('created_at')
    ) || [];

    return state.works;
}

function bookCover(work) {
    return `
        <div class="work-cover"
             style="display:grid;place-content:center;
             padding:10px;text-align:center;
             font-size:24px;color:#fff9ef;">
            ${escape(work.title)}
        </div>
    `;
}

function workCard(work) {
    return `
        <button type="button"
                class="work-card"
                data-work="${escape(work.id)}"
                style="text-align:left;color:inherit;">
            ${bookCover(work)}
            <div class="work-info">
                <span class="caption">长篇小说</span>
                <h3>${escape(work.title)}</h3>
                <p class="muted">
                    <i>${escape(work.subtitle)}</i>
                </p>
                <p>${escape(work.description)}</p>
                <span class="caption">
                    ${work.is_published
                        ? '进入作品 →'
                        : '创作准备中 →'}
                </span>
            </div>
        </button>
    `;
}

function bindWorks() {
    document.querySelectorAll('[data-work]')
        .forEach(button => {
            button.addEventListener('click', () => {
                showWork(button.dataset.work)
                    .catch(report);
            });
        });

    bind('add-work-button', createWork);
}

async function showHome() {
    await loadWorks();

    const recent = check(
        await db.from('chapters')
            .select('*,volumes(title,works(title))')
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(6)
    ) || [];

    render(`
        <section class="home-hero">
            <div>
                <h2>让故事，<br>以另一种方式延续。</h2>
                <p>
                    Turn the stories from games<br>
                    into novels worth reading.
                </p>
            </div>
        </section>

        <div class="home-grid">
            <section>
                <div class="section-heading">
                    <h2>馆藏作品</h2>
                    <span class="caption">The Collection</span>
                </div>

                <div class="library-grid">
                    ${state.works.map(workCard).join('')}

                    ${isAdmin() ? `
                        <button id="add-work-button"
                                class="add-work">
                            <span style="font-size:32px">＋</span>
                            新增作品
                        </button>
                    ` : ''}

                    ${!state.works.length && !isAdmin()
                        ? '<p>暂无已开放作品。</p>' : ''}
                </div>
            </section>

            <section>
                <div class="section-heading">
                    <h2>最近更新</h2>
                    <span class="caption">Recent Updates</span>
                </div>
                <ul class="recent-list">
                    ${recent.map(chapter => `
                        <li>
                            <strong>
                                ${escape(chapter.volumes?.works?.title)}
                            </strong>
                            <br>
                            ${escape(chapter.title)}
                            <br>
                            <span class="caption">
                                ${dateText(chapter.published_at)}
                            </span>
                        </li>
                    `).join('') ||
                    '<li class="muted">故事尚未开始。</li>'}
                </ul>
            </section>
        </div>
    `);

    bindWorks();
}

async function showLibrary() {
    await loadWorks();

    render(`
        <div class="section-heading">
            <h2>私人书架</h2>
            <span class="caption">My Library</span>
        </div>

        <div class="library-grid">
            ${state.works.map(workCard).join('')}

            ${isAdmin() ? `
                <button id="add-work-button"
                        class="add-work">
                    ＋ 新增作品
                </button>
            ` : ''}
        </div>

        ${!state.works.length && !isAdmin()
            ? '<p>暂无已授权作品。</p>' : ''}
    `);

    bindWorks();
}

async function createWork() {
    if (!isAdmin()) return;

    const title = prompt('作品名称：');
    if (!title?.trim()) return;

    const subtitle = prompt('英文名称：') || '';
    const description = prompt('作品简介：') || '';

    check(await db.from('works').insert({
        title: title.trim(),
        subtitle,
        description,
        sort_order: state.works.length + 1,
        is_published: false
    }));

    toast('作品创建成功');
    await navigate('library');
}

// 06. Directory

async function getVolumes(workId) {
    return check(await db.from('volumes')
        .select('*')
        .eq('work_id', workId)
        .order('sort_order')
        .order('created_at')) || [];
}

async function getChapters(volumeId) {
    return check(await db.from('chapters')
        .select('*')
        .eq('volume_id', volumeId)
        .order('sort_order')
        .order('created_at')) || [];
}

async function getSections(chapterId) {
    return check(await db.from('sections')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('sort_order')
        .order('created_at')) || [];
}

async function showWork(workId) {
    await flushDraft();
    await stopReading();

    state.view = 'work';
    state.work = check(await db.from('works')
        .select('*')
        .eq('id', workId)
        .single());

    const volumes = await getVolumes(workId);
    const progress = check(
        await db.from('reading_progress')
            .select('*')
            .eq('user_id', state.user.id)
    ) || [];

    $('story-footer').hidden = true;
    $('site-header').hidden = false;

    document.body.classList.remove('reading-mode');
    document.body.dataset.theme = 'paper';

    let directory = '';

    for (const volume of volumes) {
        const chapters = await getChapters(volume.id);

        directory += `
            <details class="volume-group" open>
                <summary class="volume-title">
                    ${escape(volume.title)}
                </summary>

                ${chapters.map(chapter => {
                    const p = progress.find(
                        item => item.chapter_id === chapter.id
                    );

                    return `
                        <button class="chapter-row"
                            data-chapter="${escape(chapter.id)}"
                            style="width:100%;border-left:0;
                            border-right:0;border-top:0;
                            background:transparent;color:inherit;
                            text-align:left;">
                            <span style="flex:1">
                                ${escape(chapter.title)}
                            </span>
                            <span class="caption">
                                ${chapter.status === 'draft'
                                    ? '草稿'
                                    : p?.is_completed
                                        ? '✓ 已读'
                                        : p
                                            ? `${p.progress_percent}%`
                                            : ''}
                            </span>
                        </button>
                    `;
                }).join('') ||
                '<p class="empty-state">暂无章节</p>'}
            </details>
        `;
    }

    render(`
        <button id="back-library"
                class="secondary-button">
            ← 返回书架
        </button>

        <div class="work-detail" style="margin-top:25px">
            ${bookCover(state.work)}

            <div>
                <h1 class="page-title">
                    ${escape(state.work.title)}
                </h1>
                <p class="muted">
                    ${escape(state.work.subtitle)}
                </p>
                <p>${escape(state.work.description)}</p>

                ${isAdmin() ? `
                    <button id="enter-studio"
                            class="primary-button">
                        进入创作管理
                    </button>
                ` : ''}
            </div>
        </div>

        <div class="section-heading">
            <h2>作品目录</h2>
        </div>

        ${directory ||
          '<div class="empty-state">等待故事的第一章。</div>'}
    `);

    bind('back-library', () => navigate('library'));

    bind('enter-studio', () => navigate('studio'));

    document.querySelectorAll('[data-chapter]')
        .forEach(button => {
            button.addEventListener('click', () => {
                openReader(
                    button.dataset.chapter
                ).catch(report);
            });
        });

    window.scrollTo(0, 0);
}

// 07. Writer Studio

async function showStudio() {
    if (!isAdmin()) return;

    if (state.draft) await flushDraft();

    await loadWorks();

    if (!state.works.length) {
        render(`
            <button id="studio-create"
                    class="primary-button">
                新增第一部作品
            </button>
        `);

        bind('studio-create', createWork);
        return;
    }

    state.work = state.works.find(
        w => w.id === state.work?.id
    ) || state.works[0];

    const volumes = await getVolumes(state.work.id);

    state.volume = volumes.find(
        v => v.id === state.volume?.id
    ) || volumes[0] || null;

    const chapters = state.volume
        ? await getChapters(state.volume.id)
        : [];

    state.chapter = chapters.find(
        c => c.id === state.chapter?.id
    ) || chapters[0] || null;

    const sections = state.chapter
        ? await getSections(state.chapter.id)
        : [];

    state.section = sections.find(
        s => s.id === state.section?.id
    ) || sections[0] || null;

    let draft = null;

    if (state.section) {
        draft = check(
            await db.from('section_drafts')
                .select('*')
                .eq('section_id', state.section.id)
                .maybeSingle()
        );

        if (!draft) {
            draft = {
                title: state.section.title || '',
                content: state.section.content || ''
            };
        }
    }

    render(`
        <div class="section-heading">
            <h2>创作管理 · Writer Studio</h2>
        </div>

        <div class="studio-layout">

            <aside class="studio-sidebar">

                <label>作品</label>
                <select id="studio-work" style="width:100%">
                    ${selectOptions(
                        state.works,
                        state.work.id
                    )}
                </select>

                <div class="action-row"
                     style="margin-top:12px">
                    <button id="edit-work"
                        class="secondary-button">编辑作品</button>
                    <button id="new-work"
                        class="secondary-button">＋ 作品</button>
                </div>

                <hr>

                <label>卷</label>
                <select id="studio-volume"
                        style="width:100%">
                    ${selectOptions(
                        volumes,
                        state.volume?.id
                    )}
                </select>

                <div class="action-row"
                     style="margin-top:12px">
                    <button id="new-volume"
                        class="secondary-button">＋ 新建卷</button>
                    ${state.volume ? `
                        <button id="edit-volume"
                            class="secondary-button">编辑卷</button>
                    ` : ''}
                </div>

                <hr>

                <label>章</label>
                <select id="studio-chapter"
                        style="width:100%">
                    ${selectOptions(
                        chapters,
                        state.chapter?.id
                    )}
                </select>

                <div class="action-row"
                     style="margin-top:12px">
                    <button id="new-chapter"
                        class="secondary-button">＋ 新建章</button>
                    ${state.chapter ? `
                        <button id="edit-chapter"
                            class="secondary-button">编辑章</button>
                    ` : ''}
                </div>

                <hr>

                <label>正文与番外</label>

                ${sections.map(section => `
                    <button class="tree-item
                            ${section.id === state.section?.id
                                ? 'active' : ''}"
                        data-edit-section="${escape(section.id)}"
                        style="display:block;width:100%;
                        border:0;color:inherit;
                        background-color:transparent;">
                        ${escape(section.title || '无标题')}
                        <br>
                        <span class="caption">
                            ${typeNames[section.section_type]}
                            · ${section.is_published
                                ? '已发布' : '草稿'}
                        </span>
                    </button>
                `).join('')}

                <button id="new-section"
                    class="secondary-button"
                    style="margin-top:12px">
                    ＋ 新建正文 / 番外
                </button>

            </aside>

            <section class="editor-panel">

                ${state.section ? `
                    <div class="editor-toolbar">
                        <button id="save-draft">保存草稿</button>
                        <button id="publish-section">
                            发布本节
                        </button>
                        <button id="preview-chapter">预览</button>
                        <button id="revision-history">版本历史</button>
                        <button id="export-section">导出 TXT</button>
                        <span id="save-status"
                              class="save-status">
                            草稿已载入
                        </span>
                    </div>

                    <label>小节标题</label>

                    <input id="draft-title"
                        class="editor-title"
                        value="${escape(draft.title)}">

                    <div class="action-row">

                        <label>内容类型</label>

                        <select id="section-type">
                            ${Object.entries(typeNames)
                                .map(([value, label]) => `
                                <option value="${value}"
                                    ${state.section.section_type
                                        === value ? 'selected' : ''}>
                                    ${label}
                                </option>
                            `).join('')}
                        </select>

                        <label>顺序</label>

                        <input type="number"
                               id="section-order"
                               min="0"
                               step="1"
                               style="width:85px"
                               value="${state.section.sort_order}">

                    </div>

                    <textarea id="draft-content"
                        class="manuscript-editor"
                        placeholder="在这里写下故事……"
                    >${escape(draft.content)}</textarea>

                    <div class="action-row"
                         style="margin-top:12px">

                        <span id="word-count"
                              class="caption"></span>

                        <input id="import-text"
                            type="file"
                            accept=".txt,.md,.markdown"
                            style="max-width:260px">

                        <button id="delete-section"
                            class="danger-button">
                            删除本节
                        </button>

                    </div>
                ` : `
                    <div class="empty-state">
                        请先创建卷、章及正文小节。
                    </div>
                `}
            </section>
        </div>
    `);

    state.draft = state.section ? {
        id: state.section.id,
        title: draft.title,
        content: draft.content,
        dirty: false
    } : null;

    for (const [id, rows, property, reset] of [
        ['studio-work', state.works, 'work',
            ['volume', 'chapter', 'section']],
        ['studio-volume', volumes, 'volume',
            ['chapter', 'section']],
        ['studio-chapter', chapters, 'chapter',
            ['section']]
    ]) {
        $(id)?.addEventListener('change', async event => {
            try {
                await flushDraft();

                state[property] = rows.find(
                    row => row.id === event.target.value
                );

                reset.forEach(key => state[key] = null);

                await showStudio();
            } catch (error) {
                report(error);
            }
        });
    }

    document.querySelectorAll('[data-edit-section]')
        .forEach(button => {
            button.addEventListener('click', async () => {
                try {
                    await flushDraft();

                    state.section = sections.find(
                        item => item.id ===
                            button.dataset.editSection
                    );

                    await showStudio();
                } catch (error) {
                    report(error);
                }
            });
        });

    bind('new-work', createWork);
    bind('edit-work', editWork);
    bind('new-volume', () => createPart('volumes'));
    bind('new-chapter', () => createPart('chapters'));
    bind('new-section', () => createPart('sections'));

    bind('edit-volume', () =>
        editPart('volumes', state.volume));

    bind('edit-chapter', () =>
        editPart('chapters', state.chapter));

    if (!state.section) return;

    const update = () => {
        state.draft.title = $('draft-title').value;
        state.draft.content = $('draft-content').value;
        state.draft.dirty = true;

        $('word-count').textContent =
            `${Array.from(state.draft.content).length} 字`;

        $('save-status').textContent = '等待自动保存……';

        clearTimeout(state.draftTimer);

        state.draftTimer = setTimeout(() => {
            flushDraft().catch(report);
        }, 1800);
    };

    $('draft-title').addEventListener('input', update);
    $('draft-content').addEventListener('input', update);

    $('word-count').textContent =
        `${Array.from(draft.content).length} 字`;

    $('import-text').addEventListener(
        'change',
        async event => {
            const file = event.target.files[0];
            if (!file) return;

            if (!confirm('将导入文字替换当前草稿内容？')) {
                event.target.value = '';
                return;
            }

            $('draft-content').value = await file.text();

            update();
            await flushDraft();
        }
    );

    bind('save-draft', async () => {
        await flushDraft();
        toast('草稿已保存');
    });

    bind('publish-section', publishSection);
    bind('preview-chapter', previewChapter);
    bind('revision-history', showRevisions);
    bind('export-section', exportSection);

    bind('delete-section', async () => {
        if (!confirm('永久删除本节及相关版本记录？')) {
            return;
        }

        await flushDraft();

        check(await db.from('sections')
            .delete()
            .eq('id', state.section.id));

        state.draft = null;
        state.section = null;

        toast('已删除');
        await showStudio();
    });
}

// 08. Work and Chapter Management

async function editWork() {
    if (!isAdmin()) return;

    await flushDraft();

    const title = prompt('作品名称', state.work.title);
    if (!title?.trim()) return;

    const description = prompt(
        '作品简介',
        state.work.description || ''
    );

    if (description === null) return;

    check(await db.from('works')
        .update({
            title: title.trim(),
            description,
            updated_at: new Date().toISOString()
        })
        .eq('id', state.work.id));

    toast('作品已更新');
    await showStudio();
}

async function createPart(table) {
    if (!isAdmin()) return;

    await flushDraft();

    if (table === 'chapters' && !state.volume) {
        return toast('请先创建卷');
    }

    if (table === 'sections' && !state.chapter) {
        return toast('请先创建章');
    }

    const labels = {
        volumes: '卷',
        chapters: '章',
        sections: '小节或番外'
    };

    const title = prompt(`请输入${labels[table]}标题`);
    if (!title?.trim()) return;

    let data;
    let siblings;

    if (table === 'volumes') {
        siblings = await getVolumes(state.work.id);
        data = { work_id: state.work.id };
    }

    if (table === 'chapters') {
        siblings = await getChapters(state.volume.id);
        data = { volume_id: state.volume.id };
    }

    if (table === 'sections') {
        siblings = await getSections(state.chapter.id);
        data = { chapter_id: state.chapter.id };
    }

    data.title = title.trim();

    data.sort_order = Math.max(
        0,
        ...siblings.map(item => item.sort_order)
    ) + 10;

    const created = check(await db.from(table)
        .insert(data)
        .select()
        .single());

    if (table === 'volumes') {
        state.volume = created;
        state.chapter = null;
        state.section = null;
    }

    if (table === 'chapters') {
        state.chapter = created;
        state.section = null;
    }

    if (table === 'sections') {
        state.section = created;
    }

    state.draft = null;

    toast('创建成功');
    await showStudio();
}

async function editPart(table, item) {
    await flushDraft();

    const title = prompt('修改标题', item.title);
    if (!title?.trim()) return;

    const orderText = prompt(
        '排序数字（越小越靠前）',
        item.sort_order
    );

    if (orderText === null) return;

    const sort_order = Number(orderText);

    if (!Number.isInteger(sort_order)) {
        return toast('请输入整数排序值');
    }

    check(await db.from(table)
        .update({
            title: title.trim(),
            sort_order
        })
        .eq('id', item.id));

    toast('已更新');
    await showStudio();
}

// 09. Autosave and Publishing

let draftQueue = Promise.resolve();

async function flushDraft() {
    clearTimeout(state.draftTimer);

    const draft = state.draft;

    if (!draft?.dirty) {
        return draftQueue;
    }

    const payload = {
        section_id: draft.id,
        title: draft.title,
        content: draft.content,
        updated_at: new Date().toISOString()
    };

    draft.dirty = false;

    const task = draftQueue.catch(() => {}).then(async () => {
        try {
            check(await db.from('section_drafts')
                .upsert(payload, {
                    onConflict: 'section_id'
                }));

            if (state.draft === draft
                && !draft.dirty
                && $('save-status')) {
                $('save-status').textContent = '已自动保存';
            }

        } catch (error) {
            draft.dirty = true;

            if ($('save-status')) {
                $('save-status').textContent = '保存失败';
            }

            throw error;
        }
    });

    draftQueue = task;
    return task;
}

async function publishSection() {
    if (!isAdmin() || !state.draft) return;

    if (!$('draft-content').value.trim()) {
        return toast('正文不能为空');
    }

    if (!confirm(
        '发布当前小节？该小节将对已授权好友开放，' +
        '同一章中已发布的其他小节保持不变。'
    )) return;

    state.draft.title = $('draft-title').value;
    state.draft.content = $('draft-content').value;
    state.draft.dirty = true;

    const type = $('section-type').value;
    const order = Number($('section-order').value);

    if (!Number.isInteger(order) || order < 0) {
        return toast('请输入有效排序数字');
    }

    await flushDraft();

    check(await db.rpc('publish_story_section', {
        target_section: state.section.id,
        new_type: type,
        new_order: order
    }));

    check(await db.from('chapters')
        .update({
            status: 'published',
            published_at: new Date().toISOString()
        })
        .eq('id', state.chapter.id));

    check(await db.from('volumes')
        .update({ is_published: true })
        .eq('id', state.volume.id));

    check(await db.from('works')
        .update({ is_published: true })
        .eq('id', state.work.id));

    toast('发布成功');
    await showStudio();
}

function storyText(content) {
    return String(content || '')
        .split(/\n+/)
        .filter(line => line.trim())
        .map(line => `<p>${escape(line)}</p>`)
        .join('');
}

async function previewChapter() {
    await flushDraft();

    const sections = await getSections(state.chapter.id);

    const drafts = check(
        await db.from('section_drafts')
            .select('*')
            .in('section_id', sections.map(s => s.id))
    ) || [];

    $('dialog-content').innerHTML = `
        <button id="close-preview"
            class="secondary-button">关闭预览</button>

        <article class="reader-content">
            <h1>${escape(state.chapter.title)}</h1>

            ${sections.map(section => {
                const d = drafts.find(
                    item => item.section_id === section.id
                ) || section;

                return `
                    <h2>${escape(d.title)}</h2>
                    ${storyText(d.content)}
                `;
            }).join('')}
        </article>
    `;

    $('app-dialog').showModal();

    bind('close-preview', () =>
        $('app-dialog').close()
    );
}

async function showRevisions() {
    const revisions = check(
        await db.from('revisions')
            .select('*')
            .eq('section_id', state.section.id)
            .order('created_at', { ascending: false })
    ) || [];

    $('dialog-content').innerHTML = `
        <h2>版本历史</h2>

        <div id="revision-list"></div>

        <button id="close-revisions"
                class="secondary-button">关闭</button>
    `;

    const list = $('revision-list');

    if (!revisions.length) {
        list.textContent = '暂无历史版本';
    }

    revisions.forEach(revision => {
        const row = document.createElement('p');

        row.textContent = new Date(
            revision.created_at
        ).toLocaleString();

        row.append(' ');

        row.append(action('恢复为草稿', async () => {
            if (!confirm('将此历史版本恢复为当前草稿？')) {
                return;
            }

            $('draft-title').value = revision.title || '';
            $('draft-content').value = revision.content;

            $('draft-content').dispatchEvent(
                new Event('input')
            );

            await flushDraft();

            $('app-dialog').close();
        }));

        list.append(row);
    });

    $('app-dialog').showModal();

    bind('close-revisions', () =>
        $('app-dialog').close()
    );
}

function exportSection() {
    const blob = new Blob(
        [$('draft-content').value],
        { type: 'text/plain;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download =
        ($('draft-title').value || 'Story-Hub') + '.txt';

    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 10. Immersive Reader

async function openReader(chapterId) {
    await flushDraft();
    await stopReading();

    const chapter = check(await db.from('chapters')
        .select('*,volumes(id,title,work_id)')
        .eq('id', chapterId)
        .single());

    const sections = (await getSections(chapterId))
        .filter(section => section.is_published);

    if (!sections.length) {
        toast('本章暂无已发布正文');
        return;
    }

    const workId = chapter.volumes.work_id;

    const volumes = await getVolumes(workId);

    const allChapters = [];

    for (const volume of volumes) {
        const rows = await getChapters(volume.id);

        allChapters.push(
            ...rows.filter(c => c.status === 'published')
        );
    }

    const index = allChapters.findIndex(
        item => item.id === chapterId
    );

    const saved = check(
        await db.from('reading_progress')
            .select('*')
            .eq('user_id', state.user.id)
            .eq('chapter_id', chapterId)
            .maybeSingle()
    );

    state.view = 'reader';

    document.body.classList.add('reading-mode');

    $('site-header').hidden = true;
    $('story-footer').hidden = true;

    applyPreferences();

    render(`
        <div class="reader-layout">

            <div class="reader-toolbar">

                <button id="reader-back">
                    ← 返回作品
                </button>

                <span class="caption">
                    ${escape(chapter.volumes.title)}
                </span>

                <div class="reader-controls">
                    <button id="reader-toc">目录</button>
                    <button id="reader-settings">Aa</button>
                    <button id="reader-theme">☾</button>
                </div>

            </div>

            <div id="reader-body" class="reader-body">

                <aside id="reader-directory"
                       class="reader-directory" hidden>

                    ${allChapters.map(item => `
                        <button
                            class="tree-item"
                            data-reader-chapter="${item.id}"
                            style="display:block;
                            width:100%;border:0;
                            color:inherit;text-align:left;
                            background:transparent;">
                            ${escape(item.title)}
                        </button>
                    `).join('')}

                </aside>

                <article id="reader-content"
                         class="reader-content">

                    <h1>${escape(chapter.title)}</h1>

                    ${sections.map((section, i) => `
                        <section
                            data-reading-section="${section.id}">

                            ${i > 0
                                ? '<div class="story-divider">✧</div>'
                                : ''}

                            ${section.section_type !== 'main'
                                ? `<p class="caption">
                                    ${typeNames[section.section_type]}
                                   </p>`
                                : ''}

                            ${section.title
                                ? `<h2>${escape(section.title)}</h2>`
                                : ''}

                            ${storyText(section.content)}

                        </section>
                    `).join('')}

                    <div class="story-divider">✧</div>

                </article>

            </div>

            <div class="reader-footer">

                <button id="previous-chapter"
                    class="secondary-button"
                    ${index <= 0 ? 'disabled' : ''}>
                    上一章
                </button>

                <span id="reader-percent"
                    class="caption">本章进度 0%</span>

                <button id="next-chapter"
                    class="secondary-button"
                    ${index >= allChapters.length - 1
                        ? 'disabled' : ''}>
                    下一章
                </button>

                <div class="progress-track">
                    <div id="reader-progress-bar"
                        class="progress-fill"
                        style="width:0%">
                    </div>
                </div>

                <button id="finish-chapter"
                    class="secondary-button">
                    标记本章已读
                </button>

            </div>

        </div>
    `);

    bind('reader-back', () => showWork(workId));

    bind('reader-toc', () => {
        const directory = $('reader-directory');

        directory.hidden = !directory.hidden;

        $('reader-body').classList.toggle(
            'with-directory',
            !directory.hidden
        );
    });

    bind('reader-settings', showReadingSettings);

    bind('reader-theme', async () => {
        state.preferences.theme =
            state.preferences.theme === 'dark'
                ? 'paper' : 'dark';

        applyPreferences();
        await savePreferences();
    });

    bind('previous-chapter', () =>
        openReader(allChapters[index - 1].id)
    );

    bind('next-chapter', () =>
        openReader(allChapters[index + 1].id)
    );

    bind('finish-chapter', async () => {
        state.reader.finished = true;
        await syncReading();
        toast('已标记本章读完');
    });

    document.querySelectorAll('[data-reader-chapter]')
        .forEach(button => {
            button.addEventListener('click', () =>
                openReader(
                    button.dataset.readerChapter
                ).catch(report)
            );
        });

    const r = {
        chapterId,
        sections,
        sectionId: saved?.section_id || sections[0].id,
        progress: Number(saved?.progress_percent || 0),
        finished: Boolean(saved?.is_completed),
        elapsed: 0,
        lastActivity: Date.now(),
        lastTick: Date.now(),
        syncing: false,
        interval: null
    };

    state.reader = r;

    requestAnimationFrame(() => {
        const maximum = Math.max(
            0,
            document.documentElement.scrollHeight -
                window.innerHeight
        );

        window.scrollTo({
            top: maximum * r.progress / 100,
            behavior: 'instant'
        });

        updateReadingProgress();
    });

    r.interval = setInterval(() => {

        if (state.reader !== r) return;

        const now = Date.now();

        const seconds = Math.min(
            2,
            Math.max(0, (now - r.lastTick) / 1000)
        );

        r.lastTick = now;

        if (document.visibilityState === 'visible'
            && now - r.lastActivity < 300000) {
            r.elapsed += seconds;
        }

        if (r.elapsed >= 30) {
            syncReading().catch(console.error);
        }

    }, 1000);
}

// 11. Reading Progress and Active Time

function updateReadingProgress() {
    const r = state.reader;

    if (!r) return;

    const maximum = Math.max(
        0,
        document.documentElement.scrollHeight -
            window.innerHeight
    );

    r.progress = maximum > 0
        ? Math.min(
            100,
            Math.max(0, window.scrollY / maximum * 100)
        )
        : 100;

    const sections = document.querySelectorAll(
        '[data-reading-section]'
    );

    for (const element of sections) {
        if (element.getBoundingClientRect().top
            <= window.innerHeight * 0.45) {
            r.sectionId =
                element.dataset.readingSection;
        }
    }

    if ($('reader-percent')) {
        $('reader-percent').textContent =
            `本章进度 ${Math.round(r.progress)}%`;
    }

    if ($('reader-progress-bar')) {
        $('reader-progress-bar').style.width =
            `${r.progress}%`;
    }
}

let readingQueue = Promise.resolve();

async function syncReading() {
    const r = state.reader;
    if (!r) return;

    const task = readingQueue.catch(() => {}).then(async () => {
        const elapsed = Math.floor(r.elapsed);

        check(await db.rpc('save_story_reading', {
            target_chapter: r.chapterId,
            target_section: r.sectionId,
            percent_read: Math.round(r.progress * 100) / 100,
            finished: r.finished,
            elapsed: Math.min(300, elapsed)
        }));

        r.elapsed = Math.max(
            0,
            r.elapsed - Math.min(300, elapsed)
        );
    });

    readingQueue = task;
    return task;
}

async function stopReading() {
    if (!state.reader) return;

    clearInterval(state.reader.interval);

    try {
        await syncReading();
    } catch (error) {
        console.warn('Reading sync failed:', error);
        toast('最后一次阅读记录未能同步');
    }

    state.reader = null;
}

window.addEventListener('scroll', () => {
    if (!state.reader) return;

    state.reader.lastActivity = Date.now();

    updateReadingProgress();

}, { passive: true });

for (const event of [
    'pointerdown',
    'touchstart',
    'keydown',
    'pointermove'
]) {
    window.addEventListener(event, () => {
        if (state.reader) {
            state.reader.lastActivity = Date.now();
        }
    }, { passive: true });
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        flushDraft().catch(console.error);
        syncReading().catch(console.error);
    }

    if (state.reader) {
        state.reader.lastTick = Date.now();
    }
});

window.addEventListener('beforeunload', event => {
    if (state.draft?.dirty) {
        event.preventDefault();
        event.returnValue = '';
    }
});

// 12. Reading Preferences

async function loadPreferences() {
    const saved = check(
        await db.from('reader_preferences')
            .select('*')
            .eq('user_id', state.user.id)
            .maybeSingle()
    );

    if (saved) {
        state.preferences = saved;
    }
}

function applyPreferences() {
    const p = state.preferences;

    document.body.dataset.theme = p.theme;

    document.documentElement.style.setProperty(
        '--reading-size',
        `${Number(p.font_size)}px`
    );

    document.documentElement.style.setProperty(
        '--reading-line',
        Number(p.line_height)
    );

    document.documentElement.style.setProperty(
        '--reading-width',
        `${Number(p.reading_width)}px`
    );

    document.querySelectorAll('.reader-content')
        .forEach(element => {
            element.style.fontFamily =
                p.font_family === 'sans'
                    ? 'var(--sans)'
                    : 'var(--serif)';
        });
}

async function savePreferences() {
    const p = state.preferences;

    check(await db.from('reader_preferences').upsert({
        user_id: state.user.id,
        font_family: p.font_family,
        font_size: Number(p.font_size),
        line_height: Number(p.line_height),
        reading_width: Number(p.reading_width),
        theme: p.theme,
        updated_at: new Date().toISOString()
    }, {
        onConflict: 'user_id'
    }));
}

function showReadingSettings() {
    const p = state.preferences;

    $('dialog-content').innerHTML = `
        <h2>阅读设置</h2>

        <label>阅读字体</label>
        <select id="pref-font">
            <option value="serif"
                ${p.font_family === 'serif'
                    ? 'selected' : ''}>宋体</option>
            <option value="sans"
                ${p.font_family === 'sans'
                    ? 'selected' : ''}>黑体</option>
        </select>

        <label>字号：<span id="size-label">
            ${Number(p.font_size)}
        </span> px</label>

        <input id="pref-size" type="range"
            min="14" max="40"
            value="${Number(p.font_size)}">

        <label>行距</label>

        <input id="pref-line" type="range"
            min="1.2" max="3" step="0.1"
            value="${Number(p.line_height)}">

        <label>正文宽度</label>

        <input id="pref-width" type="range"
            min="320" max="1200" step="20"
            value="${Number(p.reading_width)}">

        <label>阅读主题</label>

        <select id="pref-theme">
            <option value="paper"
                ${p.theme === 'paper'
                    ? 'selected' : ''}>暖白纸质</option>
            <option value="warm"
                ${p.theme === 'warm'
                    ? 'selected' : ''}>柔和米黄</option>
            <option value="dark"
                ${p.theme === 'dark'
                    ? 'selected' : ''}>夜间模式</option>
        </select>

        <button id="save-preferences"
            class="primary-button">
            保存阅读设置
        </button>
    `;

    $('app-dialog').showModal();

    $('pref-size').addEventListener('input', () => {
        $('size-label').textContent = $('pref-size').value;
    });

    bind('save-preferences', async () => {
        state.preferences.font_family = $('pref-font').value;
        state.preferences.font_size = Number($('pref-size').value);
        state.preferences.line_height = Number($('pref-line').value);
        state.preferences.reading_width = Number($('pref-width').value);
        state.preferences.theme = $('pref-theme').value;

        await savePreferences();

        if (state.view === 'reader') {
            applyPreferences();
        }

        $('app-dialog').close();
        toast('阅读设置已保存');
    });
}

// 13. Personal Reading History

async function showHistory() {
    const progress = check(
        await db.from('reading_progress')
            .select('*,chapters(title,volumes(title,works(title)))')
            .eq('user_id', state.user.id)
            .order('last_read_at', { ascending: false })
    ) || [];

    const stats = check(
        await db.from('reading_stats')
            .select('*')
            .eq('user_id', state.user.id)
    ) || [];

    const total = stats.reduce(
        (sum, row) => sum + Number(row.active_seconds),
        0
    );

    render(`
        <div class="section-heading">
            <h2>我的阅读记录</h2>
            <span class="caption">Reading Journal</span>
        </div>

        <div class="stats-grid">

            <div class="stat-card">
                <div class="stat-label">累计阅读时长</div>
                <div class="stat-value">
                    ${duration(total)}
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-label">已阅读章节</div>
                <div class="stat-value">
                    ${progress.length}
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-label">已完成章节</div>
                <div class="stat-value">
                    ${progress.filter(p => p.is_completed).length}
                </div>
            </div>

        </div>

        ${progress.map(item => `
            <div class="reader-row">
                <strong>
                    ${escape(item.chapters?.volumes?.works?.title)}
                    · ${escape(item.chapters?.title)}
                </strong>

                <p class="caption">
                    进度 ${item.progress_percent}%
                    · 最近阅读 ${dateText(item.last_read_at)}
                </p>

                <button class="secondary-button"
                    data-continue="${item.chapter_id}">
                    继续阅读 →
                </button>
            </div>
        `).join('') ||
        '<p class="empty-state">暂无阅读记录。</p>'}
    `);

    document.querySelectorAll('[data-continue]')
        .forEach(button => {
            button.addEventListener('click', () =>
                openReader(
                    button.dataset.continue
                ).catch(report)
            );
        });
}

// 14. Author Reader Insights

async function showInsights() {
    if (!isAdmin()) return;

    const readers = check(
        await db.from('profiles')
            .select('*')
            .eq('role', 'reader')
            .order('created_at')
    ) || [];

    const progress = check(
        await db.from('reading_progress')
            .select('*,chapters(title,volumes(title,works(title)))')
            .order('last_read_at', { ascending: false })
    ) || [];

    const stats = check(
        await db.from('reading_stats')
            .select('*,chapters(title,volumes(works(title)))')
    ) || [];

    const readerIds = new Set(
        readers.map(reader => reader.id)
    );

    const total = stats
        .filter(row => readerIds.has(row.user_id))
        .reduce(
            (sum, row) => sum + Number(row.active_seconds),
            0
        );

    render(`
        <div class="section-heading">
            <h2>阅读札记</h2>
            <span class="caption">
                Reader Insights · 仅创作者可见
            </span>
        </div>

        <div class="stats-grid">

            <div class="stat-card">
                <div class="stat-label">受邀好友</div>
                <div class="stat-value">${readers.length}</div>
            </div>

            <div class="stat-card">
                <div class="stat-label">累计有效阅读</div>
                <div class="stat-value">
                    ${duration(total)}
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-label">已完成章节记录</div>
                <div class="stat-value">
                    ${progress.filter(row =>
                        readerIds.has(row.user_id)
                        && row.is_completed
                    ).length}
                </div>
            </div>

        </div>

        ${readers.map(reader => {
            const records = progress.filter(
                row => row.user_id === reader.id
            );

            const times = stats.filter(
                row => row.user_id === reader.id
            );

            const seconds = times.reduce(
                (sum, row) => sum + Number(row.active_seconds),
                0
            );

            const last = records[0];

            return `
                <details class="volume-group">
                    <summary class="volume-title">
                        ${escape(reader.display_name)}
                        · ${duration(seconds)}
                    </summary>

                    <div style="padding:20px">

                        <p>最近阅读：
                            ${last
                                ? escape(last.chapters?.title)
                                : '尚未开始'}
                        </p>

                        <p class="caption">
                            ${dateText(last?.last_read_at)}
                        </p>

                        <div class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>作品 / 章节</th>
                                        <th>进度</th>
                                        <th>阅读时长</th>
                                        <th>状态</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${records.map(record => {
                                        const time = times.find(
                                            row =>
                                                row.chapter_id ===
                                                record.chapter_id
                                        );

                                        return `
                                            <tr>
                                                <td>
                                                    ${escape(record.chapters?.volumes?.works?.title)}
                                                    <br>
                                                    ${escape(record.chapters?.title)}
                                                </td>
                                                <td>
                                                    ${record.progress_percent}%
                                                </td>
                                                <td>
                                                    ${duration(time?.active_seconds)}
                                                </td>
                                                <td>
                                                    ${record.is_completed
                                                        ? '已读完'
                                                        : '阅读中'}
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>

                            </table>
                        </div>

                    </div>
                </details>
            `;
        }).join('') ||
        '<p class="empty-state">暂时还没有受邀好友。</p>'}

        <p class="caption">
            阅读时长根据页面可见状态及活动情况估算，
            不代表实际阅读速度或作品评价。
        </p>
    `);
}

// 15. Account and Access Management

async function showSettings() {
    render(`
        <div class="section-heading">
            <h2>设置</h2>
        </div>

        <div class="panel">

            <h3>个人账号</h3>

            <p>${escape(state.profile.display_name)}</p>

            <p class="muted">
                ${escape(state.user.email)}
            </p>

            <p>
                身份：${isAdmin() ? '创作者' : '受邀读者'}
            </p>

            <button id="personal-reading-settings"
                class="secondary-button">
                阅读偏好
            </button>

            <button id="change-password"
                class="secondary-button">
                修改密码
            </button>

            <p class="caption" style="margin-top:20px">
                本网站会记录你的阅读进度与估算阅读时长，
                用于跨设备阅读及向创作者提供私人反馈。
                不会公开个人阅读数据。
            </p>

        </div>

        ${isAdmin() ? `
            <div class="section-heading">
                <h2>好友访问权限</h2>
            </div>

            <div id="access-panel"></div>

            <div class="section-heading">
                <h2>数据备份</h2>
            </div>

            <button id="backup-all"
                class="secondary-button">
                导出全部作品 JSON
            </button>

            <button id="refresh-art"
                class="secondary-button">
                刷新美术素材
            </button>
        ` : ''}
    `);

    bind('personal-reading-settings', showReadingSettings);
    bind('change-password', changePassword);

    if (isAdmin()) {
        await showAccessPanel();

        bind('backup-all', backupWorks);

        bind('refresh-art', async () => {
            await loadArt();
            toast('美术素材已刷新');
        });
    }
}

function changePassword() {
    $('dialog-content').innerHTML = `
        <h2>修改登录密码</h2>

        <label>新密码</label>

        <input id="new-password"
               type="password"
               autocomplete="new-password"
               minlength="8">

        <label>确认新密码</label>

        <input id="confirm-password"
               type="password"
               autocomplete="new-password">

        <button id="confirm-change-password"
                class="primary-button">
            确认修改
        </button>

        <button id="cancel-password"
                class="secondary-button">
            取消
        </button>
    `;

    $('app-dialog').showModal();

    bind('cancel-password', () =>
        $('app-dialog').close()
    );

    bind('confirm-change-password', async () => {
        const password = $('new-password').value;

        if (password.length < 8) {
            return toast('密码至少需要8位');
        }

        if (password !== $('confirm-password').value) {
            return toast('两次密码不一致');
        }

        check(await db.auth.updateUser({ password }));

        $('app-dialog').close();
        toast('密码修改成功');
    });
}

async function showAccessPanel() {
    if (!isAdmin()) return;

    await loadWorks();

    const readers = check(
        await db.from('profiles')
            .select('*')
            .eq('role', 'reader')
            .order('created_at')
    ) || [];

    const access = check(
        await db.from('work_access').select('*')
    ) || [];

    const panel = $('access-panel');

    panel.innerHTML = `
        <p class="caption">
            新好友需先在 Supabase Authentication 中创建账号，
            再使用其 UID 建立读者档案。
        </p>

        <button id="register-reader"
                class="secondary-button">
            ＋ 添加好友档案
        </button>

        <div id="reader-access-list"></div>
    `;

    bind('register-reader', async () => {
        const id = prompt('好友账号的 Supabase UID');
        if (!id) return;

        const name = prompt('好友显示名称');
        if (!name?.trim()) return;

        check(await db.from('profiles').insert({
            id: id.trim(),
            display_name: name.trim(),
            role: 'reader',
            is_active: true
        }));

        toast('好友档案已创建');
        await showAccessPanel();
    });

    const list = $('reader-access-list');

    readers.forEach(reader => {
        const block = document.createElement('div');
        block.className = 'reader-row';

        const heading = document.createElement('h3');
        heading.textContent =
            reader.display_name +
            (reader.is_active ? ' · 有效' : ' · 已停用');

        block.append(heading);

        block.append(action(
            reader.is_active ? '停用账号' : '恢复账号',
            async () => {
                check(await db.from('profiles')
                    .update({
                        is_active: !reader.is_active
                    })
                    .eq('id', reader.id));

                await showAccessPanel();
            }
        ));

        state.works.forEach(work => {
            const allowed = access.some(row =>
                row.user_id === reader.id
                && row.work_id === work.id
                && row.is_active
            );

            const row = document.createElement('p');

            row.textContent =
                work.title + '：' +
                (allowed ? '已授权 ' : '未授权 ');

            row.append(action(
                allowed ? '撤销阅读权限' : '授予阅读权限',
                async () => {
                    check(await db.from('work_access')
                        .upsert({
                            user_id: reader.id,
                            work_id: work.id,
                            is_active: !allowed
                        }, {
                            onConflict: 'user_id,work_id'
                        }));

                    toast('阅读权限已更新');
                    await showAccessPanel();
                }
            ));

            block.append(row);
        });

        list.append(block);
    });
}

// 16. Backup

async function backupWorks() {
    if (!isAdmin()) return;

    await flushDraft();

    const backup = {
        exported_at: new Date().toISOString(),
        format: 'Story Hub V1',
        tables: {}
    };

    for (const name of [
        'works',
        'volumes',
        'chapters',
        'sections',
        'section_drafts',
        'revisions'
    ]) {
        const rows = [];
        let start = 0;

        while (true) {
            const batch = check(await db.from(name)
                .select('*')
                .order(
                    name === 'section_drafts'
                        ? 'section_id' : 'id'
                )
                .range(start, start + 499)) || [];

            rows.push(...batch);

            if (batch.length < 500) break;

            start += 500;
        }

        backup.tables[name] = rows;
    }

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download =
        'Story-Hub-Backup-' +
        new Date().toISOString().slice(0, 10) +
        '.json';

    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast('作品备份已导出，请妥善保存');
}

// 17. Start Application

async function start() {
    try {
        const result = await db.auth.getSession();

        check(result);

        if (result.data.session?.user) {
            await initialize(result.data.session.user);
        }
    } catch (error) {
        console.error(error);

        $('login-screen').hidden = false;
        $('app').hidden = true;

        $('login-message').textContent =
            error.message || '无法连接数据库';
    }
}


// Story Hub - Home V2 Integration

import { makeHomeV2 } from './home-v2.js';

const originalHome = showHome;

showHome = makeHomeV2({
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
    fallback: originalHome
});


// ==========================================
// STORY HUB V2.1
// Shared Theme Integration
// ==========================================

import { installThemeV2 } from './theme-v2.js';

const sharedTheme = installThemeV2({

    db,
    state,
    navigate,
    isAdmin,
    logout,
    report,
    escape

});


// Extend existing rendering

const previousRender = render;

render = function (html) {

    previousRender(html);

    sharedTheme.refresh();
};


// Extend private artwork loading

const previousLoadArt = loadArt;

loadArt = async function () {

    await previousLoadArt();

    await sharedTheme.loadArt();
};


// Use the real book cover across all pages

const previousBookCover = bookCover;

bookCover = function (work) {

    return sharedTheme.cover(work)
        || previousBookCover(work);
};


// Start the website

start();


