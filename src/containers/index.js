import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import propTypes from 'prop-types';

import style from './index.less';

import Matrix from '../components/matrix';
import Decorate from '../components/decorate';
import Number from '../components/number';
import Next from '../components/next';
import Music from '../components/music';
import Pause from '../components/pause';
import Point from '../components/point';
import Logo from '../components/logo';
import Keyboard from '../components/keyboard';

import { transform, lastRecord, speeds, i18n, lan } from '../unit/const';
import { visibilityChangeEvent, isFocus } from '../unit/';
import states from '../control/states';
import network from '../network';

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      w: document.documentElement.clientWidth,
      h: document.documentElement.clientHeight,
    };
  }
  componentWillMount() {
    window.addEventListener('resize', this.resize.bind(this), true);
  }
  componentDidMount() {
    if (visibilityChangeEvent) { // 将页面的焦点变换写入store
      document.addEventListener(visibilityChangeEvent, () => {
        states.focus(isFocus());
      }, false);
    }

    if (lastRecord) { // 读取记录
      if (lastRecord.cur && !lastRecord.pause) { // 拿到上一次游戏的状态, 如果在游戏中且没有暂停, 游戏继续
        const speedRun = this.props.speedRun;
        let timeout = speeds[speedRun - 1] / 2; // 继续时, 给予当前下落速度一半的停留时间
        // 停留时间不小于最快速的速度
        timeout = speedRun < speeds[speeds.length - 1] ? speeds[speeds.length - 1] : speedRun;
        states.auto(timeout);
      }
      if (!lastRecord.cur) {
        states.overStart();
      }
    } else {
      states.overStart();
    }
  }
  resize() {
    this.setState({
      w: document.documentElement.clientWidth,
      h: document.documentElement.clientHeight,
    });
  }
  renderPanel(data, isRemote) {
    const matrix = data.matrix || this.props.matrix;
    const cur = isRemote ? data.cur : this.props.cur;
    const reset = isRemote ? data.reset : this.props.reset;
    const points = isRemote ? data.points : this.props.points;
    const max = isRemote ? (data.max || 0) : this.props.max;
    const clearLines = isRemote ? data.clearLines : this.props.clearLines;
    const startLines = isRemote ? (data.startLines || 0) : this.props.startLines;
    const speedRun = isRemote ? data.speedRun : this.props.speedRun;
    const speedStart = isRemote ? (data.speedStart || 1) : this.props.speedStart;
    const next = isRemote ? data.next : this.props.next;
    const musicData = isRemote ? (data.music || false) : this.props.music;
    const pauseData = isRemote ? data.pause : this.props.pause;

    return (
      <div className={style.panel}>
        <div className={style.panelLabel}>{isRemote ? '对方' : '我方'}</div>
        {this.renderBattleOverlay(isRemote, data)}
        <Matrix
          matrix={matrix}
          cur={cur}
          reset={reset}
          isRemote={isRemote}
        />
        <Logo cur={!!cur} reset={reset} />
        <div className={style.state}>
          <Point cur={!!cur} point={points} max={max} />
          <p>{ cur ? i18n.cleans[lan] : i18n.startLine[lan] }</p>
          <Number number={cur ? clearLines : startLines} />
          <p>{i18n.level[lan]}</p>
          <Number
            number={cur ? speedRun : speedStart}
            length={1}
          />
          <p>{i18n.next[lan]}</p>
          <Next data={next} />
          <div className={style.bottom}>
            <Music data={musicData} />
            <Pause data={pauseData} />
            <Number time />
          </div>
        </div>
      </div>
    );
  }
  renderBattleOverlay(isRemote, data) {
    const remote = this.props.remote || {};
    const connectedCount = remote.connectedCount || 1;
    if (connectedCount < 2) {
      return null;
    }
    const localReset = this.props.reset;
    const remoteReset = data.reset;

    if (!isRemote && localReset) {
      return <div className={style.overlay}>你输了</div>;
    }
    if (!isRemote && !localReset && remoteReset) {
      return <div className={style.overlay}>你赢了</div>;
    }
    if (isRemote && remoteReset) {
      return <div className={style.overlay}>对方已失败</div>;
    }
    return null;
  }
  render() {
    let filling = 0;
    const size = (() => {
      const w = this.state.w;
      const h = this.state.h;
      const refW = 1100;
      const refH = 960;
      const scale = Math.min(w / refW, h / refH);
      filling = (h - (refH * scale)) / scale / 3;
      const css = {
        paddingTop: Math.floor(filling) + 42,
        paddingBottom: Math.floor(filling),
        marginTop: Math.floor(-(refH / 2) - (filling * 1.5)),
      };
      css[transform] = `scale(${scale})`;
      return css;
    })();

    const remote = this.props.remote || {};
    const connectedCount = remote.connectedCount || 1;
    const connectionStatus = remote.connectionStatus || 'disconnected';
    const isWaiting = connectedCount < 2;

    const statusText = (() => {
      if (connectionStatus === 'connecting') {
        return '正在连接对战服务器…';
      }
      if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
        return '未连接服务器（请先运行 npm run server）';
      }
      return isWaiting ? '等待对手' : '对战已开始';
    })();

    return (
      <div
        className={style.app}
        style={size}
      >
        <div className={style.roomInfo}>
          <span>房间: {network.getRoomId()} </span>
          <span className={isWaiting ? style.waiting : style.connected}>
            {statusText}
          </span>
          {isWaiting && connectionStatus === 'connected' && (
            <p className={style.roomTip}>
              把地址栏链接发给好友，进入同一房间即可开始对战；先堆到顶的一方判负
            </p>
          )}
          {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
            <p className={style.roomTip}>
              请确认已执行 npm run server，并检查防火墙是否放行 WebSocket 端口
            </p>
          )}
        </div>
        <div className={classnames({ [style.rect]: true, [style.drop]: this.props.drop })}>
          <Decorate />
          <div className={style.screen}>
            {this.renderPanel({}, false)}
            {isWaiting ? (
              <div className={style.waitingPanel}>
                <div className={style.waitingTitle}>等待对手加入…</div>
                <div className={style.roomUrl}>{window.location.href}</div>
                <p className={style.waitingHint}>复制上方链接到另一个浏览器或设备打开</p>
              </div>
            ) : this.renderPanel(remote, true)}
          </div>
        </div>
        <Keyboard filling={filling} keyboard={this.props.keyboard} />
      </div>
    );
  }
}

App.propTypes = {
  music: propTypes.bool.isRequired,
  pause: propTypes.bool.isRequired,
  matrix: propTypes.object.isRequired,
  next: propTypes.string.isRequired,
  cur: propTypes.object,
  dispatch: propTypes.func.isRequired,
  speedStart: propTypes.number.isRequired,
  speedRun: propTypes.number.isRequired,
  startLines: propTypes.number.isRequired,
  clearLines: propTypes.number.isRequired,
  points: propTypes.number.isRequired,
  max: propTypes.number.isRequired,
  reset: propTypes.bool.isRequired,
  drop: propTypes.bool.isRequired,
  keyboard: propTypes.object.isRequired,
  remote: propTypes.object,
};

const mapStateToProps = (state) => ({
  pause: state.get('pause'),
  music: state.get('music'),
  matrix: state.get('matrix'),
  next: state.get('next'),
  cur: state.get('cur'),
  speedStart: state.get('speedStart'),
  speedRun: state.get('speedRun'),
  startLines: state.get('startLines'),
  clearLines: state.get('clearLines'),
  points: state.get('points'),
  max: state.get('max'),
  reset: state.get('reset'),
  drop: state.get('drop'),
  keyboard: state.get('keyboard'),
  remote: state.get('remote'),
});

export default connect(mapStateToProps)(App);
