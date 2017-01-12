import React from 'react';

class PortfolioSkill extends React.Component {
  render() {
    return(
      <li className="portfolio-item__skill">
        {this.props.name}
      </li>
    );
  }
}

PortfolioSkill.propTypes = {
  name: React.PropTypes.string
};

module.exports = PortfolioSkill;
