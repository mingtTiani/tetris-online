import React from 'react';
import cn from 'classnames';
import propTypes from 'prop-types';

import style from './index.less';

const render = (data) => (
  <div className={style.number}>
    {
      data.map((e, k) => (
        <span className={cn(['bg', style[`s_${e}`]])} key={k} />
      ))
    }
  </div>
);

const formate = (num) => (
  num < 10 ? `0${num}`.split('') : `${num}`.split('')
);


export default class Number extends React.Component {
  constructor() {
    super();
    this.state = {
      time_count: false,
      time: new Date(),
    };
    this.timeInterval = null;
  }
  componentWillMount() {
    if (!this.props.time) {
      return;
    }
    const clock = () => {
      this.timeInterval = setTimeout(() => {
        if (!this.timeInterval) {
          return;
        }
        this.setState({
          time: new Date(),
          time_count: this.timeInterval, // 用来做 shouldComponentUpdate 优化
        });
        clock();
      }, 1000);
    };
    clock();
  }
  shouldComponentUpdate({ number }) {
    if (this.props.time) { // 右下角时钟
      return this.state.time_count !== this.timeInterval;
    }
    return this.props.number !== number;
  }
  componentWillUnmount() {
    if (this.timeInterval) {
      clearTimeout(this.timeInterval);
      this.timeInterval = null;
    }
  }
  render() {
    if (this.props.time) { // 右下角时钟
      const now = this.state.time;
      const hour = formate(now.getHours());
      const min = formate(now.getMinutes());
      const sec = now.getSeconds() % 2;
      const t = hour.concat(sec ? 'd' : 'd_c', min);
      return (render(t));
    }

    const num = `${this.props.number}`.split('');
    for (let i = 0, len = this.props.length - num.length; i < len; i++) {
      num.unshift('n');
    }
    return (render(num));
  }
}

Number.propTypes = {
  number: propTypes.number,
  length: propTypes.number,
  time: propTypes.bool,
};

Number.defaultProps = {
  length: 6,
};
