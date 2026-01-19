import { create } from 'zustand'

// Actual floor plan for 1700 Midwood Dr from blueprint
const DEFAULT_FLOOR_PLAN = {
  id: 'midwood-1700',
  name: '1700 Midwood Dr Renovation',
  lot: {
    width: 80,  // feet (0.19 acre corner lot estimate)
    depth: 100,
    setbacks: {
      front: 20,
      back: 20,
      left: 5,
      right: 10  // corner lot, wider on street side
    }
  },
  floors: [{
    level: 0,
    rooms: [
      // Main House - Bottom row
      {
        id: 'living',
        name: 'Living Room',
        type: 'living',
        x: 17,
        y: 24,
        width: 15.6,
        height: 13.2,
        ceilingHeight: 9,
        color: '#00aa00'
      },
      {
        id: 'bedroom3',
        name: 'Bedroom 3',
        type: 'bedroom',
        x: 0,
        y: 27,
        width: 12,
        height: 9.6,
        ceilingHeight: 9,
        color: '#0066aa'
      },
      {
        id: 'front-porch',
        name: 'Front Porch',
        type: 'porch',
        x: 12,
        y: 37,
        width: 8.3,
        height: 3.7,
        ceilingHeight: 9,
        color: '#444444'
      },
      // Middle row
      {
        id: 'bedroom2',
        name: 'Bedroom 2',
        type: 'bedroom',
        x: 0,
        y: 15,
        width: 11.3,
        height: 11.1,
        ceilingHeight: 9,
        color: '#0066aa'
      },
      {
        id: 'bathroom2',
        name: 'Bathroom',
        type: 'bathroom',
        x: 11.3,
        y: 18,
        width: 5,
        height: 7.6,
        ceilingHeight: 9,
        color: '#006666'
      },
      {
        id: 'dining',
        name: 'Dining Room',
        type: 'dining',
        x: 17,
        y: 13,
        width: 12.8,
        height: 10.3,
        ceilingHeight: 9,
        color: '#aa00aa'
      },
      // Top row
      {
        id: 'primary-bedroom',
        name: 'Primary Bedroom',
        type: 'bedroom',
        x: 0,
        y: 3,
        width: 13,
        height: 10.3,
        ceilingHeight: 9,
        color: '#0066aa'
      },
      {
        id: 'primary-bath',
        name: 'Primary Bath',
        type: 'bathroom',
        x: 13,
        y: 3,
        width: 5,
        height: 10,
        ceilingHeight: 9,
        color: '#006666'
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        type: 'kitchen',
        x: 22,
        y: 0,
        width: 8.5,
        height: 15,
        ceilingHeight: 9,
        color: '#00aaaa'
      },
      {
        id: 'deck',
        name: 'Deck',
        type: 'porch',
        x: 22,
        y: -12,
        width: 11,
        height: 12,
        ceilingHeight: 0,
        color: '#553300'
      },
      {
        id: 'laundry',
        name: 'Laundry',
        type: 'utility',
        x: 11.3,
        y: 10,
        width: 4,
        height: 4,
        ceilingHeight: 9,
        color: '#666666'
      }
    ],
    furniture: []
  }],
  // Detached Studio
  detachedStructures: [{
    id: 'studio',
    name: 'Detached Studio',
    x: -30,
    y: -25,
    width: 21.3,
    height: 23.6,
    ceilingHeight: 10,
    color: '#008800',
    rooms: [
      {
        id: 'studio-main',
        name: 'Studio',
        type: 'studio',
        x: 0,
        y: 0,
        width: 21.3,
        height: 20,
        ceilingHeight: 10,
        color: '#008800'
      },
      {
        id: 'studio-storage',
        name: 'Storage',
        type: 'storage',
        x: 0,
        y: 20,
        width: 21.3,
        height: 3.6,
        ceilingHeight: 10,
        color: '#555555'
      }
    ]
  }]
}

// Raleigh building code rules
const RALEIGH_RULES = {
  setback_front_min: 20,
  setback_side_min: 5,
  setback_rear_min: 20,
  max_height: 40,
  max_stories: 3,
  max_lot_coverage: 0.40,
  min_room_sizes: {
    bedroom: 70,
    bathroom: 35,
    kitchen: 50,
    living: 120
  }
}

// Cost estimates ($/sqft or fixed)
const COST_ESTIMATES = {
  new_construction_sqft: 200,
  renovation_sqft: 100,
  kitchen_remodel: 25000,
  bathroom_add: 15000,
  room_addition_sqft: 250,
  demolition_sqft: 15
}

export const useFloorPlan = create((set, get) => ({
  floorPlan: DEFAULT_FLOOR_PLAN,
  selectedRoom: null,
  violations: [],

  // Select a room
  selectRoom: (roomId) => set({ selectedRoom: roomId }),

  // Update room dimensions
  updateRoom: (roomId, updates) => set((state) => {
    const newFloorPlan = { ...state.floorPlan }
    const floor = newFloorPlan.floors[0]
    const roomIndex = floor.rooms.findIndex(r => r.id === roomId)
    if (roomIndex >= 0) {
      floor.rooms[roomIndex] = { ...floor.rooms[roomIndex], ...updates }
    }
    return {
      floorPlan: newFloorPlan,
      violations: validateFloorPlan(newFloorPlan)
    }
  }),

  // Add a new room
  addRoom: (room) => set((state) => {
    const newFloorPlan = { ...state.floorPlan }
    newFloorPlan.floors[0].rooms.push(room)
    return {
      floorPlan: newFloorPlan,
      violations: validateFloorPlan(newFloorPlan)
    }
  }),

  // Delete a room
  deleteRoom: (roomId) => set((state) => {
    const newFloorPlan = { ...state.floorPlan }
    newFloorPlan.floors[0].rooms = newFloorPlan.floors[0].rooms.filter(r => r.id !== roomId)
    return {
      floorPlan: newFloorPlan,
      violations: validateFloorPlan(newFloorPlan)
    }
  }),

  // Resize room (percentage or absolute)
  resizeRoom: (roomId, scaleOrDimensions) => set((state) => {
    const newFloorPlan = { ...state.floorPlan }
    const floor = newFloorPlan.floors[0]
    const room = floor.rooms.find(r => r.id === roomId)
    if (room) {
      if (typeof scaleOrDimensions === 'number') {
        room.width *= scaleOrDimensions
        room.height *= scaleOrDimensions
      } else {
        Object.assign(room, scaleOrDimensions)
      }
    }
    return {
      floorPlan: newFloorPlan,
      violations: validateFloorPlan(newFloorPlan)
    }
  }),

  // Get total square footage
  getTotalSqFt: () => {
    const { floorPlan } = get()
    return floorPlan.floors[0].rooms.reduce((total, room) => {
      return total + (room.width * room.height)
    }, 0)
  },

  // Get cost estimate
  getCostEstimate: () => {
    const { floorPlan, getTotalSqFt } = get()
    const currentSqFt = getTotalSqFt()
    const originalSqFt = 1227 // Original house size
    const addedSqFt = Math.max(0, currentSqFt - originalSqFt)

    const costs = {
      renovation: originalSqFt * COST_ESTIMATES.renovation_sqft,
      addition: addedSqFt * COST_ESTIMATES.room_addition_sqft,
      total: 0
    }
    costs.total = costs.renovation + costs.addition

    return costs
  },

  // Validate against Raleigh rules
  validate: () => {
    const { floorPlan } = get()
    return validateFloorPlan(floorPlan)
  },

  // Reset to default
  reset: () => set({
    floorPlan: DEFAULT_FLOOR_PLAN,
    selectedRoom: null,
    violations: []
  })
}))

// Validation function
function validateFloorPlan(floorPlan) {
  const violations = []
  const lot = floorPlan.lot
  const rooms = floorPlan.floors[0].rooms

  // Calculate building footprint bounds
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity

  rooms.forEach(room => {
    minX = Math.min(minX, room.x)
    maxX = Math.max(maxX, room.x + room.width)
    minY = Math.min(minY, room.y)
    maxY = Math.max(maxY, room.y + room.height)
  })

  const buildingWidth = maxX - minX
  const buildingDepth = maxY - minY
  const footprint = buildingWidth * buildingDepth
  const lotArea = lot.width * lot.depth

  // Check setbacks (assuming building starts at setback position)
  if (minX < 0) {
    const actualSetback = lot.setbacks.left + minX
    if (actualSetback < RALEIGH_RULES.setback_side_min) {
      violations.push(`Left setback violation: ${actualSetback.toFixed(1)}ft (min: ${RALEIGH_RULES.setback_side_min}ft)`)
    }
  }

  // Check lot coverage
  const coverage = footprint / lotArea
  if (coverage > RALEIGH_RULES.max_lot_coverage) {
    violations.push(`Lot coverage: ${(coverage * 100).toFixed(1)}% exceeds max ${RALEIGH_RULES.max_lot_coverage * 100}%`)
  }

  // Check minimum room sizes
  rooms.forEach(room => {
    const sqft = room.width * room.height
    const minSize = RALEIGH_RULES.min_room_sizes[room.type]
    if (minSize && sqft < minSize) {
      violations.push(`${room.name}: ${sqft.toFixed(0)} sq ft below minimum ${minSize} sq ft for ${room.type}`)
    }
  })

  return violations
}

export { RALEIGH_RULES, COST_ESTIMATES }
