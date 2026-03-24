/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Users, 
  Trophy, 
  Group, 
  Trash2, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Settings2,
  FileText,
  Plus,
  Download,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';

// --- Types ---

interface Person {
  id: string;
  name: string;
}

type Tab = 'list' | 'draw' | 'group';

// --- Components ---

export default function App() {
  const [people, setPeople] = useState<Person[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [inputText, setInputText] = useState('');
  
  // Lucky Draw State
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<Person | null>(null);
  const [drawHistory, setDrawHistory] = useState<Person[]>([]);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [drawingPool, setDrawingPool] = useState<Person[]>([]);
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(0);

  // Grouping State
  const [groupSize, setGroupSize] = useState(3);
  const [groups, setGroups] = useState<Person[][]>([]);

  // Derived state for duplicates
  const nameCounts = people.reduce((acc, p) => {
    acc[p.name] = (acc[p.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const duplicateNames = Object.keys(nameCounts).filter(name => nameCounts[name] > 1);

  // --- Handlers ---

  const loadMockData = () => {
    const mockNames = [
      '陳大文', '林小明', '張美玲', '王小華', '李志強', 
      '黃雅婷', '吳建宏', '蔡淑芬', '劉德華', '周杰倫',
      '林志玲', '郭台銘', '馬雲', '張忠謀', '蔡英文',
      '陳其邁', '柯文哲', '韓國瑜', '侯友宜', '賴清德'
    ];
    const newPeople = mockNames.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name
    }));
    setPeople(newPeople);
  };

  const removeDuplicates = () => {
    const seen = new Set();
    const uniquePeople = people.filter(p => {
      if (seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    });
    setPeople(uniquePeople);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const names = results.data
          .flat()
          .map(n => String(n).trim())
          .filter(n => n.length > 0);
        
        const newPeople = names.map(name => ({
          id: Math.random().toString(36).substr(2, 9),
          name
        }));
        
        setPeople(prev => [...prev, ...newPeople]);
      },
      header: false
    });
  };

  const handleAddFromText = () => {
    const names = inputText
      .split(/[\n,]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);
    
    const newPeople = names.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name
    }));
    
    setPeople(prev => [...prev, ...newPeople]);
    setInputText('');
  };

  const clearList = () => {
    if (confirm('確定要清除所有名單嗎？')) {
      setPeople([]);
      setDrawHistory([]);
      setWinner(null);
      setGroups([]);
    }
  };

  const startLuckyDraw = () => {
    if (isDrawing) return;
    
    const pool = allowDuplicates ? people : drawingPool;
    if (pool.length === 0) {
      alert('名單已抽完！');
      return;
    }

    setIsDrawing(true);
    setWinner(null);

    // Animation logic
    let counter = 0;
    const duration = 3000; // 3 seconds
    const interval = 80;
    const totalSteps = duration / interval;

    const timer = setInterval(() => {
      setCurrentDisplayIndex(Math.floor(Math.random() * pool.length));
      counter++;

      if (counter >= totalSteps) {
        clearInterval(timer);
        const finalIndex = Math.floor(Math.random() * pool.length);
        const selected = pool[finalIndex];
        
        setWinner(selected);
        setIsDrawing(false);
        setDrawHistory(prev => [selected, ...prev]);
        
        if (!allowDuplicates) {
          setDrawingPool(prev => prev.filter(p => p.id !== selected.id));
        }

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }, interval);
  };

  const resetDraw = () => {
    setWinner(null);
    setDrawHistory([]);
    setDrawingPool(people);
  };

  const generateGroups = () => {
    if (people.length === 0) return;
    
    const shuffled = [...people].sort(() => Math.random() - 0.5);
    const result: Person[][] = [];
    
    for (let i = 0; i < shuffled.length; i += groupSize) {
      result.push(shuffled.slice(i, i + groupSize));
    }
    
    setGroups(result);
  };

  const downloadGroupsCSV = () => {
    if (groups.length === 0) return;

    const csvData = groups.flatMap((group, idx) => 
      group.map(p => ({ Group: `第 ${idx + 1} 組`, Name: p.name }))
    );

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `分組結果_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Render Helpers ---

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Users className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">HR 抽籤與分組小助手</h1>
          </div>
          <nav className="flex gap-1 bg-[#F3F4F6] p-1 rounded-xl">
            {(['list', 'draw', 'group'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-[#6B7280] hover:text-[#1A1A1A]'
                }`}
              >
                {tab === 'list' && '名單管理'}
                {tab === 'draw' && '獎品抽籤'}
                {tab === 'group' && '自動分組'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {/* List Management Tab */}
          {activeTab === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-600" />
                    新增名單
                  </h2>
                  <div className="space-y-4">
                    <button
                      onClick={loadMockData}
                      className="w-full bg-indigo-50 text-indigo-600 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 border border-indigo-100"
                    >
                      <Sparkles className="w-4 h-4" /> 載入模擬名單
                    </button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-[#E5E7EB]"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-[#9CA3AF]">或</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4B5563] mb-2">上傳 CSV 檔案</label>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#D1D5DB] rounded-xl cursor-pointer hover:bg-[#F9FAFB] transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-[#9CA3AF] mb-2" />
                          <p className="text-xs text-[#6B7280]">點擊或拖拽上傳</p>
                        </div>
                        <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-[#E5E7EB]"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-[#9CA3AF]">或</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4B5563] mb-2">手動輸入姓名</label>
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="每行一個姓名，或用逗號分隔"
                        className="w-full h-32 p-3 text-sm border border-[#D1D5DB] rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                      />
                      <button
                        onClick={handleAddFromText}
                        className="w-full mt-3 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> 加入名單
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        當前名單 ({people.length})
                      </h2>
                      {duplicateNames.length > 0 && (
                        <button
                          onClick={removeDuplicates}
                          className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1.5 hover:bg-amber-100 transition-colors"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          發現重複姓名，點擊一鍵清除
                        </button>
                      )}
                    </div>
                    <button
                      onClick={clearList}
                      className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> 清除全部
                    </button>
                  </div>
                  <div className="p-6">
                    {people.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-[#D1D5DB] mx-auto mb-4" />
                        <p className="text-[#6B7280]">目前還沒有名單，請從左側新增。</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {people.map((person) => {
                          const isDuplicate = nameCounts[person.name] > 1;
                          return (
                            <div 
                              key={person.id}
                              className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center justify-between group transition-colors ${
                                isDuplicate 
                                  ? 'bg-amber-50 border-amber-200 text-amber-900' 
                                  : 'bg-[#F9FAFB] border-[#F3F4F6]'
                              }`}
                            >
                              <span className="truncate">{person.name}</span>
                              <button 
                                onClick={() => setPeople(prev => prev.filter(p => p.id !== person.id))}
                                className={`transition-opacity opacity-0 group-hover:opacity-100 ${
                                  isDuplicate ? 'text-amber-500 hover:text-red-600' : 'text-[#9CA3AF] hover:text-red-600'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Lucky Draw Tab */}
          {activeTab === 'draw' && (
            <motion.div
              key="draw"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white p-8 rounded-3xl border border-[#E5E7EB] shadow-xl text-center relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
                
                <div className="mb-8">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold">幸運大抽籤</h2>
                  <p className="text-[#6B7280] mt-2">
                    {allowDuplicates ? '重複抽取模式' : `不重複抽取模式 (剩餘 ${drawingPool.length} 人)`}
                  </p>
                </div>

                <div className="h-48 flex items-center justify-center mb-8">
                  <AnimatePresence mode="wait">
                    {isDrawing ? (
                      <motion.div
                        key="drawing"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-5xl font-black text-indigo-600 tracking-widest"
                      >
                        {(allowDuplicates ? people : drawingPool)[currentDisplayIndex]?.name || '...'}
                      </motion.div>
                    ) : winner ? (
                      <motion.div
                        key="winner"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        className="flex flex-col items-center"
                      >
                        <span className="text-sm uppercase tracking-widest text-indigo-600 font-bold mb-2">恭喜中獎者</span>
                        <span className="text-6xl font-black text-[#1A1A1A]">{winner.name}</span>
                      </motion.div>
                    ) : (
                      <div className="text-[#D1D5DB] text-xl font-medium italic">
                        準備好了嗎？
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={startLuckyDraw}
                    disabled={isDrawing || (people.length === 0)}
                    className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 flex items-center gap-3"
                  >
                    <Play className="w-6 h-6" /> {isDrawing ? '抽籤中...' : '開始抽籤'}
                  </button>
                  <button
                    onClick={resetDraw}
                    className="px-6 py-4 bg-white border border-[#D1D5DB] text-[#4B5563] rounded-2xl font-bold hover:bg-[#F9FAFB] transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" /> 重置
                  </button>
                </div>

                <div className="mt-12 pt-8 border-t border-[#F3F4F6] flex items-center justify-center gap-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={allowDuplicates}
                        onChange={(e) => setAllowDuplicates(e.target.checked)}
                      />
                      <div className={`w-12 h-6 rounded-full transition-colors ${allowDuplicates ? 'bg-indigo-600' : 'bg-[#D1D5DB]'}`} />
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${allowDuplicates ? 'translate-x-6' : ''}`} />
                    </div>
                    <span className="text-sm font-medium text-[#4B5563] group-hover:text-[#1A1A1A]">允許重複中獎</span>
                  </label>
                </div>
              </div>

              {/* Draw History */}
              {drawHistory.length > 0 && (
                <div className="mt-8 bg-white rounded-2xl border border-[#E5E7EB] p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#9CA3AF] mb-4">中獎紀錄</h3>
                  <div className="flex flex-wrap gap-3">
                    {drawHistory.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#F9FAFB] px-3 py-1.5 rounded-lg border border-[#F3F4F6]">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Auto Grouping Tab */}
          {activeTab === 'group' && (
            <motion.div
              key="group"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Settings2 className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold">分組設定</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#4B5563]">每組人數</span>
                    <input 
                      type="number" 
                      min="1" 
                      max={people.length}
                      value={groupSize}
                      onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                      className="w-16 p-2 border border-[#D1D5DB] rounded-lg text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={generateGroups}
                    disabled={people.length === 0}
                    className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:bg-[#E5E7EB] transition-all flex items-center justify-center gap-2"
                  >
                    <Group className="w-5 h-5" /> 隨機分組
                  </button>
                  {groups.length > 0 && (
                    <button
                      onClick={downloadGroupsCSV}
                      className="w-full md:w-auto px-6 py-3 bg-white border border-[#D1D5DB] text-[#4B5563] rounded-xl font-bold hover:bg-[#F9FAFB] transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" /> 下載 CSV
                    </button>
                  )}
                </div>
              </div>

              {groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
                    >
                      <div className="bg-[#F9FAFB] px-5 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
                        <span className="font-bold text-indigo-600">第 {idx + 1} 組</span>
                        <span className="text-xs text-[#9CA3AF] font-medium">{group.length} 人</span>
                      </div>
                      <div className="p-5 space-y-2">
                        {group.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 text-[#4B5563]">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <span className="text-sm font-medium">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-[#E5E7EB] p-20 text-center">
                  <Group className="w-16 h-16 text-[#D1D5DB] mx-auto mb-4" />
                  <p className="text-[#6B7280] text-lg">點擊上方按鈕開始自動分組</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-6xl mx-auto p-6 text-center text-[#9CA3AF] text-xs">
        &copy; 2026 HR 抽籤與分組小助手 &middot; 提升團隊效率的簡單工具
      </footer>
    </div>
  );
}
