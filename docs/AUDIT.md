# 项目审计与改造记录

审计日期：2026-11-28（Asia/Singapore）。原仓库 `yihang206/-My-Story-Hub`，基线提交 `c4195278f89e9c4b91b96a3ec77968af17ec13fa`。

已阅读 `home-v2.js`、`library-v2.js`、`app.js`、`index.html` 及 `style.css`。旧项目是单体前端，首页通过重赋值函数注入 V2，书架再动态导入另一套 V2；旧 Shell、黄色背景和独立人物仍初始化，书架错误时明确回退旧版。换页前立即清空内容，异步加载无最新请求约束，素材反复签名且不统一解码复用。这些是视觉混用、闪烁和竞态的直接来源。

新项目不导入旧模块，也不保留旧视觉回退。首页原始画布的位置、比例和响应式规则提取到 `canvas.css`；删除用于隐藏旧 Shell 的覆盖规则。应用只有一个初始化、一个常驻 Shell 及一套主题。长页面沿用页眉并扩展纸张区域；只有正文页主动隐藏大型插画。

素材明确采用 `story-frame.webp` 与 `genshin-cover.webp`。`scene.webp` 和 `cyrene.webp` 不在新应用的请求或构建产物中。测试截图使用用户提供的完整素材，图片不上传源代码仓库。

已通过 Supabase 连接核对 12 张 public 表的列、外键和 RLS，两个公开 RPC 以及 `story_private` 的角色/阅读授权函数。真实封面字段为 `works.cover_url`；笔记字段为 `user_id / section_id / paragraph_index / content / share_with_author`。章节的正式状态为 `status='published'`，其他层级使用 `is_published`。发布 RPC 负责小节及旧正式版本归档，不负责自动发布父层级。

现有 RLS 正确限制管理员、有效用户、作品授权及正式内容。作者只能读取 `share_with_author=true` 的他人笔记。`story-art` 为私人 Bucket；原有策略仅允许有效用户读取，不允许浏览器上传。普通读者也没有更新个人 profiles 的权限。

用户于本次会话明确批准两项最小补充：管理员向私人 `covers/` 新增封面；限定显示名称 RPC。已应用迁移并验证，没有新增删除/覆盖素材策略，没有开放角色自改，没有关闭 RLS 或将 Bucket 公开。已确认 Auth 设置 `disable_signup=true`。

测试前后真实数据数量一致：1 个账号、1 个档案、1 部作品、0 卷/章/小节、4 个素材对象。所有安全测试的账号、小说和笔记均位于最后回滚的事务内，未留下演示数据。
