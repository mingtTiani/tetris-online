import * as reducerType from '../../unit/reducerType';

const gameTime = (state = 0, action) => {
  switch (action.type) {
    case reducerType.GAME_TIME:
      return action.data;
    default:
      return state;
  }
};

export default gameTime;
