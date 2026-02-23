import React from 'react';
import { Text, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

interface FormErrorProps {
  error?: string;
}

const FormError: React.FC<FormErrorProps> = ({ error }) => {
  if (!error) return null;

  return (
    <View className="mb-4 flex-row items-center gap-2 rounded-lg bg-red-100 px-3 py-2">
      <AlertCircle size={16} color="#dc2626" />
      <Text className="flex-1 text-sm text-red-600 font-rubik">{error}</Text>
    </View>
  );
};

export default FormError;
