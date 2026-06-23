import { List } from 'immutable';
import store from '../store';
import { want, isClear } from '../unit/';
import Block from '../unit/block';
import actions from '../actions';
import {
  speeds, blankLine, blankMatrix, clearPoints,
  maxSpeedLevel, getLevelThreshold,
} from '../unit/const';
import { music } from '../unit/music';

const getStartMatrix = (startLines) => { // 生成startLines
  const getLine = (min, max) => { // 返回标亮个数在min~max之间一行方块, (包含边界)
    const count = parseInt((((max - min) + 1) * Math.random()) + min, 10);
    const line = [];
    for (let i = 0; i < count; i++) { // 插入高亮
      line.push(1);
    }
    for (let i = 0, len = 10 - count; i < len; i++) { // 在随机位置插入灰色
      const index = parseInt(((line.length + 1) * Math.random()), 10);
      line.splice(index, 0, 0);
    }

    return List(line);
  };
  let startMatrix = List([]);

  for (let i = 0; i < startLines; i++) {
    if (i <= 2) { // 0-3
      startMatrix = startMatrix.push(getLine(5, 8));
    } else if (i <= 6) { // 4-6
      startMatrix = startMatrix.push(getLine(4, 9));
    } else { // 7-9
      startMatrix = startMatrix.push(getLine(3, 9));
    }
  }
  for (let i = 0, len = 20 - startLines; i < len; i++) { // 插入上部分的灰色
    startMatrix = startMatrix.unshift(List(blankLine));
  }
  return startMatrix;
};

const defaultGameResult = {
  finished: false,
  winner: null,
  reason: null,
  localPoints: 0,
  remotePoints: 0,
  localTime: 0,
  remoteTime: 0,
};

const states = {
  // 自动下落setTimeout变量
  fallInterval: null,

  // 游戏全局计时器
  gameTimer: null,

  // 结果判定轮询计时器
  resolutionTimer: null,

  // 计算当前速度等级：基于开局等级、累计消除行数、游戏时间、加时状态
  computeSpeedRun: (clearLines, speedStart, gameTime, overtime) => {
    let level = speedStart;
    let accumulated = 0;
    while (level < maxSpeedLevel) {
      const need = getLevelThreshold(level);
      if (accumulated + need <= clearLines) {
        accumulated += need;
        level += 1;
      } else {
        break;
      }
    }
    const timeAdd = Math.floor(gameTime / 60);
    level += timeAdd;
    if (overtime && overtime.active) {
      const overtimeAdd = 2 + Math.floor((gameTime - overtime.startAt) / 20);
      level += overtimeAdd;
    }
    return level > maxSpeedLevel ? maxSpeedLevel : level;
  },

  // 应用时间/行数/加时导致的等级变化
  refreshSpeedRun: () => {
    const state = store.getState();
    const newSpeed = states.computeSpeedRun(
      state.get('clearLines'),
      state.get('speedStart'),
      state.get('gameTime'),
      state.get('overtime')
    );
    if (newSpeed !== state.get('speedRun')) {
      store.dispatch(actions.speedRun(newSpeed));
    }
  },

  // 游戏开始
  start: () => {
    if (music.start) {
      music.start();
    }
    const state = store.getState();
    states.dispatchPoints(0);
    store.dispatch(actions.gameTime(0));
    store.dispatch(actions.playerDead({ isDead: false, deadAt: null }));
    store.dispatch(actions.overtime({ active: false, startAt: null, lastBumpAt: null }));
    store.dispatch(actions.gameResult(defaultGameResult));
    store.dispatch(actions.reset(false));
    store.dispatch(actions.lock(false));
    const speedStart = state.get('speedStart');
    store.dispatch(actions.speedRun(speedStart));
    const startLines = state.get('startLines');
    const startMatrix = getStartMatrix(startLines);
    store.dispatch(actions.matrix(startMatrix));
    store.dispatch(actions.moveBlock({ type: state.get('next') }));
    store.dispatch(actions.nextBlock());
    states.startTimers();
    states.auto();
  },

  // 启动全局计时器和结果轮询
  startTimers: () => {
    clearInterval(states.gameTimer);
    clearInterval(states.resolutionTimer);
    states.gameTimer = setInterval(() => {
      const state = store.getState();
      const playerDead = state.get('playerDead');
      const gameResult = state.get('gameResult');
      if (state.get('pause') || playerDead.isDead || gameResult.finished) {
        return;
      }
      const gameTime = state.get('gameTime') + 1;
      store.dispatch(actions.gameTime(gameTime));
      states.refreshSpeedRun();
    }, 1000);
    states.resolutionTimer = setInterval(() => {
      states.checkRemoteDeath();
      states.tryResolveResult();
    }, 500);
  },

  // 停止计时器
  stopTimers: () => {
    clearInterval(states.gameTimer);
    clearInterval(states.resolutionTimer);
  },

  // 自动下落
  auto: (timeout) => {
    const out = (timeout < 0 ? 0 : timeout);
    let state = store.getState();
    let cur = state.get('cur');
    const fall = () => {
      state = store.getState();
      cur = state.get('cur');
      const next = cur.fall();
      if (want(next, state.get('matrix'))) {
        store.dispatch(actions.moveBlock(next));
        states.fallInterval = setTimeout(fall, speeds[state.get('speedRun') - 1]);
      } else {
        let matrix = state.get('matrix');
        const shape = cur && cur.shape;
        const xy = cur && cur.xy;
        shape.forEach((m, k1) => (
          m.forEach((n, k2) => {
            if (n && xy.get(0) + k1 >= 0) { // 竖坐标可以为负
              let line = matrix.get(xy.get(0) + k1);
              line = line.set(xy.get(1) + k2, 1);
              matrix = matrix.set(xy.get(0) + k1, line);
            }
          })
        ));
        states.nextAround(matrix);
      }
    };
    clearTimeout(states.fallInterval);
    states.fallInterval = setTimeout(fall,
      out === undefined ? speeds[state.get('speedRun') - 1] : out);
  },

  // 一个方块结束, 触发下一个
  nextAround: (matrix, stopDownTrigger) => {
    clearTimeout(states.fallInterval);
    store.dispatch(actions.lock(true));
    store.dispatch(actions.matrix(matrix));
    if (typeof stopDownTrigger === 'function') {
      stopDownTrigger();
    }

    const addPoints = (store.getState().get('points') + 10) +
      ((store.getState().get('speedRun') - 1) * 2); // 速度越快, 得分越高

    states.dispatchPoints(addPoints);

    if (isClear(matrix)) {
      if (music.clear) {
        music.clear();
      }
      return;
    }

    // 先检测下一个方块是否能放入出生位置，被堵死才算结束
    const nextType = store.getState().get('next');
    const nextBlock = new Block({ type: nextType });
    if (!want(nextBlock, matrix)) {
      if (music.gameover) {
        music.gameover();
      }
      states.handleLocalDeath();
      return;
    }

    setTimeout(() => {
      store.dispatch(actions.lock(false));
      store.dispatch(actions.moveBlock({ type: nextType }));
      store.dispatch(actions.nextBlock());
      states.auto();
    }, 100);
  },

  // 页面焦点变换
  focus: (isFocus) => {
    store.dispatch(actions.focus(isFocus));
    if (!isFocus) {
      clearTimeout(states.fallInterval);
      return;
    }
    const state = store.getState();
    if (state.get('cur') && !state.get('reset') && !state.get('pause')) {
      states.auto();
    }
  },

  // 暂停
  pause: (isPause) => {
    store.dispatch(actions.pause(isPause));
    if (isPause) {
      clearTimeout(states.fallInterval);
      return;
    }
    states.auto();
  },

  // 消除行
  clearLines: (matrix, lines) => {
    const state = store.getState();
    let newMatrix = matrix;
    lines.forEach(n => {
      newMatrix = newMatrix.splice(n, 1);
      newMatrix = newMatrix.unshift(List(blankLine));
    });
    store.dispatch(actions.matrix(newMatrix));

    // 检测下一个方块是否能放入出生位置，被堵死才算结束
    const nextType = state.get('next');
    const nextBlock = new Block({ type: nextType });
    if (!want(nextBlock, newMatrix)) {
      if (music.gameover) {
        music.gameover();
      }
      states.handleLocalDeath();
      return;
    }

    store.dispatch(actions.moveBlock({ type: nextType }));
    store.dispatch(actions.nextBlock());
    states.auto();
    store.dispatch(actions.lock(false));
    const clearLines = state.get('clearLines') + lines.length;
    store.dispatch(actions.clearLines(clearLines)); // 更新消除行

    const addPoints = store.getState().get('points') +
      clearPoints[lines.length - 1]; // 一次消除的行越多, 加分越多
    states.dispatchPoints(addPoints);

    states.refreshSpeedRun();
  },

  // 本地玩家死亡
  handleLocalDeath: () => {
    clearTimeout(states.fallInterval);
    clearInterval(states.gameTimer);
    const state = store.getState();
    const gameTime = state.get('gameTime');
    store.dispatch(actions.playerDead({ isDead: true, deadAt: gameTime }));
    store.dispatch(actions.lock(true));
    states.tryResolveResult();
  },

  // 检测到对方死亡时，本方为幸存者则进入加时
  checkRemoteDeath: () => {
    const state = store.getState();
    const localDead = state.get('playerDead').isDead;
    const remote = state.get('remote') || {};
    const remoteDead = remote.deadInfo && remote.deadInfo.isDead;
    const overtime = state.get('overtime') || {};

    if (remoteDead && !localDead && !overtime.active) {
      states.startOvertime();
    }
  },

  // 开始加时赛
  startOvertime: () => {
    const state = store.getState();
    const gameTime = state.get('gameTime');
    store.dispatch(actions.overtime({
      active: true,
      startAt: gameTime,
      lastBumpAt: gameTime,
    }));
    states.refreshSpeedRun();
  },

  // 尝试判定最终结果
  tryResolveResult: () => {
    const state = store.getState();
    const result = state.get('gameResult');
    if (result && result.finished) {
      return;
    }
    const localDead = state.get('playerDead');
    const remote = state.get('remote') || {};
    const connectedCount = remote.connectedCount || 1;

    // 单人模式（未匹配对手）：自己死亡后立即结束
    if (connectedCount < 2) {
      if (!localDead.isDead) {
        return;
      }
      const deadAt = localDead.deadAt || 0;
      store.dispatch(actions.gameResult({
        finished: true,
        winner: 'local',
        reason: 'single',
        localPoints: state.get('points'),
        remotePoints: 0,
        localTime: deadAt,
        remoteTime: 0,
      }));
      states.stopTimers();
      return;
    }

    const remoteDead = remote.deadInfo || {};
    if (!localDead.isDead || !remoteDead.isDead) {
      return; // 双方都死亡后才判定
    }

    const local = {
      points: state.get('points'),
      deadAt: localDead.deadAt || 0,
    };
    const remoteInfo = {
      points: remote.points || 0,
      deadAt: remoteDead.deadAt || 0,
    };

    let winner;
    let reason;
    if (local.points > remoteInfo.points) {
      winner = 'local';
      reason = 'points';
    } else if (remoteInfo.points > local.points) {
      winner = 'remote';
      reason = 'points';
    } else {
      winner = local.deadAt >= remoteInfo.deadAt ? 'local' : 'remote';
      reason = 'time';
    }

    store.dispatch(actions.gameResult({
      finished: true,
      winner,
      reason,
      localPoints: local.points,
      remotePoints: remoteInfo.points,
      localTime: local.deadAt,
      remoteTime: remoteDead.deadAt,
    }));
    states.stopTimers();
  },

  // 游戏结束, 触发动画（保留用于手动重置/初始化）
  overStart: () => {
    clearTimeout(states.fallInterval);
    states.stopTimers();
    store.dispatch(actions.lock(true));
    store.dispatch(actions.reset(true));
    store.dispatch(actions.pause(false));
  },

  // 重置到开始菜单（初始化用，不计为死亡）
  resetToMenu: () => {
    clearTimeout(states.fallInterval);
    states.stopTimers();
    store.dispatch(actions.gameTime(0));
    store.dispatch(actions.playerDead({ isDead: false, deadAt: null }));
    store.dispatch(actions.overtime({ active: false, startAt: null, lastBumpAt: null }));
    store.dispatch(actions.gameResult(defaultGameResult));
    store.dispatch(actions.reset(true));
    store.dispatch(actions.pause(false));
  },

  // 放弃当前对局，回到开始(选难度)界面，可重新调整初始速度/行数
  backToMenu: () => {
    states.resetToMenu();
    store.dispatch(actions.matrix(blankMatrix));
    store.dispatch(actions.moveBlock({ reset: true })); // cur = null，显示初始速度/行数选择
    store.dispatch(actions.clearLines(0));
    store.dispatch(actions.lock(false));
  },

  // 游戏结束动画完成
  overEnd: () => {
    store.dispatch(actions.matrix(blankMatrix));
    store.dispatch(actions.moveBlock({ reset: true }));
    store.dispatch(actions.reset(false));
    store.dispatch(actions.lock(false));
    store.dispatch(actions.clearLines(0));
  },

  // 写入分数
  dispatchPoints: (point) => { // 写入分数, 同时判断是否创造最高分
    store.dispatch(actions.points(point));
    if (point > 0 && point > store.getState().get('max')) {
      store.dispatch(actions.max(point));
    }
  },
};

export default states;
