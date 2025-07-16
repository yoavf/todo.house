import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Default image quality for camera capture and image processing
 * Value between 0 and 1, where 1 is highest quality
 */
export const DEFAULT_IMAGE_QUALITY = 0.8;

/**
 * Resizes and center crops an image to 448x448 pixels for AI analysis
 * @param imageUri The URI of the image to process
 * @returns Promise containing the processed image with base64 data
 */
export async function resizeImageForAI(imageUri: string) {
  console.log('🖼️  Processing image for AI analysis...');
  console.log('📊 Input image URI:', imageUri);

  try {
    // First, get the image dimensions by doing a minimal manipulation
    const imageInfo = await manipulateAsync(imageUri, [], {
      compress: 1,
      format: SaveFormat.JPEG,
    });

    console.log('📐 Original image dimensions:', {
      width: imageInfo.width,
      height: imageInfo.height,
    });

    const originalWidth = imageInfo.width;
    const originalHeight = imageInfo.height;
    const targetSize = 448;

    // Calculate the scale factor to make the smaller dimension equal to 448
    const scaleWidth = targetSize / originalWidth;
    const scaleHeight = targetSize / originalHeight;
    const scale = Math.max(scaleWidth, scaleHeight);

    // Calculate new dimensions after scaling
    const scaledWidth = Math.round(originalWidth * scale);
    const scaledHeight = Math.round(originalHeight * scale);

    console.log('🔍 Calculated scaling:', {
      scale,
      scaledWidth,
      scaledHeight,
    });

    // Calculate crop position to center the image
    const cropX = Math.max(0, Math.round((scaledWidth - targetSize) / 2));
    const cropY = Math.max(0, Math.round((scaledHeight - targetSize) / 2));

    console.log('✂️  Calculated crop position:', {
      cropX,
      cropY,
      cropWidth: targetSize,
      cropHeight: targetSize,
    });

    // Perform the image manipulation: resize then crop
    const processedImage = await manipulateAsync(
      imageUri,
      [
        // First resize to ensure one dimension is at least 448
        {
          resize: {
            width: scaledWidth,
            height: scaledHeight,
          },
        },
        // Then crop to 448x448 from the center
        {
          crop: {
            originX: cropX,
            originY: cropY,
            width: Math.min(targetSize, scaledWidth),
            height: Math.min(targetSize, scaledHeight),
          },
        },
      ],
      {
        compress: DEFAULT_IMAGE_QUALITY, // Good quality but not too large
        format: SaveFormat.JPEG,
        base64: true, // We need base64 for AI analysis
      }
    );

    console.log('✅ Image processing complete:', {
      finalWidth: processedImage.width,
      finalHeight: processedImage.height,
      base64Length: processedImage.base64?.length || 0,
    });

    return {
      uri: processedImage.uri,
      width: processedImage.width,
      height: processedImage.height,
      base64: processedImage.base64 || '',
    };
  } catch (error) {
    console.error('❌ Image processing error:', error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}