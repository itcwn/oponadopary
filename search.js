// Wyszukiwarka — wymagany tylko rozmiar; deduplikacja par w SQL (id2 > id1)
const sizeSel  = document.getElementById('size-select');
const brandSel = document.getElementById('brand-select');
const modelSel = document.getElementById('model-select');
const loadSel  = document.getElementById('load-select');
const speedSel = document.getElementById('speed-select');

const yearInput = document.getElementById('year-input');
const treadInput = document.getElementById('tread-input');
const tolYear = document.getElementById('tol-year');
const tolTread = document.getElementById('tol-tread');

const resultsEl = document.getElementById('results');
const emptyEl = document.getElementById('empty');
const resCountEl = document.getElementById('results-count');
const resCritEl = document.getElementById('results-criteria');

const form = document.getElementById('search-form');
const btnClear = document.getElementById('btn-clear');

function option(value, label){ const o=document.createElement('option'); o.value=value; o.textContent=label; return o; }

async function loadSizes() {
  const { data } = await sb.from('sizes').select('id,display').order('width,aspect,rim');
  sizeSel.innerHTML = ''; sizeSel.appendChild(option('', 'Wybierz...'));
  (data||[]).forEach(s => sizeSel.appendChild(option(s.id, s.display)));
}
async function loadBrands() {
  const { data } = await sb.from('brands').select('id,name').order('name');
  brandSel.innerHTML=''; brandSel.appendChild(option('', 'Dowolny'));
  (data||[]).forEach(b=>brandSel.appendChild(option(b.id,b.name)));
}
async function loadModels(brandId) {
  modelSel.innerHTML=''; modelSel.appendChild(option('', 'Dowolny'));
  if (!brandId) return;
  const { data } = await sb.from('models').select('id,name').eq('brand_id', brandId).order('name');
  (data||[]).forEach(m=>modelSel.appendChild(option(m.id,m.name)));
}
async function loadIndexLists() {
  const { data: loads } = await sb.from('load_indices').select('id,value').order('value');
  const { data: speeds } = await sb.from('speed_indices').select('id,code').order('code');
  loadSel.innerHTML=''; loadSel.appendChild(option('', 'Dowolny'));
  (loads||[]).forEach(li=>loadSel.appendChild(option(li.id, li.value)));
  speedSel.innerHTML=''; speedSel.appendChild(option('', 'Dowolny'));
  (speeds||[]).forEach(si=>speedSel.appendChild(option(si.id, si.code)));
}
brandSel.addEventListener('change', e => loadModels(e.target.value));

async function searchPairs(e){
  e.preventDefault();
  const size_id  = Number(sizeSel.value);
  if(!size_id){ alert('Wybierz rozmiar.'); return; }
  const brand_id = brandSel.value? Number(brandSel.value) : null;
  const model_id = modelSel.value? Number(modelSel.value) : null;
  const load_id  = loadSel.value? Number(loadSel.value) : null;
  const speed_id = speedSel.value? Number(speedSel.value) : null;
  const year     = yearInput.value? Number(yearInput.value): null;
  const tread    = treadInput.value? Number(treadInput.value): null;
  const tol_year   = Number(tolYear.value||0);
  const tol_tread  = Number(tolTread.value||0);

  const { data, error } = await sb.rpc('search_pairs', {
    p_brand_id: brand_id,
    p_model_id: model_id,
    p_size_id: size_id,
    p_load_id: load_id,
    p_speed_id: speed_id,
    p_year: year,
    p_tread: tread,
    p_tol_year: tol_year,
    p_tol_tread: tol_tread
  });
  if (error){ console.error(error); alert('Błąd wyszukiwania'); return; }

  renderResults(data||[], { tol_year, tol_tread });
}

function fmtPrice(cents){ return new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format((cents||0)/100); }
function badge(text, cls=''){ return `<span class="badge ${cls}">${text}</span>`; }

function renderResults(items, crit){
  resultsEl.innerHTML='';
  resCountEl.textContent = `Znaleziono ${items.length} par`;
  resCritEl.textContent = 'Filtry zastosowane.';
  if(!items.length){ emptyEl.classList.remove('hidden'); return; }
  emptyEl.classList.add('hidden');

  items.forEach((p) => {
    const a = p.tire_1, b = p.tire_2;
    const diffYear = Math.abs((a.year||0)-(b.year||0));
    const diffTread = Math.abs((a.tread_mm||0)-(b.tread_mm||0));
    const clsYear = diffYear <= (+crit.tol_year||0) ? 'ok':'warn';
    const clsTread = diffTread <= (+crit.tol_tread||0) ? 'ok':'warn';
    const html = `
    <div class="pair">
      <div class="row">
        <div class="tire">
          <div class="thumb"></div>
          <div>
            <div><strong>${a.brand} ${a.model}</strong> ${a.invoice ? ' • <span class="badge">FV</span>' : ''}</div>
            <div class="badges">
              ${badge(a.size)} ${badge(a.load_index + a.speed_index)}
              ${badge('Rok: '+a.year)} ${badge('Bieżnik: '+a.tread_mm+' mm')}
            </div>
            <div class="price">${fmtPrice(a.price_cents)}</div>
          </div>
        </div>
        <div class="tire">
          <div class="thumb"></div>
          <div>
            <div><strong>${b.brand} ${b.model}</strong> ${b.invoice ? ' • <span class="badge">FV</span>' : ''}</div>
            <div class="badges">
              ${badge(b.size)} ${badge(b.load_index + b.speed_index)}
              ${badge('Rok: '+b.year)} ${badge('Bieżnik: '+b.tread_mm+' mm')}
            </div>
            <div class="price">${fmtPrice(b.price_cents)}</div>
          </div>
        </div>
      </div>
      <div class="diff">
        ${badge('Rok: '+diffYear, clsYear)} ${badge('Bieżnik: '+diffTread+' mm', clsTread)}
        <span style="flex:1"></span>
        <button class="btn small">Kup w COD</button>
        <button class="btn small ghost">Kup manualnie</button>
      </div>
    </div>`;
    const div = document.createElement('div'); div.innerHTML = html; resultsEl.appendChild(div.firstElementChild);
  });
}

form.addEventListener('submit', searchPairs);
btnClear.addEventListener('click', () => { form.reset(); });

loadSizes(); loadBrands(); loadModels(null); loadIndexLists();
