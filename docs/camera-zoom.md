# Camera Zoom Functionality

The camera viewfinder in TodoHouse now supports comprehensive zoom functionality for better photo capture experience.

## Features

### Pinch-to-Zoom (Mobile)
- Two-finger pinch gestures to zoom in/out
- Smooth real-time zoom response
- Works on both camera API zoom and visual zoom modes

### Manual Zoom Controls
- **Zoom In** button (+ icon)
- **Zoom Out** button (- icon)  
- **Reset Zoom** button (1x)
- Located on the left side of the viewfinder

### Keyboard Shortcuts
- `+` or `=` key: Zoom in
- `-` key: Zoom out
- `0` key: Reset to 1x zoom

### Zoom Level Indicator
- Shows current zoom level (e.g., "1.5x")
- Appears when zoom > 1.1x
- Positioned at top-center of viewfinder

## Technical Implementation

### Camera API Zoom (Preferred)
- Uses `MediaStreamTrack.applyConstraints()` for native camera zoom
- Automatically detects camera zoom capabilities
- Respects device-specific zoom constraints (min, max, step)

### Visual Zoom Fallback
- CSS transform-based zoom when camera zoom unavailable
- Smooth transitions with `transform-origin: center`
- Limited to 1x-3x zoom range for performance

### Browser Support
- **Modern browsers**: Full camera API zoom support
- **Older browsers**: Visual zoom fallback
- **Mobile devices**: Touch gesture support
- **Desktop**: Keyboard shortcuts

## Usage Instructions

1. **Open Camera**: Tap the camera button to open viewfinder
2. **Zoom In**: 
   - Pinch out with two fingers (mobile)
   - Click zoom in button
   - Press `+` key
3. **Zoom Out**:
   - Pinch in with two fingers (mobile)
   - Click zoom out button  
   - Press `-` key
4. **Reset**: Click 1x button or press `0` key
5. **Take Photo**: Zoom level is preserved in captured image

## Accessibility

- All zoom controls have proper ARIA labels
- Keyboard navigation support
- Screen reader compatible
- High contrast zoom indicators

## Error Handling

- Graceful fallback when camera permissions denied
- Visual zoom when camera zoom unsupported
- Clear error messages for users
- Proper cleanup of event listeners