import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Plus, RefreshCw, Search, X } from "lucide-react";
import { useSheets } from "../hooks/useSheets";
import { useAuth } from "../context/AuthContext";
import { PERMISSIONS } from "../config/sheets";
import { getMonthKey, getMonthLabel } from "../utils/formatters";
import { calcMonthStats, calcYearlyStats, topN } from "../utils/reportHelpers";
import SettingsModal from "../components/SettingsModal";
import Medal from "../components/Medal";
import logo from "../assets/VSG Logo.jpeg";
import sadhviji from "../assets/SadhvijiMs.png";
import sadhu from "../assets/SadhuMs.png";
import road from "../assets/TotalKm.jpg";
import number from "../assets/TotalVihar.png";

export default function Dashboard() {
  const { entries, config, loading, syncAll, scriptUrl, saveScriptUrl } = useSheets();
  const { fullName, role } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [openRankingPanel, setOpenRankingPanel] = useState("sevak");
  const [rankingSearch, setRankingSearch] = useState("");
  const [activeView, setActiveView] = useState("month");
  const didInitOpenPanel = useRef(false);

  useEffect(() => {
    syncAll();
  }, [syncAll]);

  const currentMonthKey = getMonthKey(new Date().toISOString().slice(0, 10));
  const currentMonthEntries = entries.filter(
    (entry) => getMonthKey(entry.date) === currentMonthKey,
  );
  const stats = calcMonthStats(currentMonthEntries);
  const monthLabel = getMonthLabel(new Date().toISOString().slice(0, 10));
  const yearLabel = config?.appConfig?.current_year_label || new Date().getFullYear();
  const yearly = calcYearlyStats(entries);
  const yearlySevakTop = topN(withDenseRanks(yearly.sevakRanking), 3);
  const yearlySevikaTop = topN(withDenseRanks(yearly.sevikaRanking), 3);

  const hasSevakRanking = stats.sevakRanking.length > 0;
  const hasSevikaRanking = stats.sevikaRanking.length > 0;
  const rankingQuery = rankingSearch.trim().toLowerCase();
  const sevakList = rankingQuery
    ? stats.sevakRanking.filter((r) =>
        (r?.name || "").toLowerCase().includes(rankingQuery),
      )
    : stats.sevakRanking;
  const sevikaList = rankingQuery
    ? stats.sevikaRanking.filter((r) =>
        (r?.name || "").toLowerCase().includes(rankingQuery),
      )
    : stats.sevikaRanking;
  const hasSevakVisible = sevakList.length > 0;
  const hasSevikaVisible = sevikaList.length > 0;
  const forceOpenRankings = Boolean(rankingQuery);

  useEffect(() => {
    if (forceOpenRankings) return;
    const anyVisible = hasSevakVisible || hasSevikaVisible;
    if (!anyVisible) {
      if (openRankingPanel !== null) setOpenRankingPanel(null);
      return;
    }

    if (!didInitOpenPanel.current) {
      didInitOpenPanel.current = true;
      setOpenRankingPanel(hasSevakVisible ? "sevak" : "sevika");
      return;
    }

    if (openRankingPanel === "sevak" && !hasSevakVisible && hasSevikaVisible) {
      setOpenRankingPanel("sevika");
    }
    if (openRankingPanel === "sevika" && !hasSevikaVisible && hasSevakVisible) {
      setOpenRankingPanel("sevak");
    }
  }, [forceOpenRankings, hasSevakVisible, hasSevikaVisible, openRankingPanel]);

  function handleSaveUrl(url) {
    saveScriptUrl(url);
  }

  return (
    <div className="flex flex-col h-full w-full max-w-[480px] mx-auto bg-[#FFFDF5]">
      <header className="flex items-stretch justify-between bg-white shadow-sm border border-slate-100 overflow-hidden w-full">
        <div className="relative flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 flex-1 min-w-[175px] sm:min-w-[230px] flex-shrink-0">
          <div
            className="absolute inset-y-0 left-0 bg-[#C96800] w-[calc(60%+95px)] z-0"
            style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 40px) 100%, 0 100%)" }}
          />
          <div className="relative z-10 flex items-center gap-1.5 sm:gap-3 w-full min-w-0">
            <div className="flex-shrink-0 w-8 h-8 sm:w-11 sm:h-11 rounded-full border border-orange-300/40 p-0.5 flex items-center justify-center bg-white shadow-sm">
              <img
                src={logo}
                alt="VSG Logo"
                className="w-10 h-10 sm:w-10 sm:h-10 rounded-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center text-white">
              <h1 className="font-bold text-xs sm:text-sm md:text-base leading-none whitespace-nowrap">
                Vihar Seva Group
              </h1>
              <p className="text-amber-200 font-bold text-[10px] sm:text-[11px] leading-none mt-1 whitespace-nowrap">
                VSG - Gandhinagar
              </p>
              <p className="text-white/80 text-[9px] sm:text-[10px] font-semibold leading-none mt-1 whitespace-nowrap flex items-center gap-0.5">
                Welcome, {fullName} <span className="text-xs">👋</span>
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-1.5 sm:gap-3 pl-1 pr-2.5 sm:px-4 py-2 bg-white flex-shrink-0">
          <div className="flex items-center justify-center border border-slate-200/80 rounded-lg w-10 h-10 sm:w-10 sm:h-10 bg-white shadow-sm flex-shrink-0">
            <button
              onClick={syncAll}
              className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-orange-600 transition-colors duration-200"
              title="Sync"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="text-[7px] sm:text-[7px] font-bold text-slate-500">Refresh</span>
            </button>
          </div>
          <div className="w-[1px] h-6 sm:h-7 bg-slate-200 mx-0.5 self-center flex-shrink-0" />
          {PERMISSIONS.canAddEntry(role) && (
            <Link
              to="/add"
              className="flex items-center gap-1 bg-[#C96800] text-white font-bold text-[10px] sm:text-xs px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg flex-shrink-0 hover:bg-orange-50 hover:text-[#C96800] transition-all duration-200 shadow-sm whitespace-nowrap"
            >
              <Plus size={12} sm={14} />
              Add New Report
            </Link>
          )}
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {['month', 'annual'].map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className={`rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${
                activeView === view
                  ? 'bg-[#C96800] text-white border-[#C96800]'
                  : 'bg-white text-[#8B6525] border-[#E8C97A] hover:bg-[#FFF3D5]'
              }`}
            >
              {view === 'month' ? 'This Month' : 'Annual Report'}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-area px-4 pb-24 space-y-4">
        <h2 className="font-black text-[#3D1F00] text-base">
          {activeView === 'month' ? monthLabel : `Annual Report ${yearLabel}`}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total Vihar"
            value={activeView === 'month' ? stats.total : yearly.total}
            color="#1B7A3A"
            image={number}
          />
          <StatCard
            label="Total KM"
            value={`${activeView === 'month' ? stats.km : yearly.km} km`}
            color="#1B7A3A"
            image={road}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Sadhu Bhagvant"
            value={activeView === 'month' ? stats.sadhu : yearly.sadhu}
            image={sadhu}
            color="#1B7A3A"
          />
          <StatCard
            label="Sadhviji Bhagvant"
            value={activeView === 'month' ? stats.sadhviji : yearly.sadhviji}
            image={sadhviji}
            color="#1B7A3A"
          />
        </div>

        {activeView === 'month' ? (
          <>
            {(hasSevakRanking || hasSevikaRanking) && (
              <div className="bg-white border border-[#F5E5B0] rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 bg-[#FFFDF5] border border-[#F5E5B0] rounded-xl px-3 py-2">
                  <Search size={16} className="text-[#8B6525] flex-shrink-0" />
                  <input
                    value={rankingSearch}
                    onChange={(e) => setRankingSearch(e.target.value)}
                    placeholder="Search Vihar Sevak / Sevika"
                    className="w-full bg-transparent outline-none text-sm font-semibold text-[#3D1F00] placeholder:text-[#8B6525]"
                  />
                  {rankingSearch.trim() && (
                    <button
                      type="button"
                      onClick={() => setRankingSearch("")}
                      className="p-1 rounded-lg hover:bg-[#FFF3D6] text-[#8B6525] flex-shrink-0"
                      aria-label="Clear search"
                      title="Clear"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {rankingQuery && !hasSevakVisible && !hasSevikaVisible && (
                  <div className="pt-2 text-xs font-semibold text-[#8B6525]">
                    No matching Sevak/Sevika found.
                  </div>
                )}
              </div>
            )}

            {hasSevakRanking && (
              <Section
                title="Vihar Sevak"
                color="#C96800"
                collapsible={!forceOpenRankings}
                isOpen={forceOpenRankings || openRankingPanel === "sevak"}
                onToggle={() =>
                  setOpenRankingPanel((prev) => (prev === "sevak" ? null : "sevak"))
                }
              >
                {rankingQuery && !hasSevakVisible ? (
                  <div className="py-3 text-xs font-semibold text-[#8B6525]">
                    No matching Sevak found.
                  </div>
                ) : (
                  sevakList.map((item, index) => (
                    <RankRow
                      key={item.name}
                      rank={index + 1}
                      name={item.name}
                      count={item.count}
                      color="#C96800"
                    />
                  ))
                )}
              </Section>
            )}

            {hasSevikaRanking && (
              <Section
                title="Vihar Sevika"
                color="#C96800"
                collapsible={!forceOpenRankings}
                isOpen={forceOpenRankings || openRankingPanel === "sevika"}
                onToggle={() =>
                  setOpenRankingPanel((prev) => (prev === "sevika" ? null : "sevika"))
                }
              >
                {rankingQuery && !hasSevikaVisible ? (
                  <div className="py-3 text-xs font-semibold text-[#8B6525]">
                    No matching Sevika found.
                  </div>
                ) : (
                  sevikaList.map((item, index) => (
                    <RankRow
                      key={item.name}
                      rank={index + 1}
                      name={item.name}
                      count={item.count}
                      color="#C96800"
                    />
                  ))
                )}
              </Section>
            )}

            {currentMonthEntries.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-[#8B6525] font-semibold text-sm">
                  No entries for {monthLabel} yet.
                </p>
                {!scriptUrl && (
                  <button
                    onClick={() => setShowSettings(true)}
                    className="mt-3 text-xs font-bold text-[#C96800] border border-[#C96800] rounded-xl px-4 py-2"
                  >
                    ⚙️ Connect Google Sheets
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {entries.length === 0 && !loading ? (
              <div className="text-center py-12">
                <p className="text-[#8B6525] font-semibold text-sm">
                  No data yet for {yearLabel}.
                </p>
                {!scriptUrl && (
                  <button
                    onClick={() => setShowSettings(true)}
                    className="mt-3 text-xs font-bold text-[#C96800] border border-[#C96800] rounded-xl px-4 py-2"
                  >
                    ⚙️ Connect Google Sheets
                  </button>
                )}
              </div>
            ) : (
              <>
                {yearly.months.length > 0 && (
                  <div className="bg-white border border-[#F5E5B0] rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#F5E5B0] bg-[#FFFDF5]">
                      <p className="font-black text-sm text-[#3D1F00]">Month-Wise Report</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-[#FFF3D6]">
                            <th className="text-left px-5 py-2 font-black text-[#8B6525] text-center">Month</th>
                            <th className="px-1 py-2 font-black text-[#8B6525] text-center">Total Vihar</th>
                            <th className="px-1 py-2 font-black text-[#8B6525] text-center">Total Distance (KM)</th>
                            <th className="px-1 py-2 font-black text-[#8B6525] text-center">Total Sadhu Bhagvant</th>
                            <th className="px-1 py-2 font-black text-[#8B6525] text-center">Total Sadhviji Bhagvant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearly.months.map((month) => (
                            <tr key={month.key} className="border-t border-[#F5E5B0]">
                              <td className="px-3 py-2.5 font-semibold font-bold text-[#C96800] whitespace-nowrap">{month.label}</td>
                              <td className="px-3 py-2.5 text-center font-bold text-[#1B7A3A]">{month.total}</td>
                              <td className="px-3 py-2.5 text-center font-bold text-[#1B7A3A]">{month.km} KM</td>
                              <td className="px-3 py-2.5 text-center font-bold text-[#1B7A3A]">{month.sadhu}</td>
                              <td className="px-3 py-2.5 text-center font-bold text-[#1B7A3A]">{month.sadhviji}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {yearlySevakTop.length > 0 && (
                  <div className="bg-white border border-[#F5E5B0] rounded-2xl p-4 space-y-2">
                    <p className="font-black text-sm text-[#C96800] mb-3">Top 3 Vihar Sevak</p>
                    {yearlySevakTop.map((record) => (
                      <Medal key={record.name} rank={record.rank} name={record.name} count={record.count} color="#1B7A3A" />
                    ))}
                  </div>
                )}

                {yearlySevikaTop.length > 0 && (
                  <div className="bg-white border border-[#F5E5B0] rounded-2xl p-4 space-y-2">
                    <p className="font-black text-sm text-[#C96800] mb-3">Top 3 Vihar Sevika</p>
                    <div className={yearlySevikaTop.length > 4 ? "overflow-y-auto max-h-[260px] space-y-2 pr-1" : "space-y-2"}>
                      {yearlySevikaTop.map((record) => (
                        <Medal key={record.name} rank={record.rank} name={record.name} count={record.count} color="#1B7A3A" />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {showSettings && (
        <SettingsModal
          currentUrl={scriptUrl}
          onSave={handleSaveUrl}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color, image }) {
  return (
    <div className="bg-white border border-[#F5E5B0] rounded-xl px-3 py-2 flex items-center gap-3">
      <div>
        <img src={image} alt="" className="w-12 h-15 object-contain" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-[#C96800] leading-tight">{label}</span>
        <span className="font-black text-xl" style={{ color }}>{value}</span>
      </div>
    </div>
  );
}

function Section({ title, color, children, collapsible = false, isOpen = true, onToggle }) {
  return (
    <div className="bg-white border border-[#F5E5B0] rounded-2xl overflow-hidden">
      {collapsible ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="w-full px-4 py-2.5 border-b border-[#F5E5B0] bg-[#FFFDF5] flex items-center justify-between gap-3 text-left"
          style={{ backgroundColor: color + "18", borderLeft: `4px solid ${color}` }}
        >
          <span className="font-black text-sm" style={{ color }}>{title}</span>
          <ChevronDown
            size={18}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
            style={{ color }}
          />
        </button>
      ) : (
        <div className="px-4 py-2.5 border-b border-[#F5E5B0] bg-[#FFFDF5]" style={{ backgroundColor: color + "18", borderLeft: `4px solid ${color}` }}>
          <p className="font-black text-sm" style={{ color }}>{title}</p>
        </div>
      )}
      {(!collapsible || isOpen) && <div className="px-4 py-2 divide-y divide-[#F5E5B0]">{children}</div>}
    </div>
  );
}

function RankRow({ rank, name, count, color }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-xs font-black text-[#8B6525] w-5 text-center">{rank}.</span>
      <span className="flex-1 text-sm font-semibold text-[#3D1F00]">{name}</span>
      <span className="text-sm font-black" style={{ color }}>{count}</span>
    </div>
  );
}

function withDenseRanks(ranking) {
  let prevCount = null;
  let rank = 0;
  return (ranking || []).map((r) => {
    if (prevCount === null || r.count !== prevCount) rank += 1;
    prevCount = r.count;
    return { ...r, rank };
  });
}
