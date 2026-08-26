import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RefreshCw, Plus, ChevronDown } from "lucide-react-native";
import { useSheets } from "../hooks/useSheets";
import { useAuth } from "../context/AuthContext";
import { PERMISSIONS } from "../config/sheets";
import { getMonthKey, getMonthLabel } from "../utils/formatters";
import { calcMonthStats, calcYearlyStats, topN } from "../utils/reportHelpers";
import SettingsModal from "../components/SettingsModal";
import Medal from "../components/Medal";
import tw from "twrnc";

import logo from "../assets/VSG Logo.jpeg";
import sadhviji from "../assets/SadhvijiMs.png";
import sadhu from "../assets/SadhuMs.png";
import road from "../assets/TotalKm.jpg";
import number from "../assets/TotalVihar.png";

export default function Dashboard() {
  const { entries, config, loading, syncAll, scriptUrl, saveScriptUrl } = useSheets();
  const { fullName, role } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const [showSettings, setShowSettings] = useState(false);
  const [activeView, setActiveView] = useState("month");

  useEffect(() => {
    syncAll();
  }, [syncAll]);

  useEffect(() => {
    if (route.params?.tab === "annual") {
      setActiveView("annual");
    }
  }, [route.params?.tab]);

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
  const previousMonths = yearly.months.filter(
    (month) => month.key !== currentMonthKey,
  );

  return (
    <View style={tw`flex-1 bg-[#FFFDF5]`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 pt-12 pb-3 bg-[#C96800]`}>
        <View style={tw`flex-row items-center gap-2.5 flex-1`}>
          <Image
            source={logo}
            style={tw`w-10 h-10 rounded-full border-2 border-orange-300`}
            resizeMode="cover"
          />
          <View style={tw`flex-1`}>
            <Text style={tw`text-white font-black text-sm`}>Vihar Seva Group</Text>
            <Text style={tw`text-orange-200 text-[10px] font-bold`}>VSG - Gandhinagar</Text>
            <Text style={tw`text-orange-100 text-[10px] font-semibold`}>Welcome, {fullName}</Text>
          </View>
        </View>

        <View style={tw`flex-row items-center gap-2`}>
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            style={tw`p-2 bg-orange-700 rounded-xl`}
          >
            <Text style={tw`text-white text-xs font-bold`}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={syncAll}
            style={tw`p-2 bg-orange-700 rounded-xl`}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <RefreshCw size={18} color="white" />
            )}
          </TouchableOpacity>
          {PERMISSIONS.canAddEntry(role) && (
            <TouchableOpacity
              onPress={() => navigation.navigate("AddEntry")}
              style={tw`flex-row items-center gap-1 bg-white px-2.5 py-2 rounded-xl`}
            >
              <Plus size={12} color="#C96800" />
              <Text style={tw`text-[#C96800] font-bold text-xs`}>Add Report</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={tw`px-4 pt-4 flex-row gap-2`}>
        {["month", "annual"].map((view) => (
          <TouchableOpacity
            key={view}
            onPress={() => setActiveView(view)}
            style={tw`flex-1 rounded-2xl border px-4 py-3 items-center ${
              activeView === view
                ? "bg-[#C96800] border-[#C96800]"
                : "bg-white border-[#E8C97A]"
            }`}
          >
            <Text
              style={tw`text-sm font-bold ${
                activeView === view ? "text-white" : "text-[#8B6525]"
              }`}
            >
              {view === "month" ? "Monthly Report" : "Annual Report"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={tw`flex-1 px-4 mt-4`} contentContainerStyle={tw`pb-24`}>
        <Text style={tw`font-black text-[#3D1F00] text-base mb-3`}>
          {activeView === "month" ? monthLabel : `Annual Report ${yearLabel}`}
        </Text>

        {/* Stats Grid */}
        <View style={tw`flex-row gap-3 mb-3`}>
          <StatCard
            label="Total Vihar"
            value={activeView === "month" ? stats.total : yearly.total}
            color="#1B7A3A"
            image={number}
          />
          <StatCard
            label="Total KM"
            value={`${activeView === "month" ? stats.km : yearly.km} km`}
            color="#1B7A3A"
            image={road}
          />
        </View>
        <View style={tw`flex-row gap-3 mb-4`}>
          <StatCard
            label="Sadhu Bhagvant"
            value={activeView === "month" ? stats.sadhu : yearly.sadhu}
            image={sadhu}
            color="#1B7A3A"
          />
          <StatCard
            label="Sadhviji Bhagvant"
            value={activeView === "month" ? stats.sadhviji : yearly.sadhviji}
            image={sadhviji}
            color="#1B7A3A"
          />
        </View>

        {activeView === "month" ? (
          <>
            {previousMonths.length > 0 ? (
              <View style={tw`bg-white border border-[#F5E5B0] rounded-2xl overflow-hidden mb-4`}>
                <View style={tw`px-4 py-3 border-b border-[#F5E5B0] bg-[#FFFDF5]`}>
                  <Text style={tw`font-black text-sm text-[#3D1F00]`}>Month-Wise Report</Text>
                </View>
                
                {/* Custom Table Head */}
                <View style={tw`flex-row bg-[#FFF3D6] px-4 py-2`}>
                  <Text style={tw`flex-2 font-black text-[#8B6525] text-xs`}>Month</Text>
                  <Text style={tw`flex-1 font-black text-[#8B6525] text-xs text-center`}>Vihar</Text>
                  <Text style={tw`flex-1 font-black text-[#8B6525] text-xs text-center`}>KM</Text>
                  <Text style={tw`flex-1 font-black text-[#8B6525] text-xs text-center`}>Sadhu</Text>
                  <Text style={tw`flex-1 font-black text-[#8B6525] text-xs text-center`}>Sadhviji</Text>
                </View>

                {/* Custom Table Body */}
                {previousMonths.map((month) => (
                  <View key={month.key} style={tw`flex-row border-t border-[#F5E5B0] px-4 py-3 items-center`}>
                    <Text style={tw`flex-2 font-bold text-[#C96800] text-xs`}>{month.label}</Text>
                    <Text style={tw`flex-1 font-bold text-[#1B7A3A] text-xs text-center`}>{month.total}</Text>
                    <Text style={tw`flex-1 font-bold text-[#1B7A3A] text-xs text-center`}>{month.km}</Text>
                    <Text style={tw`flex-1 font-bold text-[#1B7A3A] text-xs text-center`}>{month.sadhu}</Text>
                    <Text style={tw`flex-1 font-bold text-[#1B7A3A] text-xs text-center`}>{month.sadhviji}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={tw`bg-white border border-[#F5E5B0] rounded-2xl p-4 mb-4`}>
                <Text style={tw`text-[#8B6525] text-sm`}>
                  Previous month totals will appear here once the next month begins.
                </Text>
              </View>
            )}

            {currentMonthEntries.length === 0 && !loading && (
              <View style={tw`items-center py-12`}>
                <Text style={tw`text-[#8B6525] font-semibold text-sm`}>
                  No entries for {monthLabel} yet.
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {entries.length === 0 && !loading ? (
              <View style={tw`items-center py-12`}>
                <Text style={tw`text-[#8B6525] font-semibold text-sm`}>
                  No data yet for {yearLabel}.
                </Text>
              </View>
            ) : (
              <View style={tw`gap-4`}>
                {yearlySevakTop.length > 0 && (
                  <View style={tw`bg-white border border-[#F5E5B0] rounded-2xl p-4`}>
                    <View style={tw`flex-row items-center justify-between mb-3`}>
                      <Text style={tw`font-black text-sm text-[#C96800]`}>Top 3 Vihar Sevak</Text>
                      <TouchableOpacity
                        onPress={() => navigation.navigate("Rankings", { type: "sevak" })}
                        style={tw`border border-[#E8C97A] rounded-xl px-3 py-1 bg-white`}
                      >
                        <Text style={tw`text-xs font-bold text-[#C96800]`}>View all</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={tw`gap-2`}>
                      {yearlySevakTop.map((record) => (
                        <Medal
                          key={record.name}
                          rank={record.rank}
                          name={record.name}
                          count={record.count}
                          color="#1B7A3A"
                        />
                      ))}
                    </View>
                  </View>
                )}

                {yearlySevikaTop.length > 0 && (
                  <View style={tw`bg-white border border-[#F5E5B0] rounded-2xl p-4`}>
                    <View style={tw`flex-row items-center justify-between mb-3`}>
                      <Text style={tw`font-black text-sm text-[#C96800]`}>Top 3 Vihar Sevika</Text>
                      <TouchableOpacity
                        onPress={() => navigation.navigate("Rankings", { type: "sevika" })}
                        style={tw`border border-[#E8C97A] rounded-xl px-3 py-1 bg-white`}
                      >
                        <Text style={tw`text-xs font-bold text-[#C96800]`}>View all</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={tw`gap-2`}>
                      {yearlySevikaTop.map((record) => (
                        <Medal
                          key={record.name}
                          rank={record.rank}
                          name={record.name}
                          count={record.count}
                          color="#1B7A3A"
                        />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        currentUrl={scriptUrl}
        onSave={saveScriptUrl}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
}

function StatCard({ label, value, color, image }) {
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
