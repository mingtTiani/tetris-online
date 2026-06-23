import React from 'react';
import Immutable from 'immutable';
import propTypes from 'prop-types';

import style from './index.less';
import Button from './button';
import store from '../../store';
import todo from '../../control/todo';
import { i18n, lan } from '../../unit/const';

export default class Keyboard extends React.Component {
  constructor() {
    super();
    this.touchEventCatch = {};
    this.mouseDownEventCatch = {};
    this.handlers = {};
    Object.keys(todo).forEach((key) => {
      this.handlers[key] = {
        onMouseDown: () => {
          if (this.touchEventCatch[key]) {
            return;
          }
          todo[key].down(store);
          this.mouseDownEventCatch[key] = true;
        },
        onMouseUp: () => {
          if (this.touchEventCatch[key]) {
            this.touchEventCatch[key] = false;
            return;
          }
          todo[key].up(store);
          this.mouseDownEventCatch[key] = false;
        },
        onMouseOut: () => {
          if (this.mouseDownEventCatch[key]) {
            todo[key].up(store);
          }
        },
        onTouchStart: () => {
          this.touchEventCatch[key] = true;
          todo[key].down(store);
        },
        onTouchEnd: () => {
          todo[key].up(store);
        },
      };
    });
  }
  componentDidMount() {
    document.addEventListener('touchstart', (e) => {
      if (e.preventDefault) {
        e.preventDefault();
      }
    }, true);

    document.addEventListener('touchend', (e) => {
      if (e.preventDefault) {
        e.preventDefault();
      }
    }, true);

    document.addEventListener('gesturestart', (e) => {
      if (e.preventDefault) {
        event.preventDefault();
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (e.preventDefault) {
        e.preventDefault();
      }
    }, true);
  }
  shouldComponentUpdate({ keyboard, filling, keyLabels, inGame }) {
    return !Immutable.is(keyboard, this.props.keyboard) ||
      filling !== this.props.filling ||
      inGame !== this.props.inGame ||
      JSON.stringify(keyLabels) !== JSON.stringify(this.props.keyLabels);
  }
  render() {
    const keyboard = this.props.keyboard;
    const labels = this.props.keyLabels || {};
    const inGame = this.props.inGame;
    const resetLabel = inGame
      ? `${i18n.reset[lan]}(⇧${labels.reset || 'R'})`
      : `${i18n.reset[lan]}(${labels.reset || 'R'})`;
    return (
      <div
        className={style.keyboard}
        style={{
          marginTop: 20 + this.props.filling,
        }}
      >
        <Button
          color="blue"
          size="s1"
          top={0}
          left={374}
          label={`${i18n.rotation[lan]}(${labels.rotate || 'J'})`}
          arrow="translate(0, 63px)"
          position
          active={keyboard.get('rotate')}
          {...this.handlers.rotate}
        />
        <Button
          color="blue"
          size="s1"
          top={180}
          left={374}
          label={i18n.down[lan]}
          arrow="translate(0,-71px) rotate(180deg)"
          active={keyboard.get('down')}
          {...this.handlers.down}
        />
        <Button
          color="blue"
          size="s1"
          top={90}
          left={284}
          label={`${i18n.left[lan]}(${labels.left || 'A'})`}
          arrow="translate(60px, -12px) rotate(270deg)"
          active={keyboard.get('left')}
          {...this.handlers.left}
        />
        <Button
          color="blue"
          size="s1"
          top={90}
          left={464}
          label={`${i18n.right[lan]}(${labels.right || 'D'})`}
          arrow="translate(-60px, -12px) rotate(90deg)"
          active={keyboard.get('right')}
          {...this.handlers.right}
        />
        <Button
          color="blue"
          size="s0"
          top={100}
          left={52}
          label={`${i18n.drop[lan]} (${labels.space || 'SPACE'})`}
          active={keyboard.get('drop')}
          {...this.handlers.space}
        />
        <Button
          color="red"
          size="s2"
          top={0}
          left={196}
          label={resetLabel}
          active={keyboard.get('reset')}
          {...this.handlers.reset}
        />
        <Button
          color="green"
          size="s2"
          top={0}
          left={106}
          label={`${i18n.sound[lan]}(${labels.music || 'M'})`}
          active={keyboard.get('music')}
          {...this.handlers.music}
        />
        <Button
          color="green"
          size="s2"
          top={0}
          left={16}
          label={`${i18n.pause[lan]}(${labels.pause || 'P'})`}
          active={keyboard.get('pause')}
          {...this.handlers.pause}
        />
      </div>
    );
  }
}

Keyboard.propTypes = {
  filling: propTypes.number.isRequired,
  keyboard: propTypes.object.isRequired,
  keyLabels: propTypes.object,
  inGame: propTypes.bool,
};
