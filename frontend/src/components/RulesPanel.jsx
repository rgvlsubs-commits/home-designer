import { useFloorPlan, RALEIGH_RULES } from '../hooks/useFloorPlan'

export default function RulesPanel() {
  const { floorPlan, violations } = useFloorPlan()
  const lot = floorPlan.lot
  const rooms = floorPlan.floors[0].rooms

  // Calculate current stats
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
  const coverage = (footprint / lotArea * 100).toFixed(1)

  return (
    <div className="panel-section">
      <h3>Raleigh Building Code</h3>

      {violations.length === 0 ? (
        <div className="valid">
          All code requirements met
        </div>
      ) : (
        violations.map((v, i) => (
          <div key={i} className="violation">
            {v}
          </div>
        ))
      )}

      <div style={{ marginTop: '16px' }}>
        <h3>Current Stats</h3>
        <div className="info-card">
          <div className="label">Lot Coverage</div>
          <div className="value">{coverage}% <span style={{ fontSize: '0.8rem', color: '#666' }}>/ {RALEIGH_RULES.max_lot_coverage * 100}% max</span></div>
        </div>
        <div className="info-card">
          <div className="label">Building Footprint</div>
          <div className="value">{buildingWidth.toFixed(0)}' x {buildingDepth.toFixed(0)}'</div>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <h3>Setback Requirements</h3>
        <div style={{ fontSize: '0.8rem', color: '#888' }}>
          <div>Front: {lot.setbacks.front}' (min: {RALEIGH_RULES.setback_front_min}')</div>
          <div>Sides: {lot.setbacks.left}' / {lot.setbacks.right}' (min: {RALEIGH_RULES.setback_side_min}')</div>
          <div>Rear: {lot.setbacks.back}' (min: {RALEIGH_RULES.setback_rear_min}')</div>
          <div style={{ marginTop: '8px' }}>Max Height: {RALEIGH_RULES.max_height}' / {RALEIGH_RULES.max_stories} stories</div>
        </div>
      </div>
    </div>
  )
}
