import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import store from './store';
import App from './containers/';
import './unit/const';
import './control';
import { subscribeRecord } from './unit';
import network from './network';

subscribeRecord(store); // 将更新的状态记录到localStorage
const initialSettings = store.getState().get('settings');
if (initialSettings && initialSettings.gameMode === 'dual') {
  network.init(store);
}

render(
  <Provider store={store}>
    <App />
  </Provider>
    , document.getElementById('root')
);

