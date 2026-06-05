import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  Plus,
  RefreshCw,
  Search,
  Settings,
  X,
} from "lucide-react";
import { useSheets } from "../hooks/useSheets";
import { useAuth } from "../context/AuthContext";
import { PERMISSIONS } from "../config/sheets";
import { getMonthKey, getMonthLabel } from "../utils/formatters";
import { calcMonthStats } from "../utils/reportHelpers";
import SettingsModal from "../components/SettingsModal";
import logo from "../assets/VSG Logo.jpeg";
import sadhviji from "../assets/SadhvijiMs.png";
import sadhu from "../assets/SadhuMs.png";
import road from "../assets/TotalKm.jpg";
import number from "../assets/TotalVihar.png";
export default function Dashboard() {
  const { entries, loading, syncAll, scriptUrl, saveScriptUrl } = useSheets();
  const { fullName, role } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [openRankingPanel, setOpenRankingPanel] = useState("sevak");
  const [rankingSearch, setRankingSearch] = useState("");
  const didInitOpenPanel = useRef(false);

  useEffect(() => {
    syncAll();
  }, []);

  const currentMonthKey = getMonthKey(new Date().toISOString().slice(0, 10));
  const currentMonthEntries = entries.filter(
    (e) => getMonthKey(e.date) === currentMonthKey,
  );
  const stats = calcMonthStats(currentMonthEntries);
  const monthLabel = getMonthLabel(new Date().toISOString().slice(0, 10));
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

    // Initialize default open panel once (prefer Sevak, otherwise Sevika).
    if (!didInitOpenPanel.current) {
      didInitOpenPanel.current = true;
      setOpenRankingPanel(hasSevakVisible ? "sevak" : "sevika");
      return;
    }

    // Prefer keeping the current panel open if it has visible rows
    if (openRankingPanel === "sevak" && !hasSevakVisible && hasSevikaVisible)
      setOpenRankingPanel("sevika");
    if (openRankingPanel === "sevika" && !hasSevikaVisible && hasSevakVisible)
      setOpenRankingPanel("sevak");
  }, [openRankingPanel, hasSevakVisible, hasSevikaVisible, forceOpenRankings]);

  function handleSaveUrl(url) {
    saveScriptUrl(url);
  }

  return (
    <div className="flex flex-col h-full w-full max-w-[480px] mx-auto bg-[#FFFDF5]">
      {/* Header */}
      {/* <header className="flex items-center gap-2.5 px-4 pt-4 pb-3 bg-[#C96800]">
        <img src={logo} alt="VSG Logo" className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-orange-300" />
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-black text-base leading-tight">Vihar Seva Group (VSG) Gandhinagar </h1>
          <p className="text-orange-100 text-xs font-semibold truncate">Welcome, {fullName}</p>
        </div> */}

      {/* Setting Icon Excel Sheet sync */}
      {/* <button onClick={() => setShowSettings(true)} className="text-white p-2 rounded-xl hover:bg-orange-700" title="Settings">
          <Settings size={18} />
        </button> */}

      {/* <button onClick={syncAll} className="text-white p-2 rounded-xl hover:bg-orange-700" title="Sync">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
        {PERMISSIONS.canAddEntry(role) && (
          <Link to="/add" className="flex items-center gap-1 bg-white text-[#C96800] font-bold text-sm px-2 py-2 rounded-xl flex-shrink-0">
            Add New Report
          </Link>
        )}
      </header> */}

      <header className="flex items-stretch justify-between bg-white  shadow-sm border border-slate-100 overflow-hidden w-full">
        {/* Left Side (Orange Background with Slant) */}
        <div className="relative flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 flex-1 min-w-[175px] sm:min-w-[230px] flex-shrink-0">
          {/* Slanted Background Layer (Safe behind text) */}
          <div
            className="absolute inset-y-0 left-0 bg-[#C96800] w-[calc(60%+95px)] z-0"
            style={{
              clipPath: "polygon(0 0, 100% 0, calc(100% - 40px) 100%, 0 100%)",
            }}
          />

          {/* Logo & Text Container (Z-indexed above background so they are NEVER clipped) */}
          <div className="relative z-10 flex items-center gap-1.5 sm:gap-3 w-full min-w-0">
            {/* Compact Logo Container */}
            <div className="flex-shrink-0 w-8 h-8 sm:w-11 sm:h-11 rounded-full border border-orange-300/40 p-0.5 flex items-center justify-center bg-white shadow-sm">
              <img
                src={logo}
                alt="VSG Logo"
                className="w-10 h-10 sm:w-10 sm:h-10 rounded-full object-cover"
              />
            </div>

            {/* Compact Text Stack */}
            <div className="min-w-0 flex-1 flex flex-col justify-center text-white">
              <h1 className="font-bold text-xs sm:text-sm md:text-base leading-none whitespace-nowrap">
                Vihar Seva Group{" "}
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

        {/* Right Side (White Background) */}
        <div className="relative z-10 flex items-center gap-1.5 sm:gap-3 pl-1 pr-2.5 sm:px-4 py-2 bg-white flex-shrink-0">
          {/* Refresh Button Box */}
          <div className="flex items-center justify-center border border-slate-200/80 rounded-lg w-10 h-10 sm:w-10 sm:h-10 bg-white shadow-sm flex-shrink-0">
            <button
              onClick={syncAll}
              className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-orange-600 transition-colors duration-200"
              title="Sync"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="text-[7px] sm:text-[7px] font-bold text-slate-500">
                Refresh
              </span>
            </button>
          </div>

          {/* Vertical Separator */}
          <div className="w-[1px] h-6 sm:h-7 bg-slate-200 mx-0.5 self-center flex-shrink-0" />

          {/* Add New Report Button */}
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

      <div className="scroll-area px-4 pt-4 space-y-4">
        {/* Month heading — no duplicate capsule */}
        <h2 className="font-black text-[#3D1F00] text-base">{monthLabel}</h2>

        {/* Row 1: Total Vihar + Total KM */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total Vihar"
            value={stats.total}
            color="#1B7A3A"
            image={number}
          />
          <StatCard
            label="Total KM"
            value={`${stats.km} km`}
            color="#1B7A3A"
            image={road}
          />
        </div>

        {/* Row 2: Sadhviji + Sadhu side by side */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Sadhu Bhagvant"
            value={stats.sadhu}
            // icon={<img src={sadhu} alt="" className="w-10 h-10 object-contain" />}
            image={sadhu}
            color="#1B7A3A"
          />
          <StatCard
            label="Sadhviji Bhagvant"
            value={stats.sadhviji}
            // icon={<img src={sadhviji} alt="" className="w-10 h-10 object-contain" />}
            image={sadhviji}
            color="#1B7A3A"
          />
        </div>

        {/* Ranking search (Sevak / Sevika) */}
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

        {/* Sevak this month */}
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
              sevakList.map((r, i) => (
                <RankRow
                  key={r.name}
                  rank={i + 1}
                  name={r.name}
                  count={r.count}
                  color="#C96800"
                />
              ))
            )}
          </Section>
        )}

        {/* Sevika this month */}
        {hasSevikaRanking && (
          <Section
            title="Vihar Sevika"
            color="#C96800"
            collapsible={!forceOpenRankings}
            isOpen={forceOpenRankings || openRankingPanel === "sevika"}
            onToggle={() =>
              setOpenRankingPanel((prev) =>
                prev === "sevika" ? null : "sevika",
              )
            }
          >
            {rankingQuery && !hasSevikaVisible ? (
              <div className="py-3 text-xs font-semibold text-[#8B6525]">
                No matching Sevika found.
              </div>
            ) : (
              sevikaList.map((r, i) => (
                <RankRow
                  key={r.name}
                  rank={i + 1}
                  name={r.name}
                  count={r.count}
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

function StatCard({ label, value, icon, color, image }) {
  return (
    <div className="bg-white border border-[#F5E5B0] rounded-xl px-3 py-2 flex items-center gap-3">
      <div>
        {/* {icon && <span>{icon}</span>} */}
        <img src={image} alt="" className="w-12 h-15 object-contain" />
      </div>

      <div className="flex flex-col">
        <span className="text-sm font-bold text-[#C96800] leading-tight">
          {label}
        </span>

        <span className="font-black text-xl" style={{ color }}>
          {value}
        </span>
      </div>
    </div>
  );
}

function Section({
  title,
  color,
  children,
  collapsible = false,
  isOpen = true,
  onToggle,
}) {
  return (
    <div className="bg-white border border-[#F5E5B0] rounded-2xl overflow-hidden">
      {collapsible ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="w-full px-4 py-2.5 border-b border-[#F5E5B0] bg-[#FFFDF5] flex items-center justify-between gap-3 text-left"
          style={{
            backgroundColor: color + "18",
            borderLeft: `4px solid ${color}`,
          }}
        >
          <span className="font-black text-sm" style={{ color }}>
            {title}
          </span>
          <ChevronDown
            size={18}
            className={` transition-transform ${isOpen ? "rotate-180" : ""}`}
            style={{ color }}
          />
        </button>
      ) : (
        <div className="px-4 py-2.5 border-b border-[#F5E5B0] bg-[#FFFDF5]">
          style=
          {{ backgroundColor: color + "18", borderLeft: `4px solid ${color}` }}
          <p className="font-black text-sm" style={{ color }}>
            {title}
          </p>
        </div>
      )}

      {(!collapsible || isOpen) && (
        <div className="px-4 py-2 divide-y divide-[#F5E5B0]">{children}</div>
      )}
    </div>
  );
}

function RankRow({ rank, name, count, color }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-xs font-black text-[#8B6525] w-5 text-center">
        {rank}.
      </span>
      <span className="flex-1 text-sm font-semibold text-[#3D1F00]">
        {name}
      </span>
      <span className="text-sm font-black" style={{ color }}>
        {count}
      </span>
    </div>
  );
}
