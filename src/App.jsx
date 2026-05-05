import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows, RoundedBox } from '@react-three/drei';

// 🚌 1. 3D 버스 컴포넌트 만들기 (보내주신 예제처럼 광택이 나는 재질 적용!)
function Bus3D({ position, color, direction }) {
  // 방향에 따른 회전값 설정
  const rotationY = direction === 'RIGHT' ? Math.PI / 2 : direction === 'LEFT' ? -Math.PI / 2 : direction === 'UP' ? Math.PI : 0;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 버스 몸통 (메탈릭하고 매끄러운 광택 코팅 재질) */}
      <RoundedBox args={[1.8, 1.2, 3.5]} radius={0.1} smoothness={4} position={[0, 0.8, 0]}>
        <meshPhysicalMaterial 
          color={color} 
          metalness={0.3} 
          roughness={0.1} 
          clearcoat={1.0}        // 자동차 특유의 투명한 코팅층
          clearcoatRoughness={0.1} 
        />
      </RoundedBox>

      {/* 버스 유리창 (어두운 틴팅 유리) */}
      <mesh position={[0, 1.0, 0.1]}>
        <boxGeometry args={[1.82, 0.6, 3.3]} />
        <meshPhysicalMaterial color="#111" metalness={0.9} roughness={0.1} envMapIntensity={2} />
      </mesh>

      {/* 바퀴 4개 */}
      <mesh position={[-1, 0.3, 1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.2, 32]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[1, 0.3, 1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.2, 32]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[-1, 0.3, -1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.2, 32]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[1, 0.3, -1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.2, 32]} /><meshStandardMaterial color="#222" /></mesh>
      
      {/* 방향 표시용 포인트 (지붕 위 조명 느낌) */}
      <mesh position={[0, 1.5, 1.2]}>
        <boxGeometry args={[0.8, 0.1, 0.2]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

export default function App() {
  // 임시 주차장 데이터 (그리드 좌표를 3D 공간 좌표로 변환)
  const [parkedBuses, setParkedBuses] = useState([
    { id: 1, color: '#f8fafc', x: 0, z: 2, dir: 'UP' },    // 화이트 (슬릭한 전기차 느낌)
    { id: 2, color: '#ef4444', x: -2.5, z: -2, dir: 'RIGHT' }, // 레드
    { id: 3, color: '#3b82f6', x: 2.5, z: 0, dir: 'DOWN' },  // 블루
  ]);

  return (
    <div className="w-screen h-screen bg-slate-900">
      {/* UI 레이어 (기존 점수판 등은 이 위치에 HTML/Tailwind로 띄웁니다) */}
      <div className="absolute top-5 left-5 z-10 text-white font-black text-3xl drop-shadow-lg">
        BUS ESCAPE 3D
      </div>

      {/* 3D 캔버스 영역 */}
      <Canvas camera={{ position: [8, 8, 8], fov: 45 }}>
        <Suspense fallback={null}>
          {/* 환경 반사 매핑 (보내주신 예제의 핵심! 주변 도시 풍경이 차체에 반사됨) */}
          <Environment preset="city" background={false} />
          
          {/* 전체를 밝히는 기본 조명 */}
          <ambientLight intensity={0.5} />
          {/* 태양광 (그림자 생성) */}
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

          {/* 주차된 버스들 렌더링 */}
          {parkedBuses.map((bus) => (
            <Bus3D 
              key={bus.id} 
              position={[bus.x, 0, bus.z]} 
              color={bus.color} 
              direction={bus.dir} 
            />
          ))}

          {/* 바닥 (도로 질감) 및 부드러운 그림자 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2} far={4} />

          {/* 마우스로 화면 돌려보기 허용 */}
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
        </Suspense>
      </Canvas>
    </div>
  );
}
