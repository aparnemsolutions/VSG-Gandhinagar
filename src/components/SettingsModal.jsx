import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity } from 'react-native';
import { X, Link2, CheckCircle } from 'lucide-react-native';
import tw from 'twrnc';

export default function SettingsModal({ currentUrl, onSave, onClose, visible }) {
  const [url, setUrl] = useState(currentUrl || '');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const trimmed = url.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={tw`flex-1 justify-end bg-black/40`}>
        <View style={tw`bg-white rounded-t-3xl px-5 pt-5 pb-8 space-y-4`}>
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <Text style={tw`font-black text-[#3D1F00] text-base`}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={tw`p-1.5 rounded-xl bg-[#FFF3D6]`}>
              <X size={20} color="#8B6525" />
            </TouchableOpacity>
          </View>

          <View style={tw`space-y-1.5 mb-4`}>
            <Text style={tw`text-xs font-bold text-[#8B6525] mb-1`}>
              Google Apps Script URL
            </Text>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://script.google.com/macros/s/…/exec"
              placeholderTextColor="#8B6525"
              autoCapitalize="none"
              style={tw`w-full border border-[#E8C97A] rounded-xl px-3 py-2.5 text-sm bg-[#FFFDF5] text-[#3D1F00]`}
            />
            <Text style={tw`text-[10px] text-[#8B6525] mt-1`}>
              Paste the deployed Web App URL from Google Apps Script. App will sync immediately after saving.
            </Text>
          </View>

          {saved ? (
            <View style={tw`flex-row items-center justify-center gap-2 py-3`}>
              <CheckCircle size={18} color="#16a34a" />
              <Text style={tw`text-green-600 font-bold`}>Saved — syncing…</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleSave}
              disabled={!url.trim()}
              style={[tw`w-full bg-[#C96800] rounded-xl py-3.5 items-center justify-center`, !url.trim() && tw`opacity-50`]}
            >
              <Text style={tw`text-white font-black text-sm`}>Save & Sync</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
