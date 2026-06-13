# Changelog

所有 notable 变更都会记录在这个文件中。

## [1.0.1] - 2024-06

### 新增

- 双人 WebSocket 在线对战模式
- 房间系统：通过 URL 房间号进入同一房间
- 分屏显示本地与远端玩家画面
- 对战计分板：实时显示双方分数、等级、时间与状态
- 加时赛机制：一方死亡后另一方进入追分阶段
- 游戏结果判定：根据分数与存活时间判定胜负
- 方块落地阴影提示
- 保留原项目的单人模式

### 调整

- 顶部房间信息区改为分层布局，避免遮挡标题
- 页面标题与 meta 信息改为 `Tetris Online - 俄罗斯方块在线对战`
- 更新 `package.json` 项目信息为当前仓库

### 文档

- 重写 README，包含项目初衷、技术栈、功能介绍、操作说明、Roadmap
- 添加游戏截图到 README
- 添加 LICENSE（Apache-2.0）与 NOTICE 文件
- 保留原作者代码在 `original-master` 分支

## 原项目

- 基于 [chvin/react-tetris](https://github.com/chvin/react-tetris) v1.0.1
- 原项目许可证：Apache-2.0
