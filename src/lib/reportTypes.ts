// Типи аналітичних апдейтів (відповідають скілам у Claude cowork).
// Кожен тип описує поля що питаємо в користувача + як зібрати промт для Claude.

export interface ReportField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "date";
}

export interface ReportType {
  id: string;
  name: string;
  skill: string;
  description: string;
  fields: ReportField[];
  buildPrompt: (p: Record<string, string>) => string;
}

export const REPORT_TYPES: ReportType[] = [
  {
    id: "weekly-report",
    name: "Тижневий фінансовий звіт",
    skill: "liti-weekly-report",
    description: "xlsx-звіт по агенції з сегментацією по виводах",
    fields: [
      { key: "agencyId", label: "Agency ID", placeholder: "761" },
      { key: "weekStart", label: "Початок тижня (Пт)", type: "date" },
      { key: "weekEnd", label: "Кінець тижня (Чт)", type: "date" },
      { key: "payoutDate", label: "Дата виплати (DD.MM.YYYY)", placeholder: "11.06.2026" },
      { key: "lang", label: "Мова (es/uk/en)", placeholder: "es" },
    ],
    buildPrompt: (p) =>
      `Запусти скіл liti-weekly-report. Параметри:\nAGENCY_ID = ${p.agencyId}\nWEEK_START = ${p.weekStart}\nWEEK_END = ${p.weekEnd}\nPAYOUT_DATE = ${p.payoutDate}\nLANG = ${p.lang || "uk"}\nЗбери дані з Amplitude+адмінки, згенеруй xlsx у поточну робочу директорію. Не пиши пояснень — просто згенеруй файл.`,
  },
  {
    id: "agent-analytics",
    name: "Аналітика агента (мами)",
    skill: "liti-agent-analytics",
    description: "xlsx по всіх стрімерках агента за 14 днів",
    fields: [
      { key: "url", label: "URL агента (referral list або /user/XXX)", placeholder: "https://c.liti.live/app/...streamer__id...=XXXX", type: "textarea" },
      { key: "days", label: "Період (днів)", placeholder: "14" },
    ],
    buildPrompt: (p) =>
      `Запусти скіл liti-agent-analytics для: ${p.url}\nПеріод: ${p.days || "14"} днів. Згенеруй xlsx у поточну робочу директорію. Не пиши зайвих пояснень — згенеруй файл.`,
  },
  {
    id: "streamer-analytics",
    name: "Аналітика стрімерки",
    skill: "liti-streamer-analytics",
    description: "Звіт по дзвінках однієї стрімерки (md-файл)",
    fields: [
      { key: "url", label: "URL стрімерки (/user/XXX або videocalllog)", placeholder: "https://c.liti.live/user/XXXX", type: "textarea" },
      { key: "dateRange", label: "Період (опційно)", placeholder: "останні 30 днів" },
    ],
    buildPrompt: (p) =>
      `Запусти скіл liti-streamer-analytics для: ${p.url}\nПеріод: ${p.dateRange || "останні 30 днів"}. Сформуй звіт і збережи його у md-файл у поточну робочу директорію.`,
  },
];

export function getReportType(id: string): ReportType | undefined {
  return REPORT_TYPES.find(r => r.id === id);
}
