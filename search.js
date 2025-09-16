// Zależne selecty + wyszukiwanie par
const brandSel = document.getElementById('brand-select');
const modelSel = document.getElementById('model-select');
const sizeSel  = document.getElementById('size-select');
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
const sortSel = document.getElementById('sort-select');

const form = document.getElementById('search-form');
const btnClear = document.getElementById('btn-clear');

function option(value, label){ const o=document.createElement('option'); o.value=value; o.textContent=label; return o; }

async function loadBrands() {
  const { data, error } = await sb.from('brands').select('id,name').order('name');
  if (error) { console.error(error); return; }
  brandSel.innerHTML = ''; brandSel.appendChild(option('', 'Wybierz...'));
  data.forEach(b => brandSel.appendChild(option(b.id, b.name)));
  modelSel.innerHTML = ''; sizeSel.innerHTML = ''; loadSel.innerHTML = ''; speedSel.innerHTML = '';
}

async function loadModels(brandId) {
  modelSel.innerHTML=''; modelSel.appendChild(option('', 'Wybierz...'));
  if (!brandId) return;
  const { data, error } = await sb.from('models').select('id,name').eq('brand_id', brandId).order('name');
  if (error) { console.error(error); return; }
  data.forEach(m => modelSel.appendChild(option(m.id, m.name)));
  sizeSel.innerHTML = ''; loadSel.innerHTML = ''; speedSel.innerHTML = '';
}

async function loadSizes(modelId) {
  sizeSel.innerHTML=''; sizeSel.appendChild(option('', 'Wybierz...'));
  if (!modelId) return;
  const { data, error } = await sb.rpc('get_sizes_for_model', { p_model_id: Number(modelId) });
  if (error) { console.error(error); return; }
  data.forEach(s => sizeSel.appendChild(option(s.id, s.display)));
  loadSel.innerHTML = ''; speedSel.innerHTML = '';
}

async function loadIndices(modelId, sizeId) {
  loadSel.innerHTML=''; speedSel.innerHTML='';
  if (!modelId || !sizeId) return;
  const { data: loads, error: e1 } = await sb.rpc('get_load_indices_for_model_size', { p_model_id: Number(modelId), p_size_id: Number(sizeId) });
  const { data: speeds, error: e2 } = await sb.rpc('get_speed_indices_for_model_size', { p_model_id: Number(modelId), p_size_id: Number(sizeId) });
  if (e1 || e2) { console.error(e1||e2); return; }
  loadSel.appendChild(option('', 'Wybierz...'));
  speedSel.appendChild(option('', 'Wybierz...'));
  loads.forEach(li => loadSel.appendChild(option(li.id, li.value)));
  speeds.forEach(si => speedSel.appendChild(option(si.id, si.code)));
}

brandSel.addEventListener('change', e => loadModels(e.target.value));
modelSel.addEventListener('change', e => loadSizes(e.target.value));
sizeSel.addEventListener('change', e => loadIndices(modelSel.value, e.target.value));

async function searchPairs(e){
  e.preventDefault();
  const brand_id = Number(brandSel.value);
  const model_id = Number(modelSel.value);
  const size_id  = Number(sizeSel.value);
  const load_id  = Number(loadSel.value);
  const speed_id = Number(speedSel.value);
  if(!brand_id||!model_id||!size_id||!load_id||!speed_id){
    alert('Uzupełnij wszystkie obowiązkowe pola.'); return;
  }
  const year = yearInput.value? Number(yearInput.value): null;
  const tread = treadInput.value? Number(treadInput.value): null;
  const tol_year = Number(tolYear.value||0);
  const tol_tread = Number(tolTread.value||0);

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

  renderResults(data||[], {brand_id, model_id, size_id, load_id, speed_id, year, tread, tol_year, tol_tread});
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
    const clsYear = diffYear <= (crit.tol_year||0) ? 'ok':'warn';
    const clsTread = diffTread <= (crit.tol_tread||0) ? 'ok':'warn';
    const html = `
    <div class="pair">
      <div class="row">
        <div class="tire">
          <div class="thumb"></div>
          <div>
            <div><strong>${a.brand} ${a.model}</strong></div>
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
            <div><strong>${b.brand} ${b.model}</strong></div>
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

loadBrands();
