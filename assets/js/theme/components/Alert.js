import _ from 'lodash';

export default class Alert {
  constructor($el, options = {}) {

    this.$el = $el;
    this.options = $.extend({
      classes: {
        base: 'alert',
        error: 'alert-error',
        info: 'alert-info',
        success: 'alert-success',
      },
      limit: 1,
      template: {},
      callbacks: {},
    }, options);

    this.callbacks = $.extend({
      willUpdate: () => {},
      didUpdate: () => {},
    }, options.callbacks);

    this._bindEvents();
  }

  _bindEvents() {
    if (_.isEmpty(this.options.template)) {
      this.options.template = _.template(`
        <div class='${this.options.classes.base} <%= messageType %>'>
          <% if (isDismissable) { %>
            <a class="alert-dismiss">&times;</a>
          <% } %>
          <div class="alert-message">
            <%= messageText %>
          </div>
        </div>
      `);
    }

    this.$el.on('click', '.alert-dismiss', (event) => {
      event.preventDefault();
      const $alert = $(event.currentTarget).parent('.alert');
      this._dismissMessage($alert);
    });

    this.$el.on('clear-messages', () => {
      this.clear();
    });
  }

  /**
   * This method can be used to reset the contents of this.$el
   */
  clear() {
    this.$el.find(`.${this.options.classes.base}`).each((index, target) => {
      this._dismissMessage($(target));
    });
  }

  /**
   * If bc-core becomes integrated into bc-skeleton, this method should delegate to `dismissable()`
   * @param $alert
   * @private
   */
  _dismissMessage($alert) {
    $alert.addClass('dismissed');
    $alert.one('trend', () => {
      $alert.remove();
    });
  }

  /**
   * Explicit usage to create an error alert
   * @param text
   * @param dismissable
   */
  error(text, dismissable = false){
    this.message(text, 'error', dismissable);
  }

  /**
   * Explicit usage to create a success alert
   * @param text
   * @param dismissable
   */
  success(text, dismissable = false){
    this.message(text, 'success', dismissable);
  }

  /**
   * Explicit usage to create an informational alert
   * @param text
   * @param dismissable
   */
  info(text, dismissable = false){
    this.message(text, 'info', dismissable);
  }

  /**
   *
   * @param text
   * @param type
   * @param dismissable
   */
  message(text, type = 'info', dismissable = false) {
    this.callbacks.willUpdate();

    if (typeof this.options.limit === 'number' && this.$el.find(`.${this.options.classes.base}`).length > this.options.limit) {
      this._dismissMessage(this.$el.find(`.${this.options.classes.base}:not(.dismissed)`).eq(0));
    }

    const message = {
      messageType: this.options.classes[type],
      messageText: text,
      isDismissable: dismissable,
    };
    
    const $modalBody = $('.modal-body');

    const appendMessage = ($el) => {
      $el.append(this.options.template(message));
    }

    if ($modalBody.length) {
      const productAlerts = $modalBody.find('[data-product-alerts]');
      appendMessage(productAlerts);
    } else {
      const alerts = $('.site-header').find('[data-alerts]');
      appendMessage(alerts);
    };

    this.callbacks.didUpdate();
  }
}
