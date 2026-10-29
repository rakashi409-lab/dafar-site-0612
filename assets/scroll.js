/* 右侧品牌滚动线：贴边的红线随阅读进度伸长，前端一颗呼吸光点；滚动时光点亮起并拖出尾迹，
   滚到底整条转亮。系统滚动条已在 CSS 里收起，这条线可拖动定位，键盘 / 滚轮 / 触控板照常可用。
   （原生 ::-webkit-scrollbar 的伪元素不能做过渡，所以另画一层不拦截滚动的轨道。） */
(function () {
  var doc = document.documentElement;
  var rail = document.createElement('div');
  rail.className = 'sb-rail';
  rail.setAttribute('aria-hidden', 'true');
  rail.innerHTML = '<s></s><i></i><b></b>';
  document.body.appendChild(rail);

  var fill = rail.querySelector('i');
  var head = rail.querySelector('b');
  var idle = 0, ticking = false, max = 0;
  var slow = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function paint() {
    ticking = false;
    max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    rail.style.setProperty('--p', p.toFixed(4));
    /* 光头位置单独算：填充条被 scaleY 压扁，不能靠它定位 */
    rail.style.setProperty('--y', Math.max(22, Math.round(p * window.innerHeight)) + 'px');
    rail.classList.toggle('at-end', max > 0 && p > 0.995);
    rail.style.display = max > 2 ? '' : 'none';
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    if (slow) return;
    rail.classList.add('moving');
    clearTimeout(idle);
    idle = setTimeout(function () { rail.classList.remove('moving'); }, 380);
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', paint, { passive: true });
  /* 内容高度变化（图片加载、列表注入）也要重算 */
  if (window.ResizeObserver) new ResizeObserver(paint).observe(document.body);

  /* 拖动定位：按住右侧这条线上下拖，按比例跳到对应位置 */
  var dragging = false, prevBehavior = '';
  function seek(clientY) {
    if (max <= 0) return;
    var p = Math.min(1, Math.max(0, clientY / window.innerHeight));
    window.scrollTo(0, p * max);
  }
  rail.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    dragging = true;
    prevBehavior = doc.style.scrollBehavior;
    doc.style.scrollBehavior = 'auto';   /* 拖拽要跟手，取消平滑滚动 */
    rail.classList.add('drag');
    rail.setPointerCapture(e.pointerId);
    seek(e.clientY);
    e.preventDefault();
  });
  rail.addEventListener('pointermove', function (e) {
    if (dragging) seek(e.clientY);
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    rail.classList.remove('drag');
    doc.style.scrollBehavior = prevBehavior;
    if (rail.hasPointerCapture && rail.hasPointerCapture(e.pointerId)) rail.releasePointerCapture(e.pointerId);
  }
  rail.addEventListener('pointerup', endDrag);
  rail.addEventListener('pointercancel', endDrag);

  paint();
})();
