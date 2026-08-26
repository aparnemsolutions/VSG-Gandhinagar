import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { RefreshCw, ArrowLeft } from "lucide-react-native";
import { useSheets } from "../hooks/useSheets";
import { useAuth } from "../context/AuthContext";
import { calcYearlyStats } from "../utils/reportHelpers";
import { useNavigation } from "@react-navigation/native";
import Medal from "../components/Medal";
import tw from "twrnc";

import sadhviji from "../assets/SadhvijiMs.png";
import sadhu from "../assets/SadhuMs.png";
import road from "../assets/TotalKm.jpg";
import number from "../assets/TotalVihar.png";

export default function Reports() {
  const { entries, config, loading, syncAll } = useSheets();
  const { session, ensureWriteAccess } = useAuth();
  const navigation = useNavigation();
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    syncAll();
  }, []);

  const yearLabel = config?.appConfig?.current_year_label || new Date().getFullYear();
  const yearly = calcYearlyStats(entries);
  const sevakTop = topRanks(withDenseRanks(yearly.sevakRanking), 3);
  const sevikaTop = topRanks(withDenseRanks(yearly.sevikaRanking), 3);
  const isLoggedIn = Boolean(session?.sessionToken);

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
    <View style={tw`flex-1 bg-[#FFFDF5]`}>
      <View style={tw`flex-row items-center gap-2 px-3 pt-12 pb-2 bg-[#C96800]`}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={tw`p-2`}
        >
          <ArrowLeft size={18} color="white" />
        </TouchableOpacity>
        <View style={tw`flex-1`}>
          <Text style={tw`text-white font-black text-base`}>Annual Report</Text>
          <Text style={tw`text-orange-100 text-xs font-semibold`}>{yearLabel}</Text>
        </View>
        <TouchableOpacity onPress={syncAll} style={tw`p-2`}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <RefreshCw size={18} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1 px-4 pt-4`} contentContainerStyle={tw`pb-24`}>
        {entries.length === 0 && !loading ? (
          <Text style={tw`text-center text-[#8B6525] text-sm py-12`}>
            No data yet for {yearLabel}.
          </Text>
        ) : (
          <View style={tw`gap-4`}>
            {/* Summary cards */}
            <View style={tw`flex-row gap-3`}>
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
            </View>
            <View style={tw`flex-row gap-3`}>
              <YearCard
                label="Sadhu"
                value={yearly.sadhu}
                image={sadhu}
                color="#1B7A3A"
              />
              <YearCard
                label="Sadhviji"
                value={yearly.sadhviji}
                image={sadhviji}
                color="#1B7A3A"
              />
            </View>

            {/* Top 3 Sevak */}
            {sevakTop.length > 0 && (
              <View style={tw`bg-white border border-[#F5E5B0] rounded-2xl p-4 gap-3`}>
                <Text style={tw`font-black text-sm text-[#C96800]`}>
                  Top 3 Vihar Sevak
                </Text>
                {isLoggedIn ? (
                  <View style={tw`gap-2`}>
                    {sevakTop.map((r) => (
                      <Medal
                        key={r.name}
                        rank={r.rank}
                        name={r.name}
                        count={r.count}
                        color="#1B7A3A"
                      />
                    ))}
                  </View>
                ) : (
                  <View style={tw`rounded-2xl border border-[#F5E5B0] bg-[#FFF7E2] p-4 items-center`}>
                    <Text style={tw`text-sm text-[#8B6525] mb-3 text-center`}>
                      Login to view Top 3 Vihar Sevak rankings.
                    </Text>
                    <TouchableOpacity
                      onPress={handleReportsLogin}
                      style={tw`bg-[#C96800] px-4 py-2.5 rounded-xl`}
                    >
                      <Text style={tw`text-white font-bold text-sm`}>
                        {loginLoading ? 'Signing in...' : 'Sign In'}
                      </Text>
                    </TouchableOpacity>
                    {loginError ? (
                      <Text style={tw`mt-2 text-xs text-red-600`}>{loginError}</Text>
                    ) : null}
                  </View>
                )}
              </View>
            )}

            {/* Top 3 Sevika */}
            {sevikaTop.length > 0 && (
              <View style={tw`bg-white border border-[#F5E5B0] rounded-2xl p-4 gap-3`}>
                <Text style={tw`font-black text-sm text-[#C96800]`}>
                  Top 3 Vihar Sevika
                </Text>
                {isLoggedIn ? (
                  <View style={tw`gap-2`}>
                    {sevikaTop.map((r) => (
                      <Medal
                        key={r.name}
                        rank={r.rank}
                        name={r.name}
                        count={r.count}
                        color="#1B7A3A"
                      />
                    ))}
                  </View>
                ) : (
                  <View style={tw`rounded-2xl border border-[#F5E5B0] bg-[#FFF7E2] p-4 items-center`}>
                    <Text style={tw`text-sm text-[#8B6525] mb-3 text-center`}>
                      Login to view Top 3 Vihar Sevika rankings.
                    </Text>
                    <TouchableOpacity
                      onPress={handleReportsLogin}
                      style={tw`bg-[#C96800] px-4 py-2.5 rounded-xl`}
                    >
                      <Text style={tw`text-white font-bold text-sm`}>
                        {loginLoading ? 'Signing in...' : 'Sign In'}
                      </Text>
                    </TouchableOpacity>
                    {loginError ? (
                      <Text style={tw`mt-2 text-xs text-red-600`}>{loginError}</Text>
                    ) : null}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function YearCard({ label, value, color, image }) {
  return (
    <View style={tw`flex-1 bg-white border border-[#F5E5B0] rounded-xl px-3 py-2.5 flex-row items-center gap-3`}>
      <Image source={image} style={tw`w-12 h-12`} resizeMode="contain" />
      <View style={tw`flex-1`}>
        <Text style={tw`text-xs font-bold text-[#C96800] leading-tight`}>{label}</Text>
        <Text style={[tw`font-black text-base mt-0.5`, { color }]}>{value}</Text>
      </View>
    </View>
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
