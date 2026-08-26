import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { RefreshCw, Copy, Pencil, ChevronDown, ChevronUp } from "lucide-react-native";
import { useSheets } from "../hooks/useSheets";
import { useAuth } from "../context/AuthContext";
import { PERMISSIONS } from "../config/sheets";
import { formatDate, formatTime, buildWhatsAppMessage } from "../utils/formatters";
import Toast from "../components/Toast";
import * as Clipboard from 'expo-clipboard';
import tw from "twrnc";

export default function Entries() {
  const { entries, loading, syncEntries } = useSheets();
  const { role, ensureWriteAccess } = useAuth();
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    syncEntries();
  }, []);

  const sorted = [...entries].sort(
    (a, b) => Number(b.viharNo) - Number(a.viharNo),
  );

  function toggle(id) {
    setExpanded((e) => (e === id ? null : id));
  }

  async function copyMsg(entry) {
    const msg = buildWhatsAppMessage(entry);
    try {
      await Clipboard.setStringAsync(msg);
      setToast({ message: "Copied!", type: "success" });
    } catch (err) {
      setToast({ message: "Failed to copy message", type: "error" });
    }
  }

  return (
    <View style={tw`flex-1 bg-[#FFFDF5]`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 pt-12 pb-3 bg-[#C96800]`}>
        <Text style={tw`text-white font-black text-base flex-1`}>Vihar Entries</Text>
        <TouchableOpacity onPress={syncEntries} style={tw`p-2 rounded-xl`}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <RefreshCw size={18} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Entries List */}
      <ScrollView style={tw`flex-1 px-4 pt-3`} contentContainerStyle={tw`pb-24`}>
        {sorted.length === 0 && (
          <Text style={tw`text-center text-[#8B6525] text-sm font-semibold py-12`}>
            {loading ? "Loading…" : "No entries found."}
          </Text>
        )}

        {sorted.map((entry) => (
          <View
            key={entry.id}
            style={tw`bg-white border border-[#F5E5B0] rounded-2xl overflow-hidden mb-2.5`}
          >
            {/* Card Header */}
            <TouchableOpacity
              onPress={() => toggle(entry.id)}
              style={tw`flex-row items-center gap-3 px-4 py-3`}
            >
              <View style={tw`bg-[#C96800] px-1 py-1 rounded-lg items-center w-12`}>
                <Text style={tw`text-[8px] font-bold text-white uppercase tracking-wide opacity-80 text-center leading-tight`}>
                  Vihar{"\n"}No.
                </Text>
                <Text style={tw`text-sm font-black text-white`}>{entry.viharNo}</Text>
              </View>
              
              <View style={tw`flex-1`}>
                <Text style={tw`font-bold text-[#3D1F00] text-sm`} numberOfLines={1}>
                  {entry.from} → {entry.to}
                </Text>
                <Text style={tw`text-xs text-[#8B6525] mt-0.5`}>
                  {formatDate(entry.date)} · {entry.km} km
                </Text>
              </View>

              {expanded === entry.id ? (
                <ChevronUp size={16} color="#8B6525" />
              ) : (
                <ChevronDown size={16} color="#8B6525" />
              )}
            </TouchableOpacity>

            {/* Expanded Content */}
            {expanded === entry.id && (
              <View style={tw`px-4 pb-4 border-t border-[#F5E5B0] pt-3 gap-2.5`}>
                <Row label="Date" value={formatDate(entry.date)} />
                <Row
                  label="Time"
                  value={`${formatTime(entry.startTime)} – ${formatTime(entry.endTime)}`}
                />
                <Row
                  label="Thana"
                  value={`${entry.sadhu || 0} Sadhu Bhagvant + ${entry.sadhviji || 0} Sadhviji Bhagvant`}
                />
                {entry.maharajNames?.length > 0 && (
                  <Row
                    label="Maharaj Saheb"
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

                {/* Actions */}
                <View style={tw`flex-row gap-2 pt-2`}>
                  <TouchableOpacity
                    onPress={() => copyMsg(entry)}
                    style={tw`flex-1 flex-row items-center justify-center gap-1.5 bg-[#25D366] rounded-xl py-2.5`}
                  >
                    <Copy size={14} color="white" />
                    <Text style={tw`text-white font-bold text-xs`}>Copy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={async () => {
                      if (!PERMISSIONS.canEditEntry(role)) {
                        try {
                          await ensureWriteAccess();
                        } catch {
                          return;
                        }
                      }
                      navigation.navigate("AddEntry", { entry });
                    }}
                    style={tw`flex-row items-center justify-center bg-[#E8C97A] rounded-xl py-2.5 px-4`}
                  >
                    <Pencil size={14} color="#3D1F00" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={tw`flex-row gap-2`}>
      <Text style={tw`text-xs font-bold text-[#8B6525] w-24`}>{label}</Text>
      <Text style={tw`text-xs text-[#3D1F00] font-semibold flex-1`}>{value}</Text>
    </View>
  );
}
