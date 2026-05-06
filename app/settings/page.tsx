'use client';

import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { AppLayout } from '@/components/Layout';
import { ImagePlus, Trash2 } from 'lucide-react';
import { DebouncedInput } from '@/components/DebouncedInput';

export default function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.get('default'));
  
  const leftLogoRef = useRef<HTMLInputElement>(null);
  const rightLogoRef = useRef<HTMLInputElement>(null);

  const initSettings = async () => {
    const existing = await db.settings.get('default');
    if (!existing) {
      await db.settings.add({ id: 'default' });
    }
  };

  const handleImageUpload = (side: 'left' | 'right') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!settings) await initSettings();

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      if (side === 'left') {
        await db.settings.update('default', { leftLogoBase64: base64 });
      } else {
        await db.settings.update('default', { rightLogoBase64: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = async (side: 'left' | 'right') => {
    if (side === 'left') {
      await db.settings.update('default', { leftLogoBase64: undefined });
    } else {
      await db.settings.update('default', { rightLogoBase64: undefined });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Ayarlar</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Logo ve sayfa ayarları.</p>
        </div>

        <div className="bg-white p-6 rounded border border-slate-300 shadow-sm space-y-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-2">Belge Logoları</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Left Logo */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Sol Üst Logo (Kurum 1)</label>
              <div className="border border-slate-300 rounded p-4 flex flex-col items-center justify-center min-h-[160px] bg-slate-50 relative group">
                {settings?.leftLogoBase64 ? (
                  <>
                    <img src={settings.leftLogoBase64} alt="Left Logo" className="max-h-24 object-contain" />
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
                {settings?.rightLogoBase64 ? (
                  <>
                    <img src={settings.rightLogoBase64} alt="Right Logo" className="max-h-24 object-contain" />
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
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded text-sm shadow-sm">
            <p className="font-bold mb-1 uppercase text-xs tracking-wider">Bilgi</p>
            <p className="leading-relaxed">Seçilen logolar, form önizlemesinde ve PDF çıktısında belgenin sağ ve sol köşelerine yerleştirilecektir. Şeffaf (PNG) görseller kullanmanız en iyi sonucu verir.</p>
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
                value={settings?.layout?.fontFamily || 'Times New Roman, serif'}
                onChange={(e) => db.settings.update('default', { layout: { ...settings?.layout!, fontFamily: e.target.value } })}
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
                  value={String(settings?.layout?.fontSizeTitle || 16)}
                  onChange={(val) => db.settings.update('default', { layout: { ...settings?.layout!, fontSizeTitle: Number(val) } })}
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
                  value={String(settings?.layout?.fontSizeContent || 15)}
                  onChange={(val) => db.settings.update('default', { layout: { ...settings?.layout!, fontSizeContent: Number(val) } })}
                />
                <span className="text-xs text-slate-500 font-bold">px</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Satırlar Arası Boşluk</label>
              <select
                className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={settings?.layout?.lineSpacing || 'normal'}
                onChange={(e) => db.settings.update('default', { layout: { ...settings?.layout!, lineSpacing: e.target.value as any } })}
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
                  value={String(settings?.layout?.marginX || 15)}
                  onChange={(val) => db.settings.update('default', { layout: { ...settings?.layout!, marginX: Number(val) } })}
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
                  value={String(settings?.layout?.marginY || 15)}
                  onChange={(val) => db.settings.update('default', { layout: { ...settings?.layout!, marginY: Number(val) } })}
                />
                <span className="text-xs text-slate-500 font-bold">mm</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Filigran Ayarları</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Filigran Metni</label>
                <DebouncedInput
                  type="text"
                  placeholder="Örn: GİZLİ, TASLAK"
                  className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={settings?.layout?.watermarkText || ''}
                  onChange={(val) => db.settings.update('default', { layout: { ...settings?.layout!, watermarkText: val } })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Opaklık (%)</label>
                <DebouncedInput
                  type="number" min="0" max="100"
                  className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={String(settings?.layout?.watermarkOpacity ?? 10)}
                  onChange={(val) => db.settings.update('default', { layout: { ...settings?.layout!, watermarkOpacity: Number(val) } })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Açı (Derece)</label>
                <div className="flex items-center gap-2">
                  <DebouncedInput
                    type="number"
                    min="-360" max="360"
                    className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={String(settings?.layout?.watermarkAngle ?? -45)}
                    onChange={(val) => db.settings.update('default', { layout: { ...settings?.layout!, watermarkAngle: Number(val) } })}
                  />
                  <span className="text-xs text-slate-500 font-bold">°</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Boyut (px)</label>
                <DebouncedInput
                  type="number"
                  className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={String(settings?.layout?.watermarkSize ?? 120)}
                  onChange={(val) => db.settings.update('default', { layout: { ...settings?.layout!, watermarkSize: Number(val) } })}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">İmza Alanı Ayarları</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">İmza Fontu</label>
                <select
                  className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={settings?.layout?.signatureFontFamily || ''}
                  onChange={(e) => db.settings.update('default', { layout: { ...settings?.layout!, signatureFontFamily: e.target.value } })}
                >
                  <option value="">(Belge Fontu)</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                  <option value="Arial, sans-serif">Arial</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">İmza Boyutu (px)</label>
                <input
                  type="number"
                  className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={settings?.layout?.signatureFontSize || 14}
                  onChange={(e) => db.settings.update('default', { layout: { ...settings?.layout!, signatureFontSize: Number(e.target.value) } })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">İmza Boşluğu (px)</label>
                <input
                  type="number"
                  className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={settings?.layout?.signatureSpacing || 40}
                  onChange={(e) => db.settings.update('default', { layout: { ...settings?.layout!, signatureSpacing: Number(e.target.value) } })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
