import _ from 'lodash';
import utils from '@bigcommerce/stencil-utils';

class QuickSearch {
    constructor() {
        this.debounceWaitTime = 300; // Adjust debounce time as needed
        this.$quickSearchResults = $('.quickSearchResults');
        this.$quickSearchForms = $('[data-quick-search-form]');
        this.$searchQuery = this.$quickSearchForms.find('[data-search-quick]');
        this.$quickSearchAriaMessage = $('.aria-description--hidden');
        this.searchResultsVisible = false; // Track if search results are visible

        this._bindEvents();
    }

    _bindEvents() {
        const doSearch = _.debounce((searchQuery) => {
            if (searchQuery.length === 0) {
                this.$quickSearchResults.empty();
                this.$quickSearchAriaMessage.empty(); // Clear aria-live region
                this.searchResultsVisible = false;
                return;
            }

            utils.api.search.search(searchQuery, { template: 'search/quick-results' }, (err, response) => {
                if (err) {
                    return false;
                }

                this.$quickSearchResults.html(response);
                const $quickSearchResultsCurrent = this.$quickSearchResults.filter(':visible');

                const $noResultsMessage = $quickSearchResultsCurrent.find('.quickSearchMessage');
                if ($noResultsMessage.length) {
                    $noResultsMessage.attr({
                        role: 'status',
                        'aria-live': 'polite',
                    });
                    this.$quickSearchAriaMessage.empty(); // Clear aria-live region
                } else {
                    this.$quickSearchAriaMessage.addClass('u-hidden');

                    const predefinedText = this.$quickSearchAriaMessage.data('search-aria-message-predefined-text');
                    const itemsFoundCount = $quickSearchResultsCurrent.find('.product').length;

                    this.$quickSearchAriaMessage.text(`${itemsFoundCount} ${predefinedText} ${searchQuery}`);

                    setTimeout(() => {
                        this.$quickSearchAriaMessage.removeClass('u-hidden');
                    }, 100);
                }
                this.searchResultsVisible = true; // Mark search results as visible
            });
        }, this.debounceWaitTime);

        this.$searchQuery.on('input', (event) => {
            const searchQuery = $(event.currentTarget).val();
            if (searchQuery.length === 0) {
                this.$quickSearchResults.empty(); // Hide results if input is cleared
                this.$quickSearchAriaMessage.empty(); // Clear aria-live region
                this.searchResultsVisible = false;
            }
            $(event.currentTarget).trigger('search-quick', event.currentTarget);
        });

        utils.hooks.on('search-quick', (event, currentTarget) => {
            const searchQuery = $(currentTarget).val();
            doSearch(searchQuery);
        });

        // Hide search results when clicking outside
        $(document).on('click', (event) => {
            if (!$(event.target).closest(this.$quickSearchForms).length) {
                this.$quickSearchResults.empty(); // Hide results
                this.searchResultsVisible = false;
            }
        });

        // Show search results when focusing on the search bar
        this.$searchQuery.on('focus', (event) => {
            if (this.searchResultsVisible && this.$searchQuery.val().length > 0) {
                const searchQuery = this.$searchQuery.val();
                doSearch(searchQuery); // Re-fetch the results
            }
        });
    }
}

export default QuickSearch;
