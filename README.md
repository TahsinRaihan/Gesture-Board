# Gesture Board

A web-based design application that enables users to create and edit digital content using natural hand gestures through AI-powered hand tracking.

## Features

### Core Drawing Tools
- Pencil: Freehand drawing
- Shapes: Rectangle, Circle, Line
- Text: Add text to canvas
- Eraser: Remove drawn content
- Selection: Select and manipulate objects

### Hand Gesture Control
- Hand Tracking: Real-time hand detection via webcam
- Cursor Control: Hand position acts as cursor
- Gesture Recognition:
  - Pinch: Click/Draw action
  - Pointing: Precision positioning
  - Fist: Undo
  - Open Palm: Redo
  - Pointing Up: Menu/Tool selection

### Professional Features
- Layers Panel: Organize work into layers
- Color Picker: Rich color selection with custom colors
- Undo/Redo: Full history stack with 50-step limit
- Auto-Save: Automatically saves to localStorage every 10 seconds
- Export: Save as PNG image or JSON data
- Stroke Width Control: Adjustable brush sizes

## Project Structure

```
Gesture Board/
├── src/
│   ├── models/           # Data structures and logic
│   ├── controllers/      # Event handlers and interactions
│   ├── views/           # React components
│   │   ├── components/  # UI components
│   │   └── styles/      # Component CSS
│   ├── services/        # Core services
│   │   ├── handTracking.ts
│   │   ├── gestureDetector.ts
│   │   ├── canvasRenderer.ts
│   │   └── storageService.ts
│   ├── store/           # Zustand state management
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper functions
│   └── index.tsx        # App entry point
├── public/              # Static assets
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Tech Stack

- Frontend: React 18 + TypeScript
- Build Tool: Vite
- State Management: Zustand
- Hand Tracking: MediaPipe Tasks Vision
- Drawing: Canvas API + Fabric.js
- Styling: CSS3 with CSS Variables
- Icons: Lucide React

## Installation & Setup

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- Webcam (for hand gesture features)

### Step-by-Step Setup

1. Install Dependencies
   ```bash
   cd "e:\Hand Figma"
   npm install
   ```

2. Start Development Server
   ```bash
   npm run dev
   ```
   This will start the Vite development server at `http://localhost:5173`

3. Build for Production
   ```bash
   npm run build
   ```

4. Type Check
   ```bash
   npm run type-check
   ```

## Usage Guide

### Getting Started

1. Open Application
   - Navigate to `http://localhost:5173` in your browser
   - The canvas will load with a blank drawing area

2. Enable Hand Gestures
   - Click the camera button (bottom-right) to enable hand gesture recognition
   - Grant camera permission when prompted
   - A red cursor will appear, tracking your hand

3. Draw with Your Hand
   - Select a tool from the left toolbar
   - Move your hand to position the cursor
   - Pinch (touch thumb to index finger) to start drawing/clicking

### Keyboard Shortcuts

- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo
- `Del`: Clear current layer
- `Ctrl/Cmd + S`: Save (triggers download)

### Toolbar Options

Tools (Left Panel):
- Pencil: Freehand drawing
- Rectangle: Draw rectangles
- Circle: Draw circles
- Line: Draw straight lines
- Text: Add text
- Eraser: Remove content

Actions:
- Undo/Redo: Navigate history
- Clear: Clear all content (with confirmation)

File:
- Export: Save as PNG or JSON
- Layers: Toggle layers panel

### Color & Stroke Width

1. Color Picker (Right Panel):
   - Click any preset color
   - Or click "Custom" to use color picker
   - Input hex color codes

2. Stroke Width:
   - Use slider at bottom of color picker
   - Range: 1-20 pixels

### Layers Management

1. Create Layer:
   - Enter name in text input
   - Click the + button or press Enter

2. Switch Layers:
   - Click on a layer to make it active
   - Drawing will go to active layer

3. Layer Visibility:
   - Click eye icon to toggle visibility
   - Hidden layers still save with their content

4. Delete Layer:
   - Hover over layer and click trash icon
   - Cannot delete if only one layer exists

## Architecture

### MVC Pattern

Models (`src/models/`):
- Canvas state and drawing objects
- Layer management
- History/Undo-Redo logic

Views (`src/views/`):
- React components for UI
- Canvas rendering
- Component styling

Controllers (`src/controllers/`):
- Drawing logic and interactions
- Gesture recognition handling
- Event delegation

### State Management (Zustand)

All application state is managed in `src/store/store.ts`:
- Canvas data (layers, objects)
- Drawing state (active tool, color)
- Hand tracking state
- UI state (zoom, pan, visibility)

### Services

Hand Tracking (`handTracking.ts`):
- MediaPipe integration
- Webcam initialization
- Hand landmark detection

Gesture Detector (`gestureDetector.ts`):
- Gesture recognition algorithms
- Pinch, pointing, fist detection
- Temporal smoothing

Canvas Renderer (`canvasRenderer.ts`):
- All canvas drawing operations
- Shape rendering
- Layer composition

Storage (`storageService.ts`):
- localStorage persistence
- JSON export/import
- Auto-save functionality

## Offline vs Online

### Current: Offline-First
- All features work locally
- Auto-saves to browser storage
- No server required

### Planned: Multi-User (Phase 2)
- Supabase integration
- Real-time collaboration
- Shared drawing sessions
- User authentication
- Share links

Note: When moving to online, only `src/store/store.ts` needs changes. All UI and logic remain the same.

## Performance Optimizations

- RequestAnimationFrame for smooth rendering (60 FPS)
- Point smoothing for natural drawing
- Gesture debouncing (200ms) to prevent rapid-fire clicks
- Canvas context reuse
- State batching in Zustand
- Lazy loading of MediaPipe models

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requirements:
- WebRTC (for camera access)
- Canvas API
- MediaPipe WASM support

## Troubleshooting

### Hand Tracking Not Working
1. Check camera permissions in browser settings
2. Ensure adequate lighting
3. Verify hand is fully visible in frame
4. Try refreshing the page

### Canvas Not Rendering
1. Check browser console for errors
2. Clear browser cache
3. Restart development server

### Cannot Access Camera
1. Browser may be blocking camera
2. Check settings > Privacy > Camera
3. Ensure HTTPS on production (MediaPipe requires secure context)

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

## Future Enhancements

- Multi-user collaboration (Supabase)
- WebSocket real-time sync
- Video canvas support
- AI-powered shape recognition
- Voice commands
- Custom brush patterns
- Comment/annotation system
- Version history timeline
- Dark mode
- Touch screen support

## License

MIT License - Free to use for personal or commercial projects

## Contributing

Contributions are welcome. Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the troubleshooting section
