import { combineReducers } from 'redux-immutable';
import pause from './pause';
import music from './music';
import matrix from './matrix';
import next from './next';
import cur from './cur';
import startLines from './startLines';
import max from './max';
import points from './points';
import speedStart from './speedStart';
import speedRun from './speedRun';
import lock from './lock';
import clearLines from './clearLines';
import reset from './reset';
import drop from './drop';
import keyboard from './keyboard';
import focus from './focus';
import remote from './remote';
import gameTime from './gameTime';
import playerDead from './playerDead';
import overtime from './overtime';
import gameResult from './gameResult';
import settings from './settings';

const rootReducer = combineReducers({
  pause,
  music,
  matrix,
  next,
  cur,
  startLines,
  max,
  points,
  speedStart,
  speedRun,
  lock,
  clearLines,
  reset,
  drop,
  keyboard,
  focus,
  remote,
  gameTime,
  playerDead,
  overtime,
  gameResult,
  settings,
});

export default rootReducer;
