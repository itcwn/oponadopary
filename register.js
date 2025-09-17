// Rejestracja konta (Auth + profil) — zapis profilu po signUp jeśli mamy userId
const form = document.getElementById('reg-form');
const msg = document.getElementById('reg-msg');
function showMsg(text){ msg.textContent = text; }

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const pass2= document.getElementById('reg-pass2').value;
  if (pass !== pass2){ alert('Hasła nie są identyczne.'); return; }

  const role = document.getElementById('reg-role').value;
  const full_name = document.getElementById('reg-name').value;
  const phone = document.getElementById('reg-phone').value;
  const address_line1 = document.getElementById('reg-addr1').value;
  const address_line2 = document.getElementById('reg-addr2').value;
  const city = document.getElementById('reg-city').value;
  const postal_code = document.getElementById('reg-postal').value;
  const iban = document.getElementById('reg-iban').value;
  const accept_cod = document.getElementById('reg-accept-cod').checked;
  const accept_manual = document.getElementById('reg-accept-manual').checked;

  const { data, error } = await sb.auth.signUp({ email, password: pass });
  if (error) { alert(error.message); return; }

  let userId = data.user?.id;
  if (!userId) {
    const u = await sb.auth.getUser();
    userId = u?.data?.user?.id ?? null;
  }
  if (userId) {
    await sb.from('profiles').upsert({
      user_id: userId, role, full_name, phone, address_line1, address_line2,
      city, postal_code, iban, accept_cod, accept_manual
    }, { onConflict: 'user_id' });
    showMsg('Konto utworzone! Możesz się zalogować.');
  } else {
    showMsg('Konto utworzone! Sprawdź e-mail i potwierdź rejestrację. Profil utworzy się przy pierwszym logowaniu.');
  }
});
