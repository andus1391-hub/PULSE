/* MAIN — 최초 오프닝, 스크롤 터널, HOME 재진입 상태 */
(() => {
  const section = document.querySelector('.main');
  if (!section) return;
  const stage = section.querySelector('.tunnel-stage');
  const space = section.querySelector('.tunnel-space');
  const finish = section.querySelector('.tunnel-finish');
  const header = section.querySelector('.hero-header');
  const words = ['LIMIT', 'POWER', 'DRIVE', 'BREAK', 'FEEL'];
  const spacing = 1350;
  const totalDepth = words.length * spacing + 950;
  const finishStart = (words.length - 1) * spacing + 300;
  const clamp = value => Math.min(1, Math.max(0, value));

  // 게이트를 한 번만 생성합니다. 이후에는 같은 요소의 깊이와 투명도만 갱신합니다.
  const gates = words.map(word => {
    const gate = document.createElement('div');
    gate.className = 'tunnel-gate';
    gate.innerHTML = '<div class="tunnel-side tunnel-left"></div><div class="tunnel-side tunnel-right"></div><div class="tunnel-word"></div>';
    gate.lastElementChild.textContent = word;
    space.appendChild(gate);
    return gate;
  });
  const intro = section.querySelector('.tunnel-intro');
  const panels = intro.querySelectorAll('.tunnel-side');
  const openingWord = intro.querySelector('.tunnel-word');
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  let target = 0, current = 0, frame = 0;
  // opening → tunnel ↔ brand. HOME 링크만 home 상태를 고정합니다.
  let phase = 'opening', started = 0, origin = 0;

  // 미리보기의 시간표: 사각형 등장 → 좌우 이동 → LIMIT → 게이트와 교차 페이드.
  function paintIntro(ms) {
    const appear = smooth((ms - 120) / 450);
    panels.forEach(panel => { panel.style.opacity = appear; });
    intro.style.setProperty('--spread', smooth((ms - 400) / 1050));
    openingWord.style.opacity = smooth((ms - 1280) / 580);
    intro.style.opacity = 1 - smooth((ms - 1960) / 340);
    intro.hidden = ms >= 2300;
  }

  function paint() {
    gates.forEach((gate, index) => {
      // 원본 V5와 같은 -65 시작점, 230px 소실 구간, 480px 가시성 경계.
      const depth = current - index * spacing - 65;
      gate.style.transform = 'translate(-50%,-50%) translateZ(' + depth + 'px)';
      gate.style.opacity = depth > 240 || depth < -8000 ? 0 : clamp((240 - depth) / 230);
      gate.style.visibility = depth > 480 ? 'hidden' : 'visible';
      // 패널은 유지하고 글자만 깊이에 따라 표시합니다. 역스크롤도 같은 곡선을 따릅니다.
      gate.lastElementChild.style.opacity = smooth((depth + 1250) / 650) * (1 - smooth((depth - 80) / 220));
    });
    // FEEL 뒤 2000 깊이 단위에 걸쳐 V5의 smoothstep으로 PULSE와 슬로건을 표시합니다.
    const f = clamp((current - finishStart) / 2000);
    finish.style.opacity = f * f * (3 - 2 * f);
    // 배경과 로고는 같은 finish 레이어에서 동시에 완성됩니다.
    if (phase !== 'opening') {
      phase = f >= 0.85 ? 'brand' : 'tunnel';
      section.classList.toggle('has-brand', phase === 'brand');
      header.inert = phase !== 'brand';
    }
  }
  function render(now) {
    frame = 0;
    if (phase === 'opening') {
      paintIntro(now - started);
      if (now - started < 2300) { frame = requestAnimationFrame(render); return; }
      phase = 'tunnel';
      // 오프닝 중 소비한 스크롤은 제외합니다. 추가 입력이 없으면 LIMIT에 머뭅니다.
      origin = position();
      if (origin >= 1) { origin = 0; current = target = totalDepth; }
    }
    current += (target - current) * .095; // 원본의 프레임당 추종 속도
    if (Math.abs(target - current) < .001) current = target;
    paint();
    if (current !== target) frame = requestAnimationFrame(render);
  }
  function position() {
    return clamp(-section.getBoundingClientRect().top / (stage.offsetHeight * 6));
  }
  function updateTarget() {
    if (phase === 'home' || phase === 'opening') return;
    target = clamp((position() - origin) / Math.max(.0001, 1 - origin)) * totalDepth;
    if (!frame && current !== target) frame = requestAnimationFrame(render);
  }

  // 새 문서와 뒤로가기 캐시 복귀에서만 처음부터 시작합니다.
  function startOpening() {
    cancelAnimationFrame(frame);
    section.classList.add('is-resetting');
    section.classList.remove('is-home', 'has-brand');
    header.inert = true;
    window.scrollTo({ top: 0, behavior: 'instant' });
    phase = 'opening';
    origin = current = target = 0;
    started = performance.now();
    paintIntro(0);
    paint();
    document.documentElement.classList.remove('main-loading');
    frame = requestAnimationFrame(now => {
      section.classList.remove('is-resetting');
      render(now);
    });
  }

  // 일반 섹션 링크는 브라우저에 맡깁니다. HOME만 즉시 완성한 뒤 맨 위로 이동합니다.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href="#top"], a[href="#main"]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
      event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    cancelAnimationFrame(frame);
    frame = 0;
    phase = 'home';
    intro.hidden = true;
    finish.style.opacity = 1;
    header.inert = false;
    section.classList.add('is-home', 'has-brand');
    history.replaceState(history.state, '', link.hash);
    window.scrollTo({ top: 0, behavior: 'instant' });
    header.querySelector('a').focus({ preventScroll: true });
  });
  startOpening();
  window.addEventListener('scroll', updateTarget, { passive: true });
  window.addEventListener('resize', updateTarget);
  window.addEventListener('pageshow', event => { if (event.persisted) startOpening(); });
})();
/* MAIN 끝 */

/* banner 시작
 * 진행 순서: 0~5% 작은 이미지 유지 / 5~48% 전체화면 확대 /
 * 이미지 확대만 스크롤 진행률에 연동합니다.
 * 확대 완료: 레일 자동 흐름 + h2/h3 시간 기반 등장(스크롤을 멈춰도 끝까지 재생).
 * 제목 등장 완료 후 추가로 아래로 스크롤: p 두 개를 함께 한 번에 등장시킵니다.
 */
(() => {
  const banner = document.querySelector('#about');
  const stage = banner?.querySelector('.banner-stage');
  if (!stage) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const items = [...banner.querySelector('.about-copy').children];
  let headingsReady = false, readyScrollY = 0;
  // 실제 CSS 모션 종료를 감지합니다. 타이머만으로 본문을 자동 표시하지 않습니다.
  banner.querySelector('h3').addEventListener('transitionend', event => {
    if (event.propertyName !== 'opacity' || !banner.classList.contains('has-headings')) return;
    headingsReady = true;
    readyScrollY = window.scrollY;
  });
  const clamp = value => Math.max(0, Math.min(1, value));
  // 양 끝에서 속도와 가속도가 0에 가까운 smootherstep으로 시작/마무리를 부드럽게 합니다.
  const ease = t => t * t * t * (t * (t * 6 - 15) + 10);
  let target = 0, current = 0, frame = 0, previousTime = 0, visible = false;

  function measure() {
    const distance = Math.max(1, stage.clientHeight * 2.0);
    target = clamp(-banner.getBoundingClientRect().top / distance);
  }
  function paint(progress) {
    // const expansion = ease(clamp((progress - .05) / .43));
    // // 조절: .25 = 첨부 화면처럼 너비/높이 25%로 시작. 1 = 화면 전체.
    // stage.style.setProperty('--banner-scale', String(.25 + .75 * expansion));
    if (progress >= .15) {
      // 이미지가 100%가 된 순간 한 번만 트리거. 이후 스크롤량은 글의 모션 속도에 영향 없음.
      banner.classList.add('is-banner-expanded', 'has-headings');
    } else if (progress < .10) {
      // 위로 충분히 돌아왔을 때만 초기화해 경계에서 깜빡이지 않게 합니다.
      banner.classList.remove('is-banner-expanded', 'has-headings', 'has-paragraphs');
      headingsReady = false;
    }
  }
  function tick(time) {
    frame = 0;
    if (motion.matches || document.hidden) return;
    // 조절: 110(ms)은 스크롤을 따라가는 부드러움. 커질수록 천천히 따라옵니다.
    // 시간 차이를 사용하므로 60Hz/120Hz 화면에서도 비슷한 속도로 움직입니다.
    const dt = previousTime ? Math.min(time - previousTime, 64) : 16;
    previousTime = time;
    current += (target - current) * (1 - Math.exp(-dt / 110));
    if (Math.abs(target - current) < .0001) current = target;
    paint(current);
    if (current !== target && visible) frame = requestAnimationFrame(tick);
    else previousTime = 0; // 정지 중에는 프레임 루프를 실행하지 않습니다.
  }
  function schedule() {
    if (motion.matches) return;
    measure();
    if (!visible) { current = target; paint(current); return; }
    if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
  }
  // 화면 진입/이탈을 감지해 양쪽 흐르는 문구와 RAF 계산을 필요한 동안만 실행합니다.
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    banner.classList.toggle('is-banner-visible', visible && !document.hidden);
    schedule();
  });
  observer.observe(banner);
  function setup() {
    cancelAnimationFrame(frame); frame = 0; previousTime = 0;
    headingsReady = false;
    banner.classList.remove('is-banner-expanded', 'has-headings', 'has-paragraphs');
    banner.classList.toggle('is-banner-ready', !motion.matches);
    measure(); current = target;
    if (!motion.matches) paint(current);
    else {
      stage.style.removeProperty('--banner-scale');
      stage.style.removeProperty('--rail-opacity');
      items.forEach(item => { item.style.removeProperty('opacity'); item.style.removeProperty('transform'); });
    }
  }
  window.addEventListener('scroll', () => {
    schedule();
    // 조절: 제목 완료 후 12px 이상 아래로 추가 스크롤하면 p 그룹을 한 번에 실행.
    // 제목이 등장하는 동안의 스크롤은 이 조건에 사용하지 않습니다.
    if (headingsReady && visible && window.scrollY > readyScrollY + 2 && target >= .15) {
      banner.classList.add('has-paragraphs');
    }
  }, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', setup);
  motion.addEventListener('change', setup);
  document.addEventListener('visibilitychange', () => {
    banner.classList.toggle('is-banner-visible', visible && !document.hidden);
    previousTime = 0;
    schedule();
  });
  setup();
})();
/* banner 끝 */


// =================================FORMAT=================================================
// fotmar수정전
// const rows = document.querySelectorAll('.format-row');
// function selectFormat(row) {
//   rows.forEach(item => { item.classList.toggle('active', item === row); item.setAttribute('aria-pressed', String(item === row)); });
//   const image = document.querySelector('#format-image');
//   image.src = `images/main/section1_img${row.dataset.image}.png`;
//   image.alt = `${row.querySelector('b').textContent.trim()} 경기`;
// }
// rows.forEach(row => { row.addEventListener('click', () => selectFormat(row)); row.addEventListener('mouseenter', () => selectFormat(row)); row.addEventListener('focus', () => selectFormat(row)); });
// fotmar수정전

// FORMAT 이미지 변경
const rows = document.querySelectorAll('.format-row');
const image = document.querySelector('#format-image');

function selectFormat(row) {
  rows.forEach(item => {
    item.classList.toggle('active', item === row);
    item.setAttribute('aria-pressed', String(item === row));
  });
  // 기존 이미지 숨기기
  image.classList.remove('show');

  // 이미지 변경 후 해당 위치에서 부드럽게 등장
  setTimeout(() => {
    image.src = `images/main/section1_img${row.dataset.image}.png`;
    image.className = `img-${row.dataset.image}`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        image.classList.add('show');
      });
    });
  }, 200);
}

// 마우스 호버 및 클릭 시 이미지 변경
rows.forEach(row => {
  row.addEventListener('mouseenter', () => selectFormat(row));
  row.addEventListener('click', () => selectFormat(row));
  row.addEventListener('focus', () => selectFormat(row));
});
// =================================FORMAT=================================================





/* SECTION2 MANIFESTO 시작: 스크롤 위치 하나로 사진 마스크와 제목을 함께 계산합니다. */
(() => {
  const section = document.querySelector('.manifesto');
  if (!section) return;
  const stage = section.querySelector('.manifesto-stage');
  const panels = [...stage.querySelectorAll('.photo')];
  const images = panels.map(panel => panel.querySelector('img'));
  const titles = panels.map(panel => panel.querySelector('h2'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = t => Math.max(0, Math.min(1, t));
  const transition = (p, start, width) => {
    const t = clamp((p - start) / width);
    return t * t * (3 - 2 * t);
  };
  const pulse = (p, center, radius) => Math.max(0, 1 - Math.abs(p - center) / radius);
  const titleStart = [.195, .54, .86], titleDuration = [.095, .105, .105];
  let target = 0, progress = 0, frame = 0, stageHeight, stageWidth, entryTop;

  function measure() {
    const top = section.getBoundingClientRect().top;
    stageHeight = stage.clientHeight;
    stageWidth = stage.clientWidth;
    entryTop = Math.min(stageHeight, Math.max(0, top));
    /* 첫 사진은 FORMAT이 화면 밖으로 나가는 동안 아래에서 올라옵니다.
       고정된 뒤부터 마지막 장면까지는 미리보기의 나머지 진행률을 사용합니다. */
    target = top > 0 ? .035 + .14 * clamp(1 - top / stageHeight)
      : .175 + .825 * clamp(-top / (section.offsetHeight - stageHeight));
  }

  function paint(p) {
    const entry = transition(p, .035, .14);
    const second = transition(p, .405, .13);
    const third = transition(p, .725, .13);
    const hits = [pulse(p, .11, .11), pulse(p, .47, .10), pulse(p, .79, .10)];
    // FORMAT을 복제하지 않고 실제 화면 위에서 대각선 가장자리만 열어 빈 면을 방지합니다.

    // sticky 요소 자체는 이동시키지 않고
    // 이미지가 보이는 영역만 점차 확장
    const entryEdge = 100 * (1 - entry);

    stage.style.transform = 'none';

    stage.style.clipPath = `polygon(
    0 ${entryEdge}%,
    100% ${Math.max(0, entryEdge - 12)}%,
    100% 100%,
    0 100% )`;

    // 두 번째는 오른쪽 → 왼쪽, 세 번째는 위 → 아래. 이전 사진은 뒤에서 계속 화면을 채웁니다.
    const sideEdge = 100 * (1 - second), downEdge = 100 * third;
    panels[1].style.visibility = second > 0 ? 'visible' : 'hidden';
    panels[2].style.visibility = third > 0 ? 'visible' : 'hidden';
    panels[1].style.clipPath = 'polygon(' + sideEdge + '% 0,100% 0,100% 100%,' + Math.max(0, sideEdge - 12) + '% 100%)';
    panels[2].style.clipPath = 'polygon(0 0,100% 0,100% ' + downEdge + '%,0 ' + Math.max(0, downEdge - 12 * (1 - third)) + '%)';

    panels[1].style.transform = 'translateX(' + ((1 - second) * 8) + '%) scale(' + (1 + hits[1] * .055) + ')';

    // panels[1].style.transform = 'translateX(' + ((1 - second) * 8 - hits[2] * 7) + '%) scale(' + (1 + hits[1] * .055 + hits[2] * .09) + ')';
    panels[2].style.transform = 'translateY(' + (-(1 - third) * 8) + '%) scale(' + (1 + hits[2] * .06) + ')';

    images.forEach((image, i) => {
      const advance = i === 0
        ? p
        : i === 1
          ? clamp((p - .405) / .35)
          : clamp((p - .725) / .25);

      // 좌우·상하 흔들림 제거
      // 스크롤에 따라 부드럽게 확대만 적용
      const scale = 1.025 + advance * .065;

      image.style.transform = `translateZ(0) scale(${scale})`;
    });

    titles.forEach((title, i) => {
      // 사진이 다 덮인 후에만 문구 등장. 등장 구간이 끝나면 다음 전환까지 위치를 유지합니다.
      const t = clamp((p - titleStart[i]) / titleDuration[i]);
      const remaining = Math.pow(1 - t, 3) * (1 + 2.2 * t);
      const offset = remaining * (i === 2 ? stageHeight * .75 : stageWidth * .85);
      title.style.transform = 'translate3d(' + (i === 0 ? offset : i === 1 ? -offset : 0)
        + 'px,' + (i === 2 ? -offset : 0) + 'px,0) scale(' + (1 + hits[i] * .10) + ')';
      title.style.opacity = clamp(t * 2);
    });
  }

  function render() {
    frame = 0;
    progress += (target - progress) * .105; // 미리보기의 프레임 보간값. 목표 위치에서 멈춥니다.
    if (Math.abs(target - progress) < .00001) progress = target;
    paint(progress);
    if (progress !== target) frame = requestAnimationFrame(render);
  }
  function update() {
    if (reduced.matches) return;
    measure();
    if (!frame) frame = requestAnimationFrame(render);
  }
  function setup() {
    cancelAnimationFrame(frame); frame = 0;
    section.classList.toggle('manifesto-running', !reduced.matches);
    if (reduced.matches) {
      [stage, ...panels, ...images, ...titles].forEach(el => {
        for (const property of ['clip-path', 'visibility', 'opacity', 'transform']) el.style.removeProperty(property);
      });
      return;
    }
    measure(); progress = target; paint(progress);
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('pageshow', setup);
  reduced.addEventListener('change', setup);
  setup();
})();
/* SECTION2 MANIFESTO 끝 */


/* SECTION3 - PRIZE MONEY 최초 진입 시 빛 효과 */
(() => {
  const section = document.querySelector('#section3');
  const title = section?.querySelector('.prize-title');

  if (!section || !title) return;

  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;

    title.classList.add('shine');
    observer.disconnect();

  }, {
    threshold: 0.3
  });

  observer.observe(section);
})();





// =========================== SECTION4 OFFICIAL KIT =============================================

// OFFICIAL KIT — 검정 인트로 → 타이틀 이동 → 5장 순차 등장 → 사선 → 상하 이동하며 퇴장
(() => {
  const section = document.querySelector('#kit'); if (!section) return;
  const stage = section.querySelector('.kit-stage'), title = section.querySelector('h2');
  const grid = section.querySelector('.kit-grid'), cards = [...grid.querySelectorAll('figure')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = v => Math.max(0, Math.min(1, v));
  const ease = v => { v = clamp(v); return v * v * (3 - 2 * v) };
  const phase = (p, a, b) => ease((p - a) / (b - a));
  let queued = false;
  function render() {
    queued = false; if (reduced.matches) return;
    const rect = section.getBoundingClientRect();
    const distance = Math.max(1, section.offsetHeight - innerHeight);
    const p = clamp(-rect.top / distance);

    // 모바일 OFFICIAL KIT 가로 스크롤
    if (window.innerWidth <= 700) {

      const intro = phase(p, .04, .20);
      const slide = phase(p, .22, .94);

      // 기존 검정 → 흰색 배경 전환 유지
      const color = Math.round(8 + 247 * intro);
      stage.style.backgroundColor =
        `rgb(${color}, ${color}, ${color})`;

      // 제목 중앙 → 상단 이동
      title.style.top = `${50 - 42 * intro}%`;
      title.style.color = intro > .5 ? '#080808' : '#fff';

      // 상품 가로 이동 거리 계산
      const visibleWidth = stage.clientWidth * .88;
      const moveDistance = Math.max(
        0,
        grid.scrollWidth - visibleWidth
      );

      // PC의 rotate, scale 제거
      grid.style.transform =
        `translate3d(${-moveDistance * slide}px, 0, 0)`;

      // 상품 기울어짐 제거
      cards.forEach(card => {
        card.style.opacity = String(intro);
        card.style.transform = 'none';
      });

      return;
    }

    // 0~0.22: 검정 배경 중앙 제목 → 상단 제목 + 흰 배경
    const intro = phase(p, .06, .24);
    const tilt = phase(p, .57, .77);
    // const leave=phase(p,.78,1);
    stage.style.backgroundColor = `rgb(${Math.round(8 + 247 * intro)},${Math.round(8 + 247 * intro)},${Math.round(8 + 247 * intro)})`;
    title.style.top = `${50 - 42 * intro}%`;
    title.style.color = `rgb(${Math.round(255 - 247 * intro)},${Math.round(255 - 247 * intro)},${Math.round(255 - 247 * intro)})`;
    // title.style.opacity=String(1-phase(p,.83,.97));
    // 마지막 단계에서 각 카드가 서로 다른 방향으로 수직 이동
    grid.style.transform = `rotate(${-18 * tilt}deg) scale(${1 + .28 * tilt})`;


    cards.forEach((card, i) => {
      const appear = phase(p, .22 + i * .055, .34 + i * .055);
      const initialY = (1 - appear) * 65;
      const diagonal = (i - 2) * 18 * tilt;

      card.style.opacity = String(appear);
      card.style.transform = `translate3d(0,${initialY + diagonal}px,0) rotate(${(i - 2) * 2 * tilt}deg)`;
    });


    // cards.forEach((card,i)=>{
    //   const appear=phase(p,.22+i*.055,.34+i*.055);
    //   const initialY=(1-appear)*65;
    //   const stagger=(i%2===0?-1:1);
    //   const diagonal=(i-2)*18*tilt;
    //   const vertical=stagger*(innerHeight*1.45)*leave;
    //   card.style.opacity=String(appear*(1-phase(p,.94,1)));
    //   card.style.transform=`translate3d(0,${initialY+diagonal+vertical}px,0) rotate(${(i-2)*2*tilt}deg)`;
    // });
  }
  function request() { if (!queued) { queued = true; requestAnimationFrame(render) } }
  addEventListener('scroll', request, { passive: true }); addEventListener('resize', request); render();
})();


// ====================================== SECTION4 END ============================================





// const gallery = document.querySelector('.gallery');
// const descriptions = ['박스 점프에 도전하는 선수', '경기 후 환호하는 선수', '모든 힘을 쏟아낸 선수', '서로를 격려하는 참가자들', '경기장에 들어서는 선수', '함께 웃는 참가자들', '무게를 밀어내는 선수', '훈련을 준비하는 참가자들'];
// descriptions.forEach((alt, i) => { const image = document.createElement('img'); image.src = `images/main/section5_img${i + 1}.png`; image.alt = alt; image.loading = 'lazy'; gallery.append(image); });
// const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// function scrollGallery(direction) { gallery.scrollBy({ left: direction * gallery.clientWidth * .65, behavior: reducedMotion.matches ? 'instant' : 'smooth' }); }
// document.querySelector('#prev').addEventListener('click', () => scrollGallery(-1));
// document.querySelector('#next').addEventListener('click', () => scrollGallery(1));

/* ================= GALLERY SWIPER ================= */

const gallery = document.querySelector('.gallery');
const galleryWrapper = gallery.querySelector('.swiper-wrapper');

const descriptions = [
  '박스 점프에 도전하는 선수',
  '경기 후 환호하는 선수',
  '모든 힘을 쏟아낸 선수',
  '서로를 격려하는 참가자들',
  '경기장에 들어서는 선수',
  '함께 웃는 참가자들',
  '무게를 밀어내는 선수',
  '훈련을 준비하는 참가자들'
];

descriptions.forEach((alt, i) => {
  const slide = document.createElement('div');
  slide.className = 'swiper-slide';

  const image = document.createElement('img');
  image.src = `images/main/section5_img${i + 1}.png`;
  image.alt = alt;
  image.loading = 'lazy';
  image.draggable = false;

  slide.appendChild(image);
  galleryWrapper.appendChild(slide);
});

const gallerySwiper = new Swiper('.gallery.swiper', {
  slidesPerView: 'auto',
  spaceBetween: 0,
  speed: 600,
  grabCursor: true,
  simulateTouch: true,
  allowTouchMove: true,
  freeMode: false,

  navigation: {
    nextEl: '#next',
    prevEl: '#prev'
  },
  scrollbar: {
    el: '.gallery .swiper-scrollbar',
    draggable: true,
    hide: false,
    dragSize: 'auto' /* 스크롤바 크기 변경 */
  }
});

/* ================= GALLERY END ================= */



document.querySelector('form').addEventListener('submit', event => { event.preventDefault(); document.querySelector('#form-status').textContent = '입력 형식이 확인되었습니다. 현재 시안 미리보기로, 참가 신청은 접수되지 않았습니다.'; });


/* 원형 퀵 내비게이션 — 푸터가 보이는 동안만 버튼과 링크를 활성화합니다. */
(() => {
  const menu = document.querySelector('.pulse-quick-nav');
  const footer = document.querySelector('body > footer');
  if (!menu || !footer) return;
  const toggle = menu.querySelector('.center');
  const links = menu.querySelectorAll('a.node');

  function setOpen(open) {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    links.forEach(link => { link.tabIndex = open ? 0 : -1; });
  }
  toggle.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
  // 이동은 브라우저가 href로 처리하므로 ABOUT을 about.html로 바꿔도 그대로 동작합니다.
  links.forEach(link => link.addEventListener('click', () => setOpen(false)));
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  //   new IntersectionObserver(([entry]) => {
  //     const visible = entry.isIntersecting && entry.intersectionRect.height > 0;
  //     if (!visible) setOpen(false);
  //     menu.inert = !visible;
  //     menu.classList.toggle('visible', visible);
  //   }, { threshold: [0, 0.00001] }).observe(footer);

  // 페이지 맨 아래에 도달했을 때만 버튼 표시
  function checkBottom() {
    const visible =
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 5;

    if (!visible) setOpen(false);

    menu.inert = !visible;
    menu.classList.toggle('visible', visible);
  }

  window.addEventListener('scroll', checkBottom, { passive: true });
  window.addEventListener('resize', checkBottom);
  window.addEventListener('pageshow', checkBottom);

  checkBottom();
})();


/* =========================================
   PULSE CUSTOM CURSOR — PC
   NEON CROSS + TARGET FRAME + SOFT TRAIL
========================================= */

(() => {
  const cursor = document.querySelector('.pulse-cursor');
  if (!cursor) return;

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  if (reducedMotion.matches) return;

  const hoverTargets = [
    'a',
    'button',
    'input',
    'select',
    'textarea',
    'label',
    '[role="button"]',
    '[data-cursor-hover]',
    // 상금 카드
    '.prize-card',

    // 갤러리 이미지
    '.gallery .swiper-slide',
    '.gallery .swiper-slide img'
  ].join(',');

  const MAX_TRAILS = 36;
  const TRAIL_DISTANCE = 10;
  const TRAIL_INTERVAL = 22;

  const trails = [];
  let trailIndex = 0;

  let lastX = null;
  let lastY = null;
  let lastTime = 0;
  let isDown = false;

  // 잔상 요소를 미리 생성하여 재사용
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

  function createTrail(x, y) {
    const trail = trails[trailIndex];
    trailIndex = (trailIndex + 1) % MAX_TRAILS;

    trail.classList.remove('is-active');

    trail.style.left = `${x}px`;
    trail.style.top = `${y}px`;

    // 애니메이션 재시작
    void trail.offsetWidth;

    trail.classList.add('is-active');
  }

  // 마우스 이동
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;

    const x = e.clientX;
    const y = e.clientY;

    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
    cursor.style.opacity = '1';

    const isHover = Boolean(
      e.target instanceof Element &&
      e.target.closest(hoverTargets)
    );

    cursor.classList.toggle('is-hover', isHover);
    cursor.classList.toggle('is-click', isDown);

    const now = performance.now();

    if (lastX === null || lastY === null) {
      lastX = x;
      lastY = y;
      lastTime = now;
      return;
    }

    const distance = Math.hypot(
      x - lastX,
      y - lastY
    );

    // 일정 거리와 시간 간격마다 잔상 생성
    if (
      distance >= TRAIL_DISTANCE &&
      now - lastTime >= TRAIL_INTERVAL
    ) {
      createTrail(x, y);

      lastX = x;
      lastY = y;
      lastTime = now;
    }
  }, { passive: true });

  // 클릭하면 75%로 축소
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;

    isDown = true;
    cursor.classList.add('is-click');
  });

  document.addEventListener('pointerup', () => {
    isDown = false;
    cursor.classList.remove('is-click');
  });

  // 창 밖으로 나가면 숨김
  document.addEventListener('mouseout', (e) => {
    if (e.relatedTarget === null) {
      cursor.style.opacity = '0';
      lastX = null;
      lastY = null;
    }
  });

  window.addEventListener('blur', () => {
    cursor.style.opacity = '0';
    cursor.classList.remove('is-click');
    isDown = false;
    lastX = null;
    lastY = null;
  });
})();

/* PULSE CUSTOM CURSOR END */

