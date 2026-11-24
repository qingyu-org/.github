# .github

[清羽（QingYu）](https://github.com/qingyu-org) 的组织资料与项目展示页。

- `profile/README.md`、`profile/banner-*.svg` —— GitHub 组织主页
- `index.html`、`assets/` —— 单页项目展示站，纯 HTML / CSS / JavaScript，无构建步骤
- `.github/workflows/pages.yml` —— 把 `index.html` 与 `assets/` 发布到 GitHub Pages

展示页会跟随系统的浅色 / 深色偏好，右上角也可以手动切换；动画遵循 `prefers-reduced-motion`。

## 本地预览

```bash
python -m http.server 4173
# 打开 http://127.0.0.1:4173/
```

也可以用任意静态文件服务器，例如 `npx serve .`。

## 发布

站点从 `main` 分支通过 GitHub Actions 发布到 GitHub Pages：

<https://qingyu-org.github.io/.github/>

Pages 的 Source 需要设为 **GitHub Actions**。修改 `index.html` 或 `assets/` 后推送到 `main` 即会重新部署。

## 修改内容

项目条目是 `index.html` 中手写的静态内容，没有外部数据源。新增项目时：

1. 在 `index.html` 的 `.project-list` 里复制一个 `<article class="project">`，填入名称、说明、技术栈和链接。在线入口记得加 `data-demo`，首屏数量会自动更新。
2. 在 `profile/README.md` 的项目表里补一行。

首屏的项目数和在线入口数由 `assets/app.js` 按页面内容计算，不写死。
样式变量集中在 `assets/style.css` 顶部的 `:root` 与 `:root[data-theme="dark"]`。
