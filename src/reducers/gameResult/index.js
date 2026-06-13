import * as reducerType from '../../unit/reducerType';

const defaultState = {
  finished: false,
  winner: null, // 'local' | 'remote' | 'draw'
  reason: null, // 'points' | 'time'
  localPoints: 0,
  remotePoints: 0,
  localTime: 0,
  remoteTime: 0,
};

const gameResult = (state = defaultState, action) => {
  switch (action.type) {
    case reducerType.GAME_RESULT:
      return Object.assign({}, state, action.data);
    default:
      return state;
  }
};

export default gameResult;
