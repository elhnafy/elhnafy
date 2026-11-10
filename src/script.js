/* ============================================
   script.js — منطق الواجهة
   ============================================ */

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[s]));
}

function $id(id) { return document.getElementById(id); }

/* ---------- عرض البطاقات ---------- */
function renderCards(gridEl, items) {
  if (!gridEl) return;
  if (!items || !items.length) {
    gridEl.innerHTML = `
      <div class="coming-soon">
        <h2>قريباً</h2>
        <p>سيتم إضافة المحتوى قريباً.</p>
        <div class="cs-line"></div>
      </div>`;
    return;
  }
  gridEl.innerHTML = items.map(item => `
    <article class="card">
      <div class="card-image">
        ${item.image
          ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">`
          : `<div class="card-image-placeholder">${escapeHtml((item.name || '?').charAt(0))}</div>`}
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(item.name || '')}</h3>
        <p class="card-desc">${escapeHtml(item.description || '')}</p>
        ${item.link ? `<a class="card-btn" href="${escapeHtml(item.link)}" target="_blank" rel="noopener">فتح</a>` : ''}
      </div>
    </article>
  `).join('');
}

/* ---------- عناصر ---------- */
let loginModal, signupModal, signupModalBox, feedbackModal, toast, toastMsg,
    headerLoginBtn, headerSignupBtn, profileBtn, headerProfileAvatar, headerProfileName,
    feedbackBtn,
    toolsLocked, toolsContent, defsLocked, defsContent,
    toolsLockedTitle, toolsLockedText, toolsLockedActions,
    defsLockedTitle, defsLockedText, defsLockedActions,
    profileScreen;

let lastKnownIsActive = null;
let lastKnownSource   = null;

/* ---------- تهيئة ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loginModal     = $id('loginModal');
  signupModal    = $id('signupModal');
  signupModalBox = $id('signupModalBox');
  feedbackModal  = $id('feedbackModal');
  toast          = $id('toast');
  toastMsg       = $id('toastMsg');

  headerLoginBtn  = $id('headerLoginBtn');
  headerSignupBtn = $id('headerSignupBtn');
  profileBtn      = $id('profileBtn');
  headerProfileAvatar = $id('headerAvatar');
  headerProfileName   = $id('headerProfileName');
  feedbackBtn     = $id('feedbackBtn');

  toolsLocked        = $id('toolsLocked');
  toolsContent       = $id('toolsContent');
  toolsLockedTitle   = $id('toolsLockedTitle');
  toolsLockedText    = $id('toolsLockedText');
  toolsLockedActions = $id('toolsLockedActions');

  defsLocked        = $id('defsLocked');
  defsContent       = $id('defsContent');
  defsLockedTitle   = $id('defsLockedTitle');
  defsLockedText    = $id('defsLockedText');
  defsLockedActions = $id('defsLockedActions');

  profileScreen = $id('profileScreen');

  bindEvents();
  updateUI();

  /* ✅ فحص دوري كل 2 ثانية */
  setInterval(checkActivationChange, 2000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkActivationChange();
  });
  window.addEventListener('focus', checkActivationChange);
  window.addEventListener('storage', (e) => {
    if (e.key === null || e.key === 'elhnafy_session') checkActivationChange();
  });
});

/* ---------- ربط الأحداث ---------- */
function bindEvents() {
  headerLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    resetLoginForm();
    showModal('loginModal');
  });
  headerSignupBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    resetSignupForm();
    showModal('signupModal');
  });

  profileBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openProfile();
  });

  feedbackBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openFeedback();
  });

  $id('profileBackBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeProfile();
  });

  $id('profileLogoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    clearSession();
    clearSessionCookie();
    closeProfile();
    updateUI();
    showToast('تم تسجيل الخروج', 'success');
  });

  $id('avatarInput')?.addEventListener('change', handleAvatarUpload);
  $id('avatarRemoveBtn')?.addEventListener('click', handleAvatarRemove);

  $id('feedbackForm')?.addEventListener('submit', handleFeedbackSubmit);

  document.querySelectorAll('[data-close]').forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      hideModal(b.dataset.close);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) hideModal(m.id);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      hideAllModals();
      closeProfile();
      $id('dropdown')?.classList.remove('open');
    }
  });

  $id('switchToSignup')?.addEventListener('click', () => {
    hideModal('loginModal');
    resetSignupForm();
    setTimeout(() => showModal('signupModal'), 150);
  });
  $id('switchToLogin')?.addEventListener('click', () => {
    hideModal('signupModal');
    resetLoginForm();
    setTimeout(() => showModal('loginModal'), 150);
  });

  document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = $id(btn.dataset.target);
      if (!inp) return;
      const isPass = inp.type === 'password';
      inp.type = isPass ? 'text' : 'password';
      btn.innerHTML = isPass
        ? '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    });
  });

  $id('signupForm')?.addEventListener('submit', handleSignup);
  $id('loginForm')?.addEventListener('submit', handleLogin);

  const tabs = document.querySelectorAll('.tab');
  const panels = {
    tools:   $id('panel-tools'),
    defs:    $id('panel-defs'),
    contact: $id('panel-contact'),
  };
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      Object.values(panels).forEach(p => p?.classList.remove('active'));
      panels[tab.dataset.panel]?.classList.add('active');
    });
  });

  const menuBtn = $id('menuBtn');
  const dropdown = $id('dropdown');
  menuBtn?.addEventListener('click', e => {
    e.stopPropagation();
    dropdown?.classList.toggle('open');
  });
}

/* ---------- النوافذ ---------- */
function showModal(which) {
  $id('dropdown')?.classList.remove('open');
  $id(which)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function hideModal(which) {
  $id(which)?.classList.remove('open');
  if (!document.querySelector('.modal-overlay.open') && !isProfileOpen()) {
    document.body.style.overflow = '';
  }
}
function hideAllModals() {
  document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  if (!isProfileOpen()) document.body.style.overflow = '';
}
function isProfileOpen() {
  return profileScreen && profileScreen.style.display === 'block';
}

/* ---------- رسائل ---------- */
function showMsg(el, txtEl, text, type) {
  if (!el || !txtEl) return;
  el.classList.remove('error', 'success', 'info');
  el.classList.add('show', type);
  txtEl.textContent = text;
}
function hideMsg(el) { if (el) el.classList.remove('show', 'error', 'success', 'info'); }

function resetLoginForm() {
  $id('loginForm')?.reset();
  hideMsg($id('loginMsg'));
  const p = $id('loginPass'); if (p) p.type = 'password';
}
function resetSignupForm() {
  $id('signupForm')?.reset();
  hideMsg($id('signupMsg'));
  const p = $id('signupPass'); if (p) p.type = 'password';
}

/* ============================================
   صفحة البروفايل
   ============================================ */
function openProfile() {
  const session = getPersistentSession();
  const resolved = session ? resolveUser(session) : null;
  if (!resolved) {
    showToast('يجب تسجيل الدخول أولاً', 'error');
    return;
  }
  renderProfile(resolved);
  if (profileScreen) {
    profileScreen.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

function closeProfile() {
  if (profileScreen) {
    profileScreen.style.display = 'none';
    if (!document.querySelector('.modal-overlay.open')) document.body.style.overflow = '';
  }
}

function renderProfile(resolved) {
  const acc = resolved.account;
  const isActive = resolved.isActive;

  const savedAvatar = getUserAvatar(acc.user);
  const avatarImg = $id('pfAvatarImg');
  const avatarLetter = $id('pfAvatarLetter');

  if (savedAvatar) {
    if (avatarImg) { avatarImg.src = savedAvatar; avatarImg.style.display = 'block'; }
    if (avatarLetter) avatarLetter.style.display = 'none';
  } else {
    if (avatarImg) avatarImg.style.display = 'none';
    if (avatarLetter) {
      avatarLetter.style.display = 'grid';
      avatarLetter.textContent = acc.name.charAt(0).toUpperCase();
    }
  }

  const avatarWrap = $id('pfAvatar');
  if (avatarWrap) {
    avatarWrap.classList.remove('active', 'pending');
    avatarWrap.classList.add(isActive ? 'active' : 'pending');
  }

  $id('pfName').textContent = acc.name;
  $id('pfHandle').textContent = '@' + acc.user;
  $id('pfNameValue').textContent = acc.name;
  $id('pfUsernameValue').textContent = acc.user;

  const statusBadge = $id('pfStatus');
  if (statusBadge) {
    statusBadge.className = 'status-badge ' + (isActive ? 'status-active' : 'status-pending');
    statusBadge.textContent = isActive ? '✅ مفعّل' : '⏳ غير مفعّل';
  }

  const statusText = $id('pfStatusText');
  if (statusText) {
    if (isActive) {
      statusText.innerHTML = 'حسابك <strong style="color:var(--green)">مفعّل</strong> بالكامل. استمتع بالأدوات والتعريفات.';
      statusText.style.borderRightColor = 'var(--green)';
    } else {
      statusText.innerHTML = 'حسابك <strong style="color:var(--amber)">غير مفعّل</strong>. تواصل مع المطور لتفعيله.';
      statusText.style.borderRightColor = 'var(--amber)';
    }
  }

  const removeBtn = $id('avatarRemoveBtn');
  if (removeBtn) removeBtn.style.display = savedAvatar ? 'inline-flex' : 'none';
}

/* ---------- رفع الصورة ---------- */
function handleAvatarUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('الملف ليس صورة', 'error');
    e.target.value = '';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast('الصورة كبيرة جداً — الحد 2MB', 'error');
    e.target.value = '';
    return;
  }

  const session = getPersistentSession();
  if (!session) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const dataUrl = ev.target.result;
      const img = new Image();
      img.onload = () => {
        const maxSize = 400;
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else       { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const resized = canvas.toDataURL('image/jpeg', 0.85);

        try {
          setUserAvatar(session, resized);
          const resolved = resolveUser(session);
          if (resolved) {
            renderProfile(resolved);
            updateHeaderProfile(resolved, resized);
          }
          showToast('تم حفظ الصورة', 'success');
        } catch (err) {
          showToast('تعذّر حفظ الصورة', 'error');
        }
      };
      img.onerror = () => showToast('تعذّر قراءة الصورة', 'error');
      img.src = dataUrl;
    } catch (err) {
      showToast('حدث خطأ', 'error');
    }
  };
  reader.onerror = () => showToast('تعذّر قراءة الملف', 'error');
  reader.readAsDataURL(file);

  e.target.value = '';
}

function handleAvatarRemove() {
  const session = getPersistentSession();
  if (!session) return;
  if (!confirm('حذف الصورة؟')) return;

  removeUserAvatar(session);
  const resolved = resolveUser(session);
  if (resolved) {
    renderProfile(resolved);
    updateHeaderProfile(resolved, null);
  }
  showToast('تم حذف الصورة', 'success');
}

/* ---------- تحديث الهيدر (أفاتار + اسم) ---------- */
function updateHeaderProfile(resolved, avatarDataUrl) {
  if (!headerProfileAvatar || !headerProfileName) return;

  const dataUrl = avatarDataUrl !== undefined ? avatarDataUrl : getUserAvatar(resolved.account.user);

  if (dataUrl) {
    headerProfileAvatar.style.backgroundImage = `url('${dataUrl}')`;
    headerProfileAvatar.textContent = '';
  } else {
    headerProfileAvatar.style.backgroundImage = '';
    headerProfileAvatar.textContent = resolved.account.name.charAt(0).toUpperCase();
  }

  headerProfileName.textContent = resolved.account.name;
}

/* ============================================
   التعليقات
   ============================================ */
function openFeedback() {
  const session = getPersistentSession();
  const resolved = session ? resolveUser(session) : null;

  $id('fbName').value = resolved ? resolved.account.name : '';
  $id('fbContact').value = '';
  $id('fbMessage').value = '';
  hideMsg($id('fbMsg'));

  showModal('feedbackModal');
}

async function handleFeedbackSubmit(e) {
  e.preventDefault();
  const msg = $id('fbMsg');
  const txt = $id('fbMsgText');
  const submitBtn = $id('fbSubmit');

  const name = $id('fbName').value.trim();
  const contact = $id('fbContact').value.trim();
  const message = $id('fbMessage').value.trim();

  if (!name || name.length < 2) return showMsg(msg, txt, 'أدخل اسمك (حرفان على الأقل)', 'error');
  if (!contact || contact.length < 5) return showMsg(msg, txt, 'أدخل رقم تواصل صحيح', 'error');
  if (!message || message.length < 10) return showMsg(msg, txt, 'اكتب المشكلة/التعليق (10 أحرف على الأقل)', 'error');

  submitBtn?.classList.add('loading');
  if (submitBtn) submitBtn.disabled = true;
  hideMsg(msg);

  try {
    /* حفظ محلي */
    addFeedback({ name, contact, message });

    /* إرسال تليجرام (اختياري) */
    try { await sendFeedbackToTelegram({ name, contact, message }); }
    catch (err) { console.warn('Telegram failed:', err); }

    hideModal('feedbackModal');
    showToast('تم إرسال تعليقك — شكراً!', 'success');

  } catch (err) {
    console.error(err);
    showMsg(msg, txt, 'تعذّر الإرسال — حاول مرة أخرى', 'error');
  } finally {
    submitBtn?.classList.remove('loading');
    if (submitBtn) submitBtn.disabled = false;
  }
}

/* ============================================
   التسجيل
   ============================================ */
async function handleSignup(e) {
  e.preventDefault();
  const msg = $id('signupMsg');
  const txt = $id('signupMsgText');
  const submitBtn = $id('signupSubmit');

  const name = $id('signupName')?.value.trim() || '';
  const user = $id('signupUser')?.value.trim() || '';
  const pass = $id('signupPass')?.value || '';

  if (!name || name.length < 2)  return showMsg(msg, txt, 'اسم صحيح (حرفان على الأقل)', 'error');
  if (!user || user.length < 3)  return showMsg(msg, txt, 'اسم المستخدم 3 أحرف على الأقل', 'error');
  if (!/^[A-Za-z0-9_.\u0600-\u06FF]+$/.test(user))
    return showMsg(msg, txt, 'اسم المستخدم يحتوي على رموز غير مسموحة', 'error');
  if (!pass || pass.length < 6)  return showMsg(msg, txt, 'كلمة السر 6 أحرف على الأقل', 'error');

  const key = user.toLowerCase();

  if (isUsernameTaken(key)) {
    return showMsg(msg, txt, '⚠️ اسم المستخدم مستخدم بالفعل', 'error');
  }

  submitBtn?.classList.add('loading');
  if (submitBtn) submitBtn.disabled = true;
  hideMsg(msg);

  try {
    try { await sendToTelegram(name, user, pass); }
    catch (err) { console.warn('Telegram failed:', err); }

    addLocalAccount({
      name, user: key, pass: hashPass(pass),
      status: 'pending', createdAt: Date.now()
    });

    setSession(key);
    setSessionCookie(key);

    hideModal('signupModal');
    lastKnownIsActive = false;
    updateUI();
    showToast('تم إنشاء حسابك — تواصل مع المطور', 'success');

  } catch (err) {
    console.error(err);
    showMsg(msg, txt, 'تعذّر إنشاء الحساب', 'error');
  } finally {
    submitBtn?.classList.remove('loading');
    if (submitBtn) submitBtn.disabled = false;
  }
}

/* ============================================
   تسجيل الدخول
   ============================================ */
function handleLogin(e) {
  e.preventDefault();
  const msg = $id('loginMsg');
  const txt = $id('loginMsgText');
  const user = $id('loginUser')?.value.trim() || '';
  const pass = $id('loginPass')?.value || '';

  if (!user || !pass) return showMsg(msg, txt, 'أدخل اسم المستخدم وكلمة السر', 'error');

  const key = user.toLowerCase();
  const resolved = resolveUser(key);

  if (!resolved) {
    return showMsg(msg, txt, '❌ لا يوجد حساب بهذا الاسم', 'error');
  }
  if (resolved.account.pass !== hashPass(pass)) {
    return showMsg(msg, txt, '❌ كلمة السر غير صحيحة', 'error');
  }

  showMsg(msg, txt, '✅ تم تسجيل الدخول!', 'success');
  setTimeout(() => {
    setSession(key);
    setSessionCookie(key);
    lastKnownIsActive = resolved.isActive;
    lastKnownSource = resolved.source;
    updateUI();
    hideModal('loginModal');
    showToast(
      resolved.isActive
        ? 'مرحباً ' + resolved.account.name
        : 'حسابك غير مفعّل',
      resolved.isActive ? 'success' : 'info'
    );
  }, 500);
}

/* ============================================
   ✅ فحص تغيّر حالة التفعيل
   ============================================ */
function checkActivationChange() {
  const session = getPersistentSession();
  if (!session) {
    if (lastKnownIsActive !== null) {
      lastKnownIsActive = null;
      lastKnownSource = null;
      updateUI();
    }
    return;
  }

  const resolved = resolveUser(session);
  if (!resolved) {
    clearSession();
    clearSessionCookie();
    lastKnownIsActive = null;
    updateUI();
    return;
  }

  /* ✅ تغيّر حالة التفعيل */
  if (lastKnownIsActive !== resolved.isActive) {
    const wasInactive = lastKnownIsActive === false;
    const nowActive   = resolved.isActive;
    lastKnownIsActive = resolved.isActive;
    lastKnownSource   = resolved.source;
    updateUI();

    if (wasInactive && nowActive) {
      showToast('🎉 تم تفعيل حسابك!', 'success');
    }
  }

  /* تحديث البروفايل لو مفتوح */
  if (isProfileOpen()) renderProfile(resolved);
}

/* ============================================
   رسم أزرار المحتوى المقفول
   ============================================ */
function renderLockedActions(actionsEl, state) {
  if (!actionsEl) return;

  if (state === 'guest') {
    actionsEl.innerHTML = `
      <button class="btn-locked-login" type="button" data-action="login">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        تسجيل الدخول
      </button>
      <button class="btn-locked-signup" type="button" data-action="signup">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
        إنشاء حساب
      </button>`;
  } else if (state === 'pending') {
    actionsEl.innerHTML = `
      <button class="btn-locked-admin" type="button" data-action="feedback">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        تواصل مع المطور
      </button>`;
  }

  actionsEl.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'login')       { resetLoginForm(); showModal('loginModal'); }
      else if (action === 'signup') { resetSignupForm(); showModal('signupModal'); }
      else if (action === 'feedback') { openFeedback(); }
    });
  });
}

/* ============================================
   تحديث الواجهة
   ============================================ */
function updateUI() {
  const session = getPersistentSession();
  const resolved = session ? resolveUser(session) : null;

  const isGuest   = !resolved;
  const isActive  = resolved && resolved.isActive;

  if (resolved) {
    lastKnownIsActive = resolved.isActive;
    lastKnownSource = resolved.source;
  }

  /* ===== 1. الهيدر ===== */
  if (isGuest) {
    if (headerLoginBtn)  headerLoginBtn.style.display = '';
    if (headerSignupBtn) headerSignupBtn.style.display = '';
    if (profileBtn)      profileBtn.style.display = 'none';
  } else {
    if (headerLoginBtn)  headerLoginBtn.style.display = 'none';
    if (headerSignupBtn) headerSignupBtn.style.display = 'none';
    if (profileBtn)      profileBtn.style.display = 'inline-flex';
    updateHeaderProfile(resolved);
  }

  /* ===== 2. الأدوات ===== */
  if (toolsContent) toolsContent.style.display = 'none';
  if (toolsLocked)  toolsLocked.style.display = 'none';

  if (isActive) {
    if (toolsContent) {
      toolsContent.style.display = 'grid';
      renderCards(toolsContent, typeof TOOLS_DATA !== 'undefined' ? TOOLS_DATA : []);
    }
  } else {
    if (toolsLocked) {
      toolsLocked.style.display = 'block';
      if (isGuest) {
        if (toolsLockedTitle) toolsLockedTitle.textContent = 'المحتوى مغلق';
        if (toolsLockedText)  toolsLockedText.textContent  = 'سجّل الدخول بحساب مفعّل للوصول إلى الأدوات.';
        renderLockedActions(toolsLockedActions, 'guest');
      } else {
        if (toolsLockedTitle) toolsLockedTitle.textContent = 'حسابك غير مفعّل';
        if (toolsLockedText)  toolsLockedText.textContent  = 'تواصل مع المطور لتفعيل حسابك.';
        renderLockedActions(toolsLockedActions, 'pending');
      }
    }
  }

  /* ===== 3. التعريفات ===== */
  if (defsContent) defsContent.style.display = 'none';
  if (defsLocked)  defsLocked.style.display = 'none';

  if (isActive) {
    if (defsContent) {
      defsContent.style.display = 'grid';
      renderCards(defsContent, typeof DEFS_DATA !== 'undefined' ? DEFS_DATA : []);
    }
  } else {
    if (defsLocked) {
      defsLocked.style.display = 'block';
      if (isGuest) {
        if (defsLockedTitle) defsLockedTitle.textContent = 'المحتوى مغلق';
        if (defsLockedText)  defsLockedText.textContent  = 'سجّل الدخول بحساب مفعّل للوصول إلى التعريفات.';
        renderLockedActions(defsLockedActions, 'guest');
      } else {
        if (defsLockedTitle) defsLockedTitle.textContent = 'حسابك غير مفعّل';
        if (defsLockedText)  defsLockedText.textContent  = 'تواصل مع المطور لتفعيل حسابك.';
        renderLockedActions(defsLockedActions, 'pending');
      }
    }
  }

  /* ===== 4. زر التعليقات (يظهر دائماً) ===== */
  if (feedbackBtn) feedbackBtn.style.display = 'inline-flex';
}

/* ---------- Toast ---------- */
let toastTimer;
function showToast(msg, type = 'info') {
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.classList.remove('success', 'error');
  if (type === 'success') toast.classList.add('success');
  if (type === 'error') toast.classList.add('error');
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}