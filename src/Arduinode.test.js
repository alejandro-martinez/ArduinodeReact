import React from 'react';
import ReactDOM from 'react-dom';
import Arduinode from './Arduinode';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Arduinode />, div);
});
