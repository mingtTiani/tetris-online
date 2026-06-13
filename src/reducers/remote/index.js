import { List } from 'immutable';
import * as reducerType from '../../unit/reducerType';
import { blankMatrix } from '../../unit/const';
import Block from '../../unit/block';

const defaultState = {
  matrix: blankMatrix,
  cur: null,
  next: '',
  points: 0,
  clearLines: 0,
  speedRun: 1,
  speedStart: 1,
  reset: false,
  pause: false,
  connectedCount: 1,
  connectionStatus: 'disconnected',
  gameTime: 0,
  deadInfo: {
    isDead: false,
    deadAt: null,
  },
  overtime: {
    active: false,
    startAt: null,
    lastBumpAt: null,
  },
  gameResult: {
    finished: false,
    winner: null,
    reason: null,
    localPoints: 0,
    remotePoints: 0,
    localTime: 0,
    remoteTime: 0,
  },
};

function reviveBlock(cur) {
  if (!cur) {
    return null;
  }
  const option = {
    type: cur.type,
    rotateIndex: cur.rotateIndex,
    shape: List(cur.shape.map(e => List(e))),
    xy: cur.xy,
    timeStamp: cur.timeStamp,
  };
  return new Block(option);
}

function reviveMatrix(matrix) {
  if (!matrix || !Array.isArray(matrix)) {
    return blankMatrix;
  }
  return List(matrix.map(line => List(line)));
}

const remote = (state = defaultState, action) => {
  switch (action.type) {
    case reducerType.REMOTE_SYNC: {
      if (!action.data) {
        return state;
      }
      // 只更新 action.data 里显式带来的字段，避免一次 SYNC/状态更新把其它字段冲掉
      const nextState = Object.assign({}, state);
      if (action.data.matrix !== undefined) {
        nextState.matrix = reviveMatrix(action.data.matrix);
      }
      if (action.data.cur !== undefined) {
        nextState.cur = reviveBlock(action.data.cur);
      }
      if (action.data.next !== undefined) {
        nextState.next = action.data.next || '';
      }
      if (action.data.points !== undefined) {
        nextState.points = action.data.points || 0;
      }
      if (action.data.clearLines !== undefined) {
        nextState.clearLines = action.data.clearLines || 0;
      }
      if (action.data.speedRun !== undefined) {
        nextState.speedRun = action.data.speedRun || 1;
      }
      if (action.data.speedStart !== undefined) {
        nextState.speedStart = action.data.speedStart || 1;
      }
      if (action.data.reset !== undefined) {
        nextState.reset = !!action.data.reset;
      }
      if (action.data.pause !== undefined) {
        nextState.pause = !!action.data.pause;
      }
      if (action.data.connectedCount !== undefined) {
        nextState.connectedCount = action.data.connectedCount;
      }
      if (action.data.connectionStatus !== undefined) {
        nextState.connectionStatus = action.data.connectionStatus;
      }
      if (action.data.gameTime !== undefined) {
        nextState.gameTime = action.data.gameTime || 0;
      }
      if (action.data.deadInfo !== undefined) {
        nextState.deadInfo = action.data.deadInfo || { isDead: false, deadAt: null };
      }
      if (action.data.overtime !== undefined) {
        nextState.overtime = action.data.overtime || {
          active: false,
          startAt: null,
          lastBumpAt: null,
        };
      }
      if (action.data.gameResult !== undefined) {
        nextState.gameResult = action.data.gameResult || defaultState.gameResult;
      }
      return nextState;
    }
    default:
      return state;
  }
};

export default remote;
