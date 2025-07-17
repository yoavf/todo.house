import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from "expo-router";
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTaskStore } from '../store/taskStore';

function HydrationWrapper({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const hydrated = useTaskStore((state) => state.hydrated);
  const hydrate = useTaskStore((state) => state.hydrate);

  useEffect(() => {
    hydrate().then(() => setIsLoaded(true));
  }, [hydrate]);

  if (!isLoaded || !hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <HydrationWrapper>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="camera"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
            </Stack>
          </HydrationWrapper>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
