import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Clock, Plus, Printer, Trash2 } from "lucide-react";
import { PROGRAM_SECTIONS, SECTION_PRESETS, TAG_BY_ID } from "../constants";
import { useWedding } from "../context";
import { coupleLabel, uid } from "../defaults";
import { printTarget } from "../print";
import type { ProgramItem, ProgramSection, ProgramTag } from "../types";

const sectionTone: Record<ProgramSection, { line: string; dot: string; chip: string }> = {
  "pre-ceremony": { line: "bg-gold/35", dot: "border-gold bg-gold-soft", chip: "text-gold" },
  ceremony: { line: "bg-sage/35", dot: "border-sage bg-sage-soft", chip: "text-sage" },
  reception: { line: "bg-rose/35", dot: "border-rose bg-rose-soft", chip: "text-rose" },
};

/** Print-safe colors for the schedule timeline rail (section identity). */
const SECTION_RAIL: Record<ProgramSection, { line: string; accent: string; soft: string }> = {
  "pre-ceremony": { line: "#d4b87a", accent: "#b0894f", soft: "#f4ead8" },
  ceremony: { line: "#a8bfa0", accent: "#5c7356", soft: "#e5eee2" },
  reception: { line: "#d4a8b0", accent: "#a85c66", soft: "#f4e6e8" },
};

function formatTime(value: string): string {
  if (!value) return "";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function timeRange(items: ProgramItem[]): string {
  const times = items.map((item) => item.time).filter(Boolean).sort();
  if (!times.length) return "Add times as you plan";
  const start = formatTime(times[0]);
  const end = formatTime(times[times.length - 1]);
  return start === end ? start : `${start} – ${end}`;
}

function insertIndex(program: ProgramItem[], section: ProgramSection): number {
  const last = program.reduce((acc, item, index) => (item.section === section ? index : acc), -1);
  if (last >= 0) return last + 1;
  if (section === "pre-ceremony") return 0;
  if (section === "ceremony") {
    const lastPre = program.reduce((acc, item, index) => (item.section === "pre-ceremony" ? index : acc), -1);
    return lastPre + 1;
  }
  return program.length;
}

function printIdForSection(section: ProgramSection): string {
  return `bulletin-${section}`;
}

export function ProgramPage() {
  const { data, patch } = useWedding();
  const [mode, setMode] = useState<"edit" | "preview" | "mc">("edit");
  const [open, setOpen] = useState<Record<ProgramSection, boolean>>({
    "pre-ceremony": true,
    ceremony: true,
    reception: true,
  });
  const [adding, setAdding] = useState<ProgramSection | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [printMenu, setPrintMenu] = useState(false);

  const grouped = useMemo(
    () =>
      PROGRAM_SECTIONS.map((section) => ({
        ...section,
        items: data.program.filter((item) => item.section === section.id),
      })),
    [data.program],
  );

  function update(id: string, next: Partial<ProgramItem>) {
    patch(
      "program",
      data.program.map((item) => (item.id === id ? { ...item, ...next } : item)),
    );
  }

  function moveInSection(id: string, dir: -1 | 1) {
    const item = data.program.find((row) => row.id === id);
    if (!item) return;
    const ids = data.program.filter((row) => row.section === item.section).map((row) => row.id);
    const index = ids.indexOf(id);
    const swapId = ids[index + dir];
    if (!swapId) return;
    const next = [...data.program];
    const a = next.findIndex((row) => row.id === id);
    const b = next.findIndex((row) => row.id === swapId);
    [next[a], next[b]] = [next[b], next[a]];
    patch("program", next);
  }

  function addItem(section: ProgramSection, tag: ProgramTag, title: string) {
    const isMc = tag === "mc";
    const item: ProgramItem = {
      id: uid(),
      tag,
      section,
      time: "",
      title,
      subtitle: tag === "song" ? "Hymn / title" : "",
      body: tag === "song" ? "Paste lyrics here.\n\nVerse 1\n\nVerse 2" : isMc ? "" : "",
      people: isMc ? "MC" : "",
      mcNotes: isMc ? "What to say or do…" : "",
    };
    const next = [...data.program];
    next.splice(insertIndex(next, section), 0, item);
    patch("program", next);
    setAdding(null);
    setExpanded(item.id);
    setOpen((current) => ({ ...current, [section]: true }));
  }

  function moveToSection(id: string, section: ProgramSection) {
    const current = data.program.find((row) => row.id === id);
    if (!current || current.section === section) return;
    const without = data.program.filter((row) => row.id !== id);
    without.splice(insertIndex(without, section), 0, { ...current, section });
    patch("program", without);
  }

  function runPrint(id: string) {
    setPrintMenu(false);
    printTarget(id);
  }

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">Wedding day</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Plan the timeline, print each part as its own PDF, and hand the MC a cue sheet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={mode === "edit" ? "btn-primary" : "btn-ghost"} onClick={() => setMode("edit")}>
            Edit
          </button>
          <button className={mode === "preview" ? "btn-primary" : "btn-ghost"} onClick={() => setMode("preview")}>
            Bulletin
          </button>
          <button className={mode === "mc" ? "btn-primary" : "btn-ghost"} onClick={() => setMode("mc")}>
            MC
          </button>
          <div className="relative">
            <button className="btn-ghost" onClick={() => setPrintMenu((openMenu) => !openMenu)}>
              <Printer className="h-4 w-4" /> Print / PDF
            </button>
            {printMenu ? (
              <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-gold/20 bg-cream shadow-paper">
                {PROGRAM_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    className="block w-full px-4 py-2.5 text-left text-sm hover:bg-gold-soft"
                    onClick={() => runPrint(printIdForSection(section.id))}
                  >
                    {section.label} bulletin
                  </button>
                ))}
                <button
                  className="block w-full border-t border-gold/15 px-4 py-2.5 text-left text-sm hover:bg-gold-soft"
                  onClick={() => runPrint("bulletin-mc")}
                >
                  MC cue sheet
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={mode === "preview" ? "block space-y-8" : "print-only space-y-8"}>
        {PROGRAM_SECTIONS.map((section) => (
          <SectionBulletin key={section.id} section={section.id} className="print-target" />
        ))}
      </div>

      <div className={mode === "mc" ? "block" : "print-only"}>
        <McBulletin className="print-target" />
      </div>

      {mode === "edit" ? (
        <div className="no-print space-y-4">
          {grouped.map((section) => {
            const tone = sectionTone[section.id];
            const expandedSection = open[section.id];
            return (
              <section key={section.id} className="card overflow-hidden">
                <button
                  className="flex w-full items-center gap-3 px-4 py-4 text-left"
                  onClick={() => setOpen((current) => ({ ...current, [section.id]: !current[section.id] }))}
                  aria-expanded={expandedSection}
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 ${tone.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-2xl leading-none">{section.label}</p>
                    <p className={`mt-1 flex items-center gap-1.5 text-xs ${tone.chip}`}>
                      <Clock className="h-3 w-3" />
                      {timeRange(section.items)}
                      <span className="text-muted">· {section.items.length}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      className="btn-ghost !px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        printTarget(printIdForSection(section.id));
                      }}
                      aria-label={`Print ${section.label}`}
                      title={`Print ${section.label} PDF`}
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-muted transition ${expandedSection ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {expandedSection ? (
                  <div className="border-t border-gold/10 px-4 pb-4 pt-2">
                    {section.items.length === 0 ? (
                      <p className="mb-3 px-1 text-sm text-muted">{section.hint}. Add the first moment below.</p>
                    ) : (
                      <ol className="relative">
                        <span className={`absolute bottom-3 left-[6.35rem] top-3 w-px ${tone.line}`} />
                        {section.items.map((item, index) => {
                          const isOpen = expanded === item.id;
                          return (
                            <li key={item.id} className="relative grid grid-cols-[6.5rem_1fr] gap-3 py-2">
                              <input
                                type="time"
                                className="field h-10 px-2 text-center text-sm tabular-nums"
                                value={item.time}
                                onChange={(e) => update(item.id, { time: e.target.value })}
                                aria-label={`Time for ${item.title || "this moment"}`}
                              />
                              <div className="min-w-0">
                                <span
                                  className={`absolute left-[6.1rem] top-5 z-[1] h-2.5 w-2.5 rounded-full border-2 ${tone.dot}`}
                                />
                                <div className={`rounded-2xl border border-gold/10 bg-white/60 ${isOpen ? "p-3" : ""}`}>
                                  <div className="flex items-start gap-2">
                                    <button
                                      className="min-w-0 flex-1 px-3 py-2 text-left"
                                      onClick={() => setExpanded(isOpen ? null : item.id)}
                                    >
                                      <p className="font-serif text-xl leading-tight">
                                        {item.tag === "mc" ? (
                                          <span className="mr-2 inline-flex align-middle text-[10px] uppercase tracking-[0.16em] text-gold">
                                            MC
                                          </span>
                                        ) : null}
                                        {item.title || "Untitled"}
                                      </p>
                                      <p className="mt-0.5 text-xs text-muted">
                                        {[item.people, item.subtitle, item.mcNotes ? "Has MC cue" : ""]
                                          .filter(Boolean)
                                          .join(" · ") || "Tap to edit details"}
                                      </p>
                                    </button>
                                    <div className="flex shrink-0 gap-1 pr-1 pt-1">
                                      <button
                                        className="btn-ghost !px-2"
                                        onClick={() => moveInSection(item.id, -1)}
                                        disabled={index === 0}
                                        aria-label="Move up"
                                      >
                                        <ChevronUp className="h-4 w-4" />
                                      </button>
                                      <button
                                        className="btn-ghost !px-2"
                                        onClick={() => moveInSection(item.id, 1)}
                                        disabled={index === section.items.length - 1}
                                        aria-label="Move down"
                                      >
                                        <ChevronDown className="h-4 w-4" />
                                      </button>
                                      <button
                                        className="btn-ghost !px-2 text-rose"
                                        onClick={() => {
                                          patch(
                                            "program",
                                            data.program.filter((row) => row.id !== item.id),
                                          );
                                          if (expanded === item.id) setExpanded(null);
                                        }}
                                        aria-label="Remove"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {isOpen ? (
                                    <div className="mt-2 grid gap-3 border-t border-gold/10 pt-3 md:grid-cols-2">
                                      <div>
                                        <label className="label">Title</label>
                                        <input
                                          className="field"
                                          value={item.title}
                                          onChange={(e) => update(item.id, { title: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <label className="label">Part of the day</label>
                                        <select
                                          className="field"
                                          value={item.section}
                                          onChange={(e) => moveToSection(item.id, e.target.value as ProgramSection)}
                                        >
                                          {PROGRAM_SECTIONS.map((option) => (
                                            <option key={option.id} value={option.id}>
                                              {option.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="label">Who</label>
                                        <input
                                          className="field"
                                          value={item.people}
                                          onChange={(e) => update(item.id, { people: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <label className="label">
                                          {item.tag === "song"
                                            ? "Hymn number / source"
                                            : item.tag === "word"
                                              ? "Scripture reference"
                                              : "Subtitle"}
                                        </label>
                                        <input
                                          className="field"
                                          value={item.subtitle}
                                          onChange={(e) => update(item.id, { subtitle: e.target.value })}
                                        />
                                      </div>
                                      <div className="md:col-span-2">
                                        <label className="label">
                                          {item.tag === "mc"
                                            ? "What the MC says / does"
                                            : item.tag === "song"
                                              ? "Lyrics"
                                              : item.tag === "word"
                                                ? "Reading"
                                                : "Notes"}
                                        </label>
                                        <textarea
                                          className="field min-h-28 whitespace-pre-wrap"
                                          placeholder={
                                            item.tag === "mc"
                                              ? "Exact words to announce, or the action to take…"
                                              : undefined
                                          }
                                          value={item.tag === "mc" ? item.mcNotes || item.body : item.body}
                                          onChange={(e) =>
                                            item.tag === "mc"
                                              ? update(item.id, { mcNotes: e.target.value, body: "" })
                                              : update(item.id, { body: e.target.value })
                                          }
                                        />
                                      </div>
                                      {item.tag !== "mc" ? (
                                        <div className="md:col-span-2">
                                          <label className="label">MC cue (optional)</label>
                                          <textarea
                                            className="field min-h-20 whitespace-pre-wrap"
                                            placeholder="Only if the MC needs a cue during this moment…"
                                            value={item.mcNotes}
                                            onChange={(e) => update(item.id, { mcNotes: e.target.value })}
                                          />
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}

                    {adding === section.id ? (
                      <div className="mt-2 rounded-2xl border border-gold/15 bg-white/50 p-3">
                        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted">Add to {section.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {SECTION_PRESETS[section.id].map((preset) => (
                            <button
                              key={`${preset.tag}-${preset.title}`}
                              className={
                                preset.tag === "mc" ? "btn-sage !py-1" : "btn-ghost !py-1"
                              }
                              onClick={() => addItem(section.id, preset.tag, preset.title)}
                            >
                              {preset.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button className="btn-ghost mt-2 w-full" onClick={() => setAdding(section.id)}>
                        <Plus className="h-4 w-4" /> Add a moment
                      </button>
                    )}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function BulletinHeader({ eyebrow, meta }: { eyebrow: string; meta?: string }) {
  const { data } = useWedding();
  const { settings } = data;

  return (
    <>
      <p className="text-[11px] uppercase tracking-[0.28em] text-gold">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-5xl italic">{coupleLabel(settings)}</h2>
      <p className="mt-3 text-sm text-muted">
        {[
          settings.weddingDate &&
            new Date(`${settings.weddingDate}T12:00:00`).toLocaleDateString(undefined, { dateStyle: "long" }),
          settings.churchName,
          settings.receptionVenue,
          settings.city,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {meta ? <p className="mt-2 text-xs text-muted">{meta}</p> : null}
      <div className="mx-auto my-8 h-px w-24 bg-gold/50" />
    </>
  );
}

function SectionBulletin({
  section,
  className = "",
}: {
  section: ProgramSection;
  className?: string;
}) {
  const { data } = useWedding();
  const meta = PROGRAM_SECTIONS.find((row) => row.id === section);
  const items = data.program.filter((item) => item.section === section);
  const timed = items.filter((item) => item.time).length;
  const rail = SECTION_RAIL[section];

  return (
    <article
      className={`print-sheet card mx-auto max-w-3xl bg-white px-8 py-12 text-center ${className}`}
      data-print-id={printIdForSection(section)}
    >
      <BulletinHeader
        eyebrow={meta?.label ?? "Bulletin"}
        meta={
          items.length === 0
            ? undefined
            : `${items.length} ${items.length === 1 ? "moment" : "moments"}${timed ? ` · ${timeRange(items)}` : ""}`
        }
      />
      {items.length === 0 ? (
        <p className="text-sm text-muted">No moments in this part of the day yet.</p>
      ) : (
        <ol className="relative text-left">
          <span
            className="absolute bottom-4 left-[5.35rem] top-3 w-px"
            style={{ backgroundColor: rail.line }}
            aria-hidden
          />
          {items.map((item, index) => {
            const tagLabel = TAG_BY_ID[item.tag]?.label;
            return (
              <li
                key={item.id}
                className="print-break relative grid grid-cols-[4.75rem_1.5rem_1fr] gap-x-3 pb-7 last:pb-0"
              >
                <p
                  className="pt-0.5 text-right font-serif text-xl tabular-nums leading-none"
                  style={{ color: rail.accent }}
                >
                  {formatTime(item.time) || "—"}
                </p>
                <div className="relative flex justify-center pt-1">
                  <span
                    className="relative z-10 h-3.5 w-3.5 rounded-full border-2 bg-white"
                    style={{ borderColor: rail.accent, backgroundColor: rail.soft }}
                  />
                </div>
                <div className="min-w-0 pb-1">
                  <p
                    className="text-[11px] font-medium uppercase tracking-[0.16em]"
                    style={{ color: rail.accent }}
                  >
                    Moment {index + 1}
                    {tagLabel ? ` · ${tagLabel}` : ""}
                  </p>
                  <h3 className="mt-0.5 font-serif text-2xl leading-tight text-ink">
                    {item.title || "Untitled moment"}
                  </h3>
                  {item.subtitle ? (
                    <p className="mt-1 text-sm italic text-muted">{item.subtitle}</p>
                  ) : null}
                  {item.people ? (
                    <p className="mt-1.5 text-sm text-ink">
                      <span
                        className="mr-2 text-[10px] font-medium uppercase tracking-[0.16em]"
                        style={{ color: rail.accent }}
                      >
                        Who
                      </span>
                      {item.people}
                    </p>
                  ) : null}
                  {item.body ? (
                    <div
                      className="mt-2 rounded-xl px-3 py-2.5"
                      style={{ backgroundColor: rail.soft }}
                    >
                      <p
                        className={`whitespace-pre-wrap text-sm leading-relaxed text-ink ${
                          item.tag === "song" ? "text-center italic" : ""
                        }`}
                      >
                        {item.body}
                      </p>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}

function mcCue(item: ProgramItem): string {
  return (item.mcNotes || (item.tag === "mc" ? item.body : "")).trim();
}

function isMcRelevant(item: ProgramItem): boolean {
  return item.tag === "mc" || Boolean(mcCue(item));
}

function McBulletin({ className = "" }: { className?: string }) {
  const { data } = useWedding();
  const cues = data.program.filter(isMcRelevant);
  const bySection = PROGRAM_SECTIONS.map((section) => ({
    ...section,
    items: cues.filter((item) => item.section === section.id),
  })).filter((section) => section.items.length > 0);

  return (
    <article
      className={`print-sheet card mx-auto max-w-3xl bg-white px-8 py-12 text-center ${className}`}
      data-print-id="bulletin-mc"
    >
      <BulletinHeader
        eyebrow="For the MC only"
        meta={
          cues.length
            ? `${cues.length} ${cues.length === 1 ? "cue" : "cues"} · your run-of-show`
            : undefined
        }
      />
      {!cues.length ? (
        <p className="mx-auto max-w-sm text-sm text-muted">
          No MC moments yet. In Edit, add an <strong>MC</strong> item, or put a cue on another moment.
        </p>
      ) : (
        bySection.map((section, sectionIndex) => {
          const rail = SECTION_RAIL[section.id];
          const stepOffset = bySection
            .slice(0, sectionIndex)
            .reduce((total, row) => total + row.items.length, 0);
          return (
            <section key={section.id} className="mb-10 text-left last:mb-0">
              <p
                className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em]"
                style={{ color: rail.accent }}
              >
                {section.label}
              </p>
              <ol className="relative">
                <span
                  className="absolute bottom-4 left-[5.35rem] top-3 w-px"
                  style={{ backgroundColor: rail.line }}
                  aria-hidden
                />
                {section.items.map((item, index) => {
                  const step = stepOffset + index + 1;
                  const cue = mcCue(item);
                  return (
                    <li
                      key={item.id}
                      className="print-break relative grid grid-cols-[4.75rem_1.5rem_1fr] gap-x-3 pb-7 last:pb-0"
                    >
                      <p
                        className="pt-0.5 text-right font-serif text-2xl tabular-nums leading-none"
                        style={{ color: rail.accent }}
                      >
                        {formatTime(item.time) || "—"}
                      </p>
                      <div className="relative flex justify-center pt-1.5">
                        <span
                          className="relative z-10 h-3.5 w-3.5 rounded-full border-2 bg-white"
                          style={{ borderColor: rail.accent, backgroundColor: rail.soft }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-[11px] font-medium uppercase tracking-[0.16em]"
                          style={{ color: rail.accent }}
                        >
                          Step {step}
                          {item.tag !== "mc" ? ` · while: ${item.title}` : ""}
                        </p>
                        <h3 className="mt-0.5 font-serif text-2xl leading-tight text-ink">
                          {item.tag === "mc" ? item.title : "MC cue"}
                        </h3>
                        <div
                          className="mt-2 rounded-xl border px-4 py-3"
                          style={{ backgroundColor: rail.soft, borderColor: rail.line }}
                        >
                          <p
                            className="text-[10px] font-medium uppercase tracking-[0.2em]"
                            style={{ color: rail.accent }}
                          >
                            Say or do this
                          </p>
                          <p className="mt-1.5 whitespace-pre-wrap text-lg leading-relaxed text-ink">
                            {cue || "Add what to say in Edit."}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })
      )}
    </article>
  );
}
