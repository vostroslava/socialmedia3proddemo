(function(){
  const btns = document.querySelectorAll('.nav__btn');
  const sections = document.querySelectorAll('.product');

  function show(id){
    sections.forEach(s => s.classList.toggle('is-active', s.id===id));
    btns.forEach(b => b.classList.toggle('is-active', b.dataset.target===id));
    window.scrollTo({top:0, behavior:'auto'});
  }

  // expose for other parts (pain modal button etc.)
  window.showSection = show;

  btns.forEach(b => b.addEventListener('click', ()=>show(b.dataset.target)));

  /* =======================
     Copy utility (works on file://)
  ======================= */
  function fallbackCopy(text){
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly','');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try{
      document.execCommand('copy');
      return true;
    }catch(e){
      return false;
    }finally{
      document.body.removeChild(ta);
    }
  }

  function copyText(text, onOk){
    if(!text) return;
    // Modern clipboard (https/localhost)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(()=>{
        if(onOk) onOk();
      }).catch(()=>{
        const ok = fallbackCopy(text);
        if(ok && onOk) onOk();
        if(!ok) alert('Не удалось скопировать. Выдели текст вручную 🙂');
      });
      return;
    }
    // Offline fallback
    const ok = fallbackCopy(text);
    if(ok && onOk) onOk();
    if(!ok) alert('Не удалось скопировать. Выдели текст вручную 🙂');
  }

  // Buttons like: <button class="copybtn" data-copy="#id">Скопировать</button>
  document.querySelectorAll('.copybtn[data-copy]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const sel = btn.getAttribute('data-copy');
      const el = sel ? document.querySelector(sel) : null;
      const text = el ? (el.textContent || '') : '';
      const old = btn.textContent;
      copyText(text, ()=>{
        btn.textContent = 'Скопировано ✓';
        setTimeout(()=>btn.textContent = old, 900);
      });
    });
  });

  
  /* =======================
     Data helpers
  ======================= */
  function getPains(){
    // PAINS is declared in index.html (constructor script). In browsers, top-level const
    // is not always attached to window, so we access it safely.
    try{
      if (typeof PAINS !== 'undefined') return PAINS;
    }catch(e){}
    return window.PAINS || [];
  }

/* =======================
     Image Modal
  ======================= */
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modalImg');
  const modalCap = document.getElementById('modalCap');

  function openModal(src, cap){
    if(!modal) return;
    modalImg.src = src;
    modalCap.textContent = cap || '';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
  }
  function closeModal(){
    if(!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    modalImg.src = '';
  }

  document.querySelectorAll('.tile').forEach(img=>{
    img.addEventListener('click', ()=>{
      openModal(img.src, img.dataset.caption || '');
    });
  });

  if(modal){
    modal.addEventListener('click', (e)=>{
      if(e.target.dataset.close){ closeModal(); }
    });
  }

  /* =======================
     Pain Library (cards)
  ======================= */
  function renderPainLibrary(){
    const root = document.getElementById('painLibraryGrid');
    if(!root) return;
    const pains = getPains();
    if(!pains.length){
      root.innerHTML = '<div class="muted">PAINS не найдены. Проверьте, что конструктор загружается корректно.</div>';
      return;
    }

    root.innerHTML = pains.map(p=>{
      const mods = (p.modules || []).slice(0,6).map(n=>`#${n}`).join(' ');
      return `
        <div class="pain-card">
          <div class="pain-card__title">${p.emotion} ${p.title}</div>
          <div class="pain-card__why">${p.why}</div>
          <div class="pain-card__meta">Рекомендуемые модули: <span class="pain-card__mods">${mods}</span></div>
          <div class="pain-card__actions">
            <button class="pain-card__btn pain-card__btn--ghost" onclick="openPainModal('${p.id}')">Подробнее</button>
            <button class="pain-card__btn pain-card__btn--primary" onclick="choosePainAndGo('${p.id}')">Выбрать →</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render once on load
  renderPainLibrary();

  /* =======================
     Pain Modal (dynamic)
  ======================= */
  const painModal = document.getElementById('painModal');
  const painTitle = document.getElementById('painModalTitle');
  const painSubtitle = document.getElementById('painModalSubtitle');
  const painBody = document.getElementById('painModalBody');
  const painPickBtn = document.getElementById('painModalPickBtn');

  function escapeHtml(str){
    return (str||'').replace(/[&<>"']/g, (m)=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  function renderSection(sec){
    if(!sec) return '';
    let html = `<div class="pain-modal__section">`;
    html += `<div class="pain-modal__label">${escapeHtml(sec.title || '')}</div>`;

    if(sec.text){
      html += `<div class="pain-modal__text">${sec.text}</div>`;
    }
    if(Array.isArray(sec.bullets)){
      html += `<ul class="pm-ul">` + sec.bullets.map(b=>`<li>${escapeHtml(b)}</li>`).join('') + `</ul>`;
    }
    if(sec.angleIdeas){
      const map = sec.angleIdeas;
      const order = [
        {k:'empathy', t:'Эмпатия'},
        {k:'howto', t:'How‑to'},
        {k:'demo', t:'Демо'},
        {k:'template', t:'Шаблон'},
        {k:'proof', t:'Proof'},
        {k:'objection', t:'Возражение'},
      ];
      html += `<div class="pm-angles">` + order.map(o=>{
        const items = map[o.k] || [];
        if(!items.length) return '';
        return `
          <div class="pm-angle-card">
            <div class="pm-angle-card__h">${o.t}</div>
            <ul class="pm-ul pm-ul--tight">
              ${items.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}
            </ul>
          </div>
        `;
      }).join('') + `</div>`;
    }
    html += `</div>`;
    return html;
  }

  function buildPainHtml(painId){
    const details = (window.PAIN_DETAILS_RU || {})[painId];
    if(!details){
      return `<div class="pain-modal__section">
        <div class="pain-modal__label">Нет данных</div>
        <div class="pain-modal__text">Для этой боли пока не добавлено подробное описание. Добавьте её в <code>assets/pain-details.ru.js</code>.</div>
      </div>`;
    }
    return (details.sections || []).map(renderSection).join('');
  }

  window.openPainModal = function(painId){
    if(!painModal) return;

    const pains = getPains();
    const p = pains.find(x=>x.id===painId);
    const details = (window.PAIN_DETAILS_RU || {})[painId];

    painTitle.textContent = p ? `${p.emotion} ${p.title}` : 'Боль';
    painSubtitle.textContent = (details && details.subtitle) ? details.subtitle : (p ? p.why : '');

    painBody.innerHTML = buildPainHtml(painId);

    painModal.dataset.painId = painId;

    if(painPickBtn){
      painPickBtn.onclick = ()=> window.choosePainAndGo(painId);
    }

    painModal.classList.add('is-open');
    painModal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  };

  window.closePainModal = function(){
    if(!painModal) return;
    painModal.classList.remove('is-open');
    painModal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  };

  // Pick pain and jump to constructor
  window.choosePainAndGo = function(painId){
    // Close modal if open
    window.closePainModal();

    // Switch section
    show('constructor');

    // Pick pain inside constructor (if function exists)
    if(typeof window.pickPain === 'function'){
      try{ window.pickPain(painId); }catch(e){}
    }

    // Scroll to step 1
    setTimeout(()=>{
      const el = document.getElementById('bPain');
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    }, 120);
  };

  if(painModal){
    painModal.addEventListener('click', (e)=>{
      if(e.target.dataset.closePain){ window.closePainModal(); }
    });
  }

  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){
      closeModal();
      window.closePainModal();
    }
  });
})();