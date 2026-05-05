# Mütevelli Heyeti Gündem ve Karar Hazırlama Sistemi

Bu uygulama, Mütevelli Heyeti toplantıları için profesyonel gündem maddeleri hazırlama, kararları kesinleştirme ve resmi formatta çıktı (PDF/Yazdır) alma süreçlerini dijitalleştirmek için tasarlanmıştır.

## 🚀 Öne Çıkan Özellikler

- **Vekalet Sistemi:** Üyelere vekil atama desteği ve imza alanında otomatik vekil bilgisi gösterimi.
- **Karar Kesinleştirme (Locking):** Kararlar kesinleştirildiğinde imzacılar o anki halleriyle kaydedilir (Snapshot), böylece tarihsel tutarlılık korunur.
- **Zengin Metin Editörü:** Gündem maddeleri ve karar notları için tam özellikli metin editörü.
- **Resmi Format Desteği:** 
  - A4 standartlarında canlı önizleme.
  - Sayfa sonu çizgileri ile sayfalama kontrolü.
  - Tüm sayfalarda tekrarlanan kurum filigranı (Watermark).
  - Akıllı sayfalama (İmza ve Karar Notu her zaman aynı sayfada kalır).
- **Modern UI/UX:** Hızlı erişim menüsü (Sticky Sidebar), mobil uyumlu hamburger menü ve kurumsal tasarım.
- **Offline Veri Güvenliği:** `Dexie.js` ile tüm veriler tarayıcınızda (IndexedDB) güvenle saklanır.

## 🛠 Teknoloji Yığını

- **Framework:** Next.js (App Router)
- **Veritabanı:** Dexie.js (IndexedDB wrapper)
- **Styling:** Tailwind CSS & Vanilla CSS
- **Editor:** Tiptap (Rich Text Editor)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Print Engine:** React-to-Print

## 📦 Kurulum

Projeyi yerelinizde çalıştırmak için:

1. Bağımlılıkları yükleyin:
```bash
npm install
