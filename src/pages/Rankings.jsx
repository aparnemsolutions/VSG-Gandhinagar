import { useEffect, useMemo, useState } from "react";
import { Search, X, ArrowLeft } from "lucide-react";
import { useSheets } from "../hooks/useSheets";
import { calcYearlyStats } from "../utils/reportHelpers";
import { useLocation, useNavigate } from "react-router-dom";

function withDenseRanks(ranking) {
  let prevCount = null;
  let rank = 0;
  return (ranking || []).map((r) => {
    if (prevCount === null || r.count !== prevCount) rank += 1;
    prevCount = r.count;
    return { ...r, rank };
  });
}

function RankRow({ name, count, color = "#1B7A3A" }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#F5E5B0]">
      <span className="flex-1 text-sm font-semibold text-[#3D1F00]">{name}</span>
      <span className="text-sm font-black" style={{ color }}>{count}</span>
    </div>
  );
}

export default function Rankings() {
  const { entries, config, syncAll } = useSheets();
  const [search, setSearch] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    syncAll();
  }, [syncAll]);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const typeFilter = params.get("type"); // 'sevak' | 'sevika' | null

  const yearLabel = config?.appConfig?.current_year_label || new Date().getFullYear();
  const yearly = calcYearlyStats(entries || []);

  const sevakRanking = useMemo(() => withDenseRanks(yearly.sevakRanking || []), [yearly]);
  const sevikaRanking = useMemo(() => withDenseRanks(yearly.sevikaRanking || []), [yearly]);

  const q = search.trim().toLowerCase();
  const filteredSevak = q ? sevakRanking.filter(r => (r.name || '').toLowerCase().includes(q)) : sevakRanking;
  const filteredSevika = q ? sevikaRanking.filter(r => (r.name || '').toLowerCase().includes(q)) : sevikaRanking;

  return (
    <div className="flex flex-col h-full w-full max-w-[480px] mx-auto bg-[#FFFDF5]">
        <header className="px-4 pt-4 pb-3 bg-[#C96800] flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-white p-2 rounded-xl hover:bg-orange-700"
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-black text-base">All Vihar Sevak & Sevika List</h1>
          <p className="text-orange-100 text-xs font-semibold">{yearLabel}</p>
        </div>
      </header>

      <div className="scroll-area px-4 pt-4 pb-24 space-y-4">
        <div className="bg-white border border-[#F5E5B0] rounded-2xl p-3">
          <div className="flex items-center gap-2 bg-[#FFFDF5] rounded-xl px-3 py-2 border border-[#E8C97A]">
            <Search size={16} className="text-[#8B6525]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your name" className="flex-1 bg-transparent outline-none text-sm text-[#3D1F00]" />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-[#C96800] p-1 rounded-lg" title="Clear">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(!typeFilter || typeFilter === "sevak") && (
            <div className={`bg-white border border-[#F5E5B0] rounded-2xl p-4 ${typeFilter === 'sevak' ? 'col-span-2' : ''}`}>
              <p className="font-black text-sm text-[#C96800] mb-3">All Vihar Sevak</p>
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {filteredSevak.map((r) => (
                  <RankRow key={`sevak-${r.name}`} rank={r.rank} name={r.name} count={r.count} />
                ))}
              </div>
            </div>
          )}

          {(!typeFilter || typeFilter === "sevika") && (
            <div className={`bg-white border border-[#F5E5B0] rounded-2xl p-4 ${typeFilter === 'sevika' ? 'col-span-2' : ''}`}>
              <p className="font-black text-sm text-[#C96800] mb-3">All Vihar Sevika</p>
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {filteredSevika.map((r) => (
                  <RankRow key={`sevika-${r.name}`} rank={r.rank} name={r.name} count={r.count} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
