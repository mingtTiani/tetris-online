import * as reducerType from '../../unit/reducerType';

const defaultState = {
  active: false,
  startAt: null,
  lastBumpAt: null,
};

const overtime = (state = defaultState, action) => {
  switch (action.type) {
    case reducerType.OVERTIME:
      return Object.assign({}, state, action.data);
    default:
      return state;
  }
};

export default overtime;
