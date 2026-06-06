import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Copy, Check } from "lucide-react";
import { useSheets } from "../hooks/useSheets";
import { useAuth } from "../context/AuthContext";
import { todayISO, buildWhatsAppMessage } from "../utils/formatters";
import AutoComplete from "../components/AutoComplete";
import ListInput from "../components/ListInput";
import Toast from "../components/Toast";
import sadhviji from "../assets/SadhvijiMs.png";
import sadhu from "../assets/SadhuMs.png";

function parseTimeForInput(val) {
  if (!val) return "";
  if (typeof val === "string" && val.includes("T")) {
    const d = new Date(val);
    if (!isNaN(d))
      return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }

  if (typeof val === "string") {
    const m = val.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (m) {
      let hours = Number(m[1]);
      const minutes = Number(m[2]);
      const ampm = m[3].toUpperCase();
      if (hours === 12) hours = 0;
      if (ampm === "PM") hours += 12;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  }
  return String(val);
}

function to12HourTime(value) {
  if (!value) return "";
  if (typeof value === "string" && value.trim().match(/[AaPp][Mm]$/)) return value.trim().toUpperCase();

  const [hRaw, mRaw] = String(value).split(":");
  const hours = Number(hRaw);
  const minutes = Number(mRaw);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return String(value);

  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

function parseTimeTo24(value) {
  if (!value) return null;
  const str = String(value).trim();

  // Google Sheets can return ISO for time cells
  if (str.includes("T")) {
    const d = new Date(str);
    if (isNaN(d)) return null;
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // 12-hour (with AM/PM)
  const m12 = str.match(/^(\d{1,2})\s*:\s*(\d{1,2})\s*([AaPp][Mm])$/);
  if (m12) {
    let hours = Number(m12[1]);
    const minutes = Number(m12[2]);
    const ampm = m12[3].toUpperCase();
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes < 0 || minutes > 59) return null;
    if (hours < 1 || hours > 12) return null;
    if (hours === 12) hours = 0;
    if (ampm === "PM") hours += 12;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  // 24-hour
  const m24 = str.match(/^(\d{1,2})\s*:\s*(\d{1,2})$/);
  if (m24) {
    const hours = Number(m24[1]);
    const minutes = Number(m24[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  return null;
}

function normalizeTimeForDisplay(value) {
  const hhmm = parseTimeTo24(value);
  if (!hhmm) return value ? String(value) : "";
  return to12HourTime(hhmm);
}

const DEFAULT_FORM = {
  date: todayISO(),
  startTime: "",
  endTime: "",
  sadhviji: "",
  sadhu: "",
  maharajNames: [""],
  km: "",
  from: "",
  via: "",
  to: "",
  sevak: [""],
  sevika: [""],
};

export default function AddEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  const { entries, config, saveEntry, nextViharNo, syncConfig, syncEntries } = useSheets();
  const { session, ensureWriteAccess } = useAuth();

  const editEntry = location.state?.entry || null;

  const [form, setForm] = useState(() =>
    editEntry
      ? {
          ...DEFAULT_FORM,
          ...editEntry,
          startTime:
            parseTimeForInput(editEntry.startTime) ||
            DEFAULT_FORM.startTime,
          endTime:
            parseTimeForInput(editEntry.endTime) || DEFAULT_FORM.endTime,
          // maharajNames: editEntry.maharajNames || [],
          maharajNames: editEntry.maharajNames?.length
            ? editEntry.maharajNames
            : [""],
          sevak: editEntry.sevak?.length ? editEntry.sevak : [""],
          sevika: editEntry.sevika?.length ? editEntry.sevika : [""],
        }
      : DEFAULT_FORM,
  );
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    syncConfig();
    syncEntries();
  }, []);

  useEffect(() => {
    let cancelled = false;
    ensureWriteAccess().catch(() => {
      if (cancelled) return;
      // If auth is cancelled or fails, take the user back to a safe landing route.
      navigate("/", { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [ensureWriteAccess, navigate]);

  const places = config?.places || [];
  const sevakNames = config?.sevakNames || [];
  const sevikaNames = config?.sevikaNames || [];
  const viharNo = editEntry?.viharNo ?? nextViharNo;
  const whatsAppMsg = buildWhatsAppMessage({ ...form, viharNo });

  function normText(v) {
    return String(v || "").trim().toLowerCase();
  }

  function normList(list) {
    return (Array.isArray(list) ? list : [])
      .map(normText)
      .filter(Boolean)
      .sort();
  }

  function dupSignature(f) {
    return JSON.stringify({
      date: String(f?.date || ""),
      from: normText(f?.from),
      to: normText(f?.to),
      sadhu: Number(f?.sadhu) || 0,
      sadhviji: Number(f?.sadhviji) || 0,
      sevak: normList(f?.sevak),
      sevika: normList(f?.sevika),
    });
  }

  function findDuplicate(sig, list) {
    for (const e of list || []) {
      if (editEntry && e?.id === editEntry.id) continue;
      const s = dupSignature(e);
      if (s === sig) return e;
    }
    return null;
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    if (!form.date) return "Date is required";
    if (!form.from.trim()) return "From location is required";
    if (!form.to.trim()) return "To location is required";
    if (!form.km || Number(form.km) <= 0) return "Distance (KM) is required";
    if (!parseTimeTo24(form.startTime)) return "Start Time is invalid";
    if (!parseTimeTo24(form.endTime)) return "End Time is invalid";

    const sv = Number(form.sadhviji) || 0;
    const sd = Number(form.sadhu) || 0;
    if (sv === 0 && sd === 0)
      return "Enter count for at least Sadhviji Bhagwant or Sadhu Bhagwant";

    const hasSevak = form.sevak.some(Boolean);
    const hasSevika = form.sevika.some(Boolean);
    if (!hasSevak && !hasSevika)
      return "At least one Vihar Sevak or Vihar Sevika must be added";

    // Duplicate check — same date + from + to
    // const isDuplicate = entries.some(
    //   (e) =>
    //     e.date === form.date &&
    //     e.from?.toLowerCase().trim() === form.from.toLowerCase().trim() &&
    //     e.to?.toLowerCase().trim() === form.to.toLowerCase().trim() &&
    //     (!editEntry || e.id !== editEntry.id),
    // );
    // if (isDuplicate)
    //   return `A vihar entry from "${form.from}" to "${form.to}" on this date already exists`;

    return null;
  }

  function handleCopy() {
    navigator.clipboard.writeText(whatsAppMsg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSave() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const err = validate();
      if (err) {
        setToast({ message: err, type: "error" });
        return;
      }

      // Make sure we have the latest entries before checking duplicates.
      // Use the returned list (not state) to avoid timing issues with React state updates.
      let latestEntries = entries;
      try {
        const fresh = await syncEntries();
        if (Array.isArray(fresh)) latestEntries = fresh;
      } catch {
        // ignore sync errors; fall back to cached entries
      }

      const sig = dupSignature(form);
      const dup = findDuplicate(sig, latestEntries);
      if (dup) {
        setToast({
          message: `Similar entry already exists (Vihar No. ${dup.viharNo}). Please check and edit instead of saving a duplicate.`,
          type: "error",
        });
        return;
      }

      const startTime24 = parseTimeTo24(form.startTime);
      const endTime24 = parseTimeTo24(form.endTime);
      const entry = {
        ...form,
        viharNo,
        id: editEntry?.id || `vsg-${Date.now()}`,
        startTime: to12HourTime(startTime24),
        endTime: to12HourTime(endTime24),
        sevak: form.sevak.filter(Boolean),
        sevika: form.sevika.filter(Boolean),
        maharajNames: form.maharajNames.filter(Boolean),
        savedBy: session.email || session.username || '',
        savedAt: new Date().toISOString(),
      };
      const res = await saveEntry(entry);
      const finalEntry = res?.viharNo ? { ...entry, viharNo: res.viharNo } : entry;
      navigate("/confirm", { state: { entry: finalEntry } });
    } catch (e) {
      setToast({ message: e.message || "Save failed", type: "error" });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full w-full max-w-[480px] mx-auto bg-[#FFFDF5]">
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 bg-[#C96800]">
        <button
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate("/", { replace: true });
          }}
          className="text-white p-1.5 rounded-xl hover:bg-orange-700"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-black text-base">
            {editEntry ? "Edit Vihar" : "New Vihar Entry"}
          </h1>
          <p className="text-orange-100 text-xs font-semibold">
            Vihar No. {viharNo}
          </p>
        </div>
      </header>

      <div className="scroll-area px-4 pt-4 space-y-5">
        {/* Date & Time */}
        <Section title="Date & Time">
          <Field label="Date" required>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Time" required>
              <div className="space-y-1">
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                  placeholder="Start Time"
                  className={inputCls}
                />
                <div className="text-[11px] font-semibold text-[#8B6525]">
                  {normalizeTimeForDisplay(form.startTime)}
                </div>
              </div>
            </Field>
            <Field label="End Time" required>
              <div className="space-y-1">
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                  placeholder="End Time"
                  className={inputCls}
                />
                <div className="text-[11px] font-semibold text-[#8B6525]">
                  {normalizeTimeForDisplay(form.endTime)}
                </div>
              </div>
            </Field>
          </div>
        </Section>

        {/* Thana */}
        <Section title="Thana & Distance">
          <p className="text-[10px] text-[#8B6525]">
            At least one count is required{" "}
            <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={
                <span className="flex items-center gap-1.5">
                  <img src={sadhu} className="w-7 h-7 object-contain" alt="" />
                  Sadhu Bhagwant
                </span>
              }
            >
              <input
                type="text"
                inputMode="numeric"
                value={form.sadhu}
                onChange={(e) => set("sadhu", e.target.value)}
                placeholder="e.g. 3"
                className={inputCls}
              />
            </Field>
            <Field
              label={
                <span className="flex items-center gap-1.5">
                  <img
                    src={sadhviji}
                    className="w-7 h-7 object-contain"
                    alt=""
                  />
                  Sadhviji Bhagwant
                </span>
              }
            >
              <input
                type="text"
                inputMode="numeric"
                value={form.sadhviji}
                onChange={(e) => set("sadhviji", e.target.value)}
                placeholder="e.g. 9"
                className={inputCls}
              />
            </Field>
           
          </div>
          
          {/* Maharaj Saheb Names — plain text + Add button, no suggestions */}
          {/* <div className="space-y-1">
            <label className="text-xs font-bold text-[#8B6525]">
              Maharaj Saheb Names
            </label>
            <ListInput
              items={form.maharajNames}
              onChange={(v) => set("maharajNames", v)}
              placeholder="Enter name..."
              suggestions={[]}
              strict={false}
            />
          </div> */}

          <Field label="Maharaj Saheb Name">
            <input
              type="text"
              value={form.maharajNames[0] || ""}
              onChange={(e) => set("maharajNames", [e.target.value])}
              placeholder="Enter Maharaj Saheb Name"
              className={inputCls}
            />
          </Field>
          <Field label="Distance (KM)" required>
            <input
              type="text"
              inputMode="decimal"
              value={form.km}
              onChange={(e) => set("km", e.target.value)}
              placeholder="e.g. 12"
              className={inputCls}
            />
          </Field>
        </Section>

        {/* Route */}
        <Section title="Route">
          <Field label="From" required>
            <AutoComplete
              value={form.from}
              onChange={(v) => set("from", v)}
              suggestions={places}
              placeholder="Starting location"
              strict={places.length > 0}
            />
          </Field>
          <Field label="Via (optional)">
            <AutoComplete
              value={form.via}
              onChange={(v) => set("via", v)}
              suggestions={places}
              placeholder="Via"
              strict={false}
            />
          </Field>
          <Field label="To" required>
            <AutoComplete
              value={form.to}
              onChange={(v) => set("to", v)}
              suggestions={places}
              placeholder="Destination"
              strict={places.length > 0}
            />
          </Field>
        </Section>

        {/* Sevak */}
        <Section
          title={
            <span>
              Vihar Sevak (Male) <RequiredNote />
            </span>
          }
          accent="#C96800"
        >
          <ListInput
            items={form.sevak}
            onChange={(v) => set("sevak", v)}
            suggestions={sevakNames}
            placeholder="Sevak name..."
            accentColor="#C96800"
            strict={sevakNames.length > 0}
          />
        </Section>

        {/* Sevika */}
        <Section
          title={
            <span>
              Vihar Sevika (Female) <RequiredNote />
            </span>
          }
          accent="#C96800"
        >
          <ListInput
            items={form.sevika}
            onChange={(v) => set("sevika", v)}
            suggestions={sevikaNames}
            placeholder="Sevika name..."
            accentColor="#C96800"
            strict={sevikaNames.length > 0}
          />
        </Section>

        <p className="text-[10px] text-[#8B6525] px-1">
          <span className="text-red-500">*</span> Required &nbsp;·&nbsp;
          Sadhviji or Sadhu count mandatory &nbsp;·&nbsp; At least one Sevak or
          Sevika mandatory
        </p>

        {/* Preview — toggle with inline copy */}
        <div className="bg-white border border-[#F5E5B0] rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-[#C96800]"
          >
            <span>👁 Preview WhatsApp Message</span>
            <span className="text-xs font-semibold text-[#8B6525]">
              {preview ? "Hide ▲" : "Show ▼"}
            </span>
          </button>

          {preview && (
            <div className="border-t border-[#F5E5B0]">
              <div className="px-4 pt-3 pb-2">
                <pre className="bg-[#DCF8C6] rounded-xl p-3.5 text-xs text-[#3D1F00] whitespace-pre-wrap font-sans border border-green-200 leading-relaxed">
                  {whatsAppMsg}
                </pre>
              </div>
              <div className="px-4 pb-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`w-full flex items-center justify-center gap-2 font-bold rounded-xl py-2.5 text-sm transition-colors ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-[#25D366] text-white hover:bg-green-600"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={16} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Copy for WhatsApp
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#C96800] text-white font-black rounded-xl py-4 text-base disabled:opacity-60 mb-2"
        >
          {saving ? "Saving…" : editEntry ? "Update Entry" : "Save Entry"}
        </button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function Section({ title, children, accent = "#C96800" }) {
  return (
    <div className="bg-white border border-[#F5E5B0] rounded-2xl p-4 space-y-3">
      <h3 className="font-black text-sm" style={{ color: accent }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-[#8B6525] flex items-center gap-0.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function RequiredNote() {
  return <span className="text-red-500 font-black text-sm ml-0.5">*</span>;
}

const inputCls =
  "w-full border border-[#E8C97A] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#C96800]";
