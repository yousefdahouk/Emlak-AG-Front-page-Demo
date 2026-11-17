/* Emlak AG – front page demo
 * Small, dependency-free helpers. All animation lives in CSS; JS only
 * wires up controls and syncs the 3D models to their scroll timelines.
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

// When the polyfill is used, `.sda` arrives a little later – wait for it.
if (root.classList.contains('sda') || reduceMotion || root.classList.contains('sda-native')) {
	requestAnimationFrame(wireModels);
} else {
	let waited = 0;
	const wait = setInterval(() => {
		waited += 100;
		if (root.classList.contains('sda') || waited > 3000) {
			clearInterval(wait);
			requestAnimationFrame(wireModels);
		}
	}, 100);
}

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

const objects = document.querySelector('#objekte');
setupCarousel(objects.querySelector('.slides'), objects.querySelector('.carousel-ctrl'), objects.querySelector('.counter'));

const explorer = document.querySelector('#quartier');
setupCarousel(cardsScroller, explorer.querySelector('.carousel-ctrl'));

/* ------------------------------------------------------------------
 * Mortgage calculator (annuity loan)
 * ------------------------------------------------------------------ */
const form = document.querySelector('#calc');
const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });

const calc = () => {
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
	form.querySelector('[data-for="years"]').textContent = `${years} Jahre`;
	form.querySelector('[data-for="rate"]').textContent = `${pct.format(rate)} %`;

	document.querySelector('#monthly').textContent = eur.format(monthly);
	document.querySelector('#loan').textContent = eur.format(loan);
	document.querySelector('#interest').textContent = eur.format(Math.max(0, interest));

	form.querySelectorAll('input[type="range"]').forEach((input) => {
		const fill = ((input.value - input.min) / (input.max - input.min)) * 100;
		input.style.setProperty('--fill', `${fill}%`);
	});
};
form.addEventListener('input', calc);
calc();

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
