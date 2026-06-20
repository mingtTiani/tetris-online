import actions from '../actions';
import states from '../control/states';

const WS_URL = process.env.WS_URL || `ws://${window.location.hostname}:3000`;

let ws = null;
let reconnectTimer = null;
let storeRef = null;
let roomId = null;
let syncScheduled = false;
let lastRemoteSyncAt = 0;

function getRoomId() {
  const match = window.location.search.match(/[?&]room=([^&]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  const id = Math.random().toString(36).substr(2, 6).toUpperCase();
  const url = new URL(window.location.href);
  url.searchParams.set('room', id);
  window.history.replaceState({}, '', url.toString());
  return id;
}

function send(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function setConnectionStatus(status) {
  if (!storeRef) {
    return;
  }
  const remote = storeRef.getState().get('remote') || {};
  storeRef.dispatch(actions.remoteSync(
    Object.assign({}, remote, { connectionStatus: status })
  ));
}

function sendSync(state) {
  const remote = state.get('remote');
  const connectedCount = remote && remote.connectedCount;
  if (connectedCount < 2) {
    return; // 没有对手时不发送
  }

  // 刚刚接收到对手状态时，避免立刻把本地状态回传，防止两边状态互相覆盖趋同
  if (Date.now() - lastRemoteSyncAt < 150) {
    return;
  }

  const cur = state.get('cur');
  const playerDead = state.get('playerDead');
  send({
    type: 'SYNC',
    state: {
      matrix: state.get('matrix').toJS(),
      cur: cur ? {
        type: cur.type,
        rotateIndex: cur.rotateIndex,
        shape: cur.shape.toJS(),
        xy: cur.xy.toJS ? cur.xy.toJS() : cur.xy,
        timeStamp: cur.timeStamp,
      } : null,
      next: state.get('next'),
      points: state.get('points'),
      clearLines: state.get('clearLines'),
      speedRun: state.get('speedRun'),
      speedStart: state.get('speedStart'),
      reset: state.get('reset'),
      pause: state.get('pause'),
      gameTime: state.get('gameTime'),
      deadInfo: {
        isDead: playerDead.isDead,
        deadAt: playerDead.deadAt,
      },
      overtime: state.get('overtime'),
      gameResult: state.get('gameResult'),
    },
  });
}

function scheduleReconnect() {
  if (reconnectTimer) {
    return;
  }
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    // eslint-disable-next-line no-use-before-define
    connect();
  }, 3000);
}

function scheduleSync() {
  if (syncScheduled) {
    return;
  }
  syncScheduled = true;
  setTimeout(() => {
    syncScheduled = false;
    if (!storeRef) {
      return;
    }
    const state = storeRef.getState();
    sendSync(state);
  }, 50);
}

function sendRestart(speedStart) {
  const remote = storeRef && storeRef.getState().get('remote');
  const connectedCount = remote && remote.connectedCount;
  if (connectedCount < 2) {
    return;
  }
  send({ type: 'RESTART', speedStart });
}

function connect() {
  if (ws) {
    return;
  }

  try {
    ws = new WebSocket(WS_URL);
  } catch (e) {
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    // eslint-disable-next-line no-console
    console.log('[Tetris WS] connected, joining room', roomId);
    setConnectionStatus('connected');
    send({ type: 'JOIN', roomId });
    const state = storeRef && storeRef.getState();
    const remote = state && state.get('remote');
    if (remote && remote.connectedCount >= 2) {
      // eslint-disable-next-line no-console
      console.log('[Tetris WS] reconnected with opponent, resyncing');
      sendSync(state);
    }
  };

  ws.onmessage = (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch (e) {
      return;
    }

    if (message.type === 'SYNC' && message.state && storeRef) {
      lastRemoteSyncAt = Date.now();
      // eslint-disable-next-line no-console
      console.log('[Tetris WS] received SYNC', {
        roomId,
        points: message.state.points,
        clearLines: message.state.clearLines,
        reset: message.state.reset,
        hasCur: !!message.state.cur,
      });
      storeRef.dispatch(actions.remoteSync(message.state));
    }

    if (message.type === 'RESTART' && storeRef) {
      // eslint-disable-next-line no-console
      console.log('[Tetris WS] received RESTART', message.speedStart);
      const state = storeRef.getState();
      if (!state.get('cur') || state.get('gameResult').finished) {
        storeRef.dispatch(actions.speedStart(message.speedStart || 1));
        states.start();
      }
    }

    if (message.type === 'ROOM_STATE' && storeRef) {
      // eslint-disable-next-line no-console
      console.log('[Tetris WS] received ROOM_STATE count=', message.count);
      const previousCount = (storeRef.getState().get('remote') || {}).connectedCount || 0;
      storeRef.dispatch(actions.remoteSync(
        Object.assign({}, storeRef.getState().get('remote') || {}, {
          connectedCount: message.count,
        })
      ));
      if (previousCount < 2 && message.count >= 2) {
        // eslint-disable-next-line no-console
        console.log('[Tetris WS] opponent joined, waiting for start');
        sendSync(storeRef.getState());
      }
    }
  };

  ws.onclose = () => {
    // eslint-disable-next-line no-console
    console.log('[Tetris WS] closed, will reconnect');
    ws = null;
    setConnectionStatus('disconnected');
    scheduleReconnect();
  };

  ws.onerror = (err) => {
    // eslint-disable-next-line no-console
    console.log('[Tetris WS] error', err);
    setConnectionStatus('error');
    scheduleReconnect();
  };
}

function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    try {
      ws.close();
    } catch (e) {
      // ignore
    }
    ws = null;
  }
  setConnectionStatus('disconnected');
}

function init(store) {
  storeRef = store;
  roomId = getRoomId();
  setConnectionStatus('connecting');
  connect();
  store.subscribe(() => {
    scheduleSync();
  });
}

export default {
  init,
  sendSync,
  sendRestart,
  disconnect,
  getRoomId: () => roomId,
};
