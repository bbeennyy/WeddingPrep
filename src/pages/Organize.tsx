import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useWedding } from "../context";
import { money, uid } from "../defaults";
import type { BudgetItem, NoteCard, Vendor, VendorStatus } from "../types";
import { EmptyState, Modal } from "../components/Ui";
import { PhotoShotsPanel } from "./Photos";

const vendorStatuses: VendorStatus[] = ["researching", "contacted", "booked", "paid"];

export function OrganizePage() {
  const { data, patch } = useWedding();
  const [tab, setTab] = useState<"vendors" | "budget" | "notes" | "photos">("vendors");
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [note, setNote] = useState<NoteCard | null>(null);

  const spent = data.budget.reduce((sum, row) => sum + (row.actual || 0), 0);
  const planned = data.budget.reduce((sum, row) => sum + (row.estimate || 0), 0);
  const overBudget = Boolean(data.settings.totalBudget) && planned > data.settings.totalBudget;

  return (
    <div className="space-y-5">
      <div className="no-print">
        <h1 className="font-serif text-4xl">Organize</h1>
        <p className="mt-1 text-sm text-muted">Vendors, money, notes, and the photographer’s shot list.</p>
      </div>

      <div className="no-print flex flex-wrap gap-2">
        {(["vendors", "budget", "notes", "photos"] as const).map((key) => (
          <button key={key} className={tab === key ? "btn-primary !py-1" : "btn-ghost !py-1"} onClick={() => setTab(key)}>
            {key === "vendors" ? "Vendors" : key === "budget" ? "Budget" : key === "notes" ? "Notes" : "Photographer"}
          </button>
        ))}
      </div>

      {tab === "vendors" ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              className="btn-primary"
              onClick={() =>
                setVendor({ id: uid(), name: "", role: "", contact: "", status: "researching", notes: "" })
              }
            >
              <Plus className="h-4 w-4" /> Add vendor
            </button>
          </div>
          {data.vendors.length === 0 ? (
            <EmptyState title="No vendors yet" body="Photographer, florist, baker, musician, caterer — keep their details here." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {data.vendors.map((row) => (
                <button key={row.id} className="card p-4 text-left" onClick={() => setVendor(row)}>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-gold">{row.role || "Vendor"}</p>
                  <h3 className="mt-1 font-serif text-2xl">{row.name || "Untitled"}</h3>
                  <p className="mt-2 text-sm text-muted">{row.contact || "No contact yet"}</p>
                  <span className="tag mt-3 bg-sage-soft text-sage">{row.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === "budget" ? (
        <div className="space-y-3">
          <div className="card grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            <div>
              <label className="label">Total we can spend</label>
              <div className="flex items-center gap-1">
                <span className="font-serif text-2xl text-muted">{data.settings.currency}</span>
                <input
                  className="field font-serif text-2xl"
                  type="number"
                  min={0}
                  value={data.settings.totalBudget || ""}
                  placeholder="0"
                  onChange={(e) =>
                    patch("settings", {
                      ...data.settings,
                      totalBudget: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </div>
            </div>
            <div>
              <p className="label">Planned</p>
              <p className="font-serif text-3xl">{money(planned, data.settings.currency)}</p>
            </div>
            <div>
              <p className="label">Actual</p>
              <p className="font-serif text-3xl">{money(spent, data.settings.currency)}</p>
            </div>
            <div>
              <p className="label">{data.settings.totalBudget ? "Left to allocate" : "Difference"}</p>
              <p className={`font-serif text-3xl ${overBudget ? "text-rose" : ""}`}>
                {money(
                  data.settings.totalBudget ? data.settings.totalBudget - planned : planned - spent,
                  data.settings.currency,
                )}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              className="btn-primary"
              onClick={() =>
                patch("budget", [
                  ...data.budget,
                  { id: uid(), name: "New item", category: "Other", estimate: 0, actual: 0, paid: false },
                ])
              }
            >
              <Plus className="h-4 w-4" /> Add line
            </button>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Estimate</th>
                  <th className="px-3 py-2">Actual</th>
                  <th className="px-3 py-2">Paid</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.budget.map((row) => (
                  <BudgetRow
                    key={row.id}
                    row={row}
                    onChange={(next) =>
                      patch(
                        "budget",
                        data.budget.map((item) => (item.id === row.id ? next : item)),
                      )
                    }
                    onDelete={() => patch("budget", data.budget.filter((item) => item.id !== row.id))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "photos" ? <PhotoShotsPanel /> : null}

      {tab === "notes" ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setNote({ id: uid(), title: "", body: "" })}>
              <Plus className="h-4 w-4" /> Add note
            </button>
          </div>
          {data.notes.length === 0 ? (
            <EmptyState title="No notes" body="Dump ideas, measurements, family requests, and half-decisions here." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {data.notes.map((row) => (
                <button key={row.id} className="card p-4 text-left" onClick={() => setNote(row)}>
                  <h3 className="font-serif text-2xl">{row.title || "Untitled note"}</h3>
                  <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-muted">{row.body}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {vendor ? (
        <Modal title={vendor.name || "Vendor"} onClose={() => setVendor(null)}>
          <div className="space-y-3">
            <input className="field" placeholder="Name" value={vendor.name} onChange={(e) => setVendor({ ...vendor, name: e.target.value })} />
            <input className="field" placeholder="Role (florist, photographer…)" value={vendor.role} onChange={(e) => setVendor({ ...vendor, role: e.target.value })} />
            <input className="field" placeholder="Contact" value={vendor.contact} onChange={(e) => setVendor({ ...vendor, contact: e.target.value })} />
            <select
              className="field"
              value={vendor.status}
              onChange={(e) => setVendor({ ...vendor, status: e.target.value as VendorStatus })}
            >
              {vendorStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <textarea className="field min-h-24" placeholder="Notes" value={vendor.notes} onChange={(e) => setVendor({ ...vendor, notes: e.target.value })} />
            <div className="flex gap-2">
              <button
                className="btn-primary flex-1"
                onClick={() => {
                  const exists = data.vendors.some((row) => row.id === vendor.id);
                  patch("vendors", exists ? data.vendors.map((row) => (row.id === vendor.id ? vendor : row)) : [...data.vendors, vendor]);
                  setVendor(null);
                }}
              >
                Save
              </button>
              <button
                className="btn-ghost text-rose"
                onClick={() => {
                  patch("vendors", data.vendors.filter((row) => row.id !== vendor.id));
                  setVendor(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {note ? (
        <Modal title={note.title || "Note"} onClose={() => setNote(null)}>
          <div className="space-y-3">
            <input className="field" placeholder="Title" value={note.title} onChange={(e) => setNote({ ...note, title: e.target.value })} />
            <textarea className="field min-h-40" placeholder="Write here" value={note.body} onChange={(e) => setNote({ ...note, body: e.target.value })} />
            <div className="flex gap-2">
              <button
                className="btn-primary flex-1"
                onClick={() => {
                  const exists = data.notes.some((row) => row.id === note.id);
                  patch("notes", exists ? data.notes.map((row) => (row.id === note.id ? note : row)) : [...data.notes, note]);
                  setNote(null);
                }}
              >
                Save
              </button>
              <button
                className="btn-ghost text-rose"
                onClick={() => {
                  patch("notes", data.notes.filter((row) => row.id !== note.id));
                  setNote(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function BudgetRow({
  row,
  onChange,
  onDelete,
}: {
  row: BudgetItem;
  onChange: (row: BudgetItem) => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-t border-gold/10">
      <td className="px-3 py-2">
        <input className="field" value={row.name} onChange={(e) => onChange({ ...row, name: e.target.value })} />
      </td>
      <td className="px-3 py-2">
        <input className="field" value={row.category} onChange={(e) => onChange({ ...row, category: e.target.value })} />
      </td>
      <td className="px-3 py-2">
        <input
          className="field"
          type="number"
          value={row.estimate}
          onChange={(e) => onChange({ ...row, estimate: Number(e.target.value) })}
        />
      </td>
      <td className="px-3 py-2">
        <input
          className="field"
          type="number"
          value={row.actual}
          onChange={(e) => onChange({ ...row, actual: Number(e.target.value) })}
        />
      </td>
      <td className="px-3 py-2">
        <input type="checkbox" className="accent-sage" checked={row.paid} onChange={(e) => onChange({ ...row, paid: e.target.checked })} />
      </td>
      <td className="px-3 py-2">
        <button className="text-muted hover:text-rose" onClick={onDelete} aria-label="Delete line">
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
