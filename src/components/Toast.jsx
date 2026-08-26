import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { CheckCircle, XCircle, Info } from 'lucide-react-native';
import tw from 'twrnc';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} color="#16a34a" />;
      case 'error':
        return <XCircle size={18} color="#dc2626" />;
      default:
        return <Info size={18} color="#ea580c" />;
    }
  };

  return (
    <View style={tw`absolute top-12 left-5 right-5 z-50 bg-white rounded-xl px-4 py-3 shadow-lg border border-[#E8C97A] flex-row items-center gap-2`}>
      {renderIcon()}
      <Text style={tw`text-sm font-semibold text-[#3D1F00] flex-1`}>{message}</Text>
    </View>
  );
}
