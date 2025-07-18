import { Image } from 'react-native';
import { manipulateAsync } from 'expo-image-manipulator';
import { resizeImageForAI, AI_TARGET_SIZE, DEFAULT_IMAGE_QUALITY } from '../../utils/imageProcessing';

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

// Mock React Native Image
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Image: {
    getSize: jest.fn(),
  },
}));

describe('imageProcessing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resizeImageForAI', () => {
    it('processes square image correctly', async () => {
      const mockImageUri = 'file://test-image.jpg';
      const mockProcessedImage = {
        uri: 'file://processed-image.jpg',
        width: AI_TARGET_SIZE,
        height: AI_TARGET_SIZE,
        base64: 'base64-data',
      };

      // Mock Image.getSize for square image
      (Image.getSize as jest.Mock).mockImplementation((uri, success) => {
        success(1000, 1000);
      });

      // Mock manipulateAsync
      (manipulateAsync as jest.Mock).mockResolvedValue(mockProcessedImage);

      const result = await resizeImageForAI(mockImageUri);

      expect(Image.getSize).toHaveBeenCalledWith(
        mockImageUri,
        expect.any(Function),
        expect.any(Function)
      );

      expect(manipulateAsync).toHaveBeenCalledWith(
        mockImageUri,
        [
          {
            resize: {
              width: AI_TARGET_SIZE,
              height: AI_TARGET_SIZE,
            },
          },
          {
            crop: {
              originX: 0,
              originY: 0,
              width: AI_TARGET_SIZE,
              height: AI_TARGET_SIZE,
            },
          },
        ],
        {
          compress: DEFAULT_IMAGE_QUALITY,
          format: 'jpeg',
          base64: true,
        }
      );

      expect(result).toEqual(mockProcessedImage);
    });

    it('processes landscape image with center crop', async () => {
      const mockImageUri = 'file://landscape-image.jpg';
      const mockProcessedImage = {
        uri: 'file://processed-image.jpg',
        width: AI_TARGET_SIZE,
        height: AI_TARGET_SIZE,
        base64: 'base64-data',
      };

      // Mock Image.getSize for landscape image (wider than tall)
      (Image.getSize as jest.Mock).mockImplementation((uri, success) => {
        success(1200, 800);
      });

      // Mock manipulateAsync
      (manipulateAsync as jest.Mock).mockResolvedValue(mockProcessedImage);

      // Calculate expected values for landscape image
      const originalWidth = 1200;
      const originalHeight = 800;
      const scale = AI_TARGET_SIZE / originalHeight; // Scale based on height to fit
      const scaledWidth = Math.round(originalWidth * scale);
      const scaledHeight = Math.round(originalHeight * scale);
      const cropX = Math.round((scaledWidth - AI_TARGET_SIZE) / 2);

      const result = await resizeImageForAI(mockImageUri);

      expect(manipulateAsync).toHaveBeenCalledWith(
        mockImageUri,
        [
          {
            resize: {
              width: scaledWidth,
              height: scaledHeight,
            },
          },
          {
            crop: {
              originX: cropX,
              originY: 0,
              width: AI_TARGET_SIZE,
              height: AI_TARGET_SIZE,
            },
          },
        ],
        expect.any(Object)
      );

      expect(result).toEqual(mockProcessedImage);
    });

    it('processes portrait image with center crop', async () => {
      const mockImageUri = 'file://portrait-image.jpg';
      const mockProcessedImage = {
        uri: 'file://processed-image.jpg',
        width: AI_TARGET_SIZE,
        height: AI_TARGET_SIZE,
        base64: 'base64-data',
      };

      // Mock Image.getSize for portrait image (taller than wide)
      (Image.getSize as jest.Mock).mockImplementation((uri, success) => {
        success(600, 900);
      });

      // Mock manipulateAsync
      (manipulateAsync as jest.Mock).mockResolvedValue(mockProcessedImage);

      // Calculate expected values for portrait image
      const originalWidth = 600;
      const originalHeight = 900;
      const scale = AI_TARGET_SIZE / originalWidth; // Scale based on width to fit
      const scaledWidth = Math.round(originalWidth * scale);
      const scaledHeight = Math.round(originalHeight * scale);
      const cropY = Math.round((scaledHeight - AI_TARGET_SIZE) / 2);

      const result = await resizeImageForAI(mockImageUri);

      expect(manipulateAsync).toHaveBeenCalledWith(
        mockImageUri,
        [
          {
            resize: {
              width: scaledWidth,
              height: scaledHeight,
            },
          },
          {
            crop: {
              originX: 0,
              originY: cropY,
              width: AI_TARGET_SIZE,
              height: AI_TARGET_SIZE,
            },
          },
        ],
        expect.any(Object)
      );

      expect(result).toEqual(mockProcessedImage);
    });

    it('handles missing base64 data', async () => {
      const mockImageUri = 'file://test-image.jpg';
      const mockProcessedImage = {
        uri: 'file://processed-image.jpg',
        width: AI_TARGET_SIZE,
        height: AI_TARGET_SIZE,
        // base64 is missing
      };

      (Image.getSize as jest.Mock).mockImplementation((uri, success) => {
        success(1000, 1000);
      });

      (manipulateAsync as jest.Mock).mockResolvedValue(mockProcessedImage);

      const result = await resizeImageForAI(mockImageUri);

      expect(result).toEqual({
        ...mockProcessedImage,
        base64: '',
      });
    });

    it('handles Image.getSize error', async () => {
      const mockImageUri = 'file://invalid-image.jpg';
      const mockError = new Error('Failed to get image size');

      (Image.getSize as jest.Mock).mockImplementation((uri, success, failure) => {
        failure(mockError);
      });

      await expect(resizeImageForAI(mockImageUri)).rejects.toThrow(
        'Failed to process image: Failed to get image size'
      );
    });

    it('handles manipulateAsync error', async () => {
      const mockImageUri = 'file://test-image.jpg';
      const mockError = new Error('Image manipulation failed');

      (Image.getSize as jest.Mock).mockImplementation((uri, success) => {
        success(1000, 1000);
      });

      (manipulateAsync as jest.Mock).mockRejectedValue(mockError);

      await expect(resizeImageForAI(mockImageUri)).rejects.toThrow(
        'Failed to process image: Image manipulation failed'
      );
    });

    it('handles non-Error object thrown', async () => {
      const mockImageUri = 'file://test-image.jpg';

      (Image.getSize as jest.Mock).mockImplementation((uri, success) => {
        success(1000, 1000);
      });

      (manipulateAsync as jest.Mock).mockRejectedValue('String error');

      await expect(resizeImageForAI(mockImageUri)).rejects.toThrow(
        'Failed to process image: Unknown error'
      );
    });
  });
});