import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { styled, Button, View } from 'tamagui';

const FABContainer = styled(View, {
  position: 'absolute',
  bottom: 30,
  right: 30,
  borderRadius: 30,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
});

const StyledButton = styled(Button, {
  width: 60,
  height: 60,
  borderRadius: 30,
  padding: 0,
  borderWidth: 0,
  backgroundColor: 'transparent',
});

export function FAB() {
  const router = useRouter();

  const handlePress = () => {
    router.push('/camera');
  };

  return (
    <FABContainer>
      <StyledButton
        onPress={handlePress}
        animation="quick"
        scale={0.9}
        hoverStyle={{ scale: 0.95 }}
        pressStyle={{ scale: 0.85 }}
      >
        <LinearGradient
          colors={['#4c84ff', '#3b82f6']}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={32} color="white" />
        </LinearGradient>
      </StyledButton>
    </FABContainer>
  );
}