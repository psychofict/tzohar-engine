export const locales = ["en", "ko", "zh", "fr", "ja"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  ko: "한국어",
  zh: "中文",
  fr: "Français",
  ja: "日本語",
};

export const localeCodes: Record<Locale, string> = {
  en: "EN",
  ko: "KR",
  zh: "ZH",
  fr: "FR",
  ja: "JA",
};

export const localeToOgLocale: Record<Locale, string> = {
  en: "en_US",
  ko: "ko_KR",
  zh: "zh_CN",
  fr: "fr_FR",
  ja: "ja_JP",
};
