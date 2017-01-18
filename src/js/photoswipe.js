const PhotoSwipe = require('../../bower_components/photoswipe/dist/photoswipe');
const PhotoSwipeUI_Default = require('../../bower_components/photoswipe/dist/photoswipe-ui-default');

let Gallery = (function () {
  // define options (if needed)
  let options = {
    // optionName: 'option value'
    // for example:
    index: 0 // start at first slide
  };

  // build items array
  let items = [];

  let gallery;

  return {
    init: function init() {
      // Photoswipe lightbox
      let pswpElement = document.querySelectorAll('.pswp')[0];

      console.log(items);

      // Initializes and opens PhotoSwipe
      gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);

      gallery.listen('destroy', function() {
        console.log("destroy");
        gallery = null;
      })
    },

    open: function(index) {
      if (index) {
        options.index = index;
      }

      if (gallery) {
        gallery.init();
      } else {
        this.init();
        gallery.init();
      }
    },

    /**
     * Add new slide to PhotoSwipe.
     *
     * @param {object} data
     */
    push: function push(data) {
      items.push(data);

      return items.length - 1;
    }
  };
}());

module.exports = Gallery;