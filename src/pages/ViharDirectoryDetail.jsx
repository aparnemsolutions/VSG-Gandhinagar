import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchDirectoryRecords } from '../utils/directoryLoader';
import tw from 'twrnc';

const DIRECTORY_PROFILE_KEYS = [
  'Email Id',
  'First Name',
  'Middle Name',
  'Last Name',
  'Gender',
  'Blood Group',
  'Contact Number',
  'Address',
  'Area',
  'City',
  'Work Type',
  'Company / Business Name',
  'Occupation / Profession',
  'Office Location / Business Area',
];

function getPersonName(person) {
  if (!person) return '';
  const direct = String(person['Name'] || person.Name || person['Full Name'] || '').trim();
  if (direct) return direct;
  const first = String(person['First Name'] || person.FirstName || '').trim();
  const middle = String(person['Middle Name'] || person.MiddleName || '').trim();
  const last = String(person['Last Name'] || person.LastName || '').trim();
  return [first, middle, last].filter(Boolean).join(' ');
}

export default function ViharDirectoryDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const [person, setPerson] = useState(route.params?.person ?? null);
  const [loading, setLoading] = useState(!route.params?.person);
  const [error, setError] = useState('');

  const row = route.params?.row;

  useEffect(() => {
    if (route.params?.person) {
      setPerson(route.params.person);
      setLoading(false);
      setError('');
      return;
    }

    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const records = await fetchDirectoryRecords();
        const rowIndex = Number(row);
        const found = records.find((r) => Number(r._rowIndex) === rowIndex) || records[rowIndex - 1] || null;
        if (mounted) setPerson(found);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [route.params, row]);

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#FFFDF5]`}>
        <View style={tw`flex-row items-center gap-3 px-4 pt-12 pb-3 bg-[#C96800]`}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2`}>
            <ArrowLeft size={18} color="white" />
          </TouchableOpacity>
          <Text style={tw`text-white font-black text-base`}>Loading profile</Text>
        </View>

        <View style={tw`flex-1 px-4 pt-5 pb-28 justify-center items-center`}>
          <ActivityIndicator size="large" color="#C96800" style={tw`mb-2`} />
          <Text style={tw`text-[#8B6525] text-sm`}>Fetching the profile details…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 bg-[#FFFDF5] p-4 pt-12 items-center justify-center`}>
        <Text style={tw`text-red-600 text-center text-sm font-semibold mb-3`}>{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`bg-[#C96800] px-4 py-2 rounded-xl`}>
          <Text style={tw`text-white font-bold`}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!person) {
    return (
      <View style={tw`flex-1 bg-[#FFFDF5] p-4 pt-12 items-center justify-center`}>
        <Text style={tw`text-sm font-semibold text-center mb-3`}>Person not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`bg-[#C96800] px-4 py-2 rounded-xl`}>
          <Text style={tw`text-white font-bold`}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const name = getPersonName(person) || person['Email Id'] || 'Unknown';
  const preferred = DIRECTORY_PROFILE_KEYS;
  const ignoredKeys = new Set(['Column 1', '_rowIndex', 'Sr No.', 'Sr no', 'Sr No']);

  const keys = [];
  preferred.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(person, k) && String(person[k] ?? '').trim() !== '') {
      keys.push(k);
    }
  });
  Object.keys(person).forEach((k) => {
    if (ignoredKeys.has(k)) return;
    if (preferred.includes(k)) return;
    if (String(person[k] ?? '').trim() === '') return;
    keys.push(k);
  });

  return (
    <View style={tw`flex-1 bg-[#FFFDF5]`}>
      {/* Header */}
      <View style={tw`flex-row items-center gap-3 px-4 pt-12 pb-3 bg-[#C96800]`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2`}>
          <ArrowLeft size={18} color="white" />
        </TouchableOpacity>
        <Text style={tw`text-white font-black text-base flex-1`} numberOfLines={1}>{name}</Text>
      </View>

      {/* Profile Info */}
      <ScrollView style={tw`flex-1 px-4 pt-5`} contentContainerStyle={tw`pb-28 gap-4`}>
        <View style={tw`bg-white border border-[#F5E5B0] rounded-2xl p-4`}>
          <Text style={tw`font-black text-sm text-[#C96800]`}>Profile Details</Text>
        </View>

        <View style={tw`bg-white border border-[#F5E5B0] rounded-2xl p-4 gap-3`}>
          {keys.map((key) => (
            <View key={key} style={tw`flex-row gap-2`}>
              <Text style={tw`text-xs font-bold text-[#8B6525] w-32`}>{key}</Text>
              <Text style={tw`text-xs text-[#3D1F00] font-semibold flex-1`}>{String(person[key] ?? '')}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
