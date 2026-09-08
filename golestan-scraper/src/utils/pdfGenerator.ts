import { CourseData, FieldOption, GroupKey } from '../types/course';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  return 'نام درس';
}

function groupTitle(course: CourseData, keys: GroupKey[]): string {
  if (keys.length === 0) return 'همه دروس';
  return keys.map((k) => course[k] || 'نامشخص').join(' | ');
}

// وزن‌دهی درصدی ستون‌ها جهت چیدمان یکپارچه داخل عرض A4
const FIELD_WEIGHTS: Record<string, number> = {
  codeGroup: 4.8,
  name: 8.5,
  totalUnits: 2.2,
  practicalUnits: 2.2,
  capacity: 2.6,
  registered: 2.6,
  waitingList: 2.6,
  gender: 3.5,
  instructor: 6.5,
  scheduleLocation: 8.5,
  examSchedule: 6.8,
  restrictions: 6.8,
  cohort: 4.5,
  prerequisites: 5.5,
  deliveryMode: 3.8,
  coursePeriod: 3.8,
  description: 6.5,
};

function formatCell(key: string, val: string, isDense: boolean): string {
  const clean = esc(val || '-');
  if (key === 'gender') {
    if (val.includes('مرد')) return `<span class="badge badge-male"><span class="ct">مرد</span></span>`;
    if (val.includes('زن')) return `<span class="badge badge-female"><span class="ct">زن</span></span>`;
    if (val.includes('مختلط')) return `<span class="badge badge-mixed"><span class="ct">مختلط</span></span>`;
  }
  if (key === 'codeGroup' && val && val !== '-') {
    return `<span class="badge-code" dir="ltr"><span class="ct">${clean}</span></span>`;
  }
  if (
    (key === 'totalUnits' ||
      key === 'practicalUnits' ||
      key === 'capacity' ||
      key === 'registered' ||
      key === 'waitingList') &&
    val &&
    val !== '-'
  ) {
    return `<span class="badge-num" dir="ltr"><span class="ct">${clean}</span></span>`;
  }

  const isLongField = [
    'name',
    'scheduleLocation',
    'examSchedule',
    'restrictions',
    'prerequisites',
    'description',
  ].includes(key);

  if (isDense && isLongField) {
    return `<span class="ct long-txt">${clean}</span>`;
  }

  return `<span class="ct">${clean}</span>`;
}

interface PageItem {
  isHeader?: boolean;
  groupTitle?: string;
  count?: number;
  course?: CourseData;
  index?: number;
}

function getScopedStyles(colCount: number): string {
  const isUltraDense = colCount >= 14;
  const isDense = colCount >= 9;

  const thFontSize = isUltraDense ? '6.8px' : isDense ? '7.5px' : '8.5px';
  const tdFontSize = isUltraDense ? '6.8px' : isDense ? '7.5px' : '8px';
  const longTxtSize = isUltraDense ? '6px' : '6.8px';
  const badgeFontSize = isUltraDense ? '6.2px' : '7.2px';
  const cellPaddingY = isUltraDense ? '2px' : '4px';

  return `
  #pdf-render-sandbox,
  #pdf-render-sandbox * {
    box-sizing: border-box !important;
    margin: 0;
    padding: 0;
    letter-spacing: 0 !important; /* غیرفعال‌سازی تغییر فاصله که باعث شکستن حروف متصل فارسی می‌شود */
    font-feature-settings: "liga" 1, "calt" 1; /* اطمینان از اتصال صحیح خطوط نستعلیق و نسخ */
    text-rendering: optimizeLegibility;
  }
  
  #pdf-render-sandbox .pdf-page-container {
    width: 1122px;
    height: 794px;
    padding: 20px 24px;
    background: #090d16;
    color: #f1f5f9;
    font-family: 'Vazirmatn', Tahoma, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    direction: rtl;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    position: relative;
  }

  #pdf-render-sandbox .ct {
    display: inline-block;
    position: relative;
    top: -2.5px;
    vertical-align: middle;
    line-height: 1.2;
    word-break: normal;
  }

  #pdf-render-sandbox .long-txt {
    font-size: ${longTxtSize};
    line-height: 1.2;
    word-break: normal;
    overflow-wrap: break-word;
  }

  /* بخش هدر صفحه اول */
  #pdf-render-sandbox .hd {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 14px 9px 14px;
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    margin-bottom: 8px;
    position: relative;
  }
  #pdf-render-sandbox .hd::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #6366f1, #06b6d4, #a855f7);
    border-radius: 8px 8px 0 0;
  }
  #pdf-render-sandbox .hd-title h1 {
    font-size: 14px;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 3px;
    line-height: 1.2;
    word-break: normal;
    white-space: nowrap;
  }
  #pdf-render-sandbox .hd-title .meta {
    font-size: 8.5px;
    color: #94a3b8;
    line-height: 1.2;
  }
  #pdf-render-sandbox .hd-title .meta b {
    color: #38bdf8;
  }
  #pdf-render-sandbox .hd-date {
    text-align: left;
    font-size: 8px;
    color: #94a3b8;
    line-height: 1.4;
    white-space: nowrap;
  }
  #pdf-render-sandbox .hd-date b {
    color: #e2e8f0;
  }

  /* هدر فشرده صفحات ۲ به بعد */
  #pdf-render-sandbox .compact-hd {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 12px 7px 12px;
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 6px;
    margin-bottom: 8px;
    font-size: 9px;
    color: #94a3b8;
    line-height: 1.2;
    white-space: nowrap;
  }
  #pdf-render-sandbox .compact-hd b {
    color: #38bdf8;
  }

  /* آمار کلی */
  #pdf-render-sandbox .sts {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
    margin-bottom: 8px;
  }
  #pdf-render-sandbox .st {
    background: #111827;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 6px;
    padding: 4px 6px 6px 6px;
    text-align: center;
  }
  #pdf-render-sandbox .st .n {
    display: block;
    font-size: 14px;
    font-weight: 800;
    color: #38bdf8;
    line-height: 1.1;
    margin-bottom: 2px;
  }
  #pdf-render-sandbox .st .l {
    font-size: 7.5px;
    color: #94a3b8;
    line-height: 1.2;
  }

  /* جدول */
  #pdf-render-sandbox .table-wrapper {
    flex-grow: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  #pdf-render-sandbox table.report-tbl {
    width: 100%;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
    background: #0c121e;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    overflow: hidden;
  }
  #pdf-render-sandbox table.report-tbl th {
    background: #172033;
    color: #bae6fd;
    font-weight: 700;
    font-size: ${thFontSize};
    padding: 4px 2px 5px 2px;
    line-height: 1.2;
    text-align: center !important;
    vertical-align: middle !important;
    border-bottom: 1px solid rgba(56, 189, 248, 0.25);
    border-left: 1px solid rgba(255, 255, 255, 0.06);
    word-break: normal;
    overflow-wrap: break-word;
  }
  #pdf-render-sandbox table.report-tbl th:first-child {
    border-right: none;
  }
  #pdf-render-sandbox table.report-tbl td {
    padding: ${cellPaddingY} 2px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    border-left: 1px solid rgba(255, 255, 255, 0.04);
    color: #e2e8f0;
    font-size: ${tdFontSize};
    text-align: center !important;
    vertical-align: middle !important;
    word-break: normal;
    overflow-wrap: break-word;
  }
  #pdf-render-sandbox table.report-tbl tr.even-row td {
    background: rgba(255, 255, 255, 0.015);
  }
  #pdf-render-sandbox table.report-tbl tr.odd-row td {
    background: transparent;
  }

  /* ردیف گروه‌بندی */
  #pdf-render-sandbox tr.grp-row td {
    background: rgba(99, 102, 241, 0.16) !important;
    color: #c7d2fe !important;
    font-weight: 700;
    font-size: 8.5px;
    padding: 4px 8px 5px 8px !important;
    line-height: 1.2;
    border-top: 1px solid rgba(99, 102, 241, 0.4);
    border-bottom: 1px solid rgba(99, 102, 241, 0.4);
    text-align: center !important;
    word-break: normal;
  }

  /* نشان‌ها */
  #pdf-render-sandbox .badge {
    display: inline-block;
    vertical-align: middle;
    line-height: 1;
    padding: 1px 4px 2px 4px;
    border-radius: 3px;
    font-size: ${badgeFontSize};
    font-weight: 600;
    white-space: nowrap;
  }
  #pdf-render-sandbox .badge-male {
    background: rgba(37, 99, 235, 0.22);
    color: #93c5fd;
    border: 1px solid rgba(59, 130, 246, 0.4);
  }
  #pdf-render-sandbox .badge-female {
    background: rgba(219, 39, 119, 0.22);
    color: #f472b6;
    border: 1px solid rgba(236, 72, 153, 0.4);
  }
  #pdf-render-sandbox .badge-mixed {
    background: rgba(147, 51, 234, 0.22);
    color: #d8b4fe;
    border: 1px solid rgba(168, 85, 247, 0.4);
  }
  #pdf-render-sandbox .badge-code {
    display: inline-block;
    vertical-align: middle;
    line-height: 1;
    padding: 1px 4px 2px 4px;
    border-radius: 3px;
    background: rgba(15, 23, 42, 0.8);
    color: #a5b4fc;
    font-weight: 700;
    font-size: ${badgeFontSize};
    border: 1px solid rgba(99, 102, 241, 0.3);
    white-space: nowrap;
  }
  #pdf-render-sandbox .badge-num {
    display: inline-block;
    vertical-align: middle;
    line-height: 1;
    padding: 1px 4px 2px 4px;
    border-radius: 3px;
    background: rgba(56, 189, 248, 0.12);
    color: #38bdf8;
    font-weight: 700;
    font-size: ${badgeFontSize};
    border: 1px solid rgba(56, 189, 248, 0.3);
    white-space: nowrap;
  }

  /* پاورقی */
  #pdf-render-sandbox .ft {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 7.5px;
    color: #64748b;
    line-height: 1.2;
    white-space: nowrap;
  }
  #pdf-render-sandbox .ft b {
    color: #94a3b8;
  }
  `;
}

export async function generatePrintablePDF(
  courses: CourseData[],
  selectedFields: FieldOption[],
  groupKeys: GroupKey[]
): Promise<void> {
  if (!courses || courses.length === 0) return;

  const fields = selectedFields.length > 0 ? selectedFields : [];
  const colCount = fields.length + 1;
  const isDense = colCount >= 9;

  const indexColWeight = 2.0;
  const totalWeight =
    indexColWeight +
    fields.reduce((acc, f) => acc + (FIELD_WEIGHTS[f.key] || 4.5), 0);

  const indexColWidthPct = ((indexColWeight / totalWeight) * 100).toFixed(2) + '%';
  const colWidthPcts: Record<string, string> = {};
  fields.forEach((f) => {
    const w = FIELD_WEIGHTS[f.key] || 4.5;
    colWidthPcts[f.key] = ((w / totalWeight) * 100).toFixed(2) + '%';
  });

  const total = courses.length;
  const male = courses.filter((c) => (c.gender || '').includes('مرد')).length;
  const female = courses.filter((c) => (c.gender || '').includes('زن')).length;
  const mixed = courses.filter((c) => (c.gender || '').includes('مختلط')).length;
  const instructorCount = new Set(courses.map((c) => c.instructor).filter(Boolean)).size;
  const courseCount = new Set(courses.map((c) => c.name).filter(Boolean)).size;
  const totalUnits = courses.reduce((sum, c) => sum + (parseInt(c.totalUnits, 10) || 0), 0);

  const groupByLabel =
    groupKeys.length === 0
      ? 'بدون گروه‌بندی (یکپارچه)'
      : groupKeys.map(groupLabel).join(' + ');

  const persianDate = new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  const allItems: PageItem[] = [];

  if (groupKeys.length === 0) {
    courses.forEach((c, idx) => {
      allItems.push({ course: c, index: idx + 1 });
    });
  } else {
    const groups = new Map<string, CourseData[]>();
    for (const c of courses) {
      const title = groupTitle(c, groupKeys);
      const bucket = groups.get(title);
      if (bucket) bucket.push(c);
      else groups.set(title, [c]);
    }
    const sortedGroups: Array<[string, CourseData[]]> = [];
    groups.forEach((rows, title) => sortedGroups.push([title, rows]));
    sortedGroups.sort((a, b) => a[0].localeCompare(b[0], 'fa'));

    let globalIndex = 1;
    for (const [title, rows] of sortedGroups) {
      allItems.push({ isHeader: true, groupTitle: title, count: rows.length });
      for (const row of rows) {
        allItems.push({ course: row, index: globalIndex++ });
      }
    }
  }

  const ROWS_PAGE_1 = colCount >= 14 ? 8 : colCount >= 10 ? 9 : 10;
  const ROWS_PAGE_OTHER = colCount >= 14 ? 10 : colCount >= 10 ? 11 : 12;

  const pages: PageItem[][] = [];
  let currentBatch: PageItem[] = [];
  let isFirst = true;

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const limit = isFirst ? ROWS_PAGE_1 : ROWS_PAGE_OTHER;

    if (item.isHeader && currentBatch.length === limit - 1) {
      pages.push(currentBatch);
      currentBatch = [item];
      isFirst = false;
      continue;
    }

    currentBatch.push(item);

    if (currentBatch.length >= limit) {
      pages.push(currentBatch);
      currentBatch = [];
      isFirst = false;
    }
  }

  if (currentBatch.length > 0) {
    pages.push(currentBatch);
  }

  const totalPages = pages.length;

  const wrapper = document.createElement('div');
  wrapper.id = 'pdf-render-sandbox';
  wrapper.style.cssText =
    'position:fixed;top:0;left:-99999px;width:1122px;opacity:0;pointer-events:none;z-index:-999999;';

  const styleEl = document.createElement('style');
  styleEl.innerHTML = getScopedStyles(colCount);
  wrapper.appendChild(styleEl);

  const theadHtml = `
    <thead>
      <tr>
        <th style="width: ${indexColWidthPct}; text-align: center;"><span class="ct">#</span></th>
        ${fields
      .map(
        (f) =>
          `<th style="width: ${colWidthPcts[f.key]}; text-align: center;"><span class="ct">${esc(f.label)}</span></th>`
      )
      .join('')}
      </tr>
    </thead>
  `;

  pages.forEach((pageItems, pageIdx) => {
    const pageEl = document.createElement('div');
    pageEl.className = 'pdf-page-container';

    const isFirstPage = pageIdx === 0;

    let headerContent = '';
    if (isFirstPage) {
      headerContent = `
        <div class="hd">
          <div class="hd-title">
            <h1><span class="ct">گزارش دروس ارائه‌شده سامانه گلستان</span></h1>
            <div class="meta"><span class="ct">گروه‌بندی: <b>${esc(groupByLabel)}</b> | تعداد کل رکوردها: <b>${total}</b></span></div>
          </div>
          <div class="hd-date">
            <div><span class="ct">تاریخ صدور: <b>${persianDate}</b></span></div>
            <div><span class="ct">نسخه افزونه: <b>1.0.0</b></span></div>
          </div>
        </div>
        <div class="sts">
          <div class="st"><span class="n"><span class="ct">${total}</span></span><span class="l"><span class="ct">کل دروس</span></span></div>
          <div class="st"><span class="n"><span class="ct">${totalUnits}</span></span><span class="l"><span class="ct">مجموع واحد</span></span></div>
          <div class="st"><span class="n"><span class="ct">${male}</span></span><span class="l"><span class="ct">مرد</span></span></div>
          <div class="st"><span class="n"><span class="ct">${female}</span></span><span class="l"><span class="ct">زن</span></span></div>
          <div class="st"><span class="n"><span class="ct">${mixed}</span></span><span class="l"><span class="ct">مختلط</span></span></div>
          <div class="st"><span class="n"><span class="ct">${instructorCount}</span></span><span class="l"><span class="ct">تعداد اساتید</span></span></div>
        </div>
      `;
    } else {
      headerContent = `
        <div class="compact-hd">
          <div><span class="ct">گزارش دروس ارائه‌شده گلستان (ادامه لیست) — گروه‌بندی: <b>${esc(groupByLabel)}</b></span></div>
          <div><span class="ct">تاریخ: <b>${persianDate}</b></span></div>
        </div>
      `;
    }

    const rowsHtml = pageItems
      .map((it, rIdx) => {
        if (it.isHeader) {
          return `
            <tr class="grp-row">
              <td colspan="${fields.length + 1}">
                <span class="ct">📁 <b>${esc(it.groupTitle || '')}</b> (${it.count} درس)</span>
              </td>
            </tr>
          `;
        }
        const c = it.course!;
        const rowClass = rIdx % 2 === 0 ? 'even-row' : 'odd-row';
        return `
          <tr class="${rowClass}">
            <td style="text-align:center;font-weight:bold;color:#64748b;"><span class="ct">${it.index}</span></td>
            ${fields
            .map(
              (f) =>
                `<td style="text-align:center;">${formatCell(f.key, c[f.key], isDense)}</td>`
            )
            .join('')}
          </tr>
        `;
      })
      .join('');

    pageEl.innerHTML = `
      <div>
        ${headerContent}
        <div class="table-wrapper">
          <table class="report-tbl">
            ${theadHtml}
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
      <div class="ft">
        <span><span class="ct">تولید شده توسط <b>Golestan Course Extractor</b></span></span>
        <span><span class="ct">صفحه <b>${pageIdx + 1}</b> از <b>${totalPages}</b></span></span>
      </div>
    `;

    wrapper.appendChild(pageEl);
  });

  document.body.appendChild(wrapper);

  try {
    await document.fonts.ready;
  } catch (_e) {
    void _e;
  }
  await new Promise((r) => setTimeout(r, 450));

  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const pageContainers = wrapper.querySelectorAll<HTMLElement>('.pdf-page-container');

    for (let i = 0; i < pageContainers.length; i++) {
      const pageEl = pageContainers[i];

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#090d16',
        width: 1122,
        height: 794,
        windowWidth: 1122,
        windowHeight: 794,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      if (i > 0) {
        pdf.addPage('a4', 'landscape');
      }

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    pdf.save('golestan-courses.pdf');
  } finally {
    document.body.removeChild(wrapper);
  }
}