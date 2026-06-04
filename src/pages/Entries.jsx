import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Copy,
  Pencil,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { useSheets } from "../hooks/useSheets";
import { useAuth } from "../context/AuthContext";
import { PERMISSIONS } from "../config/sheets";
import {
  formatDate,
  formatTime,
  buildWhatsAppMessage,
} from "../utils/formatters";
import Toast from "../components/Toast";

export default function Entries() {
  const { entries, loading, syncEntries, deleteEntry } = useSheets();
  const { role, ensureWriteAccess } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    syncEntries();
  }, []);

  const sorted = [...entries].sort(
    (a, b) => Number(b.viharNo) - Number(a.viharNo),
  );
  const filtered = sorted.filter((e) => {
    return !search.trim() || String(e.viharNo).includes(search.trim());
  });

  function toggle(id) {
    setExpanded((e) => (e === id ? null : id));
  }

  async function handleDelete(e) {
    setConfirmDelete(null);
    try {
      await deleteEntry(e.id);
      setToast({ message: `Vihar #${e.viharNo} deleted`, type: "success" });
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  }

  function copyMsg(entry) {
    const msg = buildWhatsAppMessage(entry);
    navigator.clipboard.writeText(msg).then(() => {
      setToast({ message: "Copied!", type: "success" });
    });
  }

  return (
    <div className="flex flex-col h-full w-full max-w-[480px] mx-auto bg-[#FFFDF5]">
      <header className="px-4 pt-4 pb-3 bg-[#C96800] flex items-center gap-3">
        <h1 className="text-white font-black text-base flex-1">All Entries</h1>
        <button
          onClick={syncEntries}
          className="text-white p-2 rounded-xl hover:bg-orange-700"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      {/* Search */}
      {/* <div className="px-4 py-3 bg-white border-b border-[#E8C97A]">
        <div className="flex items-center gap-2 border border-[#E8C97A] rounded-xl px-3 py-2 bg-[#FFFDF5]">
          <Search size={15} className="text-[#8B6525]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Vihar No…"
            className="flex-1 bg-transparent text-sm text-[#3D1F00] outline-none placeholder:text-[#8B6525]"
          />
        </div>
      </div> */}

      <div className="scroll-area px-4 pt-3 space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-[#8B6525] text-sm font-semibold py-12">
            {loading ? "Loading…" : "No entries found."}
          </p>
        )}
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className="bg-white border border-[#F5E5B0] rounded-2xl overflow-hidden"
          >
            {/* Card header */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
              onClick={() => toggle(entry.id)}
            >
              {/* <span className="font-black text-[#C96800] text-sm w-8 flex-shrink-0">{entry.viharNo}</span> */}
              <span className="flex-shrink-0 bg-[#C96800] text-white font-black px-1 py-1 rounded-lg flex flex-col items-center min-w-[45px] w-[35px]">
                <span className="text-[8px] font-bold uppercase tracking-wide opacity-80 leading-tight text-center">
                  Vihar
                  <br />
                  No.
                </span>
                <span className="text-sm">{entry.viharNo}</span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#3D1F00] text-sm truncate">
                  {entry.from} → {entry.to}
                </p>
                <p className="text-xs text-[#8B6525]">
                  {formatDate(entry.date)} · {entry.km} km
                </p>
              </div>
              {expanded === entry.id ? (
                <ChevronUp size={16} className="text-[#8B6525]" />
              ) : (
                <ChevronDown size={16} className="text-[#8B6525]" />
              )}
            </button>

            {/* Expanded */}
            {expanded === entry.id && (
              <div className="px-4 pb-4 border-t border-[#F5E5B0] space-y-3 pt-3">
                <Row label="Date" value={formatDate(entry.date)} />
                <Row
                  label="Time"
                  value={`${formatTime(entry.startTime)} – ${formatTime(entry.endTime)}`}
                />
                <Row
                  label="Thana"
                  value={`${entry.sadhu || 0} Sadhu Bhagvant+ ${entry.sadhviji || 0} Sadhviji Bhagvant`}
                />
                {entry.maharajNames?.length > 0 && (
                  <Row
                    label="Maharaj Saheb Name"
                    value={entry.maharajNames.join(", ")}
                  />
                )}
                <Row label="Distance" value={`${entry.km} km`} />
                <Row
                  label="Vihar Sevak"
                  value={entry.sevak?.join(", ") || "—"}
                />
                <Row
                  label="Vihar Sevika"
                  value={entry.sevika?.join(", ") || "—"}
                />

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => copyMsg(entry)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white font-bold rounded-xl py-2.5 text-xs"
                  >
                    <Copy size={14} /> Copy
                  </button>
                  <button
                    onClick={async () => {
                      if (!PERMISSIONS.canEditEntry(role)) await ensureWriteAccess();
                      navigate('/add', { state: { entry } });
                    }}
                    className="flex items-center justify-center gap-1 bg-[#E8C97A] text-[#3D1F00] font-bold rounded-xl py-2.5 px-3 text-xs"
                  >
                    <Pencil size={14} />
                  </button>
                  {/*PERMISSIONS.canDeleteEntry(role) && (
                    <button
                      onClick={() => setConfirmDelete(entry)}
                      className="flex items-center justify-center gap-1 bg-red-100 text-red-600 font-bold rounded-xl py-2.5 px-3 text-xs"
                    >
                      <Trash2 size={14} />
                    </button>
                  )*/}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete confirm }
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-end justify-center">
          <div className="w-full max-w-[480px] bg-white rounded-t-2xl p-6 space-y-4">
            <h2 className="font-black text-[#3D1F00] text-base">Delete Vihar #{confirmDelete.viharNo}?</h2>
            <p className="text-sm text-[#8B6525]">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-[#E8C97A] text-[#3D1F00] font-bold rounded-xl py-3">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-600 text-white font-bold rounded-xl py-3">Delete</button>
            </div>
          </div>
        </div>
      )*/}

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

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs font-bold text-[#8B6525] w-24 flex-shrink-0">
        {label}
      </span>
      <span className="text-xs text-[#3D1F00] font-semibold flex-1">
        {value}
      </span>
    </div>
  );
}
