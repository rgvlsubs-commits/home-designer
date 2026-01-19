import { useState } from 'react'
import { useFloorPlan } from '../hooks/useFloorPlan'

// Simple NLP parser (can be upgraded to Claude API later)
function parseCommand(command, floorPlan) {
  const cmd = command.toLowerCase().trim()
  const rooms = floorPlan.floors[0].rooms

  // Find room by name
  const findRoom = (text) => {
    return rooms.find(r =>
      text.includes(r.name.toLowerCase()) ||
      text.includes(r.type.toLowerCase())
    )
  }

  // Parse percentage
  const parsePercent = (text) => {
    const match = text.match(/(\d+)\s*%/)
    return match ? parseInt(match[1]) / 100 : null
  }

  // Parse feet
  const parseFeet = (text) => {
    const match = text.match(/(\d+\.?\d*)\s*(feet|foot|ft|')/i)
    return match ? parseFloat(match[1]) : null
  }

  // Make room bigger/smaller
  if (cmd.includes('bigger') || cmd.includes('larger') || cmd.includes('expand')) {
    const room = findRoom(cmd)
    const percent = parsePercent(cmd) || 0.2  // Default 20%
    if (room) {
      return {
        action: 'resize',
        roomId: room.id,
        scale: 1 + percent,
        message: `Expanding ${room.name} by ${(percent * 100).toFixed(0)}%`
      }
    }
  }

  if (cmd.includes('smaller') || cmd.includes('shrink') || cmd.includes('reduce')) {
    const room = findRoom(cmd)
    const percent = parsePercent(cmd) || 0.2
    if (room) {
      return {
        action: 'resize',
        roomId: room.id,
        scale: 1 - percent,
        message: `Shrinking ${room.name} by ${(percent * 100).toFixed(0)}%`
      }
    }
  }

  // Make room specific size
  if (cmd.includes('longer') || cmd.includes('extend')) {
    const room = findRoom(cmd)
    const feet = parseFeet(cmd)
    if (room && feet) {
      const isWidth = cmd.includes('wide') || cmd.includes('width')
      return {
        action: 'extend',
        roomId: room.id,
        dimension: isWidth ? 'width' : 'height',
        amount: feet,
        message: `Extending ${room.name} by ${feet} feet`
      }
    }
  }

  // Move room
  if (cmd.includes('move')) {
    const room = findRoom(cmd)
    const feet = parseFeet(cmd) || 5
    let direction = null
    if (cmd.includes('north') || cmd.includes('up')) direction = { x: 0, y: -feet }
    if (cmd.includes('south') || cmd.includes('down')) direction = { x: 0, y: feet }
    if (cmd.includes('east') || cmd.includes('right')) direction = { x: feet, y: 0 }
    if (cmd.includes('west') || cmd.includes('left')) direction = { x: -feet, y: 0 }

    if (room && direction) {
      return {
        action: 'move',
        roomId: room.id,
        delta: direction,
        message: `Moving ${room.name} ${feet} feet`
      }
    }
  }

  // Add room
  if (cmd.includes('add') && (cmd.includes('room') || cmd.includes('bathroom') || cmd.includes('bedroom'))) {
    let type = 'room'
    if (cmd.includes('bathroom')) type = 'bathroom'
    if (cmd.includes('bedroom')) type = 'bedroom'
    if (cmd.includes('closet')) type = 'closet'

    return {
      action: 'add',
      type: type,
      message: `Adding new ${type}`
    }
  }

  // Delete room
  if (cmd.includes('delete') || cmd.includes('remove')) {
    const room = findRoom(cmd)
    if (room) {
      return {
        action: 'delete',
        roomId: room.id,
        message: `Removing ${room.name}`
      }
    }
  }

  return {
    action: 'unknown',
    message: `I don't understand: "${command}". Try commands like "make the living room 20% bigger" or "move kitchen 5 feet north"`
  }
}

export default function CommandBar() {
  const [command, setCommand] = useState('')
  const [feedback, setFeedback] = useState('')
  const { floorPlan, updateRoom, resizeRoom, addRoom, deleteRoom } = useFloorPlan()

  const executeCommand = () => {
    if (!command.trim()) return

    const parsed = parseCommand(command, floorPlan)
    setFeedback(parsed.message)

    switch (parsed.action) {
      case 'resize':
        resizeRoom(parsed.roomId, parsed.scale)
        break

      case 'extend':
        const room = floorPlan.floors[0].rooms.find(r => r.id === parsed.roomId)
        if (room) {
          updateRoom(parsed.roomId, {
            [parsed.dimension]: room[parsed.dimension] + parsed.amount
          })
        }
        break

      case 'move':
        const moveRoom = floorPlan.floors[0].rooms.find(r => r.id === parsed.roomId)
        if (moveRoom) {
          updateRoom(parsed.roomId, {
            x: moveRoom.x + parsed.delta.x,
            y: moveRoom.y + parsed.delta.y
          })
        }
        break

      case 'add':
        const newId = `room-${Date.now()}`
        addRoom({
          id: newId,
          name: `New ${parsed.type}`,
          type: parsed.type,
          x: 30,
          y: 0,
          width: parsed.type === 'bathroom' ? 8 : 12,
          height: parsed.type === 'bathroom' ? 6 : 10,
          ceilingHeight: 9,
          color: parsed.type === 'bathroom' ? '#006666' : '#0066aa'
        })
        break

      case 'delete':
        deleteRoom(parsed.roomId)
        break

      default:
        break
    }

    setCommand('')

    // Clear feedback after 3 seconds
    setTimeout(() => setFeedback(''), 3000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      executeCommand()
    }
  }

  return (
    <div className="command-bar">
      <span style={{ color: '#00aa00', marginRight: '8px' }}>{'>'}</span>
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder='Enter command... (e.g., "make living room 20% bigger" or "add bathroom")'
      />
      <button onClick={executeCommand}>Execute</button>
      {feedback && (
        <span style={{
          marginLeft: '16px',
          color: feedback.includes("don't") ? '#ff6464' : '#00ffff',
          fontSize: '0.9rem'
        }}>
          {feedback}
        </span>
      )}
    </div>
  )
}
