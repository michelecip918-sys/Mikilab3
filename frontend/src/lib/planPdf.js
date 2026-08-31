import { jsPDF } from "jspdf";

// Genera un PDF elegante e brandizzato del Piano di Produzione (logo MikiLab, banda arancione,
// titoli, liste, tabella infornate, note del fornaio, footer con pagina). Testo selezionabile.
const ORANGE = [255, 107, 0];
const DARK = [43, 48, 59];
const GREY = [110, 138, 147];
const NOTE_BG = [255, 243, 232];
const ALT_BG = [255, 247, 240];

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{20E3}\u{2000}-\u{206F}]/gu;

// Ripulisce il markdown (grassetto, apici, link, emoji) mantenendo il testo leggibile.
const clean = (s) =>
  (s || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .replace(/(^|\s)\*(\S)/g, "$1$2")
    .replace(EMOJI, "")
    .replace(/\s{2,}/g, " ")
    .trim();

async function loadImage(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const DISCLAIMER = {
  it: "Piano generato dall'IA a scopo indicativo. Tempi, temperature e idratazione vanno sempre validati dal fornaio in base a farina, ambiente e attrezzatura.",
  de: "KI-generierter Plan als Richtwert. Zeiten, Temperaturen und Hydratation müssen stets vom Bäcker anhand von Mehl, Umgebung und Ausstattung geprüft werden.",
  en: "AI-generated plan for guidance only. Times, temperatures and hydration must always be validated by the baker based on flour, environment and equipment.",
  es: "Plan generado por IA a título orientativo. Los tiempos, temperaturas e hidratación deben ser validados siempre por el panadero.",
  fr: "Plan généré par IA à titre indicatif. Les temps, températures et hydratation doivent toujours être validés par le boulanger.",
};
const NOTE_LABEL = { it: "Note del fornaio", de: "Notizen des Bäckers", en: "Baker's notes", es: "Notas del panadero", fr: "Notes du boulanger" };

export async function exportPlanPdf({ title = "Piano di Produzione", plan = "", bakerNote = "", lang = "it", fileName = "piano-produzione-mikilab.pdf", logoUrl } = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentW = pageW - margin * 2;

  const base = process.env.PUBLIC_URL || "";
  const logo = await loadImage(logoUrl || `${base}/logo-256.png`);
  const locale = { de: "de-DE", en: "en-GB", es: "es-ES", fr: "fr-FR" }[lang] || "it-IT";
  const dateStr = new Date().toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });

  let y = margin;
  let pageNum = 1;

  const drawHeader = () => {
    let hy = margin;
    if (logo) {
      try { doc.addImage(logo, "PNG", margin, hy, 34, 34); } catch { /* */ }
    }
    const tx = margin + (logo ? 46 : 0);
    doc.setTextColor(...DARK); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
    doc.text("MikiLab", tx, hy + 16);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...GREY);
    doc.text(`${title} · ${dateStr}`, tx, hy + 30);
    hy += 40;
    doc.setDrawColor(...ORANGE); doc.setLineWidth(2);
    doc.line(margin, hy, pageW - margin, hy);
    return hy + 18;
  };

  const drawFooter = () => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GREY);
    doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.5);
    doc.line(margin, pageH - 30, pageW - margin, pageH - 30);
    doc.text("MikiLab · mikilab.de", margin, pageH - 18);
    doc.text(String(pageNum), pageW - margin, pageH - 18, { align: "right" });
  };

  const newPage = () => { drawFooter(); doc.addPage(); pageNum += 1; y = drawHeader(); };
  const ensure = (h) => { if (y + h > pageH - 42) newPage(); };

  y = drawHeader();

  // Riquadro Note del fornaio
  if (bakerNote && bakerNote.trim()) {
    const label = (NOTE_LABEL[lang] || NOTE_LABEL.it).toUpperCase();
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(clean(bakerNote), contentW - 20);
    const boxH = 26 + noteLines.length * 12;
    ensure(boxH + 8);
    doc.setFillColor(...NOTE_BG); doc.setDrawColor(...ORANGE); doc.setLineWidth(0.8);
    doc.roundedRect(margin, y, contentW, boxH, 6, 6, "FD");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(...ORANGE);
    doc.text(label, margin + 10, y + 15);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...DARK);
    doc.text(noteLines, margin + 10, y + 29);
    y += boxH + 16;
  }

  const drawTable = (header, rows) => {
    const cols = header.length || (rows[0] || []).length;
    if (!cols) return;
    const colW = contentW / cols;
    const pad = 4;
    const lineH = 11;
    doc.setFontSize(8.5);

    const rowH = (cells) => {
      let maxLines = 1;
      cells.forEach((c) => { const l = doc.splitTextToSize(clean(c), colW - pad * 2); maxLines = Math.max(maxLines, l.length); });
      return maxLines * lineH + pad * 2;
    };
    const drawRow = (cells, opts = {}) => {
      const h = rowH(cells);
      ensure(h);
      if (opts.header) { doc.setFillColor(...ORANGE); doc.rect(margin, y, contentW, h, "F"); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); }
      else { if (opts.alt) { doc.setFillColor(...ALT_BG); doc.rect(margin, y, contentW, h, "F"); } doc.setTextColor(...DARK); doc.setFont("helvetica", "normal"); }
      doc.setDrawColor(225, 225, 225); doc.setLineWidth(0.5);
      doc.rect(margin, y, contentW, h);
      cells.forEach((c, ci) => {
        const x = margin + ci * colW;
        if (ci > 0) doc.line(x, y, x, y + h);
        const l = doc.splitTextToSize(clean(c), colW - pad * 2);
        doc.text(l, x + pad, y + pad + 7);
      });
      y += h;
    };
    if (header.length) drawRow(header, { header: true });
    rows.forEach((r, idx) => {
      const padded = header.length ? header.map((_, k) => r[k] ?? "") : r;
      drawRow(padded, { alt: idx % 2 === 1 });
    });
    y += 12;
  };

  const lines = (plan || "").split("\n");
  let i = 0;
  const isSep = (r) => r.every((c) => /^:?-{2,}:?$/.test((c || "").replace(/\s/g, "")) || c === "");

  while (i < lines.length) {
    const raw = (lines[i] || "").trim();
    if (raw === "") { y += 6; i++; continue; }

    // Tabella markdown
    if (raw.startsWith("|")) {
      const tbl = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { tbl.push(lines[i].trim()); i++; }
      const parseRow = (l) => l.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      const parsed = tbl.map(parseRow);
      let header = [];
      const body = [];
      parsed.forEach((r, idx) => { if (isSep(r)) return; if (idx === 0) header = r; else body.push(r); });
      drawTable(header, body);
      continue;
    }

    // Titoli
    const hMatch = raw.match(/^(#{1,4})\s+(.*)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const txt = clean(hMatch[2]);
      if (!txt) { i++; continue; }
      const size = level <= 1 ? 15 : level === 2 ? 13 : 11;
      const wrapped = doc.setFontSize(size).splitTextToSize(txt, contentW);
      ensure(wrapped.length * (size + 3) + 12);
      y += level <= 2 ? 8 : 4;
      doc.setFont("helvetica", "bold"); doc.setTextColor(...ORANGE);
      doc.text(wrapped, margin, y + size * 0.55);
      y += wrapped.length * (size + 3) + 5;
      i++; continue;
    }

    // Elenco puntato
    const liMatch = raw.match(/^[-*+]\s+(.*)/);
    if (liMatch) {
      const txt = clean(liMatch[1]);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...DARK);
      const wrapped = doc.splitTextToSize(txt, contentW - 14);
      ensure(wrapped.length * 13 + 4);
      doc.setFillColor(...ORANGE); doc.circle(margin + 3, y + 4, 1.6, "F");
      doc.text(wrapped, margin + 12, y + 7);
      y += wrapped.length * 13 + 3;
      i++; continue;
    }

    // Elenco numerato
    const olMatch = raw.match(/^(\d+)[.)]\s+(.*)/);
    if (olMatch) {
      const txt = clean(olMatch[2]);
      doc.setFontSize(10);
      const wrapped = doc.splitTextToSize(txt, contentW - 20);
      ensure(wrapped.length * 13 + 4);
      doc.setFont("helvetica", "bold"); doc.setTextColor(...ORANGE);
      doc.text(`${olMatch[1]}.`, margin, y + 7);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...DARK);
      doc.text(wrapped, margin + 20, y + 7);
      y += wrapped.length * 13 + 3;
      i++; continue;
    }

    // Paragrafo
    const txt = clean(raw);
    if (txt) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...DARK);
      const wrapped = doc.splitTextToSize(txt, contentW);
      ensure(wrapped.length * 13 + 4);
      doc.text(wrapped, margin, y + 7);
      y += wrapped.length * 13 + 4;
    }
    i++;
  }

  // Disclaimer finale
  const disc = DISCLAIMER[lang] || DISCLAIMER.it;
  doc.setFontSize(8.5); doc.setFont("helvetica", "italic");
  const dLines = doc.splitTextToSize(disc, contentW - 20);
  const dH = 16 + dLines.length * 11;
  ensure(dH + 8);
  y += 6;
  doc.setFillColor(255, 250, 235); doc.setDrawColor(230, 190, 100); doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, contentW, dH, 6, 6, "FD");
  doc.setTextColor(150, 110, 30);
  doc.text(dLines, margin + 10, y + 13);
  y += dH;

  drawFooter();
  doc.save(fileName);
}
