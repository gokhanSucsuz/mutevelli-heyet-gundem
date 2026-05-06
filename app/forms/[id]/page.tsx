'use client';

import React, { useState, useRef, useEffect } from 'react';
import { db, useLiveQuery, OfficialForm, FormItem, Member, MemberSnapshot } from '@/lib/db';
import { AppLayout } from '@/components/Layout';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useReactToPrint } from 'react-to-print';
import { 
  Save, Printer, ArrowLeft, Plus, Trash2, 
  Table as TableIcon, CheckSquare, ListOrdered, Minus, Lock, Unlock,
  CheckCircle, ArrowRight, ArrowUp, ArrowDown, ChevronUp, ChevronDown,
  FileText, MessageSquare, Users, Eye, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { RichTextEditor } from '@/components/RichTextEditor';
import { DebouncedInput } from '@/components/DebouncedInput';

function PrintPreview({ localForm, members, settings }: { localForm: OfficialForm, members: Member[], settings: any }) {
  const activeLayout = settings?.layout || localForm.layout;
  const selectedMembers = members.filter(m => localForm.signatureMembers.includes(m.id));
  const finalSigners = localForm.signatureSnapshots && localForm.signatureSnapshots.length > 0
    ? localForm.signatureSnapshots
    : selectedMembers;

  const itemSpaceY = activeLayout?.lineSpacing === 'tight' ? 'space-y-1' : activeLayout?.lineSpacing === 'relaxed' ? 'space-y-4' : 'space-y-2';
  const tablePadding = activeLayout?.tablePadding === 'tight' ? 'p-1' : activeLayout?.tablePadding === 'relaxed' ? 'p-3' : 'p-2';

  const renderItem = (item: FormItem, index: number) => {
    return (
      <div key={item.id} className="flex gap-4">
        <div className="font-bold min-w-[2rem] text-right">
          {item.type === 'numbered' ? `${index + 1}.` : '•'}
        </div>
        <div className="flex-1 space-y-4">
          <div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: item.text }} />
          
          {item.hasTable && item.table && (
            <table className="w-full border-collapse table-fixed break-words" style={{ fontSize: localForm.layout?.fontSizeTable ? `${localForm.layout?.fontSizeTable}px` : '13px' }}>
              <thead>
                <tr className="bg-slate-50">
                  {item.table.columns.map((col, i) => (
                    <th key={i} className={`border border-slate-300 ${tablePadding} text-left text-xs font-bold uppercase`}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.table.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className={`border border-slate-300 ${tablePadding} text-xs`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {item.subItems && item.subItems.length > 0 && (
            <div 
              className="flex flex-col" 
              style={{ 
                gap: localForm.layout?.subItemSpacing !== undefined ? `${localForm.layout?.subItemSpacing}px` : '8px', 
                marginTop: localForm.layout?.subItemSpacing !== undefined ? `${localForm.layout?.subItemSpacing}px` : '8px' 
              }}
            >
              {item.subItems.map((sub, si) => (
                <div key={sub.id} className="flex gap-3">
                  <div className="font-bold min-w-[1.5rem] text-right">
                    {sub.type === 'numbered' ? `${si + 1}.` : '•'}
                  </div>
                  <div className="flex-1 rich-text-preview" dangerouslySetInnerHTML={{ __html: sub.text }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="print-a4-container">
      <div className="print-a4-page relative overflow-hidden bg-white shadow-2xl mx-auto" style={{
          fontFamily: activeLayout?.fontFamily || 'Inter, sans-serif',
          padding: `${activeLayout?.marginY || 2}cm ${activeLayout?.marginX || 2}cm`
        }}>
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6 relative z-10">
          <div className="flex-1 flex flex-col gap-1">
            {localForm.headerTop.includes('<') ? (
               <div className="rich-text-preview header-rich-text" dangerouslySetInnerHTML={{ __html: localForm.headerTop }} />
            ) : (
               <div className="whitespace-pre-wrap">{localForm.headerTop}</div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col items-end text-right">
            <div className="flex flex-col gap-1" style={{ fontSize: localForm.layout?.fontSizeHeaderInfo ? `${localForm.layout?.fontSizeHeaderInfo}px` : 'inherit' }}>
              <div className="flex justify-end gap-2">
                <span className="font-bold min-w-[100px]">Karar Tarihi</span>
                <span>: {localForm.decisionDate ? new Date(localForm.decisionDate).toLocaleDateString('tr-TR') : '.../.../20...'}</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="font-bold min-w-[100px]">Karar Saati</span>
                <span>: {localForm.decisionTime || '...:...'}</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="font-bold min-w-[100px]">Karar No</span>
                <span>: {localForm.decisionNo || '...'}</span>
              </div>
            </div>
            {localForm.isPostponed && (
              <div className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
                Toplantı Ertelendi
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-right mb-6" style={{ fontSize: localForm.layout?.fontSizeHeaderInfo ? `${localForm.layout?.fontSizeHeaderInfo}px` : 'inherit' }}>
            {localForm.headerLine4.includes('<') ? (
              <div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: localForm.headerLine4 }} />
            ) : (
              <div>{localForm.headerLine4}</div>
            )}
        </div>

        {/* Title */}
        <div className="text-center mb-10 relative z-10">
          <h1 className="text-xl font-bold uppercase underline decoration-2 underline-offset-8" style={{ fontSize: activeLayout?.fontSizeTitle ? `${activeLayout?.fontSizeTitle}px` : '18px' }}>
            {localForm.title}
          </h1>
          <div className="mt-2 text-[11px] font-normal italic text-slate-500">Kayıt ID: {localForm.id.split('-')[0].toUpperCase()}</div>
        </div>

        {/* Content Section */}
        <div className={`${itemSpaceY} flex-1`} style={{ fontSize: localForm.layout?.fontSizeContent ? `${localForm.layout?.fontSizeContent}px` : '15px' }}>
          {localForm.items.map((item, index) => renderItem(item, index))}

          {/* Footer Text */}
          <div className="mt-12 pt-8 border-t border-slate-100 relative z-10">
            <div className="font-bold text-center text-[14px]" style={{ fontSize: localForm.layout?.fontSizeContent ? `${localForm.layout?.fontSizeContent}px` : '14px' }}>
              KARAR:
            </div>
            <div className="mt-4 text-justify leading-relaxed">
            {localForm.footerText.includes('<') ? (
              <div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: localForm.footerText }} />
            ) : (
              <div>{localForm.footerText}</div>
            )}
            </div>
          </div>
        </div>

        {/* Signatures Section */}
        <div className="mt-16 grid grid-cols-2 gap-y-12 relative z-10" style={{ 
              marginTop: activeLayout?.signatureSpacing ? `${activeLayout?.signatureSpacing}px` : '4rem',
              opacity: (localForm.layout?.signatureOpacity ?? 100) / 100,
              fontFamily: localForm.layout?.signatureFontFamily || 'inherit'
            }}>
          {finalSigners.map((member) => (
            <div key={member.id} className="text-center flex flex-col items-center">
              <div className="font-bold uppercase" style={{ 
                      fontSize: localForm.layout?.signatureFontSize ? `${localForm.layout?.signatureFontSize}px` : (localForm.layout?.fontSizeContent ? `${localForm.layout?.fontSizeContent}px` : '14px'),
                    }}>{member.name}</div>
              <div className="text-sm italic" style={{ 
                      fontSize: localForm.layout?.signatureFontSize ? `${localForm.layout?.signatureFontSize}px` : (localForm.layout?.fontSizeContent ? `${localForm.layout?.fontSizeContent}px` : '14px'),
                    }}>{member.title}</div>
              {member.isProxy && (
                <div className="mt-1 flex flex-col items-center">
                  <div className="text-[10px] font-bold uppercase text-slate-500">(Yerine)</div>
                  <div className="font-bold uppercase text-[13px]" style={{ 
                      fontSize: localForm.layout?.signatureFontSize ? `${localForm.layout?.signatureFontSize}px` : (localForm.layout?.fontSizeContent ? `${localForm.layout?.fontSizeContent}px` : '14px'),
                    }}>{member.proxyName}</div>
                  <div className="text-[11px] italic" style={{ 
                      fontSize: localForm.layout?.signatureFontSize ? `${localForm.layout?.signatureFontSize}px` : (localForm.layout?.fontSizeContent ? `${localForm.layout?.fontSizeContent}px` : '14px'),
                    }}>{member.proxyTitle}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Watermark/Background Text */}
        {localForm.layout?.watermarkText && (
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0"
            style={{
              opacity: (localForm.layout.watermarkOpacity ?? 10) / 100,
              transform: `translate(-50%, -50%) rotate(${localForm.layout.watermarkAngle ?? -45}deg)`,
              fontSize: `${localForm.layout.watermarkSize ?? 80}px`,
              color: 'black',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            {localForm.layout.watermarkText}
          </div>
        )}

        {/* Page Footer Info */}
        {localForm.layout?.showPageNumbers && (
          <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-slate-400">
            Sayfa 1
          </div>
        )}
      </div>
    </div>
  );
}

export default function FormEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const form = useLiveQuery(() => db.forms.get(id));
  const allMembers = useLiveQuery(() => db.members.orderBy('order').toArray());
  const settings = useLiveQuery(() => db.settings.get('default'));
  
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [localForm, setLocalForm] = useState<OfficialForm | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Initialize local state from DB or localStorage draft
  useEffect(() => {
    if (form) {
      const draft = localStorage.getItem(`draft_form_${id}`);
      if (draft) {
        try {
          const draftData = JSON.parse(draft);
          if (draftData.updatedAt > (form.updatedAt || 0)) {
            setLocalForm(draftData);
            setIsDirty(true);
            return;
          }
        } catch (e) { console.error('Draft parsing error', e); }
      }
      setLocalForm(form);
    }
  }, [form, id]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: localForm?.title || 'Karar Formu',
  });

  if (!localForm || !allMembers) return <div className="p-8 text-center">Yükleniyor...</div>;

  const updateForm = (updates: Partial<OfficialForm>) => {
    if (isSaving) return;
    const updated = { ...localForm, ...updates, updatedAt: Date.now() };
    setLocalForm(updated);
    setIsDirty(true);
    localStorage.setItem(`draft_form_${id}`, JSON.stringify(updated));
  };

  const saveToCloud = async () => {
    if (!isDirty || isSaving) return;
    setIsSaving(true);
    try {
      await db.forms.put(localForm);
      setIsDirty(false);
      localStorage.removeItem(`draft_form_${id}`);
    } catch (e) {
      alert('Kaydedilirken bir hata oluştu. Lütfen bağlantınızı kontrol edin.');
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (type: 'numbered' | 'bullet' = 'numbered') => {
    const newItem: FormItem = {
      id: uuidv4(),
      type,
      text: '',
    };
    updateForm({ items: [...localForm.items, newItem] });
  };

  const addItemAt = (index: number, type: 'numbered' | 'bullet' = 'numbered') => {
    const newItem: FormItem = {
      id: uuidv4(),
      type,
      text: '',
    };
    const newItems = [...localForm.items];
    newItems.splice(index, 0, newItem);
    updateForm({ items: newItems });
  };

  const updateItem = (itemId: string, updates: Partial<FormItem>) => {
    const newItems = localForm.items.map(item => item.id === itemId ? { ...item, ...updates } : item);
    updateForm({ items: newItems });
  };

  const removeItem = (itemId: string) => {
    const newItems = localForm.items.filter(item => item.id !== itemId);
    updateForm({ items: newItems });
  };

  const addTableToItem = (itemId: string) => {
    updateItem(itemId, { 
      hasTable: true, 
      table: { columns: ['SIRA NO', 'ADI SOYADI', 'T.C', 'TALEBİ', 'KARAR'], rows: [['1', '', '', '', '']] } 
    });
  };

  const removeTableFromItem = (itemId: string) => {
    updateItem(itemId, { hasTable: false, table: undefined });
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full h-[calc(100vh-2rem)]">
        {/* Header Actions */}
        <div className="flex items-center justify-between bg-white p-5 rounded border border-slate-300 shadow-sm mb-6 shrink-0 z-10 relative">
          <div className="flex items-center gap-4 w-full">
            <Link href="/" className="text-slate-400 hover:text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <DebouncedInput 
              type="text" 
              value={localForm.title} 
              disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
              onChange={(val) => updateForm({ title: val })}
              className={`text-lg font-bold bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded p-1 text-slate-800 placeholder-slate-400 uppercase outline-none w-full max-w-sm ${(localForm.isLocked && !localForm.isPostponed) || isSaving ? 'cursor-not-allowed opacity-70' : ''}`}
              placeholder="Form Başlığı (Örn: Nisan 2023 Toplantısı)"
            />
          </div>
          <div className="flex items-center gap-3">
            {isDirty && (
              <button
                onClick={saveToCloud}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg animate-pulse hover:animate-none disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'KAYDEDİLİYOR...' : 'DEĞİŞİKLİKLERİ BULUTA KAYDET'}
              </button>
            )}
            <div className="bg-slate-100 p-1 rounded flex">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-4 sm:px-6 py-2 text-xs font-bold uppercase transition-all flex items-center gap-2 ${
                  activeTab === 'editor' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="Düzenleyici"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:block">Düzenleyici</span>
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 sm:px-6 py-2 text-xs font-bold uppercase transition-all flex items-center gap-2 ${
                  activeTab === 'preview' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="Önizleme"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:block">Önizleme</span>
              </button>
            </div>
            {activeTab === 'preview' && (
              <div className="flex gap-2">
                {!localForm.isLocked && (
                  <button 
                    onClick={async () => {
                      if (confirm('Kararı kesinleştirmek istiyor musunuz? Bu işlemden sonra sadece toplantı ertelenirse değişiklik yapılabilir.')) {
                        const snapshots = allMembers
                          .filter(m => localForm.signatureMembers.includes(m.id))
                          .map(m => ({
                            id: m.id,
                            name: m.name,
                            title: m.title,
                            isProxy: m.isProxy,
                            proxyName: m.proxyName,
                            proxyTitle: m.proxyTitle,
                            order: m.order
                          }));
                        await updateForm({ isLocked: true, signatureSnapshots: snapshots });
                        alert('Belge kesinleştirildi. Yazdırabilirsiniz.');
                      }
                    }}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all text-[11px] uppercase tracking-wider active:scale-95 disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    KESİNLEŞTİR
                  </button>
                )}
                {localForm.isLocked && !localForm.isPostponed && (
                  <button 
                    onClick={() => updateForm({ isLocked: false })}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all text-[11px] uppercase tracking-wider active:scale-95 disabled:opacity-50"
                  >
                    <Unlock className="w-4 h-4" />
                    KİLİDİ AÇ
                  </button>
                )}
                <button 
                  onClick={() => handlePrint()}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all text-[11px] uppercase tracking-wider active:scale-95 disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  YAZDIR / PDF AL
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area with Sidebar */}
        <div className="flex-1 flex gap-8 overflow-hidden relative">
          {activeTab === 'editor' && (
            <div className="fixed right-2 lg:right-6 top-1/2 -translate-y-1/2 z-40 print:hidden transition-all duration-300">
              <div className="flex flex-col gap-1 lg:gap-2 p-1.5 lg:p-2 bg-white/60 hover:bg-white/95 backdrop-blur-md rounded-xl lg:rounded-3xl border border-slate-200 shadow-xl lg:shadow-2xl opacity-60 hover:opacity-100 transition-all duration-500 group/panel w-10 lg:w-12 hover:w-44 overflow-hidden">
                <div className="flex items-center gap-2 px-2 mb-1 opacity-0 group-hover/panel:opacity-100 transition-opacity duration-300 min-max">
                  <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Navigasyon</h3>
                </div>
                <nav className="flex flex-col gap-1 lg:gap-1.5">
                  {[
                    { id: 'top', label: 'En Üste', icon: ArrowUp },
                    { id: 'header', label: 'Başlık', icon: FileText },
                    { id: 'items', label: 'Gündem', icon: ListOrdered },
                    { id: 'footer', label: 'Not', icon: MessageSquare },
                    { id: 'signatures', label: 'İmzalar', icon: Users },
                    { id: 'bottom', label: 'En Alta', icon: ArrowDown },
                  ].map(section => {
                    const Icon = section.icon;
                    return (
                      <button 
                        key={section.id}
                        onClick={() => {
                          const container = document.getElementById('main-scroll-container');
                          if (!container) return;
                          if (section.id === 'top') {
                            container.scrollTo({ top: 0, behavior: 'smooth' });
                          } else if (section.id === 'bottom') {
                            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                          } else {
                            const el = document.getElementById(section.id);
                            if (el) {
                               const offset = el.offsetTop;
                               container.scrollTo({ top: offset, behavior: 'smooth' });
                            }
                          }
                        }}
                        className="group/btn flex items-center p-2 lg:p-2.5 text-[10px] font-bold text-slate-600 hover:bg-blue-600 hover:text-white rounded-lg lg:rounded-xl transition-all duration-300 uppercase tracking-tight active:scale-90 border border-transparent hover:border-blue-400 min-w-max"
                        title={section.label}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="opacity-0 group-hover/panel:opacity-100 transition-opacity duration-300 ml-3 whitespace-nowrap">{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          )}

          <div className="flex-1 pb-20 w-full overflow-x-hidden">
            {activeTab === 'editor' ? (
              <div className="w-full max-w-5xl mx-auto space-y-8 px-2 sm:px-4">
                {/* Metadata Section */}
                <div id="header" className={`bg-white p-5 rounded border border-slate-300 shadow-sm space-y-4 scroll-mt-20 transition-opacity ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Resmi Kayıt Bilgileri</h3>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      <input 
                        type="checkbox" 
                        id="isPostponed"
                        className="rounded text-blue-700 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        checked={localForm.isPostponed || false}
                        disabled={isSaving}
                        onChange={(e) => updateForm({ isPostponed: e.target.checked })}
                      />
                      <label htmlFor="isPostponed" className="text-[11px] font-bold text-blue-700 cursor-pointer select-none uppercase">
                        Toplantı Ertelendi
                      </label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-slate-500 uppercase block">Karar Tarihi</label>
                        {!localForm.isPostponed && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <input 
                        type="date"
                        disabled={isSaving || !localForm.isPostponed}
                        className={`w-full text-sm border border-slate-300 rounded p-2 outline-none transition-all ${!localForm.isPostponed || isSaving ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 border-blue-200'}`}
                        value={localForm.decisionDate || ''}
                        onChange={(e) => updateForm({ decisionDate: e.target.value })}
                      />
                      {!localForm.isPostponed && <p className="text-[10px] text-slate-400 mt-1 italic">* Değiştirmek için 'Ertelendi' seçiniz.</p>}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-slate-500 uppercase block">Karar Saati</label>
                        {!localForm.isPostponed && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <input 
                        type="time"
                        disabled={isSaving || !localForm.isPostponed}
                        className={`w-full text-sm border border-slate-300 rounded p-2 outline-none transition-all ${!localForm.isPostponed || isSaving ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 border-blue-200'}`}
                        value={localForm.decisionTime || ''}
                        onChange={(e) => updateForm({ decisionTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Karar No</label>
                      <DebouncedInput 
                        className={`w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none ${isSaving || (localForm.isLocked && !localForm.isPostponed) ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`} 
                        value={localForm.decisionNo || ''}
                        disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                        onChange={(val) => updateForm({ decisionNo: val })}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-slate-500 uppercase block">Kurum Başlığı (T.C. ...)</label>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Satır Aralığı:</label>
                        <select 
                          className="text-[10px] border border-slate-300 rounded px-1.5 py-0.5"
                          disabled={isSaving}
                          value={localForm.layout?.headerLineSpacing || 'normal'}
                          onChange={(e) => updateForm({ layout: { ...localForm.layout!, headerLineSpacing: e.target.value } })}
                        >
                          <option value="0.8">Çok Dar</option>
                          <option value="1">Dar</option>
                          <option value="normal">Normal</option>
                          <option value="1.5">Geniş</option>
                        </select>
                      </div>
                    </div>
                    <RichTextEditor 
                      value={localForm.headerTop}
                      disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                      onChange={(val) => updateForm({ headerTop: val })}
                      placeholder="Başlık metnini girin..."
                    />
                  </div>

                  <div className="pt-4">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tarih / Karar No Görünümü (Belge Üzerindeki)</label>
                    <DebouncedInput 
                      className={`w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none ${isSaving || (localForm.isLocked && !localForm.isPostponed) ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`} 
                      value={localForm.headerLine4}
                      disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                      onChange={(val) => updateForm({ headerLine4: val })}
                      placeholder="Örn: .../05/2023 - Karar No: 2023/01"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div id="items" className={`bg-white p-5 rounded border border-slate-300 shadow-sm space-y-4 scroll-mt-20 transition-opacity ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Gündem Maddeleri</h3>
                    <div className="flex gap-2">
                      <button 
                        disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                        onClick={() => addItem('numbered')} 
                        className="flex items-center gap-1 text-xs font-bold uppercase bg-slate-100 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-200 border border-slate-300 disabled:opacity-50"
                      >
                        <ListOrdered className="w-3 h-3" /> Numaralı
                      </button>
                      <button 
                        disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                        onClick={() => addItem('bullet')} 
                        className="flex items-center gap-1 text-xs font-bold uppercase bg-slate-100 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-200 border border-slate-300 disabled:opacity-50"
                      >
                        <Minus className="w-3 h-3" /> Çizgili
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 mt-4">
                    <AnimatePresence>
                      {localForm.items.map((item, index) => {
                        const renderEditorItem = (itm: FormItem, idx: number, isSub: boolean = false, parentId: string | null = null, pIdx: number = 0) => {
                          return (
                            <motion.div 
                              key={itm.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={`relative group border border-slate-100 hover:border-blue-200 p-4 rounded bg-slate-50 transition-colors shadow-sm`}
                            >
                              <div className="flex gap-4">
                                <div className="flex flex-col items-center pt-2 gap-2">
                                  <span className="text-sm font-bold text-slate-400 min-w-[1.5rem] text-center">
                                    {isSub ? (itm.type === 'numbered' ? `${idx + 1}.` : '•') : (itm.type === 'numbered' ? `${idx + 1}.` : '•')}
                                  </span>
                                  {!isSub && (
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                                        onClick={() => addItemAt(idx)} 
                                        title="Üste Ekle" 
                                        className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                                      >
                                        <ChevronUp className="w-4 h-4" />
                                      </button>
                                      <button 
                                        disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                                        onClick={() => addItemAt(idx + 1)} 
                                        title="Alta Ekle" 
                                        className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 space-y-4">
                                  <div className="flex justify-between items-start gap-4">
                                    <RichTextEditor 
                                      value={itm.text} 
                                      disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                                      onChange={(val) => {
                                        if (isSub && parentId) {
                                          const parent = localForm.items.find(i => i.id === parentId);
                                          if (parent && parent.subItems) {
                                            const newSub = parent.subItems.map(s => s.id === itm.id ? { ...s, text: val } : s);
                                            updateItem(parentId, { subItems: newSub });
                                          }
                                        } else {
                                          updateItem(itm.id, { text: val });
                                        }
                                      }}
                                      placeholder="Maddenin metnini girin..."
                                    />
                                    <div className="flex gap-1">
                                      {!isSub && (
                                        <>
                                          <button 
                                            disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                                            onClick={() => {
                                              const newSub = itm.subItems ? [...itm.subItems, { id: uuidv4(), type: 'numbered', text: '' }] : [{ id: uuidv4(), type: 'numbered', text: '' }];
                                              updateItem(itm.id, { subItems: newSub as any });
                                            }}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Alt Madde Ekle"
                                          >
                                            <Plus className="w-4 h-4" />
                                          </button>
                                          <button 
                                            disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                                            onClick={() => itm.hasTable ? removeTableFromItem(itm.id) : addTableToItem(itm.id)}
                                            className={`p-2 rounded ${itm.hasTable ? 'text-amber-600 bg-amber-50' : 'text-slate-600 hover:bg-slate-100'}`}
                                            title="Tablo Ekle/Kaldır"
                                          >
                                            <TableIcon className="w-4 h-4" />
                                          </button>
                                        </>
                                      )}
                                      <button 
                                        disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                                        onClick={() => {
                                          if (isSub && parentId) {
                                            const parentItem = localForm.items.find(i => i.id === parentId);
                                            if (parentItem && parentItem.subItems) {
                                              updateItem(parentId, { subItems: parentItem.subItems.filter(s => s.id !== itm.id) });
                                            }
                                          } else {
                                            removeItem(itm.id);
                                          }
                                        }}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                                        title="Maddeyi Sil"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Table Editor */}
                                  {itm.hasTable && itm.table && !isSub && (
                                    <div className="bg-white p-4 rounded border border-slate-200 shadow-sm overflow-hidden">
                                      <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                          <TableIcon className="w-4 h-4" /> Tablo Düzenleyici
                                        </h4>
                                        <button disabled={isSaving} onClick={() => removeTableFromItem(itm.id)} className="text-xs font-bold text-red-600 uppercase hover:underline">Tabloyu Kaldır</button>
                                      </div>
                                      
                                      <div className="overflow-x-auto pb-4">
                                        <div className="flex flex-col gap-2 min-w-max">
                                          <div className="flex gap-2 items-center">
                                            <div className="w-8 shrink-0"></div>
                                            {itm.table.columns.map((col, cI) => (
                                              <div key={cI} className="relative group/col flex-1 min-w-[120px]">
                                                <input 
                                                  disabled={isSaving}
                                                  className="w-full pr-8 text-xs font-bold uppercase border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" 
                                                  value={col}
                                                  placeholder={`Sütun ${cI + 1}`}
                                                  onChange={(e) => {
                                                    const newCols = [...itm.table!.columns];
                                                    newCols[cI] = e.target.value;
                                                    updateItem(itm.id, { table: { ...itm.table!, columns: newCols } });
                                                  }}
                                                />
                                                {itm.table!.columns.length > 1 && (
                                                  <button 
                                                    disabled={isSaving}
                                                    onClick={() => {
                                                      const newCols = itm.table!.columns.filter((_, i) => i !== cI);
                                                      const newRows = itm.table!.rows.map(r => r.filter((_, i) => i !== cI));
                                                      updateItem(itm.id, { table: { ...itm.table!, columns: newCols, rows: newRows } });
                                                    }}
                                                    className="absolute right-1 top-[5px] p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover/col:opacity-100 transition-opacity"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </button>
                                                )}
                                              </div>
                                            ))}
                                            <button 
                                              disabled={isSaving}
                                              onClick={() => {
                                                const newCols = [...itm.table!.columns, `Yeni Sütun`];
                                                const newRows = itm.table!.rows.map(r => [...r, '']);
                                                updateItem(itm.id, { table: { columns: newCols, rows: newRows } });
                                              }}
                                              className="shrink-0 p-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-600 w-[100px]"
                                            >
                                              + SÜTUN Ekle
                                            </button>
                                          </div>
                                          
                                          {itm.table.rows.map((row, rI) => (
                                            <div key={rI} className="flex gap-2 items-center group/row">
                                              <div className="w-8 shrink-0 text-center text-xs font-bold text-slate-400">{rI + 1}</div>
                                              {row.map((cell, cI) => {
                                                const colName = itm.table!.columns[cI].toLowerCase();
                                                const isSira = colName === 'sıra' || colName === 'sıra no' || colName === 'sira' || colName === 'sira no';
                                                return (
                                                  <input 
                                                    key={cI}
                                                    readOnly={isSira || isSaving}
                                                    className={`flex-1 min-w-[120px] text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none ${isSira ? 'bg-slate-100 text-center text-slate-500 font-bold' : ''}`}
                                                    value={isSira ? (rI + 1).toString() : cell}
                                                    onChange={(e) => {
                                                      if (isSira) return;
                                                      const newRows = [...itm.table!.rows];
                                                      newRows[rI][cI] = e.target.value;
                                                      updateItem(itm.id, { table: { ...itm.table!, rows: newRows } });
                                                    }}
                                                  />
                                                );
                                              })}
                                              <button 
                                                disabled={isSaving}
                                                onClick={() => {
                                                  const newRows = itm.table!.rows.filter((_, i) => i !== rI);
                                                  updateItem(itm.id, { table: { ...itm.table!, rows: newRows } });
                                                }}
                                                className="shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded w-[100px] text-xs font-bold text-center opacity-0 group-hover/row:opacity-100 transition-opacity"
                                              >
                                                Satırı Sil
                                              </button>
                                            </div>
                                          ))}
                                          
                                          <div className="flex gap-2 items-center mt-2">
                                            <div className="w-8 shrink-0"></div>
                                            <button 
                                              disabled={isSaving}
                                              onClick={() => {
                                                const newRow = Array(itm.table!.columns.length).fill('');
                                                const newRows = [...itm.table!.rows, newRow];
                                                updateItem(itm.id, { table: { ...itm.table!, rows: newRows } });
                                              }}
                                              className="text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded p-2 px-4 shadow-sm"
                                            >
                                              + SATIR Ekle
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {itm.subItems && itm.subItems.length > 0 && !isSub && (
                                    <div className="ml-8 mt-4 space-y-4 border-l-2 border-slate-200 pl-4">
                                      {itm.subItems.map((sItem, sIdx) => renderEditorItem(sItem as any, sIdx, true, itm.id, idx))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        };
                        return renderEditorItem(item, index);
                      })}
                    </AnimatePresence>

                    {localForm.items.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                        Maddeler ekleyerek başlayın.
                      </div>
                    )}

                    <div className="mt-8 flex justify-center pt-4 border-t border-slate-100">
                      <button 
                        disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                        onClick={() => addItem('numbered')}
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm group active:scale-95 border border-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        <span>SONA YENİ MADDE EKLE</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div id="footer" className={`bg-white p-5 rounded border border-slate-300 shadow-sm space-y-4 scroll-mt-20 transition-opacity ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-2">Karar Notu (Alt Açıklama)</h3>
                  <RichTextEditor 
                    value={localForm.footerText}
                    disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                    onChange={(val) => updateForm({ footerText: val })}
                    placeholder="Karar metnini buraya girin..."
                  />
                </div>

                {/* Signatures Section */}
                <div id="signatures" className={`bg-white p-5 rounded border border-slate-300 shadow-sm space-y-4 scroll-mt-20 transition-opacity ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">İmza Alanı Seçimi</h3>
                    <div className="flex gap-2">
                      <button 
                        disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                        onClick={() => updateForm({ signatureMembers: allMembers.map(m => m.id) })}
                        className="text-[10px] font-bold text-blue-600 uppercase hover:bg-blue-50 px-2 py-1 rounded disabled:opacity-50"
                      >
                        Tümünü Seç
                      </button>
                      <button 
                        disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                        onClick={() => updateForm({ signatureMembers: [] })}
                        className="text-[10px] font-bold text-red-600 uppercase hover:bg-red-50 px-2 py-1 rounded disabled:opacity-50"
                      >
                        Tümünü Kaldır
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Formda görünecek imzacıları seçin. Sıralama Ayarlar &gt; Üyeler kısmından yönetilir.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {allMembers.map(member => (
                      <label key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all shadow-sm bg-white active:scale-95">
                        <input 
                          type="checkbox" 
                          className="rounded text-blue-700 focus:ring-blue-500 w-4 h-4"
                          checked={localForm.signatureMembers.includes(member.id)}
                          disabled={isSaving || (localForm.isLocked && !localForm.isPostponed)}
                          onChange={(e) => {
                            const newSignatures = e.target.checked 
                              ? [...localForm.signatureMembers, member.id]
                              : localForm.signatureMembers.filter(id => id !== member.id);
                            updateForm({ signatureMembers: newSignatures });
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs text-center uppercase leading-tight">{member.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-tighter mt-0.5">{member.title}</span>
                          {member.isProxy && <span className="text-[9px] font-bold text-orange-600 text-center uppercase mt-0.5">(Vekil: {member.proxyName})</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="w-full flex-1 overflow-auto preview-container">
                <div ref={printRef} className="a4-page">
                  <PrintPreview localForm={localForm} members={allMembers} settings={settings} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Navigation Floating Buttons */}
      {activeTab === 'editor' && (
        <div className="fixed bottom-10 right-10 flex flex-col gap-3 z-50 print:hidden transition-opacity">
          <button 
            disabled={isSaving}
            onClick={() => {
              const container = document.getElementById('main-scroll-container');
              container?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all active:scale-95 disabled:opacity-50"
            title="En Üste Git"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
          <button 
            disabled={isSaving}
            onClick={() => {
              const container = document.getElementById('main-scroll-container');
              container?.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            }}
            className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all active:scale-95 disabled:opacity-50"
            title="En Alta Git"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
        </div>
      )}
    </AppLayout>
  );
}
