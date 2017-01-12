import React from 'react';
import ReactDOM from 'react-dom';
const Portfolio = require('./components/portfolio');

const data = require('./data.json');

ReactDOM.render(
  <Portfolio items={data} />,
  document.getElementById('portfolio')
);



