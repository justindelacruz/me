import React from 'react';
import ReactDOM from 'react-dom';
import Rellax from 'rellax';
const Portfolio = require('./components/portfolio');
const Photoswipe = require('./photoswipe');
const portfolioData = require('./data/portfolio.json');
const sideProjectData = require('./data/side-projects.json');

// Init photoswipe gallery
// Photoswipe.init();

ReactDOM.render(
  <Portfolio items={portfolioData} />,
  document.getElementById('portfolio')
);

ReactDOM.render(
  <Portfolio items={sideProjectData} />,
  document.getElementById('side-projects')
);

// Make header ~* parallax *~
new Rellax('.parallax');

