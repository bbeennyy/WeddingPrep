/** Set a print target, open the browser print dialog, then clear it. Save as PDF from there. */
export function printTarget(id: string): void {
  document.body.dataset.print = id;
  const cleanup = () => {
    delete document.body.dataset.print;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.setTimeout(() => window.print(), 50);
}
