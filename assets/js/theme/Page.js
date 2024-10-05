import PageManager from '../PageManager';

export default class Page extends PageManager {
    constructor() {
        super();
        this.createWrapperForTable();
    }

    createWrapperForTable() {
        $('table', '.page-content').each((index, table) => {
            const $parent = $(table).parent();
            const $prevSibling = $(table).prev();

            const $div = $('<div/>')
                .addClass('horizontal-scrollbar')
                .append(table);

            if ($prevSibling.length) {
                $div.insertAfter($prevSibling);
            } else {
                $parent.prepend($div);
            }
        });
    }
}
