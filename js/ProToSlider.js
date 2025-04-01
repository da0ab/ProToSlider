document.addEventListener('DOMContentLoaded', () => {
    const config = window.SliderConfig || {};
    class SliderManager {
        constructor(slider) {
            this.slider = slider;
            this.isDragging = false;
            this.mouseDownX = 0;
            this.currentIndex = 0;
            this.currentScreen = 0;
            this.autoplayInterval = null;
            this.isReversed = false;
            this.init();
        }
        init() {
            this.applySettings();
            this.setupEventListeners();
            this.moveScreen(0);
            this.createArrows();
            this.startAutoplayIfEnabled();
        }
        applySettings() {
            const settings = getSliderSettings(config, this.slider);
            this.slider.settings = settings;
            this.countSlides = settings.count ?? 1;
            this.gap = settings.gap ?? 0;
            this.autoplayEnabled = settings.autoplay ?? false; 
            this.autoplaySpeed = settings.speed ?? 3000; 
            this.paginatorEnabled = settings.paginator ?? false;
            this.slider.style.setProperty('--count-sl', this.countSlides);
            this.slider.style.setProperty('--gap-sl', `${this.gap}px`);
            this.slider.style.setProperty('--speed-sl', `${settings.animSpeed || 500}ms`);
        }
        setupEventListeners() {
            const slideList = this.slider.querySelector('.slide-list');
            slideList.addEventListener('mousedown', this.handleMouseDown.bind(this));
            document.addEventListener('mousemove', this.handleMouseMove.bind(this));
            document.addEventListener('mouseup', this.handleMouseUp.bind(this));
            slideList.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            slideList.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            slideList.addEventListener('touchend', this.handleTouchEnd.bind(this));
        }
        startAutoplayIfEnabled() {
            if (this.autoplayEnabled) {
                this.startAutoplay();
            }
        }
        startAutoplay() {
            this.stopAutoplay();
            this.autoplayInterval = setInterval(() => {
                this.autoplayNext();
            }, this.autoplaySpeed);
        }
        autoplayNext() {
            const slides = this.slider.querySelectorAll('.slide-list li');
            const screenCount = Math.ceil(slides.length / this.countSlides);
            if (screenCount <= 1) return;
            if (!this.isReversed) {
                if (this.currentScreen < screenCount - 1) {
                    this.moveScreen(1);
                } else {
                    this.isReversed = true;
                    this.moveScreen(-1);
                }
            } else {
                if (this.currentScreen > 0) {
                    this.moveScreen(-1);
                } else {
                    this.isReversed = false;
                    this.moveScreen(1);
                }
            }
        }
        handleMouseDown(e) {
            if (e.button !== 0) return;
            this.mouseDownX = e.clientX;
            this.isDragging = true;
            this.slider.querySelector('.slide-list').style.transition = 'none';
            this.slider.querySelector('.slide-list').style.cursor = 'grabbing';
            this.stopAutoplay();
            e.preventDefault();
        }
        handleMouseMove(e) {
            if (!this.isDragging) return;
            this.dragSlide(e.clientX - this.mouseDownX);
        }
        handleMouseUp(e) {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.releaseSlide(e.clientX - this.mouseDownX);
        }
        handleTouchStart(e) {
            this.touchStartX = e.touches[0].clientX;
            this.isDragging = true;
            this.slider.querySelector('.slide-list').style.transition = 'none';
            this.stopAutoplay();
        }
        handleTouchMove(e) {
            if (!this.isDragging) return;
            const diffX = e.touches[0].clientX - this.touchStartX;
            const diffY = e.touches[0].clientY - this.touchStartY;
            if (Math.abs(diffX) > Math.abs(diffY)) {
                e.preventDefault();
                this.dragSlide(diffX);
            }
        }
        handleTouchEnd(e) {
            if (!this.isDragging) return;
            this.isDragging = false;
            const diff = e.changedTouches[0].clientX - this.touchStartX;
            this.releaseSlide(diff);
        }
        dragSlide(diff) {
            const slideList = this.slider.querySelector('.slide-list');
            const offset = -this.currentIndex * (slideList.children[0].offsetWidth + this.gap) + diff;
            slideList.style.transform = `translateX(${offset}px)`;
        }
        releaseSlide(diff) {
            const threshold = 50;
            this.slider.querySelector('.slide-list').style.transition = `transform var(--speed-sl, 0.5s) ease`;
            this.slider.querySelector('.slide-list').style.cursor = '';
            if (Math.abs(diff) > threshold) {
                this.moveScreen(diff > 0 ? -1 : 1);
            } else {
                this.moveScreen(0);
            }
        }
        moveScreen(direction) {
            this.applySettings();
            const slides = this.slider.querySelectorAll('.slide-list li');
            const totalSlides = slides.length;
            if (this.currentScreen === undefined) this.currentScreen = 0;
            const newScreen = this.currentScreen + direction;
            const maxScreen = Math.ceil(totalSlides / this.countSlides) - 1;
            this.currentScreen = Math.max(0, Math.min(newScreen, maxScreen));
            this.currentIndex = Math.min(this.currentScreen * this.countSlides, totalSlides - this.countSlides);
            const slideWidth = slides[0].offsetWidth;
            const offset = -this.currentIndex * (slideWidth + this.gap);
            this.slider.querySelector('.slide-list').style.transform = `translateX(${offset}px)`;
            this.updateArrowsState();
            if (this.paginatorEnabled) {
                this.createPaginator();
            }
        }
        createPaginator() {
            const slides = this.slider.querySelectorAll('.slide-list li');
            const screenCount = Math.ceil(slides.length / this.countSlides);
            if (slides.length <= this.countSlides) return;
            let paginator = this.slider.querySelector('.slide-paginator');
            if (paginator) paginator.remove();
            paginator = document.createElement('ul');
            paginator.classList.add('slide-paginator');
            for (let i = 0; i < screenCount; i++) {
                const bullet = document.createElement('li');
                bullet.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    this.stopAutoplay(); 
                    this.moveScreen(i - this.currentScreen);
                });
                bullet.classList.toggle('active', i === this.currentScreen);
                paginator.appendChild(bullet);
            }
            this.slider.appendChild(paginator);
        }
        createArrows() {
            const slides = this.slider.querySelectorAll('.slide-list li');
            const totalSlides = slides.length;
            if (totalSlides <= this.countSlides) {
                const existingArrows = this.slider.querySelector('.slide-arrows');
                if (existingArrows) existingArrows.remove();
                return;
            }
            let arrows = this.slider.querySelector('.slide-arrows');
            if (!arrows) {
                arrows = document.createElement('div');
                arrows.classList.add('slide-arrows');
                const prev = document.createElement('div');
                const next = document.createElement('div');
                prev.classList.add('arrow-prev');
                next.classList.add('arrow-next');
                arrows.appendChild(prev);
                arrows.appendChild(next);
                this.slider.appendChild(arrows);
                const handleArrowClick = (e, direction) => {
                    e.stopPropagation(); 
                    this.stopAutoplay(); 
                    this.moveScreen(direction);
                };
                prev.addEventListener('click', (e) => handleArrowClick(e, -1));
                next.addEventListener('click', (e) => handleArrowClick(e, 1));
            }
            this.updateArrowsState();
        }
        stopAutoplay() {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
        updateArrowsState() {
            const slides = this.slider.querySelectorAll('.slide-list li');
            const totalSlides = slides.length;
            const maxScreen = Math.ceil(totalSlides / this.countSlides) - 1;
            const prevArrow = this.slider.querySelector('.arrow-prev');
            const nextArrow = this.slider.querySelector('.arrow-next');
            if (prevArrow) {
                prevArrow.classList.toggle('deactive', this.currentScreen === 0);
            }
            if (nextArrow) {
                nextArrow.classList.toggle('deactive', this.currentScreen >= maxScreen);
            }
        }
        stopAutoplay() {
            if (this.autoplayInterval) {
                clearInterval(this.autoplayInterval);
                this.autoplayInterval = null;
            }
        }
    }
    function getSliderSettings(config, slider) {
        const sliderClassSelectors = slider.className.split(' ').map(c => '.' + c);
        let sliderConfig = null;
        for (const selector of sliderClassSelectors) {
            if (config[selector]) {
                sliderConfig = config[selector];
                break;
            }
        }
        if (!sliderConfig) return {};
        const baseSettings = { ...sliderConfig };
        delete baseSettings.breakpoints;
        const breakpoints = sliderConfig.breakpoints || {};
        const width = window.innerWidth;
        let matchedSettings = {};
        Object.keys(breakpoints).map(Number).sort((a, b) => b - a).forEach(bp => {
            if (width <= bp) {
                matchedSettings = { ...matchedSettings, ...breakpoints[bp] };
            }
        });
        return { ...baseSettings, ...matchedSettings };
    }
    document.querySelectorAll('.ProToSlider').forEach(slider => {
        new SliderManager(slider);
    });
    window.addEventListener('resize', () => {
        document.querySelectorAll('.ProToSlider').forEach(slider => {
            if (slider.sliderManager) {
                slider.sliderManager.applySettings();
                slider.sliderManager.moveScreen(0);
                if (slider.sliderManager.autoplayEnabled) { 
                    slider.sliderManager.startAutoplay();
                }
            }
        });
    });
});
