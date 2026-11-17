/* Emlak AG – front page demo
 * Small, dependency-free helpers. All animation lives in CSS; JS only
 * wires up controls, the language switch, and syncs the 3D models to
 * their scroll timelines.
 */

/* ------------------------------------------------------------------
 * trackProgress – from @bramus/sda-utilities (MIT), inlined so the page
 * has no runtime dependency on esm.sh. It reads an animation's progress
 * every frame and calls `cb` when it changes.
 * ------------------------------------------------------------------ */
const trackProgress = (animation, cb, precision = 5) => {
	let progress = 0;
	const updateValue = () => {
		if (animation && animation.currentTime) {
			let newProgress = animation.effect.getComputedTiming().progress * 1;
			if (animation.playState === 'finished') newProgress = 1;
			newProgress = Math.max(0.0, Math.min(1.0, newProgress)).toFixed(precision);

			if (newProgress != progress) {
				progress = newProgress;
				cb(progress);
			}
		}
		requestAnimationFrame(updateValue);
	};
	requestAnimationFrame(updateValue);
};

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------
 * Language switch (DE ⇄ EN)
 * German is the page's own text. Elements carry their English version in
 * data-en (HTML), and attributes in data-en-alt / data-en-aria-label.
 * The German original is kept in data-de / data-de-* on first switch.
 * ------------------------------------------------------------------ */
const STORAGE_KEY = 'emlak-lang';
const META = {
	de: { title: 'Emlak AG | Vertrauen in Immobilien', locale: 'de-DE', years: 'Jahre' },
	en: { title: 'Emlak AG | Trust in real estate', locale: 'en-IE', years: 'years' },
};
let lang = 'de';

const applyLang = (next) => {
	lang = next;
	root.lang = next;
	document.title = META[next].title;

	document.querySelectorAll('[data-en]').forEach((el) => {
		if (el.dataset.de === undefined) el.dataset.de = el.innerHTML;
		el.innerHTML = next === 'en' ? el.dataset.en : el.dataset.de;
	});

	['alt', 'aria-label'].forEach((attr) => {
		const enKey = `data-en-${attr}`;
		const deKey = `data-de-${attr}`;
		document.querySelectorAll(`[${enKey}]`).forEach((el) => {
			if (!el.hasAttribute(deKey)) el.setAttribute(deKey, el.getAttribute(attr) ?? '');
			el.setAttribute(attr, el.getAttribute(next === 'en' ? enKey : deKey));
		});
	});

	document.querySelectorAll('.lang [data-lang]').forEach((btn) => {
		btn.setAttribute('aria-pressed', String(btn.dataset.lang === next));
	});

	try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* storage unavailable: fine */ }
	if (typeof calc === 'function') calc();
};

document.querySelectorAll('.lang [data-lang]').forEach((btn) => {
	btn.addEventListener('click', () => applyLang(btn.dataset.lang));
});

/* ------------------------------------------------------------------
 * 3D explorer – rotate each model with its card's View Timeline
 * ------------------------------------------------------------------ */
const ROTATION = -360 - 90; // degrees over the full timeline, as in the shoe demo
const rotate = (model, progress) => {
	model.orientation = `0deg 0deg ${progress * ROTATION}deg`;
};

const cardsScroller = document.querySelector('#cards');
const modelCards = [...document.querySelectorAll('.card:has(h2)')];

// Fallback when there is no (polyfilled) scroll-driven animation: compute
// the same "cover" progress manually from the scroller position.
const manualProgress = () => {
	const box = cardsScroller.getBoundingClientRect();
	modelCards.forEach(($card) => {
		const r = $card.getBoundingClientRect();
		const p = (box.right - r.left) / (box.width + r.width);
		rotate($card.querySelector(':scope > model-viewer'), Math.max(0, Math.min(1, p)));
	});
};

const wireModels = () => {
	if (reduceMotion) return;
	const hasTimelines = root.classList.contains('sda') && modelCards.every(($c) => $c.getAnimations().length);
	if (hasTimelines) {
		modelCards.forEach(($card) => {
			const model = $card.querySelector(':scope > model-viewer');
			trackProgress($card.getAnimations()[0], (progress) => rotate(model, progress));
		});
	} else {
		cardsScroller.addEventListener('scroll', () => requestAnimationFrame(manualProgress), { passive: true });
		manualProgress();
	}
};

/* ------------------------------------------------------------------
 * Services track – per-card ranges for the parallax photos.
 * The track slides by D = trackWidth - viewportWidth over the section's
 * "contain" range. A card at offsetLeft x is on screen from
 * (x - vw) / D to (x + w) / D of that range.
 * ------------------------------------------------------------------ */
const hsTrack = document.querySelector('.hscroll__track');
const layoutServices = () => {
	const vw = document.documentElement.clientWidth;
	const travel = hsTrack.scrollWidth - vw;
	if (travel <= 0) return;
	hsTrack.querySelectorAll('.svc').forEach((card) => {
		const x = card.offsetLeft;
		const w = card.offsetWidth;
		card.style.setProperty('--enter', `${(((x - vw) / travel) * 100).toFixed(2)}%`);
		card.style.setProperty('--exit', `${(((x + w) / travel) * 100).toFixed(2)}%`);
	});
};

// When the polyfill is used, `.sda` arrives a little later – wait for it.
const whenReady = (fn) => {
	if (root.classList.contains('sda') || reduceMotion) return requestAnimationFrame(fn);
	let waited = 0;
	const wait = setInterval(() => {
		waited += 100;
		if (root.classList.contains('sda') || waited > 3000) {
			clearInterval(wait);
			requestAnimationFrame(fn);
		}
	}, 100);
};
whenReady(() => {
	wireModels();
	layoutServices();
});
window.addEventListener('resize', layoutServices);
document.fonts?.ready.then(layoutServices);

/* ------------------------------------------------------------------
 * Warm-up, so no heavy work lands mid-scroll:
 * - decode the large service photos ahead of time (otherwise they decode
 *   the first time they're painted, right as the section scrolls in);
 * - start loading the 3D models while the visitor is still up top
 *   (otherwise <model-viewer> loads them just as the services section
 *   ends and the 3D section comes into view).
 * Runs once the page has loaded and the browser is idle.
 * ------------------------------------------------------------------ */
const whenIdle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 1200));
window.addEventListener('load', () => whenIdle(() => {
	document.querySelectorAll('.svc img, .deck__card img').forEach((img) => img.decode?.().catch(() => {}));
	whenIdle(() => document.querySelectorAll('model-viewer[loading="lazy"]').forEach((mv) => { mv.loading = 'eager'; }));
}), { once: true });

/* ------------------------------------------------------------------
 * Horizontal carousels: prev/next buttons, counter, mouse drag
 * ------------------------------------------------------------------ */
const setupCarousel = (scroller, controls, counter) => {
	const items = [...scroller.children];
	const step = () => items[0].getBoundingClientRect().width + parseFloat(getComputedStyle(scroller).columnGap || getComputedStyle(scroller).gap || 0);

	controls?.querySelectorAll('[data-dir]').forEach((btn) => {
		btn.addEventListener('click', () => {
			scroller.scrollBy({ left: Number(btn.dataset.dir) * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
		});
	});

	if (counter) {
		const total = String(items.length).padStart(2, '0');
		const update = () => {
			const max = scroller.scrollWidth - scroller.clientWidth;
			const idx = max <= 0 ? 0 : Math.round((scroller.scrollLeft / max) * (items.length - 1));
			counter.innerHTML = `<b>${String(idx + 1).padStart(2, '0')}</b> / ${total}`;
		};
		scroller.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
		update();
	}

	// drag to scroll with a mouse (touch already scrolls natively)
	let startX = 0;
	let startLeft = 0;
	let dragging = false;
	scroller.addEventListener('pointerdown', (e) => {
		if (e.pointerType !== 'mouse' || e.button !== 0) return;
		dragging = true;
		startX = e.clientX;
		startLeft = scroller.scrollLeft;
	});
	window.addEventListener('pointermove', (e) => {
		if (!dragging) return;
		const dx = e.clientX - startX;
		if (Math.abs(dx) > 3) scroller.classList.add('is-dragging');
		scroller.scrollLeft = startLeft - dx;
	});
	window.addEventListener('pointerup', () => {
		if (!dragging) return;
		dragging = false;
		// re-enable snapping, then let the browser settle on the nearest slide
		const left = scroller.scrollLeft;
		scroller.classList.remove('is-dragging');
		scroller.scrollLeft = left;
	});
	// don't follow links after a drag
	scroller.addEventListener('click', (e) => {
		if (Math.abs(scroller.scrollLeft - startLeft) > 5 && e.target.closest('a')) e.preventDefault();
	}, true);
};

/* ------------------------------------------------------------------
 * Card deck (Objekte) – ported from card_deck/index.html.
 * Cards fan out around the front card; the stage tilts towards a mouse
 * cursor; click a side card, swipe, press ←/→ or use the header buttons.
 * ------------------------------------------------------------------ */
const setupDeck = (deck, controls, counter) => {
	const stage = deck.querySelector('.deck__stage');
	const cards = [...deck.querySelectorAll('.deck__card')];
	const n = cards.length;
	const VISIBLE = 3; // cards shown on each side of the front card
	let front = 0;

	const layout = () => {
		cards.forEach((card, i) => {
			const k = (i - front + n) % n;
			const s = k <= n / 2 ? k : k - n; // signed distance from the front card
			card.style.setProperty('--x', `${s * 52}px`);
			card.style.setProperty('--y', `${Math.abs(s) * 8}px`);
			card.style.setProperty('--z', `${-Math.abs(s) * 70}px`);
			card.style.setProperty('--rot', `${s * 5}deg`);
			card.style.zIndex = String(20 - Math.abs(s));
			card.classList.toggle('is-front', k === 0);
			card.classList.toggle('is-hidden', Math.abs(s) > VISIBLE);
			card.setAttribute('aria-hidden', k === 0 ? 'false' : 'true');
		});
		if (counter) counter.innerHTML = `<b>${String(front + 1).padStart(2, '0')}</b> / ${String(n).padStart(2, '0')}`;
	};
	const go = (step) => { front = (front + step + n) % n; layout(); };

	let swiped = false; // a swipe ending on a side card must not also count as a click on it
	cards.forEach((card, i) => card.addEventListener('click', () => {
		if (swiped) { swiped = false; return; }
		if (i !== front) { front = i; layout(); }
	}));
	controls?.querySelectorAll('[data-dir]').forEach((btn) => btn.addEventListener('click', () => go(Number(btn.dataset.dir))));
	deck.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
		if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
	});

	// tilt towards the cursor (mouse and trackpad only)
	const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	if (finePointer && !reduceMotion) {
		deck.addEventListener('pointermove', (e) => {
			const r = deck.getBoundingClientRect();
			stage.style.transform = `rotateY(${((e.clientX - r.left) / r.width - 0.5) * 22}deg) rotateX(${(0.5 - (e.clientY - r.top) / r.height) * 12}deg)`;
		});
		deck.addEventListener('pointerleave', () => { stage.style.transform = ''; });
	}

	// swipe
	let startX = null;
	deck.addEventListener('pointerdown', (e) => { startX = e.clientX; swiped = false; });
	deck.addEventListener('pointerup', (e) => {
		if (startX !== null && Math.abs(e.clientX - startX) > 40) { swiped = true; go(e.clientX < startX ? 1 : -1); }
		startX = null;
	});
	deck.querySelectorAll('img').forEach((img) => img.addEventListener('dragstart', (e) => e.preventDefault()));

	layout();
};

const objects = document.querySelector('#objekte');
setupDeck(objects.querySelector('.deck'), objects.querySelector('.carousel-ctrl'), objects.querySelector('.counter'));

const explorer = document.querySelector('#quartier');
setupCarousel(cardsScroller, explorer.querySelector('.carousel-ctrl'));

/* ------------------------------------------------------------------
 * Mortgage calculator (annuity loan)
 * ------------------------------------------------------------------ */
const form = document.querySelector('#calc');

function calc() {
	const { locale, years: yearsWord } = META[lang];
	const eur = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
	const pct = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

	const price = Number(form.price.value);
	const down = Number(form.down.value);
	const years = Number(form.years.value);
	const rate = Number(form.rate.value);

	const loan = price * (1 - down / 100);
	const n = years * 12;
	const r = rate / 100 / 12;
	const monthly = r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n));
	const interest = monthly * n - loan;

	form.querySelector('[data-for="price"]').textContent = eur.format(price);
	form.querySelector('[data-for="down"]').textContent = `${down} % · ${eur.format(price * down / 100)}`;
	form.querySelector('[data-for="years"]').textContent = `${years} ${yearsWord}`;
	form.querySelector('[data-for="rate"]').textContent = `${pct.format(rate)} %`;

	document.querySelector('#monthly').textContent = eur.format(monthly);
	document.querySelector('#loan').textContent = eur.format(loan);
	document.querySelector('#interest').textContent = eur.format(Math.max(0, interest));

	form.querySelectorAll('input[type="range"]').forEach((input) => {
		const fill = ((input.value - input.min) / (input.max - input.min)) * 100;
		input.style.setProperty('--fill', `${fill}%`);
	});
}
form.addEventListener('input', calc);

/* ------------------------------------------------------------------
 * Mobile navigation
 * ------------------------------------------------------------------ */
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
toggle.addEventListener('click', () => {
	const open = toggle.getAttribute('aria-expanded') !== 'true';
	toggle.setAttribute('aria-expanded', String(open));
	nav.classList.toggle('is-open', open);
});
nav.addEventListener('click', (e) => {
	if (e.target.closest('a')) {
		toggle.setAttribute('aria-expanded', 'false');
		nav.classList.remove('is-open');
	}
});

document.querySelector('#year').textContent = new Date().getFullYear();

/* ------------------------------------------------------------------
 * Start: restore the saved language (German by default), then calculate
 * ------------------------------------------------------------------ */
let saved = null;
try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* storage unavailable */ }
if (saved === 'en') applyLang('en');
calc();
