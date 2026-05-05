import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows, RoundedBox } from '@react-three/drei';

const GRID_SIZE = 6;

// 🚌 1. 3D 버스 컴포넌트 (클릭 이벤트와 색상 매핑 추가)
function Bus3D({ bus, onClick }) {
  // 2D 그리드 좌표를 3D 공간의 좌표로 변환 (중앙 정렬)
  const x = (bus.x - (GRID_SIZE / 2 - 0.5)) * 2; 
  const z = (bus.y - (GRID_SIZE / 2 - 0.5)) * 2;
  
  // 버스 방향에 따른 회전
  const rotationY = bus.dir === 'RIGHT' ? Math.PI / 2 : bus.dir === 'LEFT' ? -Math.PI / 2 : bus.dir === 'UP' ? Math.PI : 0;

  // Tailwind 색상을 3D 재질용 Hex 코드로 변환
  const colorMap = {
    pink: '#ff4757', purple: '#9b59b6', blue: '#1e90ff', yellow: '#f1c40f', green: '#2ed573'
  };

  return (
    <group position={[x, 0, z]} rotation={[0, rotationY, 0]} onClick={(e) => { e.stopPropagation(); onClick(bus); }}>
      {/* 버스 몸통 */}
      <RoundedBox args={[1.8, 1.2, 3.5]} radius={0.1} smoothness={4} position={[0, 0.8, 0]}>
        <meshPhysicalMaterial color={colorMap[bus.color]} metalness={0.2} roughness={0.1} clearcoat={1.0} clearcoatRoughness={0.1} />
      </RoundedBox>

      {/* 버스 유리창 */}
      <mesh position={[0, 1.0, 0.1]}>
        <boxGeometry args={[1.82, 0.6, 3.3]} />
        <meshPhysicalMaterial color="#111" metalness={0.9} roughness={0.1} envMapIntensity={2} />
      </mesh>

      {/* 바퀴 4개 */}
      <mesh position={[-1, 0.3, 1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.2, 32]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[1, 0.3, 1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.2, 32]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[-1, 0.3, -1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.2, 32]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[1, 0.3, -1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.2, 32]} /><meshStandardMaterial color="#222" /></mesh>
      
      {/* 방향 표시용 하얀색 루프탑 조명 */}
      <mesh position={[0, 1.5, -1.2]}>
        <boxGeometry args={[0.8, 0.1, 0.2]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

// 🎮 2. 메인 게임 앱 컴포넌트
export default function App() {
  const [score, setScore] = useState(0);
  const [queue, setQueue] = useState(['pink', 'pink', 'blue', 'blue', 'blue', 'yellow', 'yellow']);
  const [loadingBuses, setLoadingBuses] = useState([]);
  
  // 게임 로직을 품은 버스 데이터
  const [parkedBuses, setParkedBuses] = useState([
    { id: 1, color: 'pink', x: 2, y: 4, w: 2, h: 1, dir: 'RIGHT', capacity: 2 },
    { id: 2, color: 'blue', x: 1, y: 1, w: 1, h: 2, dir: 'UP', capacity: 3 },
    { id: 3, color: 'yellow', x: 2, y: 1, w: 2, h: 1, dir: 'LEFT', capacity: 2 },
    { id: 4, color: 'purple', x: 4, y: 2, w: 1, h: 2, dir: 'DOWN', capacity: 3 }, // 길막용 버스
  ]);

  const uiColors = {
    pink: 'bg-pink-500 border-pink-700', purple: 'bg-purple-600 border-purple-800',
    blue: 'bg-blue-500 border-blue-700', yellow: 'bg-yellow-400 border-yellow-600', green: 'bg-green-500 border-green-700',
  };

  // 탑승 로직
  useEffect(() => {
    let timer;
    const processBoarding = () => {
      if (loadingBuses.length > 0 && queue.length > 0) {
        const currentBus = { ...loadingBuses[0] };
        if (currentBus.capacity > 0 && queue[0] === currentBus.color) {
          setQueue(prev => prev.slice(1));
          setScore(prev => prev + 10);
          const newLoading = [...loadingBuses];
          newLoading[0] = { ...currentBus, capacity: currentBus.capacity - 1 };
          setLoadingBuses(newLoading);
        } else if (currentBus.capacity === 0) {
          setLoadingBuses(prev => prev.slice(1));
        }
      } else if (loadingBuses.length > 0 && loadingBuses[0].capacity === 0) {
        setLoadingBuses(prev => prev.slice(1));
      }
    };
    if (loadingBuses.length > 0) timer = setTimeout(processBoarding, 400);
    return () => clearTimeout(timer);
  }, [loadingBuses, queue]);

  // 막힘(Collision) 판정 로직
  const isPathClear = (bus) => {
    const others = parkedBuses.filter(b => b.id !== bus.id);
    const isOccupied = (cx, cy) => others.some(b => cx >= b.x && cx < b.x + b.w && cy >= b.y && cy < b.y + b.h);

    if (bus.dir === 'UP') {
      for (let cy = bus.y - 1; cy >= 0; cy--) for (let cx = bus.x; cx < bus.x + bus.w; cx++) if (isOccupied(cx, cy)) return false;
    } else if (bus.dir === 'DOWN') {
      for (let cy = bus.y + bus.h; cy < GRID_SIZE; cy++) for (let cx = bus.x; cx < bus.x + bus.w; cx++) if (isOccupied(cx, cy)) return false;
    } else if (bus.dir === 'LEFT') {
      for (let cx = bus.x - 1; cx >= 0; cx--) for (let cy = bus.y; cy < bus.y + bus.h; cy++) if (isOccupied(cx, cy)) return false;
    } else if (bus.dir === 'RIGHT') {
      for (let cx = bus.x + bus.w; cx < GRID_SIZE; cx++) for (let cy = bus.y; cy < bus.y + bus.h; cy++) if (isOccupied(cx, cy)) return false;
    }
    return true;
  };

  // 3D 버스 클릭 핸들러
  const handleBusClick = (bus) => {
    if (loadingBuses.length >= 3) return;
    if (!isPathClear(bus)) {
      alert("앞이 막혀서 나갈 수 없습니다!"); // 임시 알림
      return;
    }
    setParkedBuses(prev => prev.filter(b => b.id !== bus.id));
    setLoadingBuses(prev => [...prev, bus]);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-4 select-none">
      <div className="w-[400px] h-[820px] bg-white shadow-2xl rounded-[40px] overflow-hidden relative border-[10px] border-slate-900 flex flex-col">
        
        {/* 상단 2D UI 레이어 */}
        <div className="flex justify-between items-center p-5 bg-slate-100 z-10 shadow-sm relative">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-inner">{score} PTS</div>
          <div className="text-2xl font-black text-slate-800">STAGE 1</div>
        </div>

        {/* 승객 대기열 */}
        <div className="p-4 flex items-end justify-center h-[120px] bg-slate-50 border-b border-slate-200 relative z-10">
          <div className="flex gap-1 flex-wrap justify-center max-w-[300px]">
            {queue.map((color, i) => (
              <div key={i} className={`w-6 h-8 rounded-t-full rounded-b-md shadow-sm ${uiColors[color].split(' ')[0]}`}></div>
            ))}
          </div>
        </div>

        {/* 탑승 구역 */}
        <div className="bg-slate-700 h-[130px] flex items-center justify-center gap-3 relative shadow-inner z-10 border-b-4 border-slate-800">
          {[0, 1, 2].map(i => (
            <div key={`slot-${i}`} className="w-[100px] h-[60px] border-2 border-dashed border-slate-400/50 rounded-xl flex items-center justify-center relative bg-slate-800/50">
              {loadingBuses[i] && (
                <div className={`absolute w-full h-full rounded-xl flex items-center justify-center text-white border-b-4 ${uiColors[loadingBuses[i].color]}`}>
                  <div className="font-black text-2xl">{loadingBuses[i].capacity}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 하단 3D 주차장 영역 */}
        <div className="flex-1 relative bg-slate-800 cursor-pointer">
          <Canvas camera={{ position: [0, 12, 10], fov: 45 }}>
            <Suspense fallback={null}>
              <Environment preset="city" />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />

              {/* 3D 주차된 버스들 */}
              {parkedBuses.map(bus => (
                <Bus3D key={bus.id} bus={bus} onClick={handleBusClick} />
              ))}

              {/* 바닥 질감 */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#334155" />
              </mesh>
            </Suspense>
          </Canvas>
          
          {/* 3D 영역 위에 띄우는 안내 문구 */}
          <div className="absolute bottom-4 left-0 w-full text-center text-white/50 font-bold pointer-events-none">
            버스를 클릭해서 출차하세요
          </div>
        </div>

      </div>
    </div>
  );
}
