import React from 'react';
const PortfolioUrl = require('./portfolio-url');
const PortfolioSkill = require('./portfolio-skill');

class PortfolioItem extends React.Component {
  render() {
    return(
      <div className="portfolio-item">
        <div className="portfolio-item__description">
          <div className="portfolio-item__title">{this.props.name} <span className="portfolio-item__date">{this.props.date}</span></div>

          <p className="portfolio-item__text">
            {this.props.description}
          </p>

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

        <div className="col portfolio-item__images">
          {this.props.images.map(function(item, i) {
            return (
              <a className="portfolio-item__image" href={item.url} rel="nofollow" target="_blank" key={i}>
                <img src={item.thumbnail_src} />
              </a>)
          })}
        </div>
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
  images: React.PropTypes.arrayOf(React.PropTypes.objectOf(React.PropTypes.string))
};

module.exports = PortfolioItem;