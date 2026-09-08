// Central data model for one Golestan "offered course" row.
// Column indexes below refer to <td class="CTDData"> cells inside #Table3.
// Header reference is #Table3Prim (see user-provided HTML snapshot).
export interface CourseData {
  codeGroup: string; // col 0 — شماره و گروه درس (e.g. 9010080_01)
  name: string; // col 1 — نام درس
  totalUnits: string; // col 2 — واحد کل
  practicalUnits: string; // col 3 — واحد عملی (ع) — scraped, hidden by default per user request
  capacity: string; // col 4 — ظرفیت
  registered: string; // col 5 — ثبت‌نام شده
  waitingList: string; // col 6 — تعداد لیست انتظار
  gender: string; // col 7 — جنس (مرد / زن / مختلط)
  instructor: string; // col 8 — نام استاد
  scheduleLocation: string; // col 9 — زمان و مکان ارائه
  examSchedule: string; // col 10 — زمان و مکان امتحان
  restrictions: string; // col 11 — محدودیت اخذ
  cohort: string; // col 12 — مخصوص ورودی
  prerequisites: string; // col 13 — دروس اجبار/متضاد
  deliveryMode: string; // col 14 — نحوه ارائه درس (عادی / الکترونیکی ...)
  coursePeriod: string; // col 15 — دوره درس (روزانه / شبانه ...)
  description: string; // col 16 — توضیحات
}

export type CourseFieldKey = keyof CourseData;

// Grouping dimensions available in UI + PDF output.
// Values double as CourseData keys for generic group-by logic.
export type GroupKey = 'gender' | 'instructor' | 'name';

export interface FieldOption {
  key: CourseFieldKey;
  label: string;
  defaultSelected: boolean;
}

// Every column of Table3/Prim is represented here so the user can
// tick exactly which fields get scraped/exported.
export const AVAILABLE_FIELDS: FieldOption[] = [
  { key: 'codeGroup', label: 'شماره و گروه درس', defaultSelected: true },
  { key: 'name', label: 'نام درس', defaultSelected: true },
  { key: 'totalUnits', label: 'واحد (کل)', defaultSelected: true },
  { key: 'practicalUnits', label: 'واحد عملی (ع)', defaultSelected: false },
  { key: 'capacity', label: 'ظرفیت', defaultSelected: true },
  { key: 'registered', label: 'ثبت‌نام شده', defaultSelected: false },
  { key: 'waitingList', label: 'لیست انتظار', defaultSelected: false },
  { key: 'gender', label: 'جنسیت', defaultSelected: true },
  { key: 'instructor', label: 'نام استاد', defaultSelected: true },
  { key: 'scheduleLocation', label: 'زمان و مکان ارائه', defaultSelected: true },
  { key: 'examSchedule', label: 'زمان و مکان امتحان', defaultSelected: false },
  { key: 'restrictions', label: 'محدودیت اخذ', defaultSelected: true },
  { key: 'cohort', label: 'مخصوص ورودی', defaultSelected: true },
  { key: 'prerequisites', label: 'دروس اجبار/متضاد', defaultSelected: false },
  { key: 'deliveryMode', label: 'نحوه ارائه', defaultSelected: false },
  { key: 'coursePeriod', label: 'دوره درس', defaultSelected: false },
  { key: 'description', label: 'توضیحات', defaultSelected: false },
];

export const GROUP_OPTIONS: { key: GroupKey; label: string }[] = [
  { key: 'gender', label: 'جنسیت' },
  { key: 'instructor', label: 'استاد' },
  { key: 'name', label: 'درس' },
];
