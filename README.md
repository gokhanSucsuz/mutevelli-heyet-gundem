# Mutevelli Heyeti Gundem ve Karar Hazirlama Sistemi

Bu uygulama, Mutevelli Heyeti toplantilari icin profesyonel gundem maddeleri hazirlama, kararlari kesinlestirme ve resmi formatta cikti (PDF/Yazdir) alma sureclerini dijitallestirmek icin tasarlanmistir.

## One Cikan Ozellikler

Vekalet Sistemi: Uyelere vekil atama destegi ve imza alaninda otomatik vekil bilgisi gosterimi.
Karar Kesinlestirme (Locking): Kararlar kesinlestirildiginde imzacilar o anki halleriyle kaydedilir (Snapshot), boylece tarihsel tutarlilik korunur.
Zengin Metin Editoru: Gundem maddeleri ve karar notlari icin tam ozellikli metin editoru.
Resmi Format Destegi:
A4 standartlarinda canli onizleme.
Sayfa sonu cizgileri ile sayfalama kontrolu.
Tum sayfalarda tekrarlanan kurum filigrani (Watermark).
Akilli sayfalama (Imza ve Karar Notu her zaman ayni sayfada kalir).
Modern UI/UX: Hizli erisim menusu (Sticky Sidebar), mobil uyumlu hamburger menu ve kurumsal tasarim.
Offline Veri Guvenligi: Dexie.js ile tum veriler tarayicinizda (IndexedDB) guvenle saklanir.

## Teknoloji Yigini

Framework: Next.js (App Router)
Veritabani: Dexie.js (IndexedDB wrapper)
Styling: Tailwind CSS & Vanilla CSS
Editor: Tiptap (Rich Text Editor)
Icons: Lucide React
Animations: Framer Motion
Print Engine: React-to-Print

## Kurulum

Projeyi yerelinizde calistirmak icin:

1. Bagimliliklari yukleyin:
2. npm install

3. 2. Gelistirme sunucusunu baslatin:
   3. npm run dev
  
   4. 3. Tarayicinizda http://localhost:3000 adresine gidin.
     
      4. ## Kullanim Notlari
     
      5. Uyeler: Ayarlar > Mutevelli Heyet Uyeleri kismindan uyeleri ve vekilleri ekleyebilirsiniz.
      6. Karar Alma: Gundem maddelerini olusturduktan sonra Onizleme sekmesinden Karari Kesinlestir butonu ile belgeyi kilitleyebilirsiniz.
      7. Ertelenen Toplantilar: Toplanti ertelendiginde Toplanti Ertelendi secenegini isaretleyerek kilitli belgelerdeki tarih/saat alanlarini guncelleyebilirsiniz.
     
      8. ---
      9. Gelistiren: Antigravity AI
      10. 
