/* ============================================
   script.js — منطق الواجهة
   ============================================ */

/* ---------- حماية النصوص ---------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[s]));
}

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

/* ---------- مراجع العناصر ---------- */
let loginModal, signupModal, signupModalBox, loginBtn, signupBtn,
    userChip, userCaret, userMenu, userAvatar, userName, logoutBtn,
    successView, successTimer, toast, toastMsg;

let successTimerInterval = null;

/* ---------- تهيئة عند التحميل ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // ربط العناصر
  loginModal     = document.getElementById('loginModal');
  signupModal    = document.getElementById('signupModal');
  signupModalBox = document.getElementById('signupModalBox');
  loginBtn       = document.getElementById('loginBtn');
  signupBtn      = document.getElementById('signupBtn');
  userChip       = document.getElementById('userChip');
  userCaret      = document.getElementById('userCaret');
  userMenu       = document.getElementById('userMenu');
  userAvatar     = document.getElementById('userAvatar');
  userName       = document.getElementById('userName');
  logoutBtn      = document.getElementById('logoutBtn');
  successView    = document.getElementById('successView');
  successTimer   = document.getElementById('successTimer');
  toast          = document.getElementById('toast');
  toastMsg       = document.getElementById('toastMsg');

  // عرض البطاقات
  renderCards(document.getElementById('toolsGrid'), typeof TOOLS_DATA !== 'undefined' ? TOOLS_DATA : []);
  renderCards(document.getElementById('defsGrid'),  typeof DEFS_DATA  !== 'undefined' ? DEFS_DATA  : []);

  // ربط الأحداث
  bindEvents();

  // تحديث واجهة الدخول
  updateAuthUI();

  // فحص طلب معلّق
  checkPendingOnLoad();
});

/* ---------- ربط كل الأحداث ---------- */
function bindEvents() {

  /* أزرار الدخول والتسجيل */
  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resetLoginForm();
    showModal('loginModal');
  });

  signupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resetSignupForm();
    showModal('signupModal');
  });

  /* أزرار الإغلاق */
  document.querySelectorAll('[data-close]').forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      hideModal(b.dataset.close);
    });
  });

  /* النقر على الخلفية */
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) hideModal(m.id);
    });
  });

  /* ESC */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      hideAllModals();
      closeUserMenu();
      document.getElementById('dropdown').classList.remove('open');
    }
  });

  /* التبديل بين النوافذ */
  document.getElementById('switchToSignup').addEventListener('click', () => {
    hideModal('loginModal');
    resetSignupForm();
    setTimeout(() => showModal('signupModal'), 150);
  });
  document.getElementById('switchToLogin').addEventListener('click', () => {
    hideModal('signupModal');
    resetLoginForm();
    setTimeout(() => showModal('loginModal'), 150);
  });

  /* إظهار/إخفاء كلمة السر */
  document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.target);
      const isPass = inp.type === 'password';
      inp.type = isPass ? 'text' : 'password';
      btn.innerHTML = isPass
        ? '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    });
  });

  /* نموذج التسجيل */
  document.getElementById('signupForm').addEventListener('submit', handleSignup);

  /* نموذج الدخول */
  document.getElementById('loginForm').addEventListener('submit', handleLogin);

  /* قائمة المستخدم */
  userCaret.addEventListener('click', e => {
    e.stopPropagation();
    const open = userMenu.classList.toggle('open');
    userChip.classList.toggle('open', open);
  });
  userChip.addEventListener('click', e => {
    if (e.target.closest('.logout-btn')) return;
    if (e.target === userCaret || userCaret.contains(e.target)) return;
    e.stopPropagation();
    const open = userMenu.classList.toggle('open');
    userChip.classList.toggle('open', open);
  });
  document.addEventListener('click', e => {
    if (!userChip.contains(e.target)) closeUserMenu();
    const mw = document.querySelector('.menu-wrap');
    if (mw && !mw.contains(e.target)) document.getElementById('dropdown').classList.remove('open');
  });

  /* تسجيل الخروج */
  logoutBtn.addEventListener('click', () => {
    clearSession();
    clearSessionCookie();
    updateAuthUI();
    closeUserMenu();
    showToast('تم تسجيل الخروج بنجاح', 'success');
  });

  /* التبويبات */
  const tabs = document.querySelectorAll('.tab');
  const panels = {
    tools:   document.getElementById('panel-tools'),
    defs:    document.getElementById('panel-defs'),
    youtube: document.getElementById('panel-youtube'),
  };
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      Object.values(panels).forEach(p => p.classList.remove('active'));
      panels[tab.dataset.panel].classList.add('active');
    });
  });

  /* قائمة المطور */
  const menuBtn = document.getElementById('menuBtn');
  const dropdown = document.getElementById('dropdown');
  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    closeUserMenu();
    dropdown.classList.toggle('open');
  });
}

/* ---------- النوافذ ---------- */
function showModal(which) {
  closeUserMenu();
  document.getElementById('dropdown').classList.remove('open');
  document.getElementById(which).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function hideModal(which) {
  document.getElementById(which).classList.remove('open');
  if (!document.querySelector('.modal-overlay.open')) document.body.style.overflow = '';
  if (which === 'signupModal' && successTimerInterval) {
    clearInterval(successTimerInterval);
    successTimerInterval = null;
  }
}
function hideAllModals() {
  document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  document.body.style.overflow = '';
  if (successTimerInterval) { clearInterval(successTimerInterval); successTimerInterval = null; }
}

/* ---------- رسائل ---------- */
function showMsg(el, txtEl, text, type) {
  el.classList.remove('error', 'success', 'info');
  el.classList.add('show', type);
  txtEl.textContent = text;
}
function hideMsg(el) { el.classList.remove('show', 'error', 'success', 'info'); }

function resetLoginForm() {
  document.getElementById('loginForm').reset();
  hideMsg(document.getElementById('loginMsg'));
  document.getElementById('loginPass').type = 'password';
}
function resetSignupForm() {
  document.getElementById('signupForm').reset();
  hideMsg(document.getElementById('signupMsg'));
  document.getElementById('signupPass').type = 'password';
  signupModalBox.classList.remove('showing-success');
  successView.classList.remove('show');
  if (successTimerInterval) { clearInterval(successTimerInterval); successTimerInterval = null; }
}

/* ============================================
   نموذج التسجيل — يرسل للتلجرام فقط
   ============================================ */
async function handleSignup(e) {
  e.preventDefault();
  const msg = document.getElementById('signupMsg');
  const txt = document.getElementById('signupMsgText');
  const submitBtn = document.getElementById('signupSubmit');

  const name = document.getElementById('signupName').value.trim();
  const user = document.getElementById('signupUser').value.trim();
  const pass = document.getElementById('signupPass').value;

  if (!name || name.length < 2)  return showMsg(msg, txt, 'يرجى إدخال اسم صحيح (حرفان على الأقل)', 'error');
  if (!user || user.length < 3)  return showMsg(msg, txt, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل', 'error');
  if (!/^[A-Za-z0-9_.\u0600-\u06FF]+$/.test(user))
    return showMsg(msg, txt, 'اسم المستخدم يحتوي على رموز غير مسموحة', 'error');
  if (!pass || pass.length < 6)  return showMsg(msg, txt, 'كلمة السر يجب أن تكون 6 أحرف على الأقل', 'error');

  const key = user.toLowerCase();

  /* ✅ تحقق من قائمة المستخدمين التي أضفتها يدوياً */
  if (isUsernameTaken(key)) {
    return showMsg(msg, txt, '⚠️ اسم المستخدم هذا مستخدم بالفعل — اختر اسمًا آخر', 'error');
  }

  /* ✅ تحقق من الطلبات المعلقة */
  const pending = getPending();
  if (pending[key] && pending[key].status === 'pending') {
    return showMsg(msg, txt, 'لديك طلب قيد المراجعة بالفعل — يرجى الانتظار', 'info');
  }

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;
  hideMsg(msg);

  try {
    /* إرسال للتلجرام فقط */
    await sendToTelegram(name, user, pass);

    /* تخزين الطلب المعلّق (محلياً فقط لعرض العد التنازلي) */
    pending[key] = {
      name, user,
      pass: hashPass(pass),
      status: 'pending',
      createdAt: Date.now(),
      activateAt: Date.now() + 24 * 60 * 60 * 1000
    };
    savePending(pending);
    rememberPendingUser(key);

    /* عرض رسالة النجاح + العد التنازلي */
    signupModalBox.classList.add('showing-success');
    successView.classList.add('show');
    startSuccessTimer(pending[key].activateAt);

  } catch (err) {
    console.error(err);
    showMsg(msg, txt, 'تعذّر إرسال الطلب — تحقق من الاتصال وحاول مرة أخرى', 'error');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
}

/* ============================================
   نموذج الدخول — يتحقق من USERS
   ============================================ */
function handleLogin(e) {
  e.preventDefault();
  const msg = document.getElementById('loginMsg');
  const txt = document.getElementById('loginMsgText');
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;

  if (!user || !pass) return showMsg(msg, txt, 'يرجى إدخال اسم المستخدم وكلمة السر', 'error');

  const key = user.toLowerCase();
  const entry = getUser(key);

  /* الحساب غير موجود في USERS */
  if (!entry) {
    /* هل هو طلب معلّق؟ */
    const pending = getPending();
    if (pending[key]) {
      return showMsg(msg, txt,
        '⏳ حسابك قيد المراجعة — سيتم تفعيله قريباً. حاول لاحقاً.',
        'info');
    }
    return showMsg(msg, txt, '❌ لا يوجد حساب بهذا الاسم — يرجى إنشاء حساب أولاً', 'error');
  }

  /* كلمة السر */
  if (entry.pass !== hashPass(pass)) {
    return showMsg(msg, txt, '❌ كلمة السر غير صحيحة', 'error');
  }

  /* نجاح */
  showMsg(msg, txt, '✅ تم تسجيل الدخول بنجاح!', 'success');
  setTimeout(() => {
    setSession(key);
    setSessionCookie(key);
    updateAuthUI();
    hideModal('loginModal');
    showToast('مرحباً بعودتك ' + entry.name, 'success');
  }, 600);
}

/* ---------- مؤقت العرض ---------- */
function startSuccessTimer(activateAt) {
  if (successTimerInterval) clearInterval(successTimerInterval);
  function tick() {
    const remaining = activateAt - Date.now();
    if (remaining <= 0) {
      successTimer.textContent = 'بانتظار التفعيل';
      clearInterval(successTimerInterval);
      successTimerInterval = null;
      return;
    }
    const t = Math.floor(remaining / 1000);
    const h = String(Math.floor(t / 3600)).padStart(2, '0');
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
    const s = String(t % 60).padStart(2, '0');
    successTimer.textContent = h + ':' + m + ':' + s;
  }
  tick();
  successTimerInterval = setInterval(tick, 1000);
}

/* ---------- قائمة المستخدم ---------- */
function closeUserMenu() {
  userMenu.classList.remove('open');
  userChip.classList.remove('open');
}

/* ---------- تحديث الواجهة ---------- */
function updateAuthUI() {
  const session = getPersistentSession();
  const account = session ? getUser(session) : null;

  if (account) {
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'none';
    userChip.classList.add('show');
    userName.textContent = account.name;
    userAvatar.textContent = account.name.charAt(0).toUpperCase();
    document.getElementById('umName').textContent = account.name;
    document.getElementById('umUser').textContent = account.user;
  } else {
    if (session && !account) {
      clearSession();
      clearSessionCookie();
    }
    loginBtn.style.display = '';
    signupBtn.style.display = '';
    userChip.classList.remove('show');
    userMenu.classList.remove('open');
    userChip.classList.remove('open');
  }
}

/* ---------- Toast ---------- */
let toastTimer;
function showToast(msg, type = 'info') {
  toastMsg.textContent = msg;
  toast.classList.remove('success', 'error');
  if (type === 'success') toast.classList.add('success');
  if (type === 'error') toast.classList.add('error');
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ---------- فحص عند التحميل ---------- */
function checkPendingOnLoad() {
  const session = getPersistentSession();
  if (session && getUser(session)) return;

  const pending = getPending();
  const remembered = getRememberedPendingUser();
  let entry = null, key = null;

  if (remembered && pending[remembered] && pending[remembered].status === 'pending') {
    entry = pending[remembered]; key = remembered;
  } else {
    for (const k in pending) {
      if (pending[k].status === 'pending') { entry = pending[k]; key = k; break; }
    }
  }

  if (entry) {
    resetSignupForm();
    showModal('signupModal');
    signupModalBox.classList.add('showing-success');
    successView.classList.add('show');
    startSuccessTimer(entry.activateAt);
    rememberPendingUser(key);
  }
}