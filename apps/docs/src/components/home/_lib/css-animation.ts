/** Restarts the CSS entrance animation of an element (bfcache replay). */
export function restartCssAnimation(el: HTMLElement, className = 'hero-animate') {
    el.classList.remove(className)
    void el.offsetWidth
    el.classList.add(className)
}
