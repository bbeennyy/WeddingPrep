export type Owner = "a" | "b" | "both";
export type Rsvp = "pending" | "attending" | "declined" | "maybe";
export type VendorStatus = "researching" | "contacted" | "booked" | "paid";
export type TableShape = "round" | "rect";

export type ProgramSection = "pre-ceremony" | "ceremony" | "reception";

export type ProgramTag =
  | "prelude"
  | "procession"
  | "welcome"
  | "purpose"
  | "prayer"
  | "song"
  | "word"
  | "homily"
  | "intent"
  | "affirmation"
  | "vows"
  | "rings"
  | "unity"
  | "thanksgiving"
  | "lords-prayer"
  | "pronouncement"
  | "kiss"
  | "benediction"
  | "recession"
  | "custom";

export interface Settings {
  partnerA: string;
  partnerB: string;
  weddingDate: string;
  churchName: string;
  receptionVenue: string;
  city: string;
  currency: string;
  totalBudget: number;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  githubPath: string;
  githubToken: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  done: boolean;
  owner: Owner;
  dueDate: string;
  notes: string;
}

export interface Vendor {
  id: string;
  name: string;
  role: string;
  contact: string;
  status: VendorStatus;
  notes: string;
}

export interface BudgetItem {
  id: string;
  name: string;
  category: string;
  estimate: number;
  actual: number;
  paid: boolean;
}

export interface NoteCard {
  id: string;
  title: string;
  body: string;
}

export interface Guest {
  id: string;
  name: string;
  side: Owner;
  rsvp: Rsvp;
  dietary: string;
  notes: string;
  tableId: string | null;
  group: string;
}

export interface Table {
  id: string;
  name: string;
  seats: number;
  shape: TableShape;
}

export interface PhotoShot {
  id: string;
  name: string;
  notes: string;
  guestIds: string[];
}

export interface ProgramItem {
  id: string;
  tag: ProgramTag;
  section: ProgramSection;
  time: string;
  title: string;
  subtitle: string;
  body: string;
  people: string;
}

export interface WeddingData {
  version: 1;
  updatedAt: string;
  settings: Settings;
  checklist: ChecklistItem[];
  vendors: Vendor[];
  budget: BudgetItem[];
  notes: NoteCard[];
  guests: Guest[];
  tables: Table[];
  photoShots: PhotoShot[];
  program: ProgramItem[];
}

export interface ProgramTagMeta {
  id: ProgramTag;
  label: string;
  hint: string;
  group: "music" | "movement" | "word" | "covenant" | "presbyterian";
}
