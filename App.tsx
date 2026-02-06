
import React, { useState, useEffect, useRef } from 'react';
import { LanguageCode, AppStrings, SubtitleBlock, TranslationStatus, TargetLanguage } from './types';
import { LOCALES, TARGET_LANGUAGES } from './constants';
import { parseSRT, chunkBlocks, rebuildSRT } from './services/srtParser';
import { translateChunk } from './services/geminiService';

const Icons = {
  Moon: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
  Sun: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
  Upload: () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Play: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Layers: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Telegram: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
  Mail: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
};

const Logo: React.FC = () => (
  <div className="flex items-center gap-2 group cursor-pointer">
    <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">S</div>
    <div className="flex flex-col -space-y-1">
      <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">SOREN</span>
      <span className="text-[9px] font-bold tracking-[0.2em] text-brand-600 uppercase leading-none">Translator</span>
    </div>
  </div>
);

const Header: React.FC<{ 
  lang: LanguageCode; setLang: (l: LanguageCode) => void; 
  theme: 'light' | 'dark'; toggleTheme: () => void; 
  strings: AppStrings; currentPage: string; setPage: (p: string) => void;
}> = ({ lang, setLang, theme, toggleTheme, strings, currentPage, setPage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isRtl = lang === 'fa';
  const navItems = ['home', 'about', 'guide', 'tutorial'];

  const handleNav = (p: string) => {
    setPage(p);
    setIsMenuOpen(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <>
      <header className={`sticky top-0 z-[100] w-full border-b transition-all duration-300 ${theme === 'dark' ? 'bg-slate-950/80 border-white/5 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'} ${isRtl ? 'rtl' : 'ltr'}`}>
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <button onClick={() => handleNav('home')} className="outline-none"><Logo /></button>
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((page) => (
              <button key={page} onClick={() => handleNav(page)} className={`text-sm font-bold transition-colors ${currentPage === page ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>
                {strings[page as keyof AppStrings]}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button onClick={() => setLang('fa')} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${lang === 'fa' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-400'}`}>FA</button>
              <button onClick={() => setLang('en')} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${lang === 'en' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-400'}`}>EN</button>
            </div>
            <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
            </button>
            <button onClick={() => setIsMenuOpen(true)} className="md:hidden w-10 h-10 flex items-center justify-center"><Icons.Menu /></button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[1000] bg-white dark:bg-slate-950 flex flex-col p-6 animate-slide-up">
          <div className="flex justify-between items-center mb-10">
            <Logo />
            <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 flex items-center justify-center"><Icons.X /></button>
          </div>
          <div className={`flex flex-col gap-8 text-2xl font-black ${isRtl ? 'text-right' : 'text-left'}`}>
            {navItems.map(page => (
              <button key={page} onClick={() => handleNav(page)} className={currentPage === page ? 'text-brand-600' : 'text-slate-400'}>
                {strings[page as keyof AppStrings]}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const HomePage: React.FC<{ strings: AppStrings, lang: LanguageCode }> = ({ strings, lang }) => {
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState<TargetLanguage>('fa');
  const [status, setStatus] = useState<TranslationStatus>({ totalChunks: 0, completedChunks: 0, isProcessing: false });
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tone, setTone] = useState<'formal' | 'conversational'>('conversational');
  const [cooldown, setCooldown] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const isRtl = lang === 'fa';
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleFile = (f: File) => {
    if (!f || !f.name.toLowerCase().endsWith('.srt')) {
      setStatus(prev => ({ ...prev, error: isRtl ? 'لطفاً فقط فایل .srt انتخاب کنید' : 'Please select only .srt files' }));
      return;
    }
    setFile(f);
    setTranslatedContent(null);
    setStatus({ totalChunks: 0, completedChunks: 0, isProcessing: false });
  };

  const startTranslation = async () => {
    if (!file) return;
    try {
      setStatus({ totalChunks: 0, completedChunks: 0, isProcessing: true, error: undefined });
      const content = await file.text();
      const parsedBlocks = parseSRT(content);
      if (parsedBlocks.length === 0) throw new Error("Format SRT Invalid");
      
      // Batch size reduced to 50 for 100% item count accuracy
      const chunks = chunkBlocks(parsedBlocks, 50); 
      setStatus(prev => ({ ...prev, totalChunks: chunks.length }));
      const translatedBlocks: SubtitleBlock[] = [];
      
      let i = 0;
      while (i < chunks.length) {
        try {
          const translatedChunk = await translateChunk(chunks[i], targetLang, tone);
          translatedBlocks.push(...translatedChunk);
          setStatus(prev => ({ ...prev, completedChunks: i + 1 }));
          i++;
          
          // Small pause between successful batches
          if (i < chunks.length) {
            await new Promise(r => setTimeout(r, 1500));
          }
        } catch (error: any) {
          if (error.message === 'RATE_LIMIT') {
            setCooldown(60);
            await new Promise(r => setTimeout(r, 61000));
            continue; // Resume from the same index 'i'
          }
          throw error;
        }
      }
      
      setTranslatedContent(rebuildSRT(translatedBlocks));
      setStatus(prev => ({ ...prev, isProcessing: false }));
    } catch (error: any) {
      setStatus(prev => ({ ...prev, isProcessing: false, error: error.message || strings.error }));
    }
  };

  const reset = () => {
    setFile(null);
    setTranslatedContent(null);
    setStatus({ totalChunks: 0, completedChunks: 0, isProcessing: false });
  };

  const progress = status.totalChunks > 0 ? (status.completedChunks / status.totalChunks) * 100 : 0;

  return (
    <div className={`container mx-auto px-4 py-12 md:py-20 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
          {isRtl ? 'ترجمه هوشمند' : 'Intelligent'} <br/><span className="text-brand-600">{isRtl ? 'زیرنویس فیلم' : 'Subtitle Translator'}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium max-w-xl mx-auto">{strings.heroSubtitle}</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="glass p-8 md:p-12 rounded-3xl shadow-xl">
          <div className="space-y-8 mb-8">
            <div className="flex flex-col items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isRtl ? 'لحن ترجمه' : 'Tone Style'}</span>
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1">
                <button onClick={() => setTone('conversational')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tone === 'conversational' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-400'}`}>{isRtl ? 'محاوره‌ای' : 'Slang'}</button>
                <button onClick={() => setTone('formal')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tone === 'formal' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-400'}`}>{isRtl ? 'رسمی' : 'Formal'}</button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{strings.targetLangLabel}</span>
              <div className="grid grid-cols-4 gap-2 w-full">
                {(Object.entries(TARGET_LANGUAGES) as [TargetLanguage, any][]).map(([code, info]) => (
                  <button key={code} onClick={() => setTargetLang(code)} className={`px-2 py-3 rounded-xl text-[10px] font-black transition-all border-2 flex flex-col items-center justify-center gap-1 ${targetLang === code ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/10 text-brand-600 shadow-md scale-105' : 'border-transparent bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    <span>{info.native}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-brand-500/50'}`}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept=".srt" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors ${file ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600'}`}><Icons.Upload /></div>
            <h3 className="text-lg font-bold mb-1 truncate max-w-full px-4">{file ? file.name : strings.uploadTitle}</h3>
            <p className="text-slate-400 text-xs text-center">{strings.uploadDesc}</p>
          </div>

          <div className="mt-8 space-y-6">
            {status.error && <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 rounded-xl text-sm font-bold text-center leading-relaxed">{status.error}</div>}
            
            {cooldown > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-600 rounded-xl flex items-center justify-center gap-3 font-black animate-pulse">
                <Icons.Clock /> <span>{isRtl ? `استراحت هوشمند برای شارژ سهمیه: ${cooldown} ثانیه` : `Neural Recharge Pause: ${cooldown}s`}</span>
              </div>
            )}

            {!status.isProcessing && !translatedContent && (
              <button onClick={startTranslation} disabled={!file} className={`w-full h-14 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${file ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}>
                {strings.processBtn} <Icons.Play />
              </button>
            )}

            {status.isProcessing && (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">{strings.processing}</span>
                  <span className="text-2xl font-black text-brand-600">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-[10px] text-center text-slate-400 italic font-bold">{isRtl ? 'در حال پایش دقیق خطوط برای جلوگیری از حذف دیالوگ‌ها...' : 'Monitoring line counts to ensure no dialogue is missed...'}</p>
              </div>
            )}

            {translatedContent && (
              <div className="space-y-4 animate-slide-up">
                <div className="flex gap-2">
                  <button onClick={() => {
                    const blob = new Blob([translatedContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Soren_Final_${TARGET_LANGUAGES[targetLang].name}_${file!.name}`;
                    a.click();
                    reset();
                  }} className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"><Icons.Download /> {strings.downloadBtn}</button>
                  <button onClick={() => { navigator.clipboard.writeText(translatedContent); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }} className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${copySuccess ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {copySuccess ? <Icons.Check /> : <Icons.Copy />}
                  </button>
                </div>
                <button onClick={reset} className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 py-2 underline decoration-dotted">{isRtl ? 'شروع پروژه جدید' : 'Start New Project'}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PageWrapper: React.FC<{ children: React.ReactNode, title: string, isRtl: boolean }> = ({ children, title, isRtl }) => (
  <div className={`container mx-auto px-4 py-12 md:py-20 max-w-4xl ${isRtl ? 'rtl text-right' : 'ltr text-left'}`}>
    <h1 className="text-3xl md:text-5xl font-black mb-10 tracking-tight">{title}</h1>
    {children}
  </div>
);

const AboutPage: React.FC<{ strings: AppStrings, lang: LanguageCode }> = ({ strings, lang }) => (
  <PageWrapper title={strings.about} isRtl={lang === 'fa'}>
    <div className="glass p-8 md:p-12 rounded-3xl space-y-10 leading-relaxed">
      <p className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-200">{strings.aboutContent}</p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-brand-50 dark:bg-brand-900/10 p-6 rounded-2xl">
          <h3 className="text-lg font-black text-brand-600 mb-2">{strings.feature1Title}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{strings.feature1Desc}</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-2xl">
          <h3 className="text-lg font-black text-indigo-600 mb-2">{strings.feature2Title}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{strings.feature2Desc}</p>
        </div>
      </div>
    </div>
  </PageWrapper>
);

const GuidePage: React.FC<{ strings: AppStrings, lang: LanguageCode }> = ({ strings, lang }) => (
  <PageWrapper title={strings.guide} isRtl={lang === 'fa'}>
    <div className="grid sm:grid-cols-2 gap-6">
      {[strings.guideStep1, strings.guideStep2, strings.guideStep3, strings.guideStep4].map((step, i) => (
        <div key={i} className="glass p-8 rounded-3xl flex flex-col gap-4 relative overflow-hidden">
          <span className="absolute -bottom-4 -right-2 text-8xl font-black text-brand-600/5 select-none">{i+1}</span>
          <div className="w-10 h-10 bg-brand-600 text-white rounded-lg flex items-center justify-center font-bold">{i+1}</div>
          <p className="text-lg font-bold relative z-10">{step}</p>
        </div>
      ))}
    </div>
  </PageWrapper>
);

const TutorialPage: React.FC<{ strings: AppStrings, lang: LanguageCode }> = ({ strings, lang }) => (
  <PageWrapper title={strings.tutorial} isRtl={lang === 'fa'}>
    <div className="space-y-8">
      {[
        { t: strings.tutorialStep1Title, d: strings.tutorialStep1Desc, i: <Icons.Layers /> },
        { t: strings.tutorialStep2Title, d: strings.tutorialStep2Desc, i: <Icons.Play /> },
        { t: strings.tutorialStep3Title, d: strings.tutorialStep3Desc, i: <Icons.Check /> }
      ].map((step, i) => (
        <div key={i} className="glass p-8 rounded-3xl flex gap-6 items-start">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 text-brand-600 scale-125">{step.i}</div>
          <div>
            <h3 className="text-xl font-black mb-2">{step.t}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{step.d}</p>
          </div>
        </div>
      ))}
    </div>
  </PageWrapper>
);

const Footer: React.FC<{ strings: AppStrings, lang: LanguageCode, setPage: (p: string) => void }> = ({ strings, lang, setPage }) => {
  const isRtl = lang === 'fa';
  return (
    <footer className={`border-t border-slate-200 dark:border-white/5 py-12 mt-20 ${isRtl ? 'rtl text-right' : 'ltr text-left'}`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <Logo />
            <p className="text-sm font-medium text-slate-500 max-w-xs">{strings.aboutContent.slice(0, 100)}...</p>
            <div className="flex gap-4">
              <a href={`https://t.me/${strings.telegramChannel}`} className="text-slate-400 hover:text-brand-600"><Icons.Telegram /></a>
              <a href={`mailto:${strings.email}`} className="text-slate-400 hover:text-brand-600"><Icons.Mail /></a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-6">{isRtl ? 'بخش‌های سایت' : 'Navigation'}</h4>
            <div className="flex flex-col gap-4 text-sm font-bold text-slate-600 dark:text-slate-300">
              <button onClick={() => setPage('home')} className="hover:text-brand-600 text-start">{strings.home}</button>
              <button onClick={() => setPage('guide')} className="hover:text-brand-600 text-start">{strings.guide}</button>
              <button onClick={() => setPage('about')} className="hover:text-brand-600 text-start">{strings.about}</button>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-6">{isRtl ? 'تماس با ما' : 'Contact'}</h4>
            <div className="flex flex-col gap-2 text-sm font-bold">
              <span className="text-slate-400">EMAIL:</span><a href={`mailto:${strings.email}`} className="hover:text-brand-600 break-all">{strings.email}</a>
              <span className="text-slate-400 mt-2">TELEGRAM:</span><a href={`https://t.me/${strings.telegramID}`} className="hover:text-brand-600">@{strings.telegramID}</a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/5 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2025 SOREN TRANSLATOR | DEVELOPED BY SURENA</p>
        </div>
      </div>
    </footer>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<LanguageCode>('fa');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentPage, setPage] = useState('home');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [theme, lang, currentPage]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
      <Header 
        lang={lang} setLang={setLang} theme={theme} 
        toggleTheme={() => setTheme(p => p === 'light' ? 'dark' : 'light')} 
        strings={LOCALES[lang]} currentPage={currentPage} setPage={setPage}
      />
      <main className="flex-grow">
        {currentPage === 'home' && <HomePage strings={LOCALES[lang]} lang={lang} />}
        {currentPage === 'about' && <AboutPage strings={LOCALES[lang]} lang={lang} />}
        {currentPage === 'guide' && <GuidePage strings={LOCALES[lang]} lang={lang} />}
        {currentPage === 'tutorial' && <TutorialPage strings={LOCALES[lang]} lang={lang} />}
      </main>
      <Footer strings={LOCALES[lang]} lang={lang} setPage={setPage} />
    </div>
  );
};

export default App;
