import store from '../store';
import todo from './todo';

const keyboard = {
  37: 'left', // ←
  65: 'left', // A
  74: 'rotate', // J
  38: 'rotate', // ↑
  39: 'right', // →
  68: 'right', // D
  40: 'down', // ↓
  83: 'down', // S
  32: 'space', // 空格
  77: 's', // M 开关音效
  82: 'r', // R
  80: 'p', // P
};

let keydownActive;

const boardKeys = Object.keys(keyboard).map(e => parseInt(e, 10));

const keyDown = (e) => {
  if (e.metaKey === true || boardKeys.indexOf(e.keyCode) === -1) {
    return;
  }
  const type = keyboard[e.keyCode];
  if (type === keydownActive) {
    return;
  }
  keydownActive = type;
  todo[type].down(store);
};

const keyUp = (e) => {
  if (e.metaKey === true || boardKeys.indexOf(e.keyCode) === -1) {
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

