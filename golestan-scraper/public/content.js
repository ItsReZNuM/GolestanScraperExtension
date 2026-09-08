/* Golestan content-script: injected via manifest (all_frames:true) or programmatically.
   Handles CHECK_GOLESTAN and START_SCRAPING. */

function findTableDocument(rootDoc) {
  if (rootDoc && rootDoc.getElementById && rootDoc.getElementById('Table3')) return rootDoc;
  var iframes = rootDoc ? rootDoc.querySelectorAll('iframe,frame') : [];
  for (var i = 0; i < iframes.length; i++) {
    try {
      var child = iframes[i].contentDocument;
      if (!child) continue;
      var found = findTableDocument(child);
      if (found) return found;
    } catch (_skip) { void _skip; }
  }
  return null;
}

function getDoc() {
  return findTableDocument(document) || document;
}

function cleanText(cell) {
  if (!cell) return '';
  return (cell.innerText || cell.textContent || '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function extractCurrentPageCourses(doc) {
  var table = doc.getElementById('Table3');
  if (!table) return [];
  var rows = table.querySelectorAll('tr.CTRData');
  var courses = [];
  for (var i = 0; i < rows.length; i++) {
    var cells = rows[i].querySelectorAll('td.CTDData');
    if (cells.length < 13) continue;
    courses.push({
      codeGroup: cleanText(cells[0]),
      name: cleanText(cells[1]),
      totalUnits: cleanText(cells[2]),
      practicalUnits: cleanText(cells[3]),
      capacity: cleanText(cells[4]),
      registered: cleanText(cells[5]),
      waitingList: cleanText(cells[6]),
      gender: cleanText(cells[7]),
      instructor: cleanText(cells[8]),
      scheduleLocation: cleanText(cells[9]),
      examSchedule: cleanText(cells[10]),
      restrictions: cleanText(cells[11]),
      cohort: cleanText(cells[12]),
      prerequisites: cells.length > 13 ? cleanText(cells[13]) : '',
      deliveryMode: cells.length > 14 ? cleanText(cells[14]) : '',
      coursePeriod: cells.length > 15 ? cleanText(cells[15]) : '',
      description: cells.length > 16 ? cleanText(cells[16]) : ''
    });
  }
  return courses;
}

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function findNavButton(doc, kinds) {
  for (var i = 0; i < kinds.length; i++) {
    var k = kinds[i];
    var found = doc.querySelector("input[title*='" + k + "'],img[title*='" + k + "'],a[title*='" + k + "'],button[title*='" + k + "']");
    if (found) return found;
  }
  var all = doc.querySelectorAll('input,button,a,img');
  for (var j = 0; j < all.length; j++) {
    var t = (all[j].getAttribute('title') || '') + ' ' + (all[j].getAttribute('alt') || '') + ' ' + (all[j].value || '') + ' ' + (all[j].textContent || '');
    for (var m = 0; m < kinds.length; m++) {
      if (t.indexOf(kinds[m]) !== -1) return all[j];
    }
  }
  return null;
}

function isClickable(el) {
  if (!el || el.disabled) return false;
  var s = el.style || {};
  if (s.display === 'none' || s.visibility === 'hidden') return false;
  if (el.getAttribute && el.getAttribute('disabled') !== null) return false;
  if (el.className && /disable/i.test(el.className)) return false;
  return true;
}

async function scrapeAllPages(sendProgress) {
  var doc = getDoc();
  if (!doc.getElementById('Table3')) {
    throw new Error('جدول دروس یافت نشد.');
  }

  var firstBtn = findNavButton(doc, ['اولين صفحه', 'اولین صفحه', 'صفحه اول']);
  if (isClickable(firstBtn)) {
    firstBtn.click();
    await sleep(1500);
    doc = getDoc();
  }

  var allCourses = [];
  var seen = new Set();
  var page = 1;

  while (true) {
    sendProgress('در حال پردازش صفحه ' + page + ' ...');
    var curDoc = getDoc();
    var tbl = curDoc.getElementById('Table3');
    if (!tbl) break;
    var prev = tbl.innerHTML;
    var rows = extractCurrentPageCourses(curDoc);
    if (rows.length === 0) break;

    var sig = rows.map(function (c) { return c.codeGroup; }).join('|');
    if (seen.has(sig)) break;
    seen.add(sig);
    allCourses.push.apply(allCourses, rows);

    var nxt = findNavButton(curDoc, ['صفحه بعد', 'بعدی']);
    if (!isClickable(nxt)) break;

    nxt.click();
    var changed = false;
    for (var r = 0; r < 20; r++) {
      await sleep(400);
      var u = getDoc().getElementById('Table3');
      if (u && u.innerHTML !== prev) { changed = true; break; }
    }
    if (!changed) break;
    page++;
    if (page > 500) break;
  }
  return allCourses;
}

// Message listener
chrome.runtime.onMessage.addListener(function (req, _sender, sendResponse) {
  if (!req || !req.action) return false;

  if (req.action === 'PING') {
    sendResponse({ alive: true });
    return true;
  }

  if (req.action === 'CHECK_GOLESTAN') {
    try {
      var d = getDoc();
      var found = !!d.getElementById('Table3');
      var count = found ? d.querySelectorAll('#Table3 tr.CTRData').length : 0;
      sendResponse({ found: found, count: count, frameUrl: location.href });
    } catch (_e) {
      sendResponse({ found: false, count: 0, frameUrl: location.href });
    }
    return true;
  }

  if (req.action === 'START_SCRAPING') {
    var scrapeDoc = getDoc();
    if (!scrapeDoc.getElementById('Table3')) {
      sendResponse({ status: 'SKIP' });
      return true;
    }
    scrapeAllPages(function (msg) {
      try { chrome.runtime.sendMessage({ action: 'PROGRESS', message: msg }); } catch (_e) { void _e; }
    })
      .then(function (data) { sendResponse({ status: 'SUCCESS', data: data }); })
      .catch(function (err) { sendResponse({ status: 'ERROR', message: (err && err.message) || 'خطا' }); });
    return true;
  }

  return false;
});
