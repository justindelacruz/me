import React from 'react';

class PortfolioUrl extends React.Component {
  render() {
    return(
      <li>
        <a href={this.props.url} rel="nofollow" className="portfolio-item__link">{this.props.text}</a>
      </li>
    );
  }
}

PortfolioUrl.propTypes = {
  url: React.PropTypes.string,
  text: React.PropTypes.string,
};

module.exports = PortfolioUrl;