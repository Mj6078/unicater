import _ from 'lodash';
import utils from '@bigcommerce/stencil-utils';
import Alert from '../components/Alert';
import FormValidator from '../utils/FormValidator';
import ProgressButton from '../utils/ProgressButton';
import resetProductImages from './resetProductImages';
import AttributesHelper from './AttributesHelper';

export default class ProductUtils {
  constructor(el, options) {
    this.$el = $(el);
    this.options = $.extend({
      onImageSwitch: () => {},
    }, options);
    this.productId = this.$el.find('[data-product-id]').val();

    this.pageAlerts = new Alert($('[data-alerts]'));
    this.productAlerts = new Alert($('[data-product-alerts]'));
    this.productTitle = $(el).data('product-title');
    this.$productContainer = $('[data-product-container]');
    this.productAttributesData = window.BCData.product_attributes;
    this.$form = this.$el.find('form[data-cart-item-add]');
    this.$addToCart = this.$form.find('[data-button-purchase]');

    this.attributesHelper = new AttributesHelper(el);
    this.progressButton = new ProgressButton();

    this.callbacks = $.extend({
      willUpdate: () => console.log('Update requested.'),
      didUpdate: () => console.log('Update executed.'),
      switchImage: (url) => console.log(`Image switch attempted for ${url}`),
    }, options.callbacks);

    this._boundProductOptionChange = this._bindProductOptionChange.bind(this);
    this.boundCartCallback = this._bindAddToCart.bind(this);
    this._bindEvents();
  }

  _bindEvents() {
    this.$el.find('.product-quantity-toggle').on('click', (event) => {
      this._updateQuantity(event);
    });

    this.$el.find('.product-quantity').on('focusout', (event) => {
      this._checkQuantity(event.currentTarget);
    });
  }

  init(context) {
    this.context = context;
    const $productOptionsElement = $('[data-product-option-change]', this.$form);
    const hasOptions = $productOptionsElement.length > 0 ? true : false;
    const hasDefaultOptions = $productOptionsElement.find('[data-default]').length;
    if (hasDefaultOptions || (_.isEmpty(this.productAttributesData) && hasOptions)) {
      const $productId = $('[name="product_id"]', this.$form).val();
      utils.api.productAttributes.optionChange($productId, this.$form.serialize(), 'products/add-to-cart-form', (err, response) => {
        const attributesData = response.data || {};
        const attributesContent = response.content || {};
        this.attributesHelper.updateAttributes(attributesData);

        if (hasDefaultOptions) {
          this._updateView(attributesData);
        }
      });
    } else {
      this.attributesHelper.updateAttributes(this.productAttributesData);
    }

    utils.hooks.on('product-option-change', this._boundProductOptionChange);
    this._bindAddWishlist();

    this.Validator = new FormValidator(this.context);
    this.Validator.initSingle(this.$el.find('form[data-cart-item-add]'));

    utils.hooks.on('cart-item-add', this.boundCartCallback);

    // Trigger a change event so the values are correct for pre-selected options
    this.$el.find('[data-cart-item-add]').find('input[type="radio"], input[type="checkbox"], select').first().change();
  }

  /**
   *
   * Cleanup - useful for closing quickshop modals
   *
   */
   destroy() {
     utils.hooks.off('cart-item-add', this.boundCartCallback);
     utils.hooks.off('product-option-change', this._boundProductOptionChange);
   }

  /**
   * Cache an object of jQuery elements for DOM updating
   * @param  jQuery $el - a wrapping element of the scoped product
   * @return {object} - buncha jQuery elements which may or may not exist on the page
   */
  _getViewModel($el) {
    return {
      $price: $('[data-product-price-wrapper="without-tax"]', $el),
      $priceWithTax: $('[data-product-price-wrapper="with-tax"]', $el),
      $saved: $('[data-product-price-saved]', $el),
      $sku: $('[data-product-sku]', $el),
      $weight: $('[data-product-weight]', $el),
      $addToCart: $('[data-button-purchase]', $el),
      $imagePreview: $('[data-variation-preview]', $el),
      stock: {
        $selector: $('[data-product-stock]', $el),
        $level: $('[data-product-stock-level]', $el),
      },
    };
  }

  /**
  * https://stackoverflow.com/questions/49672992/ajax-request-fails-when-sending-formdata-including-empty-file-input-in-safari
  * Safari browser with jquery 3.3.1 has an issue uploading empty file parameters. This function removes any empty files from the form params
  * @param formData: FormData object
  * @returns FormData object
  */
  filterEmptyFilesFromForm(formData) {
    try {
      for (const [key, val] of formData) {
        if (val instanceof File && !val.name && !val.size) {
          formData.delete(key);
        }
      }
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
    }
    return formData;
  }

  /**
   * Bind product options changes.
   */
  _bindProductOptionChange({ target }, changedOption) {
    const formProductId = target.closest('[data-product-id]').dataset.productId;
    if (formProductId !== this.productId) {
      return;
    }

    const $changedOption = $(changedOption);
    const $form = $changedOption.parents('form');

    // Do not trigger an ajax request if it's a file or if the browser doesn't support FormData
    if ($changedOption.attr('type') === 'file' || window.FormData === undefined) {
      return;
    }

    this.pageAlerts.clear();
    this.productAlerts.clear();

    utils.api.productAttributes.optionChange(this.productId, $form.serialize(), 'products/add-to-cart-form', (err, response) => {
      const productAttributesData = response.data || {};
      const productAttributesContent = response.content || {};

      // If our form data doesn't include the product-options-count with a positive value, return
      if (this.$el.find('[data-product-options-count]').val < 1) {
        return;
      }

      this.attributesHelper.updateAttributes(productAttributesData);
      this._updateView(productAttributesData);
      this.setProductVariant();
    });
  }

  _updateView(data) {
    const viewModel = this._getViewModel(this.$el);

    // updating price
    if (viewModel.$price.length) {
      const priceStrings = {
        price: data.price,
        excludingTax: this.context.productExcludingTax,
        salePriceLabel: this.context.salePriceLabel,
        nonSalePriceLabel: this.context.nonSalePriceLabel,
        retailPriceLabel: this.context.retailPriceLabel,
        priceLabel: this.context.priceLabel,
      };
      viewModel.$price.html(this.options.priceWithoutTaxTemplate(priceStrings));
    }

    if (viewModel.$priceWithTax.length) {
      const priceStrings = {
        price: data.price,
        includingTax: this.context.productIncludingTax,
        salePriceLabel: this.context.salePriceLabel,
        nonSalePriceLabel: this.context.nonSalePriceLabel,
        retailPriceLabel: this.context.retailPriceLabel,
        priceLabel: this.context.priceLabel,
      };
      viewModel.$priceWithTax.html(this.options.priceWithTaxTemplate(priceStrings));
    }

    if (viewModel.$saved.length) {
      const priceStrings = {
        price: data.price,
        savedString: this.context.productYouSave,
      };
      viewModel.$saved.html(this.options.priceSavedTemplate(priceStrings));
    }

    // if stock view is on (CP settings)
    if (viewModel.stock.$selector.length && data.stock !== null) {
      viewModel.stock.$selector.removeClass('product-details-hidden');
      viewModel.stock.$level.text(data.stock);
    } else {
      viewModel.stock.$selector.addClass('product-details-hidden');
    }

    // update sku if exists
    if (viewModel.$sku.length) {
      viewModel.$sku.html(data.sku);
    }

    // update weight if exists
    if (data.weight && viewModel.$weight.length) {
      viewModel.$weight.html(data.weight.formatted);
    }

    // handle product variant image if exists
    if (data.image) {
      const productImageUrl = utils.tools.image.getSrc(
        data.image.data,
        this.context.themeImageSizes.zoom
      );
      const zoomImageUrl = utils.tools.image.getSrc(
        data.image.data,
        this.context.themeImageSizes.product
      );

      // to maintain a reference between option images, pull out the
      // filename from the image URL and use it as an ID
      const imageId = data.image.data.replace(/^.*[\\\/]/, '');

      this.callbacks.switchImage(productImageUrl, zoomImageUrl, data.image.alt, imageId);
    } else if (this.$el.find('[data-product-image-variant]').length) {
      resetProductImages(this.$el.find('.product-slides-wrap'));
    }

    // update submit button state
    if (!data.purchasable || !data.instock) {
      const {
        out_of_stock_message,
        stock_message,
        purchasing_message,
      } = data;

      if ($('.modal-quick-shop').length) {
        this.productAlerts.error(out_of_stock_message || stock_message || purchasing_message, true);
      } else {
        setTimeout(() => {
          this.pageAlerts.error(out_of_stock_message || stock_message || purchasing_message, true);
        }, 50);
      }

      viewModel.$addToCart
        .addClass(this.buttonDisabledClass)
        .prop('disabled', true)
        .children('.button-text')
        .text(this.context.soldOutButtonLabel);
    } else {
      viewModel.$addToCart
        .removeClass(this.buttonDisabledClass)
        .prop('disabled', false)
        .children('.button-text')
        .text(this.context.addToCartButtonLabel);
    }
  }

  _updateQuantity(event) {
    const $target = $(event.currentTarget);
    const $quantity = $target.closest('.product-quantity-container').find('.product-quantity');
    const min = parseInt($quantity.prop('min'), 10);
    const max = parseInt($quantity.prop('max'), 10);
    let newQuantity = parseInt($quantity.val(), 10);

    if (isNaN(newQuantity)) {
      newQuantity = min;
    }

    if ($target.hasClass('product-quantity-increment') && (!max || newQuantity < max)) {
      newQuantity = newQuantity + 1;
    } else if ($target.hasClass('product-quantity-decrement') && newQuantity > min) {
      newQuantity = newQuantity - 1;
    }

    $quantity.val(newQuantity);
  }

  /**
   * Add to cart
   */
  _bindAddToCart(event, form) {
    event.preventDefault();

    // Skip this callback if the product isn't the one this instance is tracking
    const formProductId = event.target.querySelector('[name=product_id]').value;
    if (formProductId !== this.productId) return;

    // Bail out if browser doesn't support FormData
    if (window.FormData === undefined) {
      return;
    }

    const quantity = this.$el.find('input.product-quantity').val();
    const formData = new FormData(form);

    // Update the button state
    this.progressButton.progress(this.$addToCart);

    // Remove old alerts
    this.pageAlerts.clear();
    this.productAlerts.clear();

    // Ajax add item to cart
    utils.api.cart.itemAdd(this.filterEmptyFilesFromForm(formData), (err, response) => {
      // Parse the ajax response so we can pass it to the message.
      response = this._parseResponse(err, response, this.productTitle, quantity);

      if (response.status === 'success') {
        setTimeout(() => {
          this.pageAlerts.message(response.message, response.status, true);
        }, 50);

        // Custom success event to close the quick shop and open the mini cart
        $.event.trigger('cart-item-add-success');

        setTimeout(() => {
          this.pageAlerts.clear();
        }, 5000);
      } else {
        this.productAlerts.message(response.message, response.status, true);
      }

      // Reset the button state
      this.progressButton.complete(this.$addToCart);
    });
  }

  /**
   * Build our error/success messages based on response.
   * @param {object} err - the (potential) returned error object.
   * @param {object} response - the ajax response from the add-to-cart action.
   * @param {string} title - The name of the added product.
   * @param {number} quantity - The added quantity.
   */
  _parseResponse(err, response, title, quantity) {
    let message = '';
    let status = '';

    if (err || response.data.error) {
      status = 'error';

      if (response.data.error) {
        message = response.data.error;
      } else {
        message = this.context.messagesProductGeneral;
      }

    } else {
      status = 'success';
      if (this.$productContainer.hasClass('bag-icon')) {
        message = this.context.messagesProductAddSuccessBag;
        message = message
                   .replace('*product*', `"${title}"`)
                   .replace('*bag_link*', `<a href=${this.context.urlsCart}>${this.context.bagLink}</a>`)
                   .replace('*checkout_link*', `<a href=${this.context.urlsCheckout}>${this.context.checkoutLink}</a>`);
      } else {
        message = this.context.messagesProductAddSuccessCart;
        message = message
                   .replace('*product*', `"${title}"`)
                   .replace('*cart_link*', `<a href=${this.context.urlsCart}>${this.context.cartLink}</a>`)
                   .replace('*checkout_link*', `<a href=${this.context.urlsCheckout}>${this.context.checkoutLink}</a>`);
      }
    }

    return {
      status: status,
      message: message
    }
  }

  _checkQuantity(el) {
    const $el = $(el);
    const quantity = parseInt($el.val(), 10);
    const min = parseInt($el.prop('min'))

    if (isNaN(quantity) || quantity < min) {
      $el.val(min);
    }
  }

  /**
   * Ajax add to wishlist
   *
   */
  _bindAddWishlist() {
    $('[data-wishlist]').on('click', (event) => {
      const $button = $(event.currentTarget);
      const addUrl = $button.attr('href');
      const viewUrl = $button.data('wishlist');

      if ($('[data-is-customer]').length) {
        event.preventDefault();

        this.progressButton.progress($button);

        $.ajax({
          type: 'POST',
          url: addUrl,
          success: () => {
            this.productAlerts.success(this.context.messagesWishlistAddSuccess.replace('*product*', this.productTitle).replace('*url*', viewUrl), true);
          },
          error: () => {
            this.productAlerts.error(this.context.messagesWishlistAddError.replace('*product*', this.productTitle), true);
          },
          complete: () => {
            this.progressButton.complete($button);

            $button
              .closest('[data-wishlist-dropdown]')
              .find('[data-wishlist-toggle]')
              .trigger('click');
          },
        });
      }
    });
  }

  setProductVariant() {
    const unsatisfiedRequiredFields = [];
    const options = [];

    $.each($('[data-product-attribute]'), (index, value) => {
      const optionLabel = value.children[0].innerText;
      const optionTitle = optionLabel.split(':')[0].trim();
      const required = optionLabel.toLowerCase().includes('required');
      const type = value.getAttribute('data-product-attribute');

      if (
        (type === 'input-file' || type === 'input-text' || type === 'input-number')
        && value.querySelector('input').value === '' && required
      ) {
        unsatisfiedRequiredFields.push(value);
      }

      if (type === 'textarea' && value.querySelector('textarea').value === '' && required) {
        unsatisfiedRequiredFields.push(value);
      }

      if (type === 'date') {
        const isSatisfied = Array.from(value.querySelectorAll('select')).every((select) => select.selectedIndex !== 0);

        if (isSatisfied) {
          const dateString = Array.from(value.querySelectorAll('select')).map((x) => x.value).join('-');
          options.push(`${optionTitle}:${dateString}`);
          return;
        }

        if (required) {
            unsatisfiedRequiredFields.push(value);
        }
      }

      if (type === 'set-select') {
        const select = value.querySelector('select');
        const selectedIndex = select.selectedIndex;

        if (selectedIndex !== 0) {
          options.push(`${optionTitle}:${select.options[selectedIndex].innerText}`);
          return;
        }

        if (required) {
          unsatisfiedRequiredFields.push(value);
        }
      }

      if (
        type === 'set-rectangle'
        || type === 'set-radio'
        || type === 'swatch'
        || type === 'input-checkbox'
        || type === 'product-list'
      ) {
        const checked = value.querySelector(':checked');
        if (checked) {
          if (type === 'set-rectangle' || type === 'set-radio' || type === 'product-list') {
            const label = checked.labels[0].innerText;

            if (label) {
              options.push(`${optionTitle}:${label}`);
            }
          }

          if (type === 'swatch') {
            const label = checked.labels[0].children[0];

            if (label) {
              options.push(`${optionTitle}:${label.title}`);
            }
          }

          if (type === 'input-checkbox') {
            options.push(`${optionTitle}:Yes`);
          }

          return;
        }

        if (type === 'input-checkbox') {
          options.push(`${optionTitle}:No`);
        }

        if (required) {
            unsatisfiedRequiredFields.push(value);
        }
      }
    });

    let productVariant = unsatisfiedRequiredFields.length === 0 ? options.sort().join(', ') : 'unsatisfied';
    const view = $('.product-details');

    if (productVariant) {
      productVariant = productVariant === 'unsatisfied' ? '' : productVariant;

      if (view.attr('data-event-type')) {
        view.attr('data-product-variant', productVariant);
      } else {
        const productName = view.find('.product-title')[0].innerText;
        const card = $(`[data-name="${productName}"]`);
        card.attr('data-product-variant', productVariant);
      }
    }
  }
}
