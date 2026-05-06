'use client';

import { useState, useRef, useEffect } from 'react';
import { db, useLiveQuery, Settings } from '@/lib/db';
import { AppLayout } from '@/components/Layout';
import { ImagePlus, Trash2, Save, Loader2 } from 'lucide-react';
import { DebouncedInput } from '@/components/DebouncedInput';

export default function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.get('default'));
  const [localSettings, setLocalSettings] = useState<Settings | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const leftLogoRef = useRef<HTMLInputElement>(null);
  const rightLogoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      const draft = localStorage.getItem('draft_settings');
      if (draft) {
        try {
          const draftData = JSON.parse(draft);
          setLocalSettings(draftData);
          setIsDirty(true);
          return;
        } catch (e) { console.error('Settings draft error', e); }
      }
      setLocalSettings(settings);
    } else {
      setLocalSettings({ id: 'default', layout: {} });
    }
  }, [settings]);

  const updateLocalSettings = (updates: Partial<Settings>) => {
    if (!localSettings) return;
    const updated = { ...localSettings, ...updates };
    setLocalSettings(updated);
    setIsDirty(true);
    localStorage.setItem('draft_settings', JSON.stringify(updated));
  };

  const saveToCloud = async () => {
    if (!localSettings || isSaving) return;
    setIsSaving(true);
    try {
      await db.settings.put(localSettings);
      setIsDirty(false);
      localStorage.removeItem('draft_settings');
      alert('Ayarlar kaydedildi.');
    } catch (e) {
      alert('Kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (side: 'left' | 'right') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (side === 'left') {
        updateLocalSettings({ leftLogoBase64: base64 });
      } else {
        updateLocalSettings({ rightLogoBase64: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (side: 'left' | 'right') => {
    if (side === 'left') {
      updateLocalSettings({ leftLogoBase64: undefined });
    } else {
      updateLocalSettings({ rightLogoBase64: undefined });
    }
  };

  if (!localSettings) return <div className="p-8 text-center font-bold text-slate-500 uppercase tracking-widest">Yükleniyor...</div>;

  return (
    <AppLayout>
      <div className={`max-w-3xl mx-auto transition-all ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Ayarlar</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Logo ve sayfa ayarları.</p>
          </div>
          {isDirty && (
            <button
              onClick={saveToCloud}
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg animate-pulse hover:animate-none active:scale-95 uppercase tracking-wider disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              AYARLARI KAYDET
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded border border-slate-300 shadow-sm space-y-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-2">Belge Logoları</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Left Logo */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Sol Üst Logo (Kurum 1)</label>
              <div className="border border-slate-300 rounded p-4 flex flex-col items-center justify-center min-h-[160px] bg-slate-50 relative group">
                {localSettings.leftLogoBase64 ? (
                  <>
                    <img src={localSettings.leftLogoBase64} alt="Left Logo" className="max-h-24 object-contain" />
                    <button 
                      onClick={() => removeImage('left')}
                      className="absolute top-2 right-2 bg-red-100 text-red-600 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <button 
                      onClick={() => leftLogoRef.current?.click()}
                      className="text-blue-700 flex flex-col items-center gap-2 hover:text-blue-800 font-medium"
                    >
                      <ImagePlus className="w-8 h-8" />
                      <span className="text-sm font-bold uppercase">Logo Yükle</span>
                    </button>
                    <input 
                      ref={leftLogoRef} 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload('left')}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Logo */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Sağ Üst Logo (Kurum 2)</label>
              <div className="border border-slate-300 rounded p-4 flex flex-col items-center justify-center min-h-[160px] bg-slate-50 relative group">
                {localSettings.rightLogoBase64 ? (
                  <>
                    <img src={localSettings.rightLogoBase64} alt="Right Logo" className="max-h-24 object-contain" />
                    <button 
                      onClick={() => removeImage('right')}
                      className="absolute top-2 right-2 bg-red-100 text-red-600 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <button 
                      onClick={() => rightLogoRef.current?.click()}
                      className="text-blue-700 flex flex-col items-center gap-2 hover:text-blue-800 font-medium"
                    >
                      <ImagePlus className="w-8 h-8" />
                      <span className="text-sm font-bold uppercase">Logo Yükle</span>
                    </button>
                    <input 
                      ref={rightLogoRef} 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload('right')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white p-6 rounded border border-slate-300 shadow-sm space-y-6 mt-8">
          <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-2">Görünüm Ayarları (Global)</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Yazı Tipi (Font)</label>
              <select
                className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={localSettings.layout?.fontFamily || 'Times New Roman, serif'}
                onChange={(e) => updateLocalSettings({ layout: { ...localSettings.layout!, fontFamily: e.target.value } })}
              >
                <option value="Times New Roman, serif">Times New Roman</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Calibri, sans-serif">Calibri</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Tahoma, sans-serif">Tahoma</option>
                <option value="Verdana, sans-serif">Verdana</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Başlık Boyutu</label>
              <div className="flex items-center gap-2">
                <DebouncedInput
                  type="number"
                  className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={String(localSettings.layout?.fontSizeTitle || 16)}
                  onChange={(val) => updateLocalSettings({ layout: { ...localSettings.layout!, fontSizeTitle: Number(val) } })}
                />
                <span className="text-xs text-slate-500 font-bold">px</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Metin Boyutu</label>
              <div className="flex items-center gap-2">
                <DebouncedInput
                  type="number"
                  className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={String(localSettings.layout?.fontSizeContent || 15)}
                  onChange={(val) => updateLocalSettings({ layout: { ...localSettings.layout!, fontSizeContent: Number(val) } })}
                />
                <span className="text-xs text-slate-500 font-bold">px</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Satırlar Arası Boşluk</label>
              <select
                className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={localSettings.layout?.lineSpacing || 'normal'}
                onChange={(e) => updateLocalSettings({ layout: { ...localSettings.layout!, lineSpacing: e.target.value as any } })}
              >
                <option value="tight">Sıkışık (Dar)</option>
                <option value="normal">Normal</option>
                <option value="relaxed">Geniş (Rahat)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Sayfa Kenar (X)</label>
              <div className="flex items-center gap-2">
                <DebouncedInput
                  type="number"
                  className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={String(localSettings.layout?.marginX || 15)}
                  onChange={(val) => updateLocalSettings({ layout: { ...localSettings.layout!, marginX: Number(val) } })}
                />
                <span className="text-xs text-slate-500 font-bold">mm</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Sayfa Alt/Üst (Y)</label>
              <div className="flex items-center gap-2">
                <DebouncedInput
                  type="number"
                  className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={String(localSettings.layout?.marginY || 15)}
                  onChange={(val) => updateLocalSettings({ layout: { ...localSettings.layout!, marginY: Number(val) } })}
                />
                <span className="text-xs text-slate-500 font-bold">mm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
