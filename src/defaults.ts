import type {
  ChecklistItem,
  Guest,
  PhotoShot,
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
    subtasks: [],
  };
}

function program(
  tag: ProgramTag,
  title: string,
  extras: Partial<Pick<ProgramItem, "subtitle" | "body" | "people" | "section" | "time">> = {},
): ProgramItem {
  return {
    id: uid(),
    tag,
    title,
    section: extras.section ?? (tag === "prelude" ? "pre-ceremony" : "ceremony"),
    time: extras.time ?? "",
    subtitle: extras.subtitle ?? "",
    body: extras.body ?? "",
    people: extras.people ?? "",
  };
}

function defaultPhotoShots(settings: Settings): PhotoShot[] {
  const a = settings.partnerA.trim() || "Partner A";
  const b = settings.partnerB.trim() || "Partner B";
  return [
    { id: uid(), name: "The couple", notes: "", guestIds: [] },
    { id: uid(), name: `${a} with family`, notes: "", guestIds: [] },
    { id: uid(), name: `${b} with family`, notes: "", guestIds: [] },
    { id: uid(), name: "Both families", notes: "", guestIds: [] },
    { id: uid(), name: "Wedding party", notes: "", guestIds: [] },
    { id: uid(), name: "Friends", notes: "", guestIds: [] },
  ];
}

export function defaultSettings(): Settings {
  return {
    partnerA: "Beniamin Costea",
    partnerB: "Evelyn Costea",
    weddingDate: "",
    churchName: "",
    receptionVenue: "",
    city: "",
    currency: "€",
    totalBudget: 0,
    githubOwner: "bbeennyy",
    githubRepo: "WeddingPrep",
    githubBranch: "main",
    githubPath: "data/wedding.json",
    githubToken: "",
  };
}

export function createDefaultData(): WeddingData {
  const settings = defaultSettings();
  const guests = coupleGuests();

  return {
    version: 1,
    updatedAt: "",
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
    guests,
    tables: [],
    photoShots: defaultPhotoShots(settings).map((shot) =>
      shot.name === "The couple" ? { ...shot, guestIds: guests.map((guest) => guest.id) } : shot,
    ),
    program: [
      program("custom", "Getting ready", {
        section: "pre-ceremony",
        time: "12:00",
        people: "Couple & wedding party",
        body: "Hair, makeup, getting dressed. Note the address and who needs to be there.",
      }),
      program("custom", "First look / photos", {
        section: "pre-ceremony",
        time: "13:30",
        people: "Photographer",
        body: "Where, and who is in the photos.",
      }),
      program("custom", "Guests arrive", {
        section: "pre-ceremony",
        time: "14:30",
        people: "Ushers",
        body: "Seating, programs, guest book.",
      }),
      program("prelude", "Prelude", {
        section: "pre-ceremony",
        time: "14:45",
        people: "Musician",
        body: "Music while guests are seated.",
      }),
      program("procession", "Procession", {
        time: "15:00",
        subtitle: "Entrance of the wedding party",
        people: "Grandparents, parents, wedding party, then the couple — edit the order here.",
        body: "Note who walks with whom, and which piece of music is playing.",
      }),
      program("welcome", "Call to Worship", {
        time: "15:04",
        people: "Minister",
        body: "In the name of the Father, and of the Son, and of the Holy Spirit.\nWe have come together in the presence of God to witness the marriage of N. and N., to surround them with our prayers, and to ask God’s blessing on them.",
      }),
      program("purpose", "Statement of Purpose", {
        time: "15:07",
        people: "Minister",
        body: "Marriage is a gift of God, sealed by promises made before God and this congregation. Today N. and N. come to give themselves to one another, and to seek the grace of Christ for the life they will share.",
      }),
      program("prayer", "Opening Prayer", {
        time: "15:10",
        people: "Minister",
        body: "Write or paste the invocation here.",
      }),
      program("song", "Hymn", {
        time: "15:13",
        subtitle: "Title · number if you use a hymnal",
        people: "Congregation",
        body: "Verse 1\n\nVerse 2\n\nVerse 3",
      }),
      program("word", "Scripture", {
        time: "15:18",
        subtitle: "e.g. 1 Corinthians 13:4–8",
        people: "Reader",
        body: "Paste the reading here so it can be printed in the program if you wish.",
      }),
      program("homily", "Homily", {
        time: "15:22",
        people: "Minister",
        body: "A short meditation on the Word — notes for the minister, or leave blank in the printed program.",
      }),
      program("intent", "Declaration of Intent", {
        time: "15:30",
        people: "Couple & minister",
        body: "N., will you have N. to be your wife/husband, and will you love, honor, and be faithful to her/him, as long as you both shall live?\nI will.",
      }),
      program("affirmation", "Affirmation of Families and Congregation", {
        time: "15:33",
        people: "Families & church",
        body: "Do you, the families of N. and N., give them your blessing and promise to support them?\nWe do.\n\nWill all of you, by God’s grace, do everything in your power to uphold these two persons in their marriage?\nWe will.",
      }),
      program("vows", "Vows", {
        time: "15:36",
        people: "The couple",
        body: "I, N., take you, N., to be my wife/husband;\nand I promise, before God and these witnesses,\nto be your loving and faithful husband/wife,\nin plenty and in want,\nin joy and in sorrow,\nin sickness and in health,\nas long as we both shall live.",
      }),
      program("rings", "Blessing and Exchange of Rings", {
        time: "15:40",
        people: "Couple & minister",
        body: "These rings are a sign of the promises made today.\nN., I give you this ring as a sign of my love and faithfulness.",
      }),
      program("thanksgiving", "Prayer of Thanksgiving", {
        time: "15:43",
        people: "Minister",
        body: "Give thanks for the covenant made, and pray for the home they will make.",
      }),
      program("lords-prayer", "The Lord’s Prayer", {
        time: "15:46",
        people: "All",
        body: "Our Father, who art in heaven,\nhallowed be thy name.\nThy kingdom come,\nthy will be done,\non earth as it is in heaven.\nGive us this day our daily bread,\nand forgive us our debts,\nas we forgive our debtors.\nAnd lead us not into temptation,\nbut deliver us from evil.\nFor thine is the kingdom, and the power, and the glory, forever. Amen.",
      }),
      program("pronouncement", "Pronouncement of Marriage", {
        time: "15:48",
        people: "Minister",
        body: "Before God and this congregation, N. and N. have made their promises. I declare that they are husband and wife. What God has joined together, let no one separate.",
      }),
      program("kiss", "The Kiss", { time: "15:49" }),
      program("benediction", "Benediction", {
        time: "15:50",
        people: "Minister",
        body: "The Lord bless you and keep you;\nthe Lord make his face to shine upon you and be gracious to you;\nthe Lord lift up his countenance upon you and give you peace. Amen.",
      }),
      program("recession", "Recession", {
        time: "15:52",
        people: "The couple, then the wedding party",
        body: "Music as they leave. Note the piece here.",
      }),
      program("custom", "Cocktail hour", {
        section: "reception",
        time: "16:30",
        people: "Guests",
        body: "Drinks and photos while the wedding party finishes pictures.",
      }),
      program("custom", "Dinner", {
        section: "reception",
        time: "17:30",
        people: "All",
        body: "Note seating, blessing, and any dietary timing.",
      }),
      program("custom", "Toasts", {
        section: "reception",
        time: "18:30",
        people: "Best man, maid of honor…",
        body: "Who speaks, and in what order.",
      }),
      program("custom", "First dance", {
        section: "reception",
        time: "19:00",
        people: "The couple",
        body: "Song title.",
      }),
      program("custom", "Cake", {
        section: "reception",
        time: "19:30",
        body: "Cutting and serving.",
      }),
      program("custom", "Send-off", {
        section: "reception",
        time: "21:30",
        people: "Guests",
        body: "Sparklers, petals, or a quiet exit — note what you want.",
      }),
    ],
  };
}

export function coupleGuests(): Guest[] {
  return [
    {
      id: uid(),
      name: "Beniamin Costea",
      side: "a",
      rsvp: "attending",
      dietary: "",
      notes: "Groom",
      tableId: null,
      group: "The couple",
      rehearsalDinner: true,
    },
    {
      id: uid(),
      name: "Evelyn Costea",
      side: "b",
      rsvp: "attending",
      dietary: "",
      notes: "Bride",
      tableId: null,
      group: "The couple",
      rehearsalDinner: true,
    },
  ];
}

export function ensureCoupleGuests(guests: Guest[]): Guest[] {
  const have = new Set(guests.map((guest) => guest.name.trim().toLowerCase()));
  const extra = coupleGuests().filter((guest) => !have.has(guest.name.toLowerCase()));
  return extra.length ? [...extra, ...guests] : guests;
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
  if (owner === "a") return settings.partnerA.trim() || "Beniamin Costea";
  return settings.partnerB.trim() || "Evelyn Costea";
}

export function money(n: number, currency: string): string {
  const value = Number.isFinite(n) ? n : 0;
  return `${currency}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
