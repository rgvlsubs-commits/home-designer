import { useFloorPlan } from '../hooks/useFloorPlan'

export default function RoomList() {
  const { floorPlan, selectedRoom, selectRoom } = useFloorPlan()
  const rooms = floorPlan.floors[0].rooms

  const totalSqFt = rooms.reduce((sum, r) => sum + r.width * r.height, 0)

  return (
    <div className="panel-section">
      <h3>Rooms</h3>
      <div className="info-card" style={{ marginBottom: '16px' }}>
        <div className="label">Total Area</div>
        <div className="value">{totalSqFt.toFixed(0)} sq ft</div>
      </div>
      <ul className="room-list">
        {rooms.map(room => {
          const sqft = room.width * room.height
          return (
            <li
              key={room.id}
              className={`room-item ${room.id === selectedRoom ? 'selected' : ''}`}
              onClick={() => selectRoom(room.id)}
            >
              <div>
                <div className="room-name">{room.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                  {room.width.toFixed(1)}' x {room.height.toFixed(1)}'
                </div>
              </div>
              <div className="room-sqft">{sqft.toFixed(0)} sf</div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
