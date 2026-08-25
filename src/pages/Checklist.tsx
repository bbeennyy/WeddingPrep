import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CHECKLIST_CATEGORIES } from "../constants";
import { useWedding } from "../context";
import { ownerName, uid } from "../defaults";
import type { ChecklistItem, Owner, Subtask } from "../types";
import { EmptyState, Modal } from "../components/Ui";

const emptyItem = (): Omit<ChecklistItem, "id"> => ({
  title: "",
  category: "Other",
  done: false,
  owner: "both",
  dueDate: "",
  notes: "",
  subtasks: [],
});

function subtaskProgress(item: ChecklistItem): string | null {
  if (!item.subtasks.length) return null;
  const done = item.subtasks.filter((step) => step.done).length;
  return `${done} of ${item.subtasks.length} steps`;
}

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
    const next = {
      ...draft,
      title: draft.title.trim(),
      subtasks: draft.subtasks.filter((step) => step.title.trim()),
    };
    if (editingId) {
      patch(
        "checklist",
        data.checklist.map((item) => (item.id === editingId ? { ...next, id: editingId } : item)),
      );
    } else {
      patch("checklist", [...data.checklist, { ...next, id: uid() }]);
    }
    setDraft(null);
    setEditingId(null);
  }

  function updateItem(id: string, next: ChecklistItem) {
    patch(
      "checklist",
      data.checklist.map((row) => (row.id === id ? next : row)),
    );
  }

  const doneCount = data.checklist.filter((item) => item.done).length;
  const openSubtasks = data.checklist.reduce(
    (sum, item) => sum + item.subtasks.filter((step) => !step.done).length,
    0,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">Checklist</h1>
          <p className="mt-1 text-sm text-muted">
            {doneCount} of {data.checklist.length} done
            {openSubtasks ? ` · ${openSubtasks} open steps` : ""}
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
                <TaskRow
                  key={item.id}
                  item={item}
                  ownerLabel={ownerName(data.settings, item.owner)}
                  onChange={(next) => updateItem(item.id, next)}
                  onEdit={() => {
                    const { id, ...rest } = item;
                    setEditingId(id);
                    setDraft(rest);
                  }}
                  onDelete={() =>
                    patch(
                      "checklist",
                      data.checklist.filter((row) => row.id !== item.id),
                    )
                  }
                />
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
            <SubtaskEditor
              subtasks={draft.subtasks}
              onChange={(subtasks) => setDraft({ ...draft, subtasks })}
            />
            <button className="btn-primary w-full" onClick={saveDraft}>
              Save task
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function TaskRow({
  item,
  ownerLabel,
  onChange,
  onEdit,
  onDelete,
}: {
  item: ChecklistItem;
  ownerLabel: string;
  onChange: (item: ChecklistItem) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [step, setStep] = useState("");
  const progress = subtaskProgress(item);

  function addStep() {
    const title = step.trim();
    if (!title) return;
    onChange({
      ...item,
      subtasks: [...item.subtasks, { id: uid(), title, done: false }],
    });
    setStep("");
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-sage"
          checked={item.done}
          onChange={() => onChange({ ...item, done: !item.done })}
        />
        <button className="min-w-0 flex-1 text-left" onClick={onEdit}>
          <p className={`text-sm ${item.done ? "text-muted line-through" : ""}`}>{item.title}</p>
          <p className="mt-1 text-xs text-muted">
            {ownerLabel}
            {item.dueDate ? ` · due ${item.dueDate}` : ""}
            {progress ? ` · ${progress}` : ""}
          </p>
        </button>
        <button className="text-muted hover:text-rose" aria-label="Delete task" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="ml-7 mt-2 space-y-1.5">
        {item.subtasks.map((sub) => (
          <div key={sub.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-sage"
              checked={sub.done}
              onChange={() =>
                onChange({
                  ...item,
                  subtasks: item.subtasks.map((row) => (row.id === sub.id ? { ...row, done: !row.done } : row)),
                })
              }
            />
            <p className={`min-w-0 flex-1 text-sm ${sub.done ? "text-muted line-through" : "text-ink/80"}`}>{sub.title}</p>
            <button
              className="text-muted hover:text-rose"
              aria-label={`Delete ${sub.title}`}
              onClick={() =>
                onChange({
                  ...item,
                  subtasks: item.subtasks.filter((row) => row.id !== sub.id),
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addStep();
          }}
        >
          <input
            className="field !py-1 text-sm"
            placeholder="Add a step"
            value={step}
            onChange={(e) => setStep(e.target.value)}
          />
          <button type="submit" className="btn-ghost !px-2 !py-1" disabled={!step.trim()} aria-label="Add step">
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function SubtaskEditor({
  subtasks,
  onChange,
}: {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
}) {
  const [step, setStep] = useState("");

  function addStep() {
    const title = step.trim();
    if (!title) return;
    onChange([...subtasks, { id: uid(), title, done: false }]);
    setStep("");
  }

  return (
    <div>
      <label className="label">Steps</label>
      <div className="space-y-1.5">
        {subtasks.map((sub) => (
          <div key={sub.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-sage"
              checked={sub.done}
              onChange={() =>
                onChange(subtasks.map((row) => (row.id === sub.id ? { ...row, done: !row.done } : row)))
              }
            />
            <input
              className="field !py-1 text-sm"
              value={sub.title}
              onChange={(e) =>
                onChange(subtasks.map((row) => (row.id === sub.id ? { ...row, title: e.target.value } : row)))
              }
            />
            <button
              className="text-muted hover:text-rose"
              aria-label="Delete step"
              onClick={() => onChange(subtasks.filter((row) => row.id !== sub.id))}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addStep();
          }}
        >
          <input
            className="field !py-1 text-sm"
            placeholder="Add a step"
            value={step}
            onChange={(e) => setStep(e.target.value)}
          />
          <button type="submit" className="btn-ghost !px-2 !py-1" disabled={!step.trim()}>
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
