// Dodawanie ogłoszeń + listowanie swoich
const addBrand = document.getElementById('add-brand');
const addModel = document.getElementById('add-model');
const addSize  = document.getElementById('add-size');
const addLoad  = document.getElementById('add-load');
const addSpeed = document.getElementById('add-speed');
const addForm  = document.getElementById('add-form');
const myListings = document.getElementById('my-listings');

function option(v, l){ const o=document.createElement('option'); o.value=v; o.textContent=l; return o; }

async function ensureAuth(){
  const { data: { user } } = await sb.auth.getUser();
  if(!user){ alert('Zaloguj się, aby dodać ogłoszenie.'); location.href='./index.html'; }
  return user;
}

async function loadBrands() {
  const { data } = await sb.from('brands').select('id,name').order('name');
  addBrand.innerHTML=''; addBrand.appendChild(option('', 'Wybierz...')); 
  (data||[]).forEach(b=>addBrand.appendChild(option(b.id,b.name)));
}
async function loadModels(brandId) {
  addModel.innerHTML=''; addModel.appendChild(option('', 'Wybierz...'));
  if(!brandId) return;
  const { data } = await sb.from('models').select('id,name').eq('brand_id', brandId).order('name');
  (data||[]).forEach(m=>addModel.appendChild(option(m.id,m.name)));
}
async function loadSizes(modelId) {
  addSize.innerHTML=''; addSize.appendChild(option('', 'Wybierz...'));
  if(!modelId) return;
  const { data } = await sb.rpc('get_sizes_for_model', { p_model_id: Number(modelId) });
  (data||[]).forEach(s=>addSize.appendChild(option(s.id, s.display)));
}
async function loadIndices(modelId, sizeId) {
  addLoad.innerHTML=''; addSpeed.innerHTML='';
  if(!modelId||!sizeId) return;
  const { data: loads } = await sb.rpc('get_load_indices_for_model_size', { p_model_id: Number(modelId), p_size_id: Number(sizeId) });
  const { data: speeds } = await sb.rpc('get_speed_indices_for_model_size', { p_model_id: Number(modelId), p_size_id: Number(sizeId) });
  addLoad.appendChild(option('', 'Wybierz...')); addSpeed.appendChild(option('', 'Wybierz...'));
  (loads||[]).forEach(li=>addLoad.appendChild(option(li.id, li.value)));
  (speeds||[]).forEach(si=>addSpeed.appendChild(option(si.id, si.code)));
}

addBrand.addEventListener('change', e=>loadModels(e.target.value));
addModel.addEventListener('change', e=>loadSizes(e.target.value));
addSize.addEventListener('change', e=>loadIndices(addModel.value, e.target.value));

async function resizeImage(file, maxWidth=800){
  const img = document.createElement('img');
  const reader = new FileReader();
  return new Promise((resolve,reject)=>{
    reader.onload = () => { img.src = reader.result; };
    img.onload = () => {
      const scale = maxWidth / img.width;
      const w = Math.min(maxWidth, img.width);
      const h = img.height * (img.width > maxWidth ? scale : 1);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(b => resolve(new File([b], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.85);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadPhotos(files, userId){
  const bucket = 'tire-photos';
  const uploaded = [];
  for (let i=0;i<Math.min(files.length,5);i++){
    const f = files[i];
    const resized = await resizeImage(f, 800);
    const path = `${userId}/${Date.now()}_${i}.jpg`;
    const { error } = await sb.storage.from(bucket).upload(path, resized, { contentType: 'image/jpeg', upsert: false });
    if(error){ console.error(error); continue; }
    const { data: pub } = sb.storage.from(bucket).getPublicUrl(path);
    uploaded.push(pub.publicUrl);
  }
  return uploaded;
}

addForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const user = await ensureAuth();
  const brand_id = Number(addBrand.value);
  const model_id = Number(addModel.value);
  const size_id  = Number(addSize.value);
  const load_id  = Number(addLoad.value);
  const speed_id = Number(addSpeed.value);
  const year     = Number(document.getElementById('add-year').value);
  const tread    = Number(document.getElementById('add-tread').value);
  const price_pln= Number(document.getElementById('add-price').value);
  const desc     = document.getElementById('add-desc').value;
  const invoice  = document.getElementById('add-invoice').checked;
  const files    = document.getElementById('add-photos').files;
  if(!brand_id||!model_id||!size_id||!load_id||!speed_id){ alert('Uzupełnij pola.'); return; }

  const photoUrls = await uploadPhotos(files, user.id);
  const { error } = await sb.from('tires').insert({
    seller_id: user.id,
    brand_id, model_id, size_id, load_index_id: load_id, speed_index_id: speed_id,
    year, tread_mm: tread, condition: 'used', price_cents: Math.round(price_pln*100),
    description: desc, invoice: invoice, photos: photoUrls
  });
  if (error){ alert(error.message); return; }
  alert('Dodano ogłoszenie!');
  addForm.reset();
  loadMyListings();
});

async function loadMyListings(){
  const { data: { user } } = await sb.auth.getUser();
  if(!user){ myListings.innerHTML = '<div class="empty">Zaloguj się.</div>'; return; }
  const { data, error } = await sb.from('tires_view').select('*').eq('seller_id', user.id).order('created_at', { ascending:false });
  if (error){ console.error(error); myListings.innerHTML='<div class="empty">Błąd.</div>'; return; }
  if (!data?.length){ myListings.innerHTML='<div class="empty">Brak ogłoszeń.</div>'; return; }
  myListings.innerHTML = '';
  data.forEach(t => {
    const el = document.createElement('div');
    el.className='pair';
    el.innerHTML = `
      <div class="tire">
        <div class="thumb" style="background-image:url('${(t.photos&&t.photos[0])||''}'); background-size:cover"></div>
        <div>
          <div><strong>${t.brand} ${t.model}</strong> ${t.invoice ? ' • <span class="badge">FV</span>' : ''}</div>
          <div class="badges">
            <span class="badge">${t.size}</span>
            <span class="badge">${t.load_index}${t.speed_index}</span>
            <span class="badge">Rok: ${t.year}</span>
            <span class="badge">Bieżnik: ${t.tread_mm} mm</span>
          </div>
          <div class="price">${(t.price_cents/100).toFixed(2)} PLN</div>
          ${t.description ? `<div class="muted">${t.description}</div>` : ''}
          <div class="badges"><span class="badge">${t.status}</span></div>
        </div>
      </div>`;
    myListings.appendChild(el);
  });
}

loadBrands();
ensureAuth().then(loadMyListings);
