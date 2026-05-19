import JSZip from 'jszip';

// ─── CSS ─────────────────────────────────────────────────────────────

const EXPORT_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fafaf9;color:#1c1917;line-height:1.5}
nav{position:fixed;left:0;top:0;width:220px;height:100vh;overflow-y:auto;background:#fff;border-right:1px solid #e7e5e4;padding:20px 14px}
nav h2{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#78716c;margin-bottom:10px}
nav ul{list-style:none}
nav li a{display:block;padding:5px 10px;border-radius:6px;font-size:13px;color:#44403c;text-decoration:none;margin-bottom:2px;cursor:pointer}
nav li a:hover{background:#f5f5f4}
nav li a.active{background:#1c1917;color:#fff}
main{margin-left:240px;padding:40px 48px;max-width:860px}
.export-header{margin-bottom:40px;padding-bottom:24px;border-bottom:1px solid #e7e5e4}
.export-header h1{font-size:30px;font-weight:700;margin-bottom:4px}
.export-header p{font-size:13px;color:#78716c;margin-bottom:12px}
.print-btn{padding:8px 16px;background:#1c1917;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px}
.project{margin-bottom:56px}
.project-title{font-size:26px;font-weight:700;margin-bottom:4px}
.project-desc{font-size:14px;color:#78716c;margin-bottom:14px}
.progress-bar{height:5px;background:#e7e5e4;border-radius:3px;overflow:hidden;margin-bottom:5px}
.progress-fill{height:100%;background:#059669;border-radius:3px}
.progress-label{font-size:12px;color:#78716c;margin-bottom:20px}
.step{background:#fff;border:1px solid #e7e5e4;border-radius:12px;margin-bottom:10px;overflow:hidden}
.step-pending{opacity:.65}
.step-header{padding:14px 18px;cursor:pointer;user-select:none;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.step-header:hover{background:#fafaf9}
.step-chevron{font-size:16px;color:#a8a29e;transition:transform .2s;flex-shrink:0;margin-top:2px}
.step.open .step-chevron{transform:rotate(180deg)}
.step-body{display:none;padding:14px 18px;border-top:1px solid #f5f5f4}
.step.open .step-body{display:block}
.step-meta{display:flex;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap}
.badge{font-size:11px;padding:2px 8px;border-radius:4px;font-weight:500}
.badge-done{background:#d1fae5;color:#065f46}
.badge-progress{background:#fef3c7;color:#92400e}
.badge-pending{background:#f5f5f4;color:#57534e}
.step-type,.step-date{font-size:12px;color:#78716c}
.step-title{font-size:17px;font-weight:600;margin-bottom:3px}
.step-short{font-size:13px;color:#57534e}
.step-body{padding:14px 18px;border-top:1px solid #f5f5f4}
.step-full{font-size:14px;line-height:1.75;color:#292524;white-space:pre-wrap;margin-bottom:12px}
.step-info{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#78716c;margin-bottom:12px}
.files{margin-top:10px}
.file-link{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#44403c;text-decoration:none;background:#f5f5f4;padding:6px 10px;border-radius:6px;margin:3px;border:1px solid #e7e5e4}
.file-link:hover{background:#e7e5e4}
.images{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-top:10px}
.images figure{margin:0}
.images img{width:100%;border-radius:8px;display:block;object-fit:cover;aspect-ratio:16/9}
.images figcaption{font-size:11px;color:#78716c;margin-top:3px;text-align:center}
@media print{
  nav,.print-btn{display:none!important}
  main{margin:0;padding:20px}
  .step{break-inside:avoid;page-break-inside:avoid}
  body{background:#fff}
}
@media(max-width:640px){
  nav{display:none}
  main{margin:0;padding:20px}
}
`;

// ─── Yordamchi funksiyalar ────────────────────────────────────────────

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function effDate(step) {
  return step.status === 'done' && step.completedDate ? step.completedDate : step.scheduledDate;
}

async function fetchBlob(url) {
  if (!url || url.startsWith('data:')) return null;
  try {
    const r = await fetch(url, { mode: 'cors' });
    if (!r.ok) return null;
    return await r.blob();
  } catch { return null; }
}

function blobToDataUrl(blob) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

function getExt(blob, url) {
  const fromMime = blob?.type?.split('/')[1]?.split(';')[0];
  if (fromMime) return fromMime === 'jpeg' ? 'jpg' : fromMime;
  const urlExt = url?.split('?')[0].split('.').pop()?.toLowerCase();
  if (urlExt && ['jpg','jpeg','png','gif','webp','svg'].includes(urlExt)) return urlExt;
  return 'jpg';
}

// Barcha rasmlarni yuklaydi: { key: { blob, dataUrl, ext, originalUrl } }
async function buildImageMap(steps, onProgress) {
  const map = {};
  const tasks = [];

  for (const step of steps) {
    for (let i = 0; i < (step.images || []).length; i++) {
      const img = step.images[i];
      const key = `${step.id}_img_${i}`;

      if (img.url?.startsWith('data:')) {
        // Base64 — allaqachon tayyor
        const ext = img.url.split(';')[0].split('/')[1] || 'jpg';
        map[key] = { dataUrl: img.url, ext, originalUrl: img.url, blob: null };
      } else {
        // URL — fetch qilish kerak
        tasks.push(
          fetchBlob(img.url).then(async blob => {
            if (blob) {
              const dataUrl = await blobToDataUrl(blob);
              map[key] = { blob, dataUrl, ext: getExt(blob, img.url), originalUrl: img.url };
            } else {
              map[key] = { blob: null, dataUrl: null, ext: 'jpg', originalUrl: img.url };
            }
          })
        );
      }
    }
  }

  await Promise.all(tasks);
  return map;
}

// ─── HTML yaratish ─────────────────────────────────────────────────────

function buildHTML(projects, steps, imageMap, zipMode) {
  const SL = { done: 'Bajarilgan', progress: 'Jarayonda', pending: 'Rejada' };
  const TL = { meeting: 'Uchrashuv', seminar: 'Seminar', online_training: 'Onlayn trening', agreement: 'Kelishuv', other: 'Boshqa' };

  const sorted = [...projects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  let nav = '<nav><h2>Loyihalar</h2><ul>';
  let content = '';

  for (const p of sorted) {
    const pSteps = steps
      .filter(s => s.projectId === p.id)
      .sort((a, b) => {
        const da = effDate(a), db = effDate(b);
        if (!da) return 1; if (!db) return -1;
        return da.localeCompare(db);
      });

    const done = pSteps.filter(s => s.status === 'done').length;
    const pct  = pSteps.length ? Math.round(done / pSteps.length * 100) : 0;

    nav += `<li><a onclick="showProject('${p.id}')">${esc(p.name)}</a></li>`;

    content += `
<div class="project" id="p-${p.id}">
  <h2 class="project-title">${esc(p.name)}</h2>
  ${p.description ? `<p class="project-desc">${esc(p.description)}</p>` : ''}
  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
  <p class="progress-label">${pct}% &mdash; ${done}/${pSteps.length} bajarilgan</p>`;

    for (const step of pSteps) {
      // Rasmlar
      let imagesHtml = '';
      for (let i = 0; i < (step.images || []).length; i++) {
        const img = step.images[i];
        const key = `${step.id}_img_${i}`;
        const entry = imageMap[key];
        let src;
        if (zipMode && entry?.blob) {
          src = `images/${key}.${entry.ext}`;
        } else {
          src = entry?.dataUrl || entry?.originalUrl || img.url;
        }
        imagesHtml += `<figure><img src="${esc(src)}" alt="${esc(img.caption || '')}" loading="lazy"><figcaption>${esc(img.caption || '')}</figcaption></figure>`;
      }

      // Fayllar
      let filesHtml = '';
      for (const f of (step.files || [])) {
        if (!f.url?.startsWith('data:')) {
          filesHtml += `<a class="file-link" href="${esc(f.url)}" target="_blank">📎 ${esc(f.name || f.url)}</a>`;
        }
      }

      content += `
  <div class="step${step.status === 'pending' ? ' step-pending' : ''}">
    <div class="step-header" onclick="this.parentElement.classList.toggle('open')">
      <div>
        <div class="step-meta">
          <span class="badge badge-${step.status}">${SL[step.status] || step.status}</span>
          <span class="step-type">${TL[step.type] || step.type}</span>
          <span class="step-date">${fmtDate(effDate(step))}</span>
        </div>
        <h3 class="step-title">${esc(step.title)}</h3>
        <p class="step-short">${esc(step.shortDescription || '')}</p>
      </div>
      <span class="step-chevron">&#8964;</span>
    </div>
    <div class="step-body">
      ${step.fullDescription ? `<p class="step-full">${esc(step.fullDescription)}</p>` : ''}
      <div class="step-info">
        ${step.location    ? `<span>📍 ${esc(step.location)}</span>` : ''}
        ${step.participants ? `<span>👥 ${step.participants} qatnashchi</span>` : ''}
        ${step.scheduledDate  ? `<span>📅 Reja: ${fmtDate(step.scheduledDate)}</span>`  : ''}
        ${step.completedDate  ? `<span>✅ Bajarildi: ${fmtDate(step.completedDate)}</span>` : ''}
      </div>
      ${imagesHtml ? `<div class="images">${imagesHtml}</div>` : ''}
      ${filesHtml  ? `<div class="files">${filesHtml}</div>`   : ''}
    </div>
  </div>`;
    }

    content += '\n</div>';
  }

  nav += '</ul></nav>';

  const exportDate = new Date().toLocaleString('uz-Latn-UZ', { dateStyle: 'long', timeStyle: 'short' }) || new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Loyihalarim &mdash; ${new Date().toLocaleDateString()}</title>
<style>${EXPORT_CSS}</style>
<script>
function showProject(id) {
  document.querySelectorAll('.project').forEach(function(p) {
    p.style.display = p.id === 'p-' + id ? 'block' : 'none';
  });
  document.querySelectorAll('nav li a').forEach(function(a) {
    a.classList.toggle('active', a.getAttribute('onclick') === "showProject('" + id + "')");
  });
}
window.onload = function() {
  var first = document.querySelector('.project');
  if (first) showProject(first.id.replace('p-', ''));
};
</script>
</head>
<body>
${nav}
<main>
<div class="export-header">
  <h1>Loyihalarim</h1>
  <p>Eksport qilingan: ${exportDate}</p>
  <button class="print-btn" onclick="window.print()">&#128438; Chop etish</button>
</div>
${content}
</main>
</body>
</html>`;
}

// ─── Eksport funksiyalari ─────────────────────────────────────────────

export async function exportAsHTML(projects, steps, setStatus) {
  setStatus('Rasmlar yuklanmoqda...');
  const imageMap = await buildImageMap(steps);
  setStatus('HTML fayl yaratilmoqda...');
  const html = buildHTML(projects, steps, imageMap, false);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `loyihalarim_${new Date().toISOString().slice(0,10)}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setStatus('');
}

export async function exportAsZIP(projects, steps, setStatus) {
  setStatus('Rasmlar yuklanmoqda...');
  const imageMap = await buildImageMap(steps);
  setStatus('ZIP arxiv yaratilmoqda...');
  const zip = new JSZip();

  // Rasmlarni images/ papkasiga qo'shish
  for (const [key, entry] of Object.entries(imageMap)) {
    if (entry.blob) {
      zip.file(`images/${key}.${entry.ext}`, entry.blob);
    }
  }

  // HTML
  const html = buildHTML(projects, steps, imageMap, true);
  zip.file('index.html', html);

  setStatus('Siqilmoqda...');
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const url = URL.createObjectURL(zipBlob);
  const a   = document.createElement('a');
  a.href = url;
  a.download = `loyihalarim_${new Date().toISOString().slice(0,10)}.zip`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setStatus('');
}
