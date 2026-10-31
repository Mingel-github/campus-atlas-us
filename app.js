const stateNames = {
  AL: 'Alabama', AR: 'Arkansas', AZ: 'Arizona', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DC: 'Washington, D.C.', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', IA: 'Iowa', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', MA: 'Massachusetts',
  MD: 'Maryland', MI: 'Michigan', MN: 'Minnesota', MO: 'Missouri', MS: 'Mississippi', NC: 'North Carolina', ND: 'North Dakota', NE: 'Nebraska',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NV: 'Nevada', NY: 'New York', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VA: 'Virginia', VT: 'Vermont', WA: 'Washington', WI: 'Wisconsin', WV: 'West Virginia'
};

const countryNames = { US: 'United States', HK: 'Hong Kong', SG: 'Singapore', AU: 'Australia', GB: 'United Kingdom' };
const regionViews = {
  US: { center: [38.7, -96.5], zoom: 4, label: '回到全美' },
  HK: { center: [22.35, 114.18], zoom: 11, label: '回到香港' },
  SG: { center: [1.32, 103.78], zoom: 11, label: '回到新加坡' },
  AU: { center: [-25.3, 133.8], zoom: 4, label: '回到澳洲' },
  GB: { center: [53.7, -2.1], zoom: 6, label: '回到英国' }
};

const wikiNames = {
  'ohio-state-university-columbus': 'Ohio State University',
  'university-of-washington': 'University of Washington',
  'virginia-tech': 'Virginia Tech',
  'texas-a-m-university': 'Texas A&M University',
  'university-of-pittsburgh': 'University of Pittsburgh',
  'north-carolina-state-university': 'North Carolina State University',
  'the-pennsylvania-state-university': 'Pennsylvania State University',
  'purdue-university-main-campus': 'Purdue University',
  'university-of-missouri': 'University of Missouri',
  'stony-brook-university-suny': 'Stony Brook University',
  'binghamton-university-suny': 'Binghamton University',
  'university-at-buffalo-suny': 'University at Buffalo',
  'university-of-tennessee-knoxville': 'University of Tennessee',
  'university-at-albany': 'University at Albany, SUNY',
  'north-carolina-agricultural-and-technical-state-university': 'North Carolina A&T State University',
  'university-of-new-south-wales': 'University of New South Wales',
  'university-college-london': 'University College London'
};

const searchInput = document.getElementById('search-input');
const typeFilter = document.getElementById('type-filter');
const stateFilter = document.getElementById('state-filter');
const listEl = document.getElementById('school-list');
const countEl = document.getElementById('result-count');
const detailEl = document.getElementById('detail-card');
const noResultsEl = document.getElementById('no-results');
const sidebarEl = document.getElementById('sidebar');
const usFiltersEl = document.getElementById('us-filters');
const legendEl = document.getElementById('map-legend');
let schools = [];
let rankLimit = Infinity;
let currentCountry = 'US';
let selectedId = null;
let markers = new Map();
const photoCache = new Map();

const map = L.map('map', { zoomControl: false, minZoom: 3, maxZoom: 18, scrollWheelZoom: true }).setView([38.7, -96.5], 4);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(map);

const clusters = L.markerClusterGroup({
  maxClusterRadius: 46,
  showCoverageOnHover: false,
  spiderfyOnMaxZoom: true,
  iconCreateFunction(group) {
    const count = group.getChildCount();
    return L.divIcon({ className: 'cluster-wrap', html: `<div class="cluster-dot">${count}</div>`, iconSize: [44, 44], iconAnchor: [22, 22] });
  }
});
map.addLayer(clusters);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function rankColor(rank) {
  return !Number.isFinite(rank) ? 'violet' : rank <= 25 ? 'gold' : rank <= 50 ? 'teal' : rank <= 100 ? 'slate' : 'violet';
}

function schoolCountry(school) { return school.country || 'US'; }
function schoolRank(school) { return schoolCountry(school) === 'US' ? (school.rankLabel || school.rank) : school.qsRank; }
function schoolColor(school) { return schoolCountry(school) === 'US' ? rankColor(school.rank) : 'global'; }
function schoolPlace(school) {
  const country = schoolCountry(school);
  if (country === 'US') return `${school.city}, ${stateNames[school.state] || school.state}`;
  if (country === 'SG') return 'Singapore';
  return `${school.city}, ${countryNames[country]}`;
}

function schoolSummary(school) {
  const kind = school.type === 'public' ? 'public' : 'private';
  return `${school.name} is a ${kind} university in ${schoolPlace(school)}. The map marker points to its main campus.`;
}

function getFiltered() {
  const query = searchInput.value.trim().toLowerCase();
  const kind = typeFilter.value;
  const region = stateFilter.value;
  return schools.filter(school =>
    schoolCountry(school) === currentCountry &&
    (currentCountry !== 'US' || rankLimit === Infinity || (Number.isFinite(school.rank) && school.rank <= rankLimit)) &&
    (currentCountry !== 'US' || kind === 'all' || school.type === kind) &&
    (currentCountry !== 'US' || region === 'all' || school.state === region) &&
    (!query || `${school.name} ${school.nameZh} ${school.aliases} ${school.city} ${school.state} ${countryNames[schoolCountry(school)]}`.toLowerCase().includes(query))
  );
}

function makeMarker(school) {
  const color = schoolColor(school);
  const icon = L.divIcon({
    className: 'pin-wrap',
    html: `<div class="school-pin ${color}${selectedId === school.id ? ' selected' : ''}" title="${escapeHtml(school.nameZh)} · ${escapeHtml(school.name)}"><span>${school.markerLabel || schoolRank(school)}</span></div>`,
    iconSize: [34, 40],
    iconAnchor: [17, 37]
  });
  const marker = L.marker([school.lat, school.lon], { icon, title: `${school.nameZh} · ${school.name}` });
  marker.on('click', () => selectSchool(school, false));
  return marker;
}

function render() {
  const visible = getFiltered();
  countEl.textContent = `${visible.length} 所`;
  noResultsEl.hidden = visible.length !== 0;
  listEl.innerHTML = visible.map(school => `
    <button class="school-row${school.id === selectedId ? ' selected' : ''}" type="button" data-id="${school.id}">
      <span class="row-rank ${schoolColor(school)}">${school.markerLabel || schoolRank(school)}</span>
      <span class="row-text"><strong>${escapeHtml(school.name)}</strong><span class="row-name-zh">${escapeHtml(school.nameZh)}</span><small>${escapeHtml(schoolPlace(school))} <span class="row-bullet">·</span> ${school.type === 'public' ? '公立' : '私立'}</small></span>
      <span class="row-arrow" aria-hidden="true">↗</span>
    </button>
  `).join('');

  markers = new Map();
  clusters.clearLayers();
  for (const school of visible) {
    const marker = makeMarker(school);
    markers.set(school.id, marker);
    clusters.addLayer(marker);
  }
  if (selectedId && !markers.has(selectedId)) {
    selectedId = null;
    detailEl.hidden = true;
  }
}

function detailHtml(school) {
  const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${school.lat}%2C${school.lon}`;
  return `
    <button class="detail-close" type="button" aria-label="关闭学校信息">×</button>
    <div class="detail-image" id="detail-image"><div class="image-placeholder"><span>✦</span><small>CAMPUS PHOTO</small></div></div>
    <div class="detail-content">
      <div class="detail-meta"><span class="detail-rank ${schoolColor(school)}">${school.rankCategory ? '' : '#'}${schoolRank(school)}</span><span>${schoolCountry(school) === 'US' ? `2027 U.S. NEWS${school.rankCategory ? ` · ${escapeHtml(school.rankCategory.toUpperCase())}` : ''}` : 'QS 2027'}</span><span class="meta-sep">·</span><span>${school.type === 'public' ? '公立大学' : '私立大学'}</span>${schoolCountry(school) === 'US' && school.qsRank ? `<span class="detail-qs">QS 2027 #${escapeHtml(school.qsRank)}</span>` : ''}</div>
      <h2>${escapeHtml(school.name)}</h2>
      <p class="detail-name-zh">${escapeHtml(school.nameZh)}</p>
      <p class="detail-location">⌖ ${escapeHtml(schoolPlace(school))}</p>
      <p class="detail-description" id="detail-description">${escapeHtml(schoolSummary(school))}</p>
      <a id="wiki-source" class="wiki-source" hidden target="_blank" rel="noopener noreferrer">简介来源：Wikipedia ↗</a>
      <div class="detail-actions"><a class="primary-action" href="${escapeHtml(school.website)}" target="_blank" rel="noopener noreferrer">访问学校官网 <span>↗</span></a><a class="secondary-action" href="${mapUrl}" target="_blank" rel="noopener noreferrer" title="在 Google Maps 中查看路线">路线 <span>↗</span></a></div>
    </div>
  `;
}

function photoScore(title, school) {
  if (!/\.(jpe?g|png|webp)$/i.test(title) || /(logo|seal|crest|coat.of.arms|shield|wordmark|emblem|map|flag|icon)/i.test(title)) return -1;
  const name = title.toLowerCase();
  let score = 0;
  if (/(main entrance|front entrance|main gate|front gate|entrance|gateway)/i.test(name)) score += 110;
  if (/(main building|main hall|main campus|campus|university hall|college hall)/i.test(name)) score += 70;
  if (/(building|hall|library|quadrangle|quad|dome|tower|lawn)/i.test(name)) score += 25;
  if (/(aerial|bird.?s.eye)/i.test(name)) score -= 15;
  if (/(historic|archive|construction|18\d\d|19\d\d|old campus)/i.test(name)) score -= 80;
  if (/(portrait|president|football|basketball|graduation|ceremony|team|protest)/i.test(name)) score -= 60;
  const words = school.name.toLowerCase().split(/[^a-z]+/).filter(word => word.length > 4 && !['university', 'college', 'institute', 'state'].includes(word));
  if (words.some(word => name.includes(word))) score += 12;
  return score;
}

function showCampusPhoto(school, url, sourceUrl, credit) {
  const image = new Image();
  image.alt = `${school.nameZh} 校园照片`;
  image.onload = () => {
    if (selectedId !== school.id) return;
    const imageEl = document.getElementById('detail-image');
    imageEl.replaceChildren(image);
    if (sourceUrl) {
      const source = document.createElement('a');
      source.className = 'photo-credit';
      source.href = sourceUrl;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.textContent = credit ? `图片：${credit} ↗` : '图片来源 ↗';
      source.title = source.textContent;
      imageEl.appendChild(source);
    }
  };
  image.src = url;
}

async function loadCampusPhoto(school, title, fallback) {
  if (photoCache.has(school.id)) {
    const saved = photoCache.get(school.id);
    showCampusPhoto(school, saved.url, saved.source, saved.credit);
    return;
  }
  try {
    const search = new URLSearchParams({ action: 'query', prop: 'images', imlimit: '500', redirects: '1', titles: title, format: 'json', origin: '*' });
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${search}`);
    const page = Object.values((await response.json()).query?.pages || {})[0];
    const photo = (page?.images || []).map(file => ({ title: file.title, score: photoScore(file.title, school) }))
      .filter(file => file.score > 0).sort((a, b) => b.score - a.score)[0];
    if (photo) {
      const infoQuery = new URLSearchParams({ action: 'query', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '900', titles: photo.title, format: 'json', origin: '*' });
      const infoResponse = await fetch(`https://en.wikipedia.org/w/api.php?${infoQuery}`);
      const infoPage = Object.values((await infoResponse.json()).query?.pages || {})[0];
      const info = infoPage?.imageinfo?.[0];
      if (info?.thumburl || info?.url) {
        const rawArtist = info.extmetadata?.Artist?.value || '';
        const artist = new DOMParser().parseFromString(rawArtist, 'text/html').body.textContent.trim().replace(/\s+/g, ' ').slice(0, 55);
        const license = info.extmetadata?.LicenseShortName?.value || '';
        const saved = { url: info.thumburl || info.url, source: info.descriptionurl, credit: [artist, license].filter(Boolean).join(' · ') };
        photoCache.set(school.id, saved);
        showCampusPhoto(school, saved.url, saved.source, saved.credit);
        return;
      }
    }
  } catch (_) {
    // If photo lookup fails, use the article's photo when available.
  }
  if (fallback) {
    photoCache.set(school.id, { ...fallback, credit: 'Wikipedia' });
    showCampusPhoto(school, fallback.url, fallback.source, 'Wikipedia');
  }
}

async function loadWiki(school) {
  const title = wikiNames[school.id] || school.name.replace(/\s[-—–]\s/g, ', ').replace(/—/g, ', ');
  let photoTitle = title;
  let fallback = null;
  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(' ', '_'))}`);
    const article = await response.json();
    if (selectedId === school.id && article.type === 'standard') {
      photoTitle = article.title || title;
      const descriptionEl = document.getElementById('detail-description');
      const sourceEl = document.getElementById('wiki-source');
      if (article.extract) descriptionEl.textContent = article.extract.slice(0, 350);
      if (article.content_urls?.desktop?.page) {
        sourceEl.href = article.content_urls.desktop.page;
        sourceEl.hidden = false;
      }
      const thumbnail = article.thumbnail?.source || '';
      if (thumbnail && !/(seal|logo|crest|coat.of.arms|shield|wordmark|emblem)/i.test(decodeURIComponent(thumbnail))) {
        fallback = { url: thumbnail, source: article.content_urls?.desktop?.page || '' };
      }
    }
  } catch (_) {
    // Local school details remain available.
  }
  if (selectedId === school.id) loadCampusPhoto(school, photoTitle, fallback);
}

function selectSchool(school, focusMap = true) {
  selectedId = school.id;
  detailEl.innerHTML = detailHtml(school);
  detailEl.hidden = false;
  document.querySelectorAll('.school-row.selected').forEach(row => row.classList.remove('selected'));
  document.querySelector(`.school-row[data-id="${school.id}"]`)?.classList.add('selected');
  const focus = () => {
    map.setView([school.lat, school.lon], Math.max(map.getZoom(), 8), { animate: false });
    if (window.innerWidth > 680) {
      map.panBy([Math.min(detailEl.offsetWidth / 2 + 20, map.getSize().x * 0.35), 0], { animate: false });
    }
  };
  if (focusMap) clusters.zoomToShowLayer(markers.get(school.id), focus);
  else focus();
  loadWiki(school);
  if (window.innerWidth <= 680) {
    sidebarEl.classList.add('collapsed');
    document.getElementById('mobile-toggle').setAttribute('aria-expanded', 'false');
  }
}

listEl.addEventListener('click', event => {
  const row = event.target.closest('[data-id]');
  if (!row) return;
  const school = schools.find(item => item.id === row.dataset.id);
  if (school) selectSchool(school);
});

detailEl.addEventListener('click', event => {
  if (event.target.closest('.detail-close')) {
    detailEl.hidden = true;
    selectedId = null;
    document.querySelectorAll('.school-row.selected').forEach(row => row.classList.remove('selected'));
  }
});

searchInput.addEventListener('input', render);
typeFilter.addEventListener('change', render);
stateFilter.addEventListener('change', render);
document.querySelectorAll('[data-country]').forEach(button => button.addEventListener('click', () => {
  currentCountry = button.dataset.country;
  searchInput.value = '';
  selectedId = null;
  detailEl.hidden = true;
  document.querySelectorAll('[data-country]').forEach(chip => chip.classList.toggle('active', chip === button));
  usFiltersEl.hidden = currentCountry !== 'US';
  legendEl.innerHTML = currentCountry === 'US'
    ? '<span><i class="legend-dot gold"></i>前 25</span><span><i class="legend-dot teal"></i>26–50</span><span><i class="legend-dot slate"></i>51–100</span><span><i class="legend-dot violet"></i>100 名后</span><span class="legend-explain">水滴：U.S. News 排名（R 为区域榜） · 圆形：学校数</span>'
    : '<span><i class="legend-dot global"></i>QS 2027 综合排名</span><span class="legend-explain">水滴数字：QS 排名 · 圆形数字：学校数</span>';
  const view = regionViews[currentCountry];
  document.querySelector('#reset-view span').textContent = view.label;
  map.flyTo(view.center, view.zoom);
  render();
}));
document.querySelectorAll('[data-rank]').forEach(button => button.addEventListener('click', () => {
  rankLimit = button.dataset.rank === 'all' ? Infinity : Number(button.dataset.rank);
  document.querySelectorAll('[data-rank]').forEach(chip => chip.classList.toggle('active', chip === button));
  render();
}));

document.getElementById('reset-view').addEventListener('click', () => {
  const view = regionViews[currentCountry];
  map.flyTo(view.center, view.zoom);
});
document.getElementById('mobile-toggle').addEventListener('click', event => {
  const collapsed = sidebarEl.classList.toggle('collapsed');
  event.currentTarget.setAttribute('aria-expanded', String(!collapsed));
  event.currentTarget.innerHTML = `${collapsed ? '展开' : '收起'}学校列表 <span>⌄</span>`;
  setTimeout(() => map.invalidateSize(), 240);
});

document.addEventListener('keydown', event => {
  if (event.key === '/' && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === 'Escape' && !detailEl.hidden) {
    detailEl.hidden = true;
    selectedId = null;
  }
});

fetch('./schools.json').then(response => response.json()).then(data => {
  schools = data;
  for (const state of [...new Set(schools.filter(school => schoolCountry(school) === 'US').map(school => school.state))].sort()) {
    const option = document.createElement('option');
    option.value = state;
    option.textContent = `${stateNames[state] || state} · ${state}`;
    stateFilter.appendChild(option);
  }
  render();
});
