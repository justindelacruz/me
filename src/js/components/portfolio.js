import React from 'react';
const PortfolioItem = require('./portfolio-item');

class Portfolio extends React.Component {
  render() {
    return(
      <div>
        {this.props.items.map(function(item, i) {
          return <PortfolioItem name={item['name']}
                                date={item['date']}
                                description={item['description']}
                                urls={item['urls']}
                                skills={item['skills']}
                                assets={item['assets']}
                                key={i} />
        })}
      </div>
    );
  }
}

Portfolio.propTypes = {
  items: React.PropTypes.arrayOf(React.PropTypes.object),
};

module.exports = Portfolio;
