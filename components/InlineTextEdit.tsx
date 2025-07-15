import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TextStyle, TouchableOpacity } from 'react-native';

interface InlineTextEditProps {
  value: string;
  onUpdate: (newValue: string) => void;
  style?: TextStyle | TextStyle[];
  placeholder?: string;
}

export function InlineTextEdit({ value, onUpdate, style, placeholder }: InlineTextEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleFinishEdit = () => {
    setIsEditing(false);
    onUpdate(editValue);
  };


  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <TextInput
        ref={inputRef}
        style={[styles.input, ...(Array.isArray(style) ? style : [style])]}
        value={editValue}
        onChangeText={setEditValue}
        onBlur={handleFinishEdit}
        onSubmitEditing={handleFinishEdit}
        placeholder={placeholder}
        multiline
        returnKeyType="done"
        blurOnSubmit
      />
    );
  }

  return (
    <TouchableOpacity onPress={handleStartEdit}>
      <Text style={style}>
        {value || placeholder}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 4,
    padding: 4,
    backgroundColor: 'white',
  },
});