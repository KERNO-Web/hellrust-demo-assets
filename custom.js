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

  function hero() {
    var img = document.querySelector('.Banner-module__img');
    if (!img) return;
    var want = window.matchMedia('(max-width: 600px)').matches ? HR.bannerMobile : HR.banner;
    if (img.getAttribute('src') !== want) img.setAttribute('src', want);
    img.alt = 'Hell Rust';

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
      var names = {}, byProduct = {}, counts = {}, all = 0;
      d.categories.forEach(function (c) { names[c.id] = c.name; counts[c.id] = 0; });
      d.products.forEach(function (p) {
        byProduct[p.id] = p.categoryId;
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
      CAT = { names: names, byProduct: byProduct, counts: counts, feat: feat };
      apply();
    }).catch(function () { loadCatalog.busy = false; });
  }

  // число предметов рядом с каждой категорией
  function catCounts() {
    if (!CAT) return;
    document.querySelectorAll('.Categories-module__category').forEach(function (b) {
      var n = CAT.counts[b.getAttribute('data-categoryid')];
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
    var list = [], cur = null;
    tiles.forEach(function (t) {
      var c = CAT.byProduct[t.getAttribute('data-productid')];
      var ps = t.querySelectorAll('.Product-module__price > span'), p = ps[ps.length - 1];
      var v = p ? parseFloat(p.textContent.replace(/[^\d.,]/g, '').replace(',', '.')) : NaN;
      if (!cur || cur.cat !== c) { cur = { cat: c, first: t, n: 0, min: Infinity, max: -Infinity }; list.push(cur); }
      cur.n++;
      if (!isNaN(v)) { cur.min = Math.min(cur.min, v); cur.max = Math.max(cur.max, v); }
    });
    var want = new Map();
    list.forEach(function (g) {
      if (g.cat == null || !CAT.names[g.cat]) return;
      var price = !isFinite(g.min) ? '' : g.min === g.max ? ', ' + num(g.min) + '\u00a0₽' : ', от ' + num(g.min) + ' до ' + num(g.max) + '\u00a0₽';
      g.feat = CAT.feat[g.cat];
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
    // витринные группы встают наверх через CSS order: узлы React остаются на своих местах
    var top = null;
    list.forEach(function (g) {
      var h = g.first.previousElementSibling;
      if (!h || !h.classList.contains('hr-group')) return;
      var o = g.feat ? String(g.feat.order) : '';
      if (h.style.order !== o) h.style.order = o;
      if (g.feat) h.setAttribute('data-hr-feat', g.feat.look); else h.removeAttribute('data-hr-feat');
      if (!top || (g.feat ? g.feat.order : 0) < top.o) top = { h: h, o: g.feat ? g.feat.order : 0 };
    });
    grid.querySelectorAll(':scope > .hr-group').forEach(function (h) { h.classList.toggle('hr-group--top', !!top && h === top.h); });
    tiles.forEach(function (t) {
      var f = CAT.feat[CAT.byProduct[t.getAttribute('data-productid')]];
      var look = f ? f.look : null, o = f ? String(f.order) : '';
      if (t.getAttribute('data-hr-feat') !== look) { if (look) t.setAttribute('data-hr-feat', look); else t.removeAttribute('data-hr-feat'); }
      if (t.style.order !== o) t.style.order = o;
    });
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
    img.style.setProperty('--hr-s', f[0]);
    img.style.setProperty('--hr-x', f[1] + '%');
    img.style.setProperty('--hr-y', f[2] + '%');
    img.style.setProperty('--hr-b', f[3]);
    img.setAttribute('data-hr-fit', img.getAttribute('src'));
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
      var f;
      try { f = measure(im); } catch (e) { f = [1, 0, 0, 1]; }
      FIT[src] = f;
      clearTimeout(fitImg.t);
      fitImg.t = setTimeout(function () { try { localStorage.setItem(FIT_KEY, JSON.stringify(FIT)); } catch (e) {} }, 400);
      document.querySelectorAll('.Product-module__img, .productModalImg').forEach(function (n) { if (n.getAttribute('src') === src) setFit(n, f); });
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
  function icons() {
    document.querySelectorAll('.Product-module__img, .productModalImg').forEach(function (img) {
      if (isPortrait(img)) return;
      var src = img.getAttribute('src');
      if (FIT[src]) { if (img.getAttribute('data-hr-fit') !== src) setFit(img, FIT[src]); return; }
      if (img._hrSeen) { if (img._hrSeen !== src) fitImg(img); return; }
      img._hrSeen = src;
      if (fitIO) fitIO.observe(img); else fitImg(img);
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

  // левая колонка липнет целиком, только если помещается в экран
  function stick() {
    var cats = document.querySelector('.Categories-module__categories');
    var aside = document.querySelector('.Index-module__wrapper > .Widgets-module__wrapper');
    var root = document.documentElement;
    if (!cats || window.innerWidth <= 960) { root.classList.remove('hr-stick', 'hr-stick-toc'); return; }
    var top = 92, ch = cats.offsetHeight, ah = aside ? aside.offsetHeight + 40 : 0;
    var fits = top + ch + ah + 24 <= window.innerHeight;
    root.classList.toggle('hr-stick', fits);
    root.classList.toggle('hr-stick-toc', !fits && top + ch + 24 <= window.innerHeight);
    var v = top + ch + 40 + 'px';
    if (aside && root.style.getPropertyValue('--hr-aside-top') !== v) root.style.setProperty('--hr-aside-top', v);
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
    social();
    toastRegion();
    prices();
    emptyState();
    loadCatalog();
    catCounts();
    groups();
    crops();
    icons();
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
