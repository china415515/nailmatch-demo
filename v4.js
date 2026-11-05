
/* NAIL MATCH v4 — PART 1 */
'use strict';

const $ = id => document.getElementById(id);
const STORE = 'nailmatch_v4_colors';
const FAV_STORE = 'nailmatch_v4_favorites';

const DEMO = [
  ['ricca-r01','Ricca','R01','ローズベージュ','ワンカラー','#ba9597','warm','elegant'],
  ['ricca-r02','Ricca','R02','ミルクピンク','ワンカラー','#e2c1ca','cool','natural'],
  ['pregel-p01','PREGEL','P01','モーヴグレージュ','ワンカラー','#a996a5','cool','mode'],
  ['pregel-p02','PREGEL','P02','シアーラベンダー','シアー','#c8bad8','cool','natural'],
  ['mybee-m01','my&bee','M01','シャンパンマグ','マグネット','#c5ae96','warm','sparkle'],
  ['mybee-m02','my&bee','M02','ピンクマグ','マグネット','#bf9aab','cool','sparkle'],
  ['emena-e01','emena','E01','フラッシュローズ','フラッシュ','#ac7186','cool','sparkle'],
  ['emena-e02','emena','E02','ボルドーマグ','マグネット','#704456','cool','mode'],
  ['ricca-r03','Ricca','R03','シアーホワイト','シアー','#f4f1f1','neutral','natural'],
  ['demo-n01','NAIL MATCH','N01','ピーチヌード','シアー','#dfb5a6','warm','natural'],
  ['demo-n02','NAIL MATCH','N02','ダスティローズ','ワンカラー','#a87e89','neutral','elegant'],
  ['demo-n03','NAIL MATCH','N03','ミルキーグリッター','ラメ','#ddd0c8','neutral','sparkle']
].map(([id,brand,code,name,finish,hex,tone,mood]) => ({
  id,brand,code,name,finish,hex,tone,mood,
  photo:'',available:true,demo:true
}));

const FINISHES = [
  'ワンカラー','シアー','マグネット',
  'フラッシュ','ラメ'
];

const TONES = ['warm','cool','neutral'];
const MOODS = [
  'natural','elegant','sparkle','mode'
];

const toneName = {
  warm:'黄み寄り',
  cool:'青み寄り',
  neutral:'ニュートラル'
};

const moodName = {
  natural:'ナチュラル',
  elegant:'上品',
  sparkle:'華やか',
  mode:'モード'
};

const esc = s => String(s ?? '')
  .replace(/[&<>"']/g, ch => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[ch]));

const hex = s =>
  /^#[\da-f]{6}$/i.test(s || '')
    ? s : '#d6a9b6';

const isPhoto = s =>
  typeof s === 'string' &&
  s.length < 1500000 &&
  /^data:image\/(?:jpeg|png|webp);base64,/i.test(s);

const norm = s =>
  String(s ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g,'');

const get = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null
      ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const byId = id =>
  colors.find(c => c.id === id);

const activeColors = () =>
  colors.filter(c => c.available !== false);

// v3のデータを初回のみ引き継ぐ

let initialColors = get(STORE, null);

if (!Array.isArray(initialColors)) {
  const previous = get(
    'nailmatch_v3_colors', null
  );

  initialColors = Array.isArray(previous)
    ? previous : DEMO;
}

let colors = initialColors;

let favorites = get(
  FAV_STORE,
  get('nailmatch_v3_favorites', [])
);

if (!Array.isArray(favorites)) {
  favorites = [];
}

let comparison = [];
let recommendations = null;
let editingId = null;
let pendingPhoto = '';
let currentDetail = null;

// ==================================
// STORAGE
// ==================================

function persist() {
  try {
    localStorage.setItem(
      STORE, JSON.stringify(colors)
    );

    localStorage.setItem(
      FAV_STORE, JSON.stringify(favorites)
    );

    return true;
  } catch (e) {
    alert(
      '保存できませんでした。端末の空き容量や' +
      '登録写真の枚数を確認してください。'
    );
    return false;
  }
}

function updateColors(mutator) {
  const before = JSON.stringify(colors);

  mutator();

  if (!persist()) {
    colors = JSON.parse(before);
    return false;
  }

  renderAll();
  return true;
}

// ==================================
// NAIL PREVIEW
// ==================================

function photoOrNail(c) {
  if (isPhoto(c.photo)) {
    return `
      <div class="visual">
        <img
          src="${c.photo}"
          alt="${esc(c.name)}の登録写真">
      </div>
    `;
  }

  const cls =
    c.finish === 'マグネット'
      ? 'magnetic'
    : c.finish === 'シアー'
      ? 'sheer'
    : c.finish === 'フラッシュ'
      ? 'flash'
    : c.finish === 'ラメ'
      ? 'glitter'
    : '';

  return `
    <div class="visual">
      <div class="nail-preview ${cls}">
        <div
          class="nail-shape"
          style="--nail-color:${hex(c.hex)}">
        </div>
      </div>
    </div>
  `;
}

function tags(c) {
  return `
    <div class="tag-list">
      <span class="tag rose">
        ${esc(c.finish)}
      </span>
      <span class="tag">
        ${esc(toneName[c.tone] || '未設定')}
      </span>
      ${
        c.demo
          ? '<span class="tag gold">デモ例</span>'
          : ''
      }
    </div>
  `;
}

// ==================================
// COLOR CARDS
// ==================================

function card(c) {
  return `
    <article class="tile">
      ${photoOrNail(c)}

      <h3>${esc(c.name)}</h3>

      <div class="meta">
        ${esc(c.brand)} / ${esc(c.code)}
      </div>

      ${tags(c)}

      <div class="actions">
        <button
          data-action="detail"
          data-id="${esc(c.id)}">
          詳細
        </button>

        <button
          data-action="favorite"
          data-id="${esc(c.id)}"
          class="${
            favorites.includes(c.id)
              ? 'saved' : ''
          }">
          ${
            favorites.includes(c.id)
              ? '♥ 保存済' : '♡ 保存'
          }
        </button>
      </div>

      <div class="actions">
        <button
          data-action="compare"
          data-id="${esc(c.id)}">
          ${
            comparison.includes(c.id)
              ? '✓ 比較中' : '＋ 比較'
          }
        </button>
      </div>
    </article>
  `;
}

// ==================================
// SEARCH
// ==================================

function renderCatalog() {
  const select = $('brand');
  const previous = select.value;

  const brands = [
    ...new Set(
      activeColors().map(c => c.brand)
    )
  ].sort((a,b) => a.localeCompare(b,'ja'));

  select.replaceChildren(
    new Option('すべてのメーカー',''),
    ...brands.map(b => new Option(b,b))
  );

  if (brands.includes(previous)) {
    select.value = previous;
  }

  const query = norm($('search').value);
  const brand = select.value;
  const finish = $('finish').value;

  const list = activeColors().filter(c =>
    (!brand || c.brand === brand) &&
    (!finish || c.finish === finish) &&
    norm(
      [c.brand,c.code,c.name].join(' ')
    ).includes(query)
  );

  $('count').textContent =
    `${list.length} COLORS AVAILABLE`;

  $('catalog').innerHTML = list.length
    ? list.map(card).join('')
    : '<div class="empty">該当するカラーがありません。</div>';
}

// ==================================
// FAVORITES
// ==================================

function renderFavorites() {
  const list = activeColors().filter(c =>
    favorites.includes(c.id)
  );

  $('favGrid').innerHTML = list.length
    ? list.map(card).join('')
    : '<div class="empty">まだお気に入りはありません ♡</div>';
}

// ==================================
// COMPARE
// ==================================

function renderCompare() {
  const list = comparison
    .map(byId)
    .filter(c => c && c.available !== false);

  $('compareGrid').innerHTML = list.length
    ? list.map(c => `
      <div class="tile">
        ${photoOrNail(c)}
        <h3>${esc(c.name)}</h3>

        <div class="meta">
          ${esc(c.brand)} / ${esc(c.code)}
        </div>

        ${tags(c)}

        <p class="small">
          ムード：
          ${esc(moodName[c.mood] || '未設定')}
        </p>

        <button
          class="btn outline"
          data-action="compare"
          data-id="${esc(c.id)}">
          比較から外す
        </button>
      </div>
    `).join('')
    : '<div class="empty">比較したいカラーを2色選んでね。</div>';
}

// ==================================
// DIAGNOSIS
// ==================================

function score(c,tone,mood,scene) {
  let n = 0;

  if (tone !== 'any') {
    if (c.tone === tone) {
      n += 3;
    } else if (c.tone === 'neutral') {
      n += 1;
    }
  }

  if (c.mood === mood) n += 5;

  if (scene === 'office') {
    if (['ワンカラー','シアー']
      .includes(c.finish)) n += 3;

    if (['natural','elegant']
      .includes(c.mood)) n += 2;
  }

  if (
    scene === 'event' &&
    ['マグネット','フラッシュ','ラメ']
      .includes(c.finish)
  ) {
    n += 3;
  }

  if (
    scene === 'daily' &&
    ['ワンカラー','シアー']
      .includes(c.finish)
  ) {
    n += 2;
  }

  return n;
}

function diagnose() {
  const tone = $('tone').value;
  const mood = $('mood').value;
  const scene = $('scene').value;

  recommendations = activeColors()
    .map(c => ({
      id:c.id,
      n:score(c,tone,mood,scene)
    }))
    .sort((a,b) => b.n - a.n)
    .slice(0,6)
    .map(x => x.id);

  $('diagnoseInfo')
    .classList.remove('hidden');

  $('diagnoseInfo').textContent =
    `YOUR COLOR MATCH ✦ ` +
    `${moodName[mood]}な雰囲気に合わせて` +
    `選びました。` +
    `※登録タグによる参考提案です。`;

  renderRecommendations();
}

function renderRecommendations() {
  if (!recommendations) return;

  const list = recommendations
    .map(byId)
    .filter(c => c && c.available !== false);

  $('recommendations').innerHTML =
    list.length
      ? list.map(card).join('')
      : '<div class="empty">おすすめカラーがありません。</div>';
}

// ==================================
// DETAILS
// ==================================

function detail(id) {
  const c = byId(id);
  if (!c) return;

  currentDetail = id;

  $('detailBody').innerHTML = `
    ${photoOrNail(c)}

    <div
      class="eyebrow"
      style="margin-top:18px">
      COLOR DETAILS
    </div>

    <h2>${esc(c.name)}</h2>

    <p class="meta">
      ${esc(c.brand)} / ${esc(c.code)}
    </p>

    ${tags(c)}

    <div class="result">
      肌トーン参考：
      ${esc(toneName[c.tone] || '未設定')}
      <br>
      ムード：
      ${esc(moodName[c.mood] || '未設定')}
      <br>
      参考色：${hex(c.hex)}
    </div>

    <p class="small">
      ${
        isPhoto(c.photo)
          ? 'サロンが登録した写真です。'
          : '爪型画像は参考色のシミュレーションです。'
      }
      画面上の発色は実物と異なります。
    </p>

    <div class="form-actions">
      <button
        class="btn light"
        data-action="favorite"
        data-id="${esc(id)}">
        ${
          favorites.includes(id)
            ? '♥ 保存済'
            : '♡ お気に入り'
        }
      </button>

      <button
        class="btn outline"
        data-action="compare"
        data-id="${esc(id)}">
        ${
          comparison.includes(id)
            ? '✓ 比較中'
            : '＋ 比較'
        }
      </button>
    </div>
  `;

  if (!$('detail').open) {
    $('detail').showModal();
  }
}

// ==================================
// REFRESH / NAVIGATION
// ==================================

function renderAll() {
  renderCatalog();
  renderFavorites();
  renderCompare();
  renderRecommendations();
  renderStock();

  if (currentDetail && $('detail').open) {
    detail(currentDetail);
  }
}

function showPage(page) {
  document.querySelectorAll('.page')
    .forEach(el => {
      el.classList.toggle(
        'active', el.id === page
      );
    });

  document.querySelectorAll('#nav button')
    .forEach(el => {
      el.classList.toggle(
        'active',
        el.dataset.page === page
      );
    });

  if (page === 'admin') renderStock();

  window.scrollTo(0,0);
}

// ==================================
// END OF PART 1
// PART 2 CONTINUES BELOW
// ==================================

/* ======================================
   NAIL MATCH v4 — PART 2
   SALON MANAGER / OCR / EVENTS
====================================== */

// ---------- BRAND / CODE OPTIONS ----------

function addOption(select, value, label) {
  select.add(new Option(label, value));
}

function brandNames() {
  return [...new Set(
    colors.map(c => c.brand).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'ja'));
}

function renderBrandSelect(selected = '') {
  const el = $('gelBrandSelect');

  el.replaceChildren();
  addOption(el, '', 'メーカーを選択してください');

  brandNames().forEach(b => {
    addOption(el, b, b);
  });

  addOption(el, '__new__', '＋ 新しいメーカーを追加');

  if (selected && brandNames().includes(selected)) {
    el.value = selected;
  } else if (selected) {
    el.value = '__new__';
    $('gelBrand').value = selected;
  }

  updateBrandArea();
}

function selectedBrand() {
  return $('gelBrandSelect').value === '__new__'
    ? $('gelBrand').value.trim()
    : $('gelBrandSelect').value;
}

function updateBrandArea() {
  const isNew = $('gelBrandSelect').value === '__new__';

  $('newBrandArea').classList.toggle('hidden', !isNew);

  if (!isNew) $('gelBrand').value = '';

  renderCodeSelect();
}

function renderCodeSelect(selected = '') {
  const brand = selectedBrand();
  const el = $('gelCodeSelect');

  const codes = [...new Set(
    colors
      .filter(c => c.brand === brand)
      .map(c => c.code)
  )].sort((a, b) => a.localeCompare(b, 'ja', {
    numeric: true
  }));

  el.replaceChildren();
  addOption(el, '', '品番を選択してください');

  codes.forEach(code => addOption(el, code, code));

  addOption(el, '__new__', '＋ 新しい品番を追加');

  if (selected && codes.includes(selected)) {
    el.value = selected;
  } else if (selected) {
    el.value = '__new__';
    $('gelCode').value = selected;
  }

  updateCodeArea();
}

function selectedCode() {
  return $('gelCodeSelect').value === '__new__'
    ? $('gelCode').value.trim()
    : $('gelCodeSelect').value;
}

function updateCodeArea() {
  const isNew = $('gelCodeSelect').value === '__new__';

  $('newCodeArea').classList.toggle('hidden', !isNew);

  if (!isNew) $('gelCode').value = '';

  const existing = colors.find(c =>
    norm(c.brand) === norm(selectedBrand()) &&
    norm(c.code) === norm(selectedCode())
  );

  if (existing && !editingId) {
    $('gelName').value = existing.name;
    $('gelFinish').value = existing.finish;
    $('gelHex').value = hex(existing.hex);
    $('gelTone').value = existing.tone;
    $('gelMood').value = existing.mood;
  }
}

// ---------- STOCK LIST ----------

function renderStock() {
  $('stockCount').textContent =
    `${activeColors().length} / ${colors.length} COLORS AVAILABLE`;

  $('stockList').innerHTML = colors.map(c => `
    <div class="stock-row">
      <input type="checkbox"
        data-stock="${esc(c.id)}"
        ${c.available !== false ? 'checked' : ''}>

      <div class="stock-swatch"
        style="--swatch:${hex(c.hex)}"></div>

      <div class="stock-info">
        <strong>${esc(c.name)}</strong>
        <span class="small">
          ${esc(c.brand)} / ${esc(c.code)}
        </span>
      </div>

      <button class="btn outline"
        data-admin="edit"
        data-id="${esc(c.id)}">編集</button>

      <button class="btn outline"
        data-admin="delete"
        data-id="${esc(c.id)}">削除</button>
    </div>
  `).join('');
}

// ---------- IMAGE COMPRESSION ----------

function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('画像ファイルを選択してください'));
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      reject(new Error('15MB以下の画像を選択してください'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () =>
      reject(new Error('画像を読み込めませんでした'));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () =>
        reject(new Error('画像を処理できませんでした'));

      img.onload = () => {
        const scale = Math.min(
          1, 750 / Math.max(img.width, img.height)
        );

        const canvas = document.createElement('canvas');

        canvas.width = Math.max(1,
          Math.round(img.width * scale));
        canvas.height = Math.max(1,
          Math.round(img.height * scale));

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('画像を処理できません'));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(
          img, 0, 0, canvas.width, canvas.height
        );

        resolve(canvas.toDataURL('image/jpeg', 0.68));
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

function renderPhoto() {
  $('photoPreview').innerHTML = isPhoto(pendingPhoto)
    ? `<img src="${pendingPhoto}" alt="施術写真">`
    : '<div class="empty">写真は未登録です</div>';
}

// ---------- FORM ----------

function resetForm() {
  editingId = null;
  pendingPhoto = '';

  $('gelForm').reset();
  $('gelBrand').value = '';
  $('gelCode').value = '';
  $('gelHex').value = '#d6a9b6';

  $('formTitle').textContent = 'Add New Gel ♡';
  $('saveGelBtn').textContent = 'ジェルを登録する ✦';
  $('cancelEdit').classList.add('hidden');

  renderBrandSelect();
  renderPhoto();
}

function formData() {
  return {
    brand: selectedBrand(),
    code: selectedCode(),
    name: $('gelName').value.trim(),
    finish: $('gelFinish').value,
    hex: hex($('gelHex').value),
    tone: $('gelTone').value,
    mood: $('gelMood').value,
    photo: pendingPhoto
  };
}

function saveGel(event) {
  event.preventDefault();

  const data = formData();

  if (!data.brand || !data.code || !data.name) {
    alert('メーカー・品番・カラー名を入力してください');
    return;
  }

  const duplicate = colors.find(c =>
    norm(c.brand) === norm(data.brand) &&
    norm(c.code) === norm(data.code) &&
    c.id !== editingId
  );

  if (duplicate) {
    alert('同じメーカー・品番がすでに登録されています');
    return;
  }

  const id = editingId ||
    `gel-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

  const ok = updateColors(() => {
    if (editingId) {
      const index = colors.findIndex(c => c.id === editingId);

      if (index >= 0) {
        colors[index] = {
          ...colors[index],
          ...data
        };
      }
    } else {
      colors.push({
        id,
        ...data,
        available: true,
        demo: false
      });
    }
  });

  if (!ok) return;

  resetForm();
  renderAll();
  alert('カラーを保存しました ♡');
}

function editGel(id) {
  const c = byId(id);
  if (!c) return;

  editingId = id;
  pendingPhoto = isPhoto(c.photo) ? c.photo : '';

  renderBrandSelect(c.brand);
  renderCodeSelect(c.code);

  $('gelName').value = c.name;
  $('gelFinish').value = c.finish;
  $('gelHex').value = hex(c.hex);
  $('gelTone').value = c.tone || 'neutral';
  $('gelMood').value = c.mood || 'natural';

  $('formTitle').textContent = 'Edit Gel Color ✦';
  $('saveGelBtn').textContent = '変更を保存する';
  $('cancelEdit').classList.remove('hidden');

  renderPhoto();

  $('gelForm').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

function deleteGel(id) {
  const c = byId(id);
  if (!c) return;

  if (!confirm(`${c.name}を削除しますか？`)) return;

  if (!updateColors(() => {
    colors = colors.filter(x => x.id !== id);
  })) return;

  favorites = favorites.filter(x => x !== id);
  comparison = comparison.filter(x => x !== id);

  if (recommendations) {
    recommendations = recommendations.filter(x => x !== id);
  }

  persist();

  if (editingId === id) resetForm();

  renderAll();
}

function toggleStock(id, checked) {
  updateColors(() => {
    const c = byId(id);
    if (c) c.available = checked;
  });
}

// ---------- BACKUP ----------

function exportData() {
  const data = {
    app: 'NAIL MATCH',
    version: 4,
    exportedAt: new Date().toISOString(),
    colors,
    favorites
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    {type: 'application/json'}
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = 'nailmatch-v4-backup.json';
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function validateData(data) {
  if (
    !data ||
    data.app !== 'NAIL MATCH' ||
    !Array.isArray(data.colors) ||
    data.colors.length > 2000
  ) {
    throw new Error('バックアップの形式が不正です');
  }

  const ids = new Set();

  const clean = data.colors.map(c => {
    if (
      !c ||
      typeof c.id !== 'string' ||
      typeof c.brand !== 'string' ||
      typeof c.code !== 'string' ||
      typeof c.name !== 'string' ||
      !c.id.trim() ||
      !c.brand.trim() ||
      !c.code.trim() ||
      !c.name.trim() ||
      c.id.length > 120 ||
      c.brand.length > 100 ||
      c.code.length > 100 ||
      c.name.length > 150 ||
      ids.has(c.id)
    ) {
      throw new Error('不正なカラー情報があります');
    }

    ids.add(c.id);

    return {
      id: c.id,
      brand: c.brand,
      code: c.code,
      name: c.name,
      finish: FINISHES.includes(c.finish)
        ? c.finish : 'ワンカラー',
      hex: hex(c.hex),
      tone: TONES.includes(c.tone)
        ? c.tone : 'neutral',
      mood: MOODS.includes(c.mood)
        ? c.mood : 'natural',
      photo: isPhoto(c.photo) ? c.photo : '',
      available: c.available !== false,
      demo: c.demo === true
    };
  });

  return {
    colors: clean,
    favorites: Array.isArray(data.favorites)
      ? [...new Set(data.favorites)]
          .filter(id => ids.has(id))
      : []
  };
}

async function importData(file) {
  if (!file) return;

  if (file.size > 20 * 1024 * 1024) {
    alert('20MB以下のファイルを選択してください');
    return;
  }

  try {
    const data = JSON.parse(await file.text());
    const clean = validateData(data);

    if (!confirm(
      '現在のデータをバックアップで置き換えますか？'
    )) return;

    const oldColors = colors;
    const oldFavorites = favorites;

    colors = clean.colors;
    favorites = clean.favorites;

    if (!persist()) {
      colors = oldColors;
      favorites = oldFavorites;
      return;
    }

    comparison = [];
    recommendations = null;

    resetForm();
    renderAll();
    alert('データを復元しました ♡');

  } catch (e) {
    alert('復元に失敗しました：' + e.message);
  }
}

function resetData() {
  if (!confirm('すべてのカラーを初期化しますか？')) return;
  if (!confirm(
    '登録写真や追加したカラーも削除されます。'
  )) return;

  const oldColors = colors;
  const oldFavorites = favorites;

  colors = DEMO.map(c => ({...c}));
  favorites = [];

  if (!persist()) {
    colors = oldColors;
    favorites = oldFavorites;
    return;
  }

  comparison = [];
  recommendations = null;

  resetForm();
  renderAll();
  alert('サンプルデータに戻しました');
}

// ---------- OCR ----------

let ocrLoading = null;

function loadOCR() {
  if (window.Tesseract) return Promise.resolve();

  if (ocrLoading) return ocrLoading;

  ocrLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');

    script.src =
      'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

    script.onload = () => {
      if (window.Tesseract) resolve();
      else reject(new Error('OCRを読み込めませんでした'));
    };

    script.onerror = () =>
      reject(new Error('OCRの通信に失敗しました'));

    document.head.appendChild(script);
  }).catch(error => {
    ocrLoading = null;
    throw error;
  });

  return ocrLoading;
}

function detectBrand(text) {
  const normalized = norm(text);

  return brandNames()
    .sort((a,b) => b.length - a.length)
    .find(b => normalized.includes(norm(b))) || '';
}

function detectCode(text, brand) {
  const lines = text.split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

  const existing = colors
    .filter(c => !brand || norm(c.brand) === norm(brand))
    .map(c => c.code)
    .sort((a,b) => b.length - a.length);

  for (const code of existing) {
    if (norm(text).includes(norm(code))) return code;
  }

  const matches = lines.flatMap(line =>
    line.match(/\b[A-Z]{0,4}[- ]?\d{1,4}[A-Z]?\b/gi) || []
  );

  return matches[0]?.replace(/\s/g,'') || '';
}

async function scanGel(file) {
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('画像を選択してください');
    return;
  }

  if (file.size > 15 * 1024 * 1024) {
    alert('15MB以下の画像を選択してください');
    return;
  }

  const url = URL.createObjectURL(file);

  $('scanPreview').innerHTML =
    `<img alt="読み取り画像">`;

  $('scanPreview').querySelector('img').src = url;

  $('scanResults').innerHTML = '';
  $('scanStatus').textContent =
    'OCRを準備しています。少しお待ちください…';

  try {
    await loadOCR();

    $('scanStatus').textContent =
      'メーカー名と品番を読み取っています…';

    const worker = await Tesseract.createWorker('eng');

    let result;

    try {
      result = await worker.recognize(file);
    } finally {
      await worker.terminate();
    }

    const text = result.data.text || '';
    const brand = detectBrand(text);
    const code = detectCode(text, brand);

    $('scanStatus').textContent =
      '読み取りが完了しました。結果を確認してください。';

    $('scanResults').innerHTML = `
      <div class="result">
        <strong>読み取り候補</strong><br>
        メーカー：${esc(brand || '未判定')}<br>
        品番：${esc(code || '未判定')}
        <p class="small">
          正しくない場合は登録フォームで修正してください。
        </p>
        <button type="button"
          class="btn light"
          id="applyScan">
          登録フォームに反映する
        </button>
      </div>
    `;

    $('applyScan').addEventListener('click', () => {
      if (brand) {
        renderBrandSelect(brand);
      } else {
        renderBrandSelect();
        $('gelBrandSelect').value = '__new__';
        updateBrandArea();
      }

      if (code) {
        renderCodeSelect(code);
      } else {
        $('gelCodeSelect').value = '__new__';
        updateCodeArea();
      }

      $('gelForm').scrollIntoView({
        behavior:'smooth',
        block:'start'
      });
    });

  } catch (e) {
    $('scanStatus').textContent =
      '読み取りに失敗しました：' + e.message;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---------- EVENTS ----------

document.querySelectorAll('#nav button')
  .forEach(btn => {
    btn.addEventListener('click', () =>
      showPage(btn.dataset.page)
    );
  });

document.querySelectorAll('[data-go]')
  .forEach(btn => {
    btn.addEventListener('click', () =>
      showPage(btn.dataset.go)
    );
  });

$('search').addEventListener('input', renderCatalog);
$('brand').addEventListener('change', renderCatalog);
$('finish').addEventListener('change', renderCatalog);

$('diagnoseBtn').addEventListener('click', diagnose);

$('clearCompare').addEventListener('click', () => {
  comparison = [];
  renderAll();
});

$('closeDetail').addEventListener('click', () => {
  $('detail').close();
  currentDetail = null;
});

document.addEventListener('click', event => {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === 'detail') {
    detail(id);
    return;
  }

  if (action === 'favorite') {
    if (favorites.includes(id)) {
      favorites = favorites.filter(x => x !== id);
    } else {
      favorites.push(id);
    }

    persist();
    renderAll();
  }

  if (action === 'compare') {
    if (comparison.includes(id)) {
      comparison = comparison.filter(x => x !== id);
    } else {
      if (comparison.length >= 2) {
        alert('比較できるのは2色までです');
        return;
      }
      comparison.push(id);
    }

    renderAll();
  }
});

$('gelBrandSelect').addEventListener(
  'change', updateBrandArea
);

$('gelBrand').addEventListener(
  'input', () => renderCodeSelect()
);

$('gelCodeSelect').addEventListener(
  'change', updateCodeArea
);

$('gelForm').addEventListener('submit', saveGel);

$('cancelEdit').addEventListener('click', resetForm);

$('gelPhoto').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    pendingPhoto = await compressPhoto(file);
    renderPhoto();
  } catch (e) {
    alert(e.message);
  }
});

$('removePhoto').addEventListener('click', () => {
  pendingPhoto = '';
  $('gelPhoto').value = '';
  renderPhoto();
});

$('stockList').addEventListener('change', event => {
  const box = event.target.closest('[data-stock]');
  if (!box) return;

  toggleStock(box.dataset.stock, box.checked);
});

$('stockList').addEventListener('click', event => {
  const btn = event.target.closest('[data-admin]');
  if (!btn) return;

  if (btn.dataset.admin === 'edit') {
    editGel(btn.dataset.id);
  }

  if (btn.dataset.admin === 'delete') {
    deleteGel(btn.dataset.id);
  }
});

$('scanPhoto').addEventListener('change', event => {
  const file = event.target.files[0];
  scanGel(file);
  event.target.value = '';
});

$('exportData').addEventListener('click', exportData);

$('importData').addEventListener('click', () => {
  $('importFile').click();
});

$('importFile').addEventListener('change', async event => {
  await importData(event.target.files[0]);
  event.target.value = '';
});

$('resetData').addEventListener('click', resetData);

// ---------- START ----------

renderBrandSelect();
renderPhoto();
renderAll();

/* NAIL MATCH v4 COMPLETE */
