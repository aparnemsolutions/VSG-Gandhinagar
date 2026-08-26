import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { BookOpen, Phone, Search, X } from "lucide-react-native";
import { useSheets } from "../hooks/useSheets";
import { useNavigation } from "@react-navigation/native";
import { fetchDirectoryRecords } from "../utils/directoryLoader";
import tw from "twrnc";

const DIRECTORY_PROFILE_KEYS = [
  "Email Id",
  "First Name",
  "Middle Name",
  "Last Name",
  "Gender",
  "Blood Group",
  "Contact Number",
  "Address",
  "Area",
  "City",
  "Work Type",
  "Company / Business Name",
  "Occupation / Profession",
  "Team",
  "Office Location / Business Area",
];

export default function ViharDirectory() {
  const { config, loading, syncAll } = useSheets();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [people, setPeople] = useState(null);
  const [fetchingDirectory, setFetchingDirectory] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [workTypeFilter, setWorkTypeFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");

  const navigation = useNavigation();

  useEffect(() => {
    syncAll();
  }, [syncAll]);

  async function loadDirectory() {
    setFetchingDirectory(true);
    setFetchError("");
    try {
      const records = await fetchDirectoryRecords();
      const filtered = records.map((record) => {
        const normalized = { _rowIndex: record._rowIndex };
        DIRECTORY_PROFILE_KEYS.forEach((key) => {
          if (
            Object.prototype.hasOwnProperty.call(record, key) &&
            String(record[key] ?? "").trim() !== ""
          ) {
            normalized[key] = record[key];
          }
        });
        return normalized;
      });
      setPeople(filtered);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Failed to load directory.",
      );
      setPeople(null);
    } finally {
      setFetchingDirectory(false);
    }
  }

  useEffect(() => {
    loadDirectory();
  }, []);

  function getPersonName(person) {
    if (!person) return "";
    const directName = String(
      person.Name ||
        person.name ||
        person["Full Name"] ||
        person.FullName ||
        "",
    ).trim();
    if (directName) return directName;

    const first = String(person["First Name"] || person.FirstName || "").trim();
    const middle = String(
      person["Middle Name"] || person.MiddleName || "",
    ).trim();
    const last = String(person["Last Name"] || person.LastName || "").trim();
    const full = [first, middle, last].filter(Boolean).join(" ");
    return full || String(person["Email Id"] || person.email || "").trim();
  }

  function getPersonWorkType(person) {
    if (!person) return "";
    return String(person["Work Type"] || person.WorkType || "").trim();
  }

  function getPersonOccupation(person) {
    if (!person) return "";
    return String(person["Occupation / Profession"] || person.OccupationProfession || "").trim();
  }

  function getPersonTeam(person) {
    if (!person) return "";
    return String(person["Team"] || person.team || "").trim();
  }

  function getPersonPhone(person) {
    if (!person) return "";
    return String(
      person["Contact Number"] ||
        person["Phone"] ||
        person.ContactNumber ||
        person.phone ||
        "",
    ).trim();
  }

  const query = searchQuery.trim().toLowerCase();
  const filteredPeople = useMemo(() => {
    if (!people) return [];
    let filtered = people;
    if (query) {
      filtered = people.filter((person) => {
        const name = getPersonName(person).toLowerCase();
        const workType = getPersonWorkType(person).toLowerCase();
        const occupation = getPersonOccupation(person).toLowerCase();
        const team = getPersonTeam(person).toLowerCase();
        const note = String(person.Note || person.note || "").toLowerCase();
        const email = String(
          person["Email Id"] || person.email || person.Email || "",
        ).toLowerCase();
        const section = String(
          person.Section ||
            person.section ||
            person["Area"] ||
            person.area ||
            person["City"] ||
            person.city ||
            "",
        ).toLowerCase();
        const contact = getPersonPhone(person).toLowerCase();

        return (
          name.includes(query) ||
          workType.includes(query) ||
          occupation.includes(query) ||
          team.includes(query) ||
          note.includes(query) ||
          email.includes(query) ||
          section.includes(query) ||
          contact.includes(query)
        );
      });
    }

    if (workTypeFilter) {
      filtered = filtered.filter((person) => {
        const wt = getPersonWorkType(person);
        return wt.toLowerCase() === workTypeFilter.toLowerCase();
      });
    }

    if (teamFilter) {
      filtered = filtered.filter((person) => {
        const t = String(person["Team"] || person.team || "").trim();
        return t.toLowerCase() === teamFilter.toLowerCase();
      });
    }

    return filtered.sort((a, b) => {
      const nameA = getPersonName(a).toLowerCase();
      const nameB = getPersonName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [people, query, workTypeFilter, teamFilter]);

  const workTypeOptions = useMemo(() => {
    if (!people) return [];
    const set = new Set();
    people.forEach((p) => {
      const v = getPersonWorkType(p);
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [people]);

  const teamOptions = useMemo(() => {
    if (!people) return [];
    const set = new Set();
    people.forEach((p) => {
      const v = String(p["Team"] || p.team || "").trim();
      if (v) set.add(v);
    });

    const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return Array.from(set).sort((a, b) => {
      const dayA = DAY_ORDER.indexOf(a);
      const dayB = DAY_ORDER.indexOf(b);
      if (dayA !== -1 && dayB !== -1) return dayA - dayB;
      if (dayA !== -1) return -1;
      if (dayB !== -1) return 1;
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });
  }, [people]);

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`).catch(() => {});
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
              placeholder="Search Vihar Sevak or Sevika"
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={tw`flex-1 text-white text-sm font-semibold`}
            />
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              style={tw`p-1`}
            >
              <X size={16} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={tw`text-white font-black text-base flex-1`}>Vihar Directory</Text>
        )}

        {!isSearchOpen && (
          <TouchableOpacity onPress={() => setIsSearchOpen(true)} style={tw`p-2`}>
            <Search size={18} color="white" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => {
            syncAll();
            loadDirectory();
          }}
          style={tw`p-2`}
        >
          {loading || fetchingDirectory ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <BookOpen size={18} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      {workTypeOptions.length > 0 && (
        <View style={tw`px-4 pt-3 pb-1 bg-white border-b border-[#F5E5B0]`}>
          <Text style={tw`text-[10px] text-[#8B6525] font-bold mb-1.5`}>Work Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row`}>
            <TouchableOpacity
              onPress={() => setWorkTypeFilter("")}
              style={[
                tw`px-3 py-1 rounded-full border mr-2 mb-1.5`,
                !workTypeFilter ? tw`bg-[#C96800] border-[#C96800]` : tw`bg-[#FFFDF5] border-[#E8C97A]`,
              ]}
            >
              <Text style={[tw`text-xs font-bold`, !workTypeFilter ? tw`text-white` : tw`text-[#8B6525]`]}>All</Text>
            </TouchableOpacity>
            {workTypeOptions.map((wt) => (
              <TouchableOpacity
                key={wt}
                onPress={() => setWorkTypeFilter(wt)}
                style={[
                  tw`px-3 py-1 rounded-full border mr-2 mb-1.5`,
                  workTypeFilter === wt ? tw`bg-[#C96800] border-[#C96800]` : tw`bg-[#FFFDF5] border-[#E8C97A]`,
                ]}
              >
                <Text style={[tw`text-xs font-bold`, workTypeFilter === wt ? tw`text-white` : tw`text-[#8B6525]`]}>{wt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {teamOptions.length > 0 && (
        <View style={tw`px-4 pt-2 pb-1 bg-white border-b border-[#F5E5B0]`}>
          <Text style={tw`text-[10px] text-[#8B6525] font-bold mb-1.5`}>Team / Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row`}>
            <TouchableOpacity
              onPress={() => setTeamFilter("")}
              style={[
                tw`px-3 py-1 rounded-full border mr-2 mb-1.5`,
                !teamFilter ? tw`bg-[#C96800] border-[#C96800]` : tw`bg-[#FFFDF5] border-[#E8C97A]`,
              ]}
            >
              <Text style={[tw`text-xs font-bold`, !teamFilter ? tw`text-white` : tw`text-[#8B6525]`]}>All</Text>
            </TouchableOpacity>
            {teamOptions.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTeamFilter(t)}
                style={[
                  tw`px-3 py-1 rounded-full border mr-2 mb-1.5`,
                  teamFilter === t ? tw`bg-[#C96800] border-[#C96800]` : tw`bg-[#FFFDF5] border-[#E8C97A]`,
                ]}
              >
                <Text style={[tw`text-xs font-bold`, teamFilter === t ? tw`text-white` : tw`text-[#8B6525]`]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Directory List */}
      <ScrollView style={tw`flex-1 px-4 pt-3`} contentContainerStyle={tw`pb-28`}>
        {fetchError ? (
          <View style={tw`items-center py-12`}>
            <Text style={tw`text-red-700 text-sm font-semibold text-center mb-2`}>{fetchError}</Text>
            <TouchableOpacity onPress={loadDirectory} style={tw`bg-[#C96800] px-4 py-2 rounded-xl`}>
              <Text style={tw`text-white font-bold text-xs`}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : fetchingDirectory ? (
          <View style={tw`items-center py-12`}>
            <ActivityIndicator color="#C96800" size="large" style={tw`mb-3`} />
            <Text style={tw`text-[#8B6525] text-sm font-semibold`}>Loading directory…</Text>
          </View>
        ) : filteredPeople.length === 0 ? (
          <View style={tw`items-center py-12`}>
            <Text style={tw`text-[#8B6525] text-sm font-semibold`}>
              {query ? "No matching names found." : "No directory entries available."}
            </Text>
          </View>
        ) : (
          <View style={tw`bg-white border border-[#F5E5B0] rounded-2xl overflow-hidden`}>
            <View style={tw`bg-[#FFFDF5] border-b border-[#F5E5B0] px-4 py-3`}>
              <Text style={tw`font-black text-sm text-[#C96800]`}>
                {filteredPeople.length} people
              </Text>
            </View>

            <View style={tw`divide-y divide-[#F5E5B0]`}>
              {filteredPeople.map((person, index) => {
                const name = getPersonName(person) || "Unknown";
                const phone = getPersonPhone(person);
                const workType = getPersonWorkType(person);
                const occupation = getPersonOccupation(person);
                const team = getPersonTeam(person);
                return (
                  <TouchableOpacity
                    key={`${person._rowIndex || index}-${index}`}
                    onPress={() =>
                      navigation.navigate("ViharDirectoryDetail", {
                        row: person._rowIndex || index + 1,
                        person,
                      })
                    }
                    style={tw`w-full px-4 py-3 flex-row items-center gap-3`}
                  >
                    <View style={tw`flex-1`}>
                      <Text style={tw`font-bold text-[#3D1F00] text-sm`} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={tw`text-[11px] text-[#8B6525] mt-1`} numberOfLines={1}>
                        {workType} <Text style={tw`text-[#C96800]`}>|</Text> {occupation}
                      </Text>
                      {team ? (
                        <Text style={tw`text-[#C96800] text-[11px] font-bold mt-1`}>{team} Team</Text>
                      ) : null}
                    </View>
                    {phone ? (
                      <TouchableOpacity
                        onPress={() => handleCall(phone)}
                        style={tw`w-9 h-9 bg-[#1B7A3A] items-center justify-center rounded-xl`}
                      >
                        <Phone size={14} color="white" />
                      </TouchableOpacity>
                    ) : (
                      <View style={tw`w-9 h-9`} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
