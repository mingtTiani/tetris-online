import event from '../../unit/event';
import states from '../states';
import actions from '../../actions';
import network from '../../network';

const down = (store, opts = {}) => {
  store.dispatch(actions.keyboard.reset(true));
  const state = store.getState();
  const gameResult = state.get('gameResult');
  if (gameResult && gameResult.finished) {
    // 对局已结束，按 R 开始新游戏，并通知对方一起重开
    event.down({
      key: 'r',
      once: true,
      callback: () => {
        const speedStart = store.getState().get('speedStart');
        network.sendRestart(speedStart);
        states.start();
      },
    });
    return;
  }
  if (state.get('cur') === null) {
    // 开始界面，按 R 开始游戏
    event.down({
      key: 'r',
      once: true,
      callback: () => {
        states.start();
      },
    });
    return;
  }
  if (state.get('lock')) {
    return;
  }
  // 游戏进行中：仅 Shift+R 才生效，单按 R 不响应，避免误触
  if (!opts.shift) {
    return;
  }
  const settings = state.get('settings');
  const remote = state.get('remote') || {};
  const isDual = settings && settings.gameMode === 'dual' && (remote.connectedCount || 1) >= 2;
  event.down({
    key: 'r',
    once: true,
    callback: () => {
      if (isDual) {
        states.handleLocalDeath(); // 双人对战：放弃即认输，交由结算判定
      } else {
        states.backToMenu(); // 单人：放弃当前局，回到选难度的开始界面
      }
    },
  });
};

const up = (store) => {
  store.dispatch(actions.keyboard.reset(false));
  event.up({
    key: 'r',
  });
};

export default {
  down,
  up,
};
