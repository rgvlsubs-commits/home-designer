# Home Designer

Matrix-themed web app for designing 2D blueprints and 3D models for **1700 Midwood Dr, Raleigh, NC 27604**.

## Features

- **2D Floor Plan Editor** - Draw, resize, and move rooms with drag-and-drop
- **3D Viewer** - Real-time 3D visualization synced with 2D
- **Natural Language Commands** - "Make the living room 20% bigger"
- **Raleigh Building Codes** - Automatic setback and coverage validation
- **Cost Estimator** - Real-time renovation cost estimates
- **Matrix Theme** - Black background with neon green/cyan styling

## Quick Start

1. **Install dependencies:**
   ```
   Double-click setup.bat
   ```
   Or manually:
   ```
   cd frontend
   npm install
   ```

2. **Start the app:**
   ```
   Double-click start.bat
   ```
   Or manually:
   ```
   cd frontend
   npm run dev
   ```

3. Open http://localhost:5173

## Natural Language Commands

Try these commands in the command bar:

- `make the living room 20% bigger`
- `make the kitchen smaller`
- `move bedroom 1 5 feet north`
- `extend the hallway 3.5 feet`
- `add bathroom`
- `delete bedroom 3`

## Property Details

- **Address:** 1700 Midwood Dr, Raleigh, NC 27604
- **Original Size:** 1,227 sq ft
- **Lot:** 0.19 acre corner lot
- **Built:** 1948 (3 bed, 2 bath bungalow)

## Raleigh Building Code Rules

- Front setback: 20 ft minimum
- Side setbacks: 5 ft minimum
- Rear setback: 20 ft minimum
- Max height: 40 ft / 3 stories
- Max lot coverage: 40%

## Tech Stack

- React + Vite
- Three.js (3D rendering)
- Fabric.js (2D canvas editing)
- Zustand (state management)
