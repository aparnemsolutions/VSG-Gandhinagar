import { getMonthKey, getMonthLabel } from "./formatters";

export function groupByMonth(entries) {
  const map = {};
  for (const e of entries) {
    const key = getMonthKey(e.date);
    if (!map[key])
      map[key] = { key, label: getMonthLabel(e.date), entries: [] };
    map[key].entries.push(e);
  }
  return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
}

export function calcMonthStats(entries) {
  let sadhviji = 0,
    sadhu = 0,
    km = 0;
  const sevakCount = {},
    sevikaCount = {};

  for (const e of entries) {
    sadhviji += Number(e.sadhviji) || 0;
    sadhu += Number(e.sadhu) || 0;
    km += Number(e.km) || 0;
    (e.sevak || []).forEach((n) => {
      sevakCount[n] = (sevakCount[n] || 0) + 1;
    });
    (e.sevika || []).forEach((n) => {
      sevikaCount[n] = (sevikaCount[n] || 0) + 1;
    });
  }

  return {
    total: entries.length,
    sadhviji,
    sadhu,
    km: parseFloat(km.toFixed(1)),
    sevakRanking: sortRanking(sevakCount),
    sevikaRanking: sortRanking(sevikaCount),
  };
}

export function calcYearlyStats(entries) {
  const base = calcMonthStats(entries);
  const months = groupByMonth(entries).map((g) => ({
    label: g.label,
    key: g.key,
    ...calcMonthStats(g.entries),
  }));
  return { ...base, months };
}

function sortRanking(countMap) {
  return Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

export function topN(ranking, n = 5) {
  // Return all items with rank <= n (includes all tied at rank n)
  if (ranking.length === 0) return [];
  const maxRank = ranking[n - 1]?.rank ?? n;
  return ranking.filter((r) => r.rank <= maxRank);
}
