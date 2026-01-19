import { useFloorPlan, COST_ESTIMATES } from '../hooks/useFloorPlan'

export default function CostPanel() {
  const { floorPlan, getTotalSqFt, getCostEstimate } = useFloorPlan()

  const currentSqFt = getTotalSqFt()
  const originalSqFt = 1227
  const addedSqFt = Math.max(0, currentSqFt - originalSqFt)
  const costs = getCostEstimate()

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="panel-section">
      <h3>Cost Estimate</h3>

      <div className="cost-display">
        <div className="cost-total">{formatCurrency(costs.total)}</div>
        <div className="cost-breakdown">Estimated total renovation cost</div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <div className="info-card">
          <div className="label">Renovation ({originalSqFt} sq ft @ ${COST_ESTIMATES.renovation_sqft}/sf)</div>
          <div className="value">{formatCurrency(costs.renovation)}</div>
        </div>

        {addedSqFt > 0 && (
          <div className="info-card">
            <div className="label">Addition ({addedSqFt.toFixed(0)} sq ft @ ${COST_ESTIMATES.room_addition_sqft}/sf)</div>
            <div className="value">{formatCurrency(costs.addition)}</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '16px' }}>
        <h3>Area Summary</h3>
        <div className="info-card">
          <div className="label">Original Size</div>
          <div className="value">{originalSqFt} sq ft</div>
        </div>
        <div className="info-card">
          <div className="label">Current Design</div>
          <div className="value" style={{ color: currentSqFt > originalSqFt ? '#00ffff' : '#00ff00' }}>
            {currentSqFt.toFixed(0)} sq ft
            {addedSqFt > 0 && <span style={{ fontSize: '0.8rem', marginLeft: '8px' }}>(+{addedSqFt.toFixed(0)})</span>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#666' }}>
        <p>* Estimates are approximate and based on average Raleigh area costs.</p>
        <p style={{ marginTop: '4px' }}>* Actual costs may vary based on materials, labor, and specific requirements.</p>
      </div>
    </div>
  )
}
