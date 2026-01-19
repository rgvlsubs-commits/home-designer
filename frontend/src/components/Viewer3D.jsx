import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Text } from '@react-three/drei'
import { useFloorPlan } from '../hooks/useFloorPlan'

// Room component in 3D
function Room({ room, isSelected }) {
  const color = room.color || '#00aa00'

  return (
    <group position={[room.x + room.width / 2, room.ceilingHeight / 2, room.y + room.height / 2]}>
      {/* Room box - wireframe style for Matrix look */}
      <mesh>
        <boxGeometry args={[room.width, room.ceilingHeight, room.height]} />
        <meshBasicMaterial
          color={isSelected ? '#00ffff' : color}
          wireframe={true}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Solid floor */}
      <mesh position={[0, -room.ceilingHeight / 2 + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[room.width, room.height]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>

      {/* Room label */}
      <Text
        position={[0, 0, 0]}
        fontSize={1}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
        font="/fonts/ShareTechMono-Regular.ttf"
      >
        {room.name}
      </Text>
    </group>
  )
}

// Lot boundary
function Lot({ lot }) {
  return (
    <group>
      {/* Lot outline */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(lot.width, 0.1, lot.depth)]} />
        <lineBasicMaterial color="#333333" />
      </lineSegments>

      {/* Setback boundary */}
      <group position={[
        (lot.setbacks.left - lot.setbacks.right) / 2,
        0.05,
        (lot.setbacks.front - lot.setbacks.back) / 2
      ]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[
            lot.width - lot.setbacks.left - lot.setbacks.right,
            lot.depth - lot.setbacks.front - lot.setbacks.back
          ]} />
          <meshBasicMaterial color="#ff0064" transparent opacity={0.1} side={2} />
        </mesh>
      </group>
    </group>
  )
}

// Import THREE for the geometry
import * as THREE from 'three'

export default function Viewer3D() {
  const { floorPlan, selectedRoom } = useFloorPlan()
  const lot = floorPlan.lot
  const rooms = floorPlan.floors[0].rooms

  // Center offset for the building within setbacks
  const offsetX = lot.setbacks.left - lot.width / 2
  const offsetZ = lot.setbacks.front - lot.depth / 2

  return (
    <div className="viewer-3d">
      <span className="panel-label">3D View</span>
      <Canvas
        camera={{ position: [60, 40, 60], fov: 50 }}
        style={{ background: '#000000' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[50, 50, 50]} intensity={0.6} color="#00ff00" />

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={20}
          maxDistance={200}
        />

        {/* Grid - Matrix style */}
        <Grid
          args={[200, 200]}
          cellSize={1}
          cellColor="#0a2a0a"
          sectionSize={10}
          sectionColor="#00aa00"
          fadeDistance={150}
          fadeStrength={1}
          followCamera={false}
        />

        {/* Lot boundary */}
        <group position={[0, 0, 0]}>
          <Lot lot={lot} />
        </group>

        {/* Rooms */}
        <group position={[offsetX, 0, offsetZ]}>
          {rooms.map(room => (
            <Room
              key={room.id}
              room={room}
              isSelected={room.id === selectedRoom}
            />
          ))}
        </group>

        {/* Axes helper for orientation */}
        <axesHelper args={[10]} />
      </Canvas>
    </div>
  )
}
