// Modalne logowanie + gwarantowany profil po zalogowaniu
const btnOpenLogin = document.getElementById('btn-open-login');
const btnLogout = document.getElementById('btn-logout');
const modal = document.getElementById('login-modal');
const btnCloseLogin = document.getElementById('btn-close-login');
const formLogin = document.getElementById('login-form');

function showLogin(){ modal?.classList.remove('hidden'); }
function hideLogin(){ modal?.classList.add('hidden'); }

btnOpenLogin?.addEventListener('click', showLogin);
btnCloseLogin?.addEventListener('click', hideLogin);

formLogin?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-pass').value;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { alert(error.message); return; }
  await ensureProfile(); // utwórz profil jeśli brak
  hideLogin();
  location.reload();
});

btnLogout?.addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

async function ensureProfile(){
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  const { data } = await sb.from('profiles').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!data) {
    await sb.from('profiles').insert({ user_id: user.id, role: 'seller', accept_cod: true, accept_manual: true });
  }
}

sb.auth.onAuthStateChange(async (event)=>{
  if (event === 'SIGNED_IN') {
    await ensureProfile();
  }
});

async function refreshAuthButtons() {
  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    btnOpenLogin?.classList.add('hidden');
    btnLogout?.classList.remove('hidden');
  } else {
    btnOpenLogin?.classList.remove('hidden');
    btnLogout?.classList.add('hidden');
  }
}
refreshAuthButtons();
