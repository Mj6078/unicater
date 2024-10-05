import slick from 'slick-carousel';
import productViewTemplates from './productViewTemplates';
import ProductImages from './ProductImages';
import baguetteBox from 'baguettebox.js';
import ImageZoom from './ImageZoom';
import imagesLoaded from 'imagesloaded';
import scrollToTop from '../utils/scrollToTop';

export default function variationImgPreview(productImageUrl, zoomImageUrl, alt, imageId) {
  const productImgs = '.product-slides-wrap';

  // Only append if image doesn't already exist.
  // Otherwise, scroll to it.
  if (!$(`img[src="${productImageUrl}"]`).length) {
    const numSlides = $('[data-product-image]').length;

    if ($('[data-product-image-variant]').length) {
      $(productImgs).slick('slickRemove', numSlides - 1);
    }

    baguetteBox.destroy();

    // Add carousel image
    $(productImgs).slick('slickAdd', productViewTemplates.variationImage({
      productImageSrc: productImageUrl,
      zoomImageSrc: zoomImageUrl,
      alt: alt
    }));

    imagesLoaded(productImgs, { background: true }, () => {
      baguetteBox.run('.product-slides-wrap', {});

      $(productImgs).slick('slickGoTo', numSlides + 1);

      // Image zoom for newly added image
      $(productImgs).find('[data-product-image]').each((i, el) => {
        new ImageZoom(el);
      });
    });
  }
};
