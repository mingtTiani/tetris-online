import React from 'react';
import propTypes from 'prop-types';
import classnames from 'classnames';
import style from './index.less';
import { i18n, lan, maxSpeedLevel } from '../../unit/const';

const keyActionOrder = ['rotate', 'left', 'right', 'down', 'space', 'pause', 'music', 'reset'];

const keyActionNames = {
  rotate: i18n.rotation[lan],
  left: i18n.left[lan],
  right: i18n.right[lan],
  down: i18n.down[lan],
  space: i18n.drop[lan],
  pause: i18n.pause[lan],
  music: i18n.sound[lan],
  reset: i18n.reset[lan],
};

const formatOneKey = (name) => {
  if (name === ' ') return 'Space';
  if (name === 'ArrowLeft') return '←';
  if (name === 'ArrowRight') return '→';
  if (name === 'ArrowUp') return '↑';
  if (name === 'ArrowDown') return '↓';
  if (name && name.length === 1) return name.toUpperCase();
  return name;
};

const formatKey = (names) => {
  const arr = Array.isArray(names) ? names : [names];
  return arr.map(formatOneKey).join(' / ');
};

export default class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listening: null,
    };
    this.handleKeyCapture = this.handleKeyCapture.bind(this);
  }
  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyCapture, true);
  }
  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyCapture, true);
  }
  handleKeyCapture(e) {
    const { listening } = this.state;
    if (!listening) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') {
      this.setState({ listening: null });
      return;
    }
    const { settings, onChange } = this.props;
    onChange({
      keys: Object.assign({}, settings.keys, { [listening]: [e.key] }),
    });
    this.setState({ listening: null });
  }
  renderHeader() {
    return (
      <div className={style.header}>
        <span className={style.title}>{i18n.settingsTitle ? i18n.settingsTitle[lan] : '设置'}</span>
        <button className={style.closeBtn} onClick={this.props.onClose}>×</button>
      </div>
    );
  }
  renderToggle(value, onClick, activeLabel, inactiveLabel) {
    return (
      <div
        className={classnames(style.toggle, { [style.toggleOn]: value })}
        onClick={onClick}
      >
        <div className={style.toggleTrack}>
          <div className={style.toggleThumb} />
        </div>
        <span className={style.toggleLabel}>{value ? activeLabel : inactiveLabel}</span>
      </div>
    );
  }
  renderModeSection() {
    const { settings, onChange } = this.props;
    const singleLabel = i18n.singlePlayer ? i18n.singlePlayer[lan] : '单人模式';
    const dualLabel = i18n.dualPlayer ? i18n.dualPlayer[lan] : '双人模式';
    return (
      <div className={style.section}>
        <div className={style.sectionTitle}>{i18n.gameMode ? i18n.gameMode[lan] : '游戏模式'}</div>
        {this.renderToggle(
          settings.gameMode === 'dual',
          () => onChange({ gameMode: settings.gameMode === 'single' ? 'dual' : 'single' }),
          dualLabel,
          singleLabel
        )}
      </div>
    );
  }
  renderKeySection() {
    const { settings } = this.props;
    const { listening } = this.state;
    return (
      <div className={style.section}>
        <div className={style.sectionTitle}>{i18n.keyConfig ? i18n.keyConfig[lan] : '按键绑定'}</div>
        <div className={style.keyList}>
          {keyActionOrder.map((action) => (
            <div key={action} className={style.keyRow}>
              <span className={style.keyName}>{keyActionNames[action]}</span>
              <button
                className={classnames(style.keyValue, { [style.listening]: listening === action })}
                onClick={() => this.setState({ listening: action })}
              >
                {listening === action ? '按任意键...' : formatKey(settings.keys[action])}
              </button>
            </div>
          ))}
        </div>
        <p className={style.hint}>{i18n.keyHint ? i18n.keyHint[lan] : '点击按键后按新键，Esc 取消'}</p>
      </div>
    );
  }
  renderGameSection() {
    const { settings, onChange, speedStart, startLines } = this.props;
    const speeds = Array.from({ length: maxSpeedLevel }, (_, i) => i + 1);
    const lines = Array.from({ length: 11 }, (_, i) => i);
    return (
      <div className={style.section}>
        <div className={style.sectionTitle}>
          {i18n.gameSettings ? i18n.gameSettings[lan] : '游戏参数'}
        </div>
        <div className={style.row}>
          <span>{i18n.startSpeed ? i18n.startSpeed[lan] : '初始速度'}</span>
          <select
            value={speedStart}
            onChange={(e) => this.props.onSpeedStartChange(parseInt(e.target.value, 10))}
          >
            {speeds.map((s) => <option key={s} value={s}>L{s}</option>)}
          </select>
        </div>
        <div className={style.row}>
          <span>{i18n.startLine ? i18n.startLine[lan] : '初始行数'}</span>
          <select
            value={startLines}
            onChange={(e) => this.props.onStartLinesChange(parseInt(e.target.value, 10))}
          >
            {lines.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className={style.row}>
          <span>{i18n.showGhost ? i18n.showGhost[lan] : '显示阴影'}</span>
          {this.renderToggle(
            settings.showGhost,
            () => onChange({ showGhost: !settings.showGhost }),
            i18n.on[lan],
            i18n.off[lan]
          )}
        </div>
      </div>
    );
  }
  renderAudioSection() {
    const { settings, onChange, music } = this.props;
    return (
      <div className={style.section}>
        <div className={style.sectionTitle}>
          {i18n.audioSettings ? i18n.audioSettings[lan] : '音频'}
        </div>
        <div className={style.row}>
          <span>{i18n.volume ? i18n.volume[lan] : '音量'}</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
          />
          <span className={style.value}>{Math.round(settings.volume * 100)}%</span>
        </div>
        <div className={style.row}>
          <span>{i18n.sound[lan]}</span>
          {this.renderToggle(
            music,
            () => this.props.onMusicToggle(),
            i18n.on[lan],
            i18n.off[lan]
          )}
        </div>
      </div>
    );
  }
  renderNetworkSection() {
    const { settings, onChange } = this.props;
    if (settings.gameMode !== 'dual') {
      return null;
    }
    return (
      <div className={style.section}>
        <div className={style.sectionTitle}>
          {i18n.networkSettings ? i18n.networkSettings[lan] : '网络'}
        </div>
        <div className={style.row}>
          <span>{i18n.wsUrl ? i18n.wsUrl[lan] : '服务器地址'}</span>
          <input
            type="text"
            className={style.textInput}
            value={settings.wsUrl}
            placeholder="ws://hostname:3000"
            onChange={(e) => onChange({ wsUrl: e.target.value })}
          />
        </div>
      </div>
    );
  }
  renderLanguageSection() {
    const { settings, onChange } = this.props;
    const languages = [
      { code: '', label: i18n.followSystem ? i18n.followSystem[lan] : '跟随系统' },
      { code: 'cn', label: '中文' },
      { code: 'en', label: 'English' },
    ];
    return (
      <div className={style.section}>
        <div className={style.sectionTitle}>{i18n.language ? i18n.language[lan] : '语言'}</div>
        <div className={style.toggleGroup}>
          {languages.map((l) => (
            <button
              key={l.code}
              className={classnames({ [style.active]: settings.language === l.code })}
              onClick={() => onChange({ language: l.code })}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className={style.hint}>语言切换需刷新页面后生效</p>
      </div>
    );
  }
  renderFooter() {
    return (
      <div className={style.footer}>
        <button className={style.resetBtn} onClick={this.props.onReset}>
          {i18n.resetSettings ? i18n.resetSettings[lan] : '恢复默认'}
        </button>
        <button className={style.closeBtn2} onClick={this.props.onClose}>
          {i18n.close ? i18n.close[lan] : '关闭'}
        </button>
      </div>
    );
  }
  render() {
    if (!this.props.visible) {
      return null;
    }
    return (
      <div className={style.overlay} onClick={this.props.onClose}>
        <div className={style.modal} onClick={(e) => e.stopPropagation()}>
          {this.renderHeader()}
          <div className={style.body}>
            {this.renderModeSection()}
            {this.renderKeySection()}
            {this.renderGameSection()}
            {this.renderAudioSection()}
            {this.renderNetworkSection()}
            {this.renderLanguageSection()}
          </div>
          {this.renderFooter()}
        </div>
      </div>
    );
  }
}

Settings.propTypes = {
  visible: propTypes.bool.isRequired,
  settings: propTypes.object.isRequired,
  speedStart: propTypes.number.isRequired,
  startLines: propTypes.number.isRequired,
  music: propTypes.bool.isRequired,
  onChange: propTypes.func.isRequired,
  onSpeedStartChange: propTypes.func.isRequired,
  onStartLinesChange: propTypes.func.isRequired,
  onMusicToggle: propTypes.func.isRequired,
  onReset: propTypes.func.isRequired,
  onClose: propTypes.func.isRequired,
};
