import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { ChevronDown, Phone, RefreshCw, Search, X } from "lucide-react-native";
import { useSheets } from "../hooks/useSheets";
import tw from "twrnc";

const SECTION_ORDER = ["Captains", "Admins", "Doctors", "Others"];
const SECTION_COLORS = {
  Captains: "#C96800",
  Admins: "#A85000",
  Doctors: "#1B7A3A",
  Others: "#7B2D8B",
};

export default function ImportantContacts() {
  const { config, loading, syncConfig } = useSheets();
  const [openSection, setOpenSection] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const didInitOpenSection = useRef(false);

  useEffect(() => {
    syncConfig();
  }, []);

  const contacts = config?.importantContacts || [];
  const forceOpenSections = Boolean(searchQuery.trim());
  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => (c?.name || "").toLowerCase().includes(q));
  }, [contacts, searchQuery]);

  const grouped = SECTION_ORDER.reduce((acc, section) => {
    const list = filteredContacts.filter((c) => c.section === section);
    if (list.length) acc[section] = list;
    return acc;
  }, {});

  filteredContacts.forEach((c) => {
    if (!SECTION_ORDER.includes(c.section) && c.section) {
      if (!grouped[c.section]) grouped[c.section] = [];
      if (!grouped[c.section].find((x) => x.name === c.name))
        grouped[c.section].push(c);
    }
  });

  const sections = useMemo(() => Object.keys(grouped), [grouped]);

  useEffect(() => {
    if (forceOpenSections) return;
    if (!didInitOpenSection.current && sections.length > 0) {
      didInitOpenSection.current = true;
      setOpenSection(sections[0]);
      return;
    }
    if (openSection !== null && sections.length > 0 && !grouped[openSection]) {
      setOpenSection(sections[0]);
    }
  }, [sections, grouped, openSection, forceOpenSections]);

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  return (
    <View style={tw`flex-1 bg-[#FFFDF5]`}>
      {/* Header */}
      <View style={tw`flex-row items-center gap-3 px-4 pt-12 pb-3 bg-[#C96800]`}>
        {isSearchOpen ? (
          <View style={tw`flex-1 flex-row items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5`}>
            <Search size={18} color="white" />
            <TextInput
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name"
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={tw`flex-1 text-white text-sm font-semibold`}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={tw`p-1`}>
                <X size={16} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                style={tw`p-1`}
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={tw`text-white font-black text-base flex-1`}>Important Contacts</Text>
        )}

        {!isSearchOpen && (
          <TouchableOpacity onPress={() => setIsSearchOpen(true)} style={tw`p-2`}>
            <Search size={18} color="white" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={syncConfig} style={tw`p-2`}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <RefreshCw size={18} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={tw`flex-1 px-4 pt-5`} contentContainerStyle={tw`pb-24`}>
        {Object.keys(grouped).length === 0 && (
          <View style={tw`items-center py-12`}>
            <Phone size={24} color="#E8C97A" style={tw`mb-3`} />
            <Text style={tw`text-[#8B6525] font-semibold text-sm`}>
              {searchQuery.trim() ? "No matching contacts found." : "No contacts found."}
            </Text>
            <Text style={tw`text-xs text-[#8B6525] mt-1 text-center`}>
              {searchQuery.trim()
                ? "Try a different name or clear the search."
                : "Add contacts to the \"Important Contacts\" tab in your Google Sheet."}
            </Text>
          </View>
        )}

        {Object.entries(grouped).map(([section, list]) => {
          const sectionColor = SECTION_COLORS[section] || "#C96800";
          const isOpen = forceOpenSections || openSection === section;
          return (
            <View key={section} style={tw`mb-4`}>
              <TouchableOpacity
                onPress={() => {
                  if (forceOpenSections) return;
                  setOpenSection((prev) => (prev === section ? null : section));
                }}
                style={[
                  tw`flex-row items-center justify-between px-3 py-2 rounded-xl mb-2`,
                  {
                    backgroundColor: sectionColor + "18",
                    borderLeftWidth: 4,
                    borderLeftColor: sectionColor,
                  },
                ]}
              >
                <Text style={[tw`font-black text-sm`, { color: sectionColor }]}>{section}</Text>
                <ChevronDown
                  size={18}
                  color={sectionColor}
                  style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
                />
              </TouchableOpacity>

              {isOpen && (
                <View style={tw`gap-1.5`}>
                  {list.map((c, i) => (
                    <View
                      key={i}
                      style={tw`bg-white border border-[#F5E5B0] rounded-xl px-3 py-2 flex-row items-center gap-3`}
                    >
                      <View style={tw`flex-1`}>
                        <Text style={tw`font-bold text-[#3D1F00] text-sm`}>{c.name}</Text>
                        {c.note ? (
                          <Text style={tw`text-xs text-[#8B6525] mt-0.5`}>{c.note}</Text>
                        ) : null}
                      </View>
                      {c.phone ? (
                        <TouchableOpacity
                          onPress={() => handleCall(c.phone)}
                          style={tw`w-10 h-10 bg-[#1B7A3A] items-center justify-center rounded-xl`}
                        >
                          <Phone size={16} color="white" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
