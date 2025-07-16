import { Ionicons } from "@expo/vector-icons";
import { type CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SuccessAnimation } from "../components/SuccessAnimation";
import { useTaskStore } from "../store/taskStore";
import { analyzeImageForTask } from "../utils/apiClient";
import { resizeImageForAI } from "../utils/imageProcessing";

export default function CameraScreen() {
	const [facing, setFacing] = useState<CameraType>("back");
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
					<Ionicons
						name="camera-outline"
						size={64}
						color="white"
						style={styles.permissionIcon}
					/>
					<Text style={styles.permissionTitle}>Camera Access Required</Text>
					<Text style={styles.permissionMessage}>
						We need access to your camera to analyze images and create tasks
						automatically.
					</Text>
					<TouchableOpacity
						onPress={requestPermission}
						style={styles.permissionButton}
					>
						<Text style={styles.permissionButtonText}>Grant Permission</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	const toggleCameraFacing = () => {
		setFacing((current) => (current === "back" ? "front" : "back"));
	};

	const handleClose = () => {
		router.replace("/");
	};

	const analyzeImage = async (originalImageUri: string) => {
		try {
			console.log("🚀 Starting image processing and AI analysis...");
			
			// Process image: resize and center crop to 448x448
			console.log("🖼️ Processing image for AI analysis...");
			const processedImage = await resizeImageForAI(originalImageUri);
			console.log("✅ Image processed successfully:", {
				width: processedImage.width,
				height: processedImage.height,
				base64Length: processedImage.base64.length,
			});

			// Analyze processed image with AI
			console.log("🤖 Starting AI analysis...");
			const analysis = await analyzeImageForTask(processedImage.base64);
			console.log("📋 Analysis complete:", analysis);

			if (analysis.success && analysis.task) {
				console.log("✅ Task extracted successfully:", analysis.task);

				// Add the task to store with original image URI (for display purposes)
				const taskId = add({
					title: analysis.task.title,
					location: analysis.task.location,
					completed: false,
					imageUri: originalImageUri, // Use original image for display
				});

				console.log("💾 Task added to store with ID:", taskId);

				// Show success animation instead of alert
				setShowSuccess(true);
			} else {
				console.log("⚠️ Analysis failed:", analysis.error);

				// Show error with option to add manually
				Alert.alert(
					"Analysis Failed",
					analysis.error ||
						"Could not analyze the image. Would you like to add a task manually?",
					[
						{ text: "Cancel", style: "cancel" },
						{ text: "Add Manually", onPress: () => router.replace("/") },
					],
				);
			}
		} catch (error) {
			console.error("❌ Image analysis error:", error);
			console.error("Error details:", {
				name: error instanceof Error ? error.name : "Unknown",
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});

			Alert.alert("Error", "Failed to analyze image. Please try again.", [
				{ text: "OK" },
			]);
		}
	};

	const captureAndAnalyze = async () => {
		if (!cameraRef.current || isAnalyzing) return;

		try {
			console.log("📸 Starting image capture...");
			setIsAnalyzing(true);

			// Capture image
			console.log("📷 Taking picture...");
			const photo = await cameraRef.current.takePictureAsync({
				quality: 0.8, // Slightly higher quality since we'll process it
				base64: false, // We don't need base64 from camera anymore
				skipProcessing: false,
			});

			console.log("📸 Picture captured successfully");
			console.log("📊 Photo details:", {
				uri: photo.uri,
				width: photo.width,
				height: photo.height,
			});

			await analyzeImage(photo.uri);
		} catch (error) {
			console.error("❌ Camera capture error:", error);
			console.error("Error details:", {
				name: error instanceof Error ? error.name : "Unknown",
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});

			Alert.alert("Error", "Failed to capture image. Please try again.", [
				{ text: "OK" },
			]);
		} finally {
			console.log("🏁 Capture and analysis flow complete");
			setIsAnalyzing(false);
		}
	};

	const pickImageFromGallery = async () => {
		if (isAnalyzing) return;

		try {
			console.log("🖼️ Starting image picker...");
			setIsAnalyzing(true);

			// Request media library permissions
			const { status } =
				await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Permission Required",
					"We need access to your photo library to select images.",
					[{ text: "OK" }],
				);
				return;
			}

			// Launch image picker
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: false, // We'll do our own processing
				quality: 0.8, // Slightly higher quality since we'll process it
				base64: false, // We don't need base64 from picker anymore
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				const asset = result.assets[0];
				console.log("🖼️ Image selected successfully");
				console.log("📊 Image details:", {
					uri: asset.uri,
					width: asset.width,
					height: asset.height,
				});

				await analyzeImage(asset.uri);
			} else {
				console.log("📷 Image selection cancelled");
			}
		} catch (error) {
			console.error("❌ Image picker error:", error);
			console.error("Error details:", {
				name: error instanceof Error ? error.name : "Unknown",
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});

			Alert.alert("Error", "Failed to select image. Please try again.", [
				{ text: "OK" },
			]);
		} finally {
			console.log("🏁 Image picker flow complete");
			setIsAnalyzing(false);
		}
	};

	const handleSuccessComplete = () => {
		setShowSuccess(false);
		router.replace("/");
	};

	return (
		<SafeAreaView style={styles.container}>
			<CameraView style={styles.camera} facing={facing} ref={cameraRef}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={handleClose} style={styles.headerButton}>
						<Ionicons name="close" size={28} color="white" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Scan for Tasks</Text>
					<TouchableOpacity
						onPress={toggleCameraFacing}
						style={styles.headerButton}
					>
						<Ionicons name="camera-reverse-outline" size={28} color="white" />
					</TouchableOpacity>
				</View>

				{/* Instructions */}
				<View style={styles.instructions}>
					<Text style={styles.instructionText}>
						Capture or select an image to create a task.
					</Text>
				</View>

				{/* Bottom Controls */}
				<View style={styles.controls}>
					<View style={styles.controlsInner}>
						{/* Gallery Button */}
						<TouchableOpacity
							style={[
								styles.galleryButton,
								isAnalyzing && styles.galleryButtonDisabled,
							]}
							onPress={pickImageFromGallery}
							disabled={isAnalyzing}
						>
							<Ionicons name="images-outline" size={24} color="white" />
						</TouchableOpacity>

						{/* Capture Button */}
						<TouchableOpacity
							style={[
								styles.captureButton,
								isAnalyzing && styles.captureButtonDisabled,
							]}
							onPress={captureAndAnalyze}
							disabled={isAnalyzing}
						>
							{isAnalyzing ? (
								<ActivityIndicator size="large" color="white" />
							) : (
								<View style={styles.captureButtonInner} />
							)}
						</TouchableOpacity>

						{/* Spacer for symmetry */}
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
		backgroundColor: "#000",
	},
	camera: {
		flex: 1,
	},
	permissionContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 40,
	},
	permissionIcon: {
		marginBottom: 24,
	},
	permissionTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "white",
		marginBottom: 16,
		textAlign: "center",
	},
	permissionMessage: {
		fontSize: 16,
		color: "#adb5bd",
		textAlign: "center",
		lineHeight: 22,
		marginBottom: 32,
	},
	permissionButton: {
		backgroundColor: "#007bff",
		paddingHorizontal: 32,
		paddingVertical: 16,
		borderRadius: 8,
	},
	permissionButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 10,
	},
	headerButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	headerTitle: {
		color: "white",
		fontSize: 18,
		fontWeight: "600",
	},
	instructions: {
		position: "absolute",
		top: "30%",
		left: 20,
		right: 20,
		alignItems: "center",
	},
	instructionText: {
		color: "white",
		fontSize: 16,
		textAlign: "center",
		backgroundColor: "rgba(0, 0, 0, 0.6)",
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 8,
		overflow: "hidden",
	},
	controls: {
		position: "absolute",
		bottom: 50,
		left: 0,
		right: 0,
		alignItems: "center",
	},
	controlsInner: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		width: "100%",
		paddingHorizontal: 40,
	},
	controlSpacer: {
		width: 80,
	},
	galleryButton: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
		borderColor: "rgba(255, 255, 255, 0.4)",
	},
	galleryButtonDisabled: {
		opacity: 0.5,
	},
	captureButton: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "white",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 4,
		borderColor: "rgba(255, 255, 255, 0.3)",
	},
	captureButtonDisabled: {
		opacity: 0.7,
	},
	captureButtonInner: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "white",
	},
	analyzingText: {
		color: "white",
		fontSize: 14,
		marginTop: 16,
		textAlign: "center",
	},
});
