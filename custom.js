/* HELL RUST — скрипт поверх стандартного шаблона GameStores.
   Вставляется в «Внешний вид → Продвинутая конфигурация → JavaScript».
   Всё, что клиент может захотеть поменять, лежит в HR ниже. */
(function () {
  var HR = {
    // картинки лежат в github.com/KERNO-Web/hellrust-demo-assets и отдаются через jsDelivr
    logo: 'https://cdn.jsdelivr.net/gh/KERNO-Web/hellrust-demo-assets@c8fdcb7/logo.webp',
    banner: 'https://cdn.jsdelivr.net/gh/KERNO-Web/hellrust-demo-assets@c8fdcb7/banner-wide.webp',
    bannerMobile: 'https://cdn.jsdelivr.net/gh/KERNO-Web/hellrust-demo-assets@c8fdcb7/banner-16x9.webp',

    connect: '194.147.90.228:35000',

    // бонусы при пополнении; пустой список = блок не показывается
    bonuses: [
      ['от 250 ₽', '+5%'],
      ['от 500 ₽', '+10%'],
      ['от 1000 ₽', '+15%'],
      ['от 2500 ₽', '+20%']
    ],

    // витринные категории: стоят первыми в «Все» и показываются крупными карточками.
    // name: имя категории как в админке; look: 'portrait' (картинка на всю карточку) или 'item' (предмет на прозрачном фоне)
    featured: [
      { name: 'Привилегии', look: 'portrait' }
      // вид 'item' (предмет на прозрачном фоне) тоже готов: { name: 'Кейсы', look: 'item' }
    ],

    // стартовый промокод в левой колонке; пустой code = блок не показывается
    promo: { code: 'HELLSTART', text: 'Скидка 10% на товары.', until: 'До\u00a031.12.2026.' },

    // вайпы. global: глобальный вайп Rust, первый четверг месяца, ≈22:00 МСК.
    // map: вайпы карты этого сервера, время по Москве: ['2026-11-12 18:00', ...]. Пусто = показываем только глобальный.
    wipes: { global: true, map: [], note: '' },

    social: [
      { name: 'ВКонтакте', hint: 'Розыгрыши и новости', url: 'https://vk.com/hellrustserver', icon: 'vk' },
      { name: 'Telegram', hint: 'Вайпы и обновления', url: 'https://t.me/hellrustserver', icon: 'tg' }
    ]
  };

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  function icon(name) {
    return '<i class="hr-i hr-i--' + name + '" aria-hidden="true"></i>';
  }

  function copyConnect() {
    var cmd = 'client.connect ' + HR.connect;
    var ok = function () { toast('Скопировано. Открой консоль в игре на F1 и вставь'); };
    var fail = function () { toast('Не удалось скопировать, адрес: ' + HR.connect); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(cmd).then(ok, fail);
    else fail();
  }

  function setVars() {
    document.documentElement.style.setProperty('--hr-logo', 'url("' + HR.logo + '")');
    document.documentElement.style.setProperty('--hr-bg', 'url("' + HR.bannerMobile + '")');
    var fav = document.querySelector('link[rel~="icon"]');
    if (fav && fav.getAttribute('href') !== HR.logo) fav.setAttribute('href', HR.logo);
  }

  // баннер начинаем качать сразу, не дожидаясь, пока React нарисует картинку
  (function preloadBanner() {
    var l = document.createElement('link');
    l.rel = 'preload'; l.as = 'image';
    l.href = window.matchMedia('(max-width: 600px)').matches ? HR.bannerMobile : HR.banner;
    document.head.appendChild(l);
  })();

  function hero() {
    var img = document.querySelector('.Banner-module__img');
    if (!img) return;
    var want = window.matchMedia('(max-width: 600px)').matches ? HR.bannerMobile : HR.banner;
    if (img.getAttribute('src') !== want) img.setAttribute('src', want);
    img.alt = 'Hell Rust';
    // показываем баннер только когда загрузился именно наш арт (иначе мелькает баннер GameStores)
    if (!img.hasAttribute('data-hr-ready') && !img._hrWait) {
      img._hrWait = true;
      var ready = function () { img.setAttribute('data-hr-ready', ''); };
      if (img.complete && img.naturalWidth && img.getAttribute('src') === want) ready();
      else { img.addEventListener('load', function on() { if (img.getAttribute('src') === want) { img.removeEventListener('load', on); ready(); } }); setTimeout(ready, 8000); }
    }

    var box = img.parentNode;
    if (box.querySelector('.hr-plate')) return;
    var steps = HR.bonuses.map(function (b) {
      return '<div class="hr-step"><b>' + b[1] + '</b><span>' + b[0] + '</span></div>';
    }).join('');
    var plate = el('<div class="hr-plate">' +
      '<div class="hr-plate__addr"><span class="hr-label">Адрес сервера</span>' +
        '<button type="button" class="hr-plate__ip" aria-label="Скопировать адрес сервера ' + HR.connect + '">' + HR.connect + icon('copy') + '</button></div>' +
      (HR.bonuses.length ? '<div class="hr-plate__bonus"><span class="hr-label">Бонус к пополнению</span><div class="hr-steps">' + steps + '</div></div>' : '') +
    '</div>');
    plate.querySelector('.hr-plate__ip').addEventListener('click', copyConnect);
    box.appendChild(plate);
    embers(box);
    watchScroll(box);
  }

  // шапка твердеет, когда баннер почти уехал
  function watchScroll(box) {
    if (!('IntersectionObserver' in window)) return;
    var mark = document.createElement('div');
    mark.style.cssText = 'position:absolute;left:0;bottom:120px;width:1px;height:1px;pointer-events:none;';
    box.appendChild(mark);
    new IntersectionObserver(function (e) {
      document.documentElement.classList.toggle('hr-scrolled', !e[0].isIntersecting);
    }).observe(mark);
  }

  // искры над баннером: атмосфера ада, только пока баннер на экране
  function embers(box) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var c = document.createElement('canvas');
    c.className = 'hr-embers';
    box.appendChild(c);
    var ctx = c.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, parts = [], on = true, last = 0;

    function size() {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, w / 22));
      parts = [];
      for (var i = 0; i < n; i++) parts.push(spawn(true));
    }
    function spawn(any) {
      return {
        x: Math.random() * w,
        y: any ? Math.random() * h : h + 10,
        r: .8 + Math.random() * 2.2,
        vy: .25 + Math.random() * .9,
        sway: Math.random() * 6.28,
        hue: 8 + Math.random() * 22,
        life: .35 + Math.random() * .65
      };
    }
    function tick(t) {
      if (!on) return;
      var dt = Math.min(48, t - (last || t)) / 16.7;
      last = t;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y -= p.vy * dt;
        p.sway += .02 * dt;
        p.x += Math.sin(p.sway) * .35 * dt;
        var a = Math.max(0, Math.min(1, p.y / h)) * p.life;
        if (p.y < -10) { parts[i] = spawn(false); continue; }
        ctx.beginPath();
        ctx.fillStyle = 'hsla(' + p.hue + ',100%,58%,' + a + ')';
        ctx.shadowColor = 'hsla(' + p.hue + ',100%,50%,' + a + ')';
        ctx.shadowBlur = 8;
        ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    size();
    window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        var vis = e[0].isIntersecting;
        if (vis && !on) { on = true; last = 0; requestAnimationFrame(tick); }
        on = vis;
      }).observe(c);
    }
    requestAnimationFrame(tick);
  }

  function connectBtn() {
    var menu = document.querySelector('.PlayerMenu-module__wrapper');
    if (!menu || menu.querySelector('.hr-connect')) return;
    var btn = el('<button type="button" class="hr-connect" aria-label="Скопировать адрес сервера ' + HR.connect + '">Скопировать IP</button>');
    btn.addEventListener('click', copyConnect);
    menu.insertBefore(btn, menu.firstChild);
  }

  function social() {
    var aside = document.querySelector('.Widgets-module__wrapper');
    if (!aside || !HR.social.length || aside.querySelector('.hr-social')) return;
    var links = HR.social.map(function (s) {
      return '<a class="hr-social__link" href="' + s.url + '" target="_blank" rel="noopener"><span class="hr-social__ico">' + icon(s.icon) + '</span>' +
        '<span><span class="hr-social__name">' + s.name + '</span><span class="hr-social__hint">' + s.hint + '</span></span>' +
        icon('arrow') + '</a>';
    }).join('');
    aside.appendChild(el('<section class="Widgets-module__widgetWrapper hr-social-wrap"><h2 class="boxHeader">Сообщество</h2><div class="hr-social">' + links + '</div></section>'));
  }

  // ---------- левая колонка: промокод и вайпы ----------
  function copyText(text, ok, failMsg) {
    var fail = function () { toast(failMsg); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { toast(ok); }, fail);
    else fail();
  }
  function promo() {
    var aside = document.querySelector('.Widgets-module__wrapper');
    var P = HR.promo;
    if (!aside || !P || !P.code || aside.querySelector('.hr-promo')) return;
    var w = el('<section class="Widgets-module__widgetWrapper hr-promo-wrap"><h2 class="boxHeader">Промокод</h2>' +
      '<div class="hr-promo">' +
        '<button type="button" class="hr-promo__code" aria-label="Скопировать промокод ' + P.code + '"><span>' + P.code + '</span>' + icon('copy') + '</button>' +
        '<p class="hr-promo__text">' + P.text + ' ' + (P.until || '') + '</p>' +
        '<a class="hr-promo__go" href="/profile" title="После входа: Профиль, блок «Использование промокода»">Ввести в профиле' + icon('arrow') + '</a>' +
      '</div></section>');
    w.querySelector('.hr-promo__code').addEventListener('click', function () {
      copyText(P.code, 'Промокод скопирован. Вставьте его в профиле, в поле «Имя промокода»', 'Не удалось скопировать, промокод: ' + P.code);
    });
    aside.appendChild(w);
  }

  // глобальный вайп Rust: первый четверг месяца, ≈22:00 МСК (19:00 UTC)
  function firstThursday(y, m) {
    var d = new Date(Date.UTC(y, m, 1, 19, 0));
    while (d.getUTCDay() !== 4) d.setUTCDate(d.getUTCDate() + 1);
    return d;
  }
  function wipeList(now) {
    var W = HR.wipes || {}, out = [];
    if (W.global) {
      var y = now.getUTCFullYear(), m = now.getUTCMonth();
      for (var k = 0; k < 3; k++) out.push({ at: firstThursday(y, m + k), kind: 'Глобальный вайп' });
    }
    (W.map || []).forEach(function (s) {
      var a = String(s).match(/^(\d{4})-(\d\d)-(\d\d)[ T](\d\d):(\d\d)/);
      if (a) out.push({ at: new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4] - 3, +a[5])), kind: 'Вайп карты' });
    });
    // вайп считается идущим ещё 2 часа после начала
    return out.filter(function (w) { return w.at.getTime() + 2 * 3600e3 > now.getTime(); })
      .sort(function (a, b) { return a.at - b.at; });
  }
  var MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  function mskDate(d) {
    var m = new Date(d.getTime() + 3 * 3600e3);
    return { day: m.getUTCDate(), mon: MON[m.getUTCMonth()], wd: WD[m.getUTCDay()], hh: m.getUTCHours(), mm: m.getUTCMinutes() };
  }
  function until(ms) {
    if (ms <= 0) return 'Идёт сейчас';
    var min = Math.floor(ms / 60e3), d = Math.floor(min / 1440), h = Math.floor(min % 1440 / 60), mi = min % 60;
    if (d) return d + ' ' + plural(d, 'день', 'дня', 'дней') + ' ' + h + ' ч';
    if (h) return h + ' ч ' + mi + ' мин';
    return mi + ' мин';
  }
  function wipeRender(box) {
    var now = new Date(), l = wipeList(now);
    if (!l.length) { box.innerHTML = '<p class="hr-wipe__when">Дат пока нет</p>'; return; }
    var n = l[0], d = mskDate(n.at), time = (d.hh < 10 ? '0' : '') + d.hh + ':' + (d.mm < 10 ? '0' : '') + d.mm;
    var approx = n.kind === 'Глобальный вайп' ? '≈' : '';
    var rest = l.slice(1, 3).map(function (w) { var x = mskDate(w.at); return '<li>' + x.day + ' ' + x.mon + ', ' + x.wd + (w.kind === 'Вайп карты' ? ', карта' : '') + '</li>'; }).join('');
    var t = mskDate(now), day = (t.day === d.day && t.mon === d.mon) ? 'сегодня' : d.day + ' ' + d.mon + ', ' + d.wd;
    var html = '<p class="hr-wipe__left"><span class="hr-sr">До вайпа: </span>' + until(n.at - now) + '</p>' +
      '<p class="hr-wipe__when">' + n.kind + ' ' + day + ', ' + approx + time + ' МСК</p>' +
      (rest ? '<ul class="hr-wipe__next" aria-label="Следующие вайпы">' + rest + '</ul>' : '') +
      (HR.wipes.note ? '<p class="hr-wipe__note">' + HR.wipes.note + '</p>' : '');
    if (box._h !== html) { box._h = html; box.innerHTML = html; }
  }
  function wipes() {
    var aside = document.querySelector('.Widgets-module__wrapper');
    var W = HR.wipes;
    if (!aside || !W || (!W.global && !(W.map || []).length) || aside.querySelector('.hr-wipe')) return;
    var w = el('<section class="Widgets-module__widgetWrapper hr-wipe-wrap"><h2 class="boxHeader">Вайп</h2><div class="hr-wipe"></div></section>');
    aside.appendChild(w);
    var box = w.querySelector('.hr-wipe');
    wipeRender(box);
    if (!wipes.t) wipes.t = setInterval(function () { var b = document.querySelector('.hr-wipe'); if (b && !document.hidden) wipeRender(b); }, 60e3);
  }

  // зерно камня: один маленький тайл шума, рисуем на canvas один раз и кладём фоном на каменные поверхности
  function grain() {
    if (grain.done) return;
    grain.done = true;
    try {
      var N = 128, c = document.createElement('canvas');
      c.width = c.height = N;
      var x = c.getContext('2d'), d = x.createImageData(N, N), p = d.data, seed = 7;
      for (var i = 0; i < p.length; i += 4) {
        seed = (seed * 16807) % 2147483647;
        var r = seed / 2147483647, light = r > .5;
        var v = light ? 255 : 0;
        p[i] = p[i + 1] = p[i + 2] = v;
        p[i + 3] = Math.round((light ? (r - .5) : (.5 - r)) * 2 * (light ? 7.5 : 12));
      }
      x.putImageData(d, 0, 0);
      document.documentElement.style.setProperty('--hr-grain', 'url("' + c.toDataURL('image/png') + '")');
    } catch (e) {}
  }

  // число по-русски: «10 000», «1500», копейки только если они не ,00. Пробел неразрывный
  function num(v) {
    var m = String(v).replace(/[\s\u00a0]/g, '').match(/^(\d+)(?:[.,](\d+))?$/);
    if (!m) return null;
    var int = m[1].length > 4 ? m[1].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') : m[1];
    return m[2] && /[1-9]/.test(m[2]) ? int + ',' + m[2] : int;
  }
  // «10000 RUB» → «10 000 ₽», «x10000» → «×10 000»
  function prices() {
    document.querySelectorAll('.Product-module__price span, .Product-module__count, .TotalSum-module__currency').forEach(function (n) {
      if (n.children.length) return;
      var t = n.textContent, r = t;
      var p = t.match(/^\s*([\d.,\s\u00a0]+?)\s*(RUB|₽)?\s*$/);
      var c = t.match(/^\s*[x×]\s*([\d\s\u00a0]+)\s*$/);
      if (/^\s*RUB\s*$/.test(t)) r = '₽';
      else if (c && num(c[1])) r = '×' + num(c[1]);
      else if (p && num(p[1])) r = num(p[1]) + (p[2] ? '\u00a0₽' : '');
      if (r !== t) n.textContent = r;
    });
  }

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
  }

  // каталог из того же API, что читает шаблон: категория каждого предмета и сколько их в категории
  var CAT = null;
  function loadCatalog() {
    if (CAT || loadCatalog.busy || !window.fetch) return;
    loadCatalog.busy = true;
    fetch('/api/v1/products.list', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) {
      var d = j && j.data;
      if (!d || !d.products) return;
      var names = {}, byProduct = {}, counts = {}, all = 0, prod = {};
      d.categories.forEach(function (c) { names[c.id] = c.name; counts[c.id] = 0; });
      d.products.forEach(function (p) {
        byProduct[p.id] = p.categoryId;
        var base = +p.price || 0, disc = +p.discount || 0;
        prod[p.id] = { cat: p.categoryId, name: String(p.name || ''), price: +(base - base / 100 * disc).toFixed(2), sale: disc > 0, amount: +p.amount || 1, all: p.shownInAll !== false };
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
        if (p.shownInAll !== false) all++;
      });
      counts[0] = all;
      var feat = {};
      d.categories.forEach(function (c) {
        HR.featured.forEach(function (f, i) {
          if (f.name.trim().toLowerCase() === String(c.name).trim().toLowerCase()) feat[c.id] = { look: f.look, order: i - HR.featured.length };
        });
      });
      CAT = { names: names, byProduct: byProduct, counts: counts, feat: feat, prod: prod };
      apply();
    }).catch(function () { loadCatalog.busy = false; });
  }

  // число предметов рядом с каждой категорией
  function catCounts() {
    if (!CAT) return;
    var counts = CAT.counts;
    if (fActive()) {
      counts = { 0: 0 };
      Object.keys(CAT.prod).forEach(function (id) {
        var d = CAT.prod[id];
        if (counts[d.cat] == null) counts[d.cat] = 0;
        if (!passes(d)) return;
        counts[d.cat]++;
        if (d.all) counts[0]++;
      });
      Object.keys(CAT.counts).forEach(function (c) { if (counts[c] == null) counts[c] = 0; });
    }
    document.querySelectorAll('.Categories-module__category').forEach(function (b) {
      var n = counts[b.getAttribute('data-categoryid')];
      var v = n == null ? '' : String(n);
      if (b.getAttribute('data-hr-n') !== v) b.setAttribute('data-hr-n', v);
      var id = b.getAttribute('data-categoryid'), f = CAT.feat[id];
      var o = id === '0' ? '-100' : f ? String(f.order) : '';
      if (b.style.order !== o) b.style.order = o;
    });
  }

  // заголовки групп внутри витрины: «Оружие ── 36 предметов, от 5 до 150 ₽».
  // Узлы React не трогаем, только ставим свои заголовки перед первым предметом группы и чиним их после перерисовки.
  function groups() {
    var grid = document.querySelector('.Products-module__wrapper');
    if (!grid || !CAT) return;
    var tiles = grid.querySelectorAll('.Product-module__wrapper');
    // Шаблон сортирует товары по индексу общим списком, поэтому одна категория может идти вперемешку
    // с другими. Собираем группы по категории, а визуально сводим их вместе через CSS order.
    // Внутри группы порядок задаёт сортировка, отфильтрованные плитки прячем атрибутом data-hr-off.
    var list = [], byCat = {}, shown = 0;
    tiles.forEach(function (t, idx) {
      var id = t.getAttribute('data-productid'), c = CAT.byProduct[id], api = CAT.prod[id] || {};
      var ps = t.querySelectorAll('.Product-module__price > span'), p = ps[ps.length - 1];
      var v = p ? parseFloat(p.textContent.replace(/[^\d.,]/g, '').replace(',', '.')) : NaN;
      var nm = t.querySelector('.Product-module__name');
      var d = {
        t: t, idx: idx,
        price: isNaN(v) ? (api.price || 0) : v,
        sale: !!api.sale || !!t.querySelector('.Product-module__discount'),
        amount: api.amount || (t.querySelector('.Product-module__count') ? 2 : 1),
        name: api.name || (nm ? nm.textContent : '')
      };
      d.on = passes(d);
      var g = byCat[c];
      if (!g) { g = byCat[c] = { cat: c, first: t, n: 0, min: Infinity, max: -Infinity, items: [] }; list.push(g); }
      g.items.push(d);
      if (d.on) { g.n++; shown++; g.min = Math.min(g.min, d.price); g.max = Math.max(g.max, d.price); }
    });
    // группы: витринные сверху в порядке HR.featured, остальные как пришли
    list.forEach(function (g, i) { var f = CAT.feat[g.cat]; g.feat = f; g.rank = f ? f.order * 1000 : i + 1; });
    list.slice().sort(function (a, b) { return a.rank - b.rank; }).forEach(function (g, k) { g.ord = (k + 1) * 1000; });
    var want = new Map();
    list.forEach(function (g) {
      if (g.cat == null || !CAT.names[g.cat]) return;
      var price = !g.n ? '' : g.min === g.max ? ', ' + num(g.min) + ' ₽' : ', от ' + num(g.min) + ' до ' + num(g.max) + ' ₽';
      g.meta = g.feat ? price.slice(2) : g.n + ' ' + plural(g.n, 'предмет', 'предмета', 'предметов') + price;
      g.key = g.cat + '|' + g.meta;
      want.set(g.first, g);
    });
    grid.querySelectorAll(':scope > .hr-group').forEach(function (h) {
      var g = want.get(h.nextElementSibling);
      if (!g || h.getAttribute('data-key') !== g.key) h.remove();
    });
    want.forEach(function (g, tile) {
      var prev = tile.previousElementSibling;
      if (prev && prev.classList.contains('hr-group')) return;
      var h = el('<div class="hr-group"><h3 class="hr-group__name"></h3><span class="hr-group__rule" aria-hidden="true"></span><span class="hr-group__meta"></span></div>');
      h.setAttribute('data-key', g.key);
      h.firstChild.textContent = CAT.names[g.cat];
      h.lastChild.textContent = g.meta;
      grid.insertBefore(h, tile);
    });
    var cmp = {
      'price-asc': function (a, b) { return a.price - b.price || a.idx - b.idx; },
      'price-desc': function (a, b) { return b.price - a.price || a.idx - b.idx; },
      'name': function (a, b) { return a.name.localeCompare(b.name, 'ru') || a.idx - b.idx; },
      'sale': function (a, b) { return (b.sale - a.sale) || a.idx - b.idx; }
    }[F.sort] || function (a, b) { return a.idx - b.idx; };
    var top = null;
    list.forEach(function (g) {
      var h = g.first.previousElementSibling;
      if (h && h.classList.contains('hr-group')) {
        var o = String(g.ord);
        if (h.style.order !== o) h.style.order = o;
        if (g.feat) h.setAttribute('data-hr-feat', g.feat.look); else h.removeAttribute('data-hr-feat');
        toggleAttr(h, 'data-hr-off', !g.n);
        if (g.n && (!top || g.ord < top.o)) top = { h: h, o: g.ord };
      }
      g.items.slice().sort(cmp).forEach(function (d, r) {
        var t = d.t, look = g.feat ? g.feat.look : null, o = String(g.ord + 1 + r);
        if (t.getAttribute('data-hr-feat') !== look) { if (look) t.setAttribute('data-hr-feat', look); else t.removeAttribute('data-hr-feat'); }
        if (t.style.order !== o) t.style.order = o;
        toggleAttr(t, 'data-hr-off', !d.on);
      });
    });
    grid.querySelectorAll(':scope > .hr-group').forEach(function (h) { h.classList.toggle('hr-group--top', !!top && h === top.h); });
    // всё отфильтровано: своё пустое состояние с кнопкой сброса
    var none = grid.querySelector(':scope > .hr-nores');
    var empty = tiles.length > 0 && shown === 0;
    if (empty && !none) {
      none = el('<div class="hr-nores" role="status"><p class="hr-nores__title">Ничего не подходит</p><p class="hr-nores__text">Под выбранные фильтры здесь нет предметов.</p><button type="button" class="hr-nores__reset">Сбросить фильтры</button></div>');
      none.querySelector('button').addEventListener('click', resetFilters);
      grid.insertBefore(none, grid.firstChild);
    }
    if (none) toggleAttr(none, 'data-hr-off', !empty);
  }
  function toggleAttr(n, a, on) { if (on !== n.hasAttribute(a)) { if (on) n.setAttribute(a, ''); else n.removeAttribute(a); } }

  // ---------- сортировка и фильтры ----------
  // Выбор хранится в localStorage. Узлы React не двигаем: порядок через CSS order, скрытие атрибутом.
  var FKEY = 'hr-filter-1', F = { sort: '', min: '', max: '', sale: false, pack: '' };
  try { var sv = JSON.parse(localStorage.getItem(FKEY)); if (sv) Object.keys(F).forEach(function (k) { if (k in sv) F[k] = sv[k]; }); } catch (e) {}
  function saveF() { try { localStorage.setItem(FKEY, JSON.stringify(F)); } catch (e) {} }
  function fActive() { return F.min !== '' || F.max !== '' || !!F.sale || F.pack !== ''; }
  function fCount() { return (F.min !== '' || F.max !== '' ? 1 : 0) + (F.sale ? 1 : 0) + (F.pack !== '' ? 1 : 0); }
  function passes(d) {
    if (F.min !== '' && d.price < +F.min) return false;
    if (F.max !== '' && d.price > +F.max) return false;
    if (F.sale && !d.sale) return false;
    if (F.pack === 'single' && d.amount > 1) return false;
    if (F.pack === 'pack' && d.amount <= 1) return false;
    return true;
  }
  function resetFilters() {
    F.min = ''; F.max = ''; F.sale = false; F.pack = '';
    saveF(); syncTools(); apply();
  }
  var SORTS = [['', 'По умолчанию'], ['price-asc', 'Сначала дешёвые'], ['price-desc', 'Сначала дорогие'], ['name', 'По названию'], ['sale', 'Сначала со скидкой']];
  function syncTools() {
    var b = document.querySelector('.hr-tools');
    if (!b) return;
    b.querySelector('.hr-sort__select').value = F.sort;
    var i = b.querySelectorAll('.hr-price input');
    if (document.activeElement !== i[0]) i[0].value = F.min;
    if (document.activeElement !== i[1]) i[1].value = F.max;
    b.querySelector('.hr-check input').checked = !!F.sale;
    b.querySelectorAll('.hr-seg input').forEach(function (r) { r.checked = r.value === F.pack; });
    var n = fCount();
    b.querySelector('.hr-tools__n').textContent = n ? String(n) : '';
    toggleAttr(b, 'data-active', n > 0);
  }
  function tools() {
    var search = document.querySelector('.Shop-module__wrapper .Search-module__wrapper');
    if (!search) return;
    var b = document.querySelector('.hr-tools');
    if (b && b.previousElementSibling === search) return syncTools();
    if (b) { search.parentNode.insertBefore(b, search.nextSibling); return syncTools(); }
    b = el('<div class="hr-tools" role="group" aria-label="Сортировка и фильтры">' +
      '<label class="hr-sort"><span class="hr-sr">Сортировка</span><select class="hr-sort__select">' +
        SORTS.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') +
      '</select>' + icon('chev') + '</label>' +
      '<button type="button" class="hr-tools__toggle" aria-expanded="false" aria-controls="hr-filters">' + icon('filter') + 'Фильтры<b class="hr-tools__n"></b></button>' +
      '<div class="hr-filters" id="hr-filters">' +
        '<fieldset class="hr-price"><legend class="hr-sr">Цена, ₽</legend><span class="hr-price__label" aria-hidden="true">Цена</span>' +
          '<input type="text" inputmode="numeric" autocomplete="off" placeholder="от" aria-label="Цена от, ₽">' +
          '<input type="text" inputmode="numeric" autocomplete="off" placeholder="до" aria-label="Цена до, ₽"></fieldset>' +
        '<label class="hr-check"><input type="checkbox"><span>Со скидкой</span></label>' +
        '<fieldset class="hr-seg"><legend class="hr-sr">Количество в товаре</legend>' +
          '<label><input type="radio" name="hr-pack" value=""><span>Любое</span></label>' +
          '<label><input type="radio" name="hr-pack" value="single"><span>Поштучно</span></label>' +
          '<label><input type="radio" name="hr-pack" value="pack"><span>Пачками</span></label></fieldset>' +
        '<button type="button" class="hr-tools__reset">Сбросить</button>' +
      '</div></div>');
    var sel = b.querySelector('select');
    sel.addEventListener('change', function () { F.sort = sel.value; saveF(); apply(); });
    var pr = b.querySelectorAll('.hr-price input'), pt = 0;
    pr.forEach(function (inp) {
      inp.addEventListener('input', function () {
        var v = inp.value.replace(/[^\d]/g, '').slice(0, 7);
        if (inp.value !== v) inp.value = v;
        clearTimeout(pt);
        F.min = pr[0].value; F.max = pr[1].value; saveF();
        pt = setTimeout(apply, 250);
      });
    });
    b.querySelector('.hr-check input').addEventListener('change', function (e) { F.sale = e.target.checked; saveF(); apply(); });
    b.querySelectorAll('.hr-seg input').forEach(function (r) { r.addEventListener('change', function () { F.pack = r.value; saveF(); apply(); }); });
    b.querySelector('.hr-tools__reset').addEventListener('click', resetFilters);
    var tg = b.querySelector('.hr-tools__toggle');
    tg.addEventListener('click', function () {
      var open = !b.classList.contains('is-open');
      b.classList.toggle('is-open', open);
      tg.setAttribute('aria-expanded', String(open));
    });
    search.parentNode.insertBefore(b, search.nextSibling);
    syncTools();
  }

  // Иконки Rust нарисованы в разном масштабе, многие почти чёрные.
  // По каждой иконке считаем рамку силуэта и среднюю яркость, затем приводим к одному
  // зрительному размеру, ставим в центр и высветляем тёмные. Результат кэшируется.
  var FIT_KEY = 'hr-fit-2', FIT = {}, fitWait = {};
  try { FIT = JSON.parse(localStorage.getItem(FIT_KEY)) || {}; } catch (e) { FIT = {}; }
  function measure(im) {
    var N = 64, c = document.createElement('canvas');
    c.width = c.height = N;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(im, 0, 0, N, N);
    var d = x.getImageData(0, 0, N, N).data;
    var x0 = N, y0 = N, x1 = -1, y1 = -1, mass = 0, lum = 0;
    for (var i = 0; i < N * N; i++) {
      var a = d[i * 4 + 3] / 255;
      if (a < .16) continue;
      var px = i % N, py = (i / N) | 0;
      if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
      mass += a;
      lum += a * (.2126 * d[i * 4] + .7152 * d[i * 4 + 1] + .0722 * d[i * 4 + 2]) / 255;
    }
    if (x1 < 0) return [1, 0, 0, 1];
    var w = (x1 - x0 + 1) / N, h = (y1 - y0 + 1) / N, cover = mass / (N * N);
    // по длинной стороне и по площади: длинное оружие не мельчит, гранаты не раздуваются
    var s = Math.min(.9 / Math.max(w, h), Math.sqrt(.3 / cover));
    s = Math.max(.7, Math.min(1.8, s));
    var cx = (x0 + x1 + 1) / 2 / N - .5, cy = (y0 + y1 + 1) / 2 / N - .5;
    var L = lum / mass;
    var b = L < .34 ? Math.min(2.1, .34 / Math.max(L, .05)) : 1;
    return [+s.toFixed(3), +(-cx * s * 100).toFixed(1), +(-cy * s * 100).toFixed(1), +b.toFixed(2)];
  }
  function setFit(img, f) {
    var src = img.getAttribute('src');
    img.style.setProperty('--hr-s', f[0]);
    img.style.setProperty('--hr-x', f[1] + '%');
    img.style.setProperty('--hr-y', f[2] + '%');
    img.setAttribute('data-hr-fit', src);
    if (f[3] > 1.02) lit(src, f[3]);
  }

  // Тяжёлое (замер иконки, высветление) делаем только в свободное время кадра, по кусочку,
  // чтобы прокрутка не подтормаживала, пока догружаются иконки
  var Q = [], qOn = false;
  var ric = window.requestIdleCallback || function (cb) { return setTimeout(function () { cb({ timeRemaining: function () { return 8; } }); }, 60); };
  function idle(fn) { Q.push(fn); if (!qOn) { qOn = true; ric(drain); } }
  function drain(dl) {
    while (Q.length && dl.timeRemaining() > 4) { try { Q.shift()(); } catch (e) {} }
    if (Q.length) ric(drain); else qOn = false;
  }
  // высветление ещё и ждёт паузы в прокрутке: это украшение, его можно сделать на 200 мс позже
  var LQ = [], lastScroll = 0, lOn = false;
  window.addEventListener('scroll', function () { lastScroll = Date.now(); }, { passive: true });
  function idleLit(fn) { LQ.push(fn); if (!lOn) { lOn = true; ric(drainLit); } }
  function drainLit(dl) {
    if (Date.now() - lastScroll < 200) { setTimeout(function () { ric(drainLit); }, 200); return; }
    while (LQ.length && dl.timeRemaining() > 6) { try { LQ.shift()(); } catch (e) {} }
    if (LQ.length) ric(drainLit); else lOn = false;
  }

  // Тёмные иконки высветляем один раз на canvas и подставляем готовую картинку через CSS content.
  // Раньше это делал filter: brightness() на каждой из 320 иконок, и прокрутка грузила видеокарту.
  // src у React-картинки не трогаем: React о подмене не знает.
  var LIT = {};
  function setLit(src) {
    var u = LIT[src];
    if (!u || u === 1) return;
    document.querySelectorAll('img[src="' + src.replace(/["\\]/g, '\\$&') + '"]').forEach(function (n) {
      if (n.getAttribute('data-hr-lit') !== src && (n.classList.contains('Product-module__img') || n.classList.contains('productModalImg')) && !isPortrait(n)) {
        n.style.setProperty('--hr-lit', 'url("' + u + '")');
        n.setAttribute('data-hr-lit', src);
      }
    });
  }
  function makeLit(src, im, k) {
    var N = 192, c = document.createElement('canvas');
    c.width = c.height = N;
    var x = c.getContext('2d');
    if ('filter' in x) { x.filter = 'brightness(' + k + ')'; x.drawImage(im, 0, 0, N, N); }
    else {
      x.drawImage(im, 0, 0, N, N);
      var d = x.getImageData(0, 0, N, N), p = d.data;
      for (var i = 0; i < p.length; i += 4) { p[i] = Math.min(255, p[i] * k); p[i + 1] = Math.min(255, p[i + 1] * k); p[i + 2] = Math.min(255, p[i + 2] * k); }
      x.putImageData(d, 0, 0);
    }
    c.toBlob(function (b) { if (!b) return; LIT[src] = URL.createObjectURL(b); setLit(src); }, 'image/png');
  }
  function lit(src, k, im) {
    if (LIT[src]) return setLit(src);
    LIT[src] = 1;
    if (im) return idleLit(function () { makeLit(src, im, k); });
    var m = new Image();
    m.crossOrigin = 'anonymous';
    m.onload = function () { idleLit(function () { makeLit(src, m, k); }); };
    m.src = src;
  }
  function fitImg(img) {
    var src = img.getAttribute('src');
    if (!src || img.getAttribute('data-hr-fit') === src) return;
    if (FIT[src]) return setFit(img, FIT[src]);
    if (fitWait[src]) return;
    fitWait[src] = 1;
    var im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = function () {
      idle(function () {
        var f;
        try { f = measure(im); } catch (e) { f = [1, 0, 0, 1]; }
        FIT[src] = f;
        clearTimeout(fitImg.t);
        fitImg.t = setTimeout(function () { try { localStorage.setItem(FIT_KEY, JSON.stringify(FIT)); } catch (e) {} }, 400);
        if (f[3] > 1.02) lit(src, f[3], im);
        document.querySelectorAll('.Product-module__img, .productModalImg').forEach(function (n) { if (n.getAttribute('src') === src && !isPortrait(n)) setFit(n, f); });
      });
    };
    im.src = src;
  }
  var fitIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) fitImg(e.target); });
  }, { rootMargin: '800px 0px' }) : null;
  // портрет (привилегия) в карточке или в окне покупки: его не подгоняем как иконку
  function isPortrait(img) {
    if (img.closest('[data-hr-feat="portrait"]')) return true;
    var m = img.closest('[data-modalproductid]');
    var f = m && CAT && CAT.feat[CAT.byProduct[m.getAttribute('data-modalproductid')]];
    var on = !!(f && f.look === 'portrait');
    if (m) m.classList.toggle('hr-modal-portrait', on);
    return on;
  }
  // кадр картинки можно задать прямо в ссылке: ...webp#pos=30% 20% (это object-position)
  function crops() {
    document.querySelectorAll('.Product-module__img, .productModalImg').forEach(function (img) {
      var m = (img.getAttribute('src') || '').match(/#pos=([^&]+)/);
      var v = '';
      if (m) { try { v = decodeURIComponent(m[1]); } catch (e) { v = m[1]; } v = v.replace(/[^\d.% a-z-]/gi, ''); }
      if (img.style.objectPosition !== v) img.style.objectPosition = v;
    });
  }
  // портрету подгонка и высветление не нужны; если успели примениться до загрузки каталога — снимаем
  function unfit(img) {
    if (!img.hasAttribute('data-hr-fit') && !img.hasAttribute('data-hr-lit')) return;
    ['--hr-s', '--hr-x', '--hr-y', '--hr-lit'].forEach(function (p) { img.style.removeProperty(p); });
    img.removeAttribute('data-hr-fit');
    img.removeAttribute('data-hr-lit');
  }
  function icons() {
    if (!CAT) return; // пока каталог не загружен, не знаем, где портреты, а где иконки
    document.querySelectorAll('.Product-module__img, .productModalImg').forEach(function (img) {
      if (isPortrait(img)) return unfit(img);
      var src = img.getAttribute('src');
      if (FIT[src]) { if (img.getAttribute('data-hr-fit') !== src) setFit(img, FIT[src]); return; }
      if (img._hrSeen) { if (img._hrSeen !== src) fitImg(img); return; }
      img._hrSeen = src;
      if (fitIO) fitIO.observe(img); else fitImg(img);
    });
  }

  // Привилегии: слой с тлеющими искрами в каждой карточке-портрете. Двигает его CSS (только transform),
  // здесь только вставка и пауза: анимация идёт, пока карточка на экране и вкладка открыта.
  var heatIO = null;
  function heatSync(h) {
    var on = !!h._hrVis && !document.hidden;
    if (on !== h.hasAttribute('data-on')) { if (on) h.setAttribute('data-on', ''); else h.removeAttribute('data-on'); }
  }
  function heat() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!heatIO && 'IntersectionObserver' in window) {
      heatIO = new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.target._hrVis = e.isIntersecting; heatSync(e.target); });
      });
      document.addEventListener('visibilitychange', function () { document.querySelectorAll('.hr-heat').forEach(heatSync); });
    }
    document.querySelectorAll('.hr-heat').forEach(function (h) {
      if (!h.parentNode.matches('[data-hr-feat="portrait"]')) { if (heatIO) heatIO.unobserve(h); h.remove(); }
    });
    document.querySelectorAll('.Product-module__wrapper[data-hr-feat="portrait"]').forEach(function (c, i) {
      var h = c.querySelector(':scope > .hr-heat');
      if (!h) {
        h = el('<i class="hr-heat" aria-hidden="true"><i></i><i></i></i>');
        c.appendChild(h);
        if (heatIO) heatIO.observe(h); else { h._hrVis = true; heatSync(h); }
      }
      var s = String(i % 4);
      if (h.style.getPropertyValue('--hr-seed') !== s) h.style.setProperty('--hr-seed', s);
    });
  }

  // пустая выдача: шаблонное «Данных нет» заменяем на понятный текст; первая строка станет заголовком
  function emptyState() {
    var e = document.querySelector('.Shop-module__wrapper .errorMessage');
    if (!e || e.children.length) return;
    var i = document.querySelector('.Search-module__input');
    var t = i && i.value.trim()
      ? 'Ничего не нашлось\nНазвания предметов на английском, например Assault Rifle.'
      : 'Здесь пока пусто\nВ этой категории нет предметов. Остальные в разделе «Все».';
    if (e.textContent !== t) e.textContent = t;
  }

  // в поиске названия на английском: подсказываем это сразу
  function searchHint() {
    var i = document.querySelector('.Search-module__input');
    var t = window.matchMedia('(max-width: 600px)').matches ? 'Поиск по названию на английском' : 'Название на английском, например Assault Rifle';
    if (i && i.getAttribute('placeholder') !== t) i.setAttribute('placeholder', t);
    if (i && i.getAttribute('aria-label') !== 'Поиск предмета') i.setAttribute('aria-label', 'Поиск предмета');
  }

  // Левая колонка (оглавление + сервер + сообщество) всегда едет одним куском.
  // Это два разных узла шаблона, поэтому липнут оба, с общим смещением. Влезает в экран — липнет сверху под шапкой;
  // не влезает — липнет низом к краю экрана, чтобы был виден весь столбец целиком по мере прокрутки.
  function stick() {
    var cats = document.querySelector('.Categories-module__categories');
    var aside = document.querySelector('.Index-module__wrapper > .Widgets-module__wrapper');
    var root = document.documentElement;
    if (!cats || window.innerWidth <= 960) { root.classList.remove('hr-stick'); return; }
    var gap = 24, ch = cats.offsetHeight, ah = aside ? aside.offsetHeight + gap : 0;
    var top = Math.min(92, window.innerHeight - ch - ah - 24);
    root.classList.add('hr-stick');
    var ct = top + 'px', at = top + ch + gap + 'px';
    if (root.style.getPropertyValue('--hr-cats-top') !== ct) root.style.setProperty('--hr-cats-top', ct);
    if (root.style.getPropertyValue('--hr-aside-top') !== at) root.style.setProperty('--hr-aside-top', at);
  }

  // регион для озвучки создаём пустым заранее, иначе экранный диктор первое сообщение пропустит
  function toastRegion() {
    var t = document.querySelector('.hr-toast');
    if (!t) { t = el('<div class="hr-toast" role="status" aria-live="polite"></div>'); document.body.appendChild(t); }
    return t;
  }
  function toast(text) {
    var t = toastRegion();
    t.textContent = text;
    t.classList.add('is-on');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('is-on'); }, 3200);
  }

  function apply() {
    setVars();
    hero();
    connectBtn();
    grain();
    promo();
    wipes();
    social();
    toastRegion();
    prices();
    emptyState();
    loadCatalog();
    tools();
    catCounts();
    groups();
    crops();
    icons();
    heat();
    searchHint();
    stick();
  }

  // шаблон на React и перерисовывает блоки, поэтому следим и возвращаем свои
  var queued = false;
  function later() {
    if (queued) return;
    queued = true;
    setTimeout(function () { queued = false; apply(); }, 30);
  }
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true, characterData: true });
  // из пустой выдачи в пустую React узлы не меняет, только классы и значение поля: ловим ввод и клики
  document.addEventListener('input', later, true);
  document.addEventListener('click', later, true);
  window.addEventListener('resize', function () { hero(); stick(); });
  apply();
})();
