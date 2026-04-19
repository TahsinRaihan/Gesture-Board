# 🏗️ Architecture Overview

## MVC Pattern Explanation

Your project follows **Model-View-Controller** architecture:

```
USER ACTION
    ↓
[CONTROLLER] → Handles what happened (gesture, click, draw)
    ↓
[MODEL] → Updates data (canvas, layers, tools)
    ↓
[VIEW] → Shows updated data (React components)
    ↓
USER SEES RESULT
```

---

## Code Organization

### 📂 `src/types/index.ts`
**What it is:** TypeScript type definitions  
**What it contains:**
- `DrawingObject` - A shape/line/text on canvas
- `CanvasLayer` - Container of drawing objects
- `HandPose` - Hand position landmarks
- `GestureResult` - What gesture was detected
- `State` - Complete app state

**Why it matters:** Gives type safety to entire app

---

### 📂 `src/models/` (Empty, Ready for Future)
**What it is:** Business logic & data models  
**When it's used:** Phase 2 (when adding database)  
**What will go here:**
- Supabase integration
- Database queries
- Data validation

---

### 📂 `src/store/store.ts`
**What it is:** Global state management (Zustand)  
**What it contains:**
- All app state in one place
- Actions to change state
- No Redux complexity

**Key concept:**
```typescript
// Get state
const color = useStore((state) => state.activeColor);

// Update state
useStore.getState().setColor('#FF0000');
```

**Why it matters:** Single source of truth for entire app

---

### 📂 `src/services/`
**What it is:** Core business logic & external library integration

#### `handTracking.ts`
- **Purpose:** Setup webcam + MediaPipe
- **Key functions:**
  - `initializeHandTracking()` - Load ML model
  - `detectHandPose()` - Get hand position each frame
  - `stopWebcam()` - Cleanup

#### `gestureDetector.ts`
- **Purpose:** Recognize gestures from hand landmarks
- **Key functions:**
  - `detectGesture()` - What gesture is happening?
  - `isPinching()` - Thumb touching index?
  - `isFist()` - All fingers closed?

#### `canvasRenderer.ts`
- **Purpose:** Draw shapes on canvas
- **Key functions:**
  - `initCanvasRenderer()` - Setup canvas
  - `drawObject()` - Draw single shape
  - `drawLayers()` - Draw all layers
  - `exportCanvasAsImage()` - PNG download

#### `storageService.ts`
- **Purpose:** Save/load data
- **Key functions:**
  - `saveCanvasToLocalStorage()` - Auto-save
  - `exportCanvasAsJSON()` - Save as file
  - `importCanvasFromJSON()` - Load from file

---

### 📂 `src/controllers/`
**What it is:** Event handlers & interaction logic

#### `drawingController.ts`
- **Purpose:** Handle drawing interactions
- **Key functions:**
  - `startDrawing()` - User pressed down
  - `continueDrawing()` - User moved
  - `finishDrawing()` - User released
  - `addText()` - Add text to canvas

#### `gestureController.ts`
- **Purpose:** Respond to hand gestures
- **Key functions:**
  - `handleGesture()` - Gesture detected, what now?
  - `handlePinch()` - Start drawing
  - `handleFist()` - Undo action
  - `updateCursorPosition()` - Update cursor

**How it works:**
```
Hand detected → Gesture detected → Controller handles it → Model updates → View renders
```

---

### 📂 `src/views/`
**What it is:** React UI components

#### `App.tsx` (Main Component)
- **Purpose:** Orchestrate entire app
- **What happens:**
  1. Initialize hand tracking
  2. Setup canvas rendering
  3. Load saved data
  4. Main animation loop (60 FPS)
  5. Detect gestures
  6. Render UI

#### `components/`
- **Toolbar.tsx** → Tool selection buttons
- **ColorPicker.tsx** → Color + stroke width
- **LayersPanel.tsx** → Create/manage layers
- **CameraToggle.tsx** → Enable hand tracking
- **Canvas.tsx** → Drawing canvas container

---

### 📂 `src/utils/`
**What it is:** Helper functions

#### `constants.ts`
- Default colors, stroke widths
- Hand tracking settings
- Tool types

#### `helpers.ts`
- Geometry utilities (distance, point-in-rect)
- Array smoothing (for smooth drawing)
- ID generation
- Coordinate conversion

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
│  (Mouse click, Hand gesture, Color picker, Layer click)      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │    CONTROLLER        │
        │ - Draw interaction   │
        │ - Gesture handling   │
        │ - Event delegation   │
        └──────────┬───────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │      STORE           │
        │  (Zustand State)     │
        │ - Canvas data        │
        │ - Active tool        │
        │ - Layers             │
        └──────────┬───────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │    SERVICES          │
        │ - Canvas render      │
        │ - Hand track         │
        │ - Gesture detect     │
        │ - Storage save       │
        └──────────┬───────────┘
                   │
                   ↓
      ┌────────────────────────────┐
      │         VIEW               │
      │   (React Components)       │
      │ - Update UI                │
      │ - Display canvas           │
      │ - Show toolbar/colors      │
      └────────────────────────────┘
```

---

## Animation Loop (60 FPS)

Every frame (~16ms):

```typescript
1. Detect hand pose from webcam
   ↓
2. Get cursor position from fingertip
   ↓
3. Detect gesture (pinch? fist? pointing?)
   ↓
4. Handle gesture (draw? undo? redo?)
   ↓
5. Render canvas (draw all objects)
   ↓
6. Draw cursor indicator
   ↓
[Repeat 60 times per second]
```

---

## State Management (Zustand)

```typescript
// Global state object
const state = useStore();

// Read values
state.activeColor      // Current color
state.layers           // All drawing layers
state.isDrawing        // Is user drawing?

// Update values
state.setColor('#FF0000')
state.addLayer('My Layer')
state.startDrawing()
```

**Why Zustand?**
- ✅ Simple, intuitive API
- ✅ No boilerplate (vs Redux)
- ✅ Easy to extend for multi-user (Supabase)
- ✅ Performance optimized

---

## Modification Points

### To Add New Drawing Tool
1. Add to `src/types/index.ts` → `ToolType`
2. Add handler in `src/controllers/drawingController.ts`
3. Add button in `src/views/components/Toolbar.tsx`

### To Add New Gesture
1. Add detection in `src/services/gestureDetector.ts`
2. Add handler in `src/controllers/gestureController.ts`

### To Add New UI Panel
1. Create component in `src/views/components/`
2. Add styles in `src/views/styles/`
3. Import and use in `src/views/App.tsx`

### To Change Colors/Appearance
1. Edit `src/utils/constants.ts` → `DEFAULT_COLORS`
2. Edit CSS files in `src/views/styles/`

---

## Testing Flow

### Manual Testing
1. Start dev server: `npm run dev`
2. Open http://localhost:5173
3. Try each tool (Pencil, Rectangle, Circle, etc.)
4. Test hand gestures (pinch, fist, etc.)
5. Check console (F12) for errors

### Type Checking
```bash
npm run type-check
```
Catches TypeScript errors before runtime

---

## Performance Optimizations

| Optimization | Where | Why |
|--------------|-------|-----|
| RequestAnimationFrame | App.tsx | Smooth 60 FPS |
| Point smoothing | canvasRenderer.ts | Smooth lines |
| Debouncing | gestureController.ts | Prevent rapid clicks |
| State batching | store.ts | Reduce re-renders |
| Canvas context reuse | canvasRenderer.ts | Faster rendering |
| Lazy MediaPipe | handTracking.ts | Only load when needed |

---

## Ready to Extend?

### Phase 2: Multi-User (Supabase)
Only `src/store/store.ts` needs major changes!
- Replace Zustand with server state
- Add WebSocket listeners
- Rest of code unchanged

### Phase 3: Mobile (React Native)
- Use same logic/controllers
- Swap React components for React Native
- Same services work

---

## File Dependencies

```
App.tsx
├── store.ts (state)
├── handTracking.ts (camera)
├── gestureDetector.ts (recognize)
├── canvasRenderer.ts (draw)
├── gestureController.ts (handle events)
├── Toolbar.tsx
├── ColorPicker.tsx
├── LayersPanel.tsx
└── CameraToggle.tsx
```

**Clean dependencies** = Easy to modify

---

## Summary

Your codebase:
- ✅ **Organized** - Clear folder structure
- ✅ **Modular** - Independent, reusable services
- ✅ **Typed** - Full TypeScript coverage
- ✅ **Documented** - Comments everywhere
- ✅ **Testable** - Easy to isolate & test
- ✅ **Scalable** - Ready for Supabase phase 2

**It's not just a project—it's a professional foundation!**

---

**Next:** Run `npm run dev` and see it in action! 🚀
