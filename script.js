(function () {
  'use strict';

  const data = window.SITE_DATA || {};
  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));

  // Экранируем строки из конфига перед вставкой в HTML
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function setText(selector, value) {
    $$(selector).forEach((el) => { el.textContent = value; });
  }

  /* ---------- Данные бренда и контактов ---------- */
  const brand = data.brand || {};
  const contacts = data.contacts || {};

  if (brand.name) setText('[data-brand-name]', brand.name);
  if (brand.short) setText('[data-brand-short]', brand.short.slice(0, 3).toUpperCase());
  if (brand.city) setText('[data-city]', brand.city);
  if (brand.stats) {
    if (brand.stats.minutes) setText('[data-stat-minutes]', brand.stats.minutes);
    if (brand.stats.shows) setText('[data-stat-shows]', brand.stats.shows);
  }
  const school = data.school || {};
  if (school.duration) setText('[data-school-duration]', school.duration);
  if (school.group) setText('[data-school-group]', school.group);
  if (school.extra) setText('[data-school-extra]', school.extra);
  if (contacts.email) {
    setText('[data-contact-email]', contacts.email);
    const mail = $('[data-contact-mail]');
    if (mail) mail.href = 'mailto:' + contacts.email;
  }
  if (contacts.telegram) {
    setText('[data-contact-telegram]', contacts.telegram);
    const tg = $('[data-contact-tg]');
    if (tg) tg.href = 'https://t.me/' + contacts.telegram.replace(/^@/, '');
  }
  if (contacts.phone) {
    setText('[data-contact-phone]', contacts.phone);
    const phone = $('[data-contact-phone-link]');
    if (phone) phone.href = 'tel:' + contacts.phone.replace(/[^\d+]/g, '');
  }
  if (contacts.venue) setText('[data-contact-venue]', contacts.venue);

  /* ---------- Форматы: вкладки ---------- */
  const formats = Array.isArray(data.formats) ? data.formats : [];
  const tabsEl = $('#format-tabs');
  const panelEl = $('#format-panel');

  function renderFormat(index) {
    const item = formats[index];
    if (!item || !panelEl) return;
    const structure = (item.structure || []).map((step) => '<li>' + esc(step) + '</li>').join('');
    const meta = [item.duration, item.players].filter(Boolean).map((tag) => '<span>' + esc(tag) + '</span>').join('');
    panelEl.innerHTML =
      '<div class="format-copy">' +
        '<span class="panel-kicker">' + esc(item.kicker) + '</span>' +
        '<h3>' + esc(item.name) + '</h3>' +
        '<p class="panel-desc">' + esc(item.description) + '</p>' +
        '<div class="panel-meta">' + meta + '</div>' +
      '</div>' +
      '<ol class="structure">' + structure + '</ol>';
  }

  if (tabsEl && formats.length) {
    tabsEl.innerHTML = formats.map((item, index) =>
      '<button class="format-tab" type="button" role="tab" data-index="' + index + '"' +
      ' aria-selected="' + (index === 0) + '" aria-controls="format-panel">' + esc(item.name) + '</button>'
    ).join('');

    function selectTab(index) {
      $$('.format-tab', tabsEl).forEach((tab, i) => {
        const active = i === index;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      renderFormat(index);
    }
    selectTab(0);

    tabsEl.addEventListener('click', (event) => {
      const tab = event.target.closest('.format-tab');
      if (tab) selectTab(Number(tab.dataset.index));
    });
    tabsEl.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const current = $$('.format-tab', tabsEl).findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
      const next = (current + (event.key === 'ArrowRight' ? 1 : -1) + formats.length) % formats.length;
      selectTab(next);
      $$('.format-tab', tabsEl)[next].focus();
    });
  }

  /* ---------- Команда ---------- */
  const team = Array.isArray(data.team) ? data.team : [];
  const teamGrid = $('#team-grid');
  if (teamGrid && team.length) {
    teamGrid.innerHTML = team.map((member) => {
      const initials = esc((member.initials || member.name || '?').slice(0, 3));
      const avatar = member.photo
        ? '<img src="' + esc(member.photo) + '" alt="' + esc(member.name) + '" loading="lazy" data-fallback="' + initials + '">'
        : '<span>' + initials + '</span>';
      return '<article class="member">' +
        '<div class="member-avatar">' + avatar + '</div>' +
        '<div class="member-body"><h3>' + esc(member.name) + '</h3><p>' + esc(member.role) + '</p>' +
        (member.since ? '<small>' + esc(member.since) + '</small>' : '') + '</div>' +
      '</article>';
    }).join('');

    // Если фото не загрузилось — показываем инициалы вместо сломанной картинки
    $$('.member-avatar img', teamGrid).forEach((img) => {
      img.addEventListener('error', () => {
        const fallback = document.createElement('span');
        fallback.textContent = img.dataset.fallback || '?';
        img.replaceWith(fallback);
      });
    });
  }

  /* ---------- Афиша ---------- */
  const events = Array.isArray(data.events) ? data.events : [];
  const eventList = $('#event-list');
  if (eventList && events.length) {
    eventList.innerHTML = events.map((item) =>
      '<article class="event">' +
        '<div class="event-date"><strong>' + esc(item.day) + '</strong><span>' + esc(item.month) + '</span></div>' +
        '<div class="event-info"><span class="event-format">' + esc(item.format) + ' · ' + esc(item.weekday) + '</span>' +
        '<h3>' + esc(item.title) + '</h3></div>' +
        '<div class="event-meta"><span><b>' + esc(item.time) + '</b> — начало</span><span>' + esc(item.venue) + '</span></div>' +
        '<div class="event-right"><span class="event-price">' + esc(item.price) + '</span>' +
        (item.status ? '<span class="event-status">' + esc(item.status) + '</span>' : '') +
        '<a class="event-buy" href="#contact">Билеты →</a></div>' +
      '</article>'
    ).join('');
  }

  /* ---------- Отзывы ---------- */
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];
  const reviewTrack = $('#review-track');
  const reviewDots = $('#review-dots');

  if (reviewTrack && reviews.length) {
    reviewTrack.innerHTML = reviews.map((review) =>
      '<article class="review">' +
        '<div><span class="review-quote-mark" aria-hidden="true">“</span>' +
        '<blockquote>' + esc(review.text) + '</blockquote></div>' +
        '<div class="review-author"><span class="avatar" aria-hidden="true">' + esc((review.author || '?').slice(0, 1)) + '</span>' +
        '<span><strong>' + esc(review.author) + '</strong><small>' + esc(review.note) + '</small></span></div>' +
      '</article>'
    ).join('');

    if (reviewDots) {
      reviewDots.innerHTML = reviews.map((_, index) =>
        '<button type="button" data-index="' + index + '" aria-label="Показать отзыв ' + (index + 1) + '"></button>'
      ).join('');
    }

    function currentReview() {
      const card = $('.review', reviewTrack);
      return card ? Math.round(reviewTrack.scrollLeft / (card.getBoundingClientRect().width + 20)) : 0;
    }
    function updateDots() {
      const active = currentReview();
      $$('button', reviewDots).forEach((dot, index) => dot.classList.toggle('is-active', index === active));
    }
    function goToReview(index) {
      const cards = $$('.review', reviewTrack);
      if (!cards.length) return;
      const target = Math.max(0, Math.min(index, cards.length - 1));
      reviewTrack.scrollTo({ left: cards[target].offsetLeft - reviewTrack.offsetLeft, behavior: 'smooth' });
      updateDots();
    }

    updateDots();
    reviewTrack.addEventListener('scroll', updateDots, { passive: true });
    if (reviewDots) {
      reviewDots.addEventListener('click', (event) => {
        const dot = event.target.closest('button');
        if (dot) goToReview(Number(dot.dataset.index));
      });
    }
    const prev = $('#review-prev');
    const next = $('#review-next');
    if (prev) prev.addEventListener('click', () => goToReview(currentReview() - 1));
    if (next) next.addEventListener('click', () => goToReview(currentReview() + 1));
    reviewTrack.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); goToReview(currentReview() + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); goToReview(currentReview() - 1); }
    });
  }

  /* ---------- Вопросы ---------- */
  const faq = Array.isArray(data.faq) ? data.faq : [];
  const faqList = $('#faq-list');
  if (faqList && faq.length) {
    faqList.innerHTML = faq.map((item) =>
      '<details class="faq-item"><summary>' + esc(item.q) + '</summary>' +
      '<p class="faq-answer">' + esc(item.a) + '</p></details>'
    ).join('');
  }

  /* ---------- Шапка и мобильное меню ---------- */
  const header = $('.site-header');
  const nav = $('#site-nav');
  const burger = $('.burger');

  function updateHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  function closeNav() {
    if (!nav || !burger) return;
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
  }
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });
    $$('a', nav).forEach((link) => link.addEventListener('click', closeNav));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeNav(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) closeNav(); });
  }

  /* ---------- Появление секций при скролле ---------- */
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach((el) => observer.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Форма ---------- */
  const form = $('#contact-form');
  const formStatus = $('#form-status');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = form.elements.name.value.trim();
      const contact = form.elements.contact.value.trim();
      const message = form.elements.message.value.trim();
      const invalid = [];
      if (!name) invalid.push(form.elements.name);
      if (!contact) invalid.push(form.elements.contact);
      if (!message) invalid.push(form.elements.message);

      if (invalid.length) {
        invalid.forEach((field) => field.style.borderColor = 'var(--accent)');
        formStatus.textContent = 'Заполните имя, контакт и сообщение — остальное необязательно.';
        formStatus.classList.add('is-error');
        invalid[0].focus();
        return;
      }
      $$('input, textarea', form).forEach((field) => { field.style.borderColor = ''; });
      formStatus.classList.remove('is-error');
      formStatus.textContent = 'Спасибо! Мы получили сообщение и ответим в ближайшее время.';
      form.reset();
    });
    $$('input, textarea', form).forEach((field) => {
      field.addEventListener('input', () => { field.style.borderColor = ''; });
    });
  }

  /* ---------- Год в футере ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
