import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack, useRouter, useSegments } from "expo-router";
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
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

function DeepLinkHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      const { hostname, path } = Linking.parse(url);
      
      // Handle voice route
      if (path === 'voice' || hostname === 'voice') {
        // Navigate to home first if not already on the root screen
        if (segments.length > 0 && segments[0] !== 'index') {
          await router.replace('/');
        }
        // Then open voice modal
        router.push('/voice');
      }
    };

    // Handle initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for URL changes
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [router, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <HydrationWrapper>
              <DeepLinkHandler>
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
                  <Stack.Screen
                    name="voice"
                    options={{
                      presentation: 'modal',
                      headerShown: false,
                    }}
                  />
                </Stack>
              </DeepLinkHandler>
            </HydrationWrapper>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
