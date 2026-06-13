# 双人网络对战俄罗斯方块 改造说明

## 本次改动目标

把原单机版 `react-tetris` 改造成支持 **两人通过 WebSocket 实时对战** 的版本，同时：

1. 页面左右分屏：左侧是自己，右侧实时显示对手画面。
2. 移除二维码、GitHub Star、Fork 等干扰项。
3. 给当前下落方块增加明显的落地阴影（Ghost Piece），方便预判落点。

## 运行方式

需要同时启动两个服务：

```bash
# 1. WebSocket 房间服务器（端口 3000）
npm run server

# 2. 前端开发服务器（端口 8080）
npm start
```

打开浏览器访问：

```
http://127.0.0.1:8080/
```

第一个打开的页面会自动生成房间号并显示在 URL 中，例如 `?room=H7ENG9`。把带房间号的链接发给朋友，两个人进入同一房间后即可互相看到对方画面。

生产构建：

```bash
npm run build
```

构建产物输出到 `docs/` 目录。

## 架构设计

### 状态结构

```
Redux Store
├── pause          // 本地暂停
├── music          // 音效开关
├── matrix         // 本地 10×20 游戏矩阵
├── next           // 本地下一个方块类型
├── cur            // 本地当前下落方块
├── points         // 本地分数
├── clearLines     // 本地消行数
├── speedRun       // 本地当前速度
├── reset          // 本地游戏结束/重置动画标志
├── keyboard       // 本地键盘状态
├── ...            // 其他原有状态
└── remote         // 新增：对手状态（plain JS 对象）
    ├── matrix
    ├── cur
    ├── next
    ├── points
    ├── clearLines
    ├── speedRun
    ├── reset
    ├── pause
    └── connectedCount
```

### 同步策略

- 每个客户端在本地完整运行游戏逻辑。
- 本地状态发生任何变化时，通过 `store.subscribe` 触发，把完整状态快照发送给 WebSocket 服务器。
- 服务器按 `roomId` 转发给房间内的另一名玩家。
- 接收方通过 `REMOTE_SYNC` action 更新 `remote` reducer，右侧面板随之重绘。

为什么不转发输入事件而转状态快照？

- 输入转发需要保证双方随机种子、时序完全一致，否则方块序列会不同步。
- Tetris 状态量很小（10×20 矩阵 + 当前方块），快照同步开销可忽略。
- 实现更简单，状态不易漂移。

## 关键文件说明

| 文件 | 说明 |
|------|------|
| `server/websocket.js` | WebSocket 房间服务器，处理 JOIN / SYNC / ROOM_STATE |
| `src/network/index.js` | 客户端网络层：连接、加房间、发送/接收同步、断线重连 |
| `src/reducers/remote/index.js` | 对手状态 reducer，接收 `REMOTE_SYNC` |
| `src/actions/index.js` | 新增 `remoteSync` action creator |
| `src/unit/reducerType.js` | 新增 `REMOTE_SYNC` action 类型 |
| `src/unit/index.js` | 新增 `getGhost` 落地阴影计算工具 |
| `src/components/matrix/index.js` | 叠加 ghost 方块渲染 |
| `src/components/matrix/index.less` | ghost 样式（半透明灰色） |
| `src/components/next/index.js` | 兼容空/非法 `next` 类型，防止初始状态崩溃 |
| `src/containers/index.js` | 左右双面板布局、房间状态显示 |
| `src/containers/index.less` | 双面板样式、响应式缩放（参考尺寸 960×960） |
| `src/index.js` | 初始化网络层 |
| `package.json` | 增加 `ws` 依赖和 `server` 脚本 |
| `server/index.html` / `index.tmpl.html` | viewport 从 640 改为 960 |

## 已知限制 / 后续可优化

- 右侧对手面板显示的计时器是本地时间，不是对方的游戏时间。
- 音效开关、最高分等是本地状态，未同步给对手。
- 部署到公网时，需要把 `src/network/index.js` 中的 `WS_URL` 改为实际 WebSocket 服务器地址（当前默认使用 `ws://当前域名:3000`）。
- 未做断线后的游戏状态恢复，重新连接后会从当前状态继续同步。

## 联机测试步骤

1. 机器 A 打开 `http://127.0.0.1:8080/`，页面会生成房间号，例如 `?room=ABC123`。
2. 机器 B 打开同样的 URL（含相同 room）。
3. 两个页面都显示“已连接”后，任意一方操作，另一方右侧画面实时同步。
4. 若在同一台机器测试，开两个浏览器标签访问同一房间即可。
