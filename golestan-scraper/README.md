<div dir="rtl" align="center">

# 🎓 Golestan Course Extractor | استخراج‌کننده دروس گلستان

### ✨ اسکرپ هوشمند صفحه‌به‌صفحه دروس ارائه‌شده سامانه گلستان + خروجی PDF مرتب و گروه‌بندی‌شده

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Chrome Extension](https://img.shields.io/badge/Chrome-MV3-blue?style=for-the-badge&logo=googlechrome)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**👤 توسعه‌دهنده: رضا محمدنیا**

[![Telegram](https://img.shields.io/badge/Telegram-@ItsReZNuM-229ED9?style=flat&logo=telegram)](https://t.me/ItsReZNuM)
[![Instagram](https://img.shields.io/badge/Instagram-ReZ.NuM-E4405F?style=flat&logo=instagram)](https://instagram.com/ReZ.NuM)
[![GitHub](https://img.shields.io/badge/GitHub-ItsReZNuM-181717?style=flat&logo=github)](https://github.com/ItsReZNuM)
[![Repo](https://img.shields.io/badge/Repo-GolestanScraperExtension-0366d6?style=flat&logo=github)](https://github.com/ItsReZNuM/GolestanScraperExtension)

</div>

---

<div dir="rtl">

## ✨ امکانات

- 🔄 **اسکرپ خودکار صفحه‌به‌صفحه:** اول برمی‌گردد به صفحه ۱، بعد تا آخرین صفحه جلو می‌رود
- ☑️ **انتخاب ستون‌ها:** هر ۱۷ ستون جدول گلستان (`Table3`) تیک جداگانه دارد
  - شماره و گروه درس، نام درس، واحد کل، واحد عملی (ع)، ظرفیت، ثبت‌نام‌شده، لیست انتظار، جنسیت، استاد، زمان و مکان ارائه، زمان و مکان امتحان، محدودیت اخذ، مخصوص ورودی، اجبار/متضاد، نحوه ارائه، دوره درس، توضیحات
- 🔍 **فیلتر زنده:** جنسیت (مرد / زن / مختلط) + جستجوی استاد و نام درس
- 🗂️ **گروه‌بندی ترکیبی PDF:** جنسیت، استاد، درس — تکی یا ترکیبی (مثلا جنسیت + استاد)
- 📄 **PDF تمیز:** نمای کلی و آمار → جدول کامل → بخش جدا برای هر گروه
- 🌙 **ظاهر مدرن:** دارک + Glass Morphism + انیمیشن نرم + فونت محلی وزیرمتن
- 📦 **همه‌چیز داخل اکستنشن:** بدون سرور جدا، بدون سرویس خارجی — خروجی با پنجره چاپ آفلاین

## 🚀 راه‌اندازی گام‌به‌گام

### ۱️⃣ نصب

```bash
cd golestan-scraper
npm install
```

### ۲️⃣ توسعه

```bash
npm run dev
# http://localhost:3000
```

### ۳️⃣ بیلد اکستنشن

```bash
npm run build
# خروجی: پوشه out/
```

### ۴️⃣ نصب در کروم

1. برو به `chrome://extensions`
2. حالت `Developer mode` را روشن کن
3. `Load unpacked` → پوشه `out/` را انتخاب کن
4. وارد سامانه گلستان شو → صفحه **دروس ارائه شده در ترم**
5. روی آیکون افزونه کلیک کن → **شروع استخراج** → تیک ستون‌ها و گروه‌بندی → **دریافت PDF**

## 🗂️ ساختار پروژه

```
golestan-scraper/
├── app/
│   ├── page.tsx        # پاپ‌آپ اصلی (فیلدها + فیلتر + گروه‌بندی + PDF)
│   ├── layout.tsx      # شل RTL با فونت وزیرمتن
│   └── globals.css     # تم دارک + Glass + انیمیشن
├── src/
│   ├── types/course.ts       # مدل ۱۷ ستونه جدول گلستان
│   └── utils/pdfGenerator.ts # خروجی چاپی: آمار + جدول کامل + گروه‌ها
├── public/
│   ├── manifest.json   # مانیفست MV3
│   ├── content.js      # اسکرپر Table3 + صفحه‌گردی
│   └── fonts/          # فونت محلی وزیرمتن
└── out/                # بیلد نهایی اکستنشن
```

### فونت وزیرمتن 🔤

فایل‌های `.woff2` را داخل `public/fonts/` بگذار. الان `Vazirmatn-Regular.woff2` موجود است؛ برای وزن‌های بیشتر همان نام را در `@font-face` اضافه کن.

## ⚠️ نکته

اسکرپ فقط روی صفحه‌ای کار می‌کند که جدول `#Table3` را داشته باشد (همان صفحه دروس ارائه‌شده داخل iframeهای گلستان).

</div>

---

<div align="center">

## ✨ Features (EN)

- 🔄 **Auto multi-page scrape:** jumps back to page 1, then walks to the last page
- ☑️ **Column picker:** all 17 Golestan `Table3` columns are individually toggleable
- 🔍 **Live filters:** gender + instructor search + course-name search
- 🗂️ **Combinable PDF grouping:** by gender, instructor, course — alone or combined
- 📄 **Clean PDF:** overview stats → full table → one section per group
- 🌙 **Modern UI:** dark + glass morphism + soft animations + local Vazirmatn font
- 📦 **Self-contained:** no backend, no external service — offline print-to-PDF

### Quickstart

```bash
cd golestan-scraper
npm install
npm run dev      # dev at http://localhost:3000
npm run build    # extension output in out/
```

Load `out/` via `chrome://extensions` → `Developer mode` → `Load unpacked`, then open the Golestan offered-courses page and hit **Start**.

### Author

**Reza Mohamadnia** — [Telegram @ItsReZNuM](https://t.me/ItsReZNuM) · [Instagram ReZ.NuM](https://instagram.com/ReZ.NuM) · [GitHub](https://github.com/ItsReZNuM) · [Repo](https://github.com/ItsReZNuM/GolestanScraperExtension)

</div>
