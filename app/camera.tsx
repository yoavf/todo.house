import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { useTaskStore } from '../store/taskStore';
import { analyzeImageForTask } from '../utils/apiClient';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { add } = useTaskStore();

  // Check camera permissions
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="white" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="white" style={styles.permissionIcon} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            We need access to your camera to analyze images and create tasks automatically.
          </Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleClose = () => {
    router.back();
  };

  const captureAndAnalyze = async () => {
    if (!cameraRef.current || isAnalyzing) return;

    try {
      console.log('📸 Starting image capture...');
      setIsAnalyzing(true);

      // Capture image
      console.log('📷 Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        skipProcessing: false,
      });

      console.log('📸 Picture captured successfully');
      console.log('📊 Photo details:', {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        base64Length: photo.base64?.length || 0,
      });

      if (!photo.base64) {
        console.error('❌ No base64 data in captured photo');
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      console.log('🚀 Starting AI analysis...');
      // Analyze image with AI
      const analysis = await analyzeImageForTask(photo.base64);
      console.log('📋 Analysis complete:', analysis);

      if (analysis.success && analysis.task) {
        console.log('✅ Task extracted successfully:', analysis.task);

        // Add the task to store with image
        const taskId = add({
          title: analysis.task.title,
          location: analysis.task.location,
          completed: false,
          imageUri: photo.uri,
        });

        console.log('💾 Task added to store with ID:', taskId);

        // Show success animation instead of alert
        setShowSuccess(true);
      } else {
        console.log('⚠️ Analysis failed:', analysis.error);

        // Show error with option to add manually
        Alert.alert(
          'Analysis Failed',
          analysis.error || 'Could not analyze the image. Would you like to add a task manually?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Manually', onPress: () => router.back() }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Camera capture error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      Alert.alert(
        'Error',
        'Failed to capture or analyze image. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      console.log('🏁 Capture and analysis flow complete');
      setIsAnalyzing(false);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan for Tasks</Text>
          <TouchableOpacity onPress={toggleCameraFacing} style={styles.headerButton}>
            <Ionicons name="camera-reverse-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Point your camera at a household item or area that needs attention
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.controls}>
          <View style={styles.controlsInner}>
            <View style={styles.controlSpacer} />

            {/* Capture Button */}
            <TouchableOpacity
              style={[styles.captureButton, isAnalyzing && styles.captureButtonDisabled]}
              onPress={captureAndAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            <View style={styles.controlSpacer} />
          </View>

          {isAnalyzing && (
            <Text style={styles.analyzingText}>Analyzing image...</Text>
          )}
        </View>

        {/* Success Animation */}
        <SuccessAnimation
          visible={showSuccess}
          onComplete={handleSuccessComplete}
        />
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionIcon: {
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#adb5bd',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  instructions: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 40,
  },
  controlSpacer: {
    width: 80,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  analyzingText: {
    color: 'white',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});