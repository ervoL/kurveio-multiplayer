# Planning Guide

A browser-based local multiplayer curve drawing game where players control continuously moving lines that grow over time, attempting to be the last player standing by avoiding collisions.

**Experience Qualities**: 
1. **Fast-paced** - Quick reactions and strategic positioning create exciting, tense gameplay moments
2. **Competitive** - Local multiplayer encourages friendly rivalry and repeat matches between friends
3. **Accessible** - Simple controls and clear visual feedback make it easy for anyone to jump in and play

**Complexity Level**: Light Application (multiple features with basic state)
  - The game includes configuration options, real-time canvas rendering, collision detection, and player state management, but remains focused on delivering a single core experience.

## Essential Features

### Game Configuration
- **Functionality**: Allow players to customize game parameters before starting
- **Purpose**: Enables players to adjust difficulty and match duration to their preferences
- **Trigger**: On initial load and after each game ends
- **Progression**: View configuration screen → Select number of players (1-3) → Adjust speed slider → Adjust growth interval → Adjust gap interval → Click "Start Game"
- **Success criteria**: Game starts with selected parameters and all players spawn correctly

### Player Movement
- **Functionality**: Three players control continuously moving lines using different key sets (WASD, IJKL, Arrow keys)
- **Purpose**: Core gameplay mechanic that creates the growing maze of lines
- **Trigger**: Automatically starts when game begins
- **Progression**: Player spawns → Line moves forward automatically → Press turn left key → Line curves left → Press turn right key → Line curves right
- **Success criteria**: Lines respond immediately to input with smooth directional changes

### Collision Detection
- **Functionality**: Detect when a player's line collides with any existing line (including their own)
- **Purpose**: Creates the primary challenge and eliminates players
- **Trigger**: Every frame during active gameplay
- **Progression**: Player line intersects with existing trail → Collision detected → Player eliminated → Check remaining players → Continue or end game
- **Success criteria**: Accurate collision detection with no false positives, player elimination is immediate and clear

### Gap Generation
- **Functionality**: Periodically create small gaps in each player's trail
- **Purpose**: Provides strategic opportunities to pass through trails and prevents inevitable stalemate
- **Trigger**: Random intervals based on configured gap interval
- **Progression**: Timer reaches threshold → Gap begins → Trail invisible for small distance → Gap ends → Trail resumes
- **Success criteria**: Gaps appear at randomized intervals, are visible (missing trail), and allow passage

### Screen Wrapping
- **Functionality**: Players can exit one edge of the play area and reappear on the opposite edge
- **Purpose**: Prevents corner camping and maintains continuous movement flow
- **Trigger**: When player position exceeds canvas boundaries
- **Progression**: Player reaches left edge → Position wraps to right edge (or any edge pair)
- **Success criteria**: Seamless wrapping with continuous trail drawing

### Game End & Winner Declaration
- **Functionality**: Detect when only one player remains and declare them the winner
- **Purpose**: Provides closure and celebrates the victor
- **Trigger**: When all but one player has been eliminated
- **Progression**: Last opponent collides → Winner detection → Congratulations notification appears → Return to configuration screen
- **Success criteria**: Correct winner identified, celebratory message displayed, smooth transition to new game

## Edge Case Handling

- **Simultaneous Collisions** - If multiple players collide in the same frame, the last surviving player wins
- **Self-Collision** - Players can collide with their own trail, eliminating themselves
- **Spawn Collision** - Players spawn in non-overlapping positions with safe initial clearance
- **Single Player Mode** - Game allows practice mode with one player trying to survive as long as possible
- **Key Conflicts** - Each player has dedicated keys to prevent input conflicts

## Design Direction

The design should feel energetic, competitive, and retro-arcade, evoking the classic feel of early computer games while maintaining modern visual polish and smooth animations. A minimal interface serves the core purpose by keeping focus on the fast-paced gameplay arena with clear, high-contrast player trails.

## Color Selection

Triadic color scheme using three equally spaced colors for maximum visual distinction between players.

- **Primary Color**: Deep navy blue (oklch(0.25 0.05 250)) - Creates a dark, focused game arena that makes colored trails pop
- **Secondary Colors**: 
  - Player 1 Red (oklch(0.65 0.25 25)) - High energy, competitive
  - Player 2 Green (oklch(0.70 0.20 145)) - Fresh, distinct from red
  - Player 3 Blue (oklch(0.65 0.20 240)) - Cool, completes the triad
- **Accent Color**: Bright cyan (oklch(0.80 0.15 200)) - Used for UI highlights and active states
- **Foreground/Background Pairings**:
  - Background (Navy #0a0f1e): White text (oklch(0.98 0 0)) - Ratio 16.2:1 ✓
  - Card (Slightly lighter navy oklch(0.28 0.05 250)): White text - Ratio 13.8:1 ✓
  - Primary (Navy): White text - Ratio 16.2:1 ✓
  - Accent (Cyan oklch(0.80 0.15 200)): Dark navy text (oklch(0.20 0.05 250)) - Ratio 11.5:1 ✓

## Font Selection

The typeface should convey precision, speed, and a subtle nod to retro gaming while maintaining excellent readability. Using JetBrains Mono for its technical clarity and monospaced consistency that evokes classic arcade displays.

- **Typographic Hierarchy**:
  - H1 (Game Title): JetBrains Mono Bold/36px/tight letter spacing (-0.02em)
  - H2 (Settings Labels): JetBrains Mono Medium/20px/normal spacing
  - Body (Settings Values): JetBrains Mono Regular/16px/normal spacing
  - Caption (Instructions): JetBrains Mono Regular/14px/wide letter spacing (0.02em)

## Animations

Animations should be quick and functional, emphasizing the immediate feedback necessary for competitive gameplay while adding satisfying moments of delight when games conclude. The balance leans heavily toward subtle functionality with restrained celebrations to maintain focus on gameplay.

- **Purposeful Meaning**: Motion communicates speed and precision through sharp, immediate transitions that reinforce the game's competitive energy
- **Hierarchy of Movement**: 
  - Critical: Trail rendering (60fps smooth drawing)
  - Important: Player elimination (quick flash effect)
  - Supportive: Winner announcement (celebratory scale-in)
  - Subtle: Button hover states (color shifts)

## Component Selection

- **Components**: 
  - Card: Houses the configuration panel with subtle depth
  - Button: Primary CTA for starting game, accent color
  - Select: Dropdown for player count selection
  - Slider: Range controls for speed and interval settings with real-time value display
  - Label: Clear identification for all form controls
  - Custom: Canvas component for game rendering
  
- **Customizations**: 
  - Custom canvas game component with requestAnimationFrame loop
  - Custom player trail rendering with gap generation logic
  - Toast notification (via sonner) for winner announcement with custom styling
  
- **States**: 
  - Buttons: Default (accent bg), Hover (brightened accent), Active (darkened), Disabled (muted)
  - Sliders: Track (muted), Filled (accent), Thumb (white with accent ring on focus)
  - Canvas: Configuration state (hidden) vs Game state (full viewport)
  
- **Icon Selection**: 
  - Play (for start button)
  - ArrowsClockwise (for restart/new game)
  - Trophy (in winner notification)
  
- **Spacing**: 
  - Configuration panel: p-8 for outer padding
  - Form elements: gap-6 for vertical spacing between controls
  - Labels and inputs: gap-2 for tight association
  - Canvas: Full viewport with no padding during gameplay
  
- **Mobile**: 
  - Configuration screen remains functional on mobile with stacked form layout
  - Game canvas fills available viewport
  - Touch controls not implemented (keyboard-only game by design)
  - Responsive text sizing: H1 reduces to 28px on mobile
