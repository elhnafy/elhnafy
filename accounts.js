/* ============================================
   accounts.js — المستخدمون + نظام التحقق
   ⚠️ مهم جداً: عند أي تعديل، غيّر APP_VERSION
   ============================================ */

const APP_VERSION = '1';

/* ---------- Hash ---------- */
function hashPass(pass) {
  const salt = 'Elhnafy_2025';
  const raw = pass + salt;
  let rev = '';
  for (let i = raw.length - 1; i >= 0; i--) rev += raw[i];
  try { return btoa(unescape(encodeURIComponent(rev))); }
  catch { return rev; }
}

/* ============================================================
   ✅✅✅  USERS — الحسابات المفعّلة  ✅✅✅
   ⚠️ القاعدة: المفتاح = user (حروف صغيرة) + فاصلة بعد كل عنصر
   ============================================================ */

const USERS = {
};

/* ============================================================
   🔒🔒🔒  PENDING_USERS — غير المفعّلة  🔒🔒🔒
   ============================================================ */

const PENDING_USERS = {
  // 'ahmed': { ... }
};

/* ============================================================
   لا تعدّل ما تحت هذا الخط
   ============================================================ */

const SESSION_KEY        = 'elhnafy_session';
const SESSION_COOKIE     = 'elhnafy_session';
const LOCAL_ACCOUNTS_KEY = 'elhnafy_local_accounts';
const AVATARS_KEY        = 'elhnafy_avatars';
const FEEDBACK_KEY       = 'elhnafy_feedback';

const TG_BOT_TOKEN = '9132779503:AAHdrzVkxeFMx7ca1XJoSgJIaaGgtydKHVE';
const TG_CHAT_ID   = '9195993786';

/* ---------- Helpers ---------- */
function escapeMd(s) {
  return String(s).replace(/([\\_*`\[\]])/g, '\\$1');
}

/* ============================================================
   تشخيص — يظهر في Console لمساعدتك
   ============================================================ */
(function logDiagnostics() {
  try {
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#4a6fc4');
    console.log('%c✅ accounts.js محمّل — الإصدار: ' + APP_VERSION, 'color:#27ae60;font-weight:bold;font-size:14px');
    console.log('%c📋 USERS: ' + Object.keys(USERS).length + ' حساب', 'color:#4a6fc4;font-weight:bold', Object.keys(USERS));
    console.log('%c📋 PENDING_USERS: ' + Object.keys(PENDING_USERS).length + ' حساب', 'color:#f39c12;font-weight:bold', Object.keys(PENDING_USERS));
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#4a6fc4');
  } catch (e) {
    console.error('Diagnostics error:', e);
  }
})();

/* ============================================================
   الحسابات المحلية
   ============================================================ */

function getLocalAccounts() {
  try { return JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}'); }
  catch { return {}; }
}
function saveLocalAccounts(obj) {
  try { localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(obj)); } catch {}
}
function addLocalAccount(account) {
  const all = getLocalAccounts();
  all[account.user.toLowerCase()] = account;
  saveLocalAccounts(all);
}

/* ============================================================
   الصور
   ============================================================ */

function getAvatars() {
  try { return JSON.parse(localStorage.getItem(AVATARS_KEY) || '{}'); }
  catch { return {}; }
}
function saveAvatars(obj) {
  try { localStorage.setItem(AVATARS_KEY, JSON.stringify(obj)); }
  catch (err) {
    console.warn('saveAvatars failed', err);
    throw new Error('تعذّر حفظ الصورة — جرّب صورة أصغر');
  }
}
function getUserAvatar(username) {
  const key = String(username).trim().toLowerCase();
  return getAvatars()[key] || null;
}
function setUserAvatar(username, dataUrl) {
  const key = String(username).trim().toLowerCase();
  const avatars = getAvatars();
  avatars[key] = dataUrl;
  saveAvatars(avatars);
}
function removeUserAvatar(username) {
  const key = String(username).trim().toLowerCase();
  const avatars = getAvatars();
  if (avatars[key]) {
    delete avatars[key];
    saveAvatars(avatars);
  }
}

/* ============================================================
   التعليقات
   ============================================================ */

function getFeedbacks() {
  try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]'); }
  catch { return []; }
}
function saveFeedbacks(list) {
  try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list)); } catch {}
}
function addFeedback({ name, contact, message }) {
  const list = getFeedbacks();
  const item = {
    id: 'fb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name, contact, message,
    user: getPersistentSession(),
    createdAt: Date.now()
  };
  list.unshift(item);
  if (list.length > 50) list.length = 50;
  saveFeedbacks(list);
  return item;
}

/* ============================================================
   ✅ resolveUser — USERS دائماً أولاً (لا استثناء)
   ============================================================ */

function resolveUser(username) {
  if (!username) return null;
  const key = String(username).trim().toLowerCase();
  if (!key) return null;

  // 1. مفعّل في USERS — الحكم النهائي
  if (USERS[key]) {
    return { account: USERS[key], isActive: true, source: 'USERS' };
  }

  // 2. غير مفعّل في PENDING_USERS
  if (PENDING_USERS[key]) {
    return { account: PENDING_USERS[key], isActive: false, source: 'PENDING' };
  }

  // 3. محلي مؤقت
  const local = getLocalAccounts()[key];
  if (local) {
    return { account: local, isActive: false, source: 'LOCAL' };
  }

  return null;
}

function isUsernameTaken(username) {
  const key = String(username).trim().toLowerCase();
  return !!USERS[key] || !!PENDING_USERS[key] || !!getLocalAccounts()[key];
}

function getUser(username) {
  const key = String(username).trim().toLowerCase();
  return USERS[key] || null;
}

/* ============================================================
   Session
   ============================================================ */

function setSession(u) {
  try { localStorage.setItem(SESSION_KEY, u); } catch {}
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}
function getSession() {
  try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
}

function isSecureContext() {
  return location.protocol === 'https:' || location.hostname === 'localhost';
}
function setCookie(name, value, days = 30) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  let cookie = name + '=' + encodeURIComponent(value) +
    ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  if (isSecureContext()) cookie += ';Secure';
  document.cookie = cookie;
}
function getCookie(name) {
  try {
    const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return v ? decodeURIComponent(v.pop()) : null;
  } catch { return null; }
}
function deleteCookie(name) {
  let cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax';
  if (isSecureContext()) cookie += ';Secure';
  document.cookie = cookie;
}

function setSessionCookie(u) { setCookie(SESSION_COOKIE, u, 30); }
function clearSessionCookie() { deleteCookie(SESSION_COOKIE); }
function getSessionCookie() { return getCookie(SESSION_COOKIE); }

function getPersistentSession() {
  const fromCookie = getSessionCookie();
  const fromLS     = getSession();
  const candidate  = fromCookie || fromLS;

  if (!candidate) return null;

  const resolved = resolveUser(candidate);
  if (!resolved) {
    clearSession();
    clearSessionCookie();
    return null;
  }
  if (fromCookie && !fromLS) setSession(fromCookie);
  if (fromLS && !fromCookie) setSessionCookie(fromLS);
  return candidate;
}

/* ---------- Telegram ---------- */
async function sendToTelegram(name, user, pass) {
  const now = new Date();
  const dateStr = now.toLocaleString('ar-EG', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const pendingCode =
    "'" + user.toLowerCase() + "': {\n" +
    "  name: '" + name.replace(/'/g, "\\'") + "',\n" +
    "  user: '" + user.replace(/'/g, "\\'") + "',\n" +
    "  pass: hashPass('" + pass.replace(/'/g, "\\'") + "'),\n" +
    "  status: 'pending'\n" +
    "},";

  const activeCode =
    "'" + user.toLowerCase() + "': {\n" +
    "  name: '" + name.replace(/'/g, "\\'") + "',\n" +
    "  user: '" + user.replace(/'/g, "\\'") + "',\n" +
    "  pass: hashPass('" + pass.replace(/'/g, "\\'") + "'),\n" +
    "  status: 'active'\n" +
    "},";

  const message =
    '🔔 *طلب حساب جديد — Elhnafy*\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '👤 *الاسم:* ' + escapeMd(name) + '\n' +
    '🆔 *اسم المستخدم:* ' + escapeMd(user) + '\n' +
    '🔑 *كلمة السر:* `' + escapeMd(pass) + '`\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '🕐 *التاريخ:* ' + escapeMd(dateStr) + '\n\n' +
    '📋 *PENDING:*\n\n' +
    '```javascript\n' + pendingCode + '\n```\n\n' +
    '✅ *USERS (للتفعيل):*\n\n' +
    '```javascript\n' + activeCode + '\n```';

  const url = 'https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendMessage';
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    })
  });
  const data = await resp.json();
  if (!data.ok) throw new Error(data.description || 'فشل الإرسال');
  return data;
}

/* ---------- Telegram للتعليقات ---------- */
async function sendFeedbackToTelegram({ name, contact, message }) {
  const now = new Date();
  const dateStr = now.toLocaleString('ar-EG', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  const session = getPersistentSession();

  const msg =
    '💬 *تعليق جديد — Elhnafy*\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '👤 *الاسم:* ' + escapeMd(name) + '\n' +
    '📞 *التواصل:* `' + escapeMd(contact) + '`\n' +
    (session ? '🆔 *المستخدم:* ' + escapeMd(session) + '\n' : '') +
    '━━━━━━━━━━━━━━━━━━\n' +
    '📝 *المشكلة/التعليق:*\n' + escapeMd(message) + '\n\n' +
    '🕐 ' + escapeMd(dateStr);

  const url = 'https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendMessage';
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text: msg,
      parse_mode: 'Markdown'
    })
  });
  const data = await resp.json();
  if (!data.ok) throw new Error(data.description || 'فشل الإرسال');
  return data;
}
