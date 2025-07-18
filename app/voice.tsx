import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, RecordingPresets, AudioModule, setAudioModeAsync, useAudioRecorderState } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTaskStore } from '../store/taskStore';
import { apiClient } from '../utils/apiClient';

export default function VoiceScreen() {
  const router = useRouter();
  const { add } = useTaskStore();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Request audio permissions and configure audio mode
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission Denied', 'Audio permission is required to use voice input.');
        router.back();
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [router]);

  useEffect(() => {
    if (recorderState.isRecording) {
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

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      // Stop animation and timer
      pulseAnim.stopAnimation();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [recorderState.isRecording, pulseAnim]);

  const startRecording = useCallback(async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setDuration(0);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  }, [audioRecorder]);

  const stopRecording = useCallback(async () => {
    if (!recorderState.isRecording) return;

    setIsProcessing(true);
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      
      if (uri) {
        // Read audio file as base64
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();
        
        const audioBase64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            if (reader.result && typeof reader.result === 'string') {
              // Remove data URL prefix to get just the base64 content
              const base64 = reader.result.split(',')[1];
              resolve(base64);
            } else {
              reject(new Error('Failed to read audio file'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // Send to transcription API
        const transcriptionResponse = await apiClient.transcribeAudio({
          audioBase64,
          audioType: 'audio/m4a',
        });
        
        if (transcriptionResponse.tasks && transcriptionResponse.tasks.length > 0) {
          // Add tasks to store
          transcriptionResponse.tasks.forEach(task => {
            add({
              title: task.title,
              location: task.location,
              completed: false,
              dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            });
          });

          // Navigate back to home
          router.replace('/');
        } else {
          Alert.alert('No Tasks Found', 'Could not extract any tasks from the audio. Please try again.');
        }
      }
    } catch (err) {
      console.error('Failed to process recording', err);
      Alert.alert('Error', 'Failed to process the recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [recorderState.isRecording, audioRecorder, add, router]);

  const handleCancel = useCallback(() => {
    if (recorderState.isRecording) {
      audioRecorder.stop();
    }
    router.back();
  }, [recorderState.isRecording, audioRecorder, router]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Input</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.content}>
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.processingText}>Processing your voice...</Text>
          </View>
        ) : (
          <>
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>
                {recorderState.isRecording 
                  ? 'Recording... Speak your tasks clearly'
                  : 'Tap the microphone to start recording'}
              </Text>
              {recorderState.isRecording && (
                <Text style={styles.durationText}>{formatDuration(duration)}</Text>
              )}
            </View>

            <View style={styles.recordButtonContainer}>
              <TouchableOpacity
                style={[styles.recordButton, recorderState.isRecording && styles.recordingButton]}
                onPress={recorderState.isRecording ? stopRecording : startRecording}
                activeOpacity={0.8}
              >
                <Animated.View style={{ transform: [{ scale: recorderState.isRecording ? pulseAnim : 1 }] }}>
                  <Ionicons 
                    name={recorderState.isRecording ? "stop" : "mic"} 
                    size={60} 
                    color="white" 
                  />
                </Animated.View>
              </TouchableOpacity>
              {recorderState.isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Recording</Text>
                </View>
              )}
            </View>

            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Tips:</Text>
              <Text style={styles.tipText}>• Say your task clearly</Text>
              <Text style={styles.tipText}>• Mention location if needed (e.g., &quot;in the kitchen&quot;)</Text>
              <Text style={styles.tipText}>• Add timing (e.g., &quot;tomorrow&quot;, &quot;next week&quot;)</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  instructionText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  durationText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  recordButtonContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  recordingButton: {
    backgroundColor: '#ef4444',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  recordingText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
  },
  tipsContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    marginTop: 20,
    fontSize: 18,
    color: 'white',
  },
});