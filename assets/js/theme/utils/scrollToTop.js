export default function scrollToTop() {
  $('html, body').animate({
    scrollTop: $('.site-canvas').offset().top
  });
}
