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
  reset: false,
  pause: false,
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
    case reducerType.REMOTE_SYNC:
      if (!action.data) {
        return state;
      }
      return {
        matrix: reviveMatrix(action.data.matrix),
        cur: reviveBlock(action.data.cur),
        next: action.data.next || '',
        points: action.data.points || 0,
        clearLines: action.data.clearLines || 0,
        speedRun: action.data.speedRun || 1,
        reset: !!action.data.reset,
        pause: !!action.data.pause,
      };
    default:
      return state;
  }
};

export default remote;
