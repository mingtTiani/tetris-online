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
import Settings from '../components/settings';

import { transform, i18n, lan } from '../unit/const';
import { visibilityChangeEvent, isFocus } from '../unit/';
import store from '../store';
import states from '../control/states';
import actions from '../actions';
import network from '../network';

const formatKeyLabel = (name) => {
  if (name === ' ') return 'Space';
  if (name === 'ArrowLeft') return '←';
  if (name === 'ArrowRight') return '→';
  if (name === 'ArrowUp') return '↑';
  if (name === 'ArrowDown') return '↓';
  if (name && name.length === 1) return name.toUpperCase();
  return name;
};

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      w: document.documentElement.clientWidth,
      h: document.documentElement.clientHeight,
      overtimeFlash: false,
      settingsVisible: false,
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

    // 刷新后统一重置到菜单，避免读到上一局的死亡/加时/结果等状态
    states.resetToMenu();
  }
  componentWillReceiveProps(nextProps) {
    const prevRemoteDead = this.props.remote
      && this.props.remote.deadInfo
      && this.props.remote.deadInfo.isDead;
    const nextRemoteDead = nextProps.remote
      && nextProps.remote.deadInfo
      && nextProps.remote.deadInfo.isDead;
    const prevLocalDead = this.props.playerDead && this.props.playerDead.isDead;

    if (!prevLocalDead && !prevRemoteDead && nextRemoteDead) {
      this.setState({ overtimeFlash: true });
      setTimeout(() => {
        this.setState({ overtimeFlash: false });
      }, 2000);
    }

    // 游戏模式切换：连入/断开对战服务器
    const prevMode = this.props.settings.gameMode;
    const nextMode = nextProps.settings.gameMode;
    if (prevMode !== nextMode) {
      if (nextMode === 'dual') {
        network.init(store);
      } else {
        network.disconnect();
      }
      states.resetToMenu();
    }
  }
  resize() {
    this.setState({
      w: document.documentElement.clientWidth,
      h: document.documentElement.clientHeight,
    });
  }
  openSettings() {
    this.setState({ settingsVisible: true });
  }
  closeSettings() {
    this.setState({ settingsVisible: false });
  }
  handleSettingsChange(data) {
    this.props.dispatch(actions.settings(data));
  }
  handleSettingsReset() {
    this.props.dispatch(actions.resetSettings());
  }
  selectStartLevel(level) {
    this.props.dispatch(actions.speedStart(level));
  }
  renderStartLevelSelector() {
    const current = this.props.speedStart;
    const levels = [1, 3, 5];
    return (
      <div className={style.startLevelSelector}>
        <span>初始速度:</span>
        {levels.map(level => (
          <button
            key={level}
            className={classnames({ [style.active]: current === level })}
            onClick={() => this.selectStartLevel(level)}
          >
            L{level}
          </button>
        ))}
      </div>
    );
  }
  renderScoreboard() {
    const remote = this.props.remote || {};
    const connectedCount = remote.connectedCount || 1;
    if (connectedCount < 2) {
      return null;
    }
    const localDead = this.props.playerDead.isDead;
    const remoteDead = remote.deadInfo && remote.deadInfo.isDead;
    const gameTime = this.props.gameTime;

    let statusText = '对战中';
    if (localDead && remoteDead) {
      statusText = '已结束';
    } else if (localDead) {
      statusText = '你已到顶，等待对方';
    } else if (remoteDead) {
      statusText = '对方已到顶，加时赛';
    }

    return (
      <div className={style.scoreboard}>
        <div className={style.scoreItem}>
          <span className={style.scoreLabel}>我方</span>
          <span className={style.scoreValue}>{this.props.points}</span>
          <span className={style.levelBadge}>L{this.props.speedRun}</span>
        </div>
        <div className={style.scoreCenter}>
          <div className={style.scoreTime}>
            {Math.floor(gameTime / 60)}:{String(gameTime % 60).padStart(2, '0')}
          </div>
          <div className={style.scoreStatus}>{statusText}</div>
        </div>
        <div className={style.scoreItem}>
          <span className={style.scoreLabel}>对方</span>
          <span className={style.scoreValue}>{remote.points || 0}</span>
          <span className={style.levelBadge}>L{remote.speedRun || 1}</span>
        </div>
      </div>
    );
  }
  renderResultOverlay() {
    const result = this.props.gameResult;
    if (!result || !result.finished) {
      return null;
    }
    const winnerText = result.winner === 'local' ? '你赢了' : '对方赢了';
    const reasonText = (() => {
      if (result.reason === 'points') {
        return '分数更高';
      }
      if (result.reason === 'single') {
        return '单人挑战结束';
      }
      return '存活更久';
    })();
    return (
      <div className={style.resultOverlay}>
        <div className={style.resultBox}>
          <div className={style.resultTitle}>{winnerText}</div>
          <div className={style.resultReason}>{reasonText}</div>
          <div className={style.resultScores}>
            <div>我方 {result.localPoints} 分（{result.localTime}s）</div>
            <div>对方 {result.remotePoints} 分（{result.remoteTime}s）</div>
          </div>
          <p className={style.resultHint}>按 R 开始新游戏</p>
        </div>
      </div>
    );
  }
  renderOvertimeFlash() {
    if (!this.state.overtimeFlash) {
      return null;
    }
    return (
      <div className={style.overtimeFlash}>
        <div className={style.overtimeFlashText}>对方已到顶，进入加时追分！</div>
      </div>
    );
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
      <div
        className={classnames(style.panel, {
          [style.singlePanel]: this.props.settings.gameMode === 'single',
        })}
      >
        <div className={style.panelLabel}>{isRemote ? '对方' : '我方'}</div>
        {this.renderBattleOverlay(isRemote, data)}
        <Matrix
          matrix={matrix}
          cur={cur}
          reset={reset}
          isRemote={isRemote}
          showGhost={this.props.settings.showGhost}
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
  renderBattleOverlay(isRemote, data) { // eslint-disable-line no-unused-vars
    const remote = this.props.remote || {};
    const connectedCount = remote.connectedCount || 1;
    if (connectedCount < 2) {
      return null;
    }
    const localDead = this.props.playerDead.isDead;
    const remoteDead = remote.deadInfo && remote.deadInfo.isDead;
    const result = this.props.gameResult;

    if (result && result.finished) {
      if (!isRemote) {
        return (
          <div className={style.overlay}>
            {result.winner === 'local' ? '胜利' : '失败'}
          </div>
        );
      }
      return null;
    }

    if (!isRemote && localDead && !remoteDead) {
      return <div className={style.overlay}>已到顶，等待对方结束</div>;
    }
    if (isRemote && remoteDead) {
      return <div className={style.overlay}>对方已失败</div>;
    }
    return null;
  }
  renderRoomInfo() {
    const { settings, remote, cur } = this.props;
    if (settings.gameMode !== 'dual') {
      return null;
    }
    const connectedCount = remote.connectedCount || 1;
    const connectionStatus = remote.connectionStatus || 'disconnected';
    const isWaiting = connectedCount < 2;
    const inGame = !!cur;

    const statusText = (() => {
      if (connectionStatus === 'connecting') {
        return '正在连接对战服务器…';
      }
      if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
        return '未连接服务器（请先运行 npm run server）';
      }
      return isWaiting ? '等待对手' : '双方已连接，按 R 开始对战';
    })();

    return (
      <div className={style.roomInfo}>
        <div className={style.roomHeader}>
          <span>房间: {network.getRoomId()} </span>
          <span className={isWaiting ? style.waiting : style.connected}>
            {statusText}
          </span>
        </div>
        {!inGame && this.renderStartLevelSelector()}
        {isWaiting && connectionStatus === 'connected' && (
          <p className={style.roomTip}>
            把地址栏链接发给好友，进入同一房间即可开始对战；死亡后由分数与存活时间决胜负
          </p>
        )}
        {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
          <p className={style.roomTip}>
            请确认已执行 npm run server，并检查防火墙是否放行 WebSocket 端口
          </p>
        )}
      </div>
    );
  }
  renderSingleInfo() {
    const { settings, cur } = this.props;
    if (settings.gameMode !== 'single' || cur) {
      return null;
    }
    return (
      <div className={style.roomInfo}>
        <div className={style.roomHeader}>
          <span className={style.connected}>单人模式</span>
        </div>
        {this.renderStartLevelSelector()}
      </div>
    );
  }
  renderRemotePanel() {
    const { settings, remote } = this.props;
    if (settings.gameMode !== 'dual') {
      return null;
    }
    const connectedCount = remote.connectedCount || 1;
    const isWaiting = connectedCount < 2;
    if (isWaiting) {
      return (
        <div className={style.waitingPanel}>
          <div className={style.waitingTitle}>等待对手加入…</div>
          <div className={style.roomUrl}>{window.location.href}</div>
          <p className={style.waitingHint}>复制上方链接到另一个浏览器或设备打开</p>
        </div>
      );
    }
    return this.renderPanel(remote, true);
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
        paddingTop: Math.floor(filling) + 20,
        paddingBottom: Math.floor(filling),
        marginTop: Math.floor(-(refH / 2) - (filling * 1.5)),
      };
      css[transform] = `scale(${scale})`;
      return css;
    })();

    const { settings, keyboard } = this.props;
    const inGame = !!this.props.cur;
    const keyLabels = {};
    Object.keys(settings.keys).forEach((action) => {
      keyLabels[action] = formatKeyLabel(settings.keys[action]);
    });

    return (
      <div
        className={style.app}
        style={size}
      >
        {!inGame && (
          <button className={style.settingsBtn} onClick={() => this.openSettings()}>
            ⚙️
          </button>
        )}
        {this.renderRoomInfo()}
        {this.renderSingleInfo()}
        {this.renderOvertimeFlash()}
        <div className={classnames({ [style.rect]: true, [style.drop]: this.props.drop })}>
          <Decorate />
          <div
            className={classnames(style.screen, {
              [style.singleScreen]: settings.gameMode === 'single',
            })}
          >
            {this.renderScoreboard()}
            {this.renderPanel({}, false)}
            {this.renderRemotePanel()}
          </div>
        </div>
        {this.renderResultOverlay()}
        <Keyboard filling={filling} keyboard={keyboard} keyLabels={keyLabels} />
        <Settings
          visible={this.state.settingsVisible}
          settings={settings}
          speedStart={this.props.speedStart}
          startLines={this.props.startLines}
          music={this.props.music}
          onChange={(data) => this.handleSettingsChange(data)}
          onSpeedStartChange={(level) => this.selectStartLevel(level)}
          onStartLinesChange={(lines) => this.props.dispatch(actions.startLines(lines))}
          onMusicToggle={() => this.props.dispatch(actions.music(!this.props.music))}
          onReset={() => this.handleSettingsReset()}
          onClose={() => this.closeSettings()}
        />
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
  gameTime: propTypes.number.isRequired,
  playerDead: propTypes.object.isRequired,
  gameResult: propTypes.object.isRequired,
  settings: propTypes.object.isRequired,
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
  gameTime: state.get('gameTime'),
  playerDead: state.get('playerDead'),
  gameResult: state.get('gameResult'),
  settings: state.get('settings'),
});

export default connect(mapStateToProps)(App);
