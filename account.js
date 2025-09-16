// Moje konto — edycja profilu (bez zmiany loginu/hasła)
const form = document.getElementById('acct-form');
const msg = document.getElementById('acct-msg');
const btnReset = document.getElementById('btn-reset');

function setMsg(t){ msg.textContent = t; }

async function ensureAuth(){
  const { data: { user } } = await sb.auth.getUser();
  if(!user){ alert('Zaloguj się, aby edytować konto.'); location.href='./index.html'; return null; }
  return user;
}

function getFormData(){
  return {
    role: document.getElementById('role').value,
    full_name: document.getElementById('full_name').value,
    phone: document.getElementById('phone').value,
    address_line1: document.getElementById('address_line1').value,
    address_line2: document.getElementById('address_line2').value,
    city: document.getElementById('city').value,
    postal_code: document.getElementById('postal_code').value,
    iban: document.getElementById('iban').value,
    accept_cod: document.getElementById('accept_cod').checked,
    accept_manual: document.getElementById('accept_manual').checked
  };
}

function fillForm(p){
  document.getElementById('role').value = p.role || 'seller';
  document.getElementById('full_name').value = p.full_name || '';
  document.getElementById('phone').value = p.phone || '';
  document.getElementById('address_line1').value = p.address_line1 || '';
  document.getElementById('address_line2').value = p.address_line2 || '';
  document.getElementById('city').value = p.city || '';
  document.getElementById('postal_code').value = p.postal_code || '';
  document.getElementById('iban').value = p.iban || '';
  document.getElementById('accept_cod').checked = !!p.accept_cod;
  document.getElementById('accept_manual').checked = !!p.accept_manual;
}

function validPostal(code){
  return /^\d{2}-\d{3}$/.test((code||'').trim()) || (code||'').trim()==='';
}
function validIban(iban){
  if(!iban) return true;
  const v = iban.replace(/\s+/g,'').toUpperCase();
  return v.startsWith('PL') && v.length==28;
}

let currentProfile = null;

async function loadProfile(){
  const user = await ensureAuth(); if(!user) return;
  const { data, error } = await sb.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
  if(error){ console.error(error); setMsg('Błąd ładowania profilu.'); return; }
  if(!data){
    const { error: e2 } = await sb.from('profiles').insert({ user_id: user.id, role:'seller', accept_cod:true, accept_manual:true });
    if(e2){ console.warn('Nie utworzono profilu teraz:', e2.message); }
    currentProfile = { user_id: user.id, role:'seller', accept_cod:true, accept_manual:true };
  } else {
    currentProfile = data;
  }
  fillForm(currentProfile);
  setMsg('');
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const user = await ensureAuth(); if(!user) return;
  const model = getFormData();
  if(!validPostal(model.postal_code)){ alert('Nieprawidłowy kod pocztowy (format 00-000).'); return; }
  if(!validIban(model.iban)){ alert('Nieprawidłowy IBAN — powinien zaczynać się od PL i mieć 28 znaków.'); return; }
  const payload = { ...model, user_id: user.id };
  const { error } = await sb.from('profiles').upsert(payload, { onConflict: 'user_id' });
  if(error){ alert(error.message); return; }
  currentProfile = payload;
  setMsg('Zapisano zmiany profilu.');
});

btnReset.addEventListener('click', ()=>{
  if(currentProfile) fillForm(currentProfile);
  setMsg('Przywrócono ostatnio zapisane dane.');
});

loadProfile();
