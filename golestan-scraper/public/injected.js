// Self-contained browser-injected functions.
// Each function is stateless — the popup re-injects before every call.

// ── find the document containing Table3 (recursive iframe search) ────────
function _findDoc(root) {
  try {
    if (root && root.getElementById && root.getElementById('Table3')) return root;
  } catch (_e) { void _e; }
  var frames;
  try { frames = root ? root.querySelectorAll('iframe,frame') : []; } catch (_e) { frames = []; }
  for (var i = 0; i < frames.length; i++) {
    try {
      var c = frames[i].contentDocument;
      if (!c) continue;
      var f = _findDoc(c);
      if (f) return f;
    } catch (_e) { void _e; }
  }
  return null;
}

function _doc() { return _findDoc(document) || document; }

// Extract ALL text from a cell — handles <nobr>, nested spans, dir="ltr", etc.
function _cellText(cell) {
  if (!cell) return '';
  var t = (cell.innerText || '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (t) return t;
  var parts = [];
  try {
    var els = cell.querySelectorAll('*');
    for (var i = 0; i < els.length; i++) {
      var n = els[i];
      if (n.childNodes.length === 0 || n.tagName === 'NOBR') {
        var v = (n.textContent || '').trim();
        if (v) parts.push(v);
      }
    }
  } catch (_e) { void _e; }
  if (parts.length > 0) return parts.join(' ').replace(/\s{2,}/g, ' ').trim();
  return (cell.textContent || '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

// ── probe ────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
function checkFrameForTable() {
  try {
    var d = _doc();
    var has = !!d.getElementById('Table3');
    var cnt = has ? d.querySelectorAll('#Table3 tr.CTRData').length : 0;
    return { found: has, count: cnt, frameUrl: location.href };
  } catch (_e) {
    return { found: false, count: 0, frameUrl: location.href };
  }
}

// ── extract rows from current page ───────────────────────────────────────
// eslint-disable-next-line no-unused-vars
function scrapeCurrentPage() {
  try {
    var d = _doc();
    var t = d.getElementById('Table3');
    if (!t) return [];
    var rows = t.querySelectorAll('tr.CTRData');
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].querySelectorAll('td.CTDData');
      if (cells.length < 13) continue;
      out.push({
        codeGroup: _cellText(cells[0]),
        name: _cellText(cells[1]),
        totalUnits: _cellText(cells[2]),
        practicalUnits: _cellText(cells[3]),
        capacity: _cellText(cells[4]),
        registered: _cellText(cells[5]),
        waitingList: _cellText(cells[6]),
        gender: _cellText(cells[7]),
        instructor: _cellText(cells[8]),
        scheduleLocation: _cellText(cells[9]),
        examSchedule: _cellText(cells[10]),
        restrictions: _cellText(cells[11]),
        cohort: _cellText(cells[12]),
        prerequisites: cells.length > 13 ? _cellText(cells[13]) : '',
        deliveryMode: cells.length > 14 ? _cellText(cells[14]) : '',
        coursePeriod: cells.length > 15 ? _cellText(cells[15]) : '',
        description: cells.length > 16 ? _cellText(cells[16]) : ''
      });
    }
    return out;
  } catch (_e) {
    return [];
  }
}

// ── get table fingerprint ────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
function getTableFingerprint() {
  try {
    var d = _doc();
    var t = d.getElementById('Table3');
    if (!t) return '';
    var first = t.querySelector('tr.CTRData td.CTDData');
    return first ? _cellText(first) : t.innerHTML.substring(0, 200);
  } catch (_e) {
    return '';
  }
}

// ── click nav button — searches table doc + parent frames + onclick ──────
// eslint-disable-next-line no-unused-vars
function clickNavButton(titles) {
  function searchDoc(doc) {
    if (!doc) return false;
    try {
      // 1. Direct attribute search (title, alt)
      for (var i = 0; i < titles.length; i++) {
        var t = titles[i];
        var sels = [
          "input[title*='" + t + "']", "img[title*='" + t + "']",
          "a[title*='" + t + "']", "button[title*='" + t + "']",
          "input[alt*='" + t + "']", "img[alt*='" + t + "']"
        ];
        for (var j = 0; j < sels.length; j++) {
          try {
            var el = doc.querySelector(sels[j]);
            if (el && !el.disabled && el.style.display !== 'none') {
              el.click();
              return true;
            }
          } catch (_e) { void _e; }
        }
      }
      // 2. Scan all clickable elements by text content
      var all = doc.querySelectorAll('input,button,a,img,div[onclick],span[onclick]');
      for (var k = 0; k < all.length; k++) {
        var e = all[k];
        if (e.disabled) continue;
        var txt = '';
        try {
          txt = (e.getAttribute('title') || '') + ' ' + (e.getAttribute('alt') || '') +
                ' ' + (e.value || '') + ' ' + (e.textContent || '') +
                ' ' + (e.getAttribute('onclick') || '') + ' ' + (e.getAttribute('src') || '');
        } catch (_e) { void _e; }
        for (var m = 0; m < titles.length; m++) {
          if (txt.indexOf(titles[m]) !== -1) {
            try { e.click(); } catch (_e) { void _e; }
            return true;
          }
        }
      }
    } catch (_e) { void _e; }
    return false;
  }

  // Search in table document first
  var d = _doc();
  if (searchDoc(d)) return true;

  // Search in ALL frames (parent, top)
  var frames = [window.parent, window.top];
  for (var i = 0; i < frames.length; i++) {
    try {
      if (frames[i] && frames[i] !== window && searchDoc(frames[i].document)) return true;
    } catch (_e) { void _e; }
  }

  // Search in sibling iframes of the table's parent
  try {
    var tableDoc = _doc();
    var parentDiv = tableDoc ? tableDoc.parentElement : null;
    while (parentDiv) {
      var siblingFrames = parentDiv.querySelectorAll('iframe,frame');
      for (var j = 0; j < siblingFrames.length; j++) {
        try {
          var sc = siblingFrames[j].contentDocument;
          if (sc && searchDoc(sc)) return true;
        } catch (_e) { void _e; }
      }
      parentDiv = parentDiv.parentElement;
    }
  } catch (_e) { void _e; }

  return false;
}

// ── check if nav button exists ───────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
function hasNavButton(titles) {
  try {
    var d = _doc();
    for (var i = 0; i < titles.length; i++) {
      var t = titles[i];
      var el = d.querySelector("input[title*='" + t + "'],img[title*='" + t + "'],a[title*='" + t + "'],button[title*='" + t + "']");
      if (el && !el.disabled && el.style.display !== 'none') return true;
    }
    return false;
  } catch (_e) {
    return false;
  }
}
