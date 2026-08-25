import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Check, ListTodo, Plus, Trash2, X } from "lucide-react";
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

function subtaskCounts(item: ChecklistItem) {
  const total = item.subtasks.length;
  const done = item.subtasks.filter((step) => step.done).length;
  return { done, total };
}

export function ChecklistPage() {
  const { data, patch } = useWedding();
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [category, setCategory] = useState("all");
  const [draft, setDraft] = useState<Omit<ChecklistItem, "id"> | null>(null);
  const [draftStep, setDraftStep] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const draftRef = useRef(draft);
  const draftStepRef = useRef(draftStep);
  draftRef.current = draft;
  draftStepRef.current = draftStep;

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

  function saveDraft(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const current = draftRef.current;
    if (!current?.title.trim()) return;
    const fromForm = event
      ? String(new FormData(event.currentTarget).get("newStep") ?? "")
      : "";
    const pending = fromForm.trim() || draftStepRef.current.trim();
    const next = {
      ...current,
      title: current.title.trim(),
      subtasks: [
        ...current.subtasks.filter((step) => step.title.trim()),
        ...(pending ? [{ id: uid(), title: pending, done: false }] : []),
      ],
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
    setDraftStep("");
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
            {openSubtasks ? ` · ${openSubtasks} open subtasks` : ""}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingId(null);
            setDraftStep("");
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
                    setDraftStep("");
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
            setDraftStep("");
            setEditingId(null);
          }}
        >
          <form className="space-y-3" onSubmit={saveDraft}>
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
              onChange={(subtasks) => setDraft((current) => (current ? { ...current, subtasks } : current))}
              pending={draftStep}
              onPendingChange={(value) => {
                draftStepRef.current = value;
                setDraftStep(value);
              }}
            />
            <button className="btn-primary w-full" type="submit">
              Save task
            </button>
          </form>
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
  const { done, total } = subtaskCounts(item);

  function updateSubtasks(subtasks: Subtask[]) {
    onChange({ ...item, subtasks });
  }

  function addStep() {
    const title = step.trim();
    if (!title) return;
    updateSubtasks([...item.subtasks, { id: uid(), title, done: false }]);
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
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span>
              {ownerLabel}
              {item.dueDate ? ` · due ${item.dueDate}` : ""}
            </span>
            {total > 0 ? (
              <span className="inline-flex items-center gap-1 text-muted">
                <ListTodo className="h-3 w-3" />
                {done}/{total}
              </span>
            ) : null}
          </p>
        </button>
        <button className="text-muted hover:text-rose" aria-label="Delete task" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <SubtaskList
        subtasks={item.subtasks}
        pending={step}
        onPendingChange={setStep}
        onSubmit={addStep}
        onChange={updateSubtasks}
      />
    </div>
  );
}

function SubtaskEditor({
  subtasks,
  onChange,
  pending,
  onPendingChange,
}: {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
  pending: string;
  onPendingChange: (value: string) => void;
}) {
  const { done, total } = {
    done: subtasks.filter((step) => step.done).length,
    total: subtasks.length,
  };

  function addStep() {
    const title = pending.trim();
    if (!title) return;
    onChange([...subtasks, { id: uid(), title, done: false }]);
    onPendingChange("");
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="label !mb-0">Subtasks</label>
        {total > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
            <ListTodo className="h-3 w-3" />
            {done}/{total}
          </span>
        ) : null}
      </div>
      <SubtaskList
        subtasks={subtasks}
        pending={pending}
        onPendingChange={onPendingChange}
        onSubmit={addStep}
        onChange={onChange}
        inputName="newStep"
        className="ml-0 mt-1 border-l-0 pl-0"
      />
    </div>
  );
}

function SubtaskList({
  subtasks,
  pending,
  onPendingChange,
  onSubmit,
  onChange,
  inputName,
  className = "",
}: {
  subtasks: Subtask[];
  pending: string;
  onPendingChange: (value: string) => void;
  onSubmit: () => void;
  onChange: (subtasks: Subtask[]) => void;
  inputName?: string;
  className?: string;
}) {
  return (
    <div className={`ml-[26px] mt-1 border-l border-gold/20 pl-3 ${className}`}>
      {subtasks.map((sub) => (
        <SubtaskRow
          key={sub.id}
          sub={sub}
          onToggle={() =>
            onChange(subtasks.map((row) => (row.id === sub.id ? { ...row, done: !row.done } : row)))
          }
          onRename={(title) =>
            onChange(subtasks.map((row) => (row.id === sub.id ? { ...row, title } : row)))
          }
          onDelete={() => onChange(subtasks.filter((row) => row.id !== sub.id))}
        />
      ))}
      <AddSubtaskRow
        value={pending}
        onChange={onPendingChange}
        onSubmit={onSubmit}
        inputName={inputName}
      />
    </div>
  );
}

function SubtaskRow({
  sub,
  onToggle,
  onRename,
  onDelete,
}: {
  sub: Subtask;
  onToggle: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="group -ml-1 flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-ink/[0.04]">
      <RoundCheck checked={sub.done} onToggle={onToggle} label={sub.title} />
      <input
        className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${
          sub.done ? "text-muted line-through" : "text-ink"
        }`}
        value={sub.title}
        onChange={(e) => onRename(e.target.value)}
        onBlur={() => {
          if (!sub.title.trim()) onDelete();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
      />
      <button
        type="button"
        className="rounded p-0.5 text-muted opacity-50 hover:text-rose md:opacity-0 md:transition md:group-hover:opacity-100"
        aria-label={`Delete ${sub.title}`}
        onClick={onDelete}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AddSubtaskRow({
  value,
  onChange,
  onSubmit,
  inputName,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  inputName?: string;
}) {
  const [open, setOpen] = useState(Boolean(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const keepingFocus = useRef(false);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit() {
    if (!value.trim()) return;
    keepingFocus.current = true;
    onSubmit();
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      keepingFocus.current = false;
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        className="-ml-1 flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left text-sm text-muted transition hover:bg-ink/[0.04] hover:text-ink"
        onClick={() => setOpen(true)}
      >
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        Add subtask
      </button>
    );
  }

  return (
    <div className="-ml-1 flex items-center gap-2.5 rounded-lg px-1 py-1.5">
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-muted">
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <input
        ref={inputRef}
        name={inputName}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70"
        placeholder="Write a subtask"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            submit();
          }
          if (event.key === "Escape") {
            onChange("");
            setOpen(false);
          }
        }}
        onBlur={() => {
          if (keepingFocus.current) return;
          if (!value.trim()) setOpen(false);
        }}
      />
    </div>
  );
}

function RoundCheck({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition ${
        checked ? "border-sage bg-sage text-white" : "border-ink/30 bg-white/80 hover:border-sage"
      }`}
    >
      {checked ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
    </button>
  );
}
