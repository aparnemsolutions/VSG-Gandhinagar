import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';

export default function Medal({ rank, name, count, color = '#C96800' }) {
  // Medal emoji for top 3
  const medalIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
  
  return (
    <View style={tw`flex-row items-center gap-3 py-2.5 px-3 rounded-xl bg-white border border-[#F5E5B0]`}>
      <View style={tw`w-8 items-center justify-center`}>
        {medalIcon ? (
          <Text style={tw`text-2xl`}>{medalIcon}</Text>
        ) : (
          <Text style={tw`text-sm font-black text-[#8B6525]`}>{rank}</Text>
        )}
      </View>
      
      <Text style={tw`flex-1 text-sm font-bold text-[#C96800]`}>{name}</Text>
      <Text style={[tw`text-sm font-bold`, { color }]}>{count} vihar</Text>
    </View>
  );
}
