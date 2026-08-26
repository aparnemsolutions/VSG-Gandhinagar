import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { Search, X, ArrowLeft } from "lucide-react-native";
import { useSheets } from "../hooks/useSheets";
import { calcYearlyStats } from "../utils/reportHelpers";
import { useRoute, useNavigation } from "@react-navigation/native";
import tw from "twrnc";

function withDenseRanks(ranking) {
  let prevCount = null;
  let rank = 0;
  return (ranking || []).map((r) => {
    if (prevCount === null || r.count !== prevCount) rank += 1;
    prevCount = r.count;
    return { ...r, rank };
  });
}

function RankRow({ rank, name, count, color = "#1B7A3A" }) {
  return (
    <View style={tw`flex-row items-center gap-3 py-3 border-b border-[#F5E5B0]`}>
      <Text style={tw`text-xs font-black text-[#8B6525] w-5 text-center`}>
        {rank}.
      </Text>
      <Text style={tw`flex-1 text-sm font-semibold text-[#3D1F00]`}>
        {name}
      </Text>
      <Text style={[tw`text-sm font-black`, { color }]}>
        {count}
      </Text>
    </View>
  );
}

export default function Rankings() {
  const { entries, config, syncAll } = useSheets();
  const [search, setSearch] = useState("");

  const route = useRoute();
  const navigation = useNavigation();

  useEffect(() => {
    syncAll();
  }, [syncAll]);

  const typeFilter = route.params?.type; // 'sevak' | 'sevika' | null

  const yearLabel = config?.appConfig?.current_year_label || new Date().getFullYear();
  const yearly = calcYearlyStats(entries || []);

  const sevakRanking = useMemo(
    () => withDenseRanks(yearly.sevakRanking || []),
    [yearly],
  );
  const sevikaRanking = useMemo(
    () => withDenseRanks(yearly.sevikaRanking || []),
    [yearly],
  );

  const q = search.trim().toLowerCase();
  const filteredSevak = q
    ? sevakRanking.filter((r) => (r.name || "").toLowerCase().includes(q))
    : sevakRanking;
  const filteredSevika = q
    ? sevikaRanking.filter((r) => (r.name || "").toLowerCase().includes(q))
    : sevikaRanking;

  return (
    <View style={tw`flex-1 bg-[#FFFDF5]`}>
      <View style={tw`flex-row items-center gap-2 px-3 pt-12 pb-2 bg-[#C96800]`}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Tabs", { screen: "DashboardTab", params: { tab: "annual" } })}
          style={tw`text-white p-2 rounded-lg`}
        >
          <ArrowLeft size={18} color="white" />
        </TouchableOpacity>
        <View style={tw`flex-1`}>
          <Text style={tw`text-white font-black text-sm`}>
            All Vihar Sevak & Sevika List
          </Text>
          <Text style={tw`text-orange-100 text-[11px] font-semibold`}>
            {yearLabel}
          </Text>
        </View>
      </View>

      <View style={tw`px-4 pt-3 pb-3`}>
        <View style={tw`flex-row items-center gap-2 rounded-2xl border border-[#E8C97A] px-3 py-1.5 bg-[#FFFDF5]`}>
          <Search size={18} color="#C96800" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search your name"
            placeholderTextColor="#8B6525"
            style={tw`flex-1 text-sm text-[#3D1F00]`}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")} style={tw`p-1`}>
              <X size={16} color="#C96800" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView style={tw`flex-1 px-4 pt-2`} contentContainerStyle={tw`pb-24`}>
        <View style={tw`flex-row gap-3`}>
          {(!typeFilter || typeFilter === "sevak") && (
            <View style={tw`flex-1 bg-white border border-[#F5E5B0] rounded-2xl p-4`}>
              <Text style={tw`font-black text-sm text-[#C96800] mb-3`}>
                All Vihar Sevak
              </Text>
              <View style={tw`gap-1`}>
                {filteredSevak.map((r) => (
                  <RankRow
                    key={`sevak-${r.name}`}
                    rank={r.rank}
                    name={r.name}
                    count={r.count}
                  />
                ))}
              </View>
            </View>
          )}

          {(!typeFilter || typeFilter === "sevika") && (
            <View style={tw`flex-1 bg-white border border-[#F5E5B0] rounded-2xl p-4`}>
              <Text style={tw`font-black text-sm text-[#C96800] mb-3`}>
                All Vihar Sevika
              </Text>
              <View style={tw`gap-1`}>
                {filteredSevika.map((r) => (
                  <RankRow
                    key={`sevika-${r.name}`}
                    rank={r.rank}
                    name={r.name}
                    count={r.count}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
