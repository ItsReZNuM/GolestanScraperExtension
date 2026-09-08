import { CourseData, FieldOption, GroupKey } from '@/types/course';

// Escape user-controlled cell text before injecting into the print document.
function esc(value: string): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function groupLabel(key: GroupKey): string {
  if (key === 'gender') return 'جنسیت';
  if (key === 'instructor') return 'استاد';
  return 'درس';
}

// Build a composite group title such as "مرد | محمدی مجید" from active keys.
function groupTitle(course: CourseData, keys: GroupKey[]): string {
  if (keys.length === 0) return 'همه دروس';
  return keys.map((k) => course[k] || '—').join(' | ');
}

// Render one RTL data table for the given rows/columns.
function renderTable(rows: CourseData[], fields: FieldOption[]): string {
  const headers = fields.map((f) => `<th>${esc(f.label)}</th>`).join('');
  const body = rows
    .map(
      (c) =>
        `<tr>${fields.map((f) => `<td>${esc(c[f.key] || '-')}</td>`).join('')}</tr>`
    )
    .join('');
  return `<table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>`;
}

// Printable PDF via a print-ready window (fully offline, no external service).
// Layout: stats overview -> full table -> one section per group combination.
export function generatePrintablePDF(
  courses: CourseData[],
  selectedFields: FieldOption[],
  groupKeys: GroupKey[]
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('لطفاً اجازه باز شدن پاپ‌آپ را در مرورگر صادر کنید.');
    return;
  }

  const fields = selectedFields.length > 0 ? selectedFields : [];
  const total = courses.length;
  const male = courses.filter((c) => (c.gender || '').includes('مرد')).length;
  const female = courses.filter((c) => (c.gender || '').includes('زن')).length;
  const instructorCount = new Set(
    courses.map((c) => c.instructor).filter(Boolean)
  ).size;
  const courseCount = new Set(courses.map((c) => c.name).filter(Boolean)).size;

  // Group rows by composite key so any combination (e.g. gender+instructor) works.
  const groups = new Map<string, CourseData[]>();
  for (const c of courses) {
    const title = groupTitle(c, groupKeys);
    const bucket = groups.get(title);
    if (bucket) bucket.push(c);
    else groups.set(title, [c]);
  }
  const sortedGroups: Array<[string, CourseData[]]> = [];
  groups.forEach((rows, title) => {
    sortedGroups.push([title, rows]);
  });
  sortedGroups.sort((a, b) => a[0].localeCompare(b[0], 'fa'));

  const groupByLabel =
    groupKeys.length === 0
      ? 'بدون گروه‌بندی'
      : groupKeys.map(groupLabel).join(' + ');

  const overviewTable = renderTable(courses, fields);
  const groupedSections =
    groupKeys.length === 0
      ? ''
      : sortedGroups
          .map(
            ([title, rows]) => `
        <div class="group">
          <h3>${esc(title)} <span class="badge">${rows.length} ردیف</span></h3>
          ${renderTable(rows, fields)}
        </div>`
          )
          .join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="UTF-8">
<title>لیست دروس ارائه شده گلستان</title>
<style>
@page { size: A4 landscape; margin: 12mm; }
* { box-sizing: border-box; }
body { font-family: 'Vazirmatn', Tahoma, sans-serif; direction: rtl; font-size: 10px; color: #1e293b; margin: 0; padding: 24px; }
h1 { text-align: center; font-size: 18px; margin: 0 0 4px; }
h2 { font-size: 13px; margin: 22px 0 8px; border-right: 3px solid #6366f1; padding-right: 8px; }
h3 { font-size: 11.5px; margin: 16px 0 6px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 6px 10px; }
.sub { text-align: center; font-size: 9.5px; color: #64748b; margin-bottom: 12px; }
.stats { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0 4px; }
.stat { flex: 1 1 120px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; text-align: center; background: #f8fafc; }
.stat b { display: block; font-size: 15px; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; page-break-inside: auto; }
th, td { border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center; word-break: break-word; }
th { background: #eef2ff; font-size: 9.5px; }
tr:nth-child(even) { background: #f8fafc; }
tr { page-break-inside: avoid; }
.badge { display: inline-block; background: #6366f1; color: #fff; border-radius: 999px; padding: 1px 8px; font-size: 9px; margin-right: 6px; }
.footer { margin-top: 18px; text-align: center; font-size: 9px; color: #94a3b8; }
.group { page-break-inside: avoid; }
@media print { .no-print { display: none; } }
</style>
</head>
<body>
<h1>لیست دروس ارائه شده سامانه گلستان</h1>
<div class="sub">تولید شده توسط افزونه Golestan Scraper | گروه‌بندی: ${esc(groupByLabel)} | تعداد ردیف: ${total}</div>
<h2>نمای کلی</h2>
<div class="stats">
<div class="stat"><b>${total}</b>کل ردیف‌ها</div>
<div class="stat"><b>${male}</b>ویژه مرد</div>
<div class="stat"><b>${female}</b>ویژه زن</div>
<div class="stat"><b>${instructorCount}</b>استاد یکتا</div>
<div class="stat"><b>${courseCount}</b>درس یکتا</div>
</div>
<h2>جدول کامل دروس</h2>
${overviewTable}
${groupKeys.length > 0 ? `<h2>نمای گروه‌بندی‌شده (${esc(groupByLabel)})</h2>${groupedSections}` : ''}
<div class="footer">Golestan Course Extractor — github.com/ItsReZNuM/GolestanScraperExtension</div>
<script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}
