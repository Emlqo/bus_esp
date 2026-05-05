import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, BusFront } from 'lucide-react';

const GRID_SIZE = 6; // 6x6 그리드 주차장

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [queue, setQueue] = useState(['pink', 'pink', 'blue', 'blue', 'blue', 'yellow', 'yellow']);
  const [loadingBuses, setLoadingBuses] = useState([]);
  const [animatingBusId, setAnimatingBusId] = useState(null); // 막힘 애니메이션용

  // 버스 데이터: x, y 좌표와 w(너비), h(높이)로 그리드 상의 위치와 크기 정의
  const [parkedBuses, setParkedBuses] = useState([
    { id: 1, color: 'pink', x: 2, y: 4, w: 2, h: 1, dir: 'RIGHT', capacity: 2 },
    { id: 2, color: 'blue', x: 1, y: 1, w: 1, h: 2, dir: 'UP', capacity: 3 },
    { id: 3, color: 'yellow', x: 2, y: 1, w: 2, h: 1, dir: 'LEFT', capacity: 2 },
    { id: 4, color: 'purple', x: 4, y: 2, w: 1, h: 2, dir: 'DOWN', capacity: 3 }, // 길막용 버스
  ]);

  const colors = {
    pink: 'bg-pink-500 border-pink-700',
    purple: 'bg-purple-600 border-purple-800',
    blue: 'bg-blue-500 border-blue-700',
    yellow: 'bg-yellow-400 border-yellow-600',
    green: 'bg-green-500 border-green-700',
  };

  // 1. 로딩 화면 타이머
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // 2. 승객 탑승 로직
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

    if (loadingBuses.length > 0) {
      timer = setTimeout(processBoarding, 400);
    }
    return () => clearTimeout(timer);
  }, [loadingBuses, queue]);

  // 3. 막힘(Collision) 판정 로직 - 버스가 나갈 수 있는지 검사
  const isPathClear = (bus) => {
    const others = parkedBuses.filter(b => b.id !== bus.id);
    const isOccupied = (cx, cy) => others.some(b => 
      cx >= b.x && cx < b.x + b.w && cy >= b.y && cy < b.y + b.h
    );

    if (bus.dir === 'UP') {
      for (let cy = bus.y - 1; cy >= 0; cy--) {
        for (let cx = bus.x; cx < bus.x + bus.w; cx++) {
          if (isOccupied(cx, cy)) return false;
        }
      }
    } else if (bus.dir === 'DOWN') {
      for (let cy = bus.y + bus.h; cy < GRID_SIZE; cy++) {
        for (let cx = bus.x; cx < bus.x + bus.w; cx++) {
          if (isOccupied(cx, cy)) return false;
        }
      }
    } else if (bus.dir === 'LEFT') {
      for (let cx = bus.x - 1; cx >= 0; cx--) {
        for (let cy = bus.y; cy < bus.y + bus.h; cy++) {
          if (isOccupied(cx, cy)) return false;
        }
      }
    } else if (bus.dir === 'RIGHT') {
      for (let cx = bus.x + bus.w; cx < GRID_SIZE; cx++) {
        for (let cy = bus.y; cy < bus.y + bus.h; cy++) {
          if (isOccupied(cx, cy)) return false;
        }
      }
    }
    return true;
  };

  // 버스 클릭 핸들러
  const handleBusClick = (bus) => {
    if (loadingBuses.length >= 3) return;

    if (!isPathClear(bus)) {
      // 막혀있다면 흔들림 애니메이션 트리거
      setAnimatingBusId(bus.id);
      setTimeout(() => setAnimatingBusId(null), 300);
      return;
    }

    // 탈출 성공 처리
    setParkedBuses(prev => prev.filter(b => b.id !== bus.id));
    setLoadingBuses(prev => [...prev, bus]);
  };

  const getArrowIcon = (dir) => {
    if (dir === 'UP') return <ArrowUp size={24} strokeWidth={3} />;
    if (dir === 'DOWN') return <ArrowDown size={24} strokeWidth={3} />;
    if (dir === 'LEFT') return <ArrowLeft size={24} strokeWidth={3} />;
    return <ArrowRight size={24} strokeWidth={3} />;
  };

  // 로딩 스크린 렌더링
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-800 text-white">
        <BusFront size={80} className="text-yellow-400 animate-bounce-slow mb-4" />
        <h1 className="text-4xl font-black tracking-widest animate-pulse">BUS ESCAPE</h1>
        <div className="mt-8 flex gap-2">
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  const isClear = queue.length === 0 && loadingBuses.length === 0;

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-4">
      <div className="w-[400px] h-[820px] bg-white shadow-2xl rounded-[40px] overflow-hidden relative border-[10px] border-slate-900 flex flex-col animate-pop-in">
        
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center p-5 bg-slate-100 z-10 shadow-sm">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-inner">
             {score} PTS
          </div>
          <div className="text-2xl font-black text-slate-800">STAGE 1</div>
        </div>

        {/* 승객 대기열 */}
        <div className="p-4 flex items-end justify-center h-[120px] bg-slate-50 border-b border-slate-200">
          <div className="flex gap-1 flex-wrap justify-center max-w-[300px]">
            {queue.map((color, i) => (
              <div key={i} className={`w-6 h-8 rounded-t-full rounded-b-md shadow-sm ${colors[color].split(' ')[0]} animate-pop-in`} style={{animationDelay: `${i * 0.05}s`}}></div>
            ))}
          </div>
        </div>

        {/* 탑승 구역 (로딩 존) */}
        <div className="bg-slate-700 h-[130px] flex items-center justify-center gap-3 relative shadow-inner">
          <div className="absolute top-0 w-full flex justify-around opacity-20">
            <div className="w-12 h-2 bg-white rounded"></div>
            <div className="w-12 h-2 bg-white rounded"></div>
            <div className="w-12 h-2 bg-white rounded"></div>
          </div>
          
          {[0, 1, 2].map(i => (
            <div key={`slot-${i}`} className="w-[100px] h-[60px] border-2 border-dashed border-slate-400/50 rounded-xl flex items-center justify-center relative bg-slate-800/50">
              {loadingBuses[i] && (
                <div className={`absolute w-full h-full rounded-xl flex items-center justify-center text-white border-b-4 ${colors[loadingBuses[i].color]} animate-pop-in`}>
                  <div className="font-black text-2xl">{loadingBuses[i].capacity}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 주차장 (그리드) */}
        <div className="flex-1 bg-slate-300 relative p-4">
          <div className="w-full aspect-square bg-slate-400 rounded-xl relative overflow-hidden shadow-inner grid" 
               style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}>
            
            {parkedBuses.map(bus => {
              // 그리드 좌표를 퍼센트로 변환하여 절대 위치 배치
              const left = (bus.x / GRID_SIZE) * 100;
              const top = (bus.y / GRID_SIZE) * 100;
              const width = (bus.w / GRID_SIZE) * 100;
              const height = (bus.h / GRID_SIZE) * 100;
              
              const isBlockedAnimation = animatingBusId === bus.id ? 'animate-shake' : '';

              return (
                <div 
                  key={bus.id}
                  onClick={() => handleBusClick(bus)}
                  className={`absolute p-1 transition-all duration-300 cursor-pointer ${isBlockedAnimation}`}
                  style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
                >
                  <div className={`w-full h-full rounded-lg border-b-4 shadow-md relative flex items-center justify-center text-white/90 ${colors[bus.color]}`}>
                    {/* 버스 유리창 디테일 */}
                    <div className="absolute top-2 w-[80%] h-[30%] bg-white/30 rounded-sm"></div>
                    {getArrowIcon(bus.dir)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 클리어 메시지 */}
        {isClear && (
          <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm animate-pop-in">
            <h2 className="text-5xl font-black text-yellow-400 mb-4 drop-shadow-lg">CLEAR!</h2>
            <button onClick={() => location.reload()} className="bg-white text-slate-900 px-8 py-3 rounded-full font-black text-xl hover:bg-slate-200 transition active:scale-95">
              NEXT LEVEL
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
