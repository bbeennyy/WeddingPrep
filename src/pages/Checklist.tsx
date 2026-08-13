import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CHECKLIST_CATEGORIES } from "../constants";
import { useWedding } from "../context";
import { ownerName, uid } from "../defaults";
import type { ChecklistItem, Owner } from "../types";
import { EmptyState, Modal } from "../components/Ui";

const emptyItem = (): Omit<ChecklistItem, "id"> => ({
  title: "",
  category: "Other",
  done: false,
  owner: "both",
  dueDate: "",
  notes: "",
});

export function ChecklistPage() {
  const { data, patch } = useWedding();
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [category, setCategory] = useState("all");
  const [draft, setDraft] = useState<Omit<ChecklistItem, "id"> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const items = useMemo(() => {
    return data.checklist.filter((item) => {
      if (filter === "open" && item.done) return false;
      if (filter === "done" && !item.done) return false;
      if (category !== "all" && item.category !== category) return false;
      return true;
    });
  }, [data.checklist, filter, category]);

  const grouped = CHECKLIST_CATEGORIES.map((cat) => ({
    cat,
    items: items.filter((item) => item.category === cat),
  })).filter((group) => group.items.length);

  function saveDraft() {
    if (!draft?.title.trim()) return;
    if (editingId) {
      patch(
        "checklist",
        data.checklist.map((item) => (item.id === editingId ? { ...draft, id: editingId } : item)),
      );
    } else {
      patch("checklist", [...data.checklist, { ...draft, id: uid() }]);
    }
    setDraft(null);
    setEditingId(null);
  }

  const doneCount = data.checklist.filter((item) => item.done).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">Checklist</h1>
          <p className="mt-1 text-sm text-muted">
            {doneCount} of {data.checklist.length} done
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingId(null);
            setDraft(emptyItem());
          }}
        >
          <Plus className="h-4 w-4" /> Add task
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "open", "done"] as const).map((key) => (
          <button
            key={key}
            className={filter === key ? "btn-primary !py-1" : "btn-ghost !py-1"}
            onClick={() => setFilter(key)}
          >
            {key === "all" ? "All" : key === "open" ? "To do" : "Done"}
          </button>
        ))}
        <select className="field max-w-[10rem]" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Every category</option>
          {CHECKLIST_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {grouped.length === 0 ? (
        <EmptyState title="Nothing here yet" body="Add a task, or switch filters to see the rest of your list." />
      ) : (
        grouped.map((group) => (
          <section key={group.cat} className="space-y-2">
            <h2 className="text-xs uppercase tracking-[0.18em] text-muted">{group.cat}</h2>
            <div className="card divide-y divide-gold/10 overflow-hidden">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-sage"
                    checked={item.done}
                    onChange={() =>
                      patch(
                        "checklist",
                        data.checklist.map((row) =>
                          row.id === item.id ? { ...row, done: !row.done } : row,
                        ),
                      )
                    }
                  />
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      const { id, ...rest } = item;
                      setEditingId(id);
                      setDraft(rest);
                    }}
                  >
                    <p className={`text-sm ${item.done ? "text-muted line-through" : ""}`}>{item.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {ownerName(data.settings, item.owner)}
                      {item.dueDate ? ` · due ${item.dueDate}` : ""}
                    </p>
                  </button>
                  <button
                    className="text-muted hover:text-rose"
                    aria-label="Delete task"
                    onClick={() =>
                      patch(
                        "checklist",
                        data.checklist.filter((row) => row.id !== item.id),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {draft ? (
        <Modal
          title={editingId ? "Edit task" : "New task"}
          onClose={() => {
            setDraft(null);
            setEditingId(null);
          }}
        >
          <div className="space-y-3">
            <div>
              <label className="label">What needs doing</label>
              <input className="field" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Category</label>
                <select className="field" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                  {CHECKLIST_CATEGORIES.map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Who</label>
                <select
                  className="field"
                  value={draft.owner}
                  onChange={(e) => setDraft({ ...draft, owner: e.target.value as Owner })}
                >
                  <option value="a">{ownerName(data.settings, "a")}</option>
                  <option value="b">{ownerName(data.settings, "b")}</option>
                  <option value="both">Together</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Due date</label>
              <input className="field" type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="field min-h-24" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </div>
            <button className="btn-primary w-full" onClick={saveDraft}>
              Save task
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
