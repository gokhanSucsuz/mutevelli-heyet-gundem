import Dexie, { type EntityTable } from 'dexie';

export interface Member {
  id: string;
  name: string;
  title: string;
  order: number;
  isProxy?: boolean;
  proxyName?: string;
  proxyTitle?: string;
}

export interface MemberSnapshot {
  id: string;
  name: string;
  title: string;
  isProxy?: boolean;
  proxyName?: string;
  proxyTitle?: string;
  order: number;
}

export interface TableConfig {
  columns: string[];
  rows: string[][];
  showBorders?: boolean;
}

export interface FormSubItem {
  id: string;
  type: 'numbered' | 'bullet' | 'text';
  text: string;
}

export interface FormItem {
  id: string;
  type: 'numbered' | 'bullet' | 'text';
  text: string;
  hasTable?: boolean;
  table?: TableConfig;
  indent?: number; // Optional indentation level
  subItems?: FormSubItem[];
}

export interface OfficialForm {
  id: string;
  title: string;
  documentDate: string;
  decisionNo: string;
  decisionDate: string;
  decisionTime: string;
  isPostponed: boolean;
  isLocked?: boolean;
  headerTop: string;
  headerMiddle: string;
  headerBottom: string;
  headerLine4: string; 
  items: FormItem[];
  footerText: string;
  signatureMembers: string[]; // Still keep IDs for selection logic
  signatureSnapshots?: MemberSnapshot[]; // Stored when locked
  createdAt: number;
  updatedAt: number;
  layout?: {
    lineSpacing: 'tight' | 'normal' | 'relaxed';
    tablePadding: 'tight' | 'normal' | 'relaxed';
    showPageNumbers?: boolean;
    marginX?: number; // sayfa kenar boşluğu
    marginY?: number; // sayfa alt üst boşluğu
    fontFamily?: string;
    fontSizeTitle?: number;
    fontSizeContent?: number;
    fontSizeTable?: number;
    signatureSpacing?: number; // İmza alanı boşluğu
    fontSizeHeaderInfo?: number; // Tarih ve Karar No alanı boyutu
    subItemSpacing?: number; // Alt maddeler arası boşluk (px)
    logoOpacity?: number; // 0-100 arası
    watermarkText?: string;
    watermarkOpacity?: number; // 0-100 arası
    watermarkAngle?: number;
    watermarkSize?: number; // 1-200 arası vb
    headerLineSpacing?: string; // Başlık satırlar arası boşluk
    signatureFontSize?: number;
    signatureFontFamily?: string;
    signatureOpacity?: number; // 0-100 arası
  }
}

export interface Settings {
  id: string; // 'default'
  leftLogoBase64?: string;
  rightLogoBase64?: string;
  layout?: {
    lineSpacing: 'tight' | 'normal' | 'relaxed';
    tablePadding: 'tight' | 'normal' | 'relaxed';
    showPageNumbers?: boolean;
    marginX?: number; 
    marginY?: number; 
    fontFamily?: string;
    fontSizeTitle?: number;
    fontSizeContent?: number;
    fontSizeTable?: number;
    signatureSpacing?: number; 
    fontSizeHeaderInfo?: number; 
    subItemSpacing?: number; 
    logoOpacity?: number; 
    watermarkText?: string;
    watermarkOpacity?: number; 
    watermarkAngle?: number;
    watermarkSize?: number; 
    headerLineSpacing?: string; 
    signatureFontSize?: number;
    signatureFontFamily?: string;
    signatureOpacity?: number; 
  }
}

const db = new Dexie('OfficialFormsDB') as Dexie & {
  members: EntityTable<Member, 'id'>;
  forms: EntityTable<OfficialForm, 'id'>;
  settings: EntityTable<Settings, 'id'>;
};

// Schema declaration
db.version(2).stores({
  members: 'id, order',
  forms: 'id, createdAt, updatedAt',
  settings: 'id'
});

export { db };
