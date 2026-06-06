import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSheets } from "../hooks/useSheets";
import { calcYearlyStats } from "../utils/reportHelpers";
import Medal from "../components/Medal";
import { RefreshCw } from "lucide-react";
import sadhviji from "../assets/SadhvijiMs.png";
import sadhu from "../assets/SadhuMs.png";
import road from "../assets/TotalKm.jpg";
import number from "../assets/TotalVihar.png";

export default function Reports() {
  const { entries, config, loading, syncAll } = useSheets();
  const { session, ensureWriteAccess } = useAuth();
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    syncAll();
  }, []);

  const yearLabel =
    config?.appConfig?.current_year_label || new Date().getFullYear();
  const yearly = calcYearlyStats(entries);
  const sevakTop = topRanks(withDenseRanks(yearly.sevakRanking), 3);
  const sevikaTop = topRanks(withDenseRanks(yearly.sevikaRanking), 3);
  const isLoggedIn = Boolean(session?.sessionToken || session?.idToken);

  async function handleReportsLogin() {
    setLoginError('');
    setLoginLoading(true);
    try {
      await ensureWriteAccess();
    } catch (error) {
      setLoginError(error?.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full w-full max-w-[480px] mx-auto bg-[#FFFDF5]">
      <header className="px-4 pt-4 pb-3 bg-[#C96800] flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-white font-black text-base">Annual Report</h1>
          <p className="text-orange-100 text-xs font-semibold">{yearLabel}</p>
        </div>
        <button
          onClick={syncAll}
          className="text-white p-2 rounded-xl hover:bg-orange-700"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="scroll-area px-4 pt-4 space-y-4">
        {entries.length === 0 && !loading ? (
          <p className="text-center text-[#8B6525] text-sm py-12">
            No data yet for {yearLabel}.
          </p>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <YearCard
                label="Total Vihar"
                value={yearly.total}
                color="#1B7A3A"
                image={number}
              />
              <YearCard
                label="Total KM"
                value={`${yearly.km} km`}
                color="#1B7A3A"
                image={road}
              />
              <YearCard
                label="Sadhu Bhagvant"
                value={yearly.sadhu}
                // icon={<img src={sadhu} className="w-7 h-7 object-contain" alt="" />}
                image={sadhu}
                color="#1B7A3A"
              />
              <YearCard
                label="Sadhviji Bhagvant"
                value={yearly.sadhviji}
                // icon={<img src={sadhviji} className="w-7 h-7 object-contain" alt="" />}
                image={sadhviji}
                color="#1B7A3A"
              />
            </div>

            {/* Month-wise breakdown */}

            {/* Top 5 Sevak */}
            {sevakTop.length > 0 && (
              <div className="bg-white border border-[#F5E5B0] rounded-2xl p-4 space-y-3">
                <p className="font-black text-sm text-[#C96800] mb-3">
                  Top 3 Vihar Sevak
                </p>
                {isLoggedIn ? (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {sevakTop.map((r) => (
                      <Medal
                        key={r.name}
                        rank={r.rank}
                        name={r.name}
                        count={r.count}
                        color="#1B7A3A"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#F5E5B0] bg-[#FFF7E2] p-4 text-center">
                    <p className="text-sm text-[#8B6525] mb-3">
                      Login to view Top 3 Vihar Sevak rankings.
                    </p>
                    <button
                      type="button"
                      onClick={handleReportsLogin}
                      className="inline-flex items-center justify-center rounded-xl bg-[#C96800] px-4 py-2 text-white font-bold hover:bg-[#a85000]"
                    >
                      {loginLoading ? 'Signing in...' : 'Login with Google'}
                    </button>
                    {loginError && (
                      <p className="mt-2 text-xs text-red-600">{loginError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {sevikaTop.length > 0 && (
              <div className="bg-white border border-[#F5E5B0] rounded-2xl p-4 space-y-3">
                <p className="font-black text-sm text-[#C96800] mb-3">
                  Top 3 Vihar Sevika
                </p>
                {isLoggedIn ? (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {sevikaTop.map((r) => (
                      <Medal
                        key={r.name}
                        rank={r.rank}
                        name={r.name}
                        count={r.count}
                        color="#1B7A3A"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#F5E5B0] bg-[#FFF7E2] p-4 text-center">
                    <p className="text-sm text-[#8B6525] mb-3">
                      Login to view Top 3 Vihar Sevika rankings.
                    </p>
                    <button
                      type="button"
                      onClick={handleReportsLogin}
                      className="inline-flex items-center justify-center rounded-xl bg-[#C96800] px-4 py-2 text-white font-bold hover:bg-[#a85000]"
                    >
                      {loginLoading ? 'Signing in...' : 'Login with Google'}
                    </button>
                    {loginError && (
                      <p className="mt-2 text-xs text-red-600">{loginError}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// function YearCard({ label, value, icon, color }) {
//   return (
//     <div className="bg-white border border-[#F5E5B0] rounded-xl px-4 py-3 flex flex-col gap-1">
//       <div className="flex items-start justify-between">
//         <span className="text-xs font-bold text-[#8B6525] leading-tight">{label}</span>
//         {icon}
//       </div>
//       <span className="font-black text-xl" style={{ color }}>{value}</span>
//     </div>
//   );
// }

function YearCard({ label, value, icon, color, image }) {
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

function withDenseRanks(ranking) {
  let prevCount = null;
  let rank = 0;
  return (ranking || []).map((r) => {
    if (prevCount === null || r.count !== prevCount) rank += 1;
    prevCount = r.count;
    return { ...r, rank };
  });
}

function topRanks(rankingWithRank, maxRank = 5) {
  return (rankingWithRank || []).filter((r) => Number(r.rank) <= maxRank);
}
