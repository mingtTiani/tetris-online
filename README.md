# Tetris Online / 俄罗斯方块在线对战

基于 [chvin/react-tetris](https://github.com/chvin/react-tetris) 二次开发的俄罗斯方块在线对战版。

> 原作者代码保留在 [`original-master`](https://gitee.com/mingtiank/tetris-online/tree/original-master) 分支，以示尊重。

---

## 💬 为什么做这个项目

我从小就喜欢俄罗斯方块，没事就会玩上几局。之前偶然看到 [chvin/react-tetris](https://github.com/chvin/react-tetris)，一下子被它复古又精致的画面、流畅的按键手感吸引住了，断断续续体验了很久。

但玩多了，总会想：**要是能和朋友一起对战就好了**。找了一圈手机上的俄罗斯方块，要么是广告满天飞，要么操作手感不行，真正干净、好看、又能联机对战的几乎没有。于是干脆自己动手，在这个项目基础上加了双人 WebSocket 对战模式，也顺手补上了方块下落阴影，方便预判落点。

> ⚠️ 这是一个 **几小时内做出来的基础版本**，目前只实现了最核心的双人对战，特效、UI、对战玩法、房主控制、房间配置这些都还没来得及打磨。单人模式依然保留，欢迎大家试玩，也欢迎提建议——**我希望它能慢慢长成一款真正好用的俄罗斯方块应用。**

---

## 在线体验

- Gitee Pages：待部署
- 本地运行：`npm start`，然后访问 `http://127.0.0.1:8080`

---

## 新增功能

### 双人 WebSocket 实时对战

同一房间内的两名玩家实时同步对战，本地与远端画面分屏显示，并实时对比双方分数、等级与存活时间。

![双人对战](img/对战环节.png)

### 房间系统与等待对手

打开页面后会自动分配房间号，将地址栏链接发送给好友，对方进入同一房间后即可开始对战；等待时显示当前房间状态与分享链接。

![等待对手](img/等待对手.png)

### 手机端适配

支持手机浏览器访问，触屏按钮与键盘操作并存，手机端同样可以等待对手和进行对战。

![手机端等待对手](img/手机端等待对手.png)

![手机端游玩](img/手机端游玩.png)

### 其他特性

- **对战计分板**：实时显示双方分数、等级、游戏时间和对战状态。
- **加时赛机制**：一方死亡后，另一方进入加时追分阶段。
- **游戏结果判定**：根据分数与存活时间判定胜负。
- **落地阴影**：方块下落位置预览，便于精准操作。

---

## 技术栈

| 技术 | 说明 |
|------|------|
| [React](https://reactjs.org/) | UI 框架 |
| [Redux](https://redux.js.org/) + [redux-immutable](https://github.com/gajus/redux-immutable) | 状态管理，state 使用 Immutable 对象 |
| [Immutable.js](https://immutable-js.github.io/immutable-js/) | 不可变数据结构，优化深层比较与 `shouldComponentUpdate` |
| [WebSocket](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket) / [ws](https://github.com/websockets/ws) | 双人对战实时通信 |
| [Webpack](https://webpack.js.org/) | 构建工具 |
| [Less](https://lesscss.org/) | 样式预处理 |
| [Web Audio API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Audio_API) | 音效播放 |

---

## 项目结构

```
.
├── docs/                 # 构建产物（可部署到 GitHub/Gitee Pages）
├── server/               # WebSocket 对战服务器
│   └── websocket.js      # ws 服务器实现
├── src/
│   ├── actions/          # Redux actions
│   ├── components/       # React 组件
│   ├── containers/       # 页面容器
│   ├── control/          # 游戏流程控制
│   ├── network/          # WebSocket 客户端封装
│   ├── reducers/         # Redux reducers
│   │   ├── gameResult/   # 对战结果
│   │   ├── gameTime/     # 游戏时间
│   │   ├── overtime/     # 加时赛
│   │   ├── playerDead/   # 玩家死亡状态
│   │   └── remote/       # 远端玩家数据
│   ├── unit/             # 工具函数与常量
│   └── index.js          # 应用入口
├── img/                  # README 配图
├── package.json
└── README.md
```

---

## 本地开发

### 安装依赖

```bash
npm install
```

### 启动前端

```bash
npm start
```

浏览器会自动打开 `http://127.0.0.1:8080`。

### 启动对战服务器

```bash
npm run server
```

默认 WebSocket 端口为 `3000`，可在 `server/websocket.js` 中修改。

### 打包构建

```bash
npm run build
```

构建产物输出到 `docs/` 目录。

---

## 操作说明

| 按键 | 功能 |
|------|------|
| `A` / `←` | 左移 |
| `D` / `→` | 右移 |
| `S` / `↓` | 缓慢下落 |
| `空格` | 直接坠落 |
| `J` / `↑` | 旋转 |
| `P` | 暂停 |
| `M` | 开关音效 |
| `R` | 开始对战 / 重新开始 |

---

## 对战玩法

1. 打开游戏页面后，会自动分配房间号。
2. 将地址栏链接发送给好友，对方打开后进入同一房间。
3. 双方都进入后，按 `R` 开始对战。
4. 先堆到顶部的一方失败，进入加时赛；最终由分数和存活时间判定胜负。

---

## 致谢

- 原项目：[chvin/react-tetris](https://github.com/chvin/react-tetris)
- 原作者：[chvin](https://github.com/chvin)

本项目在原作基础上增加了双人联机对战功能，原作代码可在 [`original-master`](https://gitee.com/mingtiank/tetris-online/tree/original-master) 分支查看。

---

## 联系与反馈

如果你有任何建议、想法，或者发现了 Bug，欢迎联系我：

- 📧 邮箱：**mingtinai@outlook.com**
- 💬 微信扫码：

![微信二维码](img/微信二维码.png)

---

## License

遵循原项目 [Apache-2.0](https://github.com/chvin/react-tetris/blob/master/LICENSE) 协议。
