import { useEffect, useRef, useState } from "react";
import API from "../../api/axios";
import { getEventSummary, getEventCharts } from "../../api/analytics";
import { SimpleBarChart, SimpleLineChart, SimplePieChart } from "../../components/charts/Charts";
import { Card, StatCard, Spinner, EmptyState, Button, Select, Alert } from "../../components/ui/UI";

// ─── Helpers ───────────────────────────────────────────────────────────────────
async function loadLib(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      const check = setInterval(() => {
        if (src.includes("jspdf") && window.jspdf) { clearInterval(check); resolve(); }
        if (src.includes("html2canvas") && window.html2canvas) { clearInterval(check); resolve(); }
      }, 50);
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Draw a horizontal rule
function drawRule(pdf, x, y, w, color = [229, 231, 235]) {
  pdf.setDrawColor(...color);
  pdf.setLineWidth(0.3);
  pdf.line(x, y, x + w, y);
}

// Draw footer on a given page
function drawFooter(pdf, pageNum, pageCount, eventName, PAGE_W, PAGE_H, MARGIN) {
  pdf.setPage(pageNum);
  drawRule(pdf, MARGIN, PAGE_H - 12, PAGE_W - MARGIN * 2, [209, 213, 219]);
  pdf.setFontSize(7.5);
  pdf.setTextColor(156, 163, 175);
  pdf.setFont("helvetica", "normal");
  const left = `EventSys  ·  ${eventName}`;
  const right = `Page ${pageNum} of ${pageCount}`;
  pdf.text(left, MARGIN, PAGE_H - 6);
  pdf.text(right, PAGE_W - MARGIN, PAGE_H - 6, { align: "right" });
}

// Section heading helper
function drawSectionHeading(pdf, text, x, y, CONTENT_W) {
  // Accent bar
  pdf.setFillColor(99, 102, 241);
  pdf.rect(x, y - 4, 3, 9, "F");
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(31, 41, 55);
  pdf.text(text, x + 7, y + 2);
  // Underline rule
  drawRule(pdf, x, y + 5, CONTENT_W, [199, 210, 254]);
  return y + 14;
}

// ─── PDF Export ────────────────────────────────────────────────────────────────
async function exportToPDF(reportRef, eventName, summary) {
  await loadLib("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  await loadLib("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PAGE_W    = 210;
  const PAGE_H    = 297;
  const MARGIN    = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const COL2      = MARGIN + 80;
  const ROW_H     = 7.5;

  // ── PAGE 1: Cover ────────────────────────────────────────────────────────────
  // Full-page gradient-like background (two rects)
  pdf.setFillColor(67, 56, 202);   // indigo-700
  pdf.rect(0, 0, PAGE_W, PAGE_H, "F");
  pdf.setFillColor(79, 70, 229);   // indigo-600
  pdf.rect(0, 60, PAGE_W, PAGE_H - 60, "F");

  // Decorative circle top-right
  pdf.setFillColor(99, 102, 241, 0.3);
  pdf.circle(PAGE_W - 10, 10, 60, "F");

  // Logo / brand text
  pdf.setTextColor(199, 210, 254); // indigo-200
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("EVENTSYS", MARGIN, 20);

  // Main title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.setFont("helvetica", "bold");
  pdf.text("Event Analytics", MARGIN, 80);
  pdf.text("Report", MARGIN, 94);

  // Divider
  pdf.setFillColor(165, 180, 252); // indigo-300
  pdf.rect(MARGIN, 100, 30, 1.5, "F");

  // Event name
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(199, 210, 254);
  const wrappedName = pdf.splitTextToSize(eventName, CONTENT_W - 20);
  pdf.text(wrappedName, MARGIN, 110);

  // Generated date
  pdf.setFontSize(9);
  pdf.setTextColor(165, 180, 252);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, MARGIN, 124);

  // Quick-stat chips at bottom of cover
  const chips = [
    { label: "Attendance",   value: String(summary.attendance_population ?? "—") },
    { label: "Avg Rating",   value: `${summary.avg_experience_rating ?? "—"} / 5` },
    { label: "Accidents",    value: String(summary.accident_count ?? "—") },
  ];
  const chipW = 52;
  const chipGap = 8;
  const chipStartX = MARGIN;
  const chipY = 240;

  chips.forEach(({ label, value }, i) => {
    const cx = chipStartX + i * (chipW + chipGap);
    pdf.setFillColor(55, 48, 163); // indigo-800
    pdf.roundedRect(cx, chipY, chipW, 22, 3, 3, "F");
    pdf.setTextColor(199, 210, 254);
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.text(label, cx + chipW / 2, chipY + 8, { align: "center" });
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(value, cx + chipW / 2, chipY + 17, { align: "center" });
  });

  // Cover footer note
  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(129, 140, 248);
  pdf.text("Confidential — for internal use only", PAGE_W / 2, PAGE_H - 10, { align: "center" });

  // ── PAGE 2: Summary ──────────────────────────────────────────────────────────
  pdf.addPage();
  let y = MARGIN + 6;

  y = drawSectionHeading(pdf, "Summary", MARGIN, y, CONTENT_W);

  const rows = [
    ["Total Attendance",       summary.attendance_population,                                         false],
    ["Approved Attendance",    summary.approved_attendance_population,                                true],
    ["Committee Members",      summary.committee_population,                                          false],
    ["Accident Count",         summary.accident_count,                                                false],
    ["Avg Experience Rating",  `${summary.avg_experience_rating ?? "—"} / 5`,                        true],
    ["Rating Submissions",     summary.rating_submissions,                                            false],
    ["Total Expenditure",      `PHP ${Number(summary.event_expenditure_total ?? 0).toLocaleString()}`, true],
    ["Event Status",           summary.event?.status ?? "—",                                         false],
    ["Location",               summary.event?.location || "—",                                       false],
    ["Duration (hours)",       summary.event?.duration_hours ?? "—",                                 false],
  ];

  pdf.setFontSize(9);
  rows.forEach(([label, value, accent], i) => {
    // Page-break guard
    if (y + ROW_H > PAGE_H - 18) { pdf.addPage(); y = MARGIN + 10; }

    const rowY = y;
    // Alternating row bg
    if (i % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(MARGIN, rowY - 5, CONTENT_W, ROW_H, "F");
    }
    // Left accent bar for highlighted rows
    if (accent) {
      pdf.setFillColor(99, 102, 241);
      pdf.rect(MARGIN, rowY - 5, 2, ROW_H, "F");
    }

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);
    pdf.text(String(label), MARGIN + 4, rowY);

    pdf.setFont("helvetica", "bold");
    if (accent) pdf.setTextColor(79, 70, 229); else pdf.setTextColor(17, 24, 39);
    pdf.text(String(value ?? "—"), COL2, rowY);
    pdf.setTextColor(17, 24, 39);

    y += ROW_H;
  });

  // ── Demographics ─────────────────────────────────────────────────────────────
  y += 8;
  if (y + 20 > PAGE_H - 18) { pdf.addPage(); y = MARGIN + 6; }
  y = drawSectionHeading(pdf, "Demographics", MARGIN, y, CONTENT_W);

  const demo = summary.demographics || {};
  const demoSections = [
    { label: "Sex Distribution",    data: demo.sex    || {} },
    { label: "Year Distribution",   data: demo.year   || {} },
    { label: "Course Distribution", data: demo.course || {} },
  ];

  pdf.setFontSize(9);
  for (const section of demoSections) {
    const entries = Object.entries(section.data);
    if (entries.length === 0) continue;

    if (y + entries.length * ROW_H + 18 > PAGE_H - 18) {
      pdf.addPage();
      y = MARGIN + 10;
    }

    // Sub-heading
    pdf.setFillColor(238, 242, 255);
    pdf.rect(MARGIN, y - 4, CONTENT_W, 8, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(79, 70, 229);
    pdf.text(section.label, MARGIN + 4, y);
    y += 7;

    // Compute total for percentages
    const total = entries.reduce((sum, [, v]) => sum + Number(v), 0) || 1;

    entries.forEach(([k, v], i) => {
      if (y + ROW_H > PAGE_H - 18) { pdf.addPage(); y = MARGIN + 10; }
      if (i % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(MARGIN, y - 5, CONTENT_W, ROW_H, "F");
      }
      const pct = ((Number(v) / total) * 100).toFixed(1);
      const barW = (Number(v) / total) * (CONTENT_W - 70);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text(String(k || "—"), MARGIN + 4, y);

      // Mini progress bar
      pdf.setFillColor(224, 231, 255);
      pdf.rect(MARGIN + 55, y - 3.5, CONTENT_W - 70, 4, "F");
      pdf.setFillColor(99, 102, 241);
      pdf.rect(MARGIN + 55, y - 3.5, Math.max(barW, 0.5), 4, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(17, 24, 39);
      pdf.text(`${v}  (${pct}%)`, PAGE_W - MARGIN, y, { align: "right" });

      y += ROW_H;
    });
    y += 5;
  }

  // ── Charts ───────────────────────────────────────────────────────────────────
  const chartCards = reportRef.current?.querySelectorAll("[data-chart]");
  if (chartCards && chartCards.length > 0) {
    pdf.addPage();
    let cy = MARGIN + 6;
    cy = drawSectionHeading(pdf, "Charts", MARGIN, cy, CONTENT_W);

    for (const card of chartCards) {
      let canvas;
      try {
        canvas = await window.html2canvas(card, {
          scale: 1.8,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
        });
      } catch (err) {
        console.warn("Chart screenshot failed, skipping:", err);
        continue;
      }

      const imgData = canvas.toDataURL("image/png");
      const imgW    = CONTENT_W;
      const imgH    = (canvas.height / canvas.width) * imgW;

      if (cy + imgH > PAGE_H - 18) {
        pdf.addPage();
        cy = drawSectionHeading(pdf, "Charts (continued)", MARGIN, MARGIN + 6, CONTENT_W);
      }

      // Subtle card shadow simulation
      pdf.setFillColor(243, 244, 246);
      pdf.roundedRect(MARGIN + 0.5, cy + 0.5, imgW, imgH, 2, 2, "F");
      pdf.addImage(imgData, "PNG", MARGIN, cy, imgW, imgH);
      cy += imgH + 8;
    }
  }

  // ── Footers on every page ────────────────────────────────────────────────────
  const pageCount = pdf.internal.getNumberOfPages();
  // Skip page 1 (cover) — it has its own footer style
  for (let i = 2; i <= pageCount; i++) {
    drawFooter(pdf, i, pageCount, eventName, PAGE_W, PAGE_H, MARGIN);
  }

  pdf.save(`${eventName.replace(/\s+/g, "_")}_analytics_report.pdf`);
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Analytics() {
  const reportRef = useRef(null);

  const [events, setEvents]         = useState([]);
  const [eventId, setEventId]       = useState("");
  const [summary, setSummary]       = useState(null);
  const [charts, setCharts]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const selectedEvent = events.find((e) => String(e.id) === String(eventId));

  useEffect(() => {
    API.get("/events/").then((r) => {
      setEvents(r.data);
      if (r.data.length > 0) setEventId(String(r.data[0].id));
    });
  }, []);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setSummary(null);
    setCharts(null);
    Promise.all([getEventSummary(eventId), getEventCharts(eventId)])
      .then(([s, c]) => { setSummary(s); setCharts(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleDownloadPDF = async () => {
    if (!summary) return;
    setPdfLoading(true);
    try {
      await exportToPDF(reportRef, selectedEvent?.name || `Event ${eventId}`, summary);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };



  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>Analytics</h1>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: "13px" }}>Event performance overview</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ minWidth: 180 }}>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </Select>
          <Button
            variant="primary"
            disabled={!summary || pdfLoading}
            onClick={handleDownloadPDF}
          >
            {pdfLoading ? "⏳ Generating…" : "⬇ Download PDF"}
          </Button>
        </div>
      </div>

      {loading && <Spinner />}

      {/* ── Report content (also screenshotted for PDF) ── */}
      {summary && !loading && (
        <div ref={reportRef}>
          {/* Stat rows */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            <StatCard title="Attendance"  value={summary.attendance_population}           icon="👥" />
            <StatCard title="Approved"    value={summary.approved_attendance_population}   icon="✅" accent />
            <StatCard title="Committees"  value={summary.committee_population}             icon="🤝" />
            <StatCard title="Accidents"   value={summary.accident_count}                   icon="🚨" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 24 }}>
            <StatCard title="Avg Rating"        value={`${summary.avg_experience_rating} / 5`}                                     icon="⭐" />
            <StatCard title="Total Expenditure" value={`₱${Number(summary.event_expenditure_total ?? 0).toLocaleString()}`} icon="💰" />
          </div>

          {/* Charts — each tagged data-chart so the PDF exporter finds them */}
          {charts && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              <Card data-chart="bar">
                <h4 style={{ margin: "0 0 12px", fontSize: "13px", color: "#374151" }}>Attendance Overview</h4>
                <SimpleBarChart
                  data={charts.bar.labels.map((l, i) => ({ name: l, value: charts.bar.values[i] }))}
                />
              </Card>

              <Card data-chart="pie">
                <h4 style={{ margin: "0 0 12px", fontSize: "13px", color: "#374151" }}>Sex Distribution</h4>
                {charts.pie.labels.length > 0
                  ? <SimplePieChart labels={charts.pie.labels} values={charts.pie.values} />
                  : <EmptyState message="No demographic data." />}
              </Card>

              <Card data-chart="accidents">
                <h4 style={{ margin: "0 0 12px", fontSize: "13px", color: "#374151" }}>Accidents Over Time</h4>
                {charts.line.accidents.labels.length > 0
                  ? <SimpleLineChart labels={charts.line.accidents.labels} values={charts.line.accidents.values} label="Accidents" color="#ef4444" />
                  : <EmptyState message="No accident timeline data." />}
              </Card>

              <Card data-chart="expenditures">
                <h4 style={{ margin: "0 0 12px", fontSize: "13px", color: "#374151" }}>Expenditures Over Time</h4>
                {charts.line.expenditures.labels.length > 0
                  ? <SimpleLineChart labels={charts.line.expenditures.labels} values={charts.line.expenditures.values} label="Amount (PHP)" color="#22c55e" />
                  : <EmptyState message="No expenditure data." />}
              </Card>

              <Card data-chart="ratings">
                <h4 style={{ margin: "0 0 12px", fontSize: "13px", color: "#374151" }}>Rating Distribution</h4>
                {charts.ratings.labels.length > 0
                  ? <SimpleBarChart data={charts.ratings.labels.map((l, i) => ({ name: `⭐${l}`, value: charts.ratings.values[i] }))} />
                  : <EmptyState message="No ratings yet." />}
              </Card>

              <Card data-chart="demographics">
                <h4 style={{ margin: "0 0 12px", fontSize: "13px", color: "#374151" }}>Demographics</h4>
                <DemographicTable data={summary.demographics} />
              </Card>

            </div>
          )}
        </div>
      )}

    </div>
  );
}

function DemographicTable({ data }) {
  const sections = [
    { label: "Sex",    entries: Object.entries(data.sex    || {}) },
    { label: "Year",   entries: Object.entries(data.year   || {}) },
    { label: "Course", entries: Object.entries(data.course || {}) },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {sections.map(({ label, entries }) => (
        <div key={label}>
          <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>
            {label}
          </p>
          {entries.length === 0
            ? <p style={{ margin: 0, fontSize: "12px", color: "#d1d5db" }}>No data</p>
            : entries.map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "2px 0" }}>
                  <span style={{ textTransform: "capitalize" }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))
          }
        </div>
      ))}
    </div>
  );
}