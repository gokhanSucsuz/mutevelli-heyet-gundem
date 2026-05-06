'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, OfficialForm, FormItem, Member } from '@/lib/db';
import { AppLayout } from '@/components/Layout';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useReactToPrint } from 'react-to-print';
import { 
  Save, Printer, ArrowLeft, Plus, Trash2, 
  Table as TableIcon, CheckSquare, ListOrdered, Minus, Lock, Unlock,
  CheckCircle, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { RichTextEditor } from '@/components/RichTextEditor';

function PrintPreview({ form, members, settings }: { form: OfficialForm, members: Member[], settings: any }) {
  const activeLayout = settings?.layout || form.layout;
  const selectedMembers = members.filter(m => form.signatureMembers.includes(m.id));
  
  const tablePaddings = {
    tight: 'p-0.5 px-1',
    normal: 'p-1.5',
    relaxed: 'p-3'
  };
  const spacing = activeLayout?.lineSpacing || 'normal';
  const itemSpaceY = spacing === 'tight' ? 'space-y-2' : spacing === 'relaxed' ? 'space-y-6' : 'space-y-4';

  const paddingKey = (activeLayout?.tablePadding || 'normal') as keyof typeof tablePaddings;
const tablePad = tablePaddings[paddingKey];

  const marginX = activeLayout?.marginX ?? 15;
  const marginY = activeLayout?.marginY ?? 15;
  const signatureSpacing = activeLayout?.signatureSpacing ?? 40; 

  // Use snapshots if available, otherwise current members
  const finalSigners = form.signatureSnapshots && form.signatureSnapshots.length > 0
    ? form.signatureSnapshots
    : selectedMembers;

  const topSignerKeywords = ['vali', 'vali yardımcısı', 'kaymakam'];
  const topSigners = finalSigners.filter(m => topSignerKeywords.some(keyword => m.title.toLowerCase().includes(keyword)));
  const otherSigners = finalSigners.filter(m => !topSignerKeywords.some(keyword => m.title.toLowerCase().includes(keyword)));

  const formatMemberName = (m: Member | MemberSnapshot) => {
    if (m.isProxy && m.proxyName) {
      return `${m.proxyName} (${m.name} Vekili)`;
    }
    return m.name;
  };

  const formatMemberTitle = (m: Member | MemberSnapshot) => {
    if (m.isProxy && m.proxyTitle) {
      return m.proxyTitle;
    }
    return m.title;
  };

  const renderItem = (item: FormItem, index: number, isSubItem: boolean = false, parentIndexStr: string = '') => {
    const numbering = isSubItem 
      ? (item.type === 'numbered' ? `${parentIndexStr}.${index + 1}` : '-')
      : (item.type === 'numbered' ? `${index + 1}.` : '-');

    return (
      <div key={item.id} className="flex flex-col gap-2">
        <div className="flex text-justify items-start">
          <span className="font-bold mr-2 whitespace-nowrap min-w-[20px] leading-tight">{numbering}</span>
          <div className="flex-1 w-full overflow-hidden leading-tight">
            <div 
              className="rich-text-preview dotted-leader" 
              dangerouslySetInnerHTML={{ __html: item.text || '' }} 
            />
          </div>
        </div>
        
        {/* Optional Table */}
        {item.hasTable && item.table && (
          <div className="mt-2 w-full pt-2">
            <table className="w-full border-collapse table-fixed break-words" style={{ fontSize: form.layout?.fontSizeTable ? `${form.layout?.fontSizeTable}px` : '13px' }}>
              <thead>
                <tr>
                  {item.table.columns.map((col, i) => (
                    <th key={i} className={`border border-black bg-gray-50 text-center font-bold ${tablePad}`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.table.rows.map((row, rI) => (
                  <tr key={rI}>
                    {row.map((cell, cI) => {
                      const colName = item.table!.columns[cI].toLowerCase();
                      const isSira = colName === 'sıra' || colName === 'sıra no' || colName === 'sira' || colName === 'sira no';
                      return (
                        <td key={cI} className={`border border-black text-center leading-tight ${tablePad}`}>
                          {isSira ? (rI + 1) : (cell || ' ')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sub Items */}
        {item.subItems && item.subItems.length > 0 && (
          <div 
            className="ml-7 flex flex-col" 
            style={{ 
              gap: form.layout?.subItemSpacing !== undefined ? `${form.layout?.subItemSpacing}px` : '8px', 
              marginTop: form.layout?.subItemSpacing !== undefined ? `${form.layout?.subItemSpacing}px` : '8px' 
            }}
          >
            {item.subItems.map((subItem, sIdx) => renderItem(subItem, sIdx, true, `${index + 1}`))}
          </div>
        )}
      </div>
    );
  };




  return (
    <div 
      className={`w-full max-w-[210mm] mx-auto bg-white min-h-[297mm] mb-8 text-black relative flex flex-col items-stretch ${spacing === 'tight' ? 'leading-tight' : spacing === 'relaxed' ? 'leading-loose' : 'leading-snug'}`}
      style={{
        paddingTop: `${marginY}mm`,
        paddingBottom: `${marginY}mm`,
        paddingLeft: `${marginX}mm`,
        paddingRight: `${marginX}mm`,
        boxShadow: 'none', 
        fontFamily: activeLayout?.fontFamily || 'Times New Roman, serif',
      }}
    >
      
      {/* Watermark - Using fixed position for multi-page print support */}
      {activeLayout?.watermarkText && (
        <div 
          className="watermark-overlay fixed inset-0 pointer-events-none flex justify-center items-center overflow-hidden"
          style={{ zIndex: 0, position: 'fixed' }}
        >
          <div 
            className="font-bold whitespace-nowrap text-center opacity-10"
            style={{ 
               transform: `rotate(${activeLayout?.watermarkAngle ?? -45}deg)`,
               fontSize: activeLayout?.watermarkSize ? `${activeLayout?.watermarkSize}px` : '120px',
               color: 'black',
               opacity: (activeLayout?.watermarkOpacity ?? 10) / 100,
               lineHeight: 1,
               width: '200%', 
               maxWidth: 'none'
            }}
          >
            {activeLayout.watermarkText}
          </div>
        </div>
      )}

      {/* Content wrapper to stay above watermark */}
      <div className="relative z-10 flex flex-col flex-1 h-full">
        {/* Header Flex Layout to avoid overlap */}
        <div className="flex justify-between items-start mb-8 text-center font-bold">
          {settings?.leftLogoBase64 ? (
            <img src={settings.leftLogoBase64} alt="Left Logo" className="h-[25mm] w-[25mm] object-contain shrink-0" style={{ opacity: (activeLayout?.logoOpacity ?? 100) / 100 }} />
          ) : <div className="h-[25mm] w-[25mm] shrink-0" />}
          
          <div className="flex-1 px-4 mt-2" style={{ 
            fontSize: activeLayout?.fontSizeTitle ? `${activeLayout?.fontSizeTitle}px` : 'inherit',
            lineHeight: activeLayout?.headerLineSpacing || 'normal'
          }}>
            {form.headerTop.includes('<') ? (
               <div className="rich-text-preview header-rich-text" dangerouslySetInnerHTML={{ __html: form.headerTop }} />
            ) : (
               <div className="whitespace-pre-wrap">{form.headerTop}</div>
            )}
          </div>
          
          {settings?.rightLogoBase64 ? (
            <img src={settings.rightLogoBase64} alt="Right Logo" className="h-[25mm] w-[25mm] object-contain shrink-0" style={{ opacity: (activeLayout?.logoOpacity ?? 100) / 100 }} />
          ) : <div className="h-[25mm] w-[25mm] shrink-0" />}
        </div>

        <div className="flex justify-between items-start font-bold mb-8 text-[14px] border-b border-black pb-4">
          <div className="flex flex-col gap-1" style={{ fontSize: form.layout?.fontSizeHeaderInfo ? `${form.layout?.fontSizeHeaderInfo}px` : 'inherit' }}>
            <div className="flex gap-2">
              <span className="min-w-[100px]">KARAR TARİHİ</span>
              <span>: {form.decisionDate ? new Date(form.decisionDate).toLocaleDateString('tr-TR') : '.../.../20...'}</span>
            </div>
            <div className="flex gap-2">
              <span className="min-w-[100px]">KARAR SAATİ</span>
              <span>: {form.decisionTime || '...:...'}</span>
            </div>
            {form.isPostponed && (
              <div className="text-red-600 text-[10px] uppercase tracking-widest mt-1">
                ** TOPLANTI ERTELENMİŞTİR **
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-right" style={{ fontSize: form.layout?.fontSizeHeaderInfo ? `${form.layout?.fontSizeHeaderInfo}px` : 'inherit' }}>
            {form.headerLine4.includes('<') ? (
              <div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: form.headerLine4 }} />
            ) : (
              <div>{form.headerLine4}</div>
            )}
            <div className="text-[11px] font-normal italic text-slate-500">Kayıt ID: {form.id.split('-')[0].toUpperCase()}</div>
          </div>
        </div>

        {/* Items */}
        <div className={`${itemSpaceY} flex-1`} style={{ fontSize: form.layout?.fontSizeContent ? `${form.layout?.fontSizeContent}px` : '15px' }}>
          {form.items.map((item, index) => renderItem(item, index))}
        </div>

        {/* Decision Note and Signatures - Kept together on same page */}
        <div className="break-inside-avoid mt-8">
          {/* Footer Text */}
          <div className="font-bold text-center text-[14px]" style={{ fontSize: form.layout?.fontSizeContent ? `${form.layout?.fontSizeContent}px` : '14px' }}>
            {form.footerText.includes('<') ? (
              <div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: form.footerText }} />
            ) : (
              <div>{form.footerText}</div>
            )}
          </div>

          {/* Signatures */}
          <div className="mt-12 w-full" style={{ 
              opacity: (form.layout?.signatureOpacity ?? 100) / 100,
              fontFamily: form.layout?.signatureFontFamily || 'inherit'
          }}>
            {topSigners.length > 0 && (
              <div className="flex flex-wrap justify-center gap-12 w-full mb-12 text-center">
                {topSigners.map(m => (
                  <div key={m.id} className="flex flex-col items-center w-[30%] min-w-[150px]">
                    <div className="font-bold whitespace-pre-wrap" style={{ 
                      fontSize: form.layout?.signatureFontSize ? `${form.layout?.signatureFontSize}px` : (form.layout?.fontSizeContent ? `${form.layout?.fontSizeContent}px` : '14px'),
                      lineHeight: 1.1
                    }}>{formatMemberTitle(m)}</div>
                    <div style={{ height: `${signatureSpacing}px` }}></div> {/* Signature Space */}
                    <div className="font-bold" style={{ 
                      fontSize: form.layout?.signatureFontSize ? `${form.layout?.signatureFontSize}px` : (form.layout?.fontSizeContent ? `${form.layout?.fontSizeContent}px` : '14px'),
                      lineHeight: 1.1
                    }}>{formatMemberName(m)}</div>
                  </div>
                ))}
              </div>
            )}

            {otherSigners.length > 0 && (
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-8 text-center w-full">
                {otherSigners.map((m) => (
                  <div key={m.id} className="flex flex-col items-center w-[22%] min-w-[120px]">
                    <div className="font-bold whitespace-pre-wrap" style={{ 
                      fontSize: form.layout?.signatureFontSize ? `${form.layout?.signatureFontSize}px` : (form.layout?.fontSizeContent ? `${form.layout?.fontSizeContent}px` : '14px'),
                      lineHeight: 1.1
                    }}>{formatMemberTitle(m)}</div>
                    <div style={{ height: `${signatureSpacing}px` }}></div> {/* Signature Space */}
                    <div className="font-bold" style={{ 
                      fontSize: form.layout?.signatureFontSize ? `${form.layout?.signatureFontSize}px` : (form.layout?.fontSizeContent ? `${form.layout?.fontSizeContent}px` : '14px'),
                      lineHeight: 1.1
                    }}>{formatMemberName(m)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page Numbers container */}
      {form.layout?.showPageNumbers && (
        <div className="page-footer hidden print:block fixed bottom-[10mm] w-full text-center text-xs font-bold font-sans">
          Sayfa <span className="page-number"></span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .dotted-leader p { 
           display: flex; 
           align-items: center; 
           width: 100%;
           margin-bottom: 0px !important;
        }
        .dotted-leader p::after {
          content: "";
          flex: 1;
          margin-left: 0.5em; /* Metinden bir boşluk sonra */
          border-bottom: 1.5pt dotted black;
          height: 0.6em; /* Metin ile dikey ortalı olması için */
        }
        .rich-text-preview p { margin-bottom: 0.5rem; }
        .rich-text-preview p:last-child { margin-bottom: 0; }
        
        .header-rich-text p { margin-bottom: 0px; text-align: center; }

        @page { size: A4; margin: ${marginY}mm ${marginX}mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; background: transparent; }
          .page-number::after { content: counter(page); }
          .shadow-2xl { box-shadow: none !important; }
          .break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
        }
        
        /* A4 Page View Simulation */
        .a4-page {
          width: 210mm;
          min-height: 297mm;
          padding: 0;
          margin: 0 auto;
          background: white;
          box-shadow: none;
          position: relative;
          display: flex;
          flex-direction: column;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
        }

        .a4-page::after {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: linear-gradient(to bottom, transparent 296.5mm, #e2e8f0 296.5mm, #e2e8f0 297mm, transparent 297mm);
          background-size: 100% 297mm;
          z-index: 5;
          pointer-events: none;
        }

        .preview-container {
          background-color: #f1f5f9;
          padding: 40px 0;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        @media print {
          .a4-page {
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
          }
          .preview-container {
            padding: 0 !important;
            background: transparent !important;
          }
          .watermark-overlay {
            position: fixed !important;
            display: flex !important;
            height: 100% !important;
            width: 100% !important;
            top: 0;
            left: 0;
          }
        }
      `}} />
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
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: form?.title || 'Karar Formu',
  });

  if (!form || !allMembers) return <div className="p-8 text-center">Yükleniyor...</div>;

  const updateForm = async (updates: Partial<OfficialForm>) => {
    // eslint-disable-next-line react-hooks/purity
    await db.forms.update(id, { ...updates, updatedAt: Date.now() });
  };

  const addItem = async (type: 'numbered' | 'bullet' = 'numbered') => {
    const newItem: FormItem = {
      id: uuidv4(),
      type,
      text: '',
    };
    await updateForm({ items: [...form.items, newItem] });
  };

  const addItemAt = async (index: number, type: 'numbered' | 'bullet' = 'numbered') => {
    const newItem: FormItem = {
      id: uuidv4(),
      type,
      text: '',
    };
    const newItems = [...form.items];
    newItems.splice(index, 0, newItem);
    await updateForm({ items: newItems });
  };

  const updateItem = async (itemId: string, updates: Partial<FormItem>) => {
    const newItems = form.items.map(item => item.id === itemId ? { ...item, ...updates } : item);
    await updateForm({ items: newItems });
  };

  const removeItem = async (itemId: string) => {
    const newItems = form.items.filter(item => item.id !== itemId);
    await updateForm({ items: newItems });
  };

  const addTableToItem = async (itemId: string) => {
    updateItem(itemId, { 
      hasTable: true, 
      table: { columns: ['SIRA NO', 'ADI SOYADI', 'T.C', 'TALEBİ', 'KARAR'], rows: [['1', '', '', '', '']] } 
    });
  };

  const removeTableFromItem = async (itemId: string) => {
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
            <input 
              type="text" 
              value={form.title} 
              disabled={form.isLocked && !form.isPostponed}
              onChange={(e) => updateForm({ title: e.target.value })}
              className={`text-lg font-bold bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded p-1 text-slate-800 placeholder-slate-400 uppercase outline-none w-full max-w-sm ${form.isLocked && !form.isPostponed ? 'cursor-not-allowed opacity-70' : ''}`}
              placeholder="Form Başlığı (Örn: Nisan 2023 Toplantısı)"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded flex border border-slate-200">
              <button 
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-1.5 rounded text-sm transition-colors font-medium ${activeTab === 'editor' ? 'bg-white shadow-sm text-blue-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Düzenleyici
              </button>
              <button 
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-1.5 rounded text-sm transition-colors font-medium ${activeTab === 'preview' ? 'bg-white shadow-sm text-blue-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Önizleme
              </button>
            </div>
            {activeTab === 'preview' && (
              <div className="flex gap-2">
                {!form.isLocked && (
                  <button 
                    onClick={async () => {
                      if (confirm('Kararı kesinleştirmek istiyor musunuz? Bu işlemden sonra sadece toplantı ertelenirse değişiklik yapılabilir.')) {
                        // Create snapshots
                        const snapshots = allMembers
                          .filter(m => form.signatureMembers.includes(m.id))
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
                      }
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all text-[11px] uppercase tracking-wider active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" />
                    KARARI KESİNLEŞTİR
                  </button>
                )}
                <button 
                  onClick={() => handlePrint()}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all text-[11px] uppercase tracking-wider active:scale-95"
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
            <div className="w-52 shrink-0 hidden lg:block sticky top-0 h-[calc(100vh-10rem)]">
              <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-300/50 shadow-xl space-y-4 sticky top-4 transition-all duration-300">
                <div className="flex items-center gap-2 px-1 mb-2">
                  <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Hızlı Erişim</h3>
                </div>
                <nav className="flex flex-col gap-1.5">
                  {[
                    { id: 'header', label: 'Başlık Bilgileri' },
                    { id: 'items', label: 'Gündem Maddeleri' },
                    { id: 'footer', label: 'Karar Notu' },
                    { id: 'signatures', label: 'İmzacılar' },
                  ].map(section => (
                    <button 
                      key={section.id}
                      onClick={() => {
                        const el = document.getElementById(section.id);
                        if (el) {
                           const container = el.closest('.overflow-y-auto');
                           if (container) {
                             container.scrollTo({
                               top: el.offsetTop - 20,
                               behavior: 'smooth'
                             });
                           } else {
                             el.scrollIntoView({ behavior: 'smooth' });
                           }
                        }
                      }}
                      className="group flex items-center justify-between px-3 py-2.5 text-[11px] font-bold text-slate-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 uppercase tracking-tight active:scale-95 shadow-sm hover:shadow-blue-200"
                    >
                      <span>{section.label}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  ))}
                </nav>
                {form.isLocked && !form.isPostponed && (
                  <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-red-600">
                      <Lock className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase">Kilitli</span>
                    </div>
                    <p className="text-[9px] text-red-700 leading-tight font-medium">Bu belge kesinleştirilmiştir. Değişiklik yapılamaz.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pb-20">
            {activeTab === 'editor' ? (
              <div className="max-w-4xl mx-auto space-y-8 px-4">
                {/* Metadata Section */}
                <div id="header" className="bg-white p-5 rounded border border-slate-300 shadow-sm space-y-4 scroll-mt-20">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Resmi Kayıt Bilgileri</h3>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      <input 
                        type="checkbox" 
                        id="isPostponed"
                        className="rounded text-blue-700 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        checked={form.isPostponed || false}
                        onChange={(e) => updateForm({ isPostponed: e.target.checked })}
                      />
                      <label htmlFor="isPostponed" className="text-[11px] font-bold text-blue-700 cursor-pointer select-none uppercase">
                        Toplantı Ertelendi
                      </label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-slate-500 uppercase block">Karar Tarihi</label>
                        {!form.isPostponed && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <input 
                        type="date"
                        disabled={!form.isPostponed}
                        className={`w-full text-sm border border-slate-300 rounded p-2 outline-none transition-all ${!form.isPostponed ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 border-blue-200'}`}
                        value={form.decisionDate || ''}
                        onChange={(e) => updateForm({ decisionDate: e.target.value })}
                      />
                      {!form.isPostponed && <p className="text-[10px] text-slate-400 mt-1 italic">* Değiştirmek için 'Ertelendi' seçiniz.</p>}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-slate-500 uppercase block">Karar Saati</label>
                        {!form.isPostponed && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <input 
                        type="time"
                        disabled={!form.isPostponed}
                        className={`w-full text-sm border border-slate-300 rounded p-2 outline-none transition-all ${!form.isPostponed ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 border-blue-200'}`}
                        value={form.decisionTime || ''}
                        onChange={(e) => updateForm({ decisionTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Karar No</label>
                      <input 
                        className={`w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none ${form.isLocked && !form.isPostponed ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`} 
                        value={form.decisionNo || ''}
                        disabled={form.isLocked && !form.isPostponed}
                        onChange={(e) => updateForm({ decisionNo: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-bold text-slate-500 uppercase block">Kurum Başlığı (T.C. ...)</label>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Satır Aralığı:</label>
                        <select 
                          className="text-[10px] border border-slate-300 rounded px-1.5 py-0.5"
                          value={form.layout?.headerLineSpacing || 'normal'}
                          onChange={(e) => updateForm({ layout: { ...form.layout!, headerLineSpacing: e.target.value } })}
                        >
                          <option value="0.8">Çok Dar</option>
                          <option value="1">Dar</option>
                          <option value="normal">Normal</option>
                          <option value="1.5">Geniş</option>
                        </select>
                      </div>
                    </div>
                    <RichTextEditor 
                      value={form.headerTop}
                      disabled={form.isLocked && !form.isPostponed}
                      onChange={(val) => updateForm({ headerTop: val })}
                      placeholder="Başlık metnini girin..."
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tarih / Karar No Görünümü (Belge Üzerindeki)</label>
                      <input 
                        className={`w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none ${form.isLocked && !form.isPostponed ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`} 
                        value={form.headerLine4}
                        disabled={form.isLocked && !form.isPostponed}
                        onChange={(e) => updateForm({ headerLine4: e.target.value })}
                        placeholder="Örn: .../05/2023 - Karar No: 2023/01"
                      />
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div id="items" className="bg-white p-5 rounded border border-slate-300 shadow-sm space-y-4 scroll-mt-20">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Gündem Maddeleri</h3>


                    <div className="flex gap-2">
                      <button 
                        disabled={form.isLocked && !form.isPostponed}
                        onClick={() => addItem('numbered')} 
                        className="flex items-center gap-1 text-xs font-bold uppercase bg-slate-100 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-200 border border-slate-300 disabled:opacity-50"
                      >
                        <ListOrdered className="w-4 h-4" /> Numaralı
                      </button>
                      <button 
                        disabled={form.isLocked && !form.isPostponed}
                        onClick={() => addItem('bullet')} 
                        className="flex items-center gap-1 text-xs font-bold uppercase bg-slate-100 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-200 border border-slate-300 disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" /> Çizgili
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 mt-4">
                    <AnimatePresence>
                      {form.items.map((item, index) => {
                        const renderEditorItem = (itm: FormItem, idx: number, isSub: boolean = false, parentId: string | null = null, pIdx: number = 0) => {
                          const itemIndex = isSub ? -1 : idx;
                          return (
                            <React.Fragment key={itm.id}>
                              {!isSub && (
                                <div className="relative h-4 group/add">
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/add:opacity-100 transition-opacity">
                                    <div className="h-px bg-blue-200 w-full"></div>
                                    <button 
                                      onClick={() => addItemAt(idx)}
                                      className="absolute bg-blue-600 text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center gap-1 px-2"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span className="text-[10px] font-bold uppercase">Araya Ekle</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                              <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="relative group border border-slate-100 hover:border-blue-200 p-4 rounded bg-slate-50 transition-colors shadow-sm"
                              >
                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity z-10">
                            {!isSub && (
                              <button 
                                onClick={() => {
                                  let newSubItems = [...(itm.subItems || [])];
                                  newSubItems.push({ id: Date.now().toString(), type: 'bullet', text: '' });
                                  updateItem(itm.id, { subItems: newSubItems });
                                }} 
                                className="bg-white border border-slate-200 text-green-600 hover:bg-green-50 p-1.5 rounded shadow-sm flex items-center gap-1 text-xs font-bold" 
                                title="Alt Madde Ekle"
                              >
                                <Plus className="w-3 h-3" /> Alt Madde
                              </button>
                            )}
                            {!itm.hasTable && (
                              <button 
                                onClick={() => {
                                  if (isSub && parentId) {
                                    // Normally handled but kept simple for subitems: no tables in subitems for now
                                  } else {
                                    addTableToItem(itm.id)
                                  }
                                }} 
                                className="bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 p-1.5 rounded shadow-sm" 
                                title="Tablo Ekle"
                              >
                                <TableIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                if (isSub && parentId) {
                                  const parent = form.items.find(i => i.id === parentId);
                                  if (parent) {
                                    const newSub = parent.subItems?.filter(s => s.id !== itm.id);
                                    updateItem(parentId, { subItems: newSub });
                                  }
                                } else {
                                  removeItem(itm.id)
                                }
                              }} 
                              className="bg-white border border-slate-200 text-red-600 hover:bg-red-50 p-1.5 rounded shadow-sm" 
                              title="Maddeyi Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex gap-3">
                            <div className="pt-2 font-bold text-slate-500 w-8 text-right shrink-0">
                              {itm.type === 'numbered' ? (isSub ? `${pIdx+1}.${idx+1}.` : `${idx+1}.`) : '-'}
                            </div>
                            <div className="flex-1 space-y-4 min-w-0">
                              <RichTextEditor 
                                value={itm.text}
                                disabled={form.isLocked && !form.isPostponed}
                                onChange={(val) => {
                                  if (isSub && parentId) {
                                    const parentItem = form.items.find(i => i.id === parentId);
                                    if (parentItem && parentItem.subItems) {
                                      const newSub = parentItem.subItems.map(s => s.id === itm.id ? { ...s, text: val } : s);
                                      updateItem(parentId, { subItems: newSub });
                                    }
                                  } else {
                                    updateItem(itm.id, { text: val });
                                  }
                                }}
                                placeholder="Maddenin metnini girin..."
                              />
                              
                              {/* Table Editor */}
                              {itm.hasTable && itm.table && !isSub && (
                                <div className="bg-white p-4 rounded border border-slate-200 shadow-sm overflow-hidden">
                                  <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                      <TableIcon className="w-4 h-4" /> Tablo Düzenleyici
                                    </h4>
                                    <button onClick={() => removeTableFromItem(itm.id)} className="text-xs font-bold text-red-600 uppercase hover:underline">Tabloyu Kaldır</button>
                                  </div>
                                  
                                  <div className="overflow-x-auto pb-4">
                                    <div className="flex flex-col gap-2 min-w-max">
                                      {/* Columns Header */}
                                      <div className="flex gap-2 items-center">
                                        <div className="w-8 shrink-0"></div>
                                        {itm.table.columns.map((col, cI) => (
                                          <div key={cI} className="relative group/col flex-1 min-w-[120px]">
                                            <input 
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
                                                onClick={() => {
                                                  const newCols = itm.table!.columns.filter((_, i) => i !== cI);
                                                  const newRows = itm.table!.rows.map(r => r.filter((_, i) => i !== cI));
                                                  updateItem(itm.id, { table: { ...itm.table!, columns: newCols, rows: newRows } });
                                                }}
                                                className="absolute right-1 top-[5px] p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover/col:opacity-100 transition-opacity"
                                                title="Sütunu Sil"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                        <button 
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
                                      
                                      {/* Rows */}
                                      {itm.table.rows.map((row, rI) => (
                                        <div key={rI} className="flex gap-2 items-center group/row">
                                          <div className="w-8 shrink-0 text-center text-xs font-bold text-slate-400">{rI + 1}</div>
                                          {row.map((cell, cI) => {
                                            const colName = itm.table!.columns[cI].toLowerCase();
                                            const isSira = colName === 'sıra' || colName === 'sıra no' || colName === 'sira' || colName === 'sira no';
                                            return (
                                              <input 
                                                key={cI}
                                                readOnly={isSira}
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
                            </div>
                          </div>
                          
                          {/* Render SubItems */}
                          {itm.subItems && itm.subItems.length > 0 && !isSub && (
                            <div className="ml-8 mt-4 space-y-4 border-l-2 border-slate-200 pl-4">
                              {itm.subItems.map((sItem, sIdx) => renderEditorItem(sItem, sIdx, true, itm.id, idx))}
                            </div>
                          )}
                        </motion.div>
                        </React.Fragment>
                      );
                    };

                      return renderEditorItem(item, index);
                    })}
                    </AnimatePresence>
                    {form.items.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                        Maddeler ekleyerek başlayın.
                      </div>
                    )}

                    <div className="mt-8 flex justify-center pt-4 border-t border-slate-100">
                      <button 
                        disabled={form.isLocked && !form.isPostponed}
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
                <div id="footer" className="bg-white p-5 rounded border border-slate-300 shadow-sm space-y-4 scroll-mt-20">
                  <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-2">Karar Notu (Alt Açıklama)</h3>
                  <RichTextEditor 
                    value={form.footerText}
                    disabled={form.isLocked && !form.isPostponed}
                    onChange={(val) => updateForm({ footerText: val })}
                    placeholder="Yukarıda maddeler halinde belirtilen..."
                  />
                </div>

                {/* Signatures Selection */}
                <div id="signatures" className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4 scroll-mt-20">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">İmzacı Seçimi</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateForm({ signatureMembers: allMembers.map(m => m.id) })}
                        className="text-[10px] font-bold text-blue-600 uppercase hover:bg-blue-50 px-2 py-1 rounded"
                      >
                        Tümünü Seç
                      </button>
                      <button 
                        onClick={() => updateForm({ signatureMembers: [] })}
                        className="text-[10px] font-bold text-red-600 uppercase hover:bg-red-50 px-2 py-1 rounded"
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
                          checked={form.signatureMembers.includes(member.id)}
                          disabled={form.isLocked && !form.isPostponed}
                          onChange={(e) => {
                            const newSignatures = e.target.checked 
                              ? [...form.signatureMembers, member.id]
                              : form.signatureMembers.filter(id => id !== member.id);
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
                 <PrintPreview form={form} members={allMembers} settings={settings} />
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  </AppLayout>
);
}
