import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CheckCircle, Copy, List, Plus } from 'lucide-react-native';
import { buildWhatsAppMessage } from '../utils/formatters';
import Toast from '../components/Toast';
import * as Clipboard from 'expo-clipboard';
import tw from 'twrnc';

export default function EntryConfirm() {
  const route = useRoute();
  const navigation = useNavigation();
  const [toast, setToast] = useState(null);

  const entry = route.params?.entry;
  if (!entry) {
    navigation.navigate('Tabs', { screen: 'DashboardTab' });
    return null;
  }

  const msg = buildWhatsAppMessage(entry);

  async function copyToClipboard() {
    try {
      await Clipboard.setStringAsync(msg);
      setToast({ message: 'Copied to clipboard!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to copy', type: 'error' });
    }
  }

  return (
    <View style={tw`flex-1 bg-[#FFFDF5]`}>
      <ScrollView style={tw`flex-1 px-4 pt-12`} contentContainerStyle={tw`items-center pb-24`}>
        <CheckCircle size={64} color="#16a34a" style={tw`mt-8`} />
        <Text style={tw`font-black text-2xl text-[#3D1F00] mt-4`}>Vihar Saved!</Text>
        <Text style={tw`text-[#8B6525] text-sm font-semibold mt-1`}>Vihar No. {entry.viharNo} has been saved.</Text>

        {/* WhatsApp message */}
        <View style={tw`w-full bg-[#DCF8C6] rounded-2xl p-4 border border-green-200 mt-5`}>
          <Text style={tw`text-xs text-[#3D1F00] font-sans leading-relaxed`}>
            {msg}
          </Text>
        </View>

        <TouchableOpacity
          onPress={copyToClipboard}
          style={tw`w-full flex-row items-center justify-center gap-2 bg-[#25D366] rounded-xl py-3.5 mt-5`}
        >
          <Copy size={18} color="white" />
          <Text style={tw`text-white font-black text-base`}>Copy for WhatsApp</Text>
        </TouchableOpacity>

        <View style={tw`flex-row gap-3 w-full mt-4`}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Tabs', { screen: 'EntriesTab' })}
            style={tw`flex-1 flex-row items-center justify-center gap-2 border border-[#C96800] rounded-xl py-3`}
          >
            <List size={16} color="#C96800" />
            <Text style={tw`text-[#C96800] font-bold text-sm`}>View Entries</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddEntry')}
            style={tw`flex-1 flex-row items-center justify-center gap-2 bg-[#C96800] rounded-xl py-3`}
          >
            <Plus size={16} color="white" />
            <Text style={tw`text-white font-bold text-sm`}>Add New</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </View>
  );
}
