import React from 'react';
const Photoswipe = require('../photoswipe');

class PortfolioAssets extends React.Component {
  render() {
    return (
      <div className="col portfolio-item__assets">
        {this.props.items.map(function(item, i) {
          return <PortfolioAsset type={item.type}
                                 src={item.src}
                                 thumbnail_src={item.thumbnail_src}
                                 width={item.width}
                                 height={item.height}
                                 title={item.title}
                                 key={i} />
        })}
      </div>
    );
  }
}

class PortfolioAsset extends React.Component {
  constructor(props) {
    super(props);

    if (this.props.type == 'image') {
      let index = Photoswipe.push({
        src: props.src,
        w: props.width,
        h: props.height,
        msrc: props.thumbnail_src,
        title: props.title
      });

      this.state = {index: index};
    }

    this.openLightbox = this.openLightbox.bind(this);
  }

  openLightbox(e) {
    e.preventDefault();
    let {index} = this.state;

    console.log("opening", index);
    Photoswipe.open(index);
  }

  render() {
    if (this.props.type == 'youtube') {
      return(
        <div className="portfolio-item__asset">
          <iframe width="100%" height="100%" src={this.props.src} frameBorder="0" allowFullScreen="true"></iframe>
        </div>
      );
    } else {
      return(
        <a href="#"
           className="portfolio-item__asset"
           onClick={this.openLightbox}
           style={
             {
               backgroundImage: 'url(' + this.props.thumbnail_src + ')'
             }
           }>
        </a>
      );
    }
  }
}

PortfolioAssets.propTypes = {
  items: React.PropTypes.arrayOf(React.PropTypes.object)
};


PortfolioAsset.propTypes = {
  type: React.PropTypes.string,
  src: React.PropTypes.string,
  thumbnail_src: React.PropTypes.string,
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  title: React.PropTypes.string
};

module.exports = PortfolioAssets;
