// Prosty login/logout e-mail + hasło
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');

async function refreshAuthButtons() {
  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    btnLogin.classList.add('hidden');
    btnLogout.classList.remove('hidden');
  } else {
    btnLogin.classList.remove('hidden');
    btnLogout.classList.add('hidden');
  }
}

btnLogin?.addEventListener('click', async () => {
  const email = prompt('Podaj e-mail:');
  const password = prompt('Hasło:');
  if (!email || !password) return;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { alert(error.message); }
  await refreshAuthButtons();
  location.reload();
});

btnLogout?.addEventListener('click', async () => {
  await sb.auth.signOut();
  await refreshAuthButtons();
  location.reload();
});

refreshAuthButtons();
