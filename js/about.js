// 새로고침 시 이전 스크롤 위치 복원 방지
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

const navEntry = performance.getEntriesByType('navigation')[0];

if (navEntry?.type === 'reload') {
    window.scrollTo(0, 0);

    window.addEventListener('pageshow', () => {
        window.scrollTo(0, 0);
    });
}
/* HOME 버튼 — 페이지 맨 아래에서만 표시 */
(() => {
    const menu = document.querySelector('.pulse-quick-nav');
    if (!menu) return;

    function checkBottom() {
        const visible =
            window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight - 5;

        menu.classList.toggle('visible', visible);
    }

    window.addEventListener('scroll', checkBottom, { passive: true });
    window.addEventListener('resize', checkBottom);
    window.addEventListener('pageshow', checkBottom);

    checkBottom();
})();


/* V8 time-based transition: 3400 ms, smoothstep, 33x, curtain fade .78–1. */
(() => {
    const $ = id => document.getElementById(id);
    const stage = $('stage'), photo = $('photo'), word = $('word'), cover = $('cover'), movie = $('movie'), caption = $('caption');
    const fading = [$('copy'), $('header'), $('heart')];
    let state = 'idle', count = 0, lastWheel = -Infinity, startTime = 0, progress = 0, touchY = 0;
    let origin = { x: 0, y: 0, font: 32 };
    const duration = 3400, clamp = v => Math.min(1, Math.max(0, v)), ease = t => t * t * (3 - 2 * t);
    function setState(value) { state = value; stage.dataset.state = value; }
    function measure() { const s = stage.getBoundingClientRect(), r = word.getBoundingClientRect(); origin = { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2, font: parseFloat(getComputedStyle(word).fontSize) }; cover.setAttribute('viewBox', `0 0 ${stage.clientWidth} ${stage.clientHeight}`); $('maskBase').setAttribute('width', stage.clientWidth); $('maskBase').setAttribute('height', stage.clientHeight); }
    function paint(p) { progress = p; const w = stage.clientWidth, h = stage.clientHeight, e = ease(p); $('maskWord').setAttribute('x', origin.x + (w / 2 - origin.x) * e); $('maskWord').setAttribute('y', origin.y + (h / 2 - origin.y) * e); $('maskWord').setAttribute('font-size', origin.font * (1 + e * 32)); cover.style.opacity = String(1 - clamp((p - .78) / .22)); caption.style.opacity = String(clamp((p - .90) / .10)); }
    function tick(now) { const t = clamp((now - startTime) / duration); paint(state === 'forward' ? t : 1 - t); if (t < 1) { requestAnimationFrame(tick); return; } if (state === 'forward') { setState('done'); cover.style.opacity = '0'; caption.style.opacity = '1'; caption.setAttribute('aria-hidden', 'false'); } else { setState('idle'); movie.style.opacity = '0'; cover.style.opacity = '0'; caption.style.opacity = '0'; word.style.visibility = 'visible'; fading.forEach(el => { el.style.opacity = '1'; el.inert = false; }); count = 0; lastWheel = -Infinity; } }
    function start() { if (state !== 'idle') return; measure(); setState('forward'); movie.style.opacity = '1'; movie.play().catch(() => { }); paint(0); word.style.visibility = 'hidden'; fading.forEach(el => { el.style.transition = 'opacity .28s ease'; el.style.opacity = '0'; el.inert = true; }); photo.style.opacity = '0'; startTime = performance.now(); requestAnimationFrame(tick); }
    function reverse() { if (state !== 'done') return; measure(); setState('reverse'); caption.setAttribute('aria-hidden', 'true'); startTime = performance.now(); requestAnimationFrame(tick); }
    function atTop() { return stage.getBoundingClientRect().top >= -1; }
    function handleDirection(delta, event, discrete = false) { if (!atTop()) return; if (state === 'forward' || state === 'reverse') { event.preventDefault(); return; } if (state === 'idle' && delta > 0) { event.preventDefault(); const now = performance.now(); if (discrete || now - lastWheel > 220) { lastWheel = now; if (++count >= 2) start(); } } else if (state === 'done' && delta < 0) { event.preventDefault(); reverse(); } }
    window.addEventListener('wheel', e => handleDirection(e.deltaY, e), { passive: false });
    window.addEventListener('keydown', e => { if (e.target.closest('a,button,input,textarea,select,[contenteditable]')) return; const down = ['ArrowDown', 'PageDown', ' '].includes(e.key) && !e.shiftKey, up = ['ArrowUp', 'PageUp', 'Home'].includes(e.key) || (e.key === ' ' && e.shiftKey); if (down || up) handleDirection(down ? 1 : -1, e, true); });
    stage.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchmove', e => { if (atTop() && (state !== 'done' || e.touches[0].clientY > touchY)) e.preventDefault(); }, { passive: false });
    stage.addEventListener('touchend', e => { const d = touchY - e.changedTouches[0].clientY; if (Math.abs(d) > 35) handleDirection(d, e, true); }, { passive: false });
    stage.addEventListener('pointermove', e => { if (state !== 'idle' || e.pointerType === 'touch') return; const r = stage.getBoundingClientRect(); photo.style.setProperty('--mx', `${e.clientX - r.left}px`); photo.style.setProperty('--my', `${e.clientY - r.top}px`); photo.style.opacity = '1'; });
    stage.addEventListener('pointerleave', () => { photo.style.opacity = '0'; });
    window.addEventListener('resize', () => { measure(); if (state !== 'idle') paint(progress); });
    document.fonts.ready.then(() => { measure(); if (state !== 'idle') paint(progress); });
    // Returning by scrollbar/touch from lower sections restores the intro at its natural position.
    let previousY = scrollY;
    window.addEventListener('scroll', () => { if (state === 'done' && scrollY < previousY && atTop()) reverse(); previousY = scrollY; }, { passive: true });
    // const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .12 });
    // document.querySelectorAll('.value-card').forEach(card => observer.observe(card));
    setState('idle'); measure();
})();





/* ================= OUR VALUES 스크롤 애니메이션 ================= */
(() => {
    const section = document.querySelector('.about-values');
    if (!section) return;

    const cards = [
        section.querySelector('.value-01'),
        section.querySelector('.value-02'),
        section.querySelector('.value-03')
    ];
    const heading = section.querySelector('h2');
    const intro = document.getElementById('stage');

    if (!heading || cards.some(card => !card)) return;

    const isMobile = () => window.matchMedia('(max-width: 700px)').matches;

    const SLIDE = 1000;
    const COPY = 350;
    const QUIET = 200;

    let step = 0;
    let busy = false;
    let mode = 'free'; // free, entering, pinned, leaving
    let exitDirection = 0;
    let lastWheel = -Infinity;
    let lastDirection = 0;
    let nextAllowed = 0;
    let touchY = null;
    let touchHandled = false;
    let generation = 0;

    const wait = ms =>
        new Promise(resolve => setTimeout(resolve, ms));

    const sectionTop = () =>
        section.getBoundingClientRect().top + window.scrollY;

    function ready() {
        return !intro ||
            intro.dataset.state === 'done' ||
            intro.getBoundingClientRect().top < -1;
    }

    function update() {
        section.dataset.valuesStep = String(step);
        section.dataset.valuesBusy = String(busy);
        section.dataset.valuesMode = mode;
    }

    function consume(event) {
        if (event.cancelable) event.preventDefault();
        event.stopImmediatePropagation();
    }

    function enter() {
        if (mode !== 'free') return;

        mode = 'entering';
        exitDirection = 0;
        update();

        // 진입 중에는 카드 실행 금지
        const target = sectionTop();

        window.scrollTo({
            top: target,
            behavior: 'smooth'
        });

        // 위치가 정렬된 후 고정 상태로 변경
        const check = () => {
            if (mode !== 'entering') return;

            if (Math.abs(window.scrollY - target) <= 2) {
                mode = 'pinned';
                nextAllowed = performance.now() + 250;
                update();
            } else {
                requestAnimationFrame(check);
            }
        };

        requestAnimationFrame(check);
    }

    // async function move(direction) {
    //     if (busy || mode !== 'pinned') return;

    //     const index = direction > 0 ? step : step - 1;
    //     if (index < 0 || index >= cards.length) return;

    //     busy = true;
    //     update();

    //     const token = generation;
    //     const card = cards[index];

    //     try {
    //         if (direction > 0) {
    //             if (index === 2) {
    //                 heading.classList.add('values-title-hidden');
    //             }

    //             card.classList.add('is-visible');

    //             await wait(SLIDE);
    //             if (token !== generation) return;

    //             card.classList.add('text-visible');

    //             await wait(COPY);
    //             if (token !== generation) return;

    //             step++;
    //         } else {
    //             card.classList.remove('text-visible');

    //             await wait(COPY);
    //             if (token !== generation) return;

    //             card.classList.remove('is-visible');

    //             if (index === 2) {
    //                 heading.classList.remove('values-title-hidden');
    //             }

    //             await wait(SLIDE);
    //             if (token !== generation) return;

    //             step--;
    //         }
    //     } finally {
    //         if (token === generation) {
    //             busy = false;
    //             nextAllowed = performance.now() + 300;
    //             update();
    //         }
    //     }
    // }
    async function move(direction) {
    if (busy || mode !== 'pinned') return;

    const mobile = isMobile();
    const index = direction > 0 ? step : step - 1;

    if (!mobile && (index < 0 || index >= cards.length)) return;

    busy = true;
    update();

    const token = generation;

    try {
        if (mobile) {
            // 모바일: 3장 동시 등장
            if (direction > 0) {
                heading.classList.add('values-title-hidden');

                cards.forEach(card => {
                    card.classList.add('is-visible');
                });

                await wait(SLIDE);
                if (token !== generation) return;

                cards.forEach(card => {
                    card.classList.add('text-visible');
                });

                await wait(COPY);
                if (token !== generation) return;

                step = cards.length;

            } else {
                // 모바일: 3장 동시 퇴장
                cards.forEach(card => {
                    card.classList.remove('text-visible');
                });

                await wait(COPY);
                if (token !== generation) return;

                cards.forEach(card => {
                    card.classList.remove('is-visible');
                });

                heading.classList.remove('values-title-hidden');

                await wait(SLIDE);
                if (token !== generation) return;

                step = 0;
            }

        } else {
            // PC: 기존 순차 등장 및 퇴장
            const card = cards[index];

            if (direction > 0) {
                if (index === 2) {
                    heading.classList.add('values-title-hidden');
                }

                card.classList.add('is-visible');

                await wait(SLIDE);
                if (token !== generation) return;

                card.classList.add('text-visible');

                await wait(COPY);
                if (token !== generation) return;

                step++;

            } else {
                card.classList.remove('text-visible');

                await wait(COPY);
                if (token !== generation) return;

                card.classList.remove('is-visible');

                if (index === 2) {
                    heading.classList.remove('values-title-hidden');
                }

                await wait(SLIDE);
                if (token !== generation) return;

                step--;
            }
        }
    } finally {
        if (token === generation) {
            busy = false;
            nextAllowed = performance.now() + 300;
            update();
        }
    }
}

    function handle(direction, event, fresh = true) {
        if (!direction || !ready()) return;

        // 진입 및 카드 애니메이션 도중 스크롤 차단
        if (mode === 'entering' || busy) {
            consume(event);
            return;
        }

        if (mode === 'pinned') {
            const canMove = direction > 0
                ? step < cards.length
                : step > 0;

            if (!canMove) {
                // 카드가 모두 등장/퇴장한 경우만 이탈 허용
                mode = 'leaving';
                exitDirection = direction;
                update();
                return;
            }

            consume(event);

            if (!fresh || performance.now() < nextAllowed) return;

            void move(direction);
            return;
        }

        if (mode === 'leaving') {
            if (direction === exitDirection) return;

            mode = 'free';
            exitDirection = 0;
        }

        const rect = section.getBoundingClientRect();

        // 위에서 내려오는 경우
        const enteringDown =
            direction > 0 &&
            step < cards.length &&
            rect.top >= -2 &&
            rect.top <= window.innerHeight;

        // 푸터에서 올라오는 경우
        const enteringUp =
            direction < 0 &&
            step > 0 &&
            rect.bottom >= 0 &&
            rect.bottom <= window.innerHeight + 2;

        if (enteringDown || enteringUp) {
            consume(event);
            enter();
        }
    }

    window.addEventListener('wheel', event => {
        if (
            event.ctrlKey ||
            !event.deltaY ||
            Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ) return;

        const direction = Math.sign(event.deltaY);
        const now = performance.now();

        const fresh =
            now - lastWheel >= QUIET ||
            direction !== lastDirection;

        lastWheel = now;
        lastDirection = direction;

        handle(direction, event, fresh);
    }, { passive: false, capture: true });

    window.addEventListener('keydown', event => {
        if (
            event.ctrlKey ||
            event.metaKey ||
            event.altKey ||
            event.target.closest(
                'input,textarea,select,button,a,[contenteditable]'
            )
        ) return;

        const direction =
            ['ArrowDown', 'PageDown', 'End'].includes(event.key) ||
            (event.key === ' ' && !event.shiftKey) ? 1 :
            ['ArrowUp', 'PageUp', 'Home'].includes(event.key) ||
            (event.key === ' ' && event.shiftKey) ? -1 : 0;

        if (direction) {
            handle(direction, event, !event.repeat);
        }
    }, { capture: true });

    window.addEventListener('touchstart', event => {
        touchY = event.touches.length === 1
            ? event.touches[0].clientY
            : null;
        touchHandled = false;
    }, { passive: true });

    window.addEventListener('touchmove', event => {
        if (touchY === null || event.touches.length !== 1) return;

        if (mode === 'entering' || busy) {
            consume(event);
            return;
        }

        if (touchHandled && mode === 'pinned') {
            consume(event);
            return;
        }

        const delta = touchY - event.touches[0].clientY;
        if (Math.abs(delta) < 35) return;

        handle(Math.sign(delta), event, true);

        if (event.defaultPrevented) {
            touchHandled = true;
        }
    }, { passive: false, capture: true });

    window.addEventListener('touchend', () => {
        touchY = null;
        touchHandled = false;
    }, { passive: true });

    window.addEventListener('touchcancel', () => {
        touchY = null;
        touchHandled = false;
    }, { passive: true });

    // 이탈이 완료되면 다시 진입할 수 있도록 초기화
    window.addEventListener('scroll', () => {
        if (mode !== 'leaving') return;

        const rect = section.getBoundingClientRect();

        if (
            (exitDirection > 0 && rect.bottom <= 0) ||
            (exitDirection < 0 && rect.top >= window.innerHeight)
        ) {
            mode = 'free';
            exitDirection = 0;
            update();
        }
    }, { passive: true });

    function restore() {
        generation++;
        busy = false;
        mode = 'free';
        exitDirection = 0;
        lastWheel = -Infinity;
        nextAllowed = 0;
        touchY = null;

        step = section.getBoundingClientRect().bottom <= 0
            ? cards.length : 0;

        cards.forEach((card, index) => {
            card.classList.toggle('is-visible', index < step);
            card.classList.toggle('text-visible', index < step);
        });

        heading.classList.toggle(
            'values-title-hidden',
            step === cards.length
        );

        update();
    }

    window.addEventListener('pageshow', restore);
    restore();
})();



/* ============ ABOUT CUSTOM CURSOR ============ */
(() => {
    const cursor = document.querySelector('.pulse-cursor');
    if (!cursor) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const hoverTargets = [
        'a',
        'button',
        'input',
        'select',
        'textarea',
        'label',
        '[role="button"]',
        '[data-cursor-hover]',
        '.about-values .value-card',
        '.socials span'
    ].join(',');

    const trails = [];
    const MAX_TRAILS = 24;
    let trailIndex = 0;
    let lastX = null;
    let lastY = null;
    let lastTime = 0;

    for (let i = 0; i < MAX_TRAILS; i++) {
        const trail = document.createElement('div');
        trail.className = 'pulse-afterimage';
        trail.setAttribute('aria-hidden', 'true');
        trail.innerHTML = `
            <span class="cursor-arm top"></span>
            <span class="cursor-arm right"></span>
            <span class="cursor-arm bottom"></span>
            <span class="cursor-arm left"></span>
        `;
        document.body.appendChild(trail);
        trails.push(trail);
    }

    document.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') return;

        const x = event.clientX;
        const y = event.clientY;

        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
        cursor.style.opacity = '1';

        const target = event.target;
        cursor.classList.toggle(
            'is-hover',
            target instanceof Element &&
            Boolean(target.closest(hoverTargets))
        );

        const now = performance.now();

        if (
            lastX !== null &&
            Math.hypot(x - lastX, y - lastY) >= 12 &&
            now - lastTime >= 25
        ) {
            const trail = trails[trailIndex];
            trailIndex = (trailIndex + 1) % MAX_TRAILS;

            trail.classList.remove('is-active');
            trail.style.left = `${x}px`;
            trail.style.top = `${y}px`;
            void trail.offsetWidth;
            trail.classList.add('is-active');

            lastX = x;
            lastY = y;
            lastTime = now;
        } else if (lastX === null) {
            lastX = x;
            lastY = y;
            lastTime = now;
        }
    }, { passive: true });

    document.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch') {
            cursor.classList.add('is-click');
        }
    });

    document.addEventListener('pointerup', () => {
        cursor.classList.remove('is-click');
    });

    document.addEventListener('pointercancel', () => {
        cursor.classList.remove('is-click');
    });

    document.addEventListener('pointerout', event => {
        if (event.relatedTarget === null) {
            cursor.style.opacity = '0';
            lastX = null;
            lastY = null;
        }
    });

    window.addEventListener('blur', () => {
        cursor.style.opacity = '0';
        cursor.classList.remove('is-click');
        lastX = null;
        lastY = null;
    });
})();
