'use client';

import React, { useState } from 'react';
import { db, useLiveQuery, Member } from '@/lib/db';
import { AppLayout } from '@/components/Layout';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, GripVertical, UserCheck, UserPlus } from 'lucide-react';
import { DebouncedInput } from '@/components/DebouncedInput';

export default function MembersPage() {
  const members = useLiveQuery(() => db.members.orderBy('order').toArray());
  
  const addMember = async () => {
    const order = members ? members.length : 0;
    const newMember: Member = {
      id: uuidv4(),
      name: 'Yeni Kişi',
      title: 'Ünvan',
      order,
      isProxy: false
    };
    await db.members.add(newMember);
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    await db.members.update(id, updates);
  };

  const deleteMember = async (id: string) => {
    if (confirm('Silmek istediğinize emin misiniz?')) {
      await db.members.delete(id);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Mütevelli Heyet Üyeleri</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Toplantı gündemlerini imzalayacak heyet üyeleri ve vekil bilgileri.</p>
          </div>
          <button
            onClick={addMember}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 uppercase tracking-wider"
          >
            <Plus className="w-5 h-5" />
            YENİ ÜYE EKLE
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-300 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 bg-slate-50/50 text-slate-500 uppercase font-bold text-[10px] tracking-widest">
            <div className="col-span-1"></div>
            <div className="col-span-3">Üye Adı Soyadı / Ünvanı</div>
            <div className="col-span-1 flex justify-center">Vekil?</div>
            <div className="col-span-5">Vekil Bilgileri (Varsa)</div>
            <div className="col-span-2 text-right">İşlemler</div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {!members ? (
              <div className="p-12 text-center text-slate-400 font-medium">Yükleniyor...</div>
            ) : members.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium italic">Henüz üye eklenmemiş. "Yeni Üye Ekle" butonu ile başlayın.</div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="grid grid-cols-12 gap-4 p-5 items-center group hover:bg-blue-50/30 transition-colors">
                  <div className="col-span-1 flex items-center justify-center text-slate-300">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <DebouncedInput
                      type="text"
                      className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 p-2 rounded-lg text-slate-900 text-sm font-bold outline-none shadow-sm"
                      value={member.name}
                      onChange={(val) => updateMember(member.id, { name: val })}
                      placeholder="Adı Soyadı"
                    />
                    <DebouncedInput
                      type="text"
                      className="w-full bg-white/50 border border-slate-200 focus:ring-2 focus:ring-blue-500 p-2 rounded-lg text-slate-600 text-[11px] font-bold uppercase outline-none shadow-sm"
                      value={member.title}
                      onChange={(val) => updateMember(member.id, { title: val })}
                      placeholder="Ünvan (Örn: Üye, Vali Yrd.)"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => updateMember(member.id, { isProxy: !member.isProxy })}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                        member.isProxy ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                      }`}
                      title={member.isProxy ? 'Vekaleti Kaldır' : 'Vekil Ata'}
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="col-span-5">
                    {member.isProxy ? (
                      <div className="grid grid-cols-2 gap-3">
                        <DebouncedInput
                          type="text"
                          className="w-full bg-orange-50 border border-orange-100 focus:ring-2 focus:ring-orange-500 p-2 rounded-lg text-slate-900 text-sm font-bold outline-none"
                          value={member.proxyName || ''}
                          onChange={(val) => updateMember(member.id, { proxyName: val })}
                          placeholder="Vekil Adı Soyadı"
                        />
                        <DebouncedInput
                          type="text"
                          className="w-full bg-orange-50 border border-orange-100 focus:ring-2 focus:ring-orange-500 p-2 rounded-lg text-slate-600 text-[11px] font-bold uppercase outline-none"
                          value={member.proxyTitle || ''}
                          onChange={(val) => updateMember(member.id, { proxyTitle: val })}
                          placeholder="Vekil Ünvanı"
                        />
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 font-medium italic bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                        Bu üye bizzat katılım sağlayacak.
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => deleteMember(member.id)}
                      className="text-slate-300 hover:text-red-500 transition-all p-2 rounded-xl hover:bg-red-50"
                      title="Sil"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="mt-6 flex items-start gap-3 bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
             <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900 uppercase tracking-tight">Vekalet Hakkında</h4>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed font-medium">
              Eğer bir üyenin yerine vekil katılım sağlayacaksa "Vekil Ata" butonunu kullanarak vekil bilgilerini girin. 
              İmza alanında "Ali Yılmaz (Veli Yılmaz Vekili)" şeklinde otomatik olarak görünecektir.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
