import * as reducerType from '../../unit/reducerType';

const defaultState = {
  isDead: false,
  deadAt: null,
};

const playerDead = (state = defaultState, action) => {
  switch (action.type) {
    case reducerType.PLAYER_DEAD:
      return Object.assign({}, state, action.data);
    default:
      return state;
  }
};

export default playerDead;
