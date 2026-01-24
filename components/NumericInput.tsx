import React, { useState, useEffect } from 'react';
import { TextInput, TextInputProps } from 'react-native';

interface NumericInputProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  value: number;
  onChangeValue: (value: number) => void;
  placeholder?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({ value, onChangeValue, placeholder, ...props }) => {
  const [localValue, setLocalValue] = useState(value === 0 ? '' : value.toString());

  useEffect(() => {
    const currentParsed = parseFloat(localValue.replace(',', '.'));
    if (currentParsed !== value) {
      setLocalValue(value === 0 ? '' : value.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChangeText = (text: string) => {
    const normalizedText = text.replace(',', '.');

    if (normalizedText === '' || normalizedText === '.' || normalizedText.endsWith('.')) {
      setLocalValue(text);
      if (normalizedText === '' || normalizedText === '.') {
        onChangeValue(0);
      }
      return;
    }

    const parsed = parseFloat(normalizedText);
    if (!isNaN(parsed)) {
      setLocalValue(text);
      onChangeValue(parsed);
    }
  };

  const handleBlur = () => {
    setLocalValue(value === 0 ? '' : value.toString());
  };

  return (
    <TextInput
      {...props}
      placeholder={placeholder}
      value={localValue}
      onChangeText={handleChangeText}
      onBlur={handleBlur}
      keyboardType="numeric"
    />
  );
};
