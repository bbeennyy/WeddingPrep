/** Print a single sheet in a clean window so browser headers don't show the app title or site URL. */
export function printTarget(id: string): void {
  const source = document.querySelector<HTMLElement>(`[data-print-id="${id}"]`);
  if (!source) {
    document.body.dataset.print = id;
    const cleanup = () => {
      delete document.body.dataset.print;
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.setTimeout(() => window.print(), 50);
    return;
  }

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join("\n");

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }

  doc.open();
  doc.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title></title>
    ${styles}
    <style>
      @page { margin: 12mm; }
      html, body {
        margin: 0;
        padding: 0;
        background: white !important;
        background-image: none !important;
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .print-sheet {
        box-shadow: none !important;
        border: none !important;
        background: white !important;
        max-width: none !important;
        margin: 0 !important;
      }
      .print-break {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    </style>
  </head>
  <body></body>
</html>`);
  doc.close();

  const clone = source.cloneNode(true) as HTMLElement;
  clone.classList.remove("print-only");
  clone.style.display = "block";
  clone.style.visibility = "visible";
  clone.style.position = "static";
  clone.style.width = "100%";
  clone.style.margin = "0";
  doc.body.appendChild(clone);

  const finish = () => {
    frame.remove();
  };

  const trigger = () => {
    const win = frame.contentWindow;
    if (!win) {
      finish();
      return;
    }
    win.focus();
    win.addEventListener("afterprint", finish);
    // Fallback if afterprint never fires
    window.setTimeout(finish, 60_000);
    win.print();
  };

  // Give styles a moment to apply inside the iframe
  window.setTimeout(trigger, 100);
}
