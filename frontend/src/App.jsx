import { useState, useRef, useEffect } from 'react'
import './index.css'

const GRID_SIZE = 0.5
const SCALE = 10
const LOT_WIDTH = 80
const LOT_DEPTH = 103

const snap = (val) => Math.round(val / GRID_SIZE) * GRID_SIZE

// ADU Templates with predefined layouts
const ADU_TEMPLATES = {
  'blank': {
    name: 'Blank Canvas',
    footprint: { width: 24, depth: 24 },
    floors: {
      0: { lines: [], areas: [] },
      1: { lines: [], areas: [] }
    }
  },
  'studio-loft': {
    name: 'Studio with Loft (1BR/1BA)',
    footprint: { width: 24, depth: 24 },
    floors: {
      0: {
        lines: [
          { id: 1, x1: 0, y1: 0, x2: 24, y2: 0 },
          { id: 2, x1: 24, y1: 0, x2: 24, y2: 24 },
          { id: 3, x1: 24, y1: 24, x2: 0, y2: 24 },
          { id: 4, x1: 0, y1: 24, x2: 0, y2: 0 },
          { id: 5, x1: 0, y1: 16, x2: 8, y2: 16 },
          { id: 6, x1: 8, y1: 16, x2: 8, y2: 24 },
          { id: 7, x1: 16, y1: 0, x2: 16, y2: 10 },
          { id: 8, x1: 16, y1: 10, x2: 24, y2: 10 }
        ],
        areas: [
          { id: 101, name: 'Living/Kitchen', lineIds: [1, 2, 8, 7], color: 'hsl(200, 50%, 40%)' },
          { id: 102, name: 'Bathroom', lineIds: [5, 6, 3, 4], color: 'hsl(180, 50%, 35%)' },
          { id: 103, name: 'Entry', lineIds: [7, 8, 2, 3, 6, 5], color: 'hsl(220, 50%, 40%)' }
        ]
      },
      1: {
        lines: [
          { id: 11, x1: 0, y1: 0, x2: 24, y2: 0 },
          { id: 12, x1: 24, y1: 0, x2: 24, y2: 16 },
          { id: 13, x1: 24, y1: 16, x2: 0, y2: 16 },
          { id: 14, x1: 0, y1: 16, x2: 0, y2: 0 },
          { id: 15, x1: 18, y1: 0, x2: 18, y2: 8 },
          { id: 16, x1: 18, y1: 8, x2: 24, y2: 8 }
        ],
        areas: [
          { id: 201, name: 'Bedroom', lineIds: [11, 14, 13, 12], color: 'hsl(240, 50%, 40%)' },
          { id: 202, name: 'Closet', lineIds: [15, 16, 12], color: 'hsl(260, 40%, 35%)' }
        ]
      }
    }
  },
  '2br-1ba': {
    name: '2BR/1BA Two-Story',
    footprint: { width: 28, depth: 26 },
    floors: {
      0: {
        lines: [
          { id: 1, x1: 0, y1: 0, x2: 28, y2: 0 },
          { id: 2, x1: 28, y1: 0, x2: 28, y2: 26 },
          { id: 3, x1: 28, y1: 26, x2: 0, y2: 26 },
          { id: 4, x1: 0, y1: 26, x2: 0, y2: 0 },
          { id: 5, x1: 0, y1: 14, x2: 14, y2: 14 },
          { id: 6, x1: 14, y1: 14, x2: 14, y2: 26 },
          { id: 7, x1: 14, y1: 0, x2: 14, y2: 8 },
          { id: 8, x1: 14, y1: 8, x2: 28, y2: 8 }
        ],
        areas: [
          { id: 101, name: 'Living Room', lineIds: [1, 7, 5, 4], color: 'hsl(200, 50%, 40%)' },
          { id: 102, name: 'Kitchen', lineIds: [7, 8, 2, 6, 5], color: 'hsl(30, 50%, 40%)' },
          { id: 103, name: 'Bathroom', lineIds: [6, 3, 4, 5], color: 'hsl(180, 50%, 35%)' }
        ]
      },
      1: {
        lines: [
          { id: 11, x1: 0, y1: 0, x2: 28, y2: 0 },
          { id: 12, x1: 28, y1: 0, x2: 28, y2: 26 },
          { id: 13, x1: 28, y1: 26, x2: 0, y2: 26 },
          { id: 14, x1: 0, y1: 26, x2: 0, y2: 0 },
          { id: 15, x1: 14, y1: 0, x2: 14, y2: 26 }
        ],
        areas: [
          { id: 201, name: 'Bedroom 1', lineIds: [11, 15, 13, 14], color: 'hsl(240, 50%, 40%)' },
          { id: 202, name: 'Bedroom 2', lineIds: [11, 12, 13, 15], color: 'hsl(260, 50%, 40%)' }
        ]
      }
    }
  },
  '1br-office': {
    name: '1BR + Home Office',
    footprint: { width: 26, depth: 24 },
    floors: {
      0: {
        lines: [
          { id: 1, x1: 0, y1: 0, x2: 26, y2: 0 },
          { id: 2, x1: 26, y1: 0, x2: 26, y2: 24 },
          { id: 3, x1: 26, y1: 24, x2: 0, y2: 24 },
          { id: 4, x1: 0, y1: 24, x2: 0, y2: 0 },
          { id: 5, x1: 0, y1: 12, x2: 12, y2: 12 },
          { id: 6, x1: 12, y1: 12, x2: 12, y2: 24 },
          { id: 7, x1: 18, y1: 0, x2: 18, y2: 12 },
          { id: 8, x1: 12, y1: 12, x2: 18, y2: 12 }
        ],
        areas: [
          { id: 101, name: 'Living/Kitchen', lineIds: [1, 7, 8, 5, 4], color: 'hsl(200, 50%, 40%)' },
          { id: 102, name: 'Office', lineIds: [7, 2, 3, 6, 8], color: 'hsl(120, 40%, 35%)' },
          { id: 103, name: 'Bathroom', lineIds: [5, 6, 3, 4], color: 'hsl(180, 50%, 35%)' }
        ]
      },
      1: {
        lines: [
          { id: 11, x1: 0, y1: 0, x2: 26, y2: 0 },
          { id: 12, x1: 26, y1: 0, x2: 26, y2: 18 },
          { id: 13, x1: 26, y1: 18, x2: 0, y2: 18 },
          { id: 14, x1: 0, y1: 18, x2: 0, y2: 0 },
          { id: 15, x1: 20, y1: 0, x2: 20, y2: 10 },
          { id: 16, x1: 20, y1: 10, x2: 26, y2: 10 }
        ],
        areas: [
          { id: 201, name: 'Primary Bedroom', lineIds: [11, 14, 13, 12], color: 'hsl(240, 50%, 40%)' },
          { id: 202, name: 'Walk-in Closet', lineIds: [15, 16, 12], color: 'hsl(280, 40%, 35%)' }
        ]
      }
    }
  }
}

// Image to lines conversion
const convertImageToLines = (imageUrl, scaleFactor, callback) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const maxSize = 800
    const imgScale = Math.min(maxSize / img.width, maxSize / img.height, 1)
    canvas.width = img.width * imgScale
    canvas.height = img.height * imgScale
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const width = canvas.width
    const height = canvas.height
    const gray = new Uint8Array(width * height)
    const edges = new Uint8Array(width * height)

    for (let i = 0; i < data.length; i += 4) {
      gray[i / 4] = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
    }

    const threshold = 128
    for (let i = 0; i < gray.length; i++) {
      edges[i] = gray[i] < threshold ? 255 : 0
    }

    const detectedLines = []
    const minLineLength = 15

    for (let y = 0; y < height; y++) {
      let startX = -1
      for (let x = 0; x < width; x++) {
        if (edges[y * width + x] > 0) {
          if (startX === -1) startX = x
        } else {
          if (startX !== -1 && x - startX >= minLineLength) {
            detectedLines.push({ x1: startX, y1: y, x2: x - 1, y2: y })
          }
          startX = -1
        }
      }
      if (startX !== -1 && width - startX >= minLineLength) {
        detectedLines.push({ x1: startX, y1: y, x2: width - 1, y2: y })
      }
    }

    for (let x = 0; x < width; x++) {
      let startY = -1
      for (let y = 0; y < height; y++) {
        if (edges[y * width + x] > 0) {
          if (startY === -1) startY = y
        } else {
          if (startY !== -1 && y - startY >= minLineLength) {
            detectedLines.push({ x1: x, y1: startY, x2: x, y2: y - 1 })
          }
          startY = -1
        }
      }
      if (startY !== -1 && height - startY >= minLineLength) {
        detectedLines.push({ x1: x, y1: startY, x2: x, y2: height - 1 })
      }
    }

    const mergeDistance = 8
    const mergedLines = []
    const used = new Set()

    for (let i = 0; i < detectedLines.length; i++) {
      if (used.has(i)) continue
      const line = { ...detectedLines[i] }
      const isHorizontal = Math.abs(line.y2 - line.y1) < Math.abs(line.x2 - line.x1)

      for (let j = i + 1; j < detectedLines.length; j++) {
        if (used.has(j)) continue
        const other = detectedLines[j]
        const otherHoriz = Math.abs(other.y2 - other.y1) < Math.abs(other.x2 - other.x1)
        if (isHorizontal !== otherHoriz) continue

        if (isHorizontal && Math.abs(line.y1 - other.y1) < mergeDistance) {
          if (Math.min(line.x2, other.x2) - Math.max(line.x1, other.x1) > -mergeDistance * 2) {
            line.x1 = Math.min(line.x1, other.x1)
            line.x2 = Math.max(line.x2, other.x2)
            line.y1 = line.y2 = Math.round((line.y1 + other.y1) / 2)
            used.add(j)
          }
        } else if (!isHorizontal && Math.abs(line.x1 - other.x1) < mergeDistance) {
          if (Math.min(line.y2, other.y2) - Math.max(line.y1, other.y1) > -mergeDistance * 2) {
            line.y1 = Math.min(line.y1, other.y1)
            line.y2 = Math.max(line.y2, other.y2)
            line.x1 = line.x2 = Math.round((line.x1 + other.x1) / 2)
            used.add(j)
          }
        }
      }
      used.add(i)
      mergedLines.push(line)
    }

    const feetPerPixel = scaleFactor / canvas.width
    const convertedLines = mergedLines.map((line, i) => ({
      id: Date.now() + i,
      x1: snap(line.x1 * feetPerPixel),
      y1: snap(line.y1 * feetPerPixel),
      x2: snap(line.x2 * feetPerPixel),
      y2: snap(line.y2 * feetPerPixel)
    }))

    const finalLines = convertedLines.filter((line, i) => {
      const len = Math.sqrt((line.x2 - line.x1) ** 2 + (line.y2 - line.y1) ** 2)
      if (len < 1.5) return false
      for (let j = 0; j < i; j++) {
        const other = convertedLines[j]
        if (Math.sqrt((line.x1 - other.x1) ** 2 + (line.y1 - other.y1) ** 2) < 1 &&
            Math.sqrt((line.x2 - other.x2) ** 2 + (line.y2 - other.y2) ** 2) < 1) return false
      }
      return true
    })

    callback(finalLines)
  }
  img.onerror = () => callback([])
  img.src = imageUrl
}

// Calculate area of a polygon defined by points
const calculatePolygonArea = (points) => {
  if (points.length < 3) return 0
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  return Math.abs(area / 2)
}

export default function App() {
  // Mode: 'main' for main house, 'adu' for ADU builder, 'lot' for lot setup
  const [mode, setMode] = useState('main') // Start with blueprint design

  // Lot setup state
  const [address, setAddress] = useState('1700 Midwood Dr, Raleigh, NC')
  const [lotBoundary, setLotBoundary] = useState([]) // Array of {x, y} points
  const [aerialImage, setAerialImage] = useState(null)
  const [lotWidth, setLotWidth] = useState(80) // feet
  const [lotDepth, setLotDepth] = useState(103) // feet
  const [isTracingLot, setIsTracingLot] = useState(false)
  const [showAerial, setShowAerial] = useState(true)
  const [fetchingParcel, setFetchingParcel] = useState(false)
  const [parcelData, setParcelData] = useState(null) // Store full parcel info
  const [parcelError, setParcelError] = useState(null)

  // Main house state
  const [lines, setLines] = useState([])
  const [areas, setAreas] = useState([])
  const [doors, setDoors] = useState([])
  const [windows, setWindows] = useState([])

  // ADU state
  const [aduFloor, setAduFloor] = useState(0)
  const [aduLines, setAduLines] = useState({ 0: [], 1: [] })
  const [aduAreas, setAduAreas] = useState({ 0: [], 1: [] })
  const [aduDoors, setAduDoors] = useState({ 0: [], 1: [] })
  const [aduWindows, setAduWindows] = useState({ 0: [], 1: [] })
  const [aduFootprint, setAduFootprint] = useState({ width: 24, depth: 24 })
  const [selectedTemplate, setSelectedTemplate] = useState('blank')

  // Surroundings state (persists across all modes)
  const [streets, setStreets] = useState([])              // Auto-fetched + manual
  const [nearbyBuildings, setNearbyBuildings] = useState([]) // Auto-fetched only
  const [trees, setTrees] = useState([])                  // Manual entry
  const [fences, setFences] = useState([])                // Manual entry (lines)
  const [driveways, setDriveways] = useState([])          // Manual entry (polygons)
  const [bushes, setBushes] = useState([])                // Manual entry (points)
  const [fetchingSurroundings, setFetchingSurroundings] = useState(false)
  const [surroundingsTool, setSurroundingsTool] = useState('select')
  const [surroundingsVisible, setSurroundingsVisible] = useState({
    streets: true, buildings: true, trees: true, fences: true, driveways: true, bushes: true
  })
  const [selectedTree, setSelectedTree] = useState(null)
  const [selectedFence, setSelectedFence] = useState(null)
  const [selectedDriveway, setSelectedDriveway] = useState(null)
  const [selectedBush, setSelectedBush] = useState(null)
  const [selectedStreet, setSelectedStreet] = useState(null)
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [tracingDriveway, setTracingDriveway] = useState(null) // Points being traced for driveway

  // Integration state - positions and rotations of structures on the lot
  const [housePosition, setHousePosition] = useState({ x: 20, y: 30 }) // Main house position on lot
  const [houseRotation, setHouseRotation] = useState(0) // Main house rotation in degrees
  const [aduPosition, setAduPosition] = useState({ x: 60, y: 70 }) // ADU position on lot
  const [aduRotation, setAduRotation] = useState(0) // ADU rotation in degrees
  const [selectedStructure, setSelectedStructure] = useState(null) // 'house' | 'adu' | null

  // Outdoor amenities
  const [amenities, setAmenities] = useState([])
  const [selectedAmenity, setSelectedAmenity] = useState(null)

  // Interior elements - stairs, boundaries, furniture (per floor)
  const [stairs, setStairs] = useState([])  // Main house stairs
  const [aduStairs, setAduStairs] = useState({ 0: [], 1: [] })  // ADU stairs by floor
  const [boundaries, setBoundaries] = useState([])  // Main house artificial boundaries
  const [aduBoundaries, setAduBoundaries] = useState({ 0: [], 1: [] })  // ADU boundaries by floor
  const [furniture, setFurniture] = useState([])  // Main house furniture
  const [aduFurniture, setAduFurniture] = useState({ 0: [], 1: [] })  // ADU furniture by floor
  const [selectedStair, setSelectedStair] = useState(null)
  const [selectedBoundary, setSelectedBoundary] = useState(null)
  const [selectedFurniture, setSelectedFurniture] = useState(null)

  // Stair templates
  const stairTemplates = {
    'straight-standard': { name: 'Standard Straight', width: 3, length: 10, treads: 13, color: '#8B7355' },
    'straight-wide': { name: 'Wide Straight', width: 4, length: 12, treads: 15, color: '#8B7355' },
    'l-shaped': { name: 'L-Shaped', width: 3, length: 10, treads: 13, color: '#8B7355', shape: 'l' },
    'u-shaped': { name: 'U-Shaped', width: 6, length: 10, treads: 13, color: '#8B7355', shape: 'u' },
    'spiral': { name: 'Spiral', width: 6, length: 6, treads: 12, color: '#8B7355', shape: 'spiral' },
  }

  // Furniture templates (dimensions in feet)
  const furnitureTemplates = {
    // Living Room
    'sofa-2seat': { name: 'Loveseat', width: 5, depth: 3, color: '#6B8E9F', category: 'seating' },
    'sofa-3seat': { name: '3-Seat Sofa', width: 7, depth: 3, color: '#6B8E9F', category: 'seating' },
    'sofa-sectional': { name: 'Sectional', width: 9, depth: 7, color: '#6B8E9F', category: 'seating', shape: 'l' },
    'chair-accent': { name: 'Accent Chair', width: 2.5, depth: 2.5, color: '#7A9E7E', category: 'seating' },
    'chair-recliner': { name: 'Recliner', width: 3, depth: 3, color: '#7A9E7E', category: 'seating' },
    'coffee-table': { name: 'Coffee Table', width: 4, depth: 2, color: '#A0826D', category: 'table' },
    'end-table': { name: 'End Table', width: 2, depth: 2, color: '#A0826D', category: 'table' },
    'tv-console': { name: 'TV Console', width: 5, depth: 1.5, color: '#5D4E4E', category: 'storage' },
    'bookshelf': { name: 'Bookshelf', width: 3, depth: 1, color: '#A0826D', category: 'storage' },
    // Dining
    'dining-table-4': { name: 'Dining Table (4)', width: 4, depth: 3, color: '#A0826D', category: 'table' },
    'dining-table-6': { name: 'Dining Table (6)', width: 6, depth: 3.5, color: '#A0826D', category: 'table' },
    'dining-table-8': { name: 'Dining Table (8)', width: 8, depth: 4, color: '#A0826D', category: 'table' },
    'dining-chair': { name: 'Dining Chair', width: 1.5, depth: 1.5, color: '#8B7765', category: 'seating' },
    // Bedroom
    'bed-twin': { name: 'Twin Bed', width: 3.5, depth: 6.5, color: '#B8A898', category: 'bed' },
    'bed-full': { name: 'Full Bed', width: 4.5, depth: 6.5, color: '#B8A898', category: 'bed' },
    'bed-queen': { name: 'Queen Bed', width: 5, depth: 6.5, color: '#B8A898', category: 'bed' },
    'bed-king': { name: 'King Bed', width: 6.5, depth: 6.5, color: '#B8A898', category: 'bed' },
    'nightstand': { name: 'Nightstand', width: 2, depth: 1.5, color: '#A0826D', category: 'storage' },
    'dresser': { name: 'Dresser', width: 5, depth: 1.5, color: '#A0826D', category: 'storage' },
    'wardrobe': { name: 'Wardrobe', width: 4, depth: 2, color: '#5D4E4E', category: 'storage' },
    // Office
    'desk': { name: 'Desk', width: 5, depth: 2.5, color: '#A0826D', category: 'table' },
    'office-chair': { name: 'Office Chair', width: 2, depth: 2, color: '#4A5568', category: 'seating' },
    'filing-cabinet': { name: 'Filing Cabinet', width: 1.5, depth: 2, color: '#718096', category: 'storage' },
    // Kitchen
    'kitchen-island': { name: 'Kitchen Island', width: 4, depth: 2.5, color: '#A0826D', category: 'table' },
    'bar-stool': { name: 'Bar Stool', width: 1.5, depth: 1.5, color: '#5D4E4E', category: 'seating' },
    // Bathroom
    'vanity-single': { name: 'Single Vanity', width: 3, depth: 2, color: '#E8E8E8', category: 'fixture' },
    'vanity-double': { name: 'Double Vanity', width: 5, depth: 2, color: '#E8E8E8', category: 'fixture' },
    // Entertainment
    'tv-55': { name: '55" TV', width: 4, depth: 0.5, color: '#2D3748', category: 'electronics' },
    'tv-65': { name: '65" TV', width: 4.75, depth: 0.5, color: '#2D3748', category: 'electronics' },
    'tv-75': { name: '75" TV', width: 5.5, depth: 0.5, color: '#2D3748', category: 'electronics' },
    'piano-upright': { name: 'Upright Piano', width: 5, depth: 2, color: '#1A202C', category: 'furniture' },
    'piano-grand': { name: 'Grand Piano', width: 5, depth: 6, color: '#1A202C', category: 'furniture' },
  }

  // Amenity templates library
  const amenityTemplates = {
    'pool-rectangular-small': { name: 'Small Pool', width: 12, height: 24, color: '#4a9fdc', shape: 'rect' },
    'pool-rectangular-medium': { name: 'Medium Pool', width: 16, height: 32, color: '#4a9fdc', shape: 'rect' },
    'pool-rectangular-large': { name: 'Large Pool', width: 20, height: 40, color: '#4a9fdc', shape: 'rect' },
    'pool-lap': { name: 'Lap Pool', width: 8, height: 50, color: '#4a9fdc', shape: 'rect' },
    'pool-kidney': { name: 'Kidney Pool', width: 18, height: 30, color: '#4a9fdc', shape: 'kidney' },
    'pool-l-shaped': { name: 'L-Shaped Pool', width: 24, height: 32, color: '#4a9fdc', shape: 'l-shape' },
    'hot-tub-round': { name: 'Round Hot Tub', width: 8, height: 8, color: '#6ab4e8', shape: 'circle' },
    'hot-tub-square': { name: 'Square Hot Tub', width: 8, height: 8, color: '#6ab4e8', shape: 'rect' },
    'sauna-small': { name: 'Small Sauna', width: 6, height: 8, color: '#CD853F', shape: 'rect' },
    'sauna-large': { name: 'Large Sauna', width: 8, height: 12, color: '#CD853F', shape: 'rect' },
    'outdoor-kitchen-small': { name: 'Outdoor Kitchen (S)', width: 10, height: 5, color: '#708090', shape: 'rect' },
    'outdoor-kitchen-large': { name: 'Outdoor Kitchen (L)', width: 16, height: 6, color: '#708090', shape: 'rect' },
    'fire-pit': { name: 'Fire Pit', width: 6, height: 6, color: '#8B4513', shape: 'circle' },
    'pergola-small': { name: 'Pergola (S)', width: 10, height: 10, color: '#DEB887', shape: 'rect' },
    'pergola-large': { name: 'Pergola (L)', width: 14, height: 14, color: '#DEB887', shape: 'rect' },
    'gazebo': { name: 'Gazebo', width: 12, height: 12, color: '#D2B48C', shape: 'octagon' },
    'tennis-court': { name: 'Tennis Court', width: 36, height: 78, color: '#228B22', shape: 'rect' },
    'basketball-half': { name: 'Basketball (Half)', width: 25, height: 22, color: '#A0522D', shape: 'rect' },
    'porch-small': { name: 'Small Porch', width: 8, height: 6, color: '#A0826D', shape: 'rect' },
    'porch-medium': { name: 'Medium Porch', width: 12, height: 8, color: '#A0826D', shape: 'rect' },
    'porch-large': { name: 'Large Porch', width: 20, height: 10, color: '#A0826D', shape: 'rect' },
    'porch-wrap': { name: 'Wrap-Around Porch', width: 30, height: 8, color: '#A0826D', shape: 'rect' },
  }

  // Shared UI state
  const [selectedLine, setSelectedLine] = useState(null)
  const [selectedArea, setSelectedArea] = useState(null)
  const [selectedDoor, setSelectedDoor] = useState(null)
  const [selectedWindow, setSelectedWindow] = useState(null)
  const [tool, setTool] = useState('select')
  const [drawing, setDrawing] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [newAreaName, setNewAreaName] = useState('Living Room')
  const [processing, setProcessing] = useState(false)
  const [blueprintScale, setBlueprintScale] = useState(50)
  const [multiSelect, setMultiSelect] = useState([])
  const [zoom, setZoom] = useState(1) // Default zoom at 100%
  const [doorSwing, setDoorSwing] = useState('left') // 'left' or 'right' swing direction
  const [clipboard, setClipboard] = useState(null) // For copy/paste
  const [history, setHistory] = useState([]) // For undo
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [selectionBox, setSelectionBox] = useState(null) // For drag-to-select
  const [multiSelected, setMultiSelected] = useState({ lines: [], doors: [], windows: [] }) // Multiple selection

  // AI Blueprint Generator state
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiChatMessages, setAiChatMessages] = useState([
    { role: 'assistant', content: "Hi! I can help you design a floor plan. Tell me about your dream home - how many bedrooms, bathrooms, total square footage, and any style preferences (open concept, traditional, etc.)?" }
  ])
  const [aiInput, setAiInput] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiParams, setAiParams] = useState({
    sqft: 1800,
    bedrooms: 3,
    bathrooms: 2,
    floors: 1,
    style: 'open', // 'open', 'traditional'
    garage: true,
    primarySuite: true,
    target: 'main' // 'main' or 'adu'
  })

  // Project & Version Management
  const [showProjectPanel, setShowProjectPanel] = useState(false)
  const [showCostEstimator, setShowCostEstimator] = useState(true)
  const [projectName, setProjectName] = useState('My Home Design')
  const [versions, setVersions] = useState([]) // Array of saved versions
  const [currentVersionId, setCurrentVersionId] = useState(null) // Currently loaded version
  const [mainVersionId, setMainVersionId] = useState(null) // The designated "main" version

  // Load project from localStorage on mount
  useEffect(() => {
    const savedProject = localStorage.getItem('homeDesignerProject')
    if (savedProject) {
      try {
        const project = JSON.parse(savedProject)
        setProjectName(project.name || 'My Home Design')
        setVersions(project.versions || [])
        setMainVersionId(project.mainVersionId || null)
        // Auto-load main version if it exists
        if (project.mainVersionId && project.versions) {
          const mainVersion = project.versions.find(v => v.id === project.mainVersionId)
          if (mainVersion) {
            loadVersionData(mainVersion.data)
            setCurrentVersionId(mainVersion.id)
          }
        }
      } catch (e) {
        console.error('Failed to load project:', e)
      }
    }
  }, [])

  // Save project to localStorage whenever versions change
  useEffect(() => {
    if (versions.length > 0 || projectName !== 'My Home Design') {
      const project = {
        name: projectName,
        versions: versions,
        mainVersionId: mainVersionId,
        lastModified: new Date().toISOString()
      }
      localStorage.setItem('homeDesignerProject', JSON.stringify(project))
    }
  }, [versions, projectName, mainVersionId])

  // Get current design state as an object
  const getCurrentDesignState = () => ({
    // Main house
    lines, areas, doors, windows, stairs, boundaries, furniture,
    // ADU
    aduLines, aduAreas, aduDoors, aduWindows, aduStairs, aduBoundaries, aduFurniture, aduFootprint,
    // Lot & Integration
    lotBoundary, parcelData, housePosition, houseRotation, aduPosition, aduRotation,
    // Surroundings
    streets, nearbyBuildings, trees, fences, driveways, bushes, amenities,
    // Visibility settings
    surroundingsVisible
  })

  // Load design state from a saved version
  const loadVersionData = (data) => {
    if (!data) return
    // Main house
    if (data.lines) setLines(data.lines)
    if (data.areas) setAreas(data.areas)
    if (data.doors) setDoors(data.doors)
    if (data.windows) setWindows(data.windows)
    if (data.stairs) setStairs(data.stairs)
    if (data.boundaries) setBoundaries(data.boundaries)
    if (data.furniture) setFurniture(data.furniture)
    // ADU
    if (data.aduLines) setAduLines(data.aduLines)
    if (data.aduAreas) setAduAreas(data.aduAreas)
    if (data.aduDoors) setAduDoors(data.aduDoors)
    if (data.aduWindows) setAduWindows(data.aduWindows)
    if (data.aduStairs) setAduStairs(data.aduStairs)
    if (data.aduBoundaries) setAduBoundaries(data.aduBoundaries)
    if (data.aduFurniture) setAduFurniture(data.aduFurniture)
    if (data.aduFootprint) setAduFootprint(data.aduFootprint)
    // Lot & Integration
    if (data.lotBoundary) setLotBoundary(data.lotBoundary)
    if (data.parcelData) setParcelData(data.parcelData)
    if (data.housePosition) setHousePosition(data.housePosition)
    if (data.houseRotation !== undefined) setHouseRotation(data.houseRotation)
    if (data.aduPosition) setAduPosition(data.aduPosition)
    if (data.aduRotation !== undefined) setAduRotation(data.aduRotation)
    // Surroundings
    if (data.streets) setStreets(data.streets)
    if (data.nearbyBuildings) setNearbyBuildings(data.nearbyBuildings)
    if (data.trees) setTrees(data.trees)
    if (data.fences) setFences(data.fences)
    if (data.driveways) setDriveways(data.driveways)
    if (data.bushes) setBushes(data.bushes)
    if (data.amenities) setAmenities(data.amenities)
    if (data.surroundingsVisible) setSurroundingsVisible(data.surroundingsVisible)
  }

  // Save current state as a new version
  const saveVersion = (name, isMain = false) => {
    const newVersion = {
      id: Date.now().toString(),
      name: name || `Version ${versions.length + 1}`,
      createdAt: new Date().toISOString(),
      data: getCurrentDesignState()
    }
    const updatedVersions = [...versions, newVersion]
    setVersions(updatedVersions)
    setCurrentVersionId(newVersion.id)
    if (isMain || !mainVersionId) {
      setMainVersionId(newVersion.id)
    }
    return newVersion.id
  }

  // Update an existing version
  const updateVersion = (versionId) => {
    setVersions(versions.map(v =>
      v.id === versionId
        ? { ...v, data: getCurrentDesignState(), updatedAt: new Date().toISOString() }
        : v
    ))
  }

  // Load a specific version
  const loadVersion = (versionId) => {
    const version = versions.find(v => v.id === versionId)
    if (version) {
      loadVersionData(version.data)
      setCurrentVersionId(versionId)
    }
  }

  // Delete a version
  const deleteVersion = (versionId) => {
    if (versions.length <= 1) {
      alert('Cannot delete the last version')
      return
    }
    const updatedVersions = versions.filter(v => v.id !== versionId)
    setVersions(updatedVersions)
    if (mainVersionId === versionId) {
      setMainVersionId(updatedVersions[0]?.id || null)
    }
    if (currentVersionId === versionId) {
      loadVersion(updatedVersions[0]?.id)
    }
  }

  // Promote a version to main
  const promoteToMain = (versionId) => {
    setMainVersionId(versionId)
  }

  // Export project as JSON file
  const exportProject = () => {
    const project = {
      name: projectName,
      versions: versions,
      mainVersionId: mainVersionId,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_project.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import project from JSON file
  const importProject = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target.result)
        if (project.versions && Array.isArray(project.versions)) {
          setProjectName(project.name || 'Imported Project')
          setVersions(project.versions)
          setMainVersionId(project.mainVersionId || project.versions[0]?.id)
          if (project.versions.length > 0) {
            const mainV = project.versions.find(v => v.id === project.mainVersionId) || project.versions[0]
            loadVersionData(mainV.data)
            setCurrentVersionId(mainV.id)
          }
          alert('Project imported successfully!')
        } else {
          alert('Invalid project file format')
        }
      } catch (err) {
        alert('Failed to import project: ' + err.message)
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset input
  }

  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const projectImportRef = useRef(null)

  const OFFSET_X = 50
  const OFFSET_Y = 50

  // Get current lines/areas/doors/windows based on mode
  const currentLines = mode === 'main' ? lines : aduLines[aduFloor]
  const currentAreas = mode === 'main' ? areas : aduAreas[aduFloor]
  const currentDoors = mode === 'main' ? doors : aduDoors[aduFloor]
  const currentWindows = mode === 'main' ? windows : aduWindows[aduFloor]
  const currentStairs = mode === 'main' ? stairs : aduStairs[aduFloor]
  const currentBoundaries = mode === 'main' ? boundaries : aduBoundaries[aduFloor]
  const currentFurniture = mode === 'main' ? furniture : aduFurniture[aduFloor]

  // Check if multiple items are selected
  const hasMultiSelection = multiSelected.lines.length > 0 || multiSelected.doors.length > 0 || multiSelected.windows.length > 0

  // Determine which elements to show based on mode
  const showLotAndSurroundings = mode === 'lot' || mode === 'surroundings' || mode === 'integrate'
  const showHouseDesign = mode === 'main' || mode === 'integrate'
  const showAduDesign = mode === 'adu' || mode === 'integrate'

  // Calculate dynamic canvas size based on lot dimensions (with padding)
  const canvasWidth = Math.max(1400, (lotWidth + 40) * SCALE + OFFSET_X * 2)
  const canvasHeight = Math.max(1200, (lotDepth + 40) * SCALE + OFFSET_Y * 2)
  const gridCountX = Math.ceil(canvasWidth / SCALE)
  const gridCountY = Math.ceil(canvasHeight / SCALE)

  const setCurrentLines = (newLines) => {
    if (mode === 'main') {
      setLines(newLines)
    } else {
      setAduLines({ ...aduLines, [aduFloor]: newLines })
    }
  }

  const setCurrentAreas = (newAreas) => {
    if (mode === 'main') {
      setAreas(newAreas)
    } else {
      setAduAreas({ ...aduAreas, [aduFloor]: newAreas })
    }
  }

  const setCurrentDoors = (newDoors) => {
    if (mode === 'main') {
      setDoors(newDoors)
    } else {
      setAduDoors({ ...aduDoors, [aduFloor]: newDoors })
    }
  }

  const setCurrentWindows = (newWindows) => {
    if (mode === 'main') {
      setWindows(newWindows)
    } else {
      setAduWindows({ ...aduWindows, [aduFloor]: newWindows })
    }
  }

  const setCurrentStairs = (newStairs) => {
    if (mode === 'main') {
      setStairs(newStairs)
    } else {
      setAduStairs({ ...aduStairs, [aduFloor]: newStairs })
    }
  }

  const setCurrentBoundaries = (newBoundaries) => {
    if (mode === 'main') {
      setBoundaries(newBoundaries)
    } else {
      setAduBoundaries({ ...aduBoundaries, [aduFloor]: newBoundaries })
    }
  }

  const setCurrentFurniture = (newFurniture) => {
    if (mode === 'main') {
      setFurniture(newFurniture)
    } else {
      setAduFurniture({ ...aduFurniture, [aduFloor]: newFurniture })
    }
  }

  // AI Blueprint Generator
  const generateBlueprint = (params) => {
    const { sqft, bedrooms, bathrooms, style, garage, primarySuite } = params

    // Calculate overall dimensions based on square footage
    // Aim for roughly 1.3:1 ratio (wider than deep)
    const ratio = 1.3
    const depth = Math.sqrt(sqft / ratio)
    const width = sqft / depth

    // Round to nearest 2 feet for clean dimensions
    const totalWidth = Math.round(width / 2) * 2
    const totalDepth = Math.round(depth / 2) * 2

    const newLines = []
    const newAreas = []
    const newDoors = []
    const newWindows = []
    let lineId = 1
    let areaId = 1
    let doorId = 1
    let windowId = 1

    // Helper to add a rectangular room
    const addRoom = (x, y, w, h, name, color) => {
      const roomLines = [
        { id: lineId++, x1: x, y1: y, x2: x + w, y2: y },           // top
        { id: lineId++, x1: x + w, y1: y, x2: x + w, y2: y + h },   // right
        { id: lineId++, x1: x + w, y1: y + h, x2: x, y2: y + h },   // bottom
        { id: lineId++, x1: x, y1: y + h, x2: x, y2: y }            // left
      ]
      newLines.push(...roomLines)
      newAreas.push({
        id: areaId++,
        name,
        lineIds: roomLines.map(l => l.id),
        color
      })
      return { x, y, w, h, lines: roomLines }
    }

    // Helper to add interior wall
    const addWall = (x1, y1, x2, y2) => {
      newLines.push({ id: lineId++, x1, y1, x2, y2 })
      return lineId - 1
    }

    // Helper to add door
    const addDoor = (x, y, width, orientation, swing = 'left') => {
      newDoors.push({ id: doorId++, x, y, width, orientation, swing })
    }

    // Helper to add window
    const addWindow = (x, y, width, orientation) => {
      newWindows.push({ id: windowId++, x, y, width, orientation })
    }

    // Room colors
    const colors = {
      living: 'hsl(200, 50%, 45%)',
      kitchen: 'hsl(30, 50%, 45%)',
      dining: 'hsl(45, 50%, 45%)',
      bedroom: 'hsl(240, 40%, 45%)',
      bathroom: 'hsl(180, 50%, 40%)',
      primary: 'hsl(260, 40%, 45%)',
      closet: 'hsl(280, 30%, 40%)',
      garage: 'hsl(0, 0%, 40%)',
      entry: 'hsl(20, 40%, 45%)',
      laundry: 'hsl(160, 40%, 40%)'
    }

    // Calculate room sizes
    const bedroomSize = style === 'open' ? 140 : 150 // sq ft per bedroom
    const primarySize = primarySuite ? 250 : bedroomSize
    const bathroomSize = 50 // sq ft per bathroom
    const kitchenSize = style === 'open' ? 0 : 150 // kitchen separate or combined
    const livingSize = sqft - (bedrooms - 1) * bedroomSize - primarySize - bathrooms * bathroomSize - kitchenSize - (garage ? 0 : 0)

    // Build the layout
    // Exterior walls
    addWall(0, 0, totalWidth, 0)
    addWall(totalWidth, 0, totalWidth, totalDepth)
    addWall(totalWidth, totalDepth, 0, totalDepth)
    addWall(0, totalDepth, 0, 0)

    if (style === 'open') {
      // OPEN CONCEPT LAYOUT
      // Living/Kitchen/Dining is one large open space on one side
      // Bedrooms on the other side

      const publicWidth = Math.round(totalWidth * 0.55 / 2) * 2
      const privateWidth = totalWidth - publicWidth

      // Vertical divider between public and private
      addWall(publicWidth, 0, publicWidth, totalDepth)

      // Open living/kitchen/dining area
      newAreas.push({
        id: areaId++,
        name: 'Great Room',
        lineIds: [1, 5], // exterior + divider
        color: colors.living
      })

      // Add kitchen island indicator (just a note - user can add furniture)
      // Windows on front and back of living area
      addWindow(publicWidth / 2 - 3, 0, 6, 'horizontal') // front
      addWindow(publicWidth / 2 - 3, totalDepth, 6, 'horizontal') // back
      addWindow(0, totalDepth / 2 - 2, 4, 'vertical') // side

      // Front door
      addDoor(publicWidth / 3, 0, 3, 'horizontal', 'right')

      // Private wing - bedrooms and bathrooms
      const roomDepth = Math.round(totalDepth / (bedrooms + 1) / 2) * 2
      let currentY = 0

      // Hallway along the divider wall
      const hallWidth = 4
      addWall(publicWidth + hallWidth, 0, publicWidth + hallWidth, totalDepth)

      // Primary bedroom (largest, at back)
      const primaryDepth = Math.round(roomDepth * 1.5 / 2) * 2
      addWall(publicWidth, totalDepth - primaryDepth, totalWidth, totalDepth - primaryDepth)
      newAreas.push({
        id: areaId++,
        name: 'Primary Bedroom',
        lineIds: [],
        color: colors.primary
      })
      addDoor(publicWidth + hallWidth, totalDepth - primaryDepth + 1, 3, 'vertical', 'right')
      addWindow(totalWidth, totalDepth - primaryDepth / 2, 4, 'vertical')

      // Primary bathroom (in primary suite)
      if (primarySuite) {
        const bathWidth = 8
        const bathDepth = 6
        addWall(totalWidth - bathWidth, totalDepth - primaryDepth, totalWidth - bathWidth, totalDepth - primaryDepth + bathDepth)
        addWall(totalWidth - bathWidth, totalDepth - primaryDepth + bathDepth, totalWidth, totalDepth - primaryDepth + bathDepth)
        newAreas.push({
          id: areaId++,
          name: 'Primary Bath',
          lineIds: [],
          color: colors.bathroom
        })
        addDoor(totalWidth - bathWidth, totalDepth - primaryDepth + 2, 2.5, 'vertical', 'left')
      }

      // Other bedrooms
      const otherBedrooms = bedrooms - 1
      const otherDepth = Math.round((totalDepth - primaryDepth) / Math.max(otherBedrooms, 1) / 2) * 2

      for (let i = 0; i < otherBedrooms; i++) {
        const y = i * otherDepth
        if (i < otherBedrooms - 1) {
          addWall(publicWidth + hallWidth, y + otherDepth, totalWidth, y + otherDepth)
        }
        newAreas.push({
          id: areaId++,
          name: `Bedroom ${i + 2}`,
          lineIds: [],
          color: colors.bedroom
        })
        addDoor(publicWidth + hallWidth, y + 1, 2.5, 'vertical', 'right')
        addWindow(totalWidth, y + otherDepth / 2, 3, 'vertical')
      }

      // Hall bathroom
      if (bathrooms > 1) {
        const hallBathY = otherBedrooms > 0 ? otherDepth - 6 : primaryDepth
        // Hall bath at end of hall
      }

    } else {
      // TRADITIONAL LAYOUT
      // Separate rooms with defined spaces

      // Front of house: Living room and Dining room
      const frontDepth = Math.round(totalDepth * 0.4 / 2) * 2
      const livingWidth = Math.round(totalWidth * 0.5 / 2) * 2

      // Horizontal divider between front and back
      addWall(0, frontDepth, totalWidth, frontDepth)

      // Vertical divider in front (living | dining)
      addWall(livingWidth, 0, livingWidth, frontDepth)

      newAreas.push({
        id: areaId++,
        name: 'Living Room',
        lineIds: [],
        color: colors.living
      })
      addWindow(livingWidth / 2 - 2, 0, 4, 'horizontal')
      addDoor(livingWidth / 3, 0, 3, 'horizontal', 'right') // front door

      newAreas.push({
        id: areaId++,
        name: 'Dining Room',
        lineIds: [],
        color: colors.dining
      })
      addWindow(livingWidth + (totalWidth - livingWidth) / 2 - 2, 0, 4, 'horizontal')
      addDoor(livingWidth, frontDepth / 2, 3, 'vertical', 'left') // to living

      // Back of house: Kitchen and Family/Bedrooms
      const backDepth = totalDepth - frontDepth
      const kitchenWidth = Math.round(totalWidth * 0.35 / 2) * 2

      // Kitchen
      addWall(kitchenWidth, frontDepth, kitchenWidth, totalDepth)
      newAreas.push({
        id: areaId++,
        name: 'Kitchen',
        lineIds: [],
        color: colors.kitchen
      })
      addWindow(kitchenWidth / 2 - 2, totalDepth, 4, 'horizontal')
      addDoor(kitchenWidth, frontDepth + 2, 3, 'vertical', 'right')
      addDoor(kitchenWidth / 2 + 1, frontDepth, 3, 'horizontal', 'left') // to dining

      // Bedroom wing
      const bedroomWingWidth = totalWidth - kitchenWidth
      const bedroomHeight = Math.round(backDepth / bedrooms / 2) * 2

      for (let i = 0; i < bedrooms; i++) {
        const y = frontDepth + i * bedroomHeight
        if (i < bedrooms - 1) {
          addWall(kitchenWidth, y + bedroomHeight, totalWidth, y + bedroomHeight)
        }
        const name = i === 0 ? 'Primary Bedroom' : `Bedroom ${i + 1}`
        newAreas.push({
          id: areaId++,
          name,
          lineIds: [],
          color: i === 0 ? colors.primary : colors.bedroom
        })
        addWindow(totalWidth, y + bedroomHeight / 2, 3, 'vertical')
        addDoor(kitchenWidth, y + 1, 2.5, 'vertical', 'right')
      }
    }

    // Apply to state based on target (from params or current mode)
    const target = params.target || mode
    saveToHistory()
    if (target === 'main') {
      setLines(newLines)
      setAreas(newAreas)
      setDoors(newDoors)
      setWindows(newWindows)
    } else {
      setAduLines({ ...aduLines, [aduFloor]: newLines })
      setAduAreas({ ...aduAreas, [aduFloor]: newAreas })
      setAduDoors({ ...aduDoors, [aduFloor]: newDoors })
      setAduWindows({ ...aduWindows, [aduFloor]: newWindows })
    }

    return { totalWidth, totalDepth, rooms: newAreas.length }
  }

  // Parse natural language input for AI chat
  const parseAIInput = (input) => {
    const lower = input.toLowerCase()
    const params = { ...aiParams }

    // Extract square footage
    const sqftMatch = lower.match(/(\d{3,4})\s*(sq\.?\s*ft|square\s*feet|sf)/i)
    if (sqftMatch) params.sqft = parseInt(sqftMatch[1])

    // Extract bedrooms
    const bedMatch = lower.match(/(\d+)\s*(bed|br|bedroom)/i)
    if (bedMatch) params.bedrooms = parseInt(bedMatch[1])

    // Extract bathrooms
    const bathMatch = lower.match(/(\d+\.?\d*)\s*(bath|ba|bathroom)/i)
    if (bathMatch) params.bathrooms = parseFloat(bathMatch[1])

    // Check for style keywords
    if (lower.includes('open concept') || lower.includes('open floor') || lower.includes('great room')) {
      params.style = 'open'
    } else if (lower.includes('traditional') || lower.includes('separate') || lower.includes('formal')) {
      params.style = 'traditional'
    }

    // Check for features
    if (lower.includes('no garage') || lower.includes('without garage')) {
      params.garage = false
    } else if (lower.includes('garage')) {
      params.garage = true
    }

    if (lower.includes('master suite') || lower.includes('primary suite') || lower.includes('ensuite')) {
      params.primarySuite = true
    }

    return params
  }

  // Handle AI chat submit
  const handleAISubmit = () => {
    if (!aiInput.trim()) return

    const userMessage = aiInput.trim()
    setAiChatMessages([...aiChatMessages, { role: 'user', content: userMessage }])
    setAiInput('')
    setAiGenerating(true)

    // Parse the input and preserve current target unless explicitly mentioned
    const parsedParams = parseAIInput(userMessage)
    // Detect if user mentioned ADU or main house
    const lowerMessage = userMessage.toLowerCase()
    let target = aiParams.target // Keep current target by default
    if (lowerMessage.includes('adu') || lowerMessage.includes('accessory') || lowerMessage.includes('guest house')) {
      target = 'adu'
    } else if (lowerMessage.includes('main house') || lowerMessage.includes('primary')) {
      target = 'main'
    }
    const newParams = { ...parsedParams, target }
    setAiParams(newParams)

    // Switch to target mode if needed
    if (mode !== target) {
      setMode(target)
    }

    // Simulate AI thinking
    setTimeout(() => {
      // Generate the blueprint
      const result = generateBlueprint(newParams)
      const targetLabel = target === 'main' ? 'Main House' : 'ADU'

      const response = `I've created a ${newParams.sqft} sq ft ${newParams.style === 'open' ? 'open concept' : 'traditional'} ${targetLabel} floor plan with ${newParams.bedrooms} bedroom${newParams.bedrooms > 1 ? 's' : ''} and ${newParams.bathrooms} bathroom${newParams.bathrooms > 1 ? 's' : ''}. The layout is ${result.totalWidth}' × ${result.totalDepth}' with ${result.rooms} defined spaces.\n\nYou can now:\n• Drag walls to adjust room sizes\n• Add/remove doors and windows\n• Use the tools to refine the design\n\nWant me to try a different layout? Just describe what you'd like to change!`

      setAiChatMessages(prev => [...prev, { role: 'assistant', content: response }])
      setAiGenerating(false)
    }, 1000)
  }

  // Save current state to history for undo
  const saveToHistory = () => {
    const state = {
      lines: mode === 'main' ? [...lines] : { ...aduLines },
      areas: mode === 'main' ? [...areas] : { ...aduAreas },
      doors: mode === 'main' ? [...doors] : { ...aduDoors },
      windows: mode === 'main' ? [...windows] : { ...aduWindows },
      mode,
      aduFloor
    }
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(state)
    // Keep only last 50 states
    if (newHistory.length > 50) newHistory.shift()
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // Undo last action
  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      if (prevState.mode === 'main') {
        setLines(prevState.lines)
        setAreas(prevState.areas)
        setDoors(prevState.doors)
        setWindows(prevState.windows)
      } else {
        setAduLines(prevState.lines)
        setAduAreas(prevState.areas)
        setAduDoors(prevState.doors)
        setAduWindows(prevState.windows)
      }
      setHistoryIndex(historyIndex - 1)
      setSelectedLine(null)
      setSelectedArea(null)
      setSelectedDoor(null)
      setSelectedWindow(null)
    }
  }

  // Copy selected item(s)
  const copySelected = () => {
    if (hasMultiSelection) {
      // Copy multiple items
      setClipboard({
        type: 'multi',
        data: {
          lines: currentLines.filter(l => multiSelected.lines.includes(l.id)).map(l => ({ ...l })),
          doors: currentDoors.filter(d => multiSelected.doors.includes(d.id)).map(d => ({ ...d })),
          windows: currentWindows.filter(w => multiSelected.windows.includes(w.id)).map(w => ({ ...w }))
        }
      })
    } else if (selectedLine) {
      const line = currentLines.find(l => l.id === selectedLine)
      if (line) setClipboard({ type: 'line', data: { ...line } })
    } else if (selectedDoor) {
      const door = currentDoors.find(d => d.id === selectedDoor)
      if (door) setClipboard({ type: 'door', data: { ...door } })
    } else if (selectedWindow) {
      const win = currentWindows.find(w => w.id === selectedWindow)
      if (win) setClipboard({ type: 'window', data: { ...win } })
    }
  }

  // Paste from clipboard
  const pasteClipboard = () => {
    if (!clipboard) return
    saveToHistory()

    const offset = 2 // Offset pasted item by 2 feet
    const now = Date.now()

    if (clipboard.type === 'multi') {
      // Paste multiple items
      const newLines = clipboard.data.lines.map((l, i) => ({
        ...l,
        id: now + i,
        x1: l.x1 + offset,
        y1: l.y1 + offset,
        x2: l.x2 + offset,
        y2: l.y2 + offset
      }))
      const newDoors = clipboard.data.doors.map((d, i) => ({
        ...d,
        id: now + 100 + i,
        x: d.x + offset,
        y: d.y + offset
      }))
      const newWindows = clipboard.data.windows.map((w, i) => ({
        ...w,
        id: now + 200 + i,
        x: w.x + offset,
        y: w.y + offset
      }))

      setCurrentLines([...currentLines, ...newLines])
      setCurrentDoors([...currentDoors, ...newDoors])
      setCurrentWindows([...currentWindows, ...newWindows])

      // Select the pasted items
      setMultiSelected({
        lines: newLines.map(l => l.id),
        doors: newDoors.map(d => d.id),
        windows: newWindows.map(w => w.id)
      })
      setSelectedLine(null)
      setSelectedDoor(null)
      setSelectedWindow(null)
    } else if (clipboard.type === 'line') {
      const newLine = {
        ...clipboard.data,
        id: now,
        x1: clipboard.data.x1 + offset,
        y1: clipboard.data.y1 + offset,
        x2: clipboard.data.x2 + offset,
        y2: clipboard.data.y2 + offset
      }
      setCurrentLines([...currentLines, newLine])
      setSelectedLine(now)
      setSelectedDoor(null)
      setSelectedWindow(null)
    } else if (clipboard.type === 'door') {
      const newDoor = {
        ...clipboard.data,
        id: now,
        x: clipboard.data.x + offset,
        y: clipboard.data.y + offset
      }
      setCurrentDoors([...currentDoors, newDoor])
      setSelectedDoor(now)
      setSelectedLine(null)
      setSelectedWindow(null)
    } else if (clipboard.type === 'window') {
      const newWindow = {
        ...clipboard.data,
        id: now,
        x: clipboard.data.x + offset,
        y: clipboard.data.y + offset
      }
      setCurrentWindows([...currentWindows, newWindow])
      setSelectedWindow(now)
      setSelectedLine(null)
      setSelectedDoor(null)
    }
  }

  // Find nearest wall and snap point for doors/windows
  const findSnapToWall = (x, y, itemWidth, orientation) => {
    let bestSnap = null
    let minDist = 3 // Max snap distance in feet

    currentLines.forEach(line => {
      const isWallHorizontal = Math.abs(line.y2 - line.y1) < Math.abs(line.x2 - line.x1)
      const isWallVertical = !isWallHorizontal

      if (isWallHorizontal && orientation === 'horizontal') {
        // Check if y is close to wall
        const wallY = line.y1
        if (Math.abs(y - wallY) < minDist) {
          const wallStartX = Math.min(line.x1, line.x2)
          const wallEndX = Math.max(line.x1, line.x2)
          const wallLength = wallEndX - wallStartX

          // Snap to center of wall
          const centerX = wallStartX + (wallLength - itemWidth) / 2
          if (x >= wallStartX - minDist && x <= wallEndX + minDist) {
            const dist = Math.abs(y - wallY)
            if (dist < minDist) {
              minDist = dist
              bestSnap = { x: centerX, y: wallY, wallId: line.id, snapType: 'center' }
            }
          }
        }
      } else if (isWallVertical && orientation === 'vertical') {
        // Check if x is close to wall
        const wallX = line.x1
        if (Math.abs(x - wallX) < minDist) {
          const wallStartY = Math.min(line.y1, line.y2)
          const wallEndY = Math.max(line.y1, line.y2)
          const wallLength = wallEndY - wallStartY

          // Snap to center of wall
          const centerY = wallStartY + (wallLength - itemWidth) / 2
          if (y >= wallStartY - minDist && y <= wallEndY + minDist) {
            const dist = Math.abs(x - wallX)
            if (dist < minDist) {
              minDist = dist
              bestSnap = { x: wallX, y: centerY, wallId: line.id, snapType: 'center' }
            }
          }
        }
      }
    })

    return bestSnap
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // Ctrl/Cmd + Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undo()
      }
      // Ctrl/Cmd + C = Copy
      else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
        copySelected()
      }
      // Ctrl/Cmd + V = Paste
      else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        pasteClipboard()
      }
      // Delete or Backspace = Delete selected (or undo last driveway point)
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        // If tracing driveway, undo last point
        if (tracingDriveway && tracingDriveway.length > 0) {
          if (tracingDriveway.length === 1) {
            setTracingDriveway(null) // Cancel if only one point
          } else {
            setTracingDriveway(tracingDriveway.slice(0, -1))
          }
        } else if (hasMultiSelection) {
          deleteMultiSelected()
        } else if (selectedLine) {
          saveToHistory()
          deleteLine(selectedLine)
        } else if (selectedDoor) {
          saveToHistory()
          deleteDoor(selectedDoor)
        } else if (selectedWindow) {
          saveToHistory()
          deleteWindow(selectedWindow)
        } else if (selectedArea) {
          saveToHistory()
          deleteArea(selectedArea)
        } else if (selectedStair) {
          saveToHistory()
          setCurrentStairs(currentStairs.filter(s => s.id !== selectedStair))
          setSelectedStair(null)
        } else if (selectedBoundary) {
          saveToHistory()
          setCurrentBoundaries(currentBoundaries.filter(b => b.id !== selectedBoundary))
          setSelectedBoundary(null)
        } else if (selectedFurniture) {
          saveToHistory()
          setCurrentFurniture(currentFurniture.filter(f => f.id !== selectedFurniture))
          setSelectedFurniture(null)
        }
      }
      // Escape = Deselect (or cancel driveway tracing)
      else if (e.key === 'Escape') {
        // If tracing driveway, cancel it
        if (tracingDriveway) {
          setTracingDriveway(null)
          return
        }
        setSelectedLine(null)
        setSelectedArea(null)
        setSelectedDoor(null)
        setSelectedWindow(null)
        setMultiSelected({ lines: [], doors: [], windows: [] })
        setTool('select')
        setMultiSelect([])
      }
      // Ctrl/Cmd + A = Select all
      else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        setMultiSelected({
          lines: currentLines.map(l => l.id),
          doors: currentDoors.map(d => d.id),
          windows: currentWindows.map(w => w.id)
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedLine, selectedDoor, selectedWindow, selectedArea, selectedStair, selectedBoundary, selectedFurniture, clipboard, history, historyIndex, currentLines, currentDoors, currentWindows, currentStairs, currentBoundaries, currentFurniture, multiSelected, hasMultiSelection, tracingDriveway])

  // Fetch parcel data from Wake County GIS
  const fetchParcelData = async () => {
    if (!address) return

    setFetchingParcel(true)
    setParcelError(null)

    try {
      // Extract street number and name from address for query
      // Address format: "1700 Midwood Dr, Raleigh, NC"
      const addressParts = address.split(',')[0].trim().toUpperCase()

      // Query Wake County GIS REST API
      const baseUrl = 'https://maps.wakegov.com/arcgis/rest/services/Property/Parcels/MapServer/0/query'
      const params = new URLSearchParams({
        where: `SITE_ADDRESS LIKE '%${addressParts}%'`,
        outFields: 'PIN_NUM,SITE_ADDRESS,ADDR1,CITY,ZIPNUM,LAND_VAL,BLDG_VAL,TOTAL_VALUE_ASSD,DEED_ACRES,YEAR_BUILT',
        returnGeometry: 'true',
        outSR: '102719', // NC State Plane NAD83 (feet)
        f: 'json'
      })

      const response = await fetch(`${baseUrl}?${params}`)
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const geometry = feature.geometry
        const attributes = feature.attributes

        // Convert rings to lot boundary points
        // The geometry is in NC State Plane feet coordinates
        // We need to normalize to canvas coordinates (relative to first point)
        if (geometry && geometry.rings && geometry.rings[0]) {
          const ring = geometry.rings[0]

          // Find bounding box
          const xs = ring.map(p => p[0])
          const ys = ring.map(p => p[1])
          const minX = Math.min(...xs)
          const minY = Math.min(...ys)
          const maxX = Math.max(...xs)
          const maxY = Math.max(...ys)

          // Calculate dimensions in feet
          const width = Math.round(maxX - minX)
          const depth = Math.round(maxY - minY)

          // Convert to relative coordinates (0,0 at top-left)
          // Note: Y is inverted because GIS has Y increasing upward, canvas has Y increasing downward
          const boundary = ring.map(point => ({
            x: Math.round(point[0] - minX),
            y: Math.round(maxY - point[1]) // Flip Y axis
          }))

          setLotBoundary(boundary)
          setLotWidth(width)
          setLotDepth(depth)
          setParcelData({
            pin: attributes.PIN_NUM,
            address: attributes.SITE_ADDRESS || attributes.ADDR1,
            city: attributes.CITY,
            zip: attributes.ZIPNUM,
            acres: attributes.DEED_ACRES,
            landValue: attributes.LAND_VAL,
            buildingValue: attributes.BLDG_VAL,
            totalValue: attributes.TOTAL_VALUE_ASSD,
            yearBuilt: attributes.YEAR_BUILT,
            // Store NC State Plane coordinates for fetching nearby features
            ncspMinX: minX,
            ncspMinY: minY,
            ncspMaxX: maxX,
            ncspMaxY: maxY
          })

          // Auto-zoom to fit the lot in the viewport
          // Estimate viewport size (typical canvas area is about 800x600 visible)
          const viewportWidth = 900
          const viewportHeight = 600
          const lotPixelWidth = (width + 40) * SCALE
          const lotPixelHeight = (depth + 40) * SCALE
          const fitZoom = Math.min(
            viewportWidth / lotPixelWidth,
            viewportHeight / lotPixelHeight,
            1 // Don't zoom in more than 100%
          )
          setZoom(Math.max(0.25, Math.min(1, fitZoom))) // Clamp between 25% and 100%
        }
      } else {
        setParcelError('No parcel found for this address. Try a different format.')
      }
    } catch (error) {
      console.error('Error fetching parcel data:', error)
      setParcelError('Failed to fetch parcel data. Check your connection.')
    } finally {
      setFetchingParcel(false)
    }
  }

  // Fetch surrounding features from Wake County GIS (streets, buildings)
  const fetchSurroundings = async () => {
    if (!parcelData || !parcelData.ncspMinX) {
      alert('Please fetch parcel data first (from Lot Setup)')
      return
    }

    setFetchingSurroundings(true)

    try {
      // Add 200 foot buffer around parcel for nearby features
      const buffer = 200
      const minX = parcelData.ncspMinX - buffer
      const minY = parcelData.ncspMinY - buffer
      const maxX = parcelData.ncspMaxX + buffer
      const maxY = parcelData.ncspMaxY + buffer

      // Create envelope geometry for spatial query
      const envelope = {
        xmin: minX,
        ymin: minY,
        xmax: maxX,
        ymax: maxY,
        spatialReference: { wkid: 102719 }
      }

      // Fetch streets
      const streetsUrl = 'https://maps.wakegov.com/arcgis/rest/services/Transportation/Transportation/MapServer/1/query'
      const streetsParams = new URLSearchParams({
        geometry: JSON.stringify(envelope),
        geometryType: 'esriGeometryEnvelope',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'CARTONAME,CLASSNAME',
        returnGeometry: 'true',
        outSR: '102719',
        f: 'json'
      })

      const streetsResponse = await fetch(`${streetsUrl}?${streetsParams}`)
      const streetsData = await streetsResponse.json()

      // Convert street polylines to canvas coordinates
      const convertedStreets = []
      if (streetsData.features) {
        streetsData.features.forEach((feature, i) => {
          if (feature.geometry && feature.geometry.paths) {
            feature.geometry.paths.forEach((path, pathIndex) => {
              const points = path.map(point => ({
                x: Math.round(point[0] - parcelData.ncspMinX),
                y: Math.round(parcelData.ncspMaxY - point[1]) // Flip Y axis
              }))
              convertedStreets.push({
                id: Date.now() + i * 100 + pathIndex,
                name: feature.attributes.CARTONAME || 'Unknown',
                type: feature.attributes.CLASSNAME || 'Street',
                points: points,
                width: feature.attributes.CLASSNAME === 'Interstate' ? 80 :
                       feature.attributes.CLASSNAME === 'State Road' ? 50 : 30,
                source: 'gis'
              })
            })
          }
        })
      }
      setStreets(convertedStreets)

      // Fetch building footprints
      const buildingsUrl = 'https://services.arcgis.com/v400IkDOw1ad7Yad/ArcGIS/rest/services/Building_Footprints/FeatureServer/0/query'
      const buildingsParams = new URLSearchParams({
        geometry: JSON.stringify(envelope),
        geometryType: 'esriGeometryEnvelope',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'DESCRIPTION,SUBTYPE',
        returnGeometry: 'true',
        outSR: '102719',
        f: 'json'
      })

      const buildingsResponse = await fetch(`${buildingsUrl}?${buildingsParams}`)
      const buildingsData = await buildingsResponse.json()

      // Convert building polygons to canvas coordinates
      const convertedBuildings = []
      if (buildingsData.features) {
        buildingsData.features.forEach((feature, i) => {
          if (feature.geometry && feature.geometry.rings) {
            feature.geometry.rings.forEach((ring, ringIndex) => {
              const points = ring.map(point => ({
                x: Math.round(point[0] - parcelData.ncspMinX),
                y: Math.round(parcelData.ncspMaxY - point[1]) // Flip Y axis
              }))
              convertedBuildings.push({
                id: Date.now() + 10000 + i * 100 + ringIndex,
                points: points,
                description: feature.attributes.DESCRIPTION || 'Building',
                subtype: feature.attributes.SUBTYPE || '',
                source: 'gis'
              })
            })
          }
        })
      }
      setNearbyBuildings(convertedBuildings)

      console.log(`Fetched ${convertedStreets.length} streets and ${convertedBuildings.length} buildings`)
    } catch (error) {
      console.error('Error fetching surroundings:', error)
      alert('Failed to fetch surroundings data. Check console for details.')
    } finally {
      setFetchingSurroundings(false)
    }
  }

  // Handle aerial image file upload
  const handleAerialUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setAerialImage(url)
    }
  }

  // Add point to lot boundary
  const addLotPoint = (pos) => {
    setLotBoundary([...lotBoundary, { x: pos.x, y: pos.y }])
  }

  // Complete lot tracing
  const completeLotBoundary = () => {
    setIsTracingLot(false)
    if (lotBoundary.length >= 3) {
      // Calculate lot dimensions from boundary
      const xs = lotBoundary.map(p => p.x)
      const ys = lotBoundary.map(p => p.y)
      const width = Math.max(...xs) - Math.min(...xs)
      const depth = Math.max(...ys) - Math.min(...ys)
      setLotWidth(Math.round(width))
      setLotDepth(Math.round(depth))
    }
  }

  // Clear lot boundary
  const clearLotBoundary = () => {
    setLotBoundary([])
  }

  // Load ADU template
  const loadTemplate = (templateId) => {
    const template = ADU_TEMPLATES[templateId]
    if (!template) return

    setSelectedTemplate(templateId)
    setAduFootprint(template.footprint)

    // Deep copy lines and areas with new IDs
    const now = Date.now()
    const floor0Lines = template.floors[0].lines.map((l, i) => ({ ...l, id: now + i }))
    const floor1Lines = template.floors[1].lines.map((l, i) => ({ ...l, id: now + 100 + i }))

    const floor0Areas = template.floors[0].areas.map((a, i) => ({ ...a, id: now + 200 + i }))
    const floor1Areas = template.floors[1].areas.map((a, i) => ({ ...a, id: now + 300 + i }))

    setAduLines({ 0: floor0Lines, 1: floor1Lines })
    setAduAreas({ 0: floor0Areas, 1: floor1Areas })
    setSelectedLine(null)
    setSelectedArea(null)
    setMultiSelect([])
  }

  const mouseToGrid = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: snap((e.clientX - rect.left) / (SCALE * zoom) - OFFSET_X / SCALE),
      y: snap((e.clientY - rect.top) / (SCALE * zoom) - OFFSET_Y / SCALE)
    }
  }

  // Zoom controls - allow down to 15% for large lots
  const handleZoom = (delta) => {
    setZoom(z => Math.min(3, Math.max(0.15, z + delta)))
  }

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      handleZoom(delta)
    }
  }

  // Reset view - auto-fit to actual content
  const resetView = () => {
    const viewportWidth = window.innerWidth - 520 // Account for sidebars
    const viewportHeight = window.innerHeight - 150 // Account for header and controls

    // Calculate bounding box of all content
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    // Check current lines (walls)
    const allLines = mode === 'main' ? lines : mode === 'adu' ? [...aduLines[0], ...aduLines[1]] : [...lines, ...aduLines[0], ...aduLines[1]]
    allLines.forEach(line => {
      minX = Math.min(minX, line.x1, line.x2)
      maxX = Math.max(maxX, line.x1, line.x2)
      minY = Math.min(minY, line.y1, line.y2)
      maxY = Math.max(maxY, line.y1, line.y2)
    })

    // Check lot boundary
    lotBoundary.forEach(point => {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    })

    // If no content, use lot dimensions
    if (minX === Infinity) {
      minX = 0; minY = 0
      maxX = lotWidth || 100
      maxY = lotDepth || 100
    }

    // Add padding
    const padding = 20
    const contentWidth = (maxX - minX + padding * 2) * SCALE + OFFSET_X * 2
    const contentHeight = (maxY - minY + padding * 2) * SCALE + OFFSET_Y * 2

    const fitZoom = Math.min(
      viewportWidth / contentWidth,
      viewportHeight / contentHeight,
      2 // Allow up to 200% for small designs
    )
    setZoom(Math.max(0.15, fitZoom))
  }

  const handleMouseDown = (e) => {
    if (e.target !== canvasRef.current && !e.target.classList.contains('canvas') && e.target.tagName !== 'svg') return
    const pos = mouseToGrid(e)

    // Lot tracing mode
    if (mode === 'lot' && isTracingLot) {
      addLotPoint(pos)
      return
    }

    // Surroundings mode tools
    if (mode === 'surroundings') {
      if (surroundingsTool === 'tree') {
        const newTree = { id: Date.now(), x: pos.x, y: pos.y, size: 'medium' }
        setTrees([...trees, newTree])
        setSelectedTree(newTree.id)
        return
      } else if (surroundingsTool === 'bush') {
        const newBush = { id: Date.now(), x: pos.x, y: pos.y, size: 'small' }
        setBushes([...bushes, newBush])
        setSelectedBush(newBush.id)
        return
      } else if (surroundingsTool === 'fence') {
        // Start drawing fence line
        setDrawing({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, type: 'fence' })
        return
      } else if (surroundingsTool === 'driveway') {
        // Add point to driveway trace
        if (!tracingDriveway) {
          setTracingDriveway([{ x: pos.x, y: pos.y }])
        } else {
          setTracingDriveway([...tracingDriveway, { x: pos.x, y: pos.y }])
        }
        return
      } else if (surroundingsTool === 'select') {
        // Clear surroundings selections on canvas click
        setSelectedTree(null)
        setSelectedBush(null)
        setSelectedFence(null)
        setSelectedDriveway(null)
        setSelectedStreet(null)
        setSelectedBuilding(null)
        return
      }
    }

    if (tool === 'draw') {
      setDrawing({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, type: tool })
    } else if (tool === 'boundary') {
      setDrawing({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, type: 'boundary' })
    } else if (tool === 'select') {
      // Start selection box for marquee select
      if (!e.shiftKey) {
        setMultiSelected({ lines: [], doors: [], windows: [] })
      }
      setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y })
      setSelectedLine(null)
      setSelectedArea(null)
      setSelectedDoor(null)
      setSelectedWindow(null)
    } else if (tool === 'door') {
      saveToHistory()
      // Single click to place door with default 3ft width
      const defaultWidth = 3

      // Try to snap to horizontal wall first, then vertical
      let snapH = findSnapToWall(pos.x, pos.y, defaultWidth, 'horizontal')
      let snapV = findSnapToWall(pos.x, pos.y, defaultWidth, 'vertical')

      let finalX = pos.x, finalY = pos.y, orientation = 'horizontal'

      if (snapH) {
        finalX = snapH.x
        finalY = snapH.y
        orientation = 'horizontal'
      } else if (snapV) {
        finalX = snapV.x
        finalY = snapV.y
        orientation = 'vertical'
      }

      const newDoor = {
        id: Date.now(),
        x: finalX,
        y: finalY,
        width: defaultWidth,
        orientation,
        swing: doorSwing
      }
      setCurrentDoors([...currentDoors, newDoor])
      setSelectedDoor(newDoor.id)
      setSelectedLine(null)
      setSelectedArea(null)
      setSelectedWindow(null)
    } else if (tool === 'window') {
      saveToHistory()
      // Single click to place window with default 3ft width
      const defaultWidth = 3

      // Try to snap to horizontal wall first, then vertical
      let snapH = findSnapToWall(pos.x, pos.y, defaultWidth, 'horizontal')
      let snapV = findSnapToWall(pos.x, pos.y, defaultWidth, 'vertical')

      let finalX = pos.x, finalY = pos.y, orientation = 'horizontal'

      if (snapH) {
        finalX = snapH.x
        finalY = snapH.y
        orientation = 'horizontal'
      } else if (snapV) {
        finalX = snapV.x
        finalY = snapV.y
        orientation = 'vertical'
      }

      const newWindow = {
        id: Date.now(),
        x: finalX,
        y: finalY,
        width: defaultWidth,
        orientation
      }
      setCurrentWindows([...currentWindows, newWindow])
      setSelectedWindow(newWindow.id)
      setSelectedLine(null)
      setSelectedArea(null)
      setSelectedDoor(null)
    } else if (tool === 'select' || tool === 'area') {
      if (!e.shiftKey) {
        setSelectedLine(null)
        setSelectedArea(null)
        setSelectedDoor(null)
        setSelectedWindow(null)
        setSelectedStair(null)
        setSelectedBoundary(null)
        setSelectedFurniture(null)
        if (tool === 'area') setMultiSelect([])
      }
    }
  }

  const handleMouseMove = (e) => {
    const pos = mouseToGrid(e)
    if (drawing) setDrawing({ ...drawing, x2: pos.x, y2: pos.y })
    if (selectionBox) setSelectionBox({ ...selectionBox, x2: pos.x, y2: pos.y })
    if (dragging) {
      if (dragging.type === 'line') {
        const dx = pos.x - dragging.startPos.x
        const dy = pos.y - dragging.startPos.y
        setCurrentLines(currentLines.map(l => l.id === dragging.id ? {
          ...l,
          x1: snap(dragging.origLine.x1 + dx),
          y1: snap(dragging.origLine.y1 + dy),
          x2: snap(dragging.origLine.x2 + dx),
          y2: snap(dragging.origLine.y2 + dy)
        } : l))
      } else if (dragging.type === 'point') {
        setCurrentLines(currentLines.map(l => l.id === dragging.id ? {
          ...l,
          [dragging.point === 1 ? 'x1' : 'x2']: pos.x,
          [dragging.point === 1 ? 'y1' : 'y2']: pos.y
        } : l))
      } else if (dragging.type === 'door') {
        const dx = pos.x - dragging.startPos.x
        const dy = pos.y - dragging.startPos.y
        setCurrentDoors(currentDoors.map(d => d.id === dragging.id ? {
          ...d,
          x: snap(dragging.origItem.x + dx),
          y: snap(dragging.origItem.y + dy)
        } : d))
      } else if (dragging.type === 'window') {
        const dx = pos.x - dragging.startPos.x
        const dy = pos.y - dragging.startPos.y
        setCurrentWindows(currentWindows.map(w => w.id === dragging.id ? {
          ...w,
          x: snap(dragging.origItem.x + dx),
          y: snap(dragging.origItem.y + dy)
        } : w))
      } else if (dragging.type === 'tree') {
        const dx = pos.x - dragging.startPos.x
        const dy = pos.y - dragging.startPos.y
        setTrees(trees.map(t => t.id === dragging.id ? {
          ...t,
          x: snap(dragging.origItem.x + dx),
          y: snap(dragging.origItem.y + dy)
        } : t))
      } else if (dragging.type === 'bush') {
        const dx = pos.x - dragging.startPos.x
        const dy = pos.y - dragging.startPos.y
        setBushes(bushes.map(b => b.id === dragging.id ? {
          ...b,
          x: snap(dragging.origItem.x + dx),
          y: snap(dragging.origItem.y + dy)
        } : b))
      } else if (dragging.type === 'fence') {
        // Move entire fence
        const dx = pos.x - dragging.startPos.x
        const dy = pos.y - dragging.startPos.y
        setFences(fences.map(f => f.id === dragging.id ? {
          ...f,
          x1: snap(dragging.origFence.x1 + dx),
          y1: snap(dragging.origFence.y1 + dy),
          x2: snap(dragging.origFence.x2 + dx),
          y2: snap(dragging.origFence.y2 + dy)
        } : f))
      } else if (dragging.type === 'fence-point') {
        // Move fence endpoint
        setFences(fences.map(f => f.id === dragging.id ? {
          ...f,
          [dragging.point === 1 ? 'x1' : 'x2']: pos.x,
          [dragging.point === 1 ? 'y1' : 'y2']: pos.y
        } : f))
      } else if (dragging.type === 'structure') {
        // Move entire structure in integrate mode
        const dx = pos.x - dragging.startPos.x
        const dy = pos.y - dragging.startPos.y
        if (dragging.structure === 'house') {
          setHousePosition({
            x: snap(dragging.origPos.x + dx),
            y: snap(dragging.origPos.y + dy)
          })
        } else if (dragging.structure === 'adu') {
          setAduPosition({
            x: snap(dragging.origPos.x + dx),
            y: snap(dragging.origPos.y + dy)
          })
        }
      } else if (dragging.type === 'amenity') {
        // Move amenity in integrate mode
        const dx = pos.x - dragging.startPos.x
        const dy = pos.y - dragging.startPos.y
        setAmenities(amenities.map(a => a.id === dragging.id ? {
          ...a,
          x: snap(dragging.origPos.x + dx),
          y: snap(dragging.origPos.y + dy)
        } : a))
      } else if (dragging.type === 'stair') {
        // Move stair
        const dx = pos.x - dragging.startPos.x
        const dy = pos.y - dragging.startPos.y
        setCurrentStairs(currentStairs.map(s => s.id === dragging.id ? {
          ...s,
          x: snap(dragging.origItem.x + dx),
          y: snap(dragging.origItem.y + dy)
        } : s))
      } else if (dragging.type === 'boundary') {
        // Move entire boundary
        const dx = pos.x - dragging.startPos.x
        const dy = pos.y - dragging.startPos.y
        setCurrentBoundaries(currentBoundaries.map(b => b.id === dragging.id ? {
          ...b,
          x1: snap(dragging.origItem.x1 + dx),
          y1: snap(dragging.origItem.y1 + dy),
          x2: snap(dragging.origItem.x2 + dx),
          y2: snap(dragging.origItem.y2 + dy)
        } : b))
      } else if (dragging.type === 'boundary-point') {
        // Move boundary endpoint
        setCurrentBoundaries(currentBoundaries.map(b => b.id === dragging.id ? {
          ...b,
          [dragging.point === 1 ? 'x1' : 'x2']: pos.x,
          [dragging.point === 1 ? 'y1' : 'y2']: pos.y
        } : b))
      } else if (dragging.type === 'furniture') {
        // Move furniture
        const dx = pos.x - dragging.startPos.x
        const dy = pos.y - dragging.startPos.y
        setCurrentFurniture(currentFurniture.map(f => f.id === dragging.id ? {
          ...f,
          x: snap(dragging.origItem.x + dx),
          y: snap(dragging.origItem.y + dy)
        } : f))
      } else if (dragging.type === 'multi') {
        // Move all multi-selected items together
        const dx = pos.x - dragging.startPos.x
        const dy = pos.y - dragging.startPos.y

        // Move lines
        if (dragging.origItems.lines.length > 0) {
          setCurrentLines(currentLines.map(l => {
            const orig = dragging.origItems.lines.find(ol => ol.id === l.id)
            if (orig) {
              return {
                ...l,
                x1: snap(orig.x1 + dx),
                y1: snap(orig.y1 + dy),
                x2: snap(orig.x2 + dx),
                y2: snap(orig.y2 + dy)
              }
            }
            return l
          }))
        }

        // Move doors
        if (dragging.origItems.doors.length > 0) {
          setCurrentDoors(currentDoors.map(d => {
            const orig = dragging.origItems.doors.find(od => od.id === d.id)
            if (orig) {
              return { ...d, x: snap(orig.x + dx), y: snap(orig.y + dy) }
            }
            return d
          }))
        }

        // Move windows
        if (dragging.origItems.windows.length > 0) {
          setCurrentWindows(currentWindows.map(w => {
            const orig = dragging.origItems.windows.find(ow => ow.id === w.id)
            if (orig) {
              return { ...w, x: snap(orig.x + dx), y: snap(orig.y + dy) }
            }
            return w
          }))
        }
      }
    }
  }

  const handleMouseUp = () => {
    if (drawing) {
      const dx = Math.abs(drawing.x2 - drawing.x1)
      const dy = Math.abs(drawing.y2 - drawing.y1)
      if (dx > 0.1 || dy > 0.1) {
        let { x1, y1, x2, y2 } = drawing
        if (dx < 1 && dy > dx) x2 = x1
        if (dy < 1 && dx > dy) y2 = y1

        if (drawing.type === 'fence') {
          // Create a fence
          const newFence = { id: Date.now(), x1, y1, x2: snap(x2), y2: snap(y2), style: 'wood' }
          setFences([...fences, newFence])
          setSelectedFence(newFence.id)
        } else if (drawing.type === 'boundary') {
          // Create an artificial boundary
          saveToHistory()
          const newBoundary = { id: Date.now(), x1, y1, x2: snap(x2), y2: snap(y2), label: 'Open Area' }
          setCurrentBoundaries([...currentBoundaries, newBoundary])
          setSelectedBoundary(newBoundary.id)
        } else {
          // Create a wall
          saveToHistory()
          const newLine = { id: Date.now(), x1, y1, x2: snap(x2), y2: snap(y2) }
          setCurrentLines([...currentLines, newLine])
          setSelectedLine(newLine.id)
        }
      }
      setDrawing(null)
    }

    // Handle selection box
    if (selectionBox) {
      const minX = Math.min(selectionBox.x1, selectionBox.x2)
      const maxX = Math.max(selectionBox.x1, selectionBox.x2)
      const minY = Math.min(selectionBox.y1, selectionBox.y2)
      const maxY = Math.max(selectionBox.y1, selectionBox.y2)

      // Only select if box is big enough (not just a click)
      if (maxX - minX > 0.5 || maxY - minY > 0.5) {
        // Find lines in selection box
        const selectedLines = currentLines.filter(line => {
          const lMinX = Math.min(line.x1, line.x2)
          const lMaxX = Math.max(line.x1, line.x2)
          const lMinY = Math.min(line.y1, line.y2)
          const lMaxY = Math.max(line.y1, line.y2)
          return lMinX >= minX && lMaxX <= maxX && lMinY >= minY && lMaxY <= maxY
        }).map(l => l.id)

        // Find doors in selection box
        const selectedDoors = currentDoors.filter(door => {
          const dMinX = door.x
          const dMaxX = door.orientation === 'horizontal' ? door.x + door.width : door.x
          const dMinY = door.y
          const dMaxY = door.orientation === 'vertical' ? door.y + door.width : door.y
          return dMinX >= minX && Math.max(dMinX, dMaxX) <= maxX && dMinY >= minY && Math.max(dMinY, dMaxY) <= maxY
        }).map(d => d.id)

        // Find windows in selection box
        const selectedWindows = currentWindows.filter(win => {
          const wMinX = win.x
          const wMaxX = win.orientation === 'horizontal' ? win.x + win.width : win.x
          const wMinY = win.y
          const wMaxY = win.orientation === 'vertical' ? win.y + win.width : win.y
          return wMinX >= minX && Math.max(wMinX, wMaxX) <= maxX && wMinY >= minY && Math.max(wMinY, wMaxY) <= maxY
        }).map(w => w.id)

        setMultiSelected({
          lines: [...multiSelected.lines, ...selectedLines],
          doors: [...multiSelected.doors, ...selectedDoors],
          windows: [...multiSelected.windows, ...selectedWindows]
        })
      }
      setSelectionBox(null)
    }

    setDragging(null)
  }

  // Snap selected door/window to nearest wall center
  const snapToWallCenter = () => {
    if (selectedDoor) {
      const door = currentDoors.find(d => d.id === selectedDoor)
      if (door) {
        const snap = findSnapToWall(door.x, door.y, door.width, door.orientation)
        if (snap) {
          saveToHistory()
          setCurrentDoors(currentDoors.map(d => d.id === selectedDoor ? { ...d, x: snap.x, y: snap.y } : d))
        }
      }
    } else if (selectedWindow) {
      const win = currentWindows.find(w => w.id === selectedWindow)
      if (win) {
        const snap = findSnapToWall(win.x, win.y, win.width, win.orientation)
        if (snap) {
          saveToHistory()
          setCurrentWindows(currentWindows.map(w => w.id === selectedWindow ? { ...w, x: snap.x, y: snap.y } : w))
        }
      }
    }
  }

  const handleLineClick = (e, line) => {
    e.stopPropagation()
    if (tool === 'area') {
      setMultiSelect(prev =>
        prev.includes(line.id)
          ? prev.filter(id => id !== line.id)
          : [...prev, line.id]
      )
    } else if (tool === 'select') {
      const pos = mouseToGrid(e)

      if (e.shiftKey) {
        // Add/remove from multi-selection
        setMultiSelected(prev => ({
          ...prev,
          lines: prev.lines.includes(line.id)
            ? prev.lines.filter(id => id !== line.id)
            : [...prev.lines, line.id]
        }))
      } else {
        // Check if clicking on already multi-selected item to start group drag
        const isInMultiSelect = multiSelected.lines.includes(line.id)
        if (isInMultiSelect && (multiSelected.lines.length + multiSelected.doors.length + multiSelected.windows.length) > 1) {
          // Start dragging the group
          setDragging({ type: 'multi', startPos: pos, origItems: {
            lines: currentLines.filter(l => multiSelected.lines.includes(l.id)).map(l => ({ ...l })),
            doors: currentDoors.filter(d => multiSelected.doors.includes(d.id)).map(d => ({ ...d })),
            windows: currentWindows.filter(w => multiSelected.windows.includes(w.id)).map(w => ({ ...w }))
          }})
        } else {
          // Single select
          setMultiSelected({ lines: [], doors: [], windows: [] })
          setSelectedLine(line.id)
          setSelectedArea(null)
          setSelectedDoor(null)
          setSelectedWindow(null)
          setDragging({ type: 'line', id: line.id, startPos: pos, origLine: { ...line } })
        }
      }
    }
  }

  const handlePointMouseDown = (e, line, point) => {
    e.stopPropagation()
    if (tool === 'select') {
      setSelectedLine(line.id)
      setDragging({ type: 'point', id: line.id, point })
    }
  }

  const createArea = () => {
    if (multiSelect.length < 3) {
      alert('Select at least 3 walls to define an area')
      return
    }
    const newArea = {
      id: Date.now(),
      name: newAreaName,
      lineIds: [...multiSelect],
      color: `hsl(${Math.random() * 360}, 50%, 40%)`
    }
    setCurrentAreas([...currentAreas, newArea])
    setMultiSelect([])
    setNewAreaName('Room ' + (currentAreas.length + 2))
    setTool('select')
  }

  const getAreaSqFt = (area, linesArr = currentLines) => {
    const areaLines = linesArr.filter(l => area.lineIds.includes(l.id))
    if (areaLines.length < 3) return 0

    const points = []
    areaLines.forEach(l => {
      const p1 = { x: l.x1, y: l.y1 }
      const p2 = { x: l.x2, y: l.y2 }
      if (!points.find(p => p.x === p1.x && p.y === p1.y)) points.push(p1)
      if (!points.find(p => p.x === p2.x && p.y === p2.y)) points.push(p2)
    })

    const cx = points.reduce((s, p) => s + p.x, 0) / points.length
    const cy = points.reduce((s, p) => s + p.y, 0) / points.length
    points.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx))

    return calculatePolygonArea(points)
  }

  // Cost Estimator - Raleigh, NC pricing (2024-2025)
  const calculateProjectCost = () => {
    const costs = {
      // Raleigh, NC construction costs per square foot
      basePerSqFt: 185, // Mid-range new construction
      highEndPerSqFt: 275, // High-end finishes

      // Per-unit costs
      bathroomBase: 18000, // Average bathroom
      bathroomPrimary: 28000, // Primary/master bath
      kitchenBase: 35000, // Standard kitchen
      kitchenHighEnd: 65000, // High-end kitchen
      windowCost: 550, // Per window installed
      exteriorDoorCost: 1800, // Entry doors
      interiorDoorCost: 350, // Interior doors

      // ADU costs (slightly higher per sqft due to scale)
      aduPerSqFt: 225,

      // Outdoor amenities
      poolInground: 55000,
      poolAboveground: 8000,
      hotTub: 9000,
      sauna: 12000,
      deck: 35, // Per sq ft
      patio: 18, // Per sq ft
      porch: 45, // Per sq ft (covered, with roof)
      firepit: 3500,
      pergola: 8000,
      outdoorKitchen: 15000,
      shed: 4500,
      greenhouse: 6000,
      fence: 28, // Per linear foot
      driveway: 12, // Per sq ft

      // Soft costs (permits, design, etc.) - percentage
      softCostPercent: 0.15,
      contingencyPercent: 0.10
    }

    let breakdown = []
    let subtotal = 0

    // Main House
    const mainSqFt = areas.reduce((sum, a) => sum + getAreaSqFt(a, lines), 0)
    if (mainSqFt > 0) {
      const mainCost = mainSqFt * costs.basePerSqFt
      breakdown.push({ label: `Main House (${mainSqFt.toFixed(0)} SF)`, cost: mainCost, category: 'structure' })
      subtotal += mainCost
    }

    // Count bathrooms and kitchen from room names
    const bathroomCount = areas.filter(a =>
      a.name.toLowerCase().includes('bath') ||
      a.name.toLowerCase().includes('powder')
    ).length
    const hasPrimaryBath = areas.some(a =>
      a.name.toLowerCase().includes('primary') ||
      a.name.toLowerCase().includes('master')
    )
    const hasKitchen = areas.some(a => a.name.toLowerCase().includes('kitchen'))

    if (bathroomCount > 0) {
      const bathCost = (hasPrimaryBath ? costs.bathroomPrimary : 0) +
                       (Math.max(0, bathroomCount - (hasPrimaryBath ? 1 : 0)) * costs.bathroomBase)
      breakdown.push({ label: `Bathrooms (${bathroomCount})`, cost: bathCost, category: 'interior' })
      subtotal += bathCost
    }

    if (hasKitchen) {
      breakdown.push({ label: 'Kitchen', cost: costs.kitchenBase, category: 'interior' })
      subtotal += costs.kitchenBase
    }

    // Doors & Windows
    if (doors.length > 0) {
      // Assume 20% are exterior doors
      const exteriorDoors = Math.max(1, Math.floor(doors.length * 0.2))
      const interiorDoors = doors.length - exteriorDoors
      const doorCost = (exteriorDoors * costs.exteriorDoorCost) + (interiorDoors * costs.interiorDoorCost)
      breakdown.push({ label: `Doors (${doors.length})`, cost: doorCost, category: 'interior' })
      subtotal += doorCost
    }

    if (windows.length > 0) {
      const windowCost = windows.length * costs.windowCost
      breakdown.push({ label: `Windows (${windows.length})`, cost: windowCost, category: 'interior' })
      subtotal += windowCost
    }

    // ADU
    const aduSqFt = [...aduAreas[0], ...aduAreas[1]].reduce((sum, a) =>
      sum + getAreaSqFt(a, [...aduLines[0], ...aduLines[1]]), 0)
    if (aduSqFt > 0) {
      const aduCost = aduSqFt * costs.aduPerSqFt
      breakdown.push({ label: `ADU (${aduSqFt.toFixed(0)} SF)`, cost: aduCost, category: 'structure' })
      subtotal += aduCost

      // ADU doors & windows
      const aduDoorCount = aduDoors[0].length + aduDoors[1].length
      const aduWindowCount = aduWindows[0].length + aduWindows[1].length
      if (aduDoorCount > 0) {
        const aduDoorCost = costs.exteriorDoorCost + ((aduDoorCount - 1) * costs.interiorDoorCost)
        breakdown.push({ label: `ADU Doors (${aduDoorCount})`, cost: aduDoorCost, category: 'interior' })
        subtotal += aduDoorCost
      }
      if (aduWindowCount > 0) {
        const aduWindowCost = aduWindowCount * costs.windowCost
        breakdown.push({ label: `ADU Windows (${aduWindowCount})`, cost: aduWindowCost, category: 'interior' })
        subtotal += aduWindowCost
      }
    }

    // Outdoor Amenities
    amenities.forEach(amenity => {
      let amenityCost = 0
      const sqft = amenity.width * amenity.height
      const type = amenity.type || ''
      if (type.includes('pool')) {
        amenityCost = costs.poolInground
      } else if (type.includes('hot-tub')) {
        amenityCost = costs.hotTub
      } else if (type.includes('sauna')) {
        amenityCost = costs.sauna
      } else if (type.includes('porch')) {
        amenityCost = sqft * costs.porch
      } else if (type.includes('deck')) {
        amenityCost = sqft * costs.deck
      } else if (type.includes('patio')) {
        amenityCost = sqft * costs.patio
      } else if (type.includes('fire-pit') || type.includes('firepit')) {
        amenityCost = costs.firepit
      } else if (type.includes('pergola')) {
        amenityCost = costs.pergola
      } else if (type.includes('gazebo')) {
        amenityCost = costs.pergola * 1.2
      } else if (type.includes('outdoor-kitchen')) {
        amenityCost = costs.outdoorKitchen
      } else if (type.includes('shed')) {
        amenityCost = costs.shed
      } else if (type.includes('greenhouse')) {
        amenityCost = costs.greenhouse
      } else if (type.includes('tennis')) {
        amenityCost = 45000
      } else if (type.includes('basketball')) {
        amenityCost = 12000
      } else {
        amenityCost = 2000
      }
      breakdown.push({ label: amenity.name || amenity.type, cost: amenityCost, category: 'outdoor' })
      subtotal += amenityCost
    })

    // Fencing
    const totalFenceLength = fences.reduce((sum, f) => {
      const length = Math.sqrt(Math.pow(f.x2 - f.x1, 2) + Math.pow(f.y2 - f.y1, 2))
      return sum + length
    }, 0)
    if (totalFenceLength > 0) {
      const fenceCost = totalFenceLength * costs.fence
      breakdown.push({ label: `Fencing (${totalFenceLength.toFixed(0)} LF)`, cost: fenceCost, category: 'outdoor' })
      subtotal += fenceCost
    }

    // Driveway
    const totalDrivewayArea = driveways.reduce((sum, d) => {
      if (d.points && d.points.length >= 3) {
        return sum + Math.abs(calculatePolygonArea(d.points))
      }
      return sum
    }, 0)
    if (totalDrivewayArea > 0) {
      const drivewayCost = totalDrivewayArea * costs.driveway
      breakdown.push({ label: `Driveway (${totalDrivewayArea.toFixed(0)} SF)`, cost: drivewayCost, category: 'outdoor' })
      subtotal += drivewayCost
    }

    // Soft costs & contingency
    const softCosts = subtotal * costs.softCostPercent
    const contingency = subtotal * costs.contingencyPercent

    breakdown.push({ label: 'Permits, Design & Fees (15%)', cost: softCosts, category: 'fees' })
    breakdown.push({ label: 'Contingency (10%)', cost: contingency, category: 'fees' })

    const total = subtotal + softCosts + contingency

    return {
      breakdown,
      subtotal,
      softCosts,
      contingency,
      total,
      pricePerSqFt: mainSqFt > 0 ? total / mainSqFt : 0
    }
  }

  const deleteLine = (id) => {
    setCurrentLines(currentLines.filter(l => l.id !== id))
    setCurrentAreas(currentAreas.map(a => ({ ...a, lineIds: a.lineIds.filter(lid => lid !== id) })))
    setSelectedLine(null)
  }

  const deleteArea = (id) => {
    setCurrentAreas(currentAreas.filter(a => a.id !== id))
    setSelectedArea(null)
  }

  const deleteDoor = (id) => {
    setCurrentDoors(currentDoors.filter(d => d.id !== id))
    setSelectedDoor(null)
  }

  const deleteWindow = (id) => {
    setCurrentWindows(currentWindows.filter(w => w.id !== id))
    setSelectedWindow(null)
  }

  const deleteMultiSelected = () => {
    if (multiSelected.lines.length > 0 || multiSelected.doors.length > 0 || multiSelected.windows.length > 0) {
      saveToHistory()
      setCurrentLines(currentLines.filter(l => !multiSelected.lines.includes(l.id)))
      setCurrentDoors(currentDoors.filter(d => !multiSelected.doors.includes(d.id)))
      setCurrentWindows(currentWindows.filter(w => !multiSelected.windows.includes(w.id)))
      // Also update areas that reference deleted lines
      setCurrentAreas(currentAreas.map(a => ({
        ...a,
        lineIds: a.lineIds.filter(lid => !multiSelected.lines.includes(lid))
      })))
      setMultiSelected({ lines: [], doors: [], windows: [] })
    }
  }

  const handleDoorClick = (e, door) => {
    e.stopPropagation()
    if (tool === 'select') {
      const pos = mouseToGrid(e)

      if (e.shiftKey) {
        // Add/remove from multi-selection
        setMultiSelected(prev => ({
          ...prev,
          doors: prev.doors.includes(door.id)
            ? prev.doors.filter(id => id !== door.id)
            : [...prev.doors, door.id]
        }))
      } else {
        const isInMultiSelect = multiSelected.doors.includes(door.id)
        if (isInMultiSelect && (multiSelected.lines.length + multiSelected.doors.length + multiSelected.windows.length) > 1) {
          setDragging({ type: 'multi', startPos: pos, origItems: {
            lines: currentLines.filter(l => multiSelected.lines.includes(l.id)).map(l => ({ ...l })),
            doors: currentDoors.filter(d => multiSelected.doors.includes(d.id)).map(d => ({ ...d })),
            windows: currentWindows.filter(w => multiSelected.windows.includes(w.id)).map(w => ({ ...w }))
          }})
        } else {
          setMultiSelected({ lines: [], doors: [], windows: [] })
          setSelectedDoor(door.id)
          setSelectedLine(null)
          setSelectedArea(null)
          setSelectedWindow(null)
          setDragging({ type: 'door', id: door.id, startPos: pos, origItem: { ...door } })
        }
      }
    }
  }

  const handleWindowClick = (e, win) => {
    e.stopPropagation()
    if (tool === 'select') {
      const pos = mouseToGrid(e)

      if (e.shiftKey) {
        // Add/remove from multi-selection
        setMultiSelected(prev => ({
          ...prev,
          windows: prev.windows.includes(win.id)
            ? prev.windows.filter(id => id !== win.id)
            : [...prev.windows, win.id]
        }))
      } else {
        const isInMultiSelect = multiSelected.windows.includes(win.id)
        if (isInMultiSelect && (multiSelected.lines.length + multiSelected.doors.length + multiSelected.windows.length) > 1) {
          setDragging({ type: 'multi', startPos: pos, origItems: {
            lines: currentLines.filter(l => multiSelected.lines.includes(l.id)).map(l => ({ ...l })),
            doors: currentDoors.filter(d => multiSelected.doors.includes(d.id)).map(d => ({ ...d })),
            windows: currentWindows.filter(w => multiSelected.windows.includes(w.id)).map(w => ({ ...w }))
          }})
        } else {
          setMultiSelected({ lines: [], doors: [], windows: [] })
          setSelectedWindow(win.id)
          setSelectedLine(null)
          setSelectedArea(null)
          setSelectedDoor(null)
          setDragging({ type: 'window', id: win.id, startPos: pos, origItem: { ...win } })
        }
      }
    }
  }

  const handleTreeClick = (e, tree) => {
    e.stopPropagation()
    if (mode === 'surroundings' && surroundingsTool === 'select') {
      const pos = mouseToGrid(e)
      setSelectedTree(tree.id)
      setSelectedBush(null)
      setSelectedFence(null)
      setSelectedDriveway(null)
      setSelectedStreet(null)
      setSelectedBuilding(null)
      setDragging({ type: 'tree', id: tree.id, startPos: pos, origItem: { ...tree } })
    }
  }

  const handleBushClick = (e, bush) => {
    e.stopPropagation()
    if (mode === 'surroundings' && surroundingsTool === 'select') {
      const pos = mouseToGrid(e)
      setSelectedBush(bush.id)
      setSelectedTree(null)
      setSelectedFence(null)
      setSelectedDriveway(null)
      setSelectedStreet(null)
      setSelectedBuilding(null)
      setDragging({ type: 'bush', id: bush.id, startPos: pos, origItem: { ...bush } })
    }
  }

  const handleFenceClick = (e, fence) => {
    e.stopPropagation()
    if (mode === 'surroundings' && surroundingsTool === 'select') {
      const pos = mouseToGrid(e)
      setSelectedFence(fence.id)
      setSelectedTree(null)
      setSelectedBush(null)
      setSelectedDriveway(null)
      setSelectedStreet(null)
      setSelectedBuilding(null)
      setDragging({ type: 'fence', id: fence.id, startPos: pos, origFence: { ...fence } })
    }
  }

  const handleFencePointMouseDown = (e, fence, point) => {
    e.stopPropagation()
    if (mode === 'surroundings' && surroundingsTool === 'select') {
      setSelectedFence(fence.id)
      setDragging({ type: 'fence-point', id: fence.id, point })
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProcessing(true)
      convertImageToLines(URL.createObjectURL(file), blueprintScale, (detectedLines) => {
        if (detectedLines.length > 0) {
          if (currentLines.length === 0 || confirm(`Detected ${detectedLines.length} walls. Replace current?`)) {
            setCurrentLines(detectedLines)
            setCurrentAreas([])
          }
        }
        setProcessing(false)
      })
    }
  }

  const getLineLength = (line) => Math.sqrt((line.x2 - line.x1) ** 2 + (line.y2 - line.y1) ** 2)

  const selectedLineData = currentLines.find(l => l.id === selectedLine)
  const selectedAreaData = currentAreas.find(a => a.id === selectedArea)
  const selectedDoorData = currentDoors.find(d => d.id === selectedDoor)
  const selectedWindowData = currentWindows.find(w => w.id === selectedWindow)
  const totalSqFt = currentAreas.reduce((sum, a) => sum + getAreaSqFt(a), 0)

  // ADU totals
  const aduFloor0SqFt = aduAreas[0].reduce((sum, a) => sum + getAreaSqFt(a, aduLines[0]), 0)
  const aduFloor1SqFt = aduAreas[1].reduce((sum, a) => sum + getAreaSqFt(a, aduLines[1]), 0)
  const aduTotalSqFt = aduFloor0SqFt + aduFloor1SqFt

  // Clear selection when switching modes/floors
  const switchMode = (newMode) => {
    setMode(newMode)
    setSelectedLine(null)
    setSelectedArea(null)
    setMultiSelect([])
    setTool('select')
    // Clear surroundings selections
    setSelectedTree(null)
    setSelectedFence(null)
    setSelectedDriveway(null)
    setSelectedBush(null)
    setSelectedStreet(null)
    setSelectedBuilding(null)
    setSurroundingsTool('select')
    // Clear integration selection
    setSelectedStructure(null)
    setSelectedAmenity(null)
  }

  const switchFloor = (floor) => {
    setAduFloor(floor)
    setSelectedLine(null)
    setSelectedArea(null)
    setMultiSelect([])
  }

  // Export as PNG
  const exportPNG = () => {
    const svg = document.querySelector('.grid-svg')
    if (!svg) return

    const clone = svg.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bg.setAttribute('width', '100%')
    bg.setAttribute('height', '100%')
    bg.setAttribute('fill', '#1e5080')
    clone.insertBefore(bg, clone.firstChild)

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    title.setAttribute('x', '700')
    title.setAttribute('y', '30')
    title.setAttribute('fill', '#e8f4fc')
    title.setAttribute('font-size', '18')
    title.setAttribute('font-family', 'Courier New')
    title.setAttribute('text-anchor', 'middle')
    title.textContent = mode === 'main'
      ? '1700 Midwood Dr, Raleigh NC - Main House'
      : `1700 Midwood Dr - ADU Floor ${aduFloor + 1}`
    clone.appendChild(title)

    const summary = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    summary.setAttribute('x', '700')
    summary.setAttribute('y', '1170')
    summary.setAttribute('fill', '#a8d4f0')
    summary.setAttribute('font-size', '12')
    summary.setAttribute('font-family', 'Courier New')
    summary.setAttribute('text-anchor', 'middle')
    summary.textContent = mode === 'main'
      ? `Total: ${totalSqFt.toFixed(0)} SF | ${currentAreas.length} Rooms | ${currentLines.length} Walls`
      : `Floor ${aduFloor + 1}: ${(aduFloor === 0 ? aduFloor0SqFt : aduFloor1SqFt).toFixed(0)} SF | Total ADU: ${aduTotalSqFt.toFixed(0)} SF`
    clone.appendChild(summary)

    const svgData = new XMLSerializer().serializeToString(clone)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    canvas.width = 1400
    canvas.height = 1200

    img.onload = () => {
      ctx.fillStyle = '#1e5080'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      const link = document.createElement('a')
      link.download = mode === 'main' ? '1700-midwood-main-house.png' : `1700-midwood-adu-floor${aduFloor + 1}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  // Export as PDF
  const exportBlueprint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to export PDF')
      return
    }

    const roomsHTML = currentAreas.map(a => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #2a5a8a;"><span style="display:inline-block;width:12px;height:12px;background:${a.color};margin-right:8px;"></span>${a.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #2a5a8a; text-align: right;">${a.lineIds.length} walls</td>
        <td style="padding: 8px; border-bottom: 1px solid #2a5a8a; text-align: right; font-weight: bold;">${getAreaSqFt(a).toFixed(0)} SF</td>
      </tr>
    `).join('')

    const svg = document.querySelector('.grid-svg')
    const svgClone = svg.cloneNode(true)
    const svgData = new XMLSerializer().serializeToString(svgClone)

    const titleText = mode === 'main' ? '1700 MIDWOOD DR - MAIN HOUSE' : `1700 MIDWOOD DR - ADU FLOOR ${aduFloor + 1}`
    const subtitleText = mode === 'main'
      ? `Raleigh, NC 27604 | Floor Plan | ${new Date().toLocaleDateString()}`
      : `ADU Design | Floor ${aduFloor + 1} of 2 | ${new Date().toLocaleDateString()}`

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${titleText}</title>
        <style>
          @page { size: landscape; margin: 0.5in; }
          body { font-family: 'Courier New', monospace; background: #1a3a5c; color: #e8f4fc; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #2a5a8a; }
          h1 { color: #a8d4f0; font-size: 24px; margin: 0; letter-spacing: 2px; }
          .subtitle { color: #6a9fc0; font-size: 12px; margin-top: 5px; }
          .content { display: flex; gap: 20px; }
          .blueprint { flex: 1; background: #1e5080; border: 1px solid #2a5a8a; overflow: hidden; }
          .blueprint svg { width: 100%; height: auto; max-height: 600px; }
          .summary { width: 280px; background: #0d2137; padding: 15px; border: 1px solid #2a5a8a; }
          .summary h2 { font-size: 14px; color: #a8d4f0; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .total { margin-top: 15px; padding-top: 15px; border-top: 2px solid #2a5a8a; display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; }
          .footer { text-align: center; margin-top: 20px; color: #4a7a9a; font-size: 10px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${titleText}</h1>
          <div class="subtitle">${subtitleText}</div>
        </div>
        <div class="content">
          <div class="blueprint">${svgData}</div>
          <div class="summary">
            <h2>Room Summary${mode === 'adu' ? ` - Floor ${aduFloor + 1}` : ''}</h2>
            <table><tbody>${roomsHTML}</tbody></table>
            <div class="total">
              <span>${mode === 'adu' ? `FLOOR ${aduFloor + 1}` : 'TOTAL'}</span>
              <span>${totalSqFt.toFixed(0)} SF</span>
            </div>
            ${mode === 'adu' ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #2a5a8a;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 5px;">
                  <span>Floor 1:</span><span>${aduFloor0SqFt.toFixed(0)} SF</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 5px;">
                  <span>Floor 2:</span><span>${aduFloor1SqFt.toFixed(0)} SF</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #2a5a8a;">
                  <span>ADU TOTAL:</span><span>${aduTotalSqFt.toFixed(0)} SF</span>
                </div>
              </div>
            ` : ''}
            <div style="margin-top: 20px; font-size: 10px; color: #6a9fc0;">
              <div style="margin-bottom: 5px;"><strong>Scale:</strong> 1 grid = 10 ft</div>
              <div style="margin-bottom: 5px;"><strong>Walls:</strong> ${currentLines.length}</div>
              ${mode === 'adu' ? `<div><strong>Footprint:</strong> ${aduFootprint.width}' x ${aduFootprint.depth}'</div>` : `<div><strong>Lot:</strong> 80' x 103' (0.19 acre)</div>`}
            </div>
          </div>
        </div>
        <div class="footer">Generated by Blueprint Editor | For contractor reference only - verify all measurements on site</div>
        <script>window.onload = () => window.print()</script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="app-simple">
      <header>
        <div>
          <h1>Blueprint Editor</h1>
          <span className="address">
            {address || 'No address set'} | {mode === 'lot' ? 'Lot Setup' : mode === 'surroundings' ? 'Surroundings' : mode === 'main' ? 'Main House' : mode === 'adu' ? `ADU Floor ${aduFloor + 1}` : 'Integrate'}
            {(mode === 'main' || mode === 'adu') && ` | ${currentLines.length} walls | ${currentDoors.length} doors | ${currentWindows.length} windows`}
          </span>
        </div>
        <div className="header-actions">
          <div className="mode-toggle">
            <button className={mode === 'main' ? 'active' : ''} onClick={() => switchMode('main')}>Main House</button>
            <button className={mode === 'adu' ? 'active' : ''} onClick={() => switchMode('adu')}>ADU</button>
            <button className={mode === 'lot' ? 'active' : ''} onClick={() => switchMode('lot')}>Lot</button>
            <button className={mode === 'integrate' ? 'active' : ''} onClick={() => switchMode('integrate')}>Integrate</button>
            <button className={mode === 'surroundings' ? 'active' : ''} onClick={() => switchMode('surroundings')}>Surroundings</button>
          </div>
          <button onClick={() => setShowProjectPanel(!showProjectPanel)} className={showProjectPanel ? 'active' : ''}>
            📁 Project {currentVersionId && versions.find(v => v.id === currentVersionId) ? `(${versions.find(v => v.id === currentVersionId).name})` : ''}
          </button>
          <button onClick={exportBlueprint}>Export PDF</button>
          <button onClick={exportPNG}>Export PNG</button>
        </div>
      </header>

      <div className="main-layout">
        <div className="toolbar">
          {mode === 'lot' && (
            <>
              <div className="tool-section">
                <label>Property Address (Wake County)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter address..."
                  className="address-input"
                />
                <button
                  onClick={fetchParcelData}
                  disabled={fetchingParcel || !address}
                  className="primary-btn"
                  style={{ marginTop: '8px' }}
                >
                  {fetchingParcel ? 'Fetching...' : 'Fetch from Wake County GIS'}
                </button>
                {parcelError && (
                  <div style={{ fontSize: '0.65rem', color: '#ff6666', marginTop: '6px' }}>
                    {parcelError}
                  </div>
                )}
              </div>

              {parcelData && (
                <div className="tool-section">
                  <label>Parcel Info</label>
                  <div className="parcel-info">
                    <div className="parcel-row">
                      <span>PIN:</span>
                      <span>{parcelData.pin}</span>
                    </div>
                    <div className="parcel-row">
                      <span>Address:</span>
                      <span>{parcelData.address}</span>
                    </div>
                    {parcelData.acres && (
                      <div className="parcel-row">
                        <span>Acres:</span>
                        <span>{parcelData.acres.toFixed(3)}</span>
                      </div>
                    )}
                    {parcelData.yearBuilt && parcelData.yearBuilt > 0 && (
                      <div className="parcel-row">
                        <span>Year Built:</span>
                        <span>{parcelData.yearBuilt}</span>
                      </div>
                    )}
                    {parcelData.totalValue && (
                      <div className="parcel-row">
                        <span>Assessed:</span>
                        <span>${parcelData.totalValue.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="tool-section">
                <label>Aerial Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAerialUpload}
                  style={{ display: 'none' }}
                  id="aerial-upload"
                />
                <label htmlFor="aerial-upload" className="upload-btn">
                  Upload Aerial Photo
                </label>
                {aerialImage && (
                  <div className="checkbox-label" style={{ marginTop: '8px' }}>
                    <input
                      type="checkbox"
                      checked={showAerial}
                      onChange={(e) => setShowAerial(e.target.checked)}
                    />
                    Show aerial overlay
                  </div>
                )}
              </div>

              <div className="tool-section">
                <label>Lot Dimensions</label>
                <div className="footprint-inputs">
                  <div className="footprint-row">
                    <span>Width:</span>
                    <input type="number" value={lotWidth} onChange={(e) => setLotWidth(parseInt(e.target.value) || 80)} min="20" max="500" />
                    <span>ft</span>
                  </div>
                  <div className="footprint-row">
                    <span>Depth:</span>
                    <input type="number" value={lotDepth} onChange={(e) => setLotDepth(parseInt(e.target.value) || 100)} min="20" max="500" />
                    <span>ft</span>
                  </div>
                </div>
              </div>

              <div className="tool-section">
                <label>Manual Trace (Optional)</label>
                {!isTracingLot ? (
                  <button onClick={() => setIsTracingLot(true)}>
                    {lotBoundary.length > 0 ? 'Edit Boundary' : 'Trace Manually'}
                  </button>
                ) : (
                  <button onClick={completeLotBoundary} className="primary-btn">
                    Complete ({lotBoundary.length} points)
                  </button>
                )}
                {lotBoundary.length > 0 && !parcelData && (
                  <button onClick={clearLotBoundary} className="clear-btn" style={{ marginTop: '4px' }}>
                    Clear Boundary
                  </button>
                )}
                {parcelData && lotBoundary.length > 0 && (
                  <button onClick={() => { clearLotBoundary(); setParcelData(null); }} className="clear-btn" style={{ marginTop: '4px' }}>
                    Clear Parcel Data
                  </button>
                )}
                <div style={{ fontSize: '0.65rem', color: '#6a9fc0', marginTop: '8px' }}>
                  {isTracingLot ? 'Click to add points around your lot' : parcelData ? 'Boundary loaded from Wake County GIS' : 'Or trace manually on aerial photo'}
                </div>
              </div>

              <div className="tool-section">
                <label>Lot Summary</label>
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-label">Size</span>
                    <span className="stat-value">{lotWidth}' × {lotDepth}'</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Area</span>
                    <span className="stat-value">{parcelData?.acres ? `${parcelData.acres.toFixed(3)} ac` : `${((lotWidth * lotDepth) / 43560).toFixed(2)} ac`}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Source</span>
                    <span className="stat-value">{parcelData ? 'Wake County GIS' : lotBoundary.length > 0 ? 'Manual' : 'Default'}</span>
                  </div>
                  {lotBoundary.length > 0 && (
                    <div className="stat-item">
                      <span className="stat-label">Boundary</span>
                      <span className="stat-value">{lotBoundary.length} points</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="tool-section">
                {(lotBoundary.length >= 3 || parcelData) && (
                  <button onClick={() => switchMode('integrate')} className="primary-btn" style={{ width: '100%' }}>
                    Continue to Integrate →
                  </button>
                )}
              </div>
            </>
          )}

          {mode === 'surroundings' && (
            <>
              <div className="tool-section">
                <label>Fetch Data</label>
                <button
                  onClick={fetchSurroundings}
                  disabled={fetchingSurroundings || !parcelData}
                  className="primary-btn"
                >
                  {fetchingSurroundings ? 'Fetching...' : 'Fetch from GIS'}
                </button>
                {!parcelData && (
                  <div style={{ fontSize: '0.65rem', color: '#ff6666', marginTop: '6px' }}>
                    Fetch parcel data in Lot Setup first
                  </div>
                )}
                {streets.length > 0 && (
                  <div style={{ fontSize: '0.65rem', color: '#6a9fc0', marginTop: '6px' }}>
                    {streets.length} streets, {nearbyBuildings.length} buildings loaded
                  </div>
                )}
              </div>

              <div className="tool-section">
                <label>Reference</label>
                <button
                  onClick={() => {
                    const query = encodeURIComponent(address || '1700 Midwood Dr, Raleigh, NC')
                    window.open(`https://www.google.com/maps/search/${query}`, '_blank')
                  }}
                  style={{ marginBottom: '4px' }}
                >
                  View in Google Maps
                </button>
                <button
                  onClick={() => {
                    const query = encodeURIComponent(address || '1700 Midwood Dr, Raleigh, NC')
                    window.open(`https://earth.google.com/web/search/${query}`, '_blank')
                  }}
                >
                  View in Google Earth
                </button>
                <div style={{ fontSize: '0.65rem', color: '#6a9fc0', marginTop: '6px' }}>
                  Use satellite view to trace trees, driveways, fences
                </div>
              </div>

              <div className="tool-section">
                <label>Add Elements</label>
                <div className="tool-buttons">
                  <button className={surroundingsTool === 'select' ? 'active' : ''} onClick={() => setSurroundingsTool('select')}>
                    Select
                  </button>
                  <button className={surroundingsTool === 'tree' ? 'active' : ''} onClick={() => setSurroundingsTool('tree')}>
                    Add Tree
                  </button>
                  <button className={surroundingsTool === 'bush' ? 'active' : ''} onClick={() => setSurroundingsTool('bush')}>
                    Add Bush
                  </button>
                  <button className={surroundingsTool === 'fence' ? 'active' : ''} onClick={() => setSurroundingsTool('fence')}>
                    Draw Fence
                  </button>
                  <button className={surroundingsTool === 'driveway' ? 'active' : ''} onClick={() => setSurroundingsTool('driveway')}>
                    Trace Driveway
                  </button>
                </div>
                {surroundingsTool === 'driveway' && tracingDriveway && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: '#6a9fc0', marginBottom: '4px' }}>
                      {tracingDriveway.length} points traced
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#888888', marginBottom: '6px' }}>
                      Backspace = undo point, Esc = cancel
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => {
                          if (tracingDriveway.length === 1) {
                            setTracingDriveway(null)
                          } else {
                            setTracingDriveway(tracingDriveway.slice(0, -1))
                          }
                        }}
                        className="secondary-btn"
                        style={{ flex: 1 }}
                      >
                        Undo
                      </button>
                      <button
                        onClick={() => setTracingDriveway(null)}
                        className="secondary-btn"
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        if (tracingDriveway.length >= 3) {
                          setDriveways([...driveways, { id: Date.now(), points: tracingDriveway, material: 'concrete' }])
                        }
                        setTracingDriveway(null)
                      }}
                      disabled={tracingDriveway.length < 3}
                      className="primary-btn"
                      style={{ marginTop: '4px', width: '100%' }}
                    >
                      Complete Driveway
                    </button>
                  </div>
                )}
              </div>

              <div className="tool-section">
                <label>Visibility</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={surroundingsVisible.streets}
                      onChange={(e) => setSurroundingsVisible({ ...surroundingsVisible, streets: e.target.checked })}
                    />
                    Streets ({streets.length})
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={surroundingsVisible.buildings}
                      onChange={(e) => setSurroundingsVisible({ ...surroundingsVisible, buildings: e.target.checked })}
                    />
                    Buildings ({nearbyBuildings.length})
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={surroundingsVisible.trees}
                      onChange={(e) => setSurroundingsVisible({ ...surroundingsVisible, trees: e.target.checked })}
                    />
                    Trees ({trees.length})
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={surroundingsVisible.bushes}
                      onChange={(e) => setSurroundingsVisible({ ...surroundingsVisible, bushes: e.target.checked })}
                    />
                    Bushes ({bushes.length})
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={surroundingsVisible.fences}
                      onChange={(e) => setSurroundingsVisible({ ...surroundingsVisible, fences: e.target.checked })}
                    />
                    Fences ({fences.length})
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={surroundingsVisible.driveways}
                      onChange={(e) => setSurroundingsVisible({ ...surroundingsVisible, driveways: e.target.checked })}
                    />
                    Driveways ({driveways.length})
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={surroundingsVisible.amenities !== false}
                      onChange={(e) => setSurroundingsVisible({ ...surroundingsVisible, amenities: e.target.checked })}
                    />
                    Amenities ({amenities.length})
                  </label>
                </div>
              </div>

              <div className="tool-section">
                <label>Add Amenities</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const template = amenityTemplates[e.target.value]
                      const newAmenity = {
                        id: Date.now(),
                        type: e.target.value,
                        name: template.name,
                        x: 40,
                        y: 60,
                        width: template.width,
                        height: template.height,
                        rotation: 0,
                        color: template.color,
                        shape: template.shape
                      }
                      setAmenities([...amenities, newAmenity])
                      setSelectedAmenity(newAmenity.id)
                      e.target.value = ''
                    }
                  }}
                  style={{ width: '100%', padding: '8px', background: '#2a2a2a', border: '2px solid #444444', color: '#ffffff', borderRadius: '4px', marginBottom: '6px', fontWeight: '600' }}
                >
                  <option value="">+ Add amenity...</option>
                  <optgroup label="Pools">
                    <option value="pool-rectangular-small">Small Pool (12'×24')</option>
                    <option value="pool-rectangular-medium">Medium Pool (16'×32')</option>
                    <option value="pool-rectangular-large">Large Pool (20'×40')</option>
                    <option value="pool-lap">Lap Pool (8'×50')</option>
                    <option value="pool-kidney">Kidney Pool (18'×30')</option>
                    <option value="pool-l-shaped">L-Shaped Pool (24'×32')</option>
                  </optgroup>
                  <optgroup label="Hot Tubs & Spas">
                    <option value="hot-tub-round">Round Hot Tub (8')</option>
                    <option value="hot-tub-square">Square Hot Tub (8')</option>
                  </optgroup>
                  <optgroup label="Saunas">
                    <option value="sauna-small">Small Sauna (6'×8')</option>
                    <option value="sauna-large">Large Sauna (8'×12')</option>
                  </optgroup>
                  <optgroup label="Outdoor Kitchens">
                    <option value="outdoor-kitchen-small">Outdoor Kitchen S (10'×5')</option>
                    <option value="outdoor-kitchen-large">Outdoor Kitchen L (16'×6')</option>
                  </optgroup>
                  <optgroup label="Fire Features">
                    <option value="fire-pit">Fire Pit (6')</option>
                  </optgroup>
                  <optgroup label="Shade Structures">
                    <option value="pergola-small">Pergola S (10'×10')</option>
                    <option value="pergola-large">Pergola L (14'×14')</option>
                    <option value="gazebo">Gazebo (12')</option>
                  </optgroup>
                  <optgroup label="Sports">
                    <option value="tennis-court">Tennis Court (36'×78')</option>
                    <option value="basketball-half">Basketball Half Court (25'×22')</option>
                  </optgroup>
                  <optgroup label="Porches">
                    <option value="porch-small">Small Porch (8'×6')</option>
                    <option value="porch-medium">Medium Porch (12'×8')</option>
                    <option value="porch-large">Large Porch (20'×10')</option>
                    <option value="porch-wrap">Wrap-Around Porch (30'×8')</option>
                  </optgroup>
                </select>
                {amenities.length > 0 && (
                  <div style={{ fontSize: '0.65rem', color: '#6a9fc0' }}>
                    {amenities.length} amenities placed
                  </div>
                )}
              </div>

              <div className="tool-section">
                <label>Summary</label>
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-label">Trees</span>
                    <span className="stat-value">{trees.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Fences</span>
                    <span className="stat-value">{fences.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Driveways</span>
                    <span className="stat-value">{driveways.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Amenities</span>
                    <span className="stat-value">{amenities.length}</span>
                  </div>
                </div>
              </div>

              <div className="tool-section">
                <button onClick={() => switchMode('integrate')} style={{ width: '100%' }}>
                  ← Back to Integrate
                </button>
              </div>
            </>
          )}

          {mode === 'adu' && (
            <div className="tool-section">
              <label>Floor</label>
              <div className="floor-tabs">
                <button className={aduFloor === 0 ? 'active' : ''} onClick={() => switchFloor(0)}>Floor 1</button>
                <button className={aduFloor === 1 ? 'active' : ''} onClick={() => switchFloor(1)}>Floor 2</button>
              </div>
            </div>
          )}

          {mode === 'adu' && (
            <div className="tool-section">
              <label>Template</label>
              <select value={selectedTemplate} onChange={(e) => loadTemplate(e.target.value)} className="template-select">
                {Object.entries(ADU_TEMPLATES).map(([id, t]) => (
                  <option key={id} value={id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {mode === 'adu' && (
            <div className="tool-section">
              <label>Footprint</label>
              <div className="footprint-inputs">
                <div className="footprint-row">
                  <span>W:</span>
                  <input type="number" value={aduFootprint.width} onChange={(e) => setAduFootprint({...aduFootprint, width: parseInt(e.target.value) || 24})} min="16" max="40" step="1" />
                  <span>ft</span>
                </div>
                <div className="footprint-row">
                  <span>D:</span>
                  <input type="number" value={aduFootprint.depth} onChange={(e) => setAduFootprint({...aduFootprint, depth: parseInt(e.target.value) || 24})} min="16" max="40" step="1" />
                  <span>ft</span>
                </div>
              </div>
            </div>
          )}

          {(mode === 'main' || mode === 'adu') && (
            <div className="tool-section">
              <label>Tools</label>
              <div className="tool-buttons">
                <button className={tool === 'select' ? 'active' : ''} onClick={() => { setTool('select'); setMultiSelect([]); }}>
                  Select
                </button>
                <button className={tool === 'draw' ? 'active' : ''} onClick={() => setTool('draw')}>
                  Draw Wall
                </button>
                <button className={tool === 'boundary' ? 'active' : ''} onClick={() => setTool('boundary')}>
                  Boundary
                </button>
                <button className={tool === 'door' ? 'active' : ''} onClick={() => setTool('door')}>
                  Add Door
                </button>
                <button className={tool === 'window' ? 'active' : ''} onClick={() => setTool('window')}>
                  Add Window
                </button>
                <button className={tool === 'area' ? 'active' : ''} onClick={() => setTool('area')}>
                  Define Room
                </button>
              </div>
              {tool === 'door' && (
                <div className="door-options">
                  <label style={{ fontSize: '0.6rem', color: '#888888', marginTop: '8px' }}>Swing Direction</label>
                  <div className="swing-buttons">
                    <button className={doorSwing === 'left' ? 'active' : ''} onClick={() => setDoorSwing('left')}>← Left</button>
                    <button className={doorSwing === 'right' ? 'active' : ''} onClick={() => setDoorSwing('right')}>Right →</button>
                  </div>
                </div>
              )}
              {tool === 'boundary' && (
                <div style={{ fontSize: '0.65rem', color: '#6a9fc0', marginTop: '8px' }}>
                  Click and drag to draw a planning boundary (dashed line for open concepts)
                </div>
              )}
              {tool === 'area' && (
                <div style={{
                  background: '#2a2a2a',
                  padding: '12px',
                  borderRadius: '6px',
                  border: multiSelect.length >= 3 ? '2px solid #4CAF50' : '2px solid #444',
                  marginTop: '8px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: '700', marginBottom: '10px' }}>
                    Define Room - Steps:
                  </div>

                  {/* Step 1 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px',
                    opacity: multiSelect.length === 0 ? 1 : 0.5
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: multiSelect.length > 0 ? '#4CAF50' : '#f0c040',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      marginRight: '8px'
                    }}>
                      {multiSelect.length > 0 ? '✓' : '1'}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#ccc' }}>Click walls to select</span>
                  </div>

                  {/* Wall count indicator */}
                  <div style={{
                    background: multiSelect.length >= 3 ? '#2d5a2d' : '#333',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    marginBottom: '10px'
                  }}>
                    <span style={{
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      color: multiSelect.length >= 3 ? '#4CAF50' : '#f0c040'
                    }}>
                      {multiSelect.length}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#aaa', marginLeft: '6px' }}>
                      walls selected {multiSelect.length < 3 ? `(need ${3 - multiSelect.length} more)` : '✓'}
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px',
                    opacity: multiSelect.length >= 3 ? 1 : 0.5
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: multiSelect.length >= 3 ? '#f0c040' : '#555',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      marginRight: '8px'
                    }}>
                      2
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#ccc' }}>Name the room</span>
                  </div>

                  <input
                    type="text"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    placeholder="Room name (e.g. Living Room)"
                    className="room-name-input"
                    style={{
                      marginBottom: '10px',
                      border: multiSelect.length >= 3 ? '2px solid #f0c040' : '1px solid #444'
                    }}
                  />

                  {/* Step 3 - Create button */}
                  <button
                    onClick={createArea}
                    disabled={multiSelect.length < 3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      background: multiSelect.length >= 3 ? '#4CAF50' : '#444',
                      color: multiSelect.length >= 3 ? '#fff' : '#888',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: multiSelect.length >= 3 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s'
                    }}
                  >
                    {multiSelect.length >= 3 ? '✓ Create Room' : 'Select 3+ Walls First'}
                  </button>

                  {multiSelect.length > 0 && (
                    <button
                      onClick={() => setMultiSelect([])}
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '0.75rem',
                        marginTop: '8px',
                        background: 'transparent',
                        color: '#888',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {(mode === 'main' || mode === 'adu') && (
            <div className="tool-section">
              <label>Add Stairs</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const template = stairTemplates[e.target.value]
                    const newStair = {
                      id: Date.now(),
                      type: e.target.value,
                      x: 10,
                      y: 10,
                      rotation: 0,
                      ...template
                    }
                    saveToHistory()
                    setCurrentStairs([...currentStairs, newStair])
                    setSelectedStair(newStair.id)
                    e.target.value = ''
                  }
                }}
                className="template-select"
                defaultValue=""
              >
                <option value="">Select stairs...</option>
                {Object.entries(stairTemplates).map(([id, t]) => (
                  <option key={id} value={id}>{t.name} ({t.width}'×{t.length}')</option>
                ))}
              </select>
            </div>
          )}

          {(mode === 'main' || mode === 'adu') && (
            <div className="tool-section">
              <label>Add Furniture</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const template = furnitureTemplates[e.target.value]
                    const newItem = {
                      id: Date.now(),
                      type: e.target.value,
                      x: 10,
                      y: 10,
                      rotation: 0,
                      ...template
                    }
                    saveToHistory()
                    setCurrentFurniture([...currentFurniture, newItem])
                    setSelectedFurniture(newItem.id)
                    e.target.value = ''
                  }
                }}
                className="template-select"
                defaultValue=""
              >
                <option value="">Select furniture...</option>
                <optgroup label="Seating">
                  {Object.entries(furnitureTemplates).filter(([_, t]) => t.category === 'seating').map(([id, t]) => (
                    <option key={id} value={id}>{t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Tables">
                  {Object.entries(furnitureTemplates).filter(([_, t]) => t.category === 'table').map(([id, t]) => (
                    <option key={id} value={id}>{t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Beds">
                  {Object.entries(furnitureTemplates).filter(([_, t]) => t.category === 'bed').map(([id, t]) => (
                    <option key={id} value={id}>{t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Storage">
                  {Object.entries(furnitureTemplates).filter(([_, t]) => t.category === 'storage').map(([id, t]) => (
                    <option key={id} value={id}>{t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Electronics">
                  {Object.entries(furnitureTemplates).filter(([_, t]) => t.category === 'electronics').map(([id, t]) => (
                    <option key={id} value={id}>{t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Other">
                  {Object.entries(furnitureTemplates).filter(([_, t]) => t.category === 'furniture' || t.category === 'fixture').map(([id, t]) => (
                    <option key={id} value={id}>{t.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          <div className="tool-section">
            <label>AI Designer</label>
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className={showAIChat ? 'active' : 'primary-btn'}
              style={{ width: '100%' }}
            >
              {showAIChat ? 'Hide AI Chat' : '✨ Design with AI'}
            </button>
          </div>

          {mode === 'main' && (
            <div className="tool-section">
              <label>Import</label>
              <button onClick={() => fileInputRef.current?.click()} disabled={processing}>
                {processing ? 'Converting...' : 'Upload Blueprint'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              <div className="scale-control">
                <span>Scale (ft):</span>
                <input type="number" value={blueprintScale} onChange={(e) => setBlueprintScale(parseInt(e.target.value) || 50)} min="10" max="200" step="5" />
              </div>
            </div>
          )}

          {mode !== 'lot' && (
            <div className="tool-section">
              <label>Summary</label>
              <div className="summary-stats">
                {mode === 'adu' ? (
                  <>
                    <div className="stat-item">
                      <span className="stat-label">Floor 1</span>
                      <span className="stat-value">{aduFloor0SqFt.toFixed(0)} SF</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Floor 2</span>
                      <span className="stat-value">{aduFloor1SqFt.toFixed(0)} SF</span>
                    </div>
                    <div className="stat-item highlight">
                      <span className="stat-label">Total</span>
                      <span className="stat-value">{aduTotalSqFt.toFixed(0)} SF</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="stat-item">
                      <span className="stat-label">Walls</span>
                      <span className="stat-value">{currentLines.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Doors</span>
                      <span className="stat-value">{currentDoors.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Windows</span>
                      <span className="stat-value">{currentWindows.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Rooms</span>
                      <span className="stat-value">{currentAreas.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total SF</span>
                      <span className="stat-value">{totalSqFt.toFixed(0)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {mode !== 'lot' && (
            <div className="tool-section">
              <label>Shortcuts</label>
              <div className="shortcuts-list">
                <div><kbd>Ctrl+Z</kbd> Undo</div>
                <div><kbd>Ctrl+C</kbd> Copy</div>
                <div><kbd>Ctrl+V</kbd> Paste</div>
                <div><kbd>Ctrl+A</kbd> Select All</div>
                <div><kbd>Shift</kbd> Multi-select</div>
                <div><kbd>Del</kbd> Delete</div>
                <div><kbd>Esc</kbd> Deselect</div>
              </div>
              {hasMultiSelection && (
                <div className="multi-select-info">
                  {multiSelected.lines.length + multiSelected.doors.length + multiSelected.windows.length} items selected
                </div>
              )}
            </div>
          )}

          {mode === 'adu' && (
            <div className="tool-section">
              <button onClick={() => { saveToHistory(); setCurrentLines([]); setCurrentAreas([]); setCurrentDoors([]); setCurrentWindows([]); }} className="clear-btn">
                Clear Floor {aduFloor + 1}
              </button>
            </div>
          )}

          {mode === 'main' && (
            <div className="tool-section">
              <button onClick={() => switchMode('adu')} style={{ width: '100%', marginBottom: '4px' }}>
                Continue to ADU →
              </button>
              <button onClick={() => switchMode('lot')} className="primary-btn" style={{ width: '100%' }}>
                Continue to Lot →
              </button>
            </div>
          )}

          {mode === 'adu' && (
            <div className="tool-section">
              <button onClick={() => switchMode('lot')} className="primary-btn" style={{ width: '100%' }}>
                Continue to Lot →
              </button>
            </div>
          )}

          {mode === 'integrate' && (
            <>
              <div className="tool-section">
                <label>Place Structures</label>
                <p style={{ fontSize: '0.65rem', color: '#6a9fc0', margin: '4px 0 8px 0' }}>
                  Click and drag structures to position them on your lot
                </p>
              </div>

              <div className="tool-section">
                <label>Structures</label>
                <button
                  className={selectedStructure === 'house' ? 'active' : ''}
                  onClick={() => { setSelectedStructure('house'); setSelectedAmenity(null); }}
                  disabled={lines.length === 0}
                  style={{ width: '100%', marginBottom: '4px' }}
                >
                  Main House {lines.length === 0 ? '(empty)' : `(${lines.length} walls)`}
                </button>
                <button
                  className={selectedStructure === 'adu' ? 'active' : ''}
                  onClick={() => { setSelectedStructure('adu'); setSelectedAmenity(null); }}
                  disabled={aduLines[0].length === 0 && aduLines[1].length === 0}
                  style={{ width: '100%' }}
                >
                  ADU {aduLines[0].length === 0 && aduLines[1].length === 0 ? '(empty)' : `(${aduLines[0].length + aduLines[1].length} walls)`}
                </button>
              </div>

              <div className="tool-section">
                <label>Visibility</label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={surroundingsVisible.streets}
                    onChange={(e) => setSurroundingsVisible({ ...surroundingsVisible, streets: e.target.checked })}
                  />
                  Streets
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={surroundingsVisible.buildings}
                    onChange={(e) => setSurroundingsVisible({ ...surroundingsVisible, buildings: e.target.checked })}
                  />
                  Nearby Buildings
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={surroundingsVisible.trees}
                    onChange={(e) => setSurroundingsVisible({ ...surroundingsVisible, trees: e.target.checked })}
                  />
                  Trees
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={surroundingsVisible.fences}
                    onChange={(e) => setSurroundingsVisible({ ...surroundingsVisible, fences: e.target.checked })}
                  />
                  Fences
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={surroundingsVisible.driveways}
                    onChange={(e) => setSurroundingsVisible({ ...surroundingsVisible, driveways: e.target.checked })}
                  />
                  Driveways
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={surroundingsVisible.bushes}
                    onChange={(e) => setSurroundingsVisible({ ...surroundingsVisible, bushes: e.target.checked })}
                  />
                  Bushes
                </label>
              </div>

              <div className="tool-section">
                <label>Summary</label>
                <div style={{ fontSize: '0.7rem', color: '#8ab4d4' }}>
                  <div>Main House: {areas.reduce((sum, a) => sum + getAreaSqFt(a), 0).toFixed(0)} SF</div>
                  <div>ADU: {(aduAreas[0].reduce((sum, a) => sum + getAreaSqFt(a, aduLines[0]), 0) + aduAreas[1].reduce((sum, a) => sum + getAreaSqFt(a, aduLines[1]), 0)).toFixed(0)} SF</div>
                  {lotBoundary.length > 0 && <div>Lot: {lotWidth}' × {lotDepth}'</div>}
                  {amenities.length > 0 && <div>Amenities: {amenities.length}</div>}
                </div>
              </div>

              <div className="tool-section">
                <button onClick={() => switchMode('lot')} style={{ width: '100%', marginBottom: '4px' }}>
                  ← Back to Lot
                </button>
                <button onClick={() => switchMode('surroundings')} className="primary-btn" style={{ width: '100%' }}>
                  Continue to Surroundings →
                </button>
              </div>
            </>
          )}
        </div>

        <div className="canvas-container" onWheel={handleWheel}>
          <div className="zoom-controls">
            <span className="zoom-label">Zoom</span>
            <input
              type="range"
              min="15"
              max="300"
              value={Math.round(zoom * 100)}
              onChange={(e) => setZoom(parseInt(e.target.value) / 100)}
              className="zoom-slider"
            />
            <span className="zoom-value" style={{ color: '#333', fontWeight: '700', minWidth: '50px' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={resetView} className="reset-btn">Fit</button>
          </div>
          <div className="canvas-scroll" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="canvas-sizer" style={{ width: canvasWidth * zoom, height: canvasHeight * zoom }}>
              <div ref={canvasRef} className="canvas" onMouseDown={handleMouseDown}
                style={{
                  cursor: tool === 'draw' ? 'crosshair' : tool === 'area' ? 'pointer' : 'default',
                  transform: `scale(${zoom})`,
                  transformOrigin: '0 0'
                }}>
            {processing && <div className="processing-overlay"><div className="processing-text">Converting blueprint...</div></div>}

            {/* Aerial image overlay */}
            {showAerial && aerialImage && mode === 'lot' && (
              <div className="aerial-overlay" style={{
                width: lotWidth * SCALE + OFFSET_X * 2,
                height: lotDepth * SCALE + OFFSET_Y * 2
              }}>
                <img src={aerialImage} alt="Aerial view" />
              </div>
            )}

            <svg className="grid-svg" width={canvasWidth} height={canvasHeight}>
              {/* 1-foot interval grid lines - uniform styling */}
              {Array.from({ length: gridCountX }, (_, i) => (
                <line key={`v${i}`} x1={OFFSET_X + i * SCALE} y1={0} x2={OFFSET_X + i * SCALE} y2={canvasHeight}
                  stroke="#d0d0d0" strokeWidth={0.5} />
              ))}
              {Array.from({ length: gridCountY }, (_, i) => (
                <line key={`h${i}`} x1={0} y1={OFFSET_Y + i * SCALE} x2={canvasWidth} y2={OFFSET_Y + i * SCALE}
                  stroke="#d0d0d0" strokeWidth={0.5} />
              ))}

              {/* Scale markers every 10 feet - dark gray for readability */}
              {Array.from({ length: Math.ceil(gridCountX / 10) }, (_, i) => (
                <text key={`s${i}`} x={OFFSET_X + i * 10 * SCALE} y={OFFSET_Y - 10} fill="#333333" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">
                  {i * 10}'
                </text>
              ))}
              {Array.from({ length: Math.ceil(gridCountY / 10) }, (_, i) => (
                <text key={`sy${i}`} x={OFFSET_X - 10} y={OFFSET_Y + i * 10 * SCALE + 5} fill="#333333" fontSize="13" fontWeight="bold" textAnchor="end" fontFamily="Arial, sans-serif">
                  {i * 10}'
                </text>
              ))}

              {/* ===== SURROUNDINGS - Streets (bottom layer) ===== */}
              {showLotAndSurroundings && surroundingsVisible.streets && streets.map(street => {
                const isSelected = selectedStreet === street.id
                // Draw street as a thick line or polygon based on points
                if (street.points.length >= 2) {
                  const pathD = street.points.map((p, i) =>
                    `${i === 0 ? 'M' : 'L'} ${OFFSET_X + p.x * SCALE} ${OFFSET_Y + p.y * SCALE}`
                  ).join(' ')
                  return (
                    <g key={`street-${street.id}`} onClick={() => mode === 'surroundings' && setSelectedStreet(street.id)}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#888888"
                        strokeWidth={street.width ? street.width * SCALE / 3 : 20}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.6}
                      />
                      {isSelected && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#f0c040"
                          strokeWidth={3}
                          strokeDasharray="5,5"
                        />
                      )}
                      {/* Street name label */}
                      {street.points.length >= 2 && (
                        <text
                          x={OFFSET_X + (street.points[0].x + street.points[street.points.length - 1].x) / 2 * SCALE}
                          y={OFFSET_Y + (street.points[0].y + street.points[street.points.length - 1].y) / 2 * SCALE}
                          fill="#555555"
                          fontSize="10"
                          textAnchor="middle"
                          fontFamily="Courier New"
                        >
                          {street.name}
                        </text>
                      )}
                    </g>
                  )
                }
                return null
              })}

              {/* ===== SURROUNDINGS - Driveways ===== */}
              {showLotAndSurroundings && surroundingsVisible.driveways && driveways.map(driveway => {
                const isSelected = selectedDriveway === driveway.id
                if (driveway.points.length >= 3) {
                  const pathD = driveway.points.map((p, i) =>
                    `${i === 0 ? 'M' : 'L'} ${OFFSET_X + p.x * SCALE} ${OFFSET_Y + p.y * SCALE}`
                  ).join(' ') + ' Z'
                  return (
                    <path
                      key={`driveway-${driveway.id}`}
                      d={pathD}
                      fill="#a0a0a0"
                      fillOpacity={0.7}
                      stroke={isSelected ? '#f0c040' : '#808080'}
                      strokeWidth={isSelected ? 3 : 2}
                      style={{ cursor: mode === 'surroundings' ? 'pointer' : 'default' }}
                      onClick={() => mode === 'surroundings' && setSelectedDriveway(driveway.id)}
                    />
                  )
                }
                return null
              })}

              {/* ===== SURROUNDINGS - Driveway tracing preview ===== */}
              {showLotAndSurroundings && tracingDriveway && tracingDriveway.length >= 1 && (
                <g>
                  {tracingDriveway.length >= 2 && (
                    <path
                      d={tracingDriveway.map((p, i) =>
                        `${i === 0 ? 'M' : 'L'} ${OFFSET_X + p.x * SCALE} ${OFFSET_Y + p.y * SCALE}`
                      ).join(' ')}
                      fill="none"
                      stroke="#a0a0a0"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  )}
                  {tracingDriveway.map((p, i) => (
                    <circle
                      key={`trace-${i}`}
                      cx={OFFSET_X + p.x * SCALE}
                      cy={OFFSET_Y + p.y * SCALE}
                      r="5"
                      fill="#808080"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  ))}
                </g>
              )}

              {/* ===== SURROUNDINGS - Nearby Buildings ===== */}
              {showLotAndSurroundings && surroundingsVisible.buildings && nearbyBuildings.map(building => {
                const isSelected = selectedBuilding === building.id
                if (building.points.length >= 3) {
                  const pathD = building.points.map((p, i) =>
                    `${i === 0 ? 'M' : 'L'} ${OFFSET_X + p.x * SCALE} ${OFFSET_Y + p.y * SCALE}`
                  ).join(' ') + ' Z'
                  return (
                    <path
                      key={`building-${building.id}`}
                      d={pathD}
                      fill="rgba(150, 150, 150, 0.3)"
                      stroke={isSelected ? '#f0c040' : '#999999'}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeDasharray={isSelected ? 'none' : '4,2'}
                      style={{ cursor: mode === 'surroundings' ? 'pointer' : 'default' }}
                      onClick={() => mode === 'surroundings' && setSelectedBuilding(building.id)}
                    />
                  )
                }
                return null
              })}

              {/* Lot boundary rectangle (simple) - shown when no custom boundary */}
              {showLotAndSurroundings && lotBoundary.length === 0 && (
                <rect
                  x={OFFSET_X}
                  y={OFFSET_Y}
                  width={lotWidth * SCALE}
                  height={lotDepth * SCALE}
                  fill="none"
                  stroke="#006644"
                  strokeWidth="3"
                  strokeDasharray="10,5"
                  opacity={mode === 'lot' ? 1 : 0.6}
                />
              )}

              {/* Custom lot boundary polygon */}
              {showLotAndSurroundings && lotBoundary.length >= 2 && (
                <>
                  <polygon
                    points={lotBoundary.map(p => `${OFFSET_X + p.x * SCALE},${OFFSET_Y + p.y * SCALE}`).join(' ')}
                    fill={mode === 'lot' ? 'rgba(0, 102, 68, 0.15)' : 'rgba(0, 102, 68, 0.1)'}
                    stroke="#004d33"
                    strokeWidth="3"
                    strokeDasharray={lotBoundary.length >= 3 ? 'none' : '10,5'}
                    style={{ pointerEvents: mode === 'surroundings' || mode === 'integrate' ? 'none' : 'auto' }}
                  />
                  {/* Lot boundary points */}
                  {mode === 'lot' && lotBoundary.map((point, i) => (
                    <g key={`lot-point-${i}`}>
                      <circle
                        cx={OFFSET_X + point.x * SCALE}
                        cy={OFFSET_Y + point.y * SCALE}
                        r="7"
                        fill="#006644"
                        stroke="#ffffff"
                        strokeWidth="2"
                        style={{ cursor: 'pointer' }}
                      />
                      <text
                        x={OFFSET_X + point.x * SCALE}
                        y={OFFSET_Y + point.y * SCALE - 14}
                        fill="#004d33"
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="Courier New"
                      >
                        {i + 1}
                      </text>
                    </g>
                  ))}
                  {/* Line connecting to next potential point while tracing */}
                  {isTracingLot && lotBoundary.length > 0 && (
                    <line
                      x1={OFFSET_X + lotBoundary[lotBoundary.length - 1].x * SCALE}
                      y1={OFFSET_Y + lotBoundary[lotBoundary.length - 1].y * SCALE}
                      x2={OFFSET_X + lotBoundary[0].x * SCALE}
                      y2={OFFSET_Y + lotBoundary[0].y * SCALE}
                      stroke="#00ff88"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                      opacity="0.5"
                    />
                  )}
                </>
              )}

              {/* Lot dimensions label */}
              {showLotAndSurroundings && mode !== 'lot' && lotBoundary.length === 0 && (
                <text
                  x={OFFSET_X + (lotWidth * SCALE) / 2}
                  y={OFFSET_Y - 20}
                  fill="#004d33"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="Courier New"
                >
                  Lot: {lotWidth}' × {lotDepth}'
                </text>
              )}

              {/* ===== SURROUNDINGS - Fences ===== */}
              {showLotAndSurroundings && surroundingsVisible.fences && fences.map(fence => {
                const isSelected = selectedFence === fence.id
                const fenceLength = Math.sqrt((fence.x2 - fence.x1) ** 2 + (fence.y2 - fence.y1) ** 2)
                return (
                  <g key={`fence-${fence.id}`}>
                    {/* Invisible thick line for easier clicking */}
                    <line
                      x1={OFFSET_X + fence.x1 * SCALE}
                      y1={OFFSET_Y + fence.y1 * SCALE}
                      x2={OFFSET_X + fence.x2 * SCALE}
                      y2={OFFSET_Y + fence.y2 * SCALE}
                      stroke="transparent"
                      strokeWidth="14"
                      style={{ cursor: mode === 'surroundings' && surroundingsTool === 'select' ? 'move' : 'pointer' }}
                      onMouseDown={(e) => handleFenceClick(e, fence)}
                    />
                    {/* Visible fence line */}
                    <line
                      x1={OFFSET_X + fence.x1 * SCALE}
                      y1={OFFSET_Y + fence.y1 * SCALE}
                      x2={OFFSET_X + fence.x2 * SCALE}
                      y2={OFFSET_Y + fence.y2 * SCALE}
                      stroke={isSelected ? '#f0c040' : '#8B4513'}
                      strokeWidth={isSelected ? 4 : 3}
                      strokeLinecap="round"
                    />
                    {/* Length label */}
                    <text
                      x={OFFSET_X + ((fence.x1 + fence.x2) / 2) * SCALE}
                      y={OFFSET_Y + ((fence.y1 + fence.y2) / 2) * SCALE - 8}
                      fill="#654321"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="Courier New"
                    >
                      {fenceLength.toFixed(1)}'
                    </text>
                    {/* Endpoint handles when selected */}
                    {isSelected && mode === 'surroundings' ? (
                      <>
                        <circle
                          cx={OFFSET_X + fence.x1 * SCALE}
                          cy={OFFSET_Y + fence.y1 * SCALE}
                          r="6"
                          fill="#f0c040"
                          stroke="#fff"
                          strokeWidth="2"
                          style={{ cursor: 'pointer' }}
                          onMouseDown={(e) => handleFencePointMouseDown(e, fence, 1)}
                        />
                        <circle
                          cx={OFFSET_X + fence.x2 * SCALE}
                          cy={OFFSET_Y + fence.y2 * SCALE}
                          r="6"
                          fill="#f0c040"
                          stroke="#fff"
                          strokeWidth="2"
                          style={{ cursor: 'pointer' }}
                          onMouseDown={(e) => handleFencePointMouseDown(e, fence, 2)}
                        />
                      </>
                    ) : (
                      <>
                        {/* Fence posts (non-draggable when not selected) */}
                        <circle
                          cx={OFFSET_X + fence.x1 * SCALE}
                          cy={OFFSET_Y + fence.y1 * SCALE}
                          r="4"
                          fill="#8B4513"
                          stroke="#654321"
                          strokeWidth="1"
                        />
                        <circle
                          cx={OFFSET_X + fence.x2 * SCALE}
                          cy={OFFSET_Y + fence.y2 * SCALE}
                          r="4"
                          fill="#8B4513"
                          stroke="#654321"
                          strokeWidth="1"
                        />
                      </>
                    )}
                  </g>
                )
              })}

              {/* ===== SURROUNDINGS - Bushes ===== */}
              {showLotAndSurroundings && surroundingsVisible.bushes && bushes.map(bush => {
                const isSelected = selectedBush === bush.id
                const radius = bush.size === 'medium' ? 2.5 : 1.5 // feet
                return (
                  <circle
                    key={`bush-${bush.id}`}
                    cx={OFFSET_X + bush.x * SCALE}
                    cy={OFFSET_Y + bush.y * SCALE}
                    r={radius * SCALE}
                    fill="#32CD32"
                    fillOpacity={0.7}
                    stroke={isSelected ? '#f0c040' : '#228B22'}
                    strokeWidth={isSelected ? 3 : 2}
                    style={{ cursor: mode === 'surroundings' && surroundingsTool === 'select' ? 'move' : 'pointer' }}
                    onMouseDown={(e) => handleBushClick(e, bush)}
                  />
                )
              })}

              {/* ===== SURROUNDINGS - Trees ===== */}
              {showLotAndSurroundings && surroundingsVisible.trees && trees.map(tree => {
                const isSelected = selectedTree === tree.id
                const radius = tree.size === 'large' ? 12.5 : tree.size === 'medium' ? 7.5 : 4 // feet
                return (
                  <g key={`tree-${tree.id}`}
                    style={{ cursor: mode === 'surroundings' && surroundingsTool === 'select' ? 'move' : 'pointer' }}
                    onMouseDown={(e) => handleTreeClick(e, tree)}>
                    <circle
                      cx={OFFSET_X + tree.x * SCALE}
                      cy={OFFSET_Y + tree.y * SCALE}
                      r={radius * SCALE}
                      fill="#228B22"
                      fillOpacity={0.6}
                      stroke={isSelected ? '#f0c040' : '#333333'}
                      strokeWidth={isSelected ? 3 : 2}
                    />
                    {/* Tree trunk indicator */}
                    <circle
                      cx={OFFSET_X + tree.x * SCALE}
                      cy={OFFSET_Y + tree.y * SCALE}
                      r={Math.max(3, radius * SCALE * 0.15)}
                      fill="#654321"
                      style={{ pointerEvents: 'none' }}
                    />
                  </g>
                )
              })}


              {/* Ghost of other floor (ADU mode) */}
              {mode === 'adu' && aduLines[aduFloor === 0 ? 1 : 0].map(line => (
                <line key={`ghost-${line.id}`}
                  x1={OFFSET_X + line.x1 * SCALE} y1={OFFSET_Y + line.y1 * SCALE}
                  x2={OFFSET_X + line.x2 * SCALE} y2={OFFSET_Y + line.y2 * SCALE}
                  stroke="#4a6a8a" strokeWidth="1" strokeDasharray="4,4" opacity="0.4" />
              ))}

              {/* Area fills */}
              {currentAreas.map(area => {
                const areaLines = currentLines.filter(l => area.lineIds.includes(l.id))
                if (areaLines.length < 3) return null
                const points = []
                areaLines.forEach(l => {
                  if (!points.find(p => p.x === l.x1 && p.y === l.y1)) points.push({ x: l.x1, y: l.y1 })
                  if (!points.find(p => p.x === l.x2 && p.y === l.y2)) points.push({ x: l.x2, y: l.y2 })
                })
                const cx = points.reduce((s, p) => s + p.x, 0) / points.length
                const cy = points.reduce((s, p) => s + p.y, 0) / points.length
                points.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx))
                const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${OFFSET_X + p.x * SCALE} ${OFFSET_Y + p.y * SCALE}`).join(' ') + ' Z'
                const sqft = getAreaSqFt(area)

                return (
                  <g key={area.id} onClick={() => { setSelectedArea(area.id); setSelectedLine(null); }} style={{ cursor: 'pointer' }}>
                    <path d={pathD} fill={area.color} fillOpacity={selectedArea === area.id ? 0.4 : 0.2}
                      stroke={selectedArea === area.id ? '#333333' : area.color} strokeWidth={selectedArea === area.id ? 2 : 1} />
                    <text x={OFFSET_X + cx * SCALE} y={OFFSET_Y + cy * SCALE - 8} fill="#222222" fontSize="13" textAnchor="middle" fontWeight="bold" fontFamily="Arial, sans-serif" stroke="#ffffff" strokeWidth="0.5">
                      {area.name}
                    </text>
                    <text x={OFFSET_X + cx * SCALE} y={OFFSET_Y + cy * SCALE + 10} fill="#222222" fontSize="12" textAnchor="middle" fontWeight="bold" fontFamily="Arial, sans-serif" stroke="#ffffff" strokeWidth="0.3">
                      {sqft.toFixed(0)} SF
                    </text>
                  </g>
                )
              })}

              {/* Walls - only show in main/adu editing modes */}
              {(mode === 'main' || mode === 'adu') && currentLines.map(line => {
                const isSelected = selectedLine === line.id
                const isInAreaMultiSelect = multiSelect.includes(line.id) // For area definition tool
                const isInMultiSelected = multiSelected.lines.includes(line.id) // For multi-object selection
                const isInArea = currentAreas.some(a => a.lineIds.includes(line.id))

                return (
                  <g key={line.id}>
                    <line x1={OFFSET_X + line.x1 * SCALE} y1={OFFSET_Y + line.y1 * SCALE}
                      x2={OFFSET_X + line.x2 * SCALE} y2={OFFSET_Y + line.y2 * SCALE}
                      stroke="transparent" strokeWidth="30" style={{ cursor: tool === 'select' ? 'move' : 'pointer' }}
                      onMouseDown={(e) => handleLineClick(e, line)} />
                    <line x1={OFFSET_X + line.x1 * SCALE} y1={OFFSET_Y + line.y1 * SCALE}
                      x2={OFFSET_X + line.x2 * SCALE} y2={OFFSET_Y + line.y2 * SCALE}
                      stroke={isSelected ? '#f0c040' : isInMultiSelected ? '#ff6600' : isInAreaMultiSelect ? '#00aa88' : isInArea ? '#444444' : '#222222'}
                      strokeWidth={isSelected || isInMultiSelected || isInAreaMultiSelect ? 4 : 3} strokeLinecap="round" />
                    <text x={OFFSET_X + ((line.x1 + line.x2) / 2) * SCALE}
                      y={OFFSET_Y + ((line.y1 + line.y2) / 2) * SCALE - 8}
                      fill="#333333" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">
                      {getLineLength(line).toFixed(1)}'
                    </text>
                    {isSelected && (
                      <>
                        <circle cx={OFFSET_X + line.x1 * SCALE} cy={OFFSET_Y + line.y1 * SCALE} r="5"
                          fill="#f0c040" stroke="#fff" strokeWidth="2" style={{ cursor: 'pointer' }}
                          onMouseDown={(e) => handlePointMouseDown(e, line, 1)} />
                        <circle cx={OFFSET_X + line.x2 * SCALE} cy={OFFSET_Y + line.y2 * SCALE} r="5"
                          fill="#f0c040" stroke="#fff" strokeWidth="2" style={{ cursor: 'pointer' }}
                          onMouseDown={(e) => handlePointMouseDown(e, line, 2)} />
                      </>
                    )}
                  </g>
                )
              })}

              {/* Doors - only show in main/adu editing modes */}
              {(mode === 'main' || mode === 'adu') && currentDoors.map(door => {
                const isSelected = selectedDoor === door.id
                const isInMultiSelected = multiSelected.doors.includes(door.id)
                const isVertical = door.orientation === 'vertical'

                // Calculate positions based on orientation
                const hingeX = OFFSET_X + door.x * SCALE
                const hingeY = OFFSET_Y + door.y * SCALE
                const endX = isVertical ? hingeX : hingeX + door.width * SCALE
                const endY = isVertical ? hingeY + door.width * SCALE : hingeY

                // Arc for door swing
                const arcRadius = door.width * SCALE
                let arcEndX, arcEndY, sweepFlag

                if (isVertical) {
                  // Vertical door swings left or right
                  arcEndX = door.swing === 'left' ? hingeX - arcRadius : hingeX + arcRadius
                  arcEndY = hingeY
                  sweepFlag = door.swing === 'left' ? 1 : 0
                } else {
                  // Horizontal door swings up or down
                  arcEndX = hingeX
                  arcEndY = door.swing === 'left' ? hingeY - arcRadius : hingeY + arcRadius
                  sweepFlag = door.swing === 'left' ? 0 : 1
                }

                const strokeColor = isSelected ? '#f0c040' : isInMultiSelected ? '#ff6600' : '#90EE90'

                return (
                  <g key={door.id} onMouseDown={(e) => handleDoorClick(e, door)} style={{ cursor: tool === 'select' ? 'move' : 'pointer' }}>
                    {/* Invisible hit area for easier selection */}
                    <line
                      x1={hingeX} y1={hingeY}
                      x2={endX} y2={endY}
                      stroke="transparent"
                      strokeWidth="30"
                    />
                    {/* Door frame (the opening) */}
                    <line
                      x1={hingeX} y1={hingeY}
                      x2={endX} y2={endY}
                      stroke={strokeColor}
                      strokeWidth={isSelected || isInMultiSelected ? 4 : 3}
                      strokeLinecap="round"
                    />
                    {/* Door swing arc */}
                    <path
                      d={`M ${endX} ${endY} A ${arcRadius} ${arcRadius} 0 0 ${sweepFlag} ${arcEndX} ${arcEndY}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="1.5"
                      strokeDasharray="4,2"
                    />
                    {/* Door panel (line showing door position) */}
                    <line
                      x1={hingeX} y1={hingeY}
                      x2={arcEndX} y2={arcEndY}
                      stroke={strokeColor}
                      strokeWidth="2"
                    />
                    {(isSelected || isInMultiSelected) && (
                      <circle cx={hingeX} cy={hingeY} r="5" fill={strokeColor} stroke="#fff" strokeWidth="2" />
                    )}
                  </g>
                )
              })}

              {/* Windows - only show in main/adu editing modes */}
              {(mode === 'main' || mode === 'adu') && currentWindows.map(win => {
                const isSelected = selectedWindow === win.id
                const isInMultiSelected = multiSelected.windows.includes(win.id)
                const isVertical = win.orientation === 'vertical'
                const strokeColor = isSelected ? '#f0c040' : isInMultiSelected ? '#ff6600' : '#87CEEB'

                const x1 = OFFSET_X + win.x * SCALE
                const y1 = OFFSET_Y + win.y * SCALE
                const x2 = isVertical ? x1 : x1 + win.width * SCALE
                const y2 = isVertical ? y1 + win.width * SCALE : y1

                // Perpendicular marks size
                const markSize = 0.3 * SCALE

                return (
                  <g key={win.id} onMouseDown={(e) => handleWindowClick(e, win)} style={{ cursor: tool === 'select' ? 'move' : 'pointer' }}>
                    {/* Invisible hit area for easier selection */}
                    <line
                      x1={x1} y1={y1}
                      x2={x2} y2={y2}
                      stroke="transparent"
                      strokeWidth="30"
                    />
                    {/* Window - dotted line */}
                    <line
                      x1={x1} y1={y1}
                      x2={x2} y2={y2}
                      stroke={strokeColor}
                      strokeWidth={isSelected || isInMultiSelected ? 4 : 3}
                      strokeDasharray="6,3"
                      strokeLinecap="round"
                    />
                    {/* Small marks at ends to show window frame */}
                    {isVertical ? (
                      <>
                        <line x1={x1 - markSize} y1={y1} x2={x1 + markSize} y2={y1}
                          stroke={strokeColor} strokeWidth="2" />
                        <line x1={x2 - markSize} y1={y2} x2={x2 + markSize} y2={y2}
                          stroke={strokeColor} strokeWidth="2" />
                      </>
                    ) : (
                      <>
                        <line x1={x1} y1={y1 - markSize} x2={x1} y2={y1 + markSize}
                          stroke={strokeColor} strokeWidth="2" />
                        <line x1={x2} y1={y2 - markSize} x2={x2} y2={y2 + markSize}
                          stroke={strokeColor} strokeWidth="2" />
                      </>
                    )}
                    {(isSelected || isInMultiSelected) && (
                      <circle cx={x1} cy={y1} r="5" fill={strokeColor} stroke="#fff" strokeWidth="2" />
                    )}
                  </g>
                )
              })}

              {/* Artificial Boundaries - only show in main/adu editing modes */}
              {(mode === 'main' || mode === 'adu') && currentBoundaries.map(boundary => {
                const isSelected = selectedBoundary === boundary.id
                const x1 = OFFSET_X + boundary.x1 * SCALE
                const y1 = OFFSET_Y + boundary.y1 * SCALE
                const x2 = OFFSET_X + boundary.x2 * SCALE
                const y2 = OFFSET_Y + boundary.y2 * SCALE
                const midX = (x1 + x2) / 2
                const midY = (y1 + y2) / 2

                return (
                  <g key={boundary.id}>
                    {/* Invisible wider line for easier clicking */}
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="transparent"
                      strokeWidth="30"
                      style={{ cursor: 'move' }}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        if (tool === 'select') {
                          const pos = mouseToGrid(e)
                          setSelectedBoundary(boundary.id)
                          setSelectedLine(null)
                          setSelectedStair(null)
                          setSelectedFurniture(null)
                          setDragging({ type: 'boundary', id: boundary.id, startPos: pos, origItem: { ...boundary } })
                        }
                      }}
                    />
                    {/* Dashed boundary line */}
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={isSelected ? '#f0c040' : '#9370DB'}
                      strokeWidth={isSelected ? 3 : 2}
                      strokeDasharray="8,4"
                      strokeLinecap="round"
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* Label */}
                    {boundary.label && (
                      <text x={midX} y={midY - 8} fill="#9370DB" fontSize="10" textAnchor="middle"
                        fontFamily="Courier New" style={{ pointerEvents: 'none' }}>
                        {boundary.label}
                      </text>
                    )}
                    {/* Endpoint handles when selected */}
                    {isSelected && (
                      <>
                        <circle cx={x1} cy={y1} r="6" fill="#f0c040" stroke="#fff" strokeWidth="2"
                          style={{ cursor: 'pointer' }}
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            setDragging({ type: 'boundary-point', id: boundary.id, point: 1 })
                          }} />
                        <circle cx={x2} cy={y2} r="6" fill="#f0c040" stroke="#fff" strokeWidth="2"
                          style={{ cursor: 'pointer' }}
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            setDragging({ type: 'boundary-point', id: boundary.id, point: 2 })
                          }} />
                      </>
                    )}
                  </g>
                )
              })}

              {/* Stairs - only show in main/adu editing modes */}
              {(mode === 'main' || mode === 'adu') && currentStairs.map(stair => {
                const isSelected = selectedStair === stair.id
                const x = OFFSET_X + stair.x * SCALE
                const y = OFFSET_Y + stair.y * SCALE
                const width = stair.width * SCALE
                const length = stair.length * SCALE
                const treadDepth = length / stair.treads

                // Apply rotation transform
                const centerX = x + width / 2
                const centerY = y + length / 2

                return (
                  <g key={stair.id}
                    transform={`rotate(${stair.rotation || 0}, ${centerX}, ${centerY})`}
                    style={{ cursor: tool === 'select' ? 'move' : 'default' }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      if (tool === 'select') {
                        const pos = mouseToGrid(e)
                        setSelectedStair(stair.id)
                        setSelectedBoundary(null)
                        setSelectedFurniture(null)
                        setSelectedLine(null)
                        setDragging({ type: 'stair', id: stair.id, startPos: pos, origItem: { ...stair } })
                      }
                    }}>
                    {/* Stair outline */}
                    <rect x={x} y={y} width={width} height={length}
                      fill={stair.color + '40'} stroke={isSelected ? '#f0c040' : stair.color}
                      strokeWidth={isSelected ? 2 : 1} />
                    {/* Individual treads */}
                    {stair.shape === 'spiral' ? (
                      // Spiral stairs - render as a circle with spiral lines
                      <>
                        <circle cx={centerX} cy={centerY} r={Math.min(width, length) / 2 - 2}
                          fill="none" stroke={stair.color} strokeWidth="1" />
                        {Array.from({ length: stair.treads }).map((_, i) => {
                          const angle = (i / stair.treads) * Math.PI * 2 - Math.PI / 2
                          const r = Math.min(width, length) / 2 - 2
                          return (
                            <line key={i}
                              x1={centerX} y1={centerY}
                              x2={centerX + Math.cos(angle) * r}
                              y2={centerY + Math.sin(angle) * r}
                              stroke={stair.color} strokeWidth="1" />
                          )
                        })}
                        <circle cx={centerX} cy={centerY} r="4" fill={stair.color} />
                      </>
                    ) : (
                      // Straight stairs - horizontal tread lines
                      Array.from({ length: stair.treads - 1 }).map((_, i) => (
                        <line key={i}
                          x1={x} y1={y + (i + 1) * treadDepth}
                          x2={x + width} y2={y + (i + 1) * treadDepth}
                          stroke={stair.color} strokeWidth="1" />
                      ))
                    )}
                    {/* Direction arrow */}
                    <polygon
                      points={`${centerX},${y + 5} ${centerX - 5},${y + 15} ${centerX + 5},${y + 15}`}
                      fill={stair.color} />
                    {/* Label */}
                    <text x={centerX} y={y + length + 12} fill={stair.color}
                      fontSize="9" textAnchor="middle" fontFamily="Courier New">
                      {stair.name}
                    </text>
                  </g>
                )
              })}

              {/* Furniture - only show in main/adu editing modes */}
              {(mode === 'main' || mode === 'adu') && currentFurniture.map(item => {
                const isSelected = selectedFurniture === item.id
                const x = OFFSET_X + item.x * SCALE
                const y = OFFSET_Y + item.y * SCALE
                const width = item.width * SCALE
                const depth = item.depth * SCALE
                const centerX = x + width / 2
                const centerY = y + depth / 2

                return (
                  <g key={item.id}
                    transform={`rotate(${item.rotation || 0}, ${centerX}, ${centerY})`}
                    style={{ cursor: tool === 'select' ? 'move' : 'default' }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      if (tool === 'select') {
                        const pos = mouseToGrid(e)
                        setSelectedFurniture(item.id)
                        setSelectedStair(null)
                        setSelectedBoundary(null)
                        setSelectedLine(null)
                        setDragging({ type: 'furniture', id: item.id, startPos: pos, origItem: { ...item } })
                      }
                    }}>
                    {/* Furniture shape */}
                    {item.shape === 'l' ? (
                      // L-shaped (sectional sofa)
                      <path d={`M ${x} ${y} h ${width * 0.6} v ${depth * 0.5} h ${width * 0.4} v ${depth * 0.5} h ${-width} z`}
                        fill={item.color + '80'} stroke={isSelected ? '#f0c040' : item.color}
                        strokeWidth={isSelected ? 2 : 1} />
                    ) : (
                      // Regular rectangle
                      <rect x={x} y={y} width={width} height={depth}
                        fill={item.color + '80'} stroke={isSelected ? '#f0c040' : item.color}
                        strokeWidth={isSelected ? 2 : 1} rx="2" />
                    )}
                    {/* Category-specific details */}
                    {item.category === 'bed' && (
                      <>
                        {/* Pillow area */}
                        <rect x={x + 2} y={y + 2} width={width - 4} height={depth * 0.2}
                          fill="#fff" fillOpacity="0.5" rx="2" />
                      </>
                    )}
                    {item.category === 'seating' && item.type?.includes('sofa') && (
                      <>
                        {/* Back cushions */}
                        <rect x={x + 2} y={y + 2} width={width - 4} height={depth * 0.3}
                          fill="#fff" fillOpacity="0.3" rx="2" />
                      </>
                    )}
                    {item.category === 'electronics' && (
                      <>
                        {/* Screen */}
                        <rect x={x + 2} y={y + 1} width={width - 4} height={depth - 2}
                          fill="#111" rx="1" />
                      </>
                    )}
                    {/* Label */}
                    <text x={centerX} y={centerY + 3} fill={isSelected ? '#f0c040' : '#333'}
                      fontSize="8" textAnchor="middle" fontFamily="Courier New"
                      style={{ pointerEvents: 'none' }}>
                      {item.name}
                    </text>
                  </g>
                )
              })}

              {/* ===== INTEGRATE MODE - Main House ===== */}
              {mode === 'integrate' && lines.length > 0 && (() => {
                // Calculate center of structure for rotation
                const allX = lines.flatMap(l => [l.x1, l.x2])
                const allY = lines.flatMap(l => [l.y1, l.y2])
                const minX = Math.min(...allX)
                const maxX = Math.max(...allX)
                const minY = Math.min(...allY)
                const maxY = Math.max(...allY)
                const centerX = OFFSET_X + ((minX + maxX) / 2) * SCALE
                const centerY = OFFSET_Y + ((minY + maxY) / 2) * SCALE

                return (
                <g
                  transform={`translate(${housePosition.x * SCALE}, ${housePosition.y * SCALE}) rotate(${houseRotation}, ${centerX}, ${centerY})`}
                  style={{ cursor: 'move' }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    const pos = mouseToGrid(e)
                    setSelectedStructure('house')
                    setSelectedAmenity(null)
                    setDragging({ type: 'structure', structure: 'house', startPos: pos, origPos: { ...housePosition } })
                  }}
                >
                  {/* Bounding box for main house */}
                  {selectedStructure === 'house' && (
                    <rect
                      x={OFFSET_X + (minX - 2) * SCALE}
                      y={OFFSET_Y + (minY - 2) * SCALE}
                      width={(maxX - minX + 4) * SCALE}
                      height={(maxY - minY + 4) * SCALE}
                      fill="none"
                      stroke="#f0c040"
                      strokeWidth="2"
                      strokeDasharray="8,4"
                    />
                  )}
                  {/* House label */}
                  <text
                    x={OFFSET_X + 5}
                    y={OFFSET_Y - 5}
                    fill="#333333"
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="Courier New"
                  >
                    Main House
                  </text>
                  {/* Walls */}
                  {lines.map(line => (
                    <line key={line.id}
                      x1={OFFSET_X + line.x1 * SCALE} y1={OFFSET_Y + line.y1 * SCALE}
                      x2={OFFSET_X + line.x2 * SCALE} y2={OFFSET_Y + line.y2 * SCALE}
                      stroke="#333333" strokeWidth="3" strokeLinecap="round" />
                  ))}
                  {/* Doors */}
                  {doors.map(door => {
                    const isVertical = door.orientation === 'vertical'
                    const hingeX = OFFSET_X + door.x * SCALE
                    const hingeY = OFFSET_Y + door.y * SCALE
                    const endX = isVertical ? hingeX : hingeX + door.width * SCALE
                    const endY = isVertical ? hingeY + door.width * SCALE : hingeY
                    return (
                      <line key={door.id} x1={hingeX} y1={hingeY} x2={endX} y2={endY}
                        stroke="#90EE90" strokeWidth="3" strokeLinecap="round" />
                    )
                  })}
                  {/* Windows */}
                  {windows.map(win => {
                    const isVertical = win.orientation === 'vertical'
                    const x1 = OFFSET_X + win.x * SCALE
                    const y1 = OFFSET_Y + win.y * SCALE
                    const x2 = isVertical ? x1 : x1 + win.width * SCALE
                    const y2 = isVertical ? y1 + win.width * SCALE : y1
                    return (
                      <line key={win.id} x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="#87CEEB" strokeWidth="3" strokeDasharray="6,3" strokeLinecap="round" />
                    )
                  })}
                </g>
              )})()}

              {/* ===== INTEGRATE MODE - ADU ===== */}
              {mode === 'integrate' && (aduLines[0].length > 0 || aduLines[1].length > 0) && (() => {
                // Calculate center of ADU for rotation
                const allLines = [...aduLines[0], ...aduLines[1]]
                if (allLines.length === 0) return null
                const allX = allLines.flatMap(l => [l.x1, l.x2])
                const allY = allLines.flatMap(l => [l.y1, l.y2])
                const minX = Math.min(...allX)
                const maxX = Math.max(...allX)
                const minY = Math.min(...allY)
                const maxY = Math.max(...allY)
                const centerX = OFFSET_X + ((minX + maxX) / 2) * SCALE
                const centerY = OFFSET_Y + ((minY + maxY) / 2) * SCALE

                return (
                <g
                  transform={`translate(${aduPosition.x * SCALE}, ${aduPosition.y * SCALE}) rotate(${aduRotation}, ${centerX}, ${centerY})`}
                  style={{ cursor: 'move' }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    const pos = mouseToGrid(e)
                    setSelectedStructure('adu')
                    setSelectedAmenity(null)
                    setDragging({ type: 'structure', structure: 'adu', startPos: pos, origPos: { ...aduPosition } })
                  }}
                >
                  {/* Bounding box for ADU */}
                  {selectedStructure === 'adu' && (
                    <rect
                      x={OFFSET_X + (minX - 2) * SCALE}
                      y={OFFSET_Y + (minY - 2) * SCALE}
                      width={(maxX - minX + 4) * SCALE}
                      height={(maxY - minY + 4) * SCALE}
                      fill="none"
                      stroke="#f0c040"
                      strokeWidth="2"
                      strokeDasharray="8,4"
                    />
                  )}
                  {/* ADU label */}
                  <text
                    x={OFFSET_X + 5}
                    y={OFFSET_Y - 5}
                    fill="#6a4a8a"
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="Courier New"
                  >
                    ADU
                  </text>
                  {/* Floor 0 walls */}
                  {aduLines[0].map(line => (
                    <line key={line.id}
                      x1={OFFSET_X + line.x1 * SCALE} y1={OFFSET_Y + line.y1 * SCALE}
                      x2={OFFSET_X + line.x2 * SCALE} y2={OFFSET_Y + line.y2 * SCALE}
                      stroke="#6a4a8a" strokeWidth="3" strokeLinecap="round" />
                  ))}
                  {/* Floor 1 walls (dashed to show it's upper floor) */}
                  {aduLines[1].map(line => (
                    <line key={line.id}
                      x1={OFFSET_X + line.x1 * SCALE} y1={OFFSET_Y + line.y1 * SCALE}
                      x2={OFFSET_X + line.x2 * SCALE} y2={OFFSET_Y + line.y2 * SCALE}
                      stroke="#8a6aaa" strokeWidth="2" strokeDasharray="8,4" strokeLinecap="round" />
                  ))}
                  {/* Doors */}
                  {[...aduDoors[0], ...aduDoors[1]].map(door => {
                    const isVertical = door.orientation === 'vertical'
                    const hingeX = OFFSET_X + door.x * SCALE
                    const hingeY = OFFSET_Y + door.y * SCALE
                    const endX = isVertical ? hingeX : hingeX + door.width * SCALE
                    const endY = isVertical ? hingeY + door.width * SCALE : hingeY
                    return (
                      <line key={door.id} x1={hingeX} y1={hingeY} x2={endX} y2={endY}
                        stroke="#90EE90" strokeWidth="3" strokeLinecap="round" />
                    )
                  })}
                  {/* Windows */}
                  {[...aduWindows[0], ...aduWindows[1]].map(win => {
                    const isVertical = win.orientation === 'vertical'
                    const x1 = OFFSET_X + win.x * SCALE
                    const y1 = OFFSET_Y + win.y * SCALE
                    const x2 = isVertical ? x1 : x1 + win.width * SCALE
                    const y2 = isVertical ? y1 + win.width * SCALE : y1
                    return (
                      <line key={win.id} x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="#87CEEB" strokeWidth="3" strokeDasharray="6,3" strokeLinecap="round" />
                    )
                  })}
                </g>
              )})()}

              {/* ===== AMENITIES (shown in Integrate & Surroundings modes) ===== */}
              {(mode === 'integrate' || mode === 'surroundings') && surroundingsVisible.amenities !== false && amenities.map(amenity => {
                const isSelected = selectedAmenity === amenity.id
                const centerX = OFFSET_X + (amenity.x + amenity.width / 2) * SCALE
                const centerY = OFFSET_Y + (amenity.y + amenity.height / 2) * SCALE

                return (
                  <g
                    key={`amenity-${amenity.id}`}
                    transform={`rotate(${amenity.rotation}, ${centerX}, ${centerY})`}
                    style={{ cursor: 'move' }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      const pos = mouseToGrid(e)
                      setSelectedAmenity(amenity.id)
                      setSelectedStructure(null)
                      setDragging({ type: 'amenity', id: amenity.id, startPos: pos, origPos: { x: amenity.x, y: amenity.y } })
                    }}
                  >
                    {/* Render based on shape */}
                    {amenity.shape === 'circle' ? (
                      <circle
                        cx={OFFSET_X + (amenity.x + amenity.width / 2) * SCALE}
                        cy={OFFSET_Y + (amenity.y + amenity.height / 2) * SCALE}
                        r={(amenity.width / 2) * SCALE}
                        fill={amenity.color}
                        fillOpacity={0.7}
                        stroke={isSelected ? '#f0c040' : amenity.color}
                        strokeWidth={isSelected ? 3 : 2}
                      />
                    ) : amenity.shape === 'kidney' ? (
                      <path
                        d={`M ${OFFSET_X + amenity.x * SCALE + amenity.width * SCALE * 0.2} ${OFFSET_Y + amenity.y * SCALE}
                           Q ${OFFSET_X + amenity.x * SCALE + amenity.width * SCALE * 0.8} ${OFFSET_Y + amenity.y * SCALE}
                             ${OFFSET_X + amenity.x * SCALE + amenity.width * SCALE} ${OFFSET_Y + amenity.y * SCALE + amenity.height * SCALE * 0.3}
                           Q ${OFFSET_X + amenity.x * SCALE + amenity.width * SCALE * 1.1} ${OFFSET_Y + amenity.y * SCALE + amenity.height * SCALE * 0.7}
                             ${OFFSET_X + amenity.x * SCALE + amenity.width * SCALE * 0.7} ${OFFSET_Y + amenity.y * SCALE + amenity.height * SCALE}
                           Q ${OFFSET_X + amenity.x * SCALE + amenity.width * SCALE * 0.3} ${OFFSET_Y + amenity.y * SCALE + amenity.height * SCALE}
                             ${OFFSET_X + amenity.x * SCALE} ${OFFSET_Y + amenity.y * SCALE + amenity.height * SCALE * 0.6}
                           Q ${OFFSET_X + amenity.x * SCALE - amenity.width * SCALE * 0.1} ${OFFSET_Y + amenity.y * SCALE + amenity.height * SCALE * 0.2}
                             ${OFFSET_X + amenity.x * SCALE + amenity.width * SCALE * 0.2} ${OFFSET_Y + amenity.y * SCALE}
                           Z`}
                        fill={amenity.color}
                        fillOpacity={0.7}
                        stroke={isSelected ? '#f0c040' : amenity.color}
                        strokeWidth={isSelected ? 3 : 2}
                      />
                    ) : amenity.shape === 'l-shape' ? (
                      <path
                        d={`M ${OFFSET_X + amenity.x * SCALE} ${OFFSET_Y + amenity.y * SCALE}
                           L ${OFFSET_X + (amenity.x + amenity.width * 0.6) * SCALE} ${OFFSET_Y + amenity.y * SCALE}
                           L ${OFFSET_X + (amenity.x + amenity.width * 0.6) * SCALE} ${OFFSET_Y + (amenity.y + amenity.height * 0.5) * SCALE}
                           L ${OFFSET_X + (amenity.x + amenity.width) * SCALE} ${OFFSET_Y + (amenity.y + amenity.height * 0.5) * SCALE}
                           L ${OFFSET_X + (amenity.x + amenity.width) * SCALE} ${OFFSET_Y + (amenity.y + amenity.height) * SCALE}
                           L ${OFFSET_X + amenity.x * SCALE} ${OFFSET_Y + (amenity.y + amenity.height) * SCALE}
                           Z`}
                        fill={amenity.color}
                        fillOpacity={0.7}
                        stroke={isSelected ? '#f0c040' : amenity.color}
                        strokeWidth={isSelected ? 3 : 2}
                      />
                    ) : amenity.shape === 'octagon' ? (
                      <polygon
                        points={(() => {
                          const cx = OFFSET_X + (amenity.x + amenity.width / 2) * SCALE
                          const cy = OFFSET_Y + (amenity.y + amenity.height / 2) * SCALE
                          const r = (amenity.width / 2) * SCALE
                          return Array.from({ length: 8 }, (_, i) => {
                            const angle = (i * 45 - 22.5) * Math.PI / 180
                            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
                          }).join(' ')
                        })()}
                        fill={amenity.color}
                        fillOpacity={0.7}
                        stroke={isSelected ? '#f0c040' : amenity.color}
                        strokeWidth={isSelected ? 3 : 2}
                      />
                    ) : (
                      <rect
                        x={OFFSET_X + amenity.x * SCALE}
                        y={OFFSET_Y + amenity.y * SCALE}
                        width={amenity.width * SCALE}
                        height={amenity.height * SCALE}
                        fill={amenity.color}
                        fillOpacity={0.7}
                        stroke={isSelected ? '#f0c040' : amenity.color}
                        strokeWidth={isSelected ? 3 : 2}
                        rx={amenity.type.includes('pool') ? 4 : 0}
                      />
                    )}
                    {/* Label */}
                    <text
                      x={OFFSET_X + (amenity.x + amenity.width / 2) * SCALE}
                      y={OFFSET_Y + (amenity.y + amenity.height / 2) * SCALE}
                      fill="#fff"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="Courier New"
                      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {amenity.name}
                    </text>
                    {/* Selection indicator */}
                    {isSelected && (
                      <rect
                        x={OFFSET_X + (amenity.x - 2) * SCALE}
                        y={OFFSET_Y + (amenity.y - 2) * SCALE}
                        width={(amenity.width + 4) * SCALE}
                        height={(amenity.height + 4) * SCALE}
                        fill="none"
                        stroke="#f0c040"
                        strokeWidth="2"
                        strokeDasharray="8,4"
                      />
                    )}
                  </g>
                )
              })}

              {/* Drawing preview for walls */}
              {drawing && (
                <line x1={OFFSET_X + drawing.x1 * SCALE} y1={OFFSET_Y + drawing.y1 * SCALE}
                  x2={OFFSET_X + drawing.x2 * SCALE} y2={OFFSET_Y + drawing.y2 * SCALE}
                  stroke="#333333" strokeWidth="3" strokeDasharray="5,5" />
              )}

              {/* Selection box */}
              {selectionBox && (
                <rect
                  x={OFFSET_X + Math.min(selectionBox.x1, selectionBox.x2) * SCALE}
                  y={OFFSET_Y + Math.min(selectionBox.y1, selectionBox.y2) * SCALE}
                  width={Math.abs(selectionBox.x2 - selectionBox.x1) * SCALE}
                  height={Math.abs(selectionBox.y2 - selectionBox.y1) * SCALE}
                  fill="rgba(255, 102, 0, 0.1)"
                  stroke="#ff6600"
                  strokeWidth="1"
                  strokeDasharray="4,2"
                />
              )}
            </svg>

            {tool === 'draw' && mode !== 'lot' && <div className="add-hint">Click and drag to draw a wall</div>}
            {tool === 'boundary' && mode !== 'lot' && <div className="add-hint">Click and drag to draw a planning boundary</div>}
            {tool === 'door' && mode !== 'lot' && <div className="add-hint">Click to place a door, then adjust size in properties</div>}
            {tool === 'window' && mode !== 'lot' && <div className="add-hint">Click to place a window, then adjust size in properties</div>}
            {tool === 'area' && mode !== 'lot' && <div className="add-hint" style={{ background: '#333', padding: '8px 16px', borderRadius: '4px' }}>
              <strong style={{ color: '#f0c040' }}>Define Room:</strong> Click on walls to select them (they turn teal). Need 3+ walls for a room. See panel on left for steps.
            </div>}
            {mode === 'adu' && <div className="floor-indicator">Floor {aduFloor + 1}</div>}
            {mode === 'integrate' && <div className="add-hint">Click and drag structures to position them on the lot</div>}
            {mode === 'lot' && isTracingLot && <div className="lot-tracing-hint">Click to add boundary points • Press Complete when done</div>}
            {mode === 'lot' && !isTracingLot && lotBoundary.length === 0 && <div className="add-hint">Upload an aerial photo and trace your lot boundary</div>}
            </div>
          </div>
          </div>
        </div>

        <div className="properties-panel">
          {mode === 'integrate' && selectedStructure === 'house' ? (
            <>
              <h3>Main House</h3>
              <div className="prop-row">
                <div className="prop-group">
                  <label>X</label>
                  <input type="number" value={housePosition.x} step="0.5"
                    onChange={(e) => setHousePosition({ ...housePosition, x: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="prop-group">
                  <label>Y</label>
                  <input type="number" value={housePosition.y} step="0.5"
                    onChange={(e) => setHousePosition({ ...housePosition, y: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="prop-group">
                <label>Rotation</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={houseRotation}
                    onChange={(e) => setHouseRotation(parseInt(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#8ab4d4', minWidth: '40px' }}>{houseRotation}°</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <button onClick={() => setHouseRotation(0)} style={{ flex: 1, fontSize: '0.65rem' }}>0°</button>
                  <button onClick={() => setHouseRotation(90)} style={{ flex: 1, fontSize: '0.65rem' }}>90°</button>
                  <button onClick={() => setHouseRotation(180)} style={{ flex: 1, fontSize: '0.65rem' }}>180°</button>
                  <button onClick={() => setHouseRotation(-90)} style={{ flex: 1, fontSize: '0.65rem' }}>-90°</button>
                </div>
              </div>
              <div className="prop-group">
                <label>Stats</label>
                <div style={{ fontSize: '0.7rem', color: '#8ab4d4' }}>
                  <div>{lines.length} walls</div>
                  <div>{doors.length} doors</div>
                  <div>{windows.length} windows</div>
                  <div>{areas.length} rooms</div>
                  <div>{areas.reduce((sum, a) => sum + getAreaSqFt(a), 0).toFixed(0)} SF total</div>
                </div>
              </div>
              <div className="prop-actions">
                <button onClick={() => setSelectedStructure(null)}>Deselect</button>
              </div>
            </>
          ) : mode === 'integrate' && selectedStructure === 'adu' ? (
            <>
              <h3>ADU</h3>
              <div className="prop-row">
                <div className="prop-group">
                  <label>X</label>
                  <input type="number" value={aduPosition.x} step="0.5"
                    onChange={(e) => setAduPosition({ ...aduPosition, x: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="prop-group">
                  <label>Y</label>
                  <input type="number" value={aduPosition.y} step="0.5"
                    onChange={(e) => setAduPosition({ ...aduPosition, y: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="prop-group">
                <label>Rotation</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={aduRotation}
                    onChange={(e) => setAduRotation(parseInt(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#8ab4d4', minWidth: '40px' }}>{aduRotation}°</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <button onClick={() => setAduRotation(0)} style={{ flex: 1, fontSize: '0.65rem' }}>0°</button>
                  <button onClick={() => setAduRotation(90)} style={{ flex: 1, fontSize: '0.65rem' }}>90°</button>
                  <button onClick={() => setAduRotation(180)} style={{ flex: 1, fontSize: '0.65rem' }}>180°</button>
                  <button onClick={() => setAduRotation(-90)} style={{ flex: 1, fontSize: '0.65rem' }}>-90°</button>
                </div>
              </div>
              <div className="prop-group">
                <label>Stats</label>
                <div style={{ fontSize: '0.7rem', color: '#8ab4d4' }}>
                  <div>Floor 1: {aduLines[0].length} walls, {aduAreas[0].reduce((sum, a) => sum + getAreaSqFt(a, aduLines[0]), 0).toFixed(0)} SF</div>
                  <div>Floor 2: {aduLines[1].length} walls, {aduAreas[1].reduce((sum, a) => sum + getAreaSqFt(a, aduLines[1]), 0).toFixed(0)} SF</div>
                  <div>{aduDoors[0].length + aduDoors[1].length} doors</div>
                  <div>{aduWindows[0].length + aduWindows[1].length} windows</div>
                </div>
              </div>
              <div className="prop-actions">
                <button onClick={() => setSelectedStructure(null)}>Deselect</button>
              </div>
            </>
          ) : (mode === 'integrate' || mode === 'surroundings') && selectedAmenity ? (
            <>
              <h3>Amenity</h3>
              {(() => {
                const amenity = amenities.find(a => a.id === selectedAmenity)
                if (!amenity) return null
                return (
                  <>
                    <div className="prop-group">
                      <label>Type</label>
                      <div style={{ fontSize: '0.75rem', color: '#8ab4d4' }}>{amenity.name}</div>
                    </div>
                    <div className="prop-row">
                      <div className="prop-group">
                        <label>X</label>
                        <input type="number" value={amenity.x} step="0.5"
                          onChange={(e) => setAmenities(amenities.map(a => a.id === selectedAmenity ? { ...a, x: parseFloat(e.target.value) || 0 } : a))} />
                      </div>
                      <div className="prop-group">
                        <label>Y</label>
                        <input type="number" value={amenity.y} step="0.5"
                          onChange={(e) => setAmenities(amenities.map(a => a.id === selectedAmenity ? { ...a, y: parseFloat(e.target.value) || 0 } : a))} />
                      </div>
                    </div>
                    <div className="prop-row">
                      <div className="prop-group">
                        <label>Width</label>
                        <input type="number" value={amenity.width} step="1" min="1"
                          onChange={(e) => setAmenities(amenities.map(a => a.id === selectedAmenity ? { ...a, width: parseFloat(e.target.value) || 1 } : a))} />
                      </div>
                      <div className="prop-group">
                        <label>Height</label>
                        <input type="number" value={amenity.height} step="1" min="1"
                          onChange={(e) => setAmenities(amenities.map(a => a.id === selectedAmenity ? { ...a, height: parseFloat(e.target.value) || 1 } : a))} />
                      </div>
                    </div>
                    <div className="prop-group">
                      <label>Rotation</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={amenity.rotation}
                          onChange={(e) => setAmenities(amenities.map(a => a.id === selectedAmenity ? { ...a, rotation: parseInt(e.target.value) } : a))}
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#8ab4d4', minWidth: '40px' }}>{amenity.rotation}°</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button onClick={() => setAmenities(amenities.map(a => a.id === selectedAmenity ? { ...a, rotation: 0 } : a))} style={{ flex: 1, fontSize: '0.65rem' }}>0°</button>
                        <button onClick={() => setAmenities(amenities.map(a => a.id === selectedAmenity ? { ...a, rotation: 90 } : a))} style={{ flex: 1, fontSize: '0.65rem' }}>90°</button>
                        <button onClick={() => setAmenities(amenities.map(a => a.id === selectedAmenity ? { ...a, rotation: 180 } : a))} style={{ flex: 1, fontSize: '0.65rem' }}>180°</button>
                        <button onClick={() => setAmenities(amenities.map(a => a.id === selectedAmenity ? { ...a, rotation: -90 } : a))} style={{ flex: 1, fontSize: '0.65rem' }}>-90°</button>
                      </div>
                    </div>
                    <div className="prop-group">
                      <label>Dimensions</label>
                      <div style={{ fontSize: '0.7rem', color: '#8ab4d4' }}>
                        {amenity.width}' × {amenity.height}' = {(amenity.width * amenity.height).toFixed(0)} SF
                      </div>
                    </div>
                    <div className="prop-actions">
                      <button onClick={() => setSelectedAmenity(null)}>Deselect</button>
                      <button className="danger" onClick={() => {
                        setAmenities(amenities.filter(a => a.id !== selectedAmenity))
                        setSelectedAmenity(null)
                      }}>Delete</button>
                    </div>
                  </>
                )
              })()}
            </>
          ) : selectedLineData ? (
            <>
              <h3>Wall Properties</h3>
              <div className="prop-group">
                <label>Length</label>
                <div className="area-display">{getLineLength(selectedLineData).toFixed(1)} ft</div>
              </div>
              <div className="prop-row">
                <div className="prop-group">
                  <label>X1</label>
                  <input type="number" value={selectedLineData.x1} step="0.5"
                    onChange={(e) => setCurrentLines(currentLines.map(l => l.id === selectedLine ? { ...l, x1: parseFloat(e.target.value) || 0 } : l))} />
                </div>
                <div className="prop-group">
                  <label>Y1</label>
                  <input type="number" value={selectedLineData.y1} step="0.5"
                    onChange={(e) => setCurrentLines(currentLines.map(l => l.id === selectedLine ? { ...l, y1: parseFloat(e.target.value) || 0 } : l))} />
                </div>
              </div>
              <div className="prop-row">
                <div className="prop-group">
                  <label>X2</label>
                  <input type="number" value={selectedLineData.x2} step="0.5"
                    onChange={(e) => setCurrentLines(currentLines.map(l => l.id === selectedLine ? { ...l, x2: parseFloat(e.target.value) || 0 } : l))} />
                </div>
                <div className="prop-group">
                  <label>Y2</label>
                  <input type="number" value={selectedLineData.y2} step="0.5"
                    onChange={(e) => setCurrentLines(currentLines.map(l => l.id === selectedLine ? { ...l, y2: parseFloat(e.target.value) || 0 } : l))} />
                </div>
              </div>
              <div className="prop-actions">
                <button className="danger" onClick={() => { saveToHistory(); deleteLine(selectedLine); }}>Delete</button>
              </div>
            </>
          ) : selectedAreaData ? (
            <>
              <h3>Room Properties</h3>
              <div className="prop-group">
                <label>Name</label>
                <input type="text" value={selectedAreaData.name}
                  onChange={(e) => setCurrentAreas(currentAreas.map(a => a.id === selectedArea ? { ...a, name: e.target.value } : a))} />
              </div>
              <div className="prop-group">
                <label>Area</label>
                <div className="area-display">{getAreaSqFt(selectedAreaData).toFixed(0)} SF</div>
              </div>
              <div className="prop-group">
                <label>Walls</label>
                <div style={{ fontSize: '0.75rem', color: '#8ab4d4' }}>{selectedAreaData.lineIds.length} walls</div>
              </div>
              <div className="prop-actions">
                <button className="danger" onClick={() => { saveToHistory(); deleteArea(selectedArea); }}>Delete Room</button>
              </div>
            </>
          ) : selectedDoorData ? (
            <>
              <h3>Door Properties</h3>
              <div className="prop-group">
                <label>Width (ft)</label>
                <input
                  type="number"
                  value={selectedDoorData.width}
                  step="0.5"
                  min="1"
                  max="10"
                  onChange={(e) => setCurrentDoors(currentDoors.map(d => d.id === selectedDoor ? { ...d, width: parseFloat(e.target.value) || 3 } : d))}
                />
              </div>
              <div className="prop-group">
                <label>Orientation</label>
                <div className="swing-buttons" style={{ marginTop: '4px' }}>
                  <button
                    className={selectedDoorData.orientation === 'horizontal' ? 'active' : ''}
                    onClick={() => setCurrentDoors(currentDoors.map(d => d.id === selectedDoor ? { ...d, orientation: 'horizontal' } : d))}
                  >— Horiz</button>
                  <button
                    className={selectedDoorData.orientation === 'vertical' ? 'active' : ''}
                    onClick={() => setCurrentDoors(currentDoors.map(d => d.id === selectedDoor ? { ...d, orientation: 'vertical' } : d))}
                  >| Vert</button>
                </div>
              </div>
              <div className="prop-group">
                <label>Swing Direction</label>
                <div className="swing-buttons" style={{ marginTop: '4px' }}>
                  <button
                    className={selectedDoorData.swing === 'left' ? 'active' : ''}
                    onClick={() => setCurrentDoors(currentDoors.map(d => d.id === selectedDoor ? { ...d, swing: 'left' } : d))}
                  >{selectedDoorData.orientation === 'vertical' ? '← Left' : '↑ Up'}</button>
                  <button
                    className={selectedDoorData.swing === 'right' ? 'active' : ''}
                    onClick={() => setCurrentDoors(currentDoors.map(d => d.id === selectedDoor ? { ...d, swing: 'right' } : d))}
                  >{selectedDoorData.orientation === 'vertical' ? 'Right →' : 'Down ↓'}</button>
                </div>
              </div>
              <div className="prop-row">
                <div className="prop-group">
                  <label>X</label>
                  <input type="number" value={selectedDoorData.x} step="0.5"
                    onChange={(e) => setCurrentDoors(currentDoors.map(d => d.id === selectedDoor ? { ...d, x: parseFloat(e.target.value) || 0 } : d))} />
                </div>
                <div className="prop-group">
                  <label>Y</label>
                  <input type="number" value={selectedDoorData.y} step="0.5"
                    onChange={(e) => setCurrentDoors(currentDoors.map(d => d.id === selectedDoor ? { ...d, y: parseFloat(e.target.value) || 0 } : d))} />
                </div>
              </div>
              <div className="prop-actions">
                <button onClick={snapToWallCenter}>Snap to Wall Center</button>
                <button className="danger" onClick={() => { saveToHistory(); deleteDoor(selectedDoor); }}>Delete</button>
              </div>
            </>
          ) : selectedWindowData ? (
            <>
              <h3>Window Properties</h3>
              <div className="prop-group">
                <label>Width (ft)</label>
                <input
                  type="number"
                  value={selectedWindowData.width}
                  step="0.5"
                  min="1"
                  max="15"
                  onChange={(e) => setCurrentWindows(currentWindows.map(w => w.id === selectedWindow ? { ...w, width: parseFloat(e.target.value) || 3 } : w))}
                />
              </div>
              <div className="prop-group">
                <label>Orientation</label>
                <div className="swing-buttons" style={{ marginTop: '4px' }}>
                  <button
                    className={selectedWindowData.orientation === 'horizontal' ? 'active' : ''}
                    onClick={() => setCurrentWindows(currentWindows.map(w => w.id === selectedWindow ? { ...w, orientation: 'horizontal' } : w))}
                  >— Horiz</button>
                  <button
                    className={selectedWindowData.orientation === 'vertical' ? 'active' : ''}
                    onClick={() => setCurrentWindows(currentWindows.map(w => w.id === selectedWindow ? { ...w, orientation: 'vertical' } : w))}
                  >| Vert</button>
                </div>
              </div>
              <div className="prop-row">
                <div className="prop-group">
                  <label>X</label>
                  <input type="number" value={selectedWindowData.x} step="0.5"
                    onChange={(e) => setCurrentWindows(currentWindows.map(w => w.id === selectedWindow ? { ...w, x: parseFloat(e.target.value) || 0 } : w))} />
                </div>
                <div className="prop-group">
                  <label>Y</label>
                  <input type="number" value={selectedWindowData.y} step="0.5"
                    onChange={(e) => setCurrentWindows(currentWindows.map(w => w.id === selectedWindow ? { ...w, y: parseFloat(e.target.value) || 0 } : w))} />
                </div>
              </div>
              <div className="prop-actions">
                <button onClick={snapToWallCenter}>Snap to Wall Center</button>
                <button className="danger" onClick={() => { saveToHistory(); deleteWindow(selectedWindow); }}>Delete</button>
              </div>
            </>
          ) : selectedStair ? (
            <>
              <h3>Stair Properties</h3>
              {(() => {
                const stair = currentStairs.find(s => s.id === selectedStair)
                if (!stair) return null
                return (
                  <>
                    <div className="prop-group">
                      <label>Type</label>
                      <div className="area-display">{stair.name}</div>
                    </div>
                    <div className="prop-group">
                      <label>Dimensions</label>
                      <div className="area-display">{stair.width}' × {stair.length}'</div>
                    </div>
                    <div className="prop-row">
                      <div className="prop-group">
                        <label>X</label>
                        <input type="number" value={stair.x} step="0.5"
                          onChange={(e) => { saveToHistory(); setCurrentStairs(currentStairs.map(s => s.id === selectedStair ? { ...s, x: parseFloat(e.target.value) || 0 } : s)) }} />
                      </div>
                      <div className="prop-group">
                        <label>Y</label>
                        <input type="number" value={stair.y} step="0.5"
                          onChange={(e) => { saveToHistory(); setCurrentStairs(currentStairs.map(s => s.id === selectedStair ? { ...s, y: parseFloat(e.target.value) || 0 } : s)) }} />
                      </div>
                    </div>
                    <div className="prop-group">
                      <label>Rotation</label>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button onClick={() => { saveToHistory(); setCurrentStairs(currentStairs.map(s => s.id === selectedStair ? { ...s, rotation: 0 } : s)) }}
                          className={(stair.rotation || 0) === 0 ? 'active' : ''} style={{ flex: 1 }}>0°</button>
                        <button onClick={() => { saveToHistory(); setCurrentStairs(currentStairs.map(s => s.id === selectedStair ? { ...s, rotation: 90 } : s)) }}
                          className={(stair.rotation || 0) === 90 ? 'active' : ''} style={{ flex: 1 }}>90°</button>
                        <button onClick={() => { saveToHistory(); setCurrentStairs(currentStairs.map(s => s.id === selectedStair ? { ...s, rotation: 180 } : s)) }}
                          className={(stair.rotation || 0) === 180 ? 'active' : ''} style={{ flex: 1 }}>180°</button>
                        <button onClick={() => { saveToHistory(); setCurrentStairs(currentStairs.map(s => s.id === selectedStair ? { ...s, rotation: 270 } : s)) }}
                          className={(stair.rotation || 0) === 270 ? 'active' : ''} style={{ flex: 1 }}>270°</button>
                      </div>
                    </div>
                    <div className="prop-actions">
                      <button className="danger" onClick={() => { saveToHistory(); setCurrentStairs(currentStairs.filter(s => s.id !== selectedStair)); setSelectedStair(null); }}>Delete Stair</button>
                    </div>
                  </>
                )
              })()}
            </>
          ) : selectedBoundary ? (
            <>
              <h3>Boundary Properties</h3>
              {(() => {
                const boundary = currentBoundaries.find(b => b.id === selectedBoundary)
                if (!boundary) return null
                const length = Math.sqrt((boundary.x2 - boundary.x1) ** 2 + (boundary.y2 - boundary.y1) ** 2)
                return (
                  <>
                    <div className="prop-group">
                      <label>Label</label>
                      <input type="text" value={boundary.label || ''}
                        onChange={(e) => { saveToHistory(); setCurrentBoundaries(currentBoundaries.map(b => b.id === selectedBoundary ? { ...b, label: e.target.value } : b)) }}
                        placeholder="e.g., Open Area" />
                    </div>
                    <div className="prop-group">
                      <label>Length</label>
                      <div className="area-display">{length.toFixed(1)} ft</div>
                    </div>
                    <div className="prop-row">
                      <div className="prop-group">
                        <label>X1</label>
                        <input type="number" value={boundary.x1} step="0.5"
                          onChange={(e) => { saveToHistory(); setCurrentBoundaries(currentBoundaries.map(b => b.id === selectedBoundary ? { ...b, x1: parseFloat(e.target.value) || 0 } : b)) }} />
                      </div>
                      <div className="prop-group">
                        <label>Y1</label>
                        <input type="number" value={boundary.y1} step="0.5"
                          onChange={(e) => { saveToHistory(); setCurrentBoundaries(currentBoundaries.map(b => b.id === selectedBoundary ? { ...b, y1: parseFloat(e.target.value) || 0 } : b)) }} />
                      </div>
                    </div>
                    <div className="prop-row">
                      <div className="prop-group">
                        <label>X2</label>
                        <input type="number" value={boundary.x2} step="0.5"
                          onChange={(e) => { saveToHistory(); setCurrentBoundaries(currentBoundaries.map(b => b.id === selectedBoundary ? { ...b, x2: parseFloat(e.target.value) || 0 } : b)) }} />
                      </div>
                      <div className="prop-group">
                        <label>Y2</label>
                        <input type="number" value={boundary.y2} step="0.5"
                          onChange={(e) => { saveToHistory(); setCurrentBoundaries(currentBoundaries.map(b => b.id === selectedBoundary ? { ...b, y2: parseFloat(e.target.value) || 0 } : b)) }} />
                      </div>
                    </div>
                    <div className="prop-actions">
                      <button className="danger" onClick={() => { saveToHistory(); setCurrentBoundaries(currentBoundaries.filter(b => b.id !== selectedBoundary)); setSelectedBoundary(null); }}>Delete Boundary</button>
                    </div>
                  </>
                )
              })()}
            </>
          ) : selectedFurniture ? (
            <>
              <h3>Furniture Properties</h3>
              {(() => {
                const item = currentFurniture.find(f => f.id === selectedFurniture)
                if (!item) return null
                return (
                  <>
                    <div className="prop-group">
                      <label>Item</label>
                      <div className="area-display">{item.name}</div>
                    </div>
                    <div className="prop-group">
                      <label>Size</label>
                      <div className="area-display">{item.width}' × {item.depth}'</div>
                    </div>
                    <div className="prop-row">
                      <div className="prop-group">
                        <label>X</label>
                        <input type="number" value={item.x} step="0.5"
                          onChange={(e) => { saveToHistory(); setCurrentFurniture(currentFurniture.map(f => f.id === selectedFurniture ? { ...f, x: parseFloat(e.target.value) || 0 } : f)) }} />
                      </div>
                      <div className="prop-group">
                        <label>Y</label>
                        <input type="number" value={item.y} step="0.5"
                          onChange={(e) => { saveToHistory(); setCurrentFurniture(currentFurniture.map(f => f.id === selectedFurniture ? { ...f, y: parseFloat(e.target.value) || 0 } : f)) }} />
                      </div>
                    </div>
                    <div className="prop-group">
                      <label>Rotation</label>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button onClick={() => { saveToHistory(); setCurrentFurniture(currentFurniture.map(f => f.id === selectedFurniture ? { ...f, rotation: 0 } : f)) }}
                          className={(item.rotation || 0) === 0 ? 'active' : ''} style={{ flex: 1 }}>0°</button>
                        <button onClick={() => { saveToHistory(); setCurrentFurniture(currentFurniture.map(f => f.id === selectedFurniture ? { ...f, rotation: 90 } : f)) }}
                          className={(item.rotation || 0) === 90 ? 'active' : ''} style={{ flex: 1 }}>90°</button>
                        <button onClick={() => { saveToHistory(); setCurrentFurniture(currentFurniture.map(f => f.id === selectedFurniture ? { ...f, rotation: 180 } : f)) }}
                          className={(item.rotation || 0) === 180 ? 'active' : ''} style={{ flex: 1 }}>180°</button>
                        <button onClick={() => { saveToHistory(); setCurrentFurniture(currentFurniture.map(f => f.id === selectedFurniture ? { ...f, rotation: 270 } : f)) }}
                          className={(item.rotation || 0) === 270 ? 'active' : ''} style={{ flex: 1 }}>270°</button>
                      </div>
                    </div>
                    <div className="prop-actions">
                      <button className="danger" onClick={() => { saveToHistory(); setCurrentFurniture(currentFurniture.filter(f => f.id !== selectedFurniture)); setSelectedFurniture(null); }}>Delete</button>
                    </div>
                  </>
                )
              })()}
            </>
          ) : selectedTree ? (
            <>
              <h3>Tree Properties</h3>
              <div className="prop-group">
                <label>Size</label>
                <select
                  value={trees.find(t => t.id === selectedTree)?.size || 'medium'}
                  onChange={(e) => setTrees(trees.map(t => t.id === selectedTree ? { ...t, size: e.target.value } : t))}
                  style={{ width: '100%', padding: '10px', background: '#2a2a2a', border: '2px solid #444444', color: '#ffffff', borderRadius: '4px', fontWeight: '600' }}
                >
                  <option value="small">Small (8' canopy)</option>
                  <option value="medium">Medium (15' canopy)</option>
                  <option value="large">Large (25' canopy)</option>
                </select>
              </div>
              <div className="prop-row">
                <div className="prop-group">
                  <label>X</label>
                  <input type="number" value={trees.find(t => t.id === selectedTree)?.x || 0} step="0.5"
                    onChange={(e) => setTrees(trees.map(t => t.id === selectedTree ? { ...t, x: parseFloat(e.target.value) || 0 } : t))} />
                </div>
                <div className="prop-group">
                  <label>Y</label>
                  <input type="number" value={trees.find(t => t.id === selectedTree)?.y || 0} step="0.5"
                    onChange={(e) => setTrees(trees.map(t => t.id === selectedTree ? { ...t, y: parseFloat(e.target.value) || 0 } : t))} />
                </div>
              </div>
              <div className="prop-actions">
                <button className="danger" onClick={() => { setTrees(trees.filter(t => t.id !== selectedTree)); setSelectedTree(null); }}>Delete Tree</button>
              </div>
            </>
          ) : selectedBush ? (
            <>
              <h3>Bush Properties</h3>
              <div className="prop-group">
                <label>Size</label>
                <select
                  value={bushes.find(b => b.id === selectedBush)?.size || 'small'}
                  onChange={(e) => setBushes(bushes.map(b => b.id === selectedBush ? { ...b, size: e.target.value } : b))}
                  style={{ width: '100%', padding: '10px', background: '#2a2a2a', border: '2px solid #444444', color: '#ffffff', borderRadius: '4px', fontWeight: '600' }}
                >
                  <option value="small">Small (3' width)</option>
                  <option value="medium">Medium (5' width)</option>
                </select>
              </div>
              <div className="prop-row">
                <div className="prop-group">
                  <label>X</label>
                  <input type="number" value={bushes.find(b => b.id === selectedBush)?.x || 0} step="0.5"
                    onChange={(e) => setBushes(bushes.map(b => b.id === selectedBush ? { ...b, x: parseFloat(e.target.value) || 0 } : b))} />
                </div>
                <div className="prop-group">
                  <label>Y</label>
                  <input type="number" value={bushes.find(b => b.id === selectedBush)?.y || 0} step="0.5"
                    onChange={(e) => setBushes(bushes.map(b => b.id === selectedBush ? { ...b, y: parseFloat(e.target.value) || 0 } : b))} />
                </div>
              </div>
              <div className="prop-actions">
                <button className="danger" onClick={() => { setBushes(bushes.filter(b => b.id !== selectedBush)); setSelectedBush(null); }}>Delete Bush</button>
              </div>
            </>
          ) : selectedFence ? (
            <>
              <h3>Fence Properties</h3>
              <div className="prop-group">
                <label>Style</label>
                <select
                  value={fences.find(f => f.id === selectedFence)?.style || 'wood'}
                  onChange={(e) => setFences(fences.map(f => f.id === selectedFence ? { ...f, style: e.target.value } : f))}
                  style={{ width: '100%', padding: '10px', background: '#2a2a2a', border: '2px solid #444444', color: '#ffffff', borderRadius: '4px', fontWeight: '600' }}
                >
                  <option value="wood">Wood Fence</option>
                  <option value="chain">Chain Link</option>
                  <option value="privacy">Privacy Fence</option>
                </select>
              </div>
              <div className="prop-group">
                <label>Length</label>
                <div className="area-display">
                  {(() => {
                    const f = fences.find(f => f.id === selectedFence)
                    return f ? Math.sqrt((f.x2 - f.x1) ** 2 + (f.y2 - f.y1) ** 2).toFixed(1) : 0
                  })()} ft
                </div>
              </div>
              <div className="prop-row">
                <div className="prop-group">
                  <label>X1</label>
                  <input type="number" value={fences.find(f => f.id === selectedFence)?.x1 || 0} step="0.5"
                    onChange={(e) => setFences(fences.map(f => f.id === selectedFence ? { ...f, x1: parseFloat(e.target.value) || 0 } : f))} />
                </div>
                <div className="prop-group">
                  <label>Y1</label>
                  <input type="number" value={fences.find(f => f.id === selectedFence)?.y1 || 0} step="0.5"
                    onChange={(e) => setFences(fences.map(f => f.id === selectedFence ? { ...f, y1: parseFloat(e.target.value) || 0 } : f))} />
                </div>
              </div>
              <div className="prop-row">
                <div className="prop-group">
                  <label>X2</label>
                  <input type="number" value={fences.find(f => f.id === selectedFence)?.x2 || 0} step="0.5"
                    onChange={(e) => setFences(fences.map(f => f.id === selectedFence ? { ...f, x2: parseFloat(e.target.value) || 0 } : f))} />
                </div>
                <div className="prop-group">
                  <label>Y2</label>
                  <input type="number" value={fences.find(f => f.id === selectedFence)?.y2 || 0} step="0.5"
                    onChange={(e) => setFences(fences.map(f => f.id === selectedFence ? { ...f, y2: parseFloat(e.target.value) || 0 } : f))} />
                </div>
              </div>
              <div className="prop-actions">
                <button className="danger" onClick={() => { setFences(fences.filter(f => f.id !== selectedFence)); setSelectedFence(null); }}>Delete Fence</button>
              </div>
            </>
          ) : selectedDriveway ? (
            <>
              <h3>Driveway Properties</h3>
              <div className="prop-group">
                <label>Material</label>
                <select
                  value={driveways.find(d => d.id === selectedDriveway)?.material || 'concrete'}
                  onChange={(e) => setDriveways(driveways.map(d => d.id === selectedDriveway ? { ...d, material: e.target.value } : d))}
                  style={{ width: '100%', padding: '10px', background: '#2a2a2a', border: '2px solid #444444', color: '#ffffff', borderRadius: '4px', fontWeight: '600' }}
                >
                  <option value="concrete">Concrete</option>
                  <option value="asphalt">Asphalt</option>
                  <option value="gravel">Gravel</option>
                </select>
              </div>
              <div className="prop-group">
                <label>Area</label>
                <div className="area-display">
                  {(() => {
                    const d = driveways.find(d => d.id === selectedDriveway)
                    return d ? calculatePolygonArea(d.points).toFixed(0) : 0
                  })()} SF
                </div>
              </div>
              <div className="prop-actions">
                <button className="danger" onClick={() => { setDriveways(driveways.filter(d => d.id !== selectedDriveway)); setSelectedDriveway(null); }}>Delete Driveway</button>
              </div>
            </>
          ) : selectedStreet ? (
            <>
              <h3>Street (GIS Data)</h3>
              <div className="prop-group">
                <label>Name</label>
                <div style={{ color: '#ffffff', fontSize: '0.9rem', padding: '10px', background: '#2a2a2a', borderRadius: '4px', fontWeight: '600' }}>
                  {streets.find(s => s.id === selectedStreet)?.name || 'Unknown'}
                </div>
              </div>
              <div className="prop-group">
                <label>Type</label>
                <div style={{ color: '#8ab4d4', fontSize: '0.8rem' }}>
                  {streets.find(s => s.id === selectedStreet)?.type || 'Street'}
                </div>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#6a9fc0', marginTop: '8px' }}>
                This data is from Wake County GIS and is read-only.
              </div>
            </>
          ) : selectedBuilding ? (
            <>
              <h3>Building (GIS Data)</h3>
              <div className="prop-group">
                <label>Description</label>
                <div style={{ color: '#ffffff', fontSize: '0.9rem', padding: '10px', background: '#2a2a2a', borderRadius: '4px', fontWeight: '600' }}>
                  {nearbyBuildings.find(b => b.id === selectedBuilding)?.description || 'Building'}
                </div>
              </div>
              <div className="prop-group">
                <label>Area</label>
                <div className="area-display">
                  {(() => {
                    const b = nearbyBuildings.find(b => b.id === selectedBuilding)
                    return b ? calculatePolygonArea(b.points).toFixed(0) : 0
                  })()} SF
                </div>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#6a9fc0', marginTop: '8px' }}>
                This data is from Wake County GIS and is read-only.
              </div>
            </>
          ) : (
            <>
              <h3>{mode === 'adu' ? `Floor ${aduFloor + 1} Rooms` : 'Rooms'} ({currentAreas.length})</h3>
              {currentAreas.length > 0 ? (
                <div className="room-list">
                  {currentAreas.map(area => (
                    <div key={area.id} className={`room-list-item ${selectedArea === area.id ? 'selected' : ''}`}
                      onClick={() => { setSelectedArea(area.id); setSelectedLine(null); }}>
                      <span className="room-color" style={{ backgroundColor: area.color }} />
                      <span className="room-info">
                        <span className="room-name">{area.name}</span>
                        <span className="room-dims">{area.lineIds.length} walls</span>
                      </span>
                      <span className="room-area">{getAreaSqFt(area).toFixed(0)} SF</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#6a9fc0', fontSize: '0.75rem', padding: '8px' }}>
                  {mode === 'adu'
                    ? 'Select a template or draw walls to start designing.'
                    : 'Use "Define Room" tool to select walls and create rooms.'}
                </div>
              )}
              {currentAreas.length > 0 && (
                <div className="total-area">
                  <span>{mode === 'adu' ? `Floor ${aduFloor + 1}:` : 'Total:'}</span>
                  <span>{totalSqFt.toFixed(0)} SF</span>
                </div>
              )}
              {mode === 'adu' && (
                <div className="adu-total-summary">
                  <h3>ADU Total</h3>
                  <div className="adu-floor-breakdown">
                    <div className="floor-row">
                      <span>Floor 1:</span>
                      <span>{aduFloor0SqFt.toFixed(0)} SF</span>
                    </div>
                    <div className="floor-row">
                      <span>Floor 2:</span>
                      <span>{aduFloor1SqFt.toFixed(0)} SF</span>
                    </div>
                    <div className="floor-row total">
                      <span>Combined:</span>
                      <span>{aduTotalSqFt.toFixed(0)} SF</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Cost Estimator - Always visible */}
          <div className="cost-estimator">
            <div
              className="cost-estimator-header"
              onClick={() => setShowCostEstimator(!showCostEstimator)}
            >
              <h3>💰 Cost Estimator</h3>
              <span className="toggle-icon">{showCostEstimator ? '▼' : '▶'}</span>
            </div>
            {showCostEstimator && (() => {
              const estimate = calculateProjectCost()
              return (
                <div className="cost-estimator-content">
                  <div className="cost-location">
                    <span>📍 Raleigh, NC Pricing</span>
                  </div>

                  {estimate.breakdown.length === 0 ? (
                    <div className="no-costs">
                      Start designing to see cost estimates
                    </div>
                  ) : (
                    <>
                      {/* Structure costs */}
                      {estimate.breakdown.filter(b => b.category === 'structure').length > 0 && (
                        <div className="cost-category">
                          <div className="category-label">Structure</div>
                          {estimate.breakdown.filter(b => b.category === 'structure').map((item, i) => (
                            <div key={i} className="cost-line">
                              <span>{item.label}</span>
                              <span>${item.cost.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Interior costs */}
                      {estimate.breakdown.filter(b => b.category === 'interior').length > 0 && (
                        <div className="cost-category">
                          <div className="category-label">Interior</div>
                          {estimate.breakdown.filter(b => b.category === 'interior').map((item, i) => (
                            <div key={i} className="cost-line">
                              <span>{item.label}</span>
                              <span>${item.cost.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Outdoor costs */}
                      {estimate.breakdown.filter(b => b.category === 'outdoor').length > 0 && (
                        <div className="cost-category">
                          <div className="category-label">Outdoor</div>
                          {estimate.breakdown.filter(b => b.category === 'outdoor').map((item, i) => (
                            <div key={i} className="cost-line">
                              <span>{item.label}</span>
                              <span>${item.cost.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Fees */}
                      {estimate.breakdown.filter(b => b.category === 'fees').length > 0 && (
                        <div className="cost-category fees">
                          <div className="category-label">Fees & Contingency</div>
                          {estimate.breakdown.filter(b => b.category === 'fees').map((item, i) => (
                            <div key={i} className="cost-line">
                              <span>{item.label}</span>
                              <span>${item.cost.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="cost-subtotal">
                        <span>Subtotal</span>
                        <span>${estimate.subtotal.toLocaleString()}</span>
                      </div>

                      <div className="cost-total">
                        <span>Estimated Total</span>
                        <span>${estimate.total.toLocaleString()}</span>
                      </div>

                      {estimate.pricePerSqFt > 0 && (
                        <div className="cost-per-sqft">
                          ${estimate.pricePerSqFt.toFixed(0)}/SF all-in
                        </div>
                      )}

                      <div className="cost-disclaimer">
                        * Estimates based on 2024-2025 Raleigh, NC market rates. Actual costs may vary based on materials, labor availability, and site conditions.
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Floating AI Chat Panel */}
        {showAIChat && (
          <div className="ai-floating-panel">
            <div className="ai-panel-header">
              <span>✨ AI Floor Plan Designer</span>
              <button onClick={() => setShowAIChat(false)} className="ai-close-btn">×</button>
            </div>
            <div className="ai-messages">
              {aiChatMessages.map((msg, i) => (
                <div key={i} className={`ai-message ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {aiGenerating && (
                <div className="ai-message assistant generating">
                  ⏳ Designing your floor plan...
                </div>
              )}
            </div>
            <div className="ai-quick-params">
              <div className="param-row">
                <label>Square Feet:</label>
                <input
                  type="number"
                  value={aiParams.sqft}
                  onChange={(e) => setAiParams({...aiParams, sqft: parseInt(e.target.value) || 1500})}
                  min="800" max="5000" step="100"
                />
              </div>
              <div className="param-row">
                <label>Bedrooms:</label>
                <select value={aiParams.bedrooms} onChange={(e) => setAiParams({...aiParams, bedrooms: parseInt(e.target.value)})}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
              <div className="param-row">
                <label>Bathrooms:</label>
                <select value={aiParams.bathrooms} onChange={(e) => setAiParams({...aiParams, bathrooms: parseFloat(e.target.value)})}>
                  <option value="1">1</option>
                  <option value="1.5">1.5</option>
                  <option value="2">2</option>
                  <option value="2.5">2.5</option>
                  <option value="3">3</option>
                  <option value="3.5">3.5</option>
                  <option value="4">4</option>
                </select>
              </div>
              <div className="param-row">
                <label>Style:</label>
                <select value={aiParams.style} onChange={(e) => setAiParams({...aiParams, style: e.target.value})}>
                  <option value="open">Open Concept</option>
                  <option value="traditional">Traditional</option>
                </select>
              </div>
            </div>
            <div className="ai-target-selector">
              <label>Generate for:</label>
              <div className="target-buttons">
                <button
                  className={aiParams.target === 'main' ? 'active' : ''}
                  onClick={() => setAiParams({...aiParams, target: 'main'})}
                >
                  🏠 Main House
                </button>
                <button
                  className={aiParams.target === 'adu' ? 'active' : ''}
                  onClick={() => setAiParams({...aiParams, target: 'adu', sqft: Math.min(aiParams.sqft, 1200)})}
                >
                  🏡 ADU
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                const targetLabel = aiParams.target === 'main' ? 'Main House' : 'ADU'
                setAiChatMessages([...aiChatMessages, {
                  role: 'user',
                  content: `Generate a ${aiParams.sqft} sq ft ${aiParams.style === 'open' ? 'open concept' : 'traditional'} ${targetLabel} layout with ${aiParams.bedrooms} bedrooms and ${aiParams.bathrooms} bathrooms`
                }])
                setAiGenerating(true)
                // Switch to target mode if not already there
                if (mode !== aiParams.target) {
                  setMode(aiParams.target)
                }
                setTimeout(() => {
                  const result = generateBlueprint(aiParams)
                  setAiChatMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `✅ Created a ${result.totalWidth}' × ${result.totalDepth}' ${targetLabel} floor plan with ${result.rooms} rooms!\n\nYou can now drag walls to adjust, add doors/windows, or ask me for changes.`
                  }])
                  setAiGenerating(false)
                }, 800)
              }}
              disabled={aiGenerating}
              className="ai-generate-btn"
            >
              {aiGenerating ? '⏳ Generating...' : `🏠 Generate ${aiParams.target === 'main' ? 'Main House' : 'ADU'}`}
            </button>
            <div className="ai-divider">or describe what you want</div>
            <div className="ai-input-area">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAISubmit()}
                placeholder="e.g., 2000 sqft open concept 3 bed 2 bath..."
                disabled={aiGenerating}
              />
              <button onClick={handleAISubmit} disabled={aiGenerating || !aiInput.trim()}>
                Send
              </button>
            </div>
          </div>
        )}

        {/* Project Panel */}
        {showProjectPanel && (
          <div className="project-panel">
            <div className="project-panel-header">
              <span>📁 Project Manager</span>
              <button onClick={() => setShowProjectPanel(false)} className="ai-close-btn">×</button>
            </div>

            <div className="project-name-section">
              <label>Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="project-name-input"
              />
            </div>

            <div className="project-actions">
              <button onClick={() => {
                const name = prompt('Enter version name:', `Version ${versions.length + 1}`)
                if (name) saveVersion(name, false)
              }} className="save-version-btn">
                💾 Save New Version
              </button>
              {currentVersionId && (
                <button onClick={() => updateVersion(currentVersionId)} className="update-version-btn">
                  🔄 Update Current
                </button>
              )}
            </div>

            <div className="versions-list">
              <label>Saved Versions ({versions.length})</label>
              {versions.length === 0 ? (
                <div className="no-versions">No versions saved yet. Save your first version above.</div>
              ) : (
                versions.map(version => (
                  <div
                    key={version.id}
                    className={`version-item ${currentVersionId === version.id ? 'current' : ''} ${mainVersionId === version.id ? 'main' : ''}`}
                    onClick={() => loadVersion(version.id)}
                  >
                    <div className="version-info">
                      <span className="version-name">
                        {version.name}
                        {mainVersionId === version.id && <span className="main-badge">MAIN</span>}
                      </span>
                      <span className="version-date">
                        {new Date(version.createdAt).toLocaleDateString()} {new Date(version.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="version-actions">
                      {mainVersionId !== version.id && (
                        <button onClick={(e) => { e.stopPropagation(); promoteToMain(version.id); }} title="Make Main">
                          ⭐
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); deleteVersion(version.id); }} title="Delete" className="delete-btn">
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="project-io">
              <label>Share Project</label>
              <button onClick={exportProject} className="export-btn">
                📤 Export Project File
              </button>
              <button onClick={() => projectImportRef.current?.click()} className="import-btn">
                📥 Import Project
              </button>
              <input
                ref={projectImportRef}
                type="file"
                accept=".json"
                onChange={importProject}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
