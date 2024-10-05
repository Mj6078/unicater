'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ScrollLink = function () {
  function ScrollLink(options) {
    _classCallCheck(this, ScrollLink);

    this.options = _jquery2.default.extend({
      selector: '[data-scroll]',
      duration: 1000,
      easing: 'swing',
      delay: 0,
      offset: 0,
      updateHash: true
    }, options);

    this._bindEvents();
  }

  _createClass(ScrollLink, [{
    key: '_bindEvents',
    value: function _bindEvents() {
      var _this = this;

      (0, _jquery2.default)(this.options.selector).on('click', function (e) {
        e.preventDefault();
        setTimeout(function () {
          _this._scrollToContent((0, _jquery2.default)(e.currentTarget));
        }, _this.options.delay);
      });
    }
  }, {
    key: '_scrollToContent',
    value: function _scrollToContent(target) {
      var duration = this.options.duration;
      var easing = this.options.easing;
      var scrollTarget = (0, _jquery2.default)(target).data('scroll') || target;

      if (scrollTarget === '#') {
        scrollTarget = 'body';
      }

      (0, _jquery2.default)('html, body').animate({
        scrollTop: (0, _jquery2.default)(scrollTarget).offset().top + this.options.offset
      }, duration, easing);

      if (this.options.updateHash) {
        if (history.replaceState) {
          history.replaceState({}, scrollTarget, scrollTarget);
        } else {
          window.location.hash = scrollTarget;
        }
      }
    }
  }, {
    key: 'scrollToContent',
    value: function scrollToContent(target) {
      var _this2 = this;

      setTimeout(function () {
        _this2._scrollToContent(target);
      }, this.options.delay);
    }
  }]);

  return ScrollLink;
}();

exports.default = ScrollLink;