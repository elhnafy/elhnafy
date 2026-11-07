/* ============================================
   accounts.js — المستخدمون + نظام التحقق
   ============================================ */

/* ============================================================
   ⬇️⬇️⬇️  هنا تضيف المستخدمين يدوياً  ⬇️⬇️⬇️
   
   بعد ما يوصلك الطلب على Telegram:
   1. انسخ الكود الجاهز من الرسالة
   2. الصقه هنا داخل USERS
   3. ارفع الملف على GitHub
   ============================================================ */

const USERS = {
  // مثال (احذف // من السطر لتفعيله):
  
  // 'admin': {
  //   name: 'المدير',
  //   user: 'admin',
  //   pass: hashPass('admin123'),
  //   status: 'active'
  // },
  
  // ← أضف مستخدميك هنا بنفس الطريقة
};


/* ============================================================
   ⬇️⬇️⬇️  لا تعدّل ما تحت هذا الخط إلا إذا كنت تعرف ما تفعل  ⬇️⬇️⬇️
   ============================================================ */

const PENDING_KEY = 'elhnafy_pending';
const SESSION_KEY = 'elhnafy_session';
const SESSION_COOKIE = 'elhnafy_session';
const PENDING_COOKIE = 'elhnafy_pending_user';
const PENDING_LS = 'elhnafy_last_pending';

const TG_BOT_TOKEN = '9132779503:AAHdrzVkxeFMx7ca1XJoSgJIaaGgtydKHVE';
const TG_CHAT_ID = '9195993786';

/* ---------- Hash كلمة السر ---------- */
function hashPass(pass) {
  const salt = 'Elhnafy_2025';
  const raw = pass + salt;
  let rev = '';
  for (let i = raw.length - 1; i >= 0; i--) rev += raw[i];
  try { return btoa(unescape(encodeURIComponent(rev))); }
  catch { return rev; }
}

function escapeMd(s) {
  return String(s).replace(/([_*`\[\]])/g, '\\$1');
}

/* ---------- هل اسم المستخدم موجود؟ ---------- */
function isUsernameTaken(username) {
  const key = String(username).trim().toLowerCase();
  return !!USERS[key];
}

/* ---------- جلب مستخدم ---------- */
function getUser(username) {
  const key = String(username).trim().toLowerCase();
  return USERS[key] || null;
}

/* ---------- الطلبات المعلقة ---------- */
function getPending() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '{}'); }
  catch { return {}; }
}
function savePending(p) { localStorage.setItem(PENDING_KEY, JSON.stringify(p)); }

/* ---------- الجلسة ---------- */
function setSession(u) { localStorage.setItem(SESSION_KEY, u); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }
function getSession() { return localStorage.getItem(SESSION_KEY); }

function setCookie(name, value, days = 30) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
}
function getCookie(name) {
  const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return v ? decodeURIComponent(v.pop()) : null;
}
function deleteCookie(name) {
  document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax';
}
function setSessionCookie(u) { setCookie(SESSION_COOKIE, u, 30); }
function clearSessionCookie() { deleteCookie(SESSION_COOKIE); }
function getSessionCookie() { return getCookie(SESSION_COOKIE); }
function getPersistentSession() { return getSessionCookie() || getSession(); }

/* ---------- تذكّر آخر طلب معلّق ---------- */
function rememberPendingUser(key) {
  setCookie(PENDING_COOKIE, key, 30);
  localStorage.setItem(PENDING_LS, key);
}
function getRememberedPendingUser() {
  return getCookie(PENDING_COOKIE) || localStorage.getItem(PENDING_LS);
}
function clearRememberedPendingUser() {
  deleteCookie(PENDING_COOKIE);
  localStorage.removeItem(PENDING_LS);
}

/* ============================================================
   إرسال إلى Telegram — مع كود جاهز للنسخ واللصق
   ============================================================ */
async function sendToTelegram(name, user, pass) {
  const now = new Date();
  const dateStr = now.toLocaleString('ar-EG', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  /* ✅ الكود الجاهز للنسخ واللصق في USERS */
  const codeBlock =
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
    '📋 *انسخ الكود التالي والصقه داخل USERS في accounts.js:*\n\n' +
    '```javascript\n' +
    codeBlock + '\n' +
    '```';

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