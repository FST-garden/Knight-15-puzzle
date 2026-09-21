# 发布与 GitHub Pages

[源码仓库](https://github.com/FST-garden/Knight-15-puzzle) · [在线游玩](https://fst-garden.github.io/Knight-15-puzzle/)

## 当前配置

- 公开仓库：`FST-garden/Knight-15-puzzle`。
- Pages 使用 `main` 分支的仓库根目录，通过 GitHub 自动构建发布。
- About 网站链接为上方在线游玩地址。仓库名称中的 `Knight` 大小写应保留在网站路径中。

## 更新步骤

1. 修改在线版时，一起保留 `index.html`、`assets/`、`views/` 及页面引用的文件。
2. 如修改运行程序，同时更新对应离线 HTML 下载文件，避免在线与离线版本不一致。
3. 在本地通过 HTTP 服务检查页面和资源引用，再提交并推送 `main`。
4. 等待仓库 Actions 中的 Pages 部署完成，然后打开在线地址确认结果。

直接下载离线单文件可在浏览器中打开。多文件在线版请通过 HTTP 服务检查，不要把直接打开 index.html 的结果当作发布验证。

## 2026-09-21 账号更名

账号由 guo-gc 更名为 FST-garden。README、研究报告、仓库及提交历史链接已更新。此轮只修改文档与 About 链接，未修改游戏或研究数据。
