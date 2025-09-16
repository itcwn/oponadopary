// Rejestracja konta (Auth + profil)
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
    const { error: e2 } = await sb.from('profiles').insert({
      user_id: userId, role, full_name, phone, address_line1, address_line2,
      city, postal_code, iban, accept_cod, accept_manual
    });
    if (e2) console.warn('Profil nie zapisany teraz:', e2.message);
    showMsg('Konto utworzone! Możesz przejść do logowania lub panelu sprzedawcy.');
  } else {
    showMsg('Konto utworzone! Sprawdź e-mail i potwierdź rejestrację. Po zalogowaniu uzupełnisz profil.');
  }
});
