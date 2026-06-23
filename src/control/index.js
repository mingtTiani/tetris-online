import store from '../store';
import todo from './todo';

const specialKeyCodes = {
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Enter: 13,
  Escape: 27,
  ' ': 32,
  Space: 32,
  Tab: 9,
  Backspace: 8,
  Delete: 46,
};

const keyNameToCode = (name) => {
  if (specialKeyCodes[name] !== undefined) {
    return specialKeyCodes[name];
  }
  if (name && name.length === 1) {
    return name.toUpperCase().charCodeAt(0);
  }
  return null;
};

const getKeyMap = () => {
  const settings = store.getState().get('settings');
  const keys = settings ? settings.keys : {};
  const map = {};
  Object.keys(keys).forEach((action) => {
    const names = Array.isArray(keys[action]) ? keys[action] : [keys[action]];
    names.forEach((name) => {
      const code = keyNameToCode(name);
      if (code !== null) {
        map[code] = action;
      }
    });
  });
  return map;
};

let keydownActive;

const keyDown = (e) => {
  if (e.metaKey === true) {
    return;
  }
  const keyboard = getKeyMap();
  const boardKeys = Object.keys(keyboard).map(k => parseInt(k, 10));
  if (boardKeys.indexOf(e.keyCode) === -1) {
    return;
  }
  const type = keyboard[e.keyCode];
  if (type === keydownActive) {
    return;
  }
  keydownActive = type;
  todo[type].down(store, { shift: e.shiftKey === true });
};

const keyUp = (e) => {
  if (e.metaKey === true) {
    return;
  }
  const keyboard = getKeyMap();
  const boardKeys = Object.keys(keyboard).map(k => parseInt(k, 10));
  if (boardKeys.indexOf(e.keyCode) === -1) {
    return;
  }
  const type = keyboard[e.keyCode];
  if (type === keydownActive) {
    keydownActive = '';
  }
  todo[type].up(store);
};

document.addEventListener('keydown', keyDown, true);
document.addEventListener('keyup', keyUp, true);

