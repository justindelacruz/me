import React from 'react';
const PortfolioUrl = require('./portfolio-url');
const PortfolioSkill = require('./portfolio-skill');
const PortfolioAssets = require('./portfolio-assets');

class PortfolioItem extends React.Component {
  static createTextMarkup(text) {
    return {__html: text};
  }

  render() {
    return(
      <div className="portfolio-item">
        <div className="portfolio-item__description">
          <div className="portfolio-item__title">{this.props.name} <span className="portfolio-item__date">{this.props.date}</span></div>

          <p className="portfolio-item__text" dangerouslySetInnerHTML={PortfolioItem.createTextMarkup(this.props.description)} />

          <ul className="portfolio-item__text portfolio-item__links">
            {this.props.urls.map(function(item, i) {
              return <PortfolioUrl url={item.url} text={item.text} key={i} />
            })}
          </ul>

          <ul className="portfolio-item__skills">
            {this.props.skills.map(function(item, i) {
              return <PortfolioSkill name={item} key={i} />
            })}
          </ul>
        </div>

        <PortfolioAssets items={this.props.assets} />
      </div>
    );
  }
}

PortfolioItem.propTypes = {
  name: React.PropTypes.string,
  date: React.PropTypes.string,
  description: React.PropTypes.string,
  urls: React.PropTypes.arrayOf(React.PropTypes.objectOf(React.PropTypes.string)),
  skills: React.PropTypes.arrayOf(React.PropTypes.string),
  assets: React.PropTypes.arrayOf(React.PropTypes.object)
};

module.exports = PortfolioItem;