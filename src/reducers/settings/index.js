import * as reducerType from '../../unit/reducerType';
import { lastRecord } from '../../unit/const';

export const defaultSettings = {
  gameMode: 'single', // 'single' | 'dual'
  wsUrl: '', // empty means use default ws://hostname:3000
  showGhost: true,
  volume: 1,
  language: '', // empty means follow browser/i18n default
  keys: {
    left: 'a',
    right: 'd',
    down: 's',
    rotate: 'j',
    space: ' ',
    pause: 'p',
    music: 'm',
    reset: 'r',
  },
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
    keys: Object.assign({}, defaultSettings.keys, saved.keys || {}),
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
