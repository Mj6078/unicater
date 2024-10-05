import $ from 'jquery';

export default class ScrollLink {
  constructor(options) {
    this.options = $.extend({
      selector: '[data-scroll]',
      duration: 1000,
      easing: 'swing',
      delay: 0,
      offset: 0,
      updateHash: true
    }, options);

    this._bindEvents();
  }

  _bindEvents() {
    $(this.options.selector).on('click', (e) => {
      e.preventDefault();
      setTimeout(() => {
        this._scrollToContent($(e.currentTarget));
      }, this.options.delay);
    });
  }

  _scrollToContent(target) {
    const duration = this.options.duration;
    const easing = this.options.easing;
    let scrollTarget = $(target).data('scroll') || target;

    if (scrollTarget === '#') {
      scrollTarget = 'body';
    }

    $('html, body').animate({
      scrollTop: $(scrollTarget).offset().top + this.options.offset
    }, duration, easing);

    if (this.options.updateHash) {
      if (history.replaceState) {
        history.replaceState({}, scrollTarget, scrollTarget);
      } else {
        window.location.hash = scrollTarget;
      }
    }
  }

  scrollToContent(target) {
    setTimeout(() => {
      this._scrollToContent(target);
    }, this.options.delay);
  }
}
