import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import AutoComplete from './AutoComplete';
import tw from 'twrnc';

export default function ListInput({
  items,
  onChange,
  suggestions = [],
  placeholder,
  accentColor = '#C96800',
  strict = false,
  onOpenChange,
}) {
  function updateItem(i, val) {
    const next = [...items];
    next[i] = val;
    onChange(next);
  }

  function removeItem(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function addItem() {
    onChange([...items, '']);
  }

  return (
    <View style={tw`space-y-2`}>
      {items.map((item, i) => (
        <View key={i} style={tw`flex-row gap-2 items-center mb-2`}>
          <View style={tw`flex-1`}>
            <AutoComplete
              value={item}
              onChange={v => updateItem(i, v)}
              suggestions={suggestions}
              placeholder={placeholder}
              strict={strict}
              onOpenChange={onOpenChange}
            />
          </View>
          <TouchableOpacity
            onPress={() => removeItem(i)}
            style={tw`w-10 h-10 flex items-center justify-center rounded-xl border border-red-200`}
          >
            <X size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        onPress={addItem}
        style={[tw`flex-row items-center gap-1.5 border rounded-xl px-3 py-2 self-start`, { borderColor: accentColor }]}
      >
        <Plus size={15} color={accentColor} />
        <Text style={[tw`text-sm font-semibold`, { color: accentColor }]}>Add name</Text>
      </TouchableOpacity>
    </View>
  );
}
