import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import tw from 'twrnc';

export default function AutoComplete({
  value,
  onChange,
  suggestions = [],
  placeholder,
  style = {},
  strict = false,
  onOpenChange,
}) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [invalid, setInvalid] = useState(false);

  // Notify parent scroll view about dropdown open/close state
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(open && filtered.length > 0);
    }
  }, [open, filtered, onOpenChange]);

  function handleInputChange(val) {
    onChange(val);
    setInvalid(false);
    if (val.length >= 3) {
      const q = val.toLowerCase();
      const matches = suggestions.filter(s => s.toLowerCase().includes(q));
      
      // Deduplicate suggestions and limit to top 20 results
      const uniqueMatches = Array.from(new Set(matches)).slice(0, 20);
      
      setFiltered(uniqueMatches);
      setOpen(uniqueMatches.length > 0);
    } else {
      setOpen(false);
    }
  }

  function pick(val) {
    onChange(val);
    setOpen(false);
    setInvalid(false);
  }

  function handleBlur() {
    // Wait for touch selection to register before closing dropdown
    setTimeout(() => {
      setOpen(false);
      if (strict && suggestions.length > 0 && value.trim()) {
        const isKnown = suggestions.some(s => s.toLowerCase() === value.toLowerCase());
        if (!isKnown) {
          onChange('');
          setInvalid(true);
          setTimeout(() => setInvalid(false), 2000);
        }
      }
    }, 250);
  }

  const borderCls = invalid
    ? 'border-red-400 bg-red-50'
    : 'border-[#E8C97A]';

  return (
    <View style={[tw`relative z-20 w-full`, style]}>
      <TextInput
        value={value}
        onChangeText={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor="#8B6525"
        style={tw`w-full border border-[#E8C97A] rounded-xl px-3 py-2.5 text-sm bg-white text-[#3D1F00] ${borderCls}`}
      />
      {invalid && (
        <Text style={tw`text-[10px] text-red-500 mt-0.5 px-1`}>Please select from the list</Text>
      )}
      
      {open && filtered.length > 0 && (
        <View style={tw`absolute z-50 left-0 right-0 top-11 mt-1 bg-white border border-[#E8C97A] rounded-xl shadow-lg max-h-40 overflow-hidden`}>
          <ScrollView
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            style={tw`max-h-40`}
          >
            {filtered.map((s, index) => (
              <TouchableOpacity
                key={`${s}-${index}`}
                onPress={() => pick(s)}
                style={tw`px-3 py-2.5 border-b border-gray-100 bg-white`}
              >
                <Text style={tw`text-sm text-[#3D1F00] font-semibold`}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
