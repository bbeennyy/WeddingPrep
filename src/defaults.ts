import type {
  ChecklistItem,
  ProgramItem,
  ProgramTag,
  Settings,
  WeddingData,
} from "./types";

export function uid(): string {
  return crypto.randomUUID();
}

function task(
  category: string,
  title: string,
  owner: ChecklistItem["owner"] = "both",
): ChecklistItem {
  return {
    id: uid(),
    title,
    category,
    done: false,
    owner,
    dueDate: "",
    notes: "",
  };
}

function program(
  tag: ProgramTag,
  title: string,
  extras: Partial<Pick<ProgramItem, "subtitle" | "body" | "people">> = {},
): ProgramItem {
  return {
    id: uid(),
    tag,
    title,
    subtitle: extras.subtitle ?? "",
    body: extras.body ?? "",
    people: extras.people ?? "",
  };
}

export function defaultSettings(): Settings {
  return {
    partnerA: "",
    partnerB: "",
    weddingDate: "",
    churchName: "",
    receptionVenue: "",
    city: "",
    currency: "€",
    githubOwner: "bbeennyy",
    githubRepo: "WeddingPrep",
    githubBranch: "main",
    githubPath: "data/wedding.json",
    githubToken: "",
  };
}

export function createDefaultData(): WeddingData {
  const settings = defaultSettings();

  return {
    version: 1,
    settings,
    checklist: [
      task("Legal", "Confirm you can legally marry (documents, waiting period)"),
      task("Legal", "Book the civil appointment if required besides church"),
      task("Legal", "Gather birth certificates / IDs / divorce decrees if needed"),
      task("Church", "Meet with the pastor / session and confirm the date"),
      task("Church", "Ask about premarital counseling"),
      task("Church", "Draft the ceremony flow in the Program tab"),
      task("Church", "Choose readings, vows, and who will pray or speak"),
      task("Church", "Choose hymns / songs and collect lyrics"),
      task("Church", "Confirm musicians, sound, and rehearsal time"),
      task("Venue", "Book reception venue and rain plan"),
      task("Venue", "Confirm catering minimums, cake, and cake cutting"),
      task("Guests", "Build the guest list together"),
      task("Guests", "Collect addresses and send invitations"),
      task("Guests", "Track RSVPs and meal choices"),
      task("Guests", "Seat guests at tables"),
      task("Attire", "Choose outfits and schedule fittings"),
      task("Attire", "Buy or borrow rings and get them sized"),
      task("Food", "Lock the menu, cake, and drinks"),
      task("Music", "Book ceremony musicians and reception playlist / DJ"),
      task("Decor", "Flowers, candles, and what the church already provides"),
      task("Photo", "Book photographer / videographer and share the timeline"),
      task("Travel", "Book honeymoon or a quiet night nearby"),
      task("Other", "Write vows if you are using your own"),
      task("Other", "Assign day-of helpers (programs, gifts, grandparents)"),
      task("Other", "Plan thank-you notes after the wedding"),
    ],
    vendors: [],
    budget: [
      { id: uid(), name: "Church / officiant", category: "Church", estimate: 0, actual: 0, paid: false },
      { id: uid(), name: "Reception venue", category: "Venue", estimate: 0, actual: 0, paid: false },
      { id: uid(), name: "Food & cake", category: "Food", estimate: 0, actual: 0, paid: false },
      { id: uid(), name: "Attire", category: "Attire", estimate: 0, actual: 0, paid: false },
      { id: uid(), name: "Rings", category: "Attire", estimate: 0, actual: 0, paid: false },
      { id: uid(), name: "Flowers & decor", category: "Decor", estimate: 0, actual: 0, paid: false },
      { id: uid(), name: "Photo & video", category: "Photo", estimate: 0, actual: 0, paid: false },
      { id: uid(), name: "Music", category: "Music", estimate: 0, actual: 0, paid: false },
    ],
    notes: [
      {
        id: uid(),
        title: "How we want the day to feel",
        body: "Write the atmosphere you both want — quiet, joyful, simple, full of singing…",
      },
    ],
    guests: [],
    tables: [],
    program: [
      program("prelude", "Prelude", {
        people: "Musician",
        body: "Music while guests are seated.",
      }),
      program("procession", "Procession", {
        subtitle: "Entrance of the wedding party",
        people: "Grandparents, parents, wedding party, then the couple — edit the order here.",
        body: "Note who walks with whom, and which piece of music is playing.",
      }),
      program("welcome", "Call to Worship", {
        people: "Minister",
        body: "In the name of the Father, and of the Son, and of the Holy Spirit.\nWe have come together in the presence of God to witness the marriage of N. and N., to surround them with our prayers, and to ask God’s blessing on them.",
      }),
      program("purpose", "Statement of Purpose", {
        people: "Minister",
        body: "Marriage is a gift of God, sealed by promises made before God and this congregation. Today N. and N. come to give themselves to one another, and to seek the grace of Christ for the life they will share.",
      }),
      program("prayer", "Opening Prayer", {
        people: "Minister",
        body: "Write or paste the invocation here.",
      }),
      program("song", "Hymn", {
        subtitle: "Title · number if you use a hymnal",
        people: "Congregation",
        body: "Verse 1\n\nVerse 2\n\nVerse 3",
      }),
      program("word", "Scripture", {
        subtitle: "e.g. 1 Corinthians 13:4–8",
        people: "Reader",
        body: "Paste the reading here so it can be printed in the program if you wish.",
      }),
      program("homily", "Homily", {
        people: "Minister",
        body: "A short meditation on the Word — notes for the minister, or leave blank in the printed program.",
      }),
      program("intent", "Declaration of Intent", {
        people: "Couple & minister",
        body: "N., will you have N. to be your wife/husband, and will you love, honor, and be faithful to her/him, as long as you both shall live?\nI will.",
      }),
      program("affirmation", "Affirmation of Families and Congregation", {
        people: "Families & church",
        body: "Do you, the families of N. and N., give them your blessing and promise to support them?\nWe do.\n\nWill all of you, by God’s grace, do everything in your power to uphold these two persons in their marriage?\nWe will.",
      }),
      program("vows", "Vows", {
        people: "The couple",
        body: "I, N., take you, N., to be my wife/husband;\nand I promise, before God and these witnesses,\nto be your loving and faithful husband/wife,\nin plenty and in want,\nin joy and in sorrow,\nin sickness and in health,\nas long as we both shall live.",
      }),
      program("rings", "Blessing and Exchange of Rings", {
        people: "Couple & minister",
        body: "These rings are a sign of the promises made today.\nN., I give you this ring as a sign of my love and faithfulness.",
      }),
      program("thanksgiving", "Prayer of Thanksgiving", {
        people: "Minister",
        body: "Give thanks for the covenant made, and pray for the home they will make.",
      }),
      program("lords-prayer", "The Lord’s Prayer", {
        people: "All",
        body: "Our Father, who art in heaven,\nhallowed be thy name.\nThy kingdom come,\nthy will be done,\non earth as it is in heaven.\nGive us this day our daily bread,\nand forgive us our debts,\nas we forgive our debtors.\nAnd lead us not into temptation,\nbut deliver us from evil.\nFor thine is the kingdom, and the power, and the glory, forever. Amen.",
      }),
      program("pronouncement", "Pronouncement of Marriage", {
        people: "Minister",
        body: "Before God and this congregation, N. and N. have made their promises. I declare that they are husband and wife. What God has joined together, let no one separate.",
      }),
      program("kiss", "The Kiss"),
      program("benediction", "Benediction", {
        people: "Minister",
        body: "The Lord bless you and keep you;\nthe Lord make his face to shine upon you and be gracious to you;\nthe Lord lift up his countenance upon you and give you peace. Amen.",
      }),
      program("recession", "Recession", {
        people: "The couple, then the wedding party",
        body: "Music as they leave. Note the piece here.",
      }),
    ],
  };
}

export function coupleLabel(settings: Settings): string {
  const a = settings.partnerA.trim();
  const b = settings.partnerB.trim();
  if (a && b) return `${a} & ${b}`;
  if (a) return a;
  if (b) return b;
  return "Our wedding";
}

export function ownerName(settings: Settings, owner: "a" | "b" | "both"): string {
  if (owner === "both") return "Together";
  if (owner === "a") return settings.partnerA.trim() || "Partner A";
  return settings.partnerB.trim() || "Partner B";
}

export function money(n: number, currency: string): string {
  const value = Number.isFinite(n) ? n : 0;
  return `${currency}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
