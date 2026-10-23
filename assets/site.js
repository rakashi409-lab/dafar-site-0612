/* ==========================================================================
   大方设计 DAFAR DESIGN — 子页面共用交互
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 导航滚动态 ---------- */
  var nav = document.getElementById('nav');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 30);
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端抽屉 ---------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      toggle.classList.toggle('active');
      menu.classList.toggle('open');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        toggle.classList.remove('active');
        menu.classList.remove('open');
      }
    });
  }

  /* ---------- 滚动揭示 ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  var REVEAL = '.reveal,.reveal-l,.reveal-r,.reveal-sc';
  document.querySelectorAll(REVEAL).forEach(function (el) { io.observe(el); });

  /* 动态插入的卡片（新闻列表 / 岗位 / 证书）也要能进场 */
  new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      Array.prototype.forEach.call(m.addedNodes, function (n) {
        if (n.nodeType !== 1) return;
        if (n.matches && n.matches(REVEAL)) io.observe(n);
        if (n.querySelectorAll) n.querySelectorAll(REVEAL).forEach(function (el) { io.observe(el); });
      });
    });
  }).observe(document.body, { childList: true, subtree: true });

  /* ---------- 标题进场 ---------- */
  var headIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      e.target.classList.toggle('in', e.isIntersecting);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.sec-head').forEach(function (el) { headIO.observe(el); });

  /* ---------- 离屏暂停无限动画 ---------- */
  var animIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('anim-paused', !e.isIntersecting); });
  }, { rootMargin: '120px 0px' });
  document.querySelectorAll('.section,.sub-hero,.news-wrap,.article-sec,.about-intro,.contact-sec,.jobs-sec,.form-sec')
    .forEach(function (el) { animIO.observe(el); });

  /* ---------- 弹窗 ---------- */
  var modal = document.getElementById('modal');
  window.openModal = function (title, text, img, wide) {
    if (!modal) return;
    document.getElementById('modalTitle').textContent = title || '';
    document.getElementById('modalText').textContent = text || '';
    var box = document.getElementById('modalImg');
    box.innerHTML = '';
    if (img) {
      var im = document.createElement('img');
      im.src = img; im.alt = title || '';
      box.appendChild(im);
      modal.firstElementChild.classList.toggle('wide', !!wide);
    } else {
      box.textContent = '大方设计';
    }
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  window.closeModal = function () {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };
  if (modal) {
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }

  /* ---------- 职位手风琴 ---------- */
  document.querySelectorAll('.job-head').forEach(function (head) {
    head.addEventListener('click', function () {
      var job = head.closest('.job');
      var body = job.querySelector('.job-body');
      var isOpen = job.classList.contains('open');
      document.querySelectorAll('.job.open').forEach(function (o) {
        if (o !== job) {
          o.classList.remove('open');
          o.querySelector('.job-body').style.maxHeight = '';
        }
      });
      job.classList.toggle('open', !isOpen);
      body.style.maxHeight = isOpen ? '' : body.scrollHeight + 'px';
    });
  });

  /* ---------- 访客轨迹 ---------- */
  var VISIT = {};
  (function () {
    function fmt(d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' '
        + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
    var now = new Date();
    var cnt = 1, first = fmt(now);
    try {
      cnt = (parseInt(localStorage.getItem('df_visits') || '0', 10) || 0) + 1;
      localStorage.setItem('df_visits', String(cnt));
      first = localStorage.getItem('df_first') || first;
      localStorage.setItem('df_first', first);
    } catch (e) { }

    var ref = document.referrer, src = '直接访问（输入网址/书签）';
    if (ref) {
      try {
        var h = new URL(ref).hostname;
        if (h.indexOf('baidu') > -1) src = '百度搜索';
        else if (h.indexOf('google') > -1) src = 'Google 搜索';
        else if (h.indexOf('bing') > -1) src = '必应搜索';
        else if (h.indexOf('sogou') > -1) src = '搜狗搜索';
        else if (location.hostname && h === location.hostname) src = '站内跳转';
        else src = '外部链接：' + h;
      } catch (e) { src = '外部链接'; }
    }
    var ua = navigator.userAgent;
    if (ua.indexOf('MicroMessenger') > -1) src += '（微信内打开）';
    var dev = /Mobi|Android|iPhone|iPad/i.test(ua) ? '移动端' : '电脑端';
    var brw = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox'
      : /Safari\//.test(ua) ? 'Safari' : '其他浏览器';

    /* 板块浏览顺序：节点上写 data-sec="板块名" */
    var viewed = [];
    var SEC = {};
    document.querySelectorAll('[data-sec]').forEach(function (el) {
      var id = 'sec-' + Object.keys(SEC).length + '-' + Math.random().toString(36).slice(2, 6);
      el.id = el.id || id;
      SEC[el.id] = el.getAttribute('data-sec');
    });
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) {
          var n = SEC[en.target.id];
          if (n && viewed.indexOf(n) < 0) viewed.push(n);
        }
      });
    }, { threshold: 0.35 });
    Object.keys(SEC).forEach(function (id) { var el = document.getElementById(id); if (el) secIO.observe(el); });

    VISIT = {
      enter: now, fmt: fmt, count: cnt, first: first, src: src, dev: dev, brw: brw, viewed: viewed,
      stay: function () {
        var s = Math.round((new Date() - this.enter) / 1000);
        return s < 60 ? s + ' 秒' : Math.floor(s / 60) + ' 分 ' + (s % 60) + ' 秒';
      }
    };
    window.VISIT = VISIT;

    try {
      var vid = localStorage.getItem('df_vid');
      if (!vid) { vid = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem('df_vid', vid); }
      var payload = JSON.stringify({ src: src, dev: dev, brw: brw, n: cnt, vid: vid, page: location.pathname + location.search });
      var sendTrack = function () {
        return fetch('https://dafar-visit-tracker.dafar-design.workers.dev/track', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, body: payload
        });
      };
      sendTrack().catch(function () { setTimeout(function () { sendTrack().catch(function () { }); }, 4000); });
    } catch (e) { }
  })();

  /* ---------- 表单 → 飞书群提醒 ---------- */
  var FEISHU_WEBHOOK = 'https://open.feishu.cn/open-apis/bot/v2/hook/9de97622-80a6-4dc8-9de2-49c4d5387d02';

  window.submitForm = async function (e) {
    e.preventDefault();
    var f = e.target;
    var btn = f.querySelector('.submit');
    var val = function (n) { return (f[n] && f[n].value || '').trim(); };
    var name = val('name'), phone = val('phone'), msg = val('msg'), topic = val('topic');
    btn.disabled = true;
    var btnText = btn.textContent;
    btn.textContent = '提交中…';
    var time = VISIT.fmt(new Date());
    var pageName = document.body.dataset.page || '子页面';
    var visitBrief = '进入 ' + VISIT.fmt(VISIT.enter) + '，浏览 ' + VISIT.stay() + '，第' + VISIT.count + '次来访，来源 ' + VISIT.src
      + '，' + VISIT.dev + '·' + VISIT.brw + '，看过：' + (VISIT.viewed.length ? VISIT.viewed.join('→') : '直达表单');
    var notified = false;
    try {
      var res = await fetch(FEISHU_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msg_type: 'post',
          content: { post: { zh_cn: {
            title: '🔔 官网咨询 — 新的商务合作意向（' + pageName + '）',
            content: [
              [{ tag: 'text', text: '👤 姓名：' + name }],
              [{ tag: 'text', text: '📞 电话：' + phone }],
              (topic ? [{ tag: 'text', text: '🏷 咨询方向：' + topic }] : [{ tag: 'text', text: '🧭 所在页面：' + pageName }]),
              [{ tag: 'text', text: '📝 需求：' + msg }],
              [{ tag: 'text', text: '🕐 提交时间：' + time }],
              [{ tag: 'text', text: '──── 该客户的访问记录 ────' }],
              [{ tag: 'text', text: '🚪 本次进入官网：' + VISIT.fmt(VISIT.enter) + '，提交前已浏览 ' + VISIT.stay() }],
              [{ tag: 'text', text: '🔁 第 ' + VISIT.count + ' 次来访（首次来访 ' + VISIT.first + '）' }],
              [{ tag: 'text', text: '🔗 来源：' + VISIT.src }],
              [{ tag: 'text', text: '📱 设备：' + VISIT.dev + ' · ' + VISIT.brw }],
              [{ tag: 'text', text: '👁 浏览过的板块：' + (VISIT.viewed.length ? VISIT.viewed.join(' → ') : '（直达表单）') }]
            ]
          } } }
        })
      });
      var data = await res.json().catch(function () { return {}; });
      notified = res.ok && data.code === 0;
    } catch (err) { }

    var archived = false;
    try {
      var r2 = await fetch('https://dafar-visit-tracker.dafar-design.workers.dev/consult', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ name: name, phone: phone, msg: msg, visit: visitBrief, notified: notified })
      });
      var d2 = await r2.json().catch(function () { return {}; });
      archived = r2.ok && d2.ok;
      if (!notified && d2.forwarded) notified = true;
    } catch (err) { }

    if (notified || archived) {
      openModal('提交成功 ✓', '感谢您的咨询，' + name + '！我们已收到您的需求，将尽快通过 ' + phone + ' 与您联系。');
      f.reset();
    } else {
      openModal('提交失败', '抱歉，网络异常导致提交失败，请稍后重试，或直接致电 027-87666138 与我们联系。');
    }
    btn.disabled = false;
    btn.textContent = btnText;
    return false;
  };

  /* ---------- 数字滚动 ---------- */
  var numIO = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      var target = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || '';
      var dur = 1400, t0 = null;
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        var ease = 1 - Math.pow(1 - p, 3);
        el.childNodes[0].nodeValue = Math.round(target * ease);
        if (p < 1) requestAnimationFrame(step);
        else el.childNodes[0].nodeValue = target;
      }
      requestAnimationFrame(step);
      numIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat b[data-count]').forEach(function (el) { numIO.observe(el); });
})();
