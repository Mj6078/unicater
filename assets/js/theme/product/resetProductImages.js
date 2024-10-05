import scrollToTop from '../utils/scrollToTop';

export default function resetProductImages($el) {
  const numSlides = $el.find('[data-product-image]').length - 1;
  const mainSlide = $el.find('[data-product-image]').index('[data-product-main-image]');

  $el.slick('slickGoTo', mainSlide);
  $el.slick('slickRemove', numSlides);
  scrollToTop();
}
