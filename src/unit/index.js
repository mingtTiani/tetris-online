import { blockType, StorageKey } from './const';

const hiddenProperty = (() => { // document[hiddenProperty] 可以判断页面是否失焦
  let names = [
    'hidden',
    'webkitHidden',
    'mozHidden',
    'msHidden',
  ];
  names = names.filter((e) => (e in document));
  return names.length > 0 ? names[0] : false;
})();

const visibilityChangeEvent = (() => {
  if (!hiddenProperty) {
    return false;
  }
  return hiddenProperty.replace(/hidden/i, 'visibilitychange'); // 如果属性有前缀, 相应的事件也有前缀
})();

const isFocus = () => {
  if (!hiddenProperty) { // 如果不存在该特性, 认为一直聚焦
    return true;
  }
  return !document[hiddenProperty];
};

const unit = {
  getNextType() { // 随机获取下一个方块类型
    const len = blockType.length;
    return blockType[Math.floor(Math.random() * len)];
  },
  want(next, matrix) { // 方块是否能移到到指定位置
    const xy = next.xy;
    const shape = next.shape;
    const horizontal = shape.get(0).size;
    const row = typeof xy.get === 'function' ? xy.get(0) : xy[0];
    const col = typeof xy.get === 'function' ? xy.get(1) : xy[1];
    return shape.every((m, k1) => (
      m.every((n, k2) => {
        if (col < 0) { // left
          return false;
        }
        if (col + horizontal > 10) { // right
          return false;
        }
        if (row + k1 < 0) { // top
          return true;
        }
        if (row + k1 >= 20) { // bottom
          return false;
        }
        if (n) {
          if (matrix.get(row + k1).get(col + k2)) {
            return false;
          }
          return true;
        }
        return true;
      })
    ));
  },
  isClear(matrix) { // 是否达到消除状态
    const clearLines = [];
    matrix.forEach((m, k) => {
      if (m.every(n => !!n)) {
        clearLines.push(k);
      }
    });
    if (clearLines.length === 0) {
      return false;
    }
    return clearLines;
  },
  isOver(matrix) { // 游戏是否结束, 第一行落下方块为依据
    return matrix.get(0).some(n => !!n);
  },
  subscribeRecord(store) { // 将状态记录到 localStorage
    store.subscribe(() => {
      const state = store.getState().toJS();
      if (state.lock) { // 当状态为锁定, 不记录
        return;
      }
      // 不保存会过期的对战元状态，避免刷新后读到上一局的死亡/结果状态
      const data = Object.assign({}, state);
      delete data.gameTime;
      delete data.playerDead;
      delete data.overtime;
      delete data.gameResult;
      delete data.remote;
      let record = JSON.stringify(data);
      record = encodeURIComponent(record);
      if (window.btoa) {
        record = btoa(record);
      }
      localStorage.setItem(StorageKey, record);
    });
  },
  isMobile() { // 判断是否为移动端
    const ua = navigator.userAgent;
    const android = /Android (\d+\.\d+)/.test(ua);
    const iphone = ua.indexOf('iPhone') > -1;
    const ipod = ua.indexOf('iPod') > -1;
    const ipad = ua.indexOf('iPad') > -1;
    const nokiaN = ua.indexOf('NokiaN') > -1;
    return android || iphone || ipod || ipad || nokiaN;
  },
  visibilityChangeEvent,
  isFocus,
};

unit.getGhost = function getGhost(cur, matrix) { // 计算当前方块落地阴影位置
  if (!cur) {
    return null;
  }
  let index = 0;
  while (unit.want(cur.fall(index + 1), matrix)) {
    index++;
  }
  return cur.fall(index);
};

module.exports = unit;
