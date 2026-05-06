# Project Index: Gündem Hazırlama (Board Agenda Tool)

## 📌 Overview
This project is a professional tool for preparing, managing, and printing official board agendas and decision forms (Karar Formları). It follows A4 standards for printing and includes features like member management, signature snapshots, and rich text editing.

## 🛠 Tech Stack
- **Framework**: Next.js (App Router)
- **State/Database**: Dexie (IndexedDB) for local-first data storage.
- **Styling**: Tailwind CSS & Framer Motion.
- **Editor**: Tiptap (Rich Text Editor).
- **Printing**: `react-to-print`.
- **Icons**: Lucide React.

## 📂 Project Structure

### `/app` (Routes & Pages)
- `page.tsx`: Dashboard showing the list of created forms.
- `forms/[id]/page.tsx`: The main editor and preview page for a specific form.
- `members/page.tsx`: Management of board members (names, titles, order, proxy settings).
- `settings/page.tsx`: Global settings (logos, default layout, watermarks).
- `layout.tsx`: Main application wrapper.

### `/components`
- `Layout.tsx`: The sidebar and main layout wrapper used across pages.
- `RichTextEditor.tsx`: A Tiptap-based rich text editor component.

### `/lib`
- `db.ts`: Dexie database schema and TypeScript interfaces (`Member`, `OfficialForm`, `Settings`).
- `utils.ts`: Utility functions (e.g., `cn` for Tailwind class merging).

### `/hooks`
- Custom React hooks for the application.

## 💾 Data Model (`/lib/db.ts`)
The application uses three main tables in IndexedDB:
1. **`forms`**: Stores `OfficialForm` objects including header info, agenda items, items with tables, and signature configurations.
2. **`members`**: Stores `Member` objects used for signatures.
3. **`settings`**: Stores global application state like logos and default layout preferences.

### Key Feature: Decision Locking
When a form is "locked" (kesinleştirildi), it takes a snapshot of the current members (`signatureSnapshots`) to ensure that even if a member is deleted or updated later, the printed document remains historically accurate.

## 📄 Key Files for AI Understanding
- `lib/db.ts`: Read this to understand the data structure before modifying any data logic.
- `app/forms/[id]/page.tsx`: The core logic for form editing and A4-compliant printing.
- `components/RichTextEditor.tsx`: Logic for the rich text editor used in headers and agenda items.

## 📏 Printing Standards
The application is designed to output A4-sized documents.
- CSS classes like `a4-page`, `break-inside-avoid` are critical for multi-page support.
- Dimensions are often specified in `mm` for accuracy.
