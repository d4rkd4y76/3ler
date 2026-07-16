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
    const type = pass.type === 'password' ? 'text' : 'password';
    pass.type = type;
    eye.textContent = type === 'password' ? '👁' : '🙈';
    eye.setAttribute('aria-pressed', type === 'text' ? 'true' : 'false');
  }
  eye?.addEventListener('click', togglePwdVisibility);
  eye?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePwdVisibility(); }
  });

  function validate(){
    try {
      if (cls && typeof window.novaLockSelectToFixedGrade === 'function' && !(cls.value || '').trim()) {
        window.novaLockSelectToFixedGrade(cls, window.NOVA_LOGIN_FIXED_GRADE || 1);
      }
    } catch (_) {}
    const ok = (cls?.value || '').trim() !== '' &&
               (user?.value || '').trim().length >= 2 &&
               (pass?.value || '').trim().length >= 4;
    login.disabled = !ok;
    login.classList.toggle('active', ok);
    if(ok) err.textContent = '';
  }
  ['change','input'].forEach(ev => {
    cls?.addEventListener(ev, validate);
    user?.addEventListener(ev, validate);
    pass?.addEventListener(ev, validate);
  });
  validate();

  // Enter ile giriş
  [cls,user,pass].forEach(el => el?.addEventListener('keydown', e => {
    if(e.key === 'Enter' && !login.disabled){ e.preventDefault(); login.click(); }
  }));

  // Beni hatırla
  const remember = document.getElementById('rememberMe');
  try{
    const saved = JSON.parse(localStorage.getItem('duello_login_pref')||'{}');
    if(saved.user) user.value = saved.user;
    /* Sınıf sabit 1. sınıf — kayıtlı sınıf tercihini yok say */
    if('rem' in saved) remember.checked = !!saved.rem;
  }catch(_){}
  try {
    if (cls && typeof window.novaLockSelectToFixedGrade === 'function') {
      window.novaLockSelectToFixedGrade(cls, window.NOVA_LOGIN_FIXED_GRADE || 1);
    }
  } catch (_) {}
  function persist(){
    try{
      localStorage.setItem('duello_login_pref', JSON.stringify({
        user: remember.checked ? user.value : '',
        cls: '',
        rem: remember.checked
      }));
    }catch(_){}
  }
  remember?.addEventListener('change', persist);
  [cls,user,pass].forEach(el => el?.addEventListener('input', persist));

  // Giriş click -> uygulamanın mevcut akışına CustomEvent
  login?.addEventListener('click', () => {
    const payload = {
      classId: (cls?.value || '').trim(),
      username: (user?.value || '').trim(),
      password: (pass?.value || '').trim()
    };
    if(!payload.classId || !payload.username || !payload.password){
      err.textContent = 'Lütfen tüm alanları doldurun.';
      return;
    }
    document.dispatchEvent(new CustomEvent('duello:loginAttempt', { detail: payload }));
  });

  // Dıştan hata yazdırmak için
  document.addEventListener('duello:loginError', e => {
    err.textContent = e.detail?.message || 'Giriş başarısız.';
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
