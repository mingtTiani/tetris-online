import * as reducerType from '../../unit/reducerType';
import { lastRecord } from '../../unit/const';

export const defaultSettings = {
  gameMode: 'single', // 'single' | 'dual'
  wsUrl: '', // empty means use default ws://hostname:3000
  showGhost: true,
  volume: 1,
  language: '', // empty means follow browser/i18n default
  // 每个动作支持绑定多个键：方向键与 wasd 都可用于游戏内操作，
  // 未开始时同样用于调节初始速度(左右)与初始行数(上下)
  keys: {
    left: ['a', 'ArrowLeft'],
    right: ['d', 'ArrowRight'],
    down: ['s', 'ArrowDown'],
    rotate: ['j', 'w', 'ArrowUp'],
    space: [' '],
    pause: ['p'],
    music: ['m'],
    reset: ['r'],
  },
};

// 把按键配置规范化为数组形式，兼容旧版“单键字符串”存档
const normalizeKeys = (saved) => {
  const result = {};
  Object.keys(defaultSettings.keys).forEach((action) => {
    const value = saved && saved[action];
    if (Array.isArray(value)) {
      const list = value.filter((k) => typeof k === 'string' && k.length > 0);
      result[action] = list.length > 0 ? list : defaultSettings.keys[action].slice();
    } else if (typeof value === 'string' && value.length > 0) {
      result[action] = [value];
    } else {
      result[action] = defaultSettings.keys[action].slice();
    }
  });
  return result;
};

const mergeSettings = (saved) => {
  if (!saved || typeof saved !== 'object') {
    return defaultSettings;
  }
  return {
    gameMode: saved.gameMode === 'dual' ? 'dual' : 'single',
    wsUrl: typeof saved.wsUrl === 'string' ? saved.wsUrl : defaultSettings.wsUrl,
    showGhost: typeof saved.showGhost === 'boolean' ? saved.showGhost : defaultSettings.showGhost,
    volume: typeof saved.volume === 'number' ? saved.volume : defaultSettings.volume,
    language: typeof saved.language === 'string' ? saved.language : defaultSettings.language,
    keys: normalizeKeys(saved.keys),
  };
};

let initState = defaultSettings;
if (lastRecord && lastRecord.settings) {
  initState = mergeSettings(lastRecord.settings);
}

const settings = (state = initState, action) => {
  switch (action.type) {
    case reducerType.SETTINGS:
      return mergeSettings(Object.assign({}, state, action.data));
    case reducerType.RESET_SETTINGS:
      return defaultSettings;
    default:
      return state;
  }
};

export default settings;
