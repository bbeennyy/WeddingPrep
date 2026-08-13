import type { ProgramTag, ProgramTagMeta } from "./types";

export const PROGRAM_TAGS: ProgramTagMeta[] = [
  { id: "prelude", label: "Prelude", hint: "Music as people gather", group: "music" },
  { id: "procession", label: "Procession", hint: "Who enters, and in what order", group: "movement" },
  { id: "welcome", label: "Call to Worship", hint: "Opening welcome in God’s name", group: "presbyterian" },
  { id: "purpose", label: "Statement of Purpose", hint: "Why the church gathers for marriage", group: "presbyterian" },
  { id: "prayer", label: "Prayer", hint: "Invocation, intercession, or blessing", group: "presbyterian" },
  { id: "song", label: "Song / Hymn", hint: "Title plus lyrics for the bulletin", group: "music" },
  { id: "word", label: "Word / Scripture", hint: "Reading reference and text", group: "word" },
  { id: "homily", label: "Homily", hint: "Short meditation on the Word", group: "word" },
  { id: "intent", label: "Declaration of Intent", hint: "The couple’s public yes", group: "covenant" },
  { id: "affirmation", label: "Affirmation", hint: "Family and congregation support", group: "presbyterian" },
  { id: "vows", label: "Vows", hint: "Promises spoken to one another", group: "covenant" },
  { id: "rings", label: "Exchange of Rings", hint: "Blessing and giving of rings", group: "covenant" },
  { id: "unity", label: "Unity symbol", hint: "Candle, cord, or other sign", group: "covenant" },
  { id: "thanksgiving", label: "Prayer of Thanksgiving", hint: "Thanks for the covenant made", group: "presbyterian" },
  { id: "lords-prayer", label: "Lord’s Prayer", hint: "Spoken together", group: "presbyterian" },
  { id: "pronouncement", label: "Pronouncement", hint: "The marriage is declared", group: "covenant" },
  { id: "kiss", label: "The Kiss", hint: "The first married kiss", group: "covenant" },
  { id: "benediction", label: "Benediction", hint: "Blessing and sending", group: "presbyterian" },
  { id: "recession", label: "Recession", hint: "How the couple and party leave", group: "movement" },
  { id: "custom", label: "Custom", hint: "Anything else you want in the flow", group: "presbyterian" },
];

export const TAG_BY_ID = Object.fromEntries(
  PROGRAM_TAGS.map((tag) => [tag.id, tag]),
) as Record<ProgramTag, ProgramTagMeta>;

export const CHECKLIST_CATEGORIES = [
  "Legal",
  "Church",
  "Venue",
  "Guests",
  "Attire",
  "Food",
  "Music",
  "Decor",
  "Photo",
  "Travel",
  "Other",
] as const;

export const OWNER_LABELS = {
  a: "Partner A",
  b: "Partner B",
  both: "Together",
} as const;

export const RSVP_LABELS = {
  pending: "Pending",
  attending: "Attending",
  declined: "Declined",
  maybe: "Maybe",
} as const;
