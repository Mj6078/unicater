export default class Dropdown {
  constructor(el) {
    this.$el = $(el);
    this._bindEvents();
    this.timeoutLeave = null;
    this.delayLeave = 300; // Adjust the delay to a value that works best for you

    // Add event listener for scroll
    $(window).on('scroll', () => {
      this._handleScroll();
    });

    // Apply margin-top initially if user is at the top
    this._handleScroll();
  }

  _bindEvents() {
    // Using mouseenter and mouseleave for better control
    this.$el.on('mouseenter', (event) => this._handleMouseEnter(event));
    this.$el.on('mouseleave', (event) => this._handleMouseLeave(event));

    // Close dropdowns when mouse leaves the navigation container
    $('.navigation-container').on('mouseleave', () => {
      this._hideAllChildren(true);
    });

    // Add event listener for mouseover on root list items
    this.$el.find('.mega-nav-root-item').on('mouseover', (event) => {
      this._handleRootItemMouseOver(event);
    });
  }

  _handleMouseEnter(event) {
    const $dropdown = $(event.currentTarget);
    const $dropdownPanel = $dropdown.find('.dropdown-panel');

    clearTimeout(this.timeoutLeave); // Clear previous leave timeout

    $('.dropdown-open').not($dropdown).removeClass('dropdown-open')
                       .find('.dropdown-panel').revealer('hide');

    // Only apply margin-top when at the top
    if ($(window).scrollTop() === 0) {
      $dropdownPanel.css('margin-top', '-5px');
    }

    $dropdown.addClass('dropdown-open');
    $dropdown.find('.top-level-nav-link').addClass('dropdown-open');
    $dropdownPanel.revealer('show');

    // Reset visibility of all tier 3 categories
    $dropdownPanel.find('.mega-nav-child-list-container').removeClass('visible');

    // Remove any existing hover effect
    $dropdownPanel.find('.mega-nav-root-list .mega-nav-root-item').removeClass('hovered');
    $dropdownPanel.find('.mega-nav-root-list a').removeClass('active');

    // Simulate hover for the first immediate tier 2 category
    const $firstTier2 = $dropdownPanel.find('.mega-nav-root-list .mega-nav-root-item').first();
    if ($firstTier2.length > 0) {
      $firstTier2.addClass('hovered');

      // Apply effect to the <a> element inside elements with the class 'hovered'
      $firstTier2.find('a').addClass('active');

      // Show tier 3 categories belonging to the hovered tier 2 category
      const categoryId = $firstTier2.data('category-id');
      const $childList = $dropdownPanel.find('[data-root-category-id="' + categoryId + '"]');
      if ($childList.length > 0) {
        $childList.closest('.mega-nav-child-list-container').addClass('visible');
      }
    }
  }

  _handleMouseLeave(event) {
    const $dropdown = $(event.currentTarget);
    const $dropdownPanel = $dropdown.find('.dropdown-panel');

    this.timeoutLeave = setTimeout(() => {
      // Check if mouse pointer is not over the dropdown or its panel
      if (!$dropdown.is(':hover') && !$dropdownPanel.is(':hover')) {
        // Close the dropdown
        $dropdown.removeClass('dropdown-open');
        $dropdownPanel.revealer('hide');
        $dropdown.removeClass('active'); // Remove active class when mouse leaves
        $dropdown.find('.top-level-nav-link').removeClass('dropdown-open');
      }
    }, this.delayLeave);
  }

  _handleRootItemMouseOver(event) {
    const $rootItem = $(event.currentTarget);
    const $dropdownPanel = $rootItem.closest('.dropdown-panel');

    // Remove 'hovered' class from all root list items
    $dropdownPanel.find('.mega-nav-root-item').removeClass('hovered');
    // Add 'hovered' class to the current root list item
    $rootItem.addClass('hovered');
    // Show tier 3 categories belonging to the hovered tier 2 category
    const categoryId = $rootItem.data('category-id');
    const $childList = $dropdownPanel.find('[data-root-category-id="' + categoryId + '"]');
    
    // Hide all child containers
    $dropdownPanel.find('.mega-nav-child-list-container').removeClass('visible');
    
    if ($childList.length > 0) {
      $childList.closest('.mega-nav-child-list-container').addClass('visible');
    }
  }

  // Handle scroll event to remove margin-top property when scrolled down more than 50px
  _handleScroll() {
    const $dropdownPanel = this.$el.find('.dropdown-panel');
    if ($(window).scrollTop() > 50) {
      $dropdownPanel.css('margin-top', '');
    } else {
      $dropdownPanel.css('margin-top', '0px');
    }
  }

  _hideAllChildren(removeActive = false) {
    if (removeActive) {
      this.$el.find('[data-mega-nav-root-item]').removeClass('hovered active');
    }
    this.$el.find('.mega-nav-child-list-container').removeClass('visible');
  }
}
