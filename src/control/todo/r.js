import event from '../../unit/event';
import states from '../states';
import actions from '../../actions';
import network from '../../network';

const down = (store) => {
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
  // 游戏中按 R 视为放弃/死亡
  event.down({
    key: 'r',
    once: true,
    callback: () => {
      states.handleLocalDeath();
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
