import slick from 'slick-carousel';
import imagesLoaded from 'imagesloaded';
import ImageZoom from './ImageZoom';
import baguetteBox from 'baguettebox.js';

// Define custom black SVGs
const customLeftArrow = '<svg width="44" height="60">' +
    '<polyline points="30 10 10 30 30 50" stroke="black" stroke-width="4"' +
    'stroke-linecap="butt" fill="none" stroke-linejoin="round"/>' +
    '</svg>';

const customRightArrow = '<svg width="44" height="60">' +
    '<polyline points="14 10 34 30 14 50" stroke="black" stroke-width="4"' +
    'stroke-linecap="butt" fill="none" stroke-linejoin="round"/>' +
    '</svg>';

const customCloseX = '<svg width="30" height="30">' +
    '<g stroke="black" stroke-width="4">' +
    '<line x1="5" y1="5" x2="25" y2="25"/>' +
    '<line x1="5" y1="25" x2="25" y2="5"/>' +
    '</g></svg>';

// Custom Infinite Looping for baguetteBox
baguetteBox.run('.product-slides-wrap', {
  leftArrow: customLeftArrow,
  rightArrow: customRightArrow,
  closeX: customCloseX,
  preload: 2, 
  buttons: 'auto',
  animation: 'slideIn',
  noScrollbars: false,
  fullScreen: false,
  afterShow: () => {
      // Rebinding event listeners for next and previous arrows
      const totalImages = document.querySelectorAll('.product-slides-wrap a').length;

      // Reset any existing event listeners
      const nextButton = document.querySelector('#next-button');
      const prevButton = document.querySelector('#previous-button');

      // Removing any existing listeners to avoid piling up
      nextButton.removeEventListener('click', nextImage);
      prevButton.removeEventListener('click', previousImage);

      // Next image function with loop
      const nextImage = () => {
          let currentIndex = baguetteBox.getCurrentIndex();
          let nextIndex = (currentIndex + 1) % totalImages; // Loop back to start after the last image
          baguetteBox.show(nextIndex); // Show the next image
      };

      // Previous image function with loop
      const previousImage = () => {
          let currentIndex = baguetteBox.getCurrentIndex();
          let prevIndex = (currentIndex - 1 + totalImages) % totalImages; // Loop back to end after the first image
          baguetteBox.show(prevIndex); // Show the previous image
      };

      // Bind new event listeners after clearing the old ones
      nextButton.addEventListener('click', nextImage);
      prevButton.addEventListener('click', previousImage);
  }
});

export default class ProductImages {
  constructor(el) {
    this.$el = $(el);
    this.maxSlidesBeforeArrows = 5;

    this.classes = {
      container: '.product-images-container',
      slidesWrap: '.product-slides-wrap',
      pagination: '.product-images-pagination',
      paginationItem: '.pagination-item',
      loader: '.product-images-loader',
    };

    this.$pagination = this.$el
      .closest(this.classes.container)
      .find(this.classes.pagination);

    this._init();
  }

  _init() {
    imagesLoaded(this.$el[0], () => {
      // Hide loader
      this.$el
        .parents(this.classes.container)
        .find(this.classes.loader)
        .addClass('initialized');

      // Image zoom
      this.$el.on('init', () => {
        this.$el.find('[data-product-image]').each((i, el) => {
          new ImageZoom(el);
        });
      });

      // Init slick carousel with infinite looping
      this.$el.slick({
        infinite: true, // Enable infinite looping
        arrows: false,
        dots: false,
        adaptiveHeight: true,
        asNavFor: this.classes.pagination,
        draggable: true, 
        swipe: true, 
        touchThreshold: 10, 
        edgeFriction: 0.15
      });

      this.imageCount = this.$pagination
        .find(this.classes.paginationItem)
        .length;

      if (this.imageCount > this.maxSlidesBeforeArrows) {
        this.$pagination.addClass('pagination-has-arrows');
      }

      this.$pagination.on('setPosition', (event, slick) => {
        if (slick.$slides.length > this.maxSlidesBeforeArrows) {
          this.$pagination.addClass('pagination-has-arrows');
        } else {
          this.$pagination.removeClass('pagination-has-arrows');
        }
      });

      this.$pagination
        .slick({
          infinite: true, // Enable infinite looping
          centerMode: false,
          dots: false,
          swipe: true,
          loop: true,
          lazyLoad: 'progressive',
          arrows: true,
          prevArrow: '<div class="product-images-pagination-icon pagination-prev"><svg width="44" height="60"><polyline points="30 10 10 30 30 50" stroke="black" stroke-width="4" stroke-linecap="butt" fill="none" stroke-linejoin="round"/></svg></div>',
          nextArrow: '<div class="product-images-pagination-icon pagination-next"><svg width="44" height="60"><polyline points="14 10 34 30 14 50" stroke="black" stroke-width="4" stroke-linecap="butt" fill="none" stroke-linejoin="round"/></svg></div>',
          slidesToShow: 5,
          slidesToScroll: 1,
          variableWidth: false,
          rows: 0,
          asNavFor: this.classes.slidesWrap,
          focusOnSelect: true,
          draggable: true, 
          swipe: true 
        });

      // Reinitialize the baguetteBox with infinite looping for zoomed images
      baguetteBox.run(this.classes.slidesWrap, {
          leftArrow: customLeftArrow,
          rightArrow: customRightArrow,
          closeX: customCloseX
      });
    });
  }
}
