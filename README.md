# ProToSlider
ProToSlider - простой адаптивный слайдер на чистом js
### Демо https://da0ab.github.io/ProToSlider/




Простая разметка
```HTML
<div class="ProToSlider two">
    <ul class="slide-list">
       <li>Когда Чак Норрис наступает на Lego, Lego плачет.</li>
       <li>Чак Норрис может делить на ноль.</li>
    </ul>
</div>
```

Простая конфигурация с указанием параметров для различных разрешений
```HTML
'.two': {
    autoplay: false,
    loop: true,
    arrows: true,
    paginator: true,
    count: 2,
    gap: 10,
    breakpoints: {
        '1024': {
            count: 2,
        },
        '640': {
            count: 1,
            arrows: false,
        },
        '480': {
            count: 1,
            arrows: false,
        },
    }
},
};
```
