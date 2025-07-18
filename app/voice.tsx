import { Ionicons } from '@expo/vector-icons';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTaskStore } from '../store/taskStore';
import { apiClient } from '../utils/apiClient';
import { logger } from '../utils/logger';

// Constants
const SILENCE_TIMEOUT_MS = 2000; // Stop recording after 2 seconds of silence

export default function VoiceScreen() {
  const router = useRouter();
  const { add } = useTaskStore();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasStartedRef = useRef(false);
  const isListeningRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs when state changes
  useEffect(() => {
    silenceTimerRef.current = silenceTimer;
  }, [silenceTimer]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    // Request permissions and start recording immediately
    (async () => {
      const status = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required to use voice input.');
        router.back();
        return;
      }
      
      // Start recording immediately on mount
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        startListening();
      }
    })();

    return () => {
      // Use refs in cleanup to avoid dependency warnings
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      // Stop recording when unmounting
      if (isListeningRef.current) {
        ExpoSpeechRecognitionModule.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isListening) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animation
      pulseAnim.stopAnimation();
    }
  }, [isListening, pulseAnim]);

  // Handle speech recognition results
  useSpeechRecognitionEvent('result', (event) => {
    setTranscript(event.results[0]?.transcript || '');
    
    // Reset silence timer whenever we get new speech
    if (silenceTimer) {
      clearTimeout(silenceTimer);
    }
    
    // Set a new timer to stop after silence timeout
    const timer = setTimeout(() => {
      stopListening();
    }, SILENCE_TIMEOUT_MS);
    
    setSilenceTimer(timer);
  });

  // Handle errors
  useSpeechRecognitionEvent('error', (event) => {
    logger.error('Voice', '❌ Speech recognition error:', event.error);
    setIsListening(false);
    if (event.error !== 'no-speech') {
      Alert.alert('Error', 'Failed to recognize speech. Please try again.');
    }
  });

  // Handle when recognition ends
  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }
  });

  const startListening = useCallback(async () => {
    try {
      logger.info('Voice', '🎤 Starting speech recognition...');
      setTranscript('');
      setIsListening(true);
      
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        continuous: true,
        interimResults: true,
        maxAlternatives: 1,
      });
      logger.info('Voice', '✅ Speech recognition started');
    } catch (err) {
      logger.error('Voice', '❌ Failed to start speech recognition:', err);
      setIsListening(false);
      Alert.alert('Error', 'Failed to start voice recognition. Please try again.');
    }
  }, []);

  const processTranscript = useCallback(async (text: string) => {
    setIsProcessing(true);
    try {
      logger.info('Voice', '📝 Processing transcript:', text);
      const result = await apiClient.extractTasks(text);
      
      if (result.tasks && result.tasks.length > 0) {
        logger.info('Voice', `✅ Extracted ${result.tasks.length} task(s)`);
        // Add tasks to store
        result.tasks.forEach((task) => {
          add({
            title: task.title,
            location: task.location || undefined,
            completed: false,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          });
        });

        // Navigate back to home
        router.replace('/');
      } else {
        Alert.alert('No Tasks Found', 'Could not extract any tasks from your speech. Please try again.');
      }
    } catch (err) {
      logger.error('Voice', '❌ Failed to process transcript:', err);
      Alert.alert('Error', 'Failed to process your speech. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [add, router]);

  const stopListening = useCallback(async () => {
    if (!isListening) return;
    
    try {
      await ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
      
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        setSilenceTimer(null);
      }
      
      // Process the transcript if we have one
      if (transcript.trim()) {
        processTranscript(transcript);
      } else {
        Alert.alert('No Speech Detected', 'Please try again and speak clearly.');
      }
    } catch (err) {
      logger.error('Voice', '❌ Failed to stop speech recognition:', err);
      setIsListening(false);
    }
  }, [isListening, transcript, silenceTimer, processTranscript]);

  const handleCancel = useCallback(() => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
    }
    router.back();
  }, [isListening, router]);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={handleCancel}
      />
      
      <View style={styles.modalContent}>
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.processingText}>Processing your speech...</Text>
          </View>
        ) : (
          <>
            <View style={styles.micContainer}>
              <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
              <View style={styles.micCircle}>
                <Ionicons name="mic" size={40} color="white" />
              </View>
            </View>

            <Text style={styles.listeningText}>Listening...</Text>
            
            <View style={styles.transcriptContainer}>
              {transcript ? (
                <Text style={styles.transcriptText}>{transcript}</Text>
              ) : (
                <Text style={styles.hintText}>Start speaking your task...</Text>
              )}
            </View>

            <View style={styles.hintsContainer}>
              <Text style={styles.hintTitle}>Tips for best results:</Text>
              <View style={styles.hintRow}>
                <Text style={styles.hintIcon}>📝</Text>
                <Text style={styles.hintText}>What: &quot;Clean the kitchen&quot;</Text>
              </View>
              <View style={styles.hintRow}>
                <Text style={styles.hintIcon}>📍</Text>
                <Text style={styles.hintText}>Where: &quot;...in the garage&quot;</Text>
              </View>
              <View style={styles.hintRow}>
                <Text style={styles.hintIcon}>📅</Text>
                <Text style={styles.hintText}>When: &quot;...tomorrow at 3pm&quot;</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 24,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  micContainer: {
    width: 100,
    height: 100,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  listeningText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 20,
  },
  transcriptContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    minHeight: 80,
    marginBottom: 30,
  },
  transcriptText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
  },
  hintText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  hintsContainer: {
    width: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 12,
    textAlign: 'center',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hintIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 24,
  },
  cancelButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  processingText: {
    marginTop: 20,
    fontSize: 18,
    color: 'white',
  },
});