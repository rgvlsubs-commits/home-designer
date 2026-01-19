import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { useFloorPlan } from '../hooks/useFloorPlan'

const SCALE = 12 // pixels per foot
const OFFSET_X = 100 // canvas offset
const OFFSET_Y = 200 // canvas offset to show deck at top

export default function Editor2D() {
  const canvasRef = useRef(null)
  const fabricRef = useRef(null)
  const { floorPlan, selectedRoom, selectRoom, updateRoom } = useFloorPlan()
  const [initialized, setInitialized] = useState(false)
  const [showBlueprint, setShowBlueprint] = useState(false)

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current || initialized) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#0a0a0a',
      selection: true,
      preserveObjectStacking: true
    })

    fabricRef.current = canvas

    // Handle window resize
    const resizeCanvas = () => {
      const container = canvasRef.current?.parentElement
      if (container) {
        canvas.setWidth(container.clientWidth)
        canvas.setHeight(container.clientHeight - 40) // Leave room for toggle
        canvas.renderAll()
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Handle object selection
    canvas.on('selection:created', (e) => {
      const obj = e.selected?.[0]
      if (obj?.roomId) {
        selectRoom(obj.roomId)
      }
    })

    // Handle object modification
    canvas.on('object:modified', (e) => {
      const obj = e.target
      if (obj?.roomId) {
        updateRoom(obj.roomId, {
          x: obj.left / SCALE,
          y: obj.top / SCALE,
          width: (obj.width * obj.scaleX) / SCALE,
          height: (obj.height * obj.scaleY) / SCALE
        })
        // Reset scale after applying
        obj.set({ scaleX: 1, scaleY: 1 })
      }
    })

    setInitialized(true)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      canvas.dispose()
    }
  }, [])

  // Update canvas when floor plan changes
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    // Clear existing objects
    canvas.clear()
    canvas.backgroundColor = '#0a0a0a'

    // Draw grid (subtle)
    const gridSize = SCALE * 5 // 5 foot grid
    for (let x = 0; x < 800; x += gridSize) {
      const line = new fabric.Line([x, 0, x, 800], {
        stroke: '#1a1a1a',
        strokeWidth: 1,
        selectable: false,
        evented: false
      })
      canvas.add(line)
    }
    for (let y = 0; y < 800; y += gridSize) {
      const line = new fabric.Line([0, y, 800, y], {
        stroke: '#1a1a1a',
        strokeWidth: 1,
        selectable: false,
        evented: false
      })
      canvas.add(line)
    }

    // Draw main house rooms
    const rooms = floorPlan.floors[0].rooms
    rooms.forEach(room => {
      const isSelected = room.id === selectedRoom

      // Calculate position - rooms are positioned relative to each other
      const left = OFFSET_X + room.x * SCALE
      const top = OFFSET_Y + room.y * SCALE

      // Room rectangle
      const rect = new fabric.Rect({
        left: left,
        top: top,
        width: room.width * SCALE,
        height: room.height * SCALE,
        fill: room.color + '60',
        stroke: isSelected ? '#00ffff' : room.color,
        strokeWidth: isSelected ? 3 : 2,
        roomId: room.id,
        hasControls: true,
        hasBorders: true,
        lockRotation: true,
        cornerColor: '#00ff00',
        cornerSize: 8,
        transparentCorners: false,
        borderColor: '#00ffff',
        borderScaleFactor: 2
      })

      // Room label
      const sqft = (room.width * room.height).toFixed(0)
      const label = new fabric.Text(`${room.name}\n${sqft} sq ft`, {
        left: left + (room.width * SCALE) / 2,
        top: top + (room.height * SCALE) / 2,
        fontSize: 10,
        fill: '#00ff00',
        fontFamily: 'Share Tech Mono',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false
      })

      // Dimension labels
      const widthLabel = new fabric.Text(`${room.width.toFixed(1)}'`, {
        left: left + (room.width * SCALE) / 2,
        top: top - 10,
        fontSize: 9,
        fill: '#00aa00',
        fontFamily: 'Share Tech Mono',
        textAlign: 'center',
        originX: 'center',
        selectable: false,
        evented: false
      })

      const heightLabel = new fabric.Text(`${room.height.toFixed(1)}'`, {
        left: left + room.width * SCALE + 3,
        top: top + (room.height * SCALE) / 2,
        fontSize: 9,
        fill: '#00aa00',
        fontFamily: 'Share Tech Mono',
        originY: 'center',
        selectable: false,
        evented: false
      })

      canvas.add(rect)
      canvas.add(label)
      canvas.add(widthLabel)
      canvas.add(heightLabel)
    })

    // Draw detached structures (studio)
    if (floorPlan.detachedStructures) {
      floorPlan.detachedStructures.forEach(structure => {
        structure.rooms.forEach(room => {
          const left = OFFSET_X + structure.x * SCALE + room.x * SCALE
          const top = OFFSET_Y + structure.y * SCALE + room.y * SCALE

          const rect = new fabric.Rect({
            left: left,
            top: top,
            width: room.width * SCALE,
            height: room.height * SCALE,
            fill: room.color + '60',
            stroke: room.color,
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false
          })

          const sqft = (room.width * room.height).toFixed(0)
          const label = new fabric.Text(`${room.name}\n${sqft} sq ft`, {
            left: left + (room.width * SCALE) / 2,
            top: top + (room.height * SCALE) / 2,
            fontSize: 10,
            fill: '#00ff00',
            fontFamily: 'Share Tech Mono',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
          })

          canvas.add(rect)
          canvas.add(label)
        })
      })
    }

    // Add compass/legend
    const legend = new fabric.Text('N\n↑', {
      left: 30,
      top: 30,
      fontSize: 14,
      fill: '#00ff00',
      fontFamily: 'Share Tech Mono',
      textAlign: 'center',
      selectable: false,
      evented: false
    })
    canvas.add(legend)

    canvas.renderAll()
  }, [floorPlan, selectedRoom, showBlueprint])

  return (
    <div className="editor-2d">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span className="panel-label">2D Floor Plan</span>
        <label style={{ fontSize: '11px', color: '#00aa00', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showBlueprint}
            onChange={(e) => setShowBlueprint(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          Show Blueprint Reference
        </label>
      </div>
      <div style={{ position: 'relative', flex: 1 }}>
        {showBlueprint && (
          <img
            src="/blueprint.jpg"
            alt="Blueprint Reference"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: 0.3,
              pointerEvents: 'none',
              zIndex: 0
            }}
          />
        )}
        <canvas ref={canvasRef} style={{ position: 'relative', zIndex: 1 }} />
      </div>
    </div>
  )
}
