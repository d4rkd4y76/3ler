(function(){
  const root = document.getElementById('student-selection-screen');
  if(!root) return;
  const cls = document.getElementById('selection-class-select');
  const user = document.getElementById('selection-name-input');
  const pass = document.getElementById('student-password-input');
  const login = document.getElementById('login-button');
  const err = document.getElementById('student-selection-error');
  const eye = document.getElementById('togglePwd');

  // Şifre göster/gizle
  function togglePwdVisibility() {
    if (!pass) return;
    const type = pass.type === 'password' ? 'text' : 'password';
    pass.type = type;
    if (eye) {
      eye.textContent = type === 'password' ? '👁' : '🙈';
      eye.setAttribute('aria-pressed', type === 'text' ? 'true' : 'false');
    }
  }
  eye?.addEventListener('click', togglePwdVisibility);
  eye?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePwdVisibility(); }
  });

  function ensureFixedClass(){
    try {
      if (cls && typeof window.novaLockSelectToFixedGrade === 'function') {
        if (!(cls.value || '').trim()) {
          window.novaLockSelectToFixedGrade(cls, window.NOVA_LOGIN_FIXED_GRADE || 1);
        }
      }
    } catch (_) {}
  }

  function validate(){
    ensureFixedClass();
    const classOk = (cls?.value || '').trim() !== '';
    const userOk = (user?.value || '').trim().length >= 2;
    const passOk = (pass?.value || '').trim().length >= 1;
    const ok = classOk && userOk && passOk;
    if (login) {
      login.disabled = !ok;
      login.classList.toggle('active', ok);
      try { login.setAttribute('aria-disabled', ok ? 'false' : 'true'); } catch (_) {}
    }
    if (pass && userOk) pass.disabled = false;
    if(ok && err) err.textContent = '';
    return ok;
  }
  window.novaSyncLoginCta = validate;

  ['change','input'].forEach(ev => {
    cls?.addEventListener(ev, validate);
    user?.addEventListener(ev, validate);
    pass?.addEventListener(ev, validate);
  });
  /* Tarayıcı autofill bazen input tetiklemez */
  ['focus', 'blur', 'keyup'].forEach(ev => {
    user?.addEventListener(ev, validate);
    pass?.addEventListener(ev, validate);
  });
  try {
    if (pass) {
      pass.addEventListener('animationstart', function () { validate(); }, true);
    }
  } catch (_) {}

  // Enter ile giriş
  [cls,user,pass].forEach(el => el?.addEventListener('keydown', e => {
    if(e.key === 'Enter' && login && !login.disabled){ e.preventDefault(); login.click(); }
  }));

  // Beni hatırla — bu cihazda kullanıcı adı + şifre
  const remember = document.getElementById('rememberMe');
  const PREF_KEY = 'duello_login_pref';

  function readPref(){
    try {
      if (typeof window.novaReadLoginPref === 'function') return window.novaReadLoginPref();
      return JSON.parse(localStorage.getItem(PREF_KEY) || '{}') || {};
    } catch (_) {
      return {};
    }
  }

  function writePref(obj){
    try {
      if (typeof window.novaWriteLoginPref === 'function') {
        window.novaWriteLoginPref(obj);
        return;
      }
      localStorage.setItem(PREF_KEY, JSON.stringify(obj || {}));
    } catch (_) {}
  }

  function applyRememberedCredentials(){
    try{
      const saved = readPref();
      if (!saved || !saved.rem) {
        if (remember && 'rem' in saved) remember.checked = false;
        validate();
        return false;
      }
      if (remember) remember.checked = true;
      if (saved.user && user) {
        user.disabled = false;
        user.value = String(saved.user);
      }
      if (saved.pass && pass) {
        pass.disabled = false;
        pass.removeAttribute('disabled');
        pass.value = String(saved.pass);
      }
      ensureFixedClass();
      validate();
      return !!(saved.user || saved.pass);
    }catch(_){
      validate();
      return false;
    }
  }

  function persist(){
    try{
      if (remember && remember.checked) {
        const prev = readPref();
        const userVal = (user?.value || '').trim() || String(prev.user || '');
        /* Boş şifre alanıyla kayıtlı şifreyi asla silme (giriş sonrası clear vb.) */
        let passVal = pass?.value || '';
        if (!passVal && prev.pass) passVal = String(prev.pass);
        writePref({
          user: userVal,
          pass: passVal,
          cls: '',
          rem: true
        });
      } else {
        writePref({ user: '', pass: '', cls: '', rem: false });
      }
    }catch(_){}
  }

  window.novaApplyRememberedLogin = applyRememberedCredentials;
  window.novaPersistLoginPref = persist;

  applyRememberedCredentials();
  /* Sınıf select / checkLoginButtonState sonra tekrar doldur */
  setTimeout(applyRememberedCredentials, 0);
  setTimeout(applyRememberedCredentials, 200);
  setTimeout(applyRememberedCredentials, 800);
  setTimeout(applyRememberedCredentials, 1600);
  /* Autofill / sınıf listesi gecikmesi için kısa polling */
  var syncTicks = 0;
  var syncTimer = setInterval(function () {
    applyRememberedCredentials();
    validate();
    if (++syncTicks >= 12) clearInterval(syncTimer);
  }, 250);
  document.addEventListener('nova:app-onload-done', function () {
    applyRememberedCredentials();
  });
  document.addEventListener('nova:classes-ready', function () {
    applyRememberedCredentials();
  });

  try {
    ensureFixedClass();
  } catch (_) {}
  validate();

  remember?.addEventListener('change', persist);
  [user, pass].forEach(el => el?.addEventListener('input', persist));

  // Giriş click -> uygulamanın mevcut akışına CustomEvent
  login?.addEventListener('click', () => {
    ensureFixedClass();
    persist();
    const payload = {
      classId: (cls?.value || '').trim(),
      username: (user?.value || '').trim(),
      password: (pass?.value || '').trim()
    };
    if(!payload.classId || !payload.username || !payload.password){
      if (err) err.textContent = 'Lütfen tüm alanları doldurun.';
      validate();
      return;
    }
    document.dispatchEvent(new CustomEvent('duello:loginAttempt', { detail: payload }));
  });

  // Dıştan hata yazdırmak için
  document.addEventListener('duello:loginError', e => {
    if (err) err.textContent = e.detail?.message || 'Giriş başarısız.';
  });

  // Şifremi unuttum delege
  document.getElementById('forgot')?.addEventListener('click', () => {
    document.dispatchEvent(new Event('duello:forgotPassword'));
  });

  // Kayıt Ol — 008 script gelmeden önce paneli açabilsin
  const regBtn = document.getElementById('register-button');
  const regOverlay = document.getElementById('registrationOverlay');
  regBtn?.addEventListener('click', function () {
    if (!regOverlay) return;
    regOverlay.style.display = 'flex';
    regOverlay.classList.add('is-open');
    try {
      if (typeof window.novaEnhanceGameSelects === 'function') {
        window.novaEnhanceGameSelects(regOverlay);
      }
    } catch (_) {}
    document.dispatchEvent(new Event('duello:openRegistration'));
  });
})();
