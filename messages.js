/* ============================================
   messages.js — إدارة الإصدار + الكاش
   ============================================ */

const VERSION_KEY = 'elhnafy_app_version';
const RELOAD_GUARD_KEY = 'elhnafy_reload_guard';

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(checkAppVersion, 300);
});

function checkAppVersion() {
  const current = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : '0.0.0';
  const saved   = localStorage.getItem(VERSION_KEY);

  console.log('%c📦 APP_VERSION الحالي: ' + current + ' | المحفوظ: ' + (saved || 'لا شيء'), 'color:#f39c12;font-weight:bold');

  if (saved === current) {
    console.log('%c✅ الإصدار مطابق — لا حاجة لإعادة تحميل', 'color:#27ae60');
    return;
  }

  /* حفظ الإصدار الجديد أولاً */
  localStorage.setItem(VERSION_KEY, current);

  /* أول زيارة → لا إعادة تحميل */
  if (!saved) {
    console.log('%c👋 أول زيارة — لا إعادة تحميل', 'color:#4a6fc4');
    return;
  }

  /* حماية من حلقة لا نهائية: لا نعيد التحميل أكثر من مرة في نفس الجلسة */
  const guard = sessionStorage.getItem(RELOAD_GUARD_KEY);
  if (guard === current) {
    console.log('%c⚠️ إعادة تحميل مُنعت (حماية)', 'color:#f39c12');
    return;
  }

  sessionStorage.setItem(RELOAD_GUARD_KEY, current);
  console.log('%c🔄 إعادة تحميل إجبارية — الإصدار تغيّر', 'color:#e0392b;font-weight:bold');

  /* مسح الكاش للـ JS */
  try {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  } catch (e) {}

  /* إعادة تحميل بعد لحظة قصيرة */
  setTimeout(() => {
    location.reload(true);
  }, 500);
}

/* ✅ فحص دوري في حالة فشل الإعادة */
setInterval(() => {
  const current = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : '0.0.0';
  const saved   = localStorage.getItem(VERSION_KEY);
  if (saved && saved !== current) {
    localStorage.setItem(VERSION_KEY, current);
  }
}, 5000);