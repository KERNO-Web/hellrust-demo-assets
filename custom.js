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
      { name: 'Услуги', look: 'portrait' }
      // вид 'item' (предмет на прозрачном фоне) тоже готов: { name: 'Кейсы', look: 'item' }
    ],

    // окно услуги при клике: плюшки справа от арта и наборы сеткой.
    // Главный способ — поле «Описание» товара в админке, клиент правит его сам (формат в docs/perks-howto.md):
    //   Название плюшки | подпись мелким | значение      (подпись можно пропустить: Название | значение)
    //   # Название набора | каждые 12 ч
    //   Assault Rifle x1                                  (английское название, как у товаров магазина, или id предмета Rust)
    // Запасной способ — здесь, ключ = название товара: { perks: [[имя, подпись, значение]], kits: [{ name, every, items: [[предмет, кол-во]] }] }
    perks: {},

    // кнопка уведомлений о рейдах в плашке под баннером (IP копируется кнопкой в шапке).
    // url пустой = кнопка видна, по клику пишет, что скоро появится. Когда будет бот — вставить ссылку на него
    raid: { title: 'Уведомления о рейдах', label: 'Подключить уведомления', url: '', soon: 'Уведомления о рейдах скоро появятся' },

    // категории, которые не показываем во вкладках (имя как в админке). Удалить их совсем можно в админке → Категории
    hiddenCategories: ['Праздники', 'Фермерство', 'Машины', 'DLC'],

    // фильтры цены, «со скидкой» и «поштучно/пачками». false = остаются только поиск и сортировка
    filters: false,

    // стартовый промокод в левой колонке; пустой code = блок не показывается
    promo: { code: 'HELLSTART', text: 'Скидка 10% на товары.', until: 'До\u00a031.12.2026.' },

    // вайпы. global: глобальный вайп Rust, первый четверг месяца, ≈22:00 МСК.
    // map: вайпы карты этого сервера, время по Москве: ['2026-11-12 18:00', ...]. Пусто = показываем только глобальный.
    wipes: { global: true, map: [], note: '' },

    // вкладки «Статистика» и «Баны» в шапке рядом с «Магазином», адреса /#stats и /#bans.
    // url: адрес JSON, который отдаёт плагин сервера (с заголовком CORS). Пусто = показываем пример данных с пометкой.
    // stats: [{ name, steamid, kills, deaths, hours, farm }]
    // bans:  [{ name, steamid, reason, admin, at: '2026-11-03 18:20', until: '2026-12-03 18:20' или '' (навсегда) }], время по Москве
    pages: {
      stats: { title: 'Статистика', url: '' },
      bans: { title: 'Баны', url: '' }
    },

    // порядок = порядок на сайте. Пустой url = строка видна, но не кликается (ждём ссылку от клиента)
    social: [
      { name: 'Discord', hint: 'Чат и поддержка', url: 'https://discord.gg/hmFeNxWrGc', icon: 'ds' },
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

  // копирование IP с анимацией: «Скопировать IP» → «Скопировано» → сам адрес (до перезагрузки). Нажатие на адрес снова копирует
  function copyFlow(btn) {
    var face = btn.querySelector('.hr-copy__face'), t = 0;
    var live = document.querySelector('.hr-copy-live');
    if (!live) { live = el('<span class="hr-sr hr-copy-live" aria-live="polite"></span>'); document.body.appendChild(live); }
    function show(state, iconName, text) {
      btn.setAttribute('data-state', state);
      face.innerHTML = (iconName ? icon(iconName) : '') + '<span class="hr-copy__txt">' + esc(text) + '</span>';
      face.classList.remove('is-in'); void face.offsetWidth; face.classList.add('is-in');
    }
    btn.addEventListener('click', function () {
      var ok = function () {
        clearTimeout(t);
        show('copied', 'check', 'Скопировано');
        live.textContent = 'Скопировано. Открой консоль в игре на F1 и вставь';
        t = setTimeout(function () { show('ip', '', HR.connect); btn.setAttribute('aria-label', 'Скопировать адрес сервера ' + HR.connect); }, 1200);
      };
      var fail = function () { clearTimeout(t); show('ip', '', HR.connect); toast('Не удалось скопировать, адрес: ' + HR.connect); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText('client.connect ' + HR.connect).then(ok, fail);
      else fail();
    });
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
    l.href = window.matchMedia('(max-width: 960px)').matches ? HR.bannerMobile : HR.banner;
    document.head.appendChild(l);
  })();

  function hero() {
    var img = document.querySelector('.Banner-module__img');
    if (!img) return;
    var want = window.matchMedia('(max-width: 960px)').matches ? HR.bannerMobile : HR.banner;
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
      (HR.raid && HR.raid.label ? '<div class="hr-plate__addr"><span class="hr-label">' + esc(HR.raid.title || 'Уведомления о рейдах') + '</span>' +
        (HR.raid.url
          ? '<a class="hr-plate__ip" href="' + esc(HR.raid.url) + '" target="_blank" rel="noopener">' + icon('bell') + esc(HR.raid.label) + '</a>'
          : '<button type="button" class="hr-plate__ip">' + icon('bell') + esc(HR.raid.label) + '</button>') +
        '</div>' : '') +
      (HR.bonuses.length ? '<div class="hr-plate__bonus"><span class="hr-label">Бонус к пополнению</span><div class="hr-steps">' + steps + '</div></div>' : '') +
    '</div>');
    var rb = plate.querySelector('button.hr-plate__ip');
    if (rb) rb.addEventListener('click', function () { toast(HR.raid.soon); });
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
    // Раньше каждая искра рисовалась с shadowBlur на холсте ×2 — это давало рывки при прокрутке, пока баннер на экране.
    // Теперь свечение рисуется один раз в маленькие спрайты (по оттенкам), а кадр — это только drawImage. Холст в 1×: искры мягкие, чёткость не нужна.
    var ctx = c.getContext('2d'), dpr = 1;
    var w = 0, h = 0, parts = [], on = true, last = 0;
    var SPR = 32, sprites = [8, 15, 22, 30].map(function (hue) {
      var s = document.createElement('canvas'); s.width = s.height = SPR;
      var g = s.getContext('2d'), r = SPR / 2, grd = g.createRadialGradient(r, r, 0, r, r, r);
      grd.addColorStop(0, 'hsla(' + hue + ',100%,72%,1)');
      grd.addColorStop(.22, 'hsla(' + hue + ',100%,58%,.9)');
      grd.addColorStop(.5, 'hsla(' + hue + ',100%,50%,.25)');
      grd.addColorStop(1, 'hsla(' + hue + ',100%,50%,0)');
      g.fillStyle = grd; g.fillRect(0, 0, SPR, SPR);
      return s;
    });

    function size() {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(60, w / 24));
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
        spr: Math.floor(Math.random() * 4),
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
        if (a < .02) continue;
        var d = p.r * 7;
        ctx.globalAlpha = a;
        ctx.drawImage(sprites[p.spr], p.x - d / 2, p.y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
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
    var btn = el('<button type="button" class="hr-connect" data-state="idle" aria-label="Скопировать адрес сервера"><span class="hr-copy__face"><span class="hr-copy__txt">Скопировать IP</span></span></button>');
    copyFlow(btn);
    menu.insertBefore(btn, menu.firstChild);
  }

  function social() {
    var aside = document.querySelector('.Widgets-module__wrapper');
    if (!aside || !HR.social.length || document.querySelector('.hr-social')) return;
    var links = HR.social.map(function (s) {
      var inner = '<span class="hr-social__ico">' + icon(s.icon) + '</span>' +
        '<span><span class="hr-social__name">' + s.name + '</span><span class="hr-social__hint">' + s.hint + '</span></span>' +
        icon('arrow');
      return s.url
        ? '<a class="hr-social__link" href="' + s.url + '" target="_blank" rel="noopener">' + inner + '</a>'
        : '<div class="hr-social__link">' + inner + '</div>';
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
    if (!aside || !P || !P.code || document.querySelector('.hr-promo')) return;
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

  // На телефоне левая колонка живёт в шторке меню (бургер), а не внизу страницы.
  // Свои блоки (промокод, вайп, сообщество) переносим туда целиком и возвращаем на широком экране.
  // Мониторинг — узел React, его не двигаем: в шторке зеркало с названием и онлайном, обновляется на каждом apply().
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function drawer() {
    var body = document.querySelector('.PlayerMenuMobile-module__body');
    var aside = document.querySelector('.Index-module__wrapper > .Widgets-module__wrapper');
    if (!body || !aside) return;
    var btn = document.querySelector('.PlayerMenuMobile-module__mobileMenuBtn');
    var mobile = !!btn && getComputedStyle(btn).display !== 'none';
    document.documentElement.classList.toggle('hr-drawer-on', mobile);
    var d = body.querySelector('.hr-drawer');
    if (!d) { d = el('<div class="hr-drawer"></div>'); body.appendChild(d); }
    var parts = ['.hr-promo-wrap', '.hr-mon-wrap', '.hr-wipe-wrap', '.hr-social-wrap'];
    if (!d.querySelector('.hr-mon-wrap')) d.appendChild(el('<section class="hr-mon-wrap" hidden><h2 class="boxHeader">Сервер</h2><div class="hr-mon"></div></section>'));
    parts.forEach(function (sel) {
      var n = document.querySelector(sel);
      if (!n || sel === '.hr-mon-wrap') return;
      var home = mobile ? d : aside;
      if (n.parentNode !== home) home.appendChild(n);
    });
    // порядок в шторке как в колонке
    var want = parts.map(function (sel) { return d.querySelector(':scope > ' + sel); }).filter(Boolean);
    var ok = want.every(function (n, i) { return d.children[i] === n; });
    if (!ok) want.forEach(function (n) { d.appendChild(n); });
    // зеркало мониторинга
    var mon = d.querySelector('.hr-mon-wrap'), rows = [];
    document.querySelectorAll('.Widgets-module__wrapper .MonitoringServer-module__wrapper').forEach(function (s) {
      var nm = s.querySelector('.MonitoringServer-module__name'), inf = s.querySelector('.MonitoringServer-module__info > span');
      if (!nm || !inf) return;
      var t = inf.textContent.split('/');
      rows.push('<div class="hr-mon__row"><span class="hr-mon__name">' + esc(nm.textContent) + '</span><span class="hr-mon__n">' +
        esc((t[0] || '').trim()) + '<i>/</i>' + esc((t[1] || '').trim()) + '</span></div>');
    });
    var html = rows.join('');
    mon.hidden = !html;
    var box = mon.querySelector('.hr-mon');
    if (box._h !== html) { box._h = html; box.innerHTML = html; }
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
    if (!aside || !W || (!W.global && !(W.map || []).length) || document.querySelector('.hr-wipe')) return;
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
        p[i + 3] = Math.round((light ? (r - .5) : (.5 - r)) * 2 * (light ? 6 : 9.6));
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
      var catPos = {};
      d.categories.forEach(function (c, i) { names[c.id] = c.name; counts[c.id] = 0; catPos[c.id] = i; });
      d.products.forEach(function (p) {
        byProduct[p.id] = p.categoryId;
        var base = +p.price || 0, disc = +p.discount || 0;
        prod[p.id] = { cat: p.categoryId, name: String(p.name || ''), price: +(base - base / 100 * disc).toFixed(2), sale: disc > 0, amount: +p.amount || 1, all: p.shownInAll !== false, img: p.img || '', about: p.about || '' };
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
      CAT = { names: names, byProduct: byProduct, counts: counts, feat: feat, prod: prod, catPos: catPos };
      apply();
    }).catch(function () { loadCatalog.busy = false; });
  }

  function isHiddenCat(name) {
    var n = String(name || '').trim().toLowerCase();
    return !!n && HR.hiddenCategories.some(function (h) { return h.trim().toLowerCase() === n; });
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
      toggleAttr(b, 'data-hr-off', isHiddenCat(CAT.names[id]));
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
    // группы: витринные сверху в порядке HR.featured, остальные в порядке категорий из админки (как вкладки),
    // а не по самому маленькому индексу товара внутри группы
    list.forEach(function (g, i) { var f = CAT.feat[g.cat], pos = CAT.catPos[g.cat]; g.feat = f; g.rank = f ? f.order * 1000 : (pos == null ? 500 + i : pos + 1); });
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
  // фильтры выключены: сохранённые раньше значения не должны прятать товары
  if (!HR.filters) { F.min = ''; F.max = ''; F.sale = false; F.pack = ''; }
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
    b = el('<div class="hr-tools' + (HR.filters ? '' : ' hr-tools--sort-only') + '" role="group" aria-label="Сортировка и фильтры">' +
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

  // Левая колонка (промокод, вайп, сервер, сообщество) едет одним куском. Влезает в экран — липнет сверху под шапкой;
  // не влезает — липнет низом к краю экрана, чтобы был виден весь столбец целиком по мере прокрутки.
  // Полоса категорий липнет под шапкой, но если переносится на 3 строки и больше, то нет: закроет пол-экрана.
  function stick() {
    var cats = document.querySelector('.Categories-module__categories');
    var aside = document.querySelector('.Index-module__wrapper > .Widgets-module__wrapper');
    var root = document.documentElement;
    if (window.innerWidth <= 960) { root.classList.remove('hr-stick'); root.classList.remove('hr-cats-tall'); return; }
    if (cats) root.classList.toggle('hr-cats-tall', cats.offsetHeight > 110);
    if (!aside) { root.classList.remove('hr-stick'); return; }
    var top = Math.min(92, window.innerHeight - aside.offsetHeight - 24);
    root.classList.add('hr-stick');
    var at = top + 'px';
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

  // ---------- вкладки «Статистика» и «Баны» ----------
  // Шаблон про них не знает, поэтому живут на главной по адресу /#stats и /#bans:
  // прячем магазин с левой колонкой и рисуем на их месте свой раздел.
  // шаблон при загрузке переписывает адрес и срезает #stats; запоминаем, с чем открыли, и возвращаем
  var BOOT = { hash: location.hash, t: Date.now() };
  var PG = { stats: { q: '', sort: 'kills', shown: 25 }, bans: { q: '', only: 'all', shown: 25 }, data: {}, busy: {} };
  var STAT_COLS = [['kills', 'Убийства'], ['deaths', 'Смерти'], ['kd', 'K/D'], ['farm', 'Добыто'], ['hours', 'В игре']];
  var STAT_SORTS = [['kills', 'Убийства'], ['kd', 'K/D'], ['farm', 'Добыча'], ['hours', 'Время']];
  var MON3 = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

  function pageNow() {
    var m = /^#(stats|bans)$/.exec(location.hash);
    return m && HR.pages && HR.pages[m[1]] && location.pathname === '/' ? m[1] : '';
  }
  function fmtN(n) { return Math.round(n).toLocaleString('ru-RU').replace(/\s/g, ' '); }
  function parseMsk(s) {
    var a = String(s || '').match(/^(\d{4})-(\d\d)-(\d\d)[ T](\d\d):(\d\d)/);
    return a ? new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4] - 3, +a[5])) : null;
  }
  function shortDate(d) {
    var x = mskDate(d);
    return x.day + ' ' + MON3[new Date(d.getTime() + 3 * 3600e3).getUTCMonth()] + ', ' + x.hh + ':' + (x.mm < 10 ? '0' : '') + x.mm;
  }

  // пример данных, пока плагин сервера не подключён. Числа одни и те же при каждом открытии
  function demoData(k) {
    var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var sid = function () { var t = '7656119'; for (var i = 0; i < 10; i++) t += Math.floor(rnd() * 10); return t; };
    var nicks = ['NightRaider', 'Шрам', 'dimon_krsk', 'ZERG', 'Kasper', 'tor4ok', 'Sanya_Rock', 'Hazard', 'm1ner', 'Volk',
      'Rekt', 'Lizzy', 'oldman', 'Карась', 'Gorilla', 'RaidBoss', 'Tolyan', 'PvPshnik', 'Kirpich', 'ghostik',
      'Ferrum', 'nomad', 'Белый', 'Junkyard', 'Медведь', 'Fox', 'Bandit', 'krot', 'Сварщик', 'Viper',
      'Mamont', 'roof_camper', 'Ezh', 'Barsik', 'Salo', 'HeliHunter', 'Grom', 'Тихий', 'Scrapper', 'Lynx',
      'Dyadya_Vasya', 'Ash', 'Kaban', 'Wolfram', 'Ржавый', 'Mute', 'Bober', 'Cobalt', 'Pchela', 'Frost',
      'Zhuk', 'Kerosin', 'Леший', 'Rocket', 'Shadow', 'Petrovich', 'Trapper', 'Noob', 'Kuzya', 'Sever'];
    if (k === 'stats') {
      return nicks.map(function (n) {
        var hours = 4 + Math.floor(Math.pow(rnd(), 1.6) * 260), skill = .3 + rnd() * 2.6;
        var deaths = 2 + Math.floor(hours * (.5 + rnd() * 1.4)), kills = Math.floor(deaths * skill * (.6 + rnd() * .8));
        return { name: n, steamid: sid(), kills: kills, deaths: deaths, hours: hours, farm: Math.floor(hours * (600 + rnd() * 2600)) };
      });
    }
    var reasons = ['Читы: аимбот', 'Читы: волхак', 'Макросы на отдачу', 'Обход бана', 'Тим больше лимита', 'Оскорбления администрации',
      'Реклама другого сервера', 'Багоюз: текстуры', 'Читы: аимбот', 'Тим больше лимита', 'Помеха проверке на читы', 'Макросы на отдачу',
      'Оскорбления игроков', 'Читы: спидхак', 'Багоюз: стены', 'Обход бана'];
    var lens = [0, 0, 30, 0, 7, 3, 7, 14, 0, 7, 0, 30, 1, 0, 14, 0], admins = ['Hellkeeper', 'Сатир', 'Hellkeeper', 'Лев'];
    var now = Date.now();
    return reasons.map(function (r, i) {
      var at = new Date(now - (i * 26 + rnd() * 20 + 3) * 3600e3), len = lens[i];
      var two = function (v) { return (v < 10 ? '0' : '') + v; };
      var iso = function (d) { var m = new Date(d.getTime() + 3 * 3600e3); return m.getUTCFullYear() + '-' + two(m.getUTCMonth() + 1) + '-' + two(m.getUTCDate()) + ' ' + two(m.getUTCHours()) + ':' + two(m.getUTCMinutes()); };
      return { name: nicks[(i * 7 + 3) % nicks.length] + (i % 3 ? '' : '_' + (i + 2)), steamid: sid(), reason: r, admin: admins[i % admins.length],
        at: iso(at), until: len ? iso(new Date(at.getTime() + len * 864e5)) : '' };
    });
  }

  function loadPage(k, box) {
    if (PG.data[k] || PG.busy[k]) return;
    var P = HR.pages[k];
    if (!P.url) { PG.data[k] = { rows: demoData(k), demo: true }; return; }
    PG.busy[k] = true;
    fetch(P.url).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      PG.data[k] = { rows: Array.isArray(j) ? j : (j.rows || j.items || []) };
    }).catch(function () { PG.data[k] = { rows: [], error: true }; }).then(function () {
      PG.busy[k] = false;
      var b = document.querySelector('.hr-page[data-page="' + k + '"]');
      if (b) renderPage(k, b);
    });
  }

  function buildPage(k) {
    var P = HR.pages[k], st = PG[k];
    var seg = k === 'stats'
      ? '<fieldset class="hr-seg"><legend class="hr-sr">Сортировка</legend>' + STAT_SORTS.map(function (o) {
          return '<label><input type="radio" name="hr-psort" value="' + o[0] + '"' + (st.sort === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>';
        }).join('') + '</fieldset>'
      : '<fieldset class="hr-seg"><legend class="hr-sr">Какие баны показать</legend>' + [['all', 'Все'], ['active', 'Действуют'], ['over', 'Истекли']].map(function (o) {
          return '<label><input type="radio" name="hr-ponly" value="' + o[0] + '"' + (st.only === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>';
        }).join('') + '</fieldset>';
    var box = el('<section class="hr-page" data-page="' + k + '" aria-labelledby="hr-page-h">' +
      '<div class="hr-page__head"><h1 class="hr-page__title" id="hr-page-h">' + esc(P.title) + '</h1><p class="hr-page__sub"></p></div>' +
      '<div class="hr-page__tools">' +
        '<label class="hr-page__search">' + icon('search') + '<span class="hr-sr">Поиск</span>' +
          '<input type="search" autocomplete="off" spellcheck="false" placeholder="Ник или SteamID"></label>' + seg +
      '</div>' +
      '<div class="hr-page__body"></div>' +
      '<button type="button" class="hr-page__more" hidden>Показать ещё</button>' +
      '<p class="hr-page__note" hidden></p>' +
    '</section>');
    var q = box.querySelector('input[type="search"]'), qt = 0;
    q.value = st.q;
    q.addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(function () { st.q = q.value.trim(); st.shown = 25; renderPage(k, box); }, 120); });
    box.querySelectorAll('.hr-seg input').forEach(function (r) {
      r.addEventListener('change', function () { if (k === 'stats') st.sort = r.value; else st.only = r.value; st.shown = 25; renderPage(k, box); });
    });
    box.querySelector('.hr-page__more').addEventListener('click', function () { st.shown += 25; renderPage(k, box); });
    return box;
  }

  function renderPage(k, box) {
    var D = PG.data[k], st = PG[k], body = box.querySelector('.hr-page__body');
    var sub = box.querySelector('.hr-page__sub'), more = box.querySelector('.hr-page__more'), note = box.querySelector('.hr-page__note');
    if (!D) { body.innerHTML = '<p class="hr-page__empty">Загружаем…</p>'; return; }
    note.hidden = !D.demo;
    note.textContent = D.demo ? 'Здесь пример данных. Таблица заполнится с сервера, когда подключим плагин.' : '';
    if (D.error) { body.innerHTML = '<p class="hr-page__empty">Не получилось загрузить данные с сервера. Обнови страницу через минуту.</p>'; more.hidden = true; sub.textContent = ''; return; }
    var q = st.q.toLowerCase(), hit = function (r) { return !q || String(r.name || '').toLowerCase().indexOf(q) > -1 || String(r.steamid || '').indexOf(q) > -1; };
    var html, list, total;
    if (k === 'stats') {
      var all = D.rows.map(function (r) {
        var o = { name: String(r.name || '—'), steamid: String(r.steamid || ''), kills: +r.kills || 0, deaths: +r.deaths || 0, hours: +r.hours || 0, farm: +r.farm || 0 };
        o.kd = o.deaths ? o.kills / o.deaths : o.kills;
        return o;
      }).sort(function (a, b) { return b[st.sort] - a[st.sort] || b.kills - a.kills; });
      all.forEach(function (r, i) { r.rank = i + 1; });
      sub.textContent = all.length + ' ' + plural(all.length, 'игрок', 'игрока', 'игроков') + ' за текущий вайп';
      list = all.filter(hit); total = list.length;
      var alt = st.sort === 'kills' ? 'kd' : 'kills';
      var cell = function (c, r) {
        var v = c === 'kd' ? r.kd.toFixed(2).replace('.', ',') : c === 'hours' ? fmtN(r.hours) + ' ч' : fmtN(r[c]);
        return '<td class="hr-num' + (c === st.sort ? ' is-on' : '') + (c === alt ? ' is-alt' : '') + '" data-label="' + STAT_COLS.filter(function (x) { return x[0] === c; })[0][1] + '">' + v + '</td>';
      };
      html = '<table class="hr-table hr-table--stats"><thead><tr><th class="hr-c-rank" scope="col">#</th><th scope="col">Игрок</th>' +
        STAT_COLS.map(function (c) {
          return '<th scope="col" class="hr-num' + (c[0] === st.sort ? ' is-on" aria-sort="descending' : '') + (c[0] === alt ? ' is-alt' : '') + '">' + c[1] + '</th>';
        }).join('') + '</tr></thead><tbody>' +
        list.slice(0, st.shown).map(function (r) {
          return '<tr' + (r.rank <= 3 ? ' class="is-top"' : '') + '><td class="hr-c-rank">' + r.rank + '</td>' +
            '<td class="hr-c-name"><b>' + esc(r.name) + '</b><span>' + esc(r.steamid) + '</span></td>' +
            STAT_COLS.map(function (c) { return cell(c[0], r); }).join('') + '</tr>';
        }).join('') + '</tbody></table>';
    } else {
      var now = Date.now();
      var rows = D.rows.map(function (r) {
        var at = parseMsk(r.at), un = r.until ? parseMsk(r.until) : null;
        return { name: String(r.name || '—'), steamid: String(r.steamid || ''), reason: String(r.reason || ''), admin: String(r.admin || ''),
          at: at, until: un, active: !un || un.getTime() > now };
      }).sort(function (a, b) { return (b.at ? b.at.getTime() : 0) - (a.at ? a.at.getTime() : 0); });
      var act = rows.filter(function (r) { return r.active; }).length;
      sub.textContent = 'Действуют ' + act + ' из ' + rows.length;
      list = rows.filter(function (r) { return hit(r) && (st.only === 'all' || (st.only === 'active') === r.active); }); total = list.length;
      html = '<table class="hr-table hr-table--bans"><thead><tr><th scope="col">Игрок</th><th scope="col">Причина</th><th scope="col">Срок</th><th scope="col">Выдан</th><th scope="col">Админ</th></tr></thead><tbody>' +
        list.slice(0, st.shown).map(function (r) {
          var term = !r.until ? 'Навсегда' : (r.active ? 'до ' : 'истёк ') + shortDate(r.until);
          return '<tr' + (r.active ? '' : ' class="is-over"') + '>' +
            '<td class="hr-c-name"><b>' + esc(r.name) + '</b><span>' + esc(r.steamid) + '</span></td>' +
            '<td class="hr-c-reason">' + esc(r.reason) + '</td>' +
            '<td class="hr-c-term' + (r.until ? '' : ' is-perm') + '">' + term + '</td>' +
            '<td class="hr-c-at" data-label="Выдан">' + (r.at ? shortDate(r.at) : '—') + '</td>' +
            '<td class="hr-c-admin" data-label="Админ">' + esc(r.admin || '—') + '</td></tr>';
        }).join('') + '</tbody></table>';
    }
    body.innerHTML = total ? html : '<p class="hr-page__empty">' + (st.q ? 'Никого не нашли по запросу «' + esc(st.q) + '».' : 'Пока пусто.') + '</p>';
    more.hidden = total <= st.shown;
  }

  function navTabs() {
    var cur = pageNow() || 'shop';
    document.querySelectorAll('.HeaderNav-module__wrapper').forEach(function (nav) {
      Object.keys(HR.pages || {}).forEach(function (k) {
        if (!nav.querySelector('[data-hr-tab="' + k + '"]')) nav.appendChild(el('<a class="HeaderNav-module__link hr-tab" data-hr-tab="' + k + '" href="/#' + k + '">' + esc(HR.pages[k].title) + '</a>'));
      });
      // ссылка из админки («Ссылки») с тем же названием, что наш раздел, — заглушка под него: прячем, чтобы не было двойных пунктов
      var ours = Object.keys(HR.pages || {}).map(function (k) { return HR.pages[k].title.trim().toLowerCase(); });
      nav.querySelectorAll('.HeaderNav-module__link:not([data-hr-tab])').forEach(function (a) {
        toggleAttr(a, 'data-hr-off', ours.indexOf(a.textContent.trim().toLowerCase()) >= 0);
      });
      nav.querySelectorAll('.HeaderNav-module__link').forEach(function (a) {
        var k = a.getAttribute('data-hr-tab') || (a.getAttribute('href') === '/' ? 'shop' : '');
        var on = !!k && k === cur && location.pathname === '/';
        toggleAttr(a, 'data-hr-on', on);
        if (on !== (a.getAttribute('aria-current') === 'page')) { if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
      });
    });
  }

  function route(scroll) {
    if (BOOT.hash && !location.hash && location.pathname === '/' && Date.now() - BOOT.t < 10000 && /^#(stats|bans)$/.test(BOOT.hash)) {
      history.replaceState(history.state, '', '/' + BOOT.hash);
    }
    var k = pageNow(), root = document.documentElement, wrap = document.querySelector('.Index-module__wrapper');
    navTabs();
    root.classList.toggle('hr-page-on', !!k && !!wrap);
    var box = wrap && wrap.querySelector(':scope > .hr-page');
    if (wrap && !k) route.seen = true;
    if (!k || !wrap) {
      if (box) box.remove();
      if (PG.title0 && / — Hell Rust$/.test(document.title)) document.title = PG.title0;
      return;
    }
    // открыли сайт сразу по ссылке /#stats: раздел ниже баннера, докручиваем к нему
    if (!route.seen) { route.seen = true; scroll = 'boot'; }
    if (!box || box.getAttribute('data-page') !== k) {
      if (box) box.remove();
      box = buildPage(k);
      wrap.appendChild(box);
      loadPage(k, box);
      renderPage(k, box);
    }
    var t = HR.pages[k].title + ' — Hell Rust';
    if (!/ — Hell Rust$/.test(document.title)) PG.title0 = document.title;
    if (document.title !== t) document.title = t;
    if (scroll) {
      // при загрузке шаблон сам прокручивает в начало, поэтому ждём его и едем без анимации
      var go = function () {
        var y = wrap.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: Math.max(0, y), behavior: scroll === 'boot' ? 'auto' : 'smooth' });
      };
      if (scroll === 'boot') setTimeout(go, 600); else go();
    }
  }
  // шаблон ставит свой заголовок вкладки браузера («Магазин»), на разделах возвращаем свой
  new MutationObserver(function () {
    var k = pageNow();
    if (k && document.querySelector('.hr-page')) { var t = HR.pages[k].title + ' — Hell Rust'; if (document.title !== t) { if (!/ — Hell Rust$/.test(document.title)) PG.title0 = document.title; document.title = t; } }
  }).observe(document.head, { childList: true, subtree: true, characterData: true });
  window.addEventListener('hashchange', function () { BOOT.hash = ''; route(true); });
  // роутер шаблона меняет адрес через history без событий: после каждой смены сверяем вкладку
  ['pushState', 'replaceState'].forEach(function (fn) {
    var orig = history[fn];
    history[fn] = function () { var r = orig.apply(this, arguments); setTimeout(function () { route(false); }, 0); return r; };
  });
  window.addEventListener('popstate', function () { setTimeout(function () { route(false); }, 0); });
  // «Магазин» — ссылка шаблона: роутер меняет адрес без hashchange, поэтому проверяем сами после клика.
  // В шторке на телефоне шаблон закрывает меню только по своим ссылкам, наши закрываем сами
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.HeaderNav-module__link');
    if (!a) return;
    BOOT.hash = '';
    var was = pageNow();
    if (a.hasAttribute('data-hr-tab') && location.pathname === '/') {
      var x = document.querySelector('.PlayerMenuMobile-module__menu .CrosseCloseBtn-module__btn');
      if (x && a.closest('.PlayerMenuMobile-module__nav')) x.click();
      if (location.hash === '#' + a.getAttribute('data-hr-tab')) { e.preventDefault(); route(true); }
      return;
    }
    if (!a.hasAttribute('data-hr-tab') && was) setTimeout(function () { route(false); var w = document.querySelector('.Index-module__wrapper'); if (w) window.scrollTo({ top: Math.max(0, w.getBoundingClientRect().top + window.pageYOffset - 100), behavior: 'smooth' }); }, 0);
  }, true);

  // ---------- окно услуги: плюшки и наборы из HR.perks ----------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function itemImg(spec) {
    if (typeof spec === 'number' || /^-?\d+$/.test(String(spec))) return 'https://cdn.gamestores.app/img/games/rust/' + spec + '.png';
    if (!CAT.imgByName) {
      CAT.imgByName = {};
      Object.keys(CAT.prod).forEach(function (id) { var d = CAT.prod[id]; if (d.img) CAT.imgByName[d.name.trim().toLowerCase()] = d.img; });
    }
    return CAT.imgByName[String(spec).trim().toLowerCase()] || '';
  }
  // описание товара из админки → { perks, kits }. Строки: «Имя | подпись | значение», «# Набор | каждые 12 ч», «Предмет x256»
  function parseAbout(html) {
    if (!html || !/[|#]/.test(html)) return null;
    var d = document.createElement('div');
    d.innerHTML = String(html).replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d)>/gi, '\n');
    var perks = [], kits = [], kit = null;
    d.textContent.split('\n').forEach(function (raw) {
      var l = raw.replace(/ /g, ' ').trim();
      if (!l) return;
      if (l.charAt(0) === '#') {
        var h = l.replace(/^#+\s*/, '').split('|');
        kit = { name: h[0].trim(), every: (h[1] || '').trim(), items: [] };
        kits.push(kit);
        return;
      }
      if (kit) {
        var m = l.replace(/\s*шт\.?$/i, '').match(/^(.+?)\s*(?:\||[x×х*])\s*(\d[\d\s]*)$/i) || l.match(/^(.+?)\s+(\d+)$/);
        if (m) kit.items.push([m[1].trim(), +m[2].replace(/\s/g, '')]); else kit.items.push([l, 1]);
        return;
      }
      if (l.indexOf('|') >= 0) {
        var c = l.split('|').map(function (x) { return x.trim(); });
        perks.push(c.length >= 3 ? [c[0], c[1], c.slice(2).join(' | ')] : [c[0], '', c[1]]);
      }
    });
    return perks.length || kits.length ? { perks: perks, kits: kits } : null;
  }
  function perksModal() {
    var m = document.querySelector('[data-modalproductid]');
    if (!m || !CAT) return;
    var id = m.getAttribute('data-modalproductid'), p = CAT.prod[id];
    var fromAbout = p ? parseAbout(p.about) : null;
    var cfg = fromAbout || (p && HR.perks[p.name]);
    m.classList.toggle('hr-modal-about', !!fromAbout);
    var old = m.querySelectorAll('.hr-perks, .hr-kits');
    if (old.length && m.getAttribute('data-hr-perks') === id) return;
    old.forEach(function (n) { n.remove(); });
    m.classList.toggle('hr-modal-perks', !!cfg);
    if (!cfg) { m.removeAttribute('data-hr-perks'); return; }
    var body = m.querySelector('.boxBody'), img = body && body.querySelector('.productModalImg');
    if (!body) return;
    m.setAttribute('data-hr-perks', id);
    if (cfg.perks && cfg.perks.length) {
      var list = el('<section class="hr-perks" aria-label="Что даёт"><ul class="hr-perks__list">' + cfg.perks.map(function (r) {
        return '<li class="hr-perk"><span class="hr-perk__text"><span class="hr-perk__name">' + esc(r[0]) + '</span>' +
          (r[1] ? '<span class="hr-perk__note">' + esc(r[1]) + '</span>' : '') + '</span>' +
          (r[2] ? '<span class="hr-perk__val">' + esc(r[2]) + '</span>' : '') + '</li>';
      }).join('') + '</ul></section>');
      if (img && img.nextSibling) body.insertBefore(list, img.nextSibling); else body.insertBefore(list, body.firstChild);
    }
    if (cfg.kits && cfg.kits.length) {
      var kits = el('<section class="hr-kits"><h3 class="hr-kits__title">Содержимое</h3>' + cfg.kits.map(function (k) {
        return '<div class="hr-kit"><div class="hr-kit__head"><span class="hr-kit__name">' + esc(k.name) + '</span>' +
          (k.every ? '<span class="hr-kit__every">' + esc(k.every) + '</span>' : '') + '</div><ul class="hr-kit__grid">' +
          (k.items || []).map(function (it) {
            var src = itemImg(it[0]), label = typeof it[0] === 'number' ? '' : String(it[0]);
            return '<li class="hr-kit__item" title="' + esc(label) + '">' +
              (src ? '<img src="' + esc(src) + '" alt="' + esc(label) + '" loading="lazy">' : '<span class="hr-kit__noimg">' + esc(label) + '</span>') +
              '<span class="hr-kit__qty">×' + esc(it[1] == null ? 1 : it[1]) + '</span></li>';
          }).join('') + '</ul></div>';
      }).join('') + '</section>');
      body.appendChild(kits);
    }
  }

  function apply() {
    setVars();
    hero();
    connectBtn();
    grain();
    promo();
    wipes();
    social();
    drawer();
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
    route(false);
    stick();
    perksModal();
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
  window.addEventListener('resize', function () { hero(); stick(); drawer(); });
  apply();
})();
