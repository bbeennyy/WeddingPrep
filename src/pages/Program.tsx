import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Printer, Trash2 } from "lucide-react";
import { PROGRAM_TAGS, TAG_BY_ID } from "../constants";
import { useWedding } from "../context";
import { coupleLabel, uid } from "../defaults";
import type { ProgramItem, ProgramTag } from "../types";

const tagTone: Record<string, string> = {
  music: "bg-rose-soft text-rose",
  movement: "bg-gold-soft text-gold",
  word: "bg-sage-soft text-sage",
  covenant: "bg-rose-soft text-rose",
  presbyterian: "bg-sage-soft text-sage",
};

export function ProgramPage() {
  const { data, patch } = useWedding();
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [adding, setAdding] = useState(false);

  function update(id: string, next: Partial<ProgramItem>) {
    patch(
      "program",
      data.program.map((item) => (item.id === id ? { ...item, ...next } : item)),
    );
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...data.program];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    patch("program", next);
  }

  function addTag(tag: ProgramTag) {
    const meta = TAG_BY_ID[tag];
    const item: ProgramItem = {
      id: uid(),
      tag,
      title: meta.label,
      subtitle: tag === "song" ? "Hymn / title" : "",
      body: tag === "song" ? "Paste lyrics here.\n\nVerse 1\n\nVerse 2" : "",
      people: "",
    };
    patch("program", [...data.program, item]);
    setAdding(false);
  }

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">Church program</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Build the ceremony flow yourself. Songs keep lyrics, the Word keeps the reading, procession keeps who walks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={mode === "edit" ? "btn-primary" : "btn-ghost"} onClick={() => setMode("edit")}>
            Edit
          </button>
          <button className={mode === "preview" ? "btn-primary" : "btn-ghost"} onClick={() => setMode("preview")}>
            Bulletin
          </button>
          <button className="btn-ghost" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      <div className={mode === "preview" ? "block" : "print-only"}>
        <Bulletin />
      </div>

      {mode === "edit" ? (
        <div className="no-print space-y-3">
          {data.program.map((item, index) => (
            <article key={item.id} className="card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className={`tag ${tagTone[TAG_BY_ID[item.tag].group]}`}>{TAG_BY_ID[item.tag].label}</span>
                <div className="flex gap-1">
                  <button className="btn-ghost !px-2" onClick={() => move(index, -1)} aria-label="Move up">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button className="btn-ghost !px-2" onClick={() => move(index, 1)} aria-label="Move down">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    className="btn-ghost !px-2 text-rose"
                    onClick={() => patch("program", data.program.filter((row) => row.id !== item.id))}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="label">Title in the program</label>
                  <input className="field" value={item.title} onChange={(e) => update(item.id, { title: e.target.value })} />
                </div>
                <div>
                  <label className="label">
                    {item.tag === "song"
                      ? "Hymn number / source"
                      : item.tag === "word"
                        ? "Scripture reference"
                        : "Subtitle"}
                  </label>
                  <input className="field" value={item.subtitle} onChange={(e) => update(item.id, { subtitle: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Who</label>
                  <input
                    className="field"
                    placeholder={
                      item.tag === "procession" || item.tag === "recession"
                        ? "Walking order"
                        : item.tag === "song"
                          ? "Congregation, choir, soloist…"
                          : "Minister, couple, reader…"
                    }
                    value={item.people}
                    onChange={(e) => update(item.id, { people: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">
                    {item.tag === "song" ? "Lyrics" : item.tag === "word" ? "Reading" : "Words / notes"}
                  </label>
                  <textarea
                    className="field min-h-32 whitespace-pre-wrap"
                    value={item.body}
                    onChange={(e) => update(item.id, { body: e.target.value })}
                  />
                </div>
              </div>
            </article>
          ))}

          {adding ? (
            <div className="card p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">Add a point in the ceremony</p>
              <div className="flex flex-wrap gap-2">
                {PROGRAM_TAGS.map((tag) => (
                  <button key={tag.id} className="btn-ghost !py-1" onClick={() => addTag(tag.id)} title={tag.hint}>
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button className="btn-sage w-full" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> Add a ceremony point
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Bulletin() {
  const { data } = useWedding();
  const { settings, program } = data;

  return (
    <article className="print-sheet card mx-auto max-w-2xl px-8 py-12 text-center">
      <p className="text-[11px] uppercase tracking-[0.28em] text-gold">The marriage service</p>
      <h2 className="mt-3 font-serif text-5xl italic">{coupleLabel(settings)}</h2>
      <p className="mt-3 text-sm text-muted">
        {[settings.weddingDate && new Date(`${settings.weddingDate}T12:00:00`).toLocaleDateString(undefined, { dateStyle: "long" }), settings.churchName, settings.city]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <div className="mx-auto my-8 h-px w-24 bg-gold/50" />
      <ol className="space-y-8 text-left">
        {program.map((item) => (
          <li key={item.id}>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{TAG_BY_ID[item.tag].label}</p>
            <h3 className="font-serif text-2xl">{item.title}</h3>
            {item.subtitle ? <p className="text-sm italic text-muted">{item.subtitle}</p> : null}
            {item.people ? <p className="text-sm text-muted">{item.people}</p> : null}
            {item.body ? (
              <p className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${item.tag === "song" ? "text-center italic" : ""}`}>
                {item.body}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </article>
  );
}
