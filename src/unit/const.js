import { List } from 'immutable';
import i18n from '../../i18n.json';

const blockShape = {
  I: [
    [1, 1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
};

const origin = {
  I: [[-1, 1], [1, -1]],
  L: [[0, 0]],
  J: [[0, 0]],
  Z: [[0, 0]],
  S: [[0, 0]],
  O: [[0, 0]],
  T: [[0, 0], [1, 0], [-1, 1], [0, -1]],
};

const blockType = Object.keys(blockShape);

const speeds = [800, 700, 600, 500, 420, 350, 290, 230, 180, 140, 110, 85, 65, 50];

const delays = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115];

const maxSpeedLevel = 14; // 最高速度等级

// 从 currentLevel 升到 currentLevel + 1 需要消除多少行
const getLevelThreshold = (currentLevel) => 15 + ((currentLevel - 1) * 5);

const fillLine = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

const blankLine = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const blankMatrix = (() => {
  const matrix = [];
  for (let i = 0; i < 20; i++) {
    matrix.push(List(blankLine));
  }
  return List(matrix);
})();

const clearPoints = [100, 300, 700, 1500];

const StorageKey = 'REACT_TETRIS';

const lastRecord = (() => { // 上一把的状态
  let data = localStorage.getItem(StorageKey);
  if (!data) {
    return false;
  }
  try {
    if (window.btoa) {
      data = atob(data);
    }
    data = decodeURIComponent(data);
    data = JSON.parse(data);
  } catch (e) {
    if (window.console || window.console.error) {
      window.console.error('读取记录错误:', e);
    }
    return false;
  }
  return data;
})();

const maxPoint = 999999;

const transform = (function () {
  const trans = ['transform', 'webkitTransform', 'msTransform', 'mozTransform', 'oTransform'];
  const body = document.body;
  return trans.filter((e) => body.style[e] !== undefined)[0];
}());

const getParam = (param) => { // 获取浏览器参数
  const r = new RegExp(`\\?(?:.+&)?${param}=(.*?)(?:&.*)?$`);
  const m = window.location.toString().match(r);
  return m ? decodeURI(m[1]) : '';
};

const lan = (() => {
  let l = getParam('lan').toLowerCase();
  l = i18n.lan.indexOf(l) === -1 ? i18n.default : l;
  return l;
})();

document.title = i18n.data.title[lan];

module.exports = {
  blockShape,
  origin,
  blockType,
  speeds,
  delays,
  fillLine,
  blankLine,
  blankMatrix,
  clearPoints,
  StorageKey,
  lastRecord,
  maxPoint,
  maxSpeedLevel,
  getLevelThreshold,
  transform,
  lan,
  i18n: i18n.data,
};
