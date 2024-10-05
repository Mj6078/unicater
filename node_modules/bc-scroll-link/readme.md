# Bigcommerce Scroll Link Module

Scroll to the top or any ID / class

### Installation

```
npm i --save github:pixelunion/bc-scroll-link
```

### Usage

```
import $ from 'jquery';
import ScrollLink from 'bc-scroll-link';

new ScrollLink({
  duration: 1000,
  easing: 'swing'
});
```

### Options


`duration`: 
the scroll duration in milliseconds.

`easing`: 
easing (only 'swing' and 'linear' available by default).

`delay`: delay before scrolling.

`updateHash`: (defaults to `true`) add the target to the URL? Set to `false` if targeting classes instead of IDs.

### Methods
`scrollToContent(target)`: Scroll to a target without using an anchor / button.

### Some sample markup

```
<button data-scroll="#">Top</button>

<button data-scroll="#some-section">Jump to: Some Section</button>
```
