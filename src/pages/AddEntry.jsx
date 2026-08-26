import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ChevronLeft, Copy, Check } from "lucide-react-native";
import { useSheets } from "../hooks/useSheets";
import { useAuth } from "../context/AuthContext";
import { todayISO, buildWhatsAppMessage } from "../utils/formatters";
import AutoComplete from "../components/AutoComplete";
import ListInput from "../components/ListInput";
import Toast from "../components/Toast";
import * as Clipboard from 'expo-clipboard';
import tw from "twrnc";

import sadhviji from "../assets/SadhvijiMs.png";
import sadhu from "../assets/SadhuMs.png";

function parseTimeForInput(val) {
  if (!val) return "";
  if (typeof val === "string" && val.includes("T")) {
    const d = new Date(val);
    if (!isNaN(d))
      return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }

  if (typeof val === "string") {
    const m = val.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (m) {
      let hours = Number(m[1]);
      const minutes = Number(m[2]);
      const ampm = m[3].toUpperCase();
      if (hours === 12) hours = 0;
      if (ampm === "PM") hours += 12;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  }
  return String(val);
}

function to12HourTime(value) {
  if (!value) return "";
  if (typeof value === "string" && value.trim().match(/[AaPp][Mm]$/)) return value.trim().toUpperCase();

  const [hRaw, mRaw] = String(value).split(":");
  const hours = Number(hRaw);
  const minutes = Number(mRaw);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return String(value);

  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

function parseTimeTo24(value) {
  if (!value) return null;
  const str = String(value).trim();

  if (str.includes("T")) {
    const d = new Date(str);
    if (isNaN(d)) return null;
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  const m12 = str.match(/^(\d{1,2})\s*:\s*(\d{1,2})\s*([AaPp][Mm])$/);
  if (m12) {
    let hours = Number(m12[1]);
    const minutes = Number(m12[2]);
    const ampm = m12[3].toUpperCase();
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes < 0 || minutes > 59) return null;
    if (hours < 1 || hours > 12) return null;
    if (hours === 12) hours = 0;
    if (ampm === "PM") hours += 12;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  const m24 = str.match(/^(\d{1,2})\s*:\s*(\d{1,2})$/);
  if (m24) {
    const hours = Number(m24[1]);
    const minutes = Number(m24[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  return null;
}

function normalizeTimeForDisplay(value) {
  const hhmm = parseTimeTo24(value);
  if (!hhmm) return value ? String(value) : "";
  return to12HourTime(hhmm);
}

const DEFAULT_FORM = {
  date: todayISO(),
  startTime: "",
  endTime: "",
  sadhviji: "",
  sadhu: "",
  maharajNames: [""],
  km: "",
  from: "",
  via: "",
  to: "",
  sevak: [""],
  sevika: [""],
};

export default function AddEntry() {
  const navigation = useNavigation();
  const route = useRoute();
  const { entries, config, saveEntry, nextViharNo, syncConfig, syncEntries } = useSheets();
  const { session, authReady, ensureWriteAccess } = useAuth();

  const editEntry = route.params?.entry || null;

  const [form, setForm] = useState(() =>
    editEntry
      ? {
          ...DEFAULT_FORM,
          ...editEntry,
          startTime:
            parseTimeForInput(editEntry.startTime) ||
            DEFAULT_FORM.startTime,
          endTime:
            parseTimeForInput(editEntry.endTime) || DEFAULT_FORM.endTime,
          maharajNames: editEntry.maharajNames?.length
            ? editEntry.maharajNames
            : [""],
          sevak: editEntry.sevak?.length ? editEntry.sevak : [""],
          sevika: editEntry.sevika?.length ? editEntry.sevika : [""],
        }
      : DEFAULT_FORM,
  );
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    syncConfig();
    syncEntries();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!authReady) return;

    ensureWriteAccess().catch(() => {
      if (cancelled) return;
      navigation.goBack();
    });
    return () => {
      cancelled = true;
    };
  }, [authReady, ensureWriteAccess]);

  const places = config?.places || [];
  const sevakNames = config?.sevakNames || [];
  const sevikaNames = config?.sevikaNames || [];
  const viharNo = editEntry?.viharNo ?? nextViharNo;
  const whatsAppMsg = buildWhatsAppMessage({ ...form, viharNo });

  function normText(v) {
    return String(v || "").trim().toLowerCase();
  }

  function normList(list) {
    return (Array.isArray(list) ? list : [])
      .map(normText)
      .filter(Boolean)
      .sort();
  }

  function dupSignature(f) {
    return JSON.stringify({
      date: String(f?.date || ""),
      from: normText(f?.from),
      to: normText(f?.to),
      sadhu: Number(f?.sadhu) || 0,
      sadhviji: Number(f?.sadhviji) || 0,
      sevak: normList(f?.sevak),
      sevika: normList(f?.sevika),
    });
  }

  function findDuplicate(sig, list) {
    for (const e of list || []) {
      if (editEntry && e?.id === editEntry.id) continue;
      const s = dupSignature(e);
      if (s === sig) return e;
    }
    return null;
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    if (!form.date) return "Date is required";
    if (!form.from.trim()) return "From location is required";
    if (!form.to.trim()) return "To location is required";
    if (!form.km || Number(form.km) <= 0) return "Distance (KM) is required";
    if (!parseTimeTo24(form.startTime)) return "Start Time is invalid";
    if (!parseTimeTo24(form.endTime)) return "End Time is invalid";

    const sv = Number(form.sadhviji) || 0;
    const sd = Number(form.sadhu) || 0;
    if (sv === 0 && sd === 0)
      return "Enter count for at least Sadhviji Bhagwant or Sadhu Bhagwant";

    const hasSevak = form.sevak.some(Boolean);
    const hasSevika = form.sevika.some(Boolean);
    if (!hasSevak && !hasSevika)
      return "At least one Vihar Sevak or Vihar Sevika must be added";

    return null;
  }

  async function handleCopy() {
    try {
      await Clipboard.setStringAsync(whatsAppMsg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast({ message: "Failed to copy message", type: "error" });
    }
  }

  async function handleSave() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const err = validate();
      if (err) {
        setToast({ message: err, type: "error" });
        return;
      }

      let latestEntries = entries;
      try {
        const fresh = await syncEntries();
        if (Array.isArray(fresh)) latestEntries = fresh;
      } catch {
        // fall back to cached
      }

      const sig = dupSignature(form);
      const dup = findDuplicate(sig, latestEntries);
      if (dup) {
        setToast({
          message: `Similar entry already exists (Vihar No. ${dup.viharNo}).`,
          type: "error",
        });
        return;
      }

      const startTime24 = parseTimeTo24(form.startTime);
      const endTime24 = parseTimeTo24(form.endTime);
      const entry = {
        ...form,
        viharNo,
        id: editEntry?.id || `vsg-${Date.now()}`,
        startTime: to12HourTime(startTime24),
        endTime: to12HourTime(endTime24),
        sevak: form.sevak.filter(Boolean),
        sevika: form.sevika.filter(Boolean),
        maharajNames: form.maharajNames.filter(Boolean),
        savedBy: session.fullName || session.email || session.username || '',
        savedAt: new Date().toISOString(),
      };
      const res = await saveEntry(entry);
      const finalEntry = res?.viharNo ? { ...entry, viharNo: res.viharNo } : entry;
      navigation.navigate("EntryConfirm", { entry: finalEntry });
    } catch (e) {
      setToast({ message: e.message || "Save failed", type: "error" });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <View style={tw`flex-1 bg-[#FFFDF5]`}>
      {/* Header */}
      <View style={tw`flex-row items-center gap-3 px-4 pt-12 pb-3 bg-[#C96800]`}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={tw`p-1.5 rounded-xl`}
        >
          <ChevronLeft size={22} color="white" />
        </TouchableOpacity>
        <View style={tw`flex-1`}>
          <Text style={tw`text-white font-black text-base`}>
            {editEntry ? "Edit Vihar" : "New Vihar Entry"}
          </Text>
          <Text style={tw`text-orange-100 text-xs font-semibold`}>
            Vihar No. {viharNo}
          </Text>
        </View>
      </View>

      <ScrollView
        style={tw`flex-1 px-4 pt-4`}
        contentContainerStyle={tw`pb-28`}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        scrollEnabled={!isDropdownOpen}
      >
        {/* Date & Time */}
        <Section title="Date & Time">
          <Field label="Date" required>
            <TextInput
              value={form.date}
              onChangeText={(v) => set("date", v)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#8B6525"
              style={tw`w-full border border-[#E8C97A] rounded-xl px-3 py-2.5 text-sm bg-white text-[#3D1F00]`}
            />
          </Field>
          
          <View style={tw`flex-row gap-3 mt-3`}>
            <View style={tw`flex-1`}>
              <Field label="Start Time" required>
                <TextInput
                  value={form.startTime}
                  onChangeText={(v) => set("startTime", v)}
                  placeholder="HH:MM (e.g. 05:30)"
                  placeholderTextColor="#8B6525"
                  style={tw`w-full border border-[#E8C97A] rounded-xl px-3 py-2.5 text-sm bg-white text-[#3D1F00]`}
                />
                <Text style={tw`text-[10px] font-semibold text-[#8B6525] mt-1`}>
                  {normalizeTimeForDisplay(form.startTime)}
                </Text>
              </Field>
            </View>

            <View style={tw`flex-1`}>
              <Field label="End Time" required>
                <TextInput
                  value={form.endTime}
                  onChangeText={(v) => set("endTime", v)}
                  placeholder="HH:MM (e.g. 08:30)"
                  placeholderTextColor="#8B6525"
                  style={tw`w-full border border-[#E8C97A] rounded-xl px-3 py-2.5 text-sm bg-white text-[#3D1F00]`}
                />
                <Text style={tw`text-[10px] font-semibold text-[#8B6525] mt-1`}>
                  {normalizeTimeForDisplay(form.endTime)}
                </Text>
              </Field>
            </View>
          </View>
        </Section>

        {/* Thana */}
        <Section title="Thana & Distance">
          <Text style={tw`text-[10px] text-[#8B6525] mb-2`}>
            At least one count is required <Text style={tw`text-red-500`}>*</Text>
          </Text>
          
          <View style={tw`flex-row gap-3`}>
            <View style={tw`flex-1`}>
              <Field label={
                <View style={tw`flex-row items-center gap-1.5`}>
                  <Image source={sadhu} style={tw`w-6 h-6`} resizeMode="contain" />
                  <Text style={tw`text-xs font-bold text-[#8B6525]`}>Sadhu</Text>
                </View>
              }>
                <TextInput
                  keyboardType="numeric"
                  value={String(form.sadhu)}
                  onChangeText={(v) => set("sadhu", v)}
                  placeholder="e.g. 3"
                  placeholderTextColor="#8B6525"
                  style={tw`w-full border border-[#E8C97A] rounded-xl px-3 py-2.5 text-sm bg-white text-[#3D1F00]`}
                />
              </Field>
            </View>

            <View style={tw`flex-1`}>
              <Field label={
                <View style={tw`flex-row items-center gap-1.5`}>
                  <Image source={sadhviji} style={tw`w-6 h-6`} resizeMode="contain" />
                  <Text style={tw`text-xs font-bold text-[#8B6525]`}>Sadhviji</Text>
                </View>
              }>
                <TextInput
                  keyboardType="numeric"
                  value={String(form.sadhviji)}
                  onChangeText={(v) => set("sadhviji", v)}
                  placeholder="e.g. 9"
                  placeholderTextColor="#8B6525"
                  style={tw`w-full border border-[#E8C97A] rounded-xl px-3 py-2.5 text-sm bg-white text-[#3D1F00]`}
                />
              </Field>
            </View>
          </View>

          <View style={tw`mt-3`}>
            <Field label="Maharaj Saheb Name">
              <TextInput
                value={form.maharajNames[0] || ""}
                onChangeText={(v) => set("maharajNames", [v])}
                placeholder="Enter Maharaj Saheb Name"
                placeholderTextColor="#8B6525"
                style={tw`w-full border border-[#E8C97A] rounded-xl px-3 py-2.5 text-sm bg-white text-[#3D1F00]`}
              />
            </Field>
          </View>

          <View style={tw`mt-3`}>
            <Field label="Distance (KM)" required>
              <TextInput
                keyboardType="numeric"
                value={String(form.km)}
                onChangeText={(v) => set("km", v)}
                placeholder="e.g. 12"
                placeholderTextColor="#8B6525"
                style={tw`w-full border border-[#E8C97A] rounded-xl px-3 py-2.5 text-sm bg-white text-[#3D1F00]`}
              />
            </Field>
          </View>
        </Section>

        {/* Route */}
        <Section title="Route" style={tw`z-30`}>
          <Field label="From" required style={tw`z-40`}>
            <AutoComplete
              value={form.from}
              onChange={(v) => set("from", v)}
              suggestions={places}
              placeholder="Starting location"
              strict={places.length > 0}
              onOpenChange={setIsDropdownOpen}
            />
          </Field>
          <Field label="Via (optional)" style={tw`z-30 mt-3`}>
            <AutoComplete
              value={form.via}
              onChange={(v) => set("via", v)}
              suggestions={places}
              placeholder="Via"
              strict={false}
              onOpenChange={setIsDropdownOpen}
            />
          </Field>
          <Field label="To" required style={tw`z-20 mt-3`}>
            <AutoComplete
              value={form.to}
              onChange={(v) => set("to", v)}
              suggestions={places}
              placeholder="Destination"
              strict={places.length > 0}
              onOpenChange={setIsDropdownOpen}
            />
          </Field>
        </Section>

        {/* Sevak */}
        <Section title="Vihar Sevak (Male) *" style={tw`z-20`}>
          <ListInput
            items={form.sevak}
            onChange={(v) => set("sevak", v)}
            suggestions={sevakNames}
            placeholder="Sevak name..."
            accentColor="#C96800"
            strict={sevakNames.length > 0}
            onOpenChange={setIsDropdownOpen}
          />
        </Section>

        {/* Sevika */}
        <Section title="Vihar Sevika (Female) *" style={tw`z-10`}>
          <ListInput
            items={form.sevika}
            onChange={(v) => set("sevika", v)}
            suggestions={sevikaNames}
            placeholder="Sevika name..."
            accentColor="#C96800"
            strict={sevikaNames.length > 0}
            onOpenChange={setIsDropdownOpen}
          />
        </Section>

        <Text style={tw`text-[10px] text-[#8B6525] mt-2 px-1`}>
          * Required  ·  Sadhviji or Sadhu count mandatory  ·  At least one Sevak or Sevika mandatory
        </Text>

        {/* WhatsApp Preview */}
        <View style={tw`bg-white border border-[#F5E5B0] rounded-2xl overflow-hidden mt-4`}>
          <TouchableOpacity
            onPress={() => setPreview((p) => !p)}
            style={tw`w-full flex-row items-center justify-between px-4 py-3`}
          >
            <Text style={tw`text-sm font-bold text-[#C96800]`}>👁 Preview WhatsApp Message</Text>
            <Text style={tw`text-xs font-semibold text-[#8B6525]`}>
              {preview ? "Hide ▲" : "Show ▼"}
            </Text>
          </TouchableOpacity>

          {preview && (
            <View style={tw`border-t border-[#F5E5B0] px-4 pt-3 pb-4`}>
              <View style={tw`bg-[#DCF8C6] rounded-xl p-3.5 border border-green-200 mb-3`}>
                <Text style={tw`text-xs text-[#3D1F00] font-sans leading-relaxed`}>{whatsAppMsg}</Text>
              </View>
              <TouchableOpacity
                onPress={handleCopy}
                style={[tw`w-full flex-row items-center justify-center gap-2 rounded-xl py-2.5`, copied ? tw`bg-green-600` : tw`bg-[#25D366]`]}
              >
                {copied ? (
                  <>
                    <Check size={16} color="white" />
                    <Text style={tw`text-white font-bold text-sm`}>Copied!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={16} color="white" />
                    <Text style={tw`text-white font-bold text-sm`}>Copy for WhatsApp</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[tw`w-full bg-[#C96800] rounded-xl py-4 items-center justify-center mt-5`, saving && tw`opacity-60`]}
        >
          <Text style={tw`text-white font-black text-base`}>
            {saving ? "Saving…" : editEntry ? "Update Entry" : "Save Entry"}
          </Text>
        </TouchableOpacity>
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

function Section({ title, children, style = {} }) {
  return (
    <View style={[tw`bg-white border border-[#F5E5B0] rounded-2xl p-4 mb-4`, style]}>
      <Text style={tw`font-black text-sm text-[#C96800] mb-3`}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, children, required, style = {} }) {
  return (
    <View style={[tw`flex-col gap-1`, style]}>
      <View style={tw`flex-row items-center`}>
        {typeof label === 'string' ? (
          <Text style={tw`text-xs font-bold text-[#8B6525]`}>{label}</Text>
        ) : (
          label
        )}
        {required && <Text style={tw`text-red-500 ml-0.5`}>*</Text>}
      </View>
      {children}
    </View>
  );
}
