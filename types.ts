
export type LanguageCode = 'fa' | 'en';

export type TargetLanguage = 'fa' | 'en' | 'es' | 'ar' | 'fr' | 'de' | 'tr' | 'ru';

export interface SubtitleBlock {
  id: string;
  index: string;
  timestamp: string;
  text: string;
}

export interface TranslationStatus {
  totalChunks: number;
  completedChunks: number;
  isProcessing: boolean;
  error?: string;
}

export interface AppStrings {
  title: string;
  uploadTitle: string;
  uploadDesc: string;
  processBtn: string;
  downloadBtn: string;
  creator: string;
  about: string;
  guide: string;
  tutorial: string;
  processing: string;
  finished: string;
  error: string;
  contact: string;
  home: string;
  socials: string;
  telegramChannel: string;
  telegramID: string;
  email: string;
  aboutContent: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  guideStep1: string;
  guideStep2: string;
  guideStep3: string;
  guideStep4: string;
  close: string;
  menu: string;
  heroSubtitle: string;
  statsUsers: string;
  statsTranslated: string;
  statsAccuracy: string;
  faqTitle: string;
  faq1Q: string;
  faq1A: string;
  faq2Q: string;
  faq2A: string;
  faq3Q: string;
  faq3A: string;
  whyAiTitle: string;
  whyAiDesc: string;
  seoTextTitle: string;
  seoTextBody: string;
  tutorialTitle: string;
  tutorialIntro: string;
  tutorialStep1Title: string;
  tutorialStep1Desc: string;
  tutorialStep2Title: string;
  tutorialStep2Desc: string;
  tutorialStep3Title: string;
  tutorialStep3Desc: string;
  targetLangLabel: string;
}
