import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  AVAILABLE_FIELDS,
  CourseData,
  CourseFieldKey,
  FieldOption,
  GROUP_OPTIONS,
  GroupKey,
} from './types/course';
import { generatePrintablePDF } from './utils/pdfGenerator';
import {
  AlertTriangle,
  CheckSquare,
  Download,
  Filter,
  Layers,
  Play,
  RefreshCw,
  SearchCheck,
} from 'lucide-react';

// Chrome extension API — only available inside extension popup.
declare const chrome: {
  tabs: {
    query: (info: object) => Promise<Array<{ id?: number; url?: string }>>;
    sendMessage: (
      tabId: number,
      msg: object,
      cb?: (response?: unknown) => void
    ) => void;
  };
  scripting: {
    executeScript: (opts: {
      target: { tabId: number; allFrames?: boolean };
      func?: (...args: unknown[]) => unknown;
      args?: unknown[];
      files?: string[];
    }) => Promise<Array<{ result?: unknown }>>;
  };
  runtime: {
    lastError?: { message?: string };
    getURL: (path: string) => string;
    onMessage?: {
      addListener: (fn: (msg: unknown) => void) => void;
      removeListener: (fn: (msg: unknown) => void) => void;
    };
  };
};

type GolestanProbe =
  | { status: 'checking' }
  | { status: 'found'; count: number; href: string }
  | { status: 'not-found'; href: string }
  | { status: 'unknown'; reason: string };

function TelegramIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}
function GithubIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function App() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [probe, setProbe] = useState<GolestanProbe>({ status: 'checking' });

  const [selectedFields, setSelectedFields] = useState<CourseFieldKey[]>(
    AVAILABLE_FIELDS.filter((f: FieldOption) => f.defaultSelected).map(
      (f: FieldOption) => f.key
    )
  );

  const [genderFilter, setGenderFilter] = useState('ALL');
  const [instructorFilter, setInstructorFilter] = useState('');
  const [courseNameFilter, setCourseNameFilter] = useState('');

  const [groupKeys, setGroupKeys] = useState<GroupKey[]>(['instructor']);

  const getExt = useCallback(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return null;
    return chrome as typeof chrome;
  }, []);

  // Probe: use scripting.executeScript with allFrames:true to check every frame
  const runProbe = useCallback(async () => {
    setProbe({ status: 'checking' });
    const ext = getExt();
    if (!ext) {
      setProbe({ status: 'unknown', reason: 'پاپ‌آپ بیرون از محیط اکستنشن باز شده.' });
      return;
    }

    try {
      const tabs = await ext.tabs.query({ active: true, currentWindow: true });
      const tab = tabs?.[0];
      if (!tab?.id) {
        setProbe({ status: 'unknown', reason: 'تب فعالی یافت نشد.' });
        return;
      }

      // Step 1: inject injected.js into all frames (makes checkFrameForTable global)
      await ext.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ['injected.js'],
      });
      // Step 2: call the global in each frame
      const results = await ext.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: () => {
          // eslint-disable-next-line no-undef
          return (checkFrameForTable as () => { found: boolean; count: number; frameUrl: string })();
        },
      });

      // Find the frame that has the table
      const found = (results || []).find(
        (r) => r.result && (r.result as { found: boolean }).found === true
      );

      if (found && found.result) {
        const res = found.result as { found: boolean; count: number; frameUrl: string };
        setProbe({ status: 'found', count: res.count, href: res.frameUrl });
      } else {
        setProbe({ status: 'not-found', href: tab.url || '' });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'خطا';
      setProbe({ status: 'unknown', reason: msg });
    }
  }, [getExt]);

  // Start scraping — orchestrate multi-page walk from the popup
  const handleStartScrape = useCallback(async () => {
    setLoading(true);
    setStatusText('در حال اتصال...');

    const ext = getExt();
    if (!ext) {
      setStatusText('افزونه باید داخل مرورگر اجرا شود.');
      setLoading(false);
      return;
    }

    try {
      const tabs = await ext.tabs.query({ active: true, currentWindow: true });
      const tab = tabs?.[0];
      if (!tab?.id) {
        setStatusText('تب یافت نشد.');
        setLoading(false);
        return;
      }

      const target = { tabId: tab.id, allFrames: true };

      // Helper: inject injected.js + small delay
      async function inject() {
        await ext.scripting.executeScript({ target, files: ['injected.js'] });
        await new Promise((r) => setTimeout(r, 150));
      }

      // Helper: run a function in all frames, return first non-null result
      async function runInFrames<T>(fn: () => T): Promise<T | undefined> {
        const results = await ext.scripting.executeScript({ target, func: fn });
        for (const r of results || []) {
          const v = r.result;
          if (v != null && v !== false && v !== 0 && v !== '') return v as T;
        }
        return undefined;
      }

      // Helper: inject + run in one step
      async function injectAndRun<T>(fn: () => T): Promise<T | undefined> {
        await inject();
        return runInFrames(fn);
      }

      // Step 1: Try go to first page (retry up to 3 times)
      setStatusText('رفتن به صفحه اول...');
      let firstPageOk = false;
      for (let attempt = 0; attempt < 3 && !firstPageOk; attempt++) {
        await inject();
        const clicked = await runInFrames<boolean>(() => {
          // eslint-disable-next-line no-undef
          return (clickNavButton as (t: string[]) => boolean)([
            'اولين صفحه', 'اولین صفحه', 'صفحه اول',
            'اول', 'First', 'first', '|<'
          ]);
        });
        if (clicked) {
          await new Promise((r) => setTimeout(r, 2500));
          await inject();
          const verify = await runInFrames<number>(() => {
            // eslint-disable-next-line no-undef
            const d = (checkFrameForTable as () => { count: number })();
            return d ? d.count : 0;
          });
          if (verify && verify > 0) {
            firstPageOk = true;
          }
        }
        if (!firstPageOk && attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      const allCourses: CourseData[] = [];
      const seenSignatures = new Set<string>();
      let page = 1;
      const MAX_PAGES = 500;

      while (page <= MAX_PAGES) {
        setStatusText(`در حال پردازش صفحه ${page}...`);

        // Inject fresh before extraction
        await inject();

        // Extract current page data
        const rows = await runInFrames<CourseData[]>(() => {
          // eslint-disable-next-line no-undef
          return (scrapeCurrentPage as () => CourseData[])();
        });

        if (!rows || rows.length === 0) break;

        // Deduplicate by codeGroup signature
        const sig = rows.map((c) => c.codeGroup).join('|');
        if (seenSignatures.has(sig)) break;
        seenSignatures.add(sig);

        for (const r of rows) allCourses.push(r);

        // Get table fingerprint before clicking next
        const prevFP = await runInFrames<string>(() => {
          // eslint-disable-next-line no-undef
          return (getTableFingerprint as () => string)();
        });

        // Try click next page
        await inject();
        const clicked = await runInFrames<boolean>(() => {
          // eslint-disable-next-line no-undef
          return (clickNavButton as (t: string[]) => boolean)(['صفحه بعد', 'بعدی']);
        });

        if (!clicked) break; // No next button → last page

        // Wait for table content to change (poll up to 10s)
        let changed = false;
        for (let attempt = 0; attempt < 25; attempt++) {
          await new Promise((r) => setTimeout(r, 400));
          await inject();
          const newFP = await runInFrames<string>(() => {
            // eslint-disable-next-line no-undef
            return (getTableFingerprint as () => string)();
          });
          if (newFP && newFP !== prevFP) {
            changed = true;
            break;
          }
        }

        if (!changed) break; // Table didn't change → last page

        page++;
      }

      if (allCourses.length > 0) {
        setCourses(allCourses);
        setStatusText(`تعداد ${allCourses.length} ردیف از ${page} صفحه با موفقیت استخراج شد.`);
      } else {
        setStatusText('داده‌ای یافت نشد. مطمئن شوید صفحه «دروس ارائه شده در ترم» باز است.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'خطای ناشناخته';
      setStatusText('خطا: ' + msg);
    }

    setLoading(false);
  }, [getExt]);

  // Probe on mount
  useEffect(() => {
    runProbe();
  }, [runProbe]);

  const toggleField = (key: CourseFieldKey) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleGroup = (key: GroupKey) => {
    setGroupKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const uniqueInstructors = useMemo(
    () => Array.from(new Set(courses.map((c) => c.instructor).filter(Boolean))),
    [courses]
  );

  const filteredCourses = useMemo(
    () =>
      courses.filter((item) => {
        const matchGender =
          genderFilter === 'ALL' || (item.gender || '').includes(genderFilter);
        const matchInstructor =
          !instructorFilter || (item.instructor || '').includes(instructorFilter);
        const matchName =
          !courseNameFilter || (item.name || '').includes(courseNameFilter);
        return matchGender && matchInstructor && matchName;
      }),
    [courses, genderFilter, instructorFilter, courseNameFilter]
  );

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const fieldsToExport = AVAILABLE_FIELDS.filter((f: FieldOption) =>
        selectedFields.includes(f.key)
      );
      await generatePrintablePDF(filteredCourses, fieldsToExport, groupKeys);
    } catch (_e) {
      void _e;
    }
    setPdfLoading(false);
  };

  const isGate = probe.status !== 'found';
  const gateChecking = probe.status === 'checking';

  return (
    <div className="relative p-4">
      <div className="bg-orb w-64 h-64 bg-indigo-600/30 -top-20 -left-20" />
      <div className="bg-orb w-64 h-64 bg-cyan-500/20 top-40 -right-20" />

      <div className="relative z-10 space-y-3.5 max-w-2xl mx-auto">
        {/* Header */}
        <header className="glass-panel p-3.5 rounded-2xl flex items-center justify-between animate-rise">
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-indigo-300 via-sky-200 to-teal-100 bg-clip-text text-transparent">
              Golestan Course Extractor
            </h1>
            <p className="text-[11px] text-slate-400">استخراج هوشمند دروس ارائه‌شده سامانه گلستان</p>
          </div>
          <button
            onClick={handleStartScrape}
            disabled={loading || isGate}
            title={isGate ? 'اول باید وارد صفحه گلستان شوید' : undefined}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-95 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:pointer-events-none text-white"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {loading ? 'در حال دریافت...' : 'شروع استخراج'}
          </button>
        </header>

        {/* Gate */}
        <div className="glass-panel rounded-2xl p-3 animate-rise">
          <div className="flex items-center gap-2 text-xs font-semibold">
            {gateChecking ? (
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
            ) : probe.status === 'found' ? (
              <SearchCheck className="w-4 h-4 text-emerald-300" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-300" />
            )}
            <span className={probe.status === 'found' ? 'text-emerald-200' : 'text-slate-200'}>
              {gateChecking
                ? 'در حال بررسی صفحه فعلی...'
                : probe.status === 'found'
                  ? `گلستان شناسایی شد — ${probe.count} ردیف`
                  : probe.status === 'not-found'
                    ? 'جدول دروس یافت نشد'
                    : probe.status === 'unknown'
                      ? probe.reason
                      : 'وضعیت نامشخص'}
            </span>
            <button
              onClick={runProbe}
              disabled={gateChecking}
              className="ms-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${gateChecking ? 'animate-spin' : ''}`} />
              بررسی مجدد
            </button>
          </div>

          {gateChecking && (
            <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-cyan-400 animate-pulse rounded-full" />
            </div>
          )}

          {probe.status === 'not-found' && (
            <div className="mt-2 space-y-1.5 text-[11px] leading-5 text-slate-300">
              <p>
                اکستنشن فقط روی صفحه <b className="text-white">«دروس ارائه شده در ترم»</b> کار
                می‌کند (صفحه‌ای که جدول شماره و گروه درس دارد).
              </p>
              <ol className="list-decimal ps-4 space-y-0.5 text-slate-400">
                <li>وارد گلستان شوید → تب «دروس ارائه شده در ترم و شرایط اخذ آن».</li>
                <li>صبر کنید جدول کامل لود شود.</li>
                <li>این پاپ‌آپ را باز کنید → «بررسی مجدد» بزنید.</li>
                <li>اگر نشد: صفحه را F5 و افزونه را Reload کنید.</li>
              </ol>
            </div>
          )}

          {probe.status === 'found' && (
            <p className="mt-1.5 text-[10px] text-slate-500 break-all">آدرس: {probe.href}</p>
          )}
        </div>

        {statusText && (
          <div className="glass-panel px-3 py-2 rounded-xl text-xs text-center text-cyan-200 animate-rise">
            {statusText}
          </div>
        )}

        {/* Menu — only when found */}
        {probe.status === 'found' ? (
          <>
            {/* Column picker */}
            <section className="glass-panel p-3 rounded-2xl space-y-2 animate-rise">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-300" />
                <span>ستون‌های خروجی:</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {AVAILABLE_FIELDS.map((field: FieldOption) => {
                  const checked = selectedFields.includes(field.key);
                  return (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => toggleField(field.key)}
                      aria-pressed={checked}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] cursor-pointer transition-all text-right ${
                        checked
                          ? 'bg-indigo-950/50 border-indigo-500/50 text-indigo-100'
                          : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] shrink-0 ${
                          checked
                            ? 'bg-indigo-600 border-indigo-400 text-white'
                            : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        {checked && '✓'}
                      </span>
                      <span className="truncate">{field.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Filters */}
            <section className="glass-panel p-3 rounded-2xl space-y-2.5 animate-rise">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Filter className="w-3.5 h-3.5 text-cyan-300" />
                <span>فیلتر:</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">جنسیت</label>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">همه</option>
                    <option value="مرد">مرد</option>
                    <option value="زن">زن</option>
                    <option value="مختلط">مختلط</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">استاد</label>
                  <input
                    type="text"
                    placeholder="نام استاد..."
                    value={instructorFilter}
                    onChange={(e) => setInstructorFilter(e.target.value)}
                    list="instructors-list"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <datalist id="instructors-list">
                    {uniqueInstructors.map((inst, i) => (
                      <option key={i} value={inst} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">درس</label>
                  <input
                    type="text"
                    placeholder="نام درس..."
                    value={courseNameFilter}
                    onChange={(e) => setCourseNameFilter(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </section>

            {/* Group-by */}
            <section className="glass-panel p-3 rounded-2xl space-y-2 animate-rise">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Layers className="w-3.5 h-3.5 text-teal-300" />
                <span>گروه‌بندی PDF:</span>
              </div>
              <div className="flex gap-1.5">
                {GROUP_OPTIONS.map((g) => {
                  const checked = groupKeys.includes(g.key);
                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => toggleGroup(g.key)}
                      aria-pressed={checked}
                      className={`flex-1 flex items-center justify-center gap-1.5 p-1.5 rounded-lg border text-[11px] cursor-pointer transition-all ${
                        checked
                          ? 'bg-teal-950/50 border-teal-500/50 text-teal-100'
                          : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                          checked
                            ? 'bg-teal-600 border-teal-400 text-white'
                            : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        {checked && '✓'}
                      </span>
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Action bar — only after scraping */}
            {courses.length > 0 && (
            <div className="flex items-center justify-between animate-rise">
              <div className="text-xs text-slate-400">
                ردیف‌ها: <span className="text-cyan-300 font-bold">{filteredCourses.length}</span>
              </div>
              <button
                onClick={handleExportPDF}
                disabled={filteredCourses.length === 0 || selectedFields.length === 0 || pdfLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-40 disabled:pointer-events-none"
              >
                {pdfLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {pdfLoading ? 'در حال ساخت PDF...' : 'دانلود PDF'}
              </button>
            </div>
            )}
          </>
        ) : (
          !gateChecking && (
            <div className="glass-panel p-4 rounded-2xl text-center opacity-60">
              <p className="text-xs text-slate-500">منو فقط وقتی صفحه گلستان شناسایی شود فعال می‌شود.</p>
            </div>
          )
        )}

        {/* Footer */}
        <footer className="glass-panel p-2.5 rounded-xl flex items-center justify-between text-[11px] text-slate-400 animate-rise">
          <span>توسعه‌دهنده: رضا محمدنیا</span>
          <div className="flex items-center gap-3">
            <a href="https://t.me/ItsReZNuM" target="_blank" rel="noreferrer" className="hover:text-sky-300 transition-colors flex items-center gap-1">
              <TelegramIcon /><span>ItsReZNuM</span>
            </a>
            <a href="https://instagram.com/ReZ.NuM" target="_blank" rel="noreferrer" className="hover:text-pink-300 transition-colors flex items-center gap-1">
              <InstagramIcon /><span>ReZ.NuM</span>
            </a>
            <a href="https://github.com/ItsReZNuM/GolestanScraperExtension" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              <GithubIcon /><span>GitHub</span>
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
