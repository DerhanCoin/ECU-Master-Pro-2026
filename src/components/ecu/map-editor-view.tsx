'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Grid3x3,
  Layers,
  Undo2,
  Redo2,
  Download,
  Eye,
  BarChart3,
  Crosshair,
  Copy,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Save,
  ZoomIn,
  Palette,
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'

type MapType = 'ignition' | 'injection' | 'boost' | 'vanos' | 'lambda'

interface MapTypeInfo {
  id: MapType
  label: string
  unit: string
  colorStart: string
  colorEnd: string
  rangeMin: number
  rangeMax: number
}

const mapTypes: MapTypeInfo[] = [
  { id: 'ignition', label: 'Ignition', unit: '°BTDC', colorStart: '#1e3a5f', colorEnd: '#ff4444', rangeMin: 8, rangeMax: 38 },
  { id: 'injection', label: 'Injection', unit: 'ms', colorStart: '#1e3a2f', colorEnd: '#00ff88', rangeMin: 1.0, rangeMax: 8.0 },
  { id: 'boost', label: 'Boost', unit: 'bar', colorStart: '#1e2a3a', colorEnd: '#00d4ff', rangeMin: 0.5, rangeMax: 2.5 },
  { id: 'vanos', label: 'VANOS', unit: '°', colorStart: '#2a1e3a', colorEnd: '#8b5cf6', rangeMin: -10, rangeMax: 50 },
  { id: 'lambda', label: 'Lambda', unit: 'λ', colorStart: '#3a2a1e', colorEnd: '#f59e0b', rangeMin: 0.7, rangeMax: 1.2 },
]

const GRID_SIZE = 16
const rpmLabels = [800, 1000, 1200, 1500, 1800, 2000, 2200, 2500, 2800, 3000, 3500, 4000, 4500, 5000, 5500, 6000]
const loadLabels = [10, 20, 30, 40, 50, 60, 70, 80, 85, 90, 92, 95, 97, 98, 99, 100]

function generateMapData(mapType: MapType): number[][] {
  const info = mapTypes.find(m => m.id === mapType)!
  const range = info.rangeMax - info.rangeMin
  const data: number[][] = []
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowData: number[] = []
    for (let col = 0; col < GRID_SIZE; col++) {
      const loadFactor = row / (GRID_SIZE - 1)
      const rpmFactor = col / (GRID_SIZE - 1)
      let base: number
      switch (mapType) {
        case 'ignition':
          base = info.rangeMin + range * (1 - loadFactor * 0.6) * (0.5 + rpmFactor * 0.5)
          break
        case 'injection':
          base = info.rangeMin + range * (loadFactor * 0.7 + rpmFactor * 0.3)
          break
        case 'boost':
          base = info.rangeMin + range * (loadFactor * 0.8) * (0.3 + rpmFactor * 0.7)
          break
        case 'vanos':
          base = info.rangeMin + range * (rpmFactor * 0.6 + loadFactor * 0.4)
          break
        case 'lambda':
          base = info.rangeMin + range * 0.3 + range * loadFactor * 0.4
          break
        default:
          base = info.rangeMin + range * 0.5
      }
      const noise = (Math.random() - 0.5) * range * 0.05
      rowData.push(+(base + noise).toFixed(mapType === 'injection' || mapType === 'lambda' || mapType === 'boost' ? 2 : 1))
    }
    data.push(rowData)
  }
  return data
}

function getCellColor(value: number, min: number, max: number, colorStart: string, colorEnd: string): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const r1 = parseInt(colorStart.slice(1, 3), 16)
  const g1 = parseInt(colorStart.slice(3, 5), 16)
  const b1 = parseInt(colorStart.slice(5, 7), 16)
  const r2 = parseInt(colorEnd.slice(1, 3), 16)
  const g2 = parseInt(colorEnd.slice(3, 5), 16)
  const b2 = parseInt(colorEnd.slice(5, 7), 16)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

export function MapEditorView() {
  const [activeMapType, setActiveMapType] = useState<MapType>('ignition')
  const [mapData, setMapData] = useState<Record<MapType, number[][]>>(() => ({
    ignition: generateMapData('ignition'),
    injection: generateMapData('injection'),
    boost: generateMapData('boost'),
    vanos: generateMapData('vanos'),
    lambda: generateMapData('lambda'),
  }))
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [undoStack, setUndoStack] = useState<number[][][]>([])
  const [redoStack, setRedoStack] = useState<number[][][]>([])

  const stockData = useMemo(() => ({
    ignition: generateMapData('ignition'),
    injection: generateMapData('injection'),
    boost: generateMapData('boost'),
    vanos: generateMapData('vanos'),
    lambda: generateMapData('lambda'),
  }), [])

  const currentMapInfo = mapTypes.find(m => m.id === activeMapType)!
  const currentData = mapData[activeMapType]
  const stockMapData = stockData[activeMapType]

  const stats = useMemo(() => {
    const allValues = currentData.flat()
    const min = Math.min(...allValues)
    const max = Math.max(...allValues)
    const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length
    const modified = allValues.filter((v, i) => v !== stockMapData.flat()[i]).length
    return { min, max, avg, modified }
  }, [currentData, stockMapData])

  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col })
  }, [])

  const handleCellValueChange = useCallback((value: string) => {
    if (!selectedCell) return
    const numVal = parseFloat(value)
    if (isNaN(numVal)) return
    const clamped = Math.max(currentMapInfo.rangeMin, Math.min(currentMapInfo.rangeMax, numVal))

    setUndoStack(prev => [...prev.slice(-19), currentData.map(r => [...r])])
    setRedoStack([])

    setMapData(prev => ({
      ...prev,
      [activeMapType]: prev[activeMapType].map((row, ri) =>
        ri === selectedCell.row
          ? row.map((cell, ci) => (ci === selectedCell.col ? clamped : cell))
          : row
      ),
    }))
  }, [selectedCell, currentMapInfo, activeMapType, currentData])

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    setRedoStack(prev => [...prev, currentData.map(r => [...r])])
    const prev = undoStack[undoStack.length - 1]
    setUndoStack(s => s.slice(0, -1))
    setMapData(pd => ({ ...pd, [activeMapType]: prev }))
  }, [undoStack, currentData, activeMapType])

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return
    setUndoStack(prev => [...prev, currentData.map(r => [...r])])
    const next = redoStack[redoStack.length - 1]
    setRedoStack(s => s.slice(0, -1))
    setMapData(pd => ({ ...pd, [activeMapType]: next }))
  }, [redoStack, currentData, activeMapType])

  const cellSize = 36
  const labelWidth = 42
  const labelHeight = 28
  const svgWidth = labelWidth + cellSize * GRID_SIZE
  const svgHeight = labelHeight + cellSize * GRID_SIZE

  const selectedValue = selectedCell ? currentData[selectedCell.row][selectedCell.col] : null

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Grid3x3 className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Map Editor</h1>
            <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[10px]">
              ADVANCED
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">3D ECU map visualization and editing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-8 text-xs text-[#64748b] hover:text-[#e2e8f0] gap-1" onClick={handleUndo} disabled={undoStack.length === 0}>
            <Undo2 className="h-3 w-3" /> Undo
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs text-[#64748b] hover:text-[#e2e8f0] gap-1" onClick={handleRedo} disabled={redoStack.length === 0}>
            <Redo2 className="h-3 w-3" /> Redo
          </Button>
          <Button size="sm" className="h-8 text-xs bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 hover:bg-[#00d4ff]/30 gap-1" onClick={() => setShowComparison(!showComparison)}>
            <Eye className="h-3 w-3" /> {showComparison ? 'Hide' : 'Compare'}
          </Button>
          <Button size="sm" className="h-8 text-xs bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 hover:bg-[#10b981]/30 gap-1">
            <Download className="h-3 w-3" /> Export
          </Button>
        </div>
      </div>

      {/* Map Type Selector */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#00d4ff]" />
            Map Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {mapTypes.map(mt => (
              <button
                key={mt.id}
                onClick={() => { setActiveMapType(mt.id); setSelectedCell(null) }}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  activeMapType === mt.id
                    ? 'border-[#00d4ff]/50 bg-[#00d4ff]/10 text-[#00d4ff]'
                    : 'border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8] hover:border-[#2d3f55] hover:text-[#e2e8f0]'
                }`}
              >
                {mt.label} ({mt.unit})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Map Grid + Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
        {/* Map Grid */}
        <Card className="bg-[#151d2b] border-[#1e2a3a] overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Crosshair className="h-4 w-4" style={{ color: currentMapInfo.colorEnd }} />
                {currentMapInfo.label} Map — {GRID_SIZE}×{GRID_SIZE}
              </CardTitle>
              <Badge className="text-[9px] bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55]">
                {stats.modified} cells modified
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <svg width={svgWidth} height={svgHeight} className="block">
              {/* Column headers (RPM) */}
              {rpmLabels.map((rpm, col) => (
                <text
                  key={`rpm-${col}`}
                  x={labelWidth + col * cellSize + cellSize / 2}
                  y={labelHeight - 6}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {rpm >= 1000 ? `${rpm / 1000}k` : rpm}
                </text>
              ))}
              {/* Row headers (Load) */}
              {loadLabels.map((load, row) => (
                <text
                  key={`load-${row}`}
                  x={labelWidth - 4}
                  y={labelHeight + row * cellSize + cellSize / 2 + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {load}%
                </text>
              ))}
              {/* Grid cells */}
              {currentData.map((row, ri) =>
                row.map((value, ci) => {
                  const isSelected = selectedCell?.row === ri && selectedCell?.col === ci
                  const stockVal = stockMapData[ri][ci]
                  const isDiff = showComparison && Math.abs(value - stockVal) > 0.01
                  const cellColor = getCellColor(value, currentMapInfo.rangeMin, currentMapInfo.rangeMax, currentMapInfo.colorStart, currentMapInfo.colorEnd)
                  return (
                    <g key={`${ri}-${ci}`} onClick={() => handleCellClick(ri, ci)} className="cursor-pointer">
                      <rect
                        x={labelWidth + ci * cellSize}
                        y={labelHeight + ri * cellSize}
                        width={cellSize - 1}
                        height={cellSize - 1}
                        fill={cellColor}
                        rx={2}
                        stroke={isSelected ? '#00d4ff' : isDiff ? '#f59e0b' : '#0f1923'}
                        strokeWidth={isSelected ? 2 : isDiff ? 1 : 0.5}
                        opacity={0.85}
                      />
                      <text
                        x={labelWidth + ci * cellSize + cellSize / 2}
                        y={labelHeight + ri * cellSize + cellSize / 2 + 3}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="7"
                        fontFamily="monospace"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        {currentMapInfo.id === 'injection' || currentMapInfo.id === 'lambda' || currentMapInfo.id === 'boost'
                          ? value.toFixed(2)
                          : value.toFixed(1)}
                      </text>
                    </g>
                  )
                })
              )}
              {/* Axis labels */}
              <text x={labelWidth + (cellSize * GRID_SIZE) / 2} y={svgHeight - 2} textAnchor="middle" fill="#475569" fontSize="9">
                RPM →
              </text>
              <text x={6} y={labelHeight + (cellSize * GRID_SIZE) / 2} textAnchor="middle" fill="#475569" fontSize="9" transform={`rotate(-90, 6, ${labelHeight + (cellSize * GRID_SIZE) / 2})`}>
                Load % →
              </text>
            </svg>
          </CardContent>
        </Card>

        {/* Sidebar - Stats & Cell Editor */}
        <div className="space-y-4">
          {/* Map Statistics */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#00d4ff]" />
                Map Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b]">Min Value</span>
                <span className="text-xs font-mono font-bold text-[#00d4ff]">{stats.min.toFixed(2)} {currentMapInfo.unit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b]">Max Value</span>
                <span className="text-xs font-mono font-bold text-[#ef4444]">{stats.max.toFixed(2)} {currentMapInfo.unit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b]">Average</span>
                <span className="text-xs font-mono font-bold text-[#e2e8f0]">{stats.avg.toFixed(2)} {currentMapInfo.unit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b]">Cells Modified</span>
                <span className="text-xs font-mono font-bold text-[#f59e0b]">{stats.modified} / {GRID_SIZE * GRID_SIZE}</span>
              </div>
            </CardContent>
          </Card>

          {/* Cell Editor */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-[#8b5cf6]" />
                Cell Editor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCell && selectedValue !== null ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#0f1923] border border-[#1e2a3a] rounded p-2">
                      <span className="text-[#475569]">RPM</span>
                      <div className="font-mono font-bold text-[#e2e8f0]">{rpmLabels[selectedCell.col]}</div>
                    </div>
                    <div className="bg-[#0f1923] border border-[#1e2a3a] rounded p-2">
                      <span className="text-[#475569]">Load</span>
                      <div className="font-mono font-bold text-[#e2e8f0]">{loadLabels[selectedCell.row]}%</div>
                    </div>
                  </div>
                  <div className="bg-[#0f1923] border border-[#1e2a3a] rounded p-2">
                    <span className="text-[10px] text-[#475569]">Current Value</span>
                    <div className="font-mono text-lg font-bold" style={{ color: getCellColor(selectedValue, currentMapInfo.rangeMin, currentMapInfo.rangeMax, currentMapInfo.colorStart, currentMapInfo.colorEnd) }}>
                      {selectedValue.toFixed(2)} {currentMapInfo.unit}
                    </div>
                  </div>
                  <div className="bg-[#0f1923] border border-[#1e2a3a] rounded p-2">
                    <span className="text-[10px] text-[#475569]">Stock Value</span>
                    <div className="font-mono text-sm text-[#64748b]">
                      {stockMapData[selectedCell.row][selectedCell.col].toFixed(2)} {currentMapInfo.unit}
                    </div>
                  </div>
                  <input
                    type="number"
                    step={currentMapInfo.id === 'injection' || currentMapInfo.id === 'lambda' || currentMapInfo.id === 'boost' ? 0.01 : 0.5}
                    defaultValue={selectedValue}
                    onBlur={e => handleCellValueChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCellValueChange((e.target as HTMLInputElement).value) }}
                    className="w-full h-8 text-sm font-mono bg-[#1e2a3a] border border-[#2d3f55] rounded px-2 text-[#e2e8f0] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Enter new value..."
                  />
                  <div className="text-[10px] text-[#475569]">
                    Range: {currentMapInfo.rangeMin} – {currentMapInfo.rangeMax} {currentMapInfo.unit}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Grid3x3 className="h-8 w-8 text-[#1e2a3a] mx-auto mb-2" />
                  <p className="text-xs text-[#475569]">Click a cell on the map to edit</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Color Legend */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#f59e0b]" />
                Color Legend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div
                  className="h-4 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${currentMapInfo.colorStart}, ${currentMapInfo.colorEnd})`,
                  }}
                />
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#475569]">{currentMapInfo.rangeMin} {currentMapInfo.unit}</span>
                  <span className="text-[#475569]">{currentMapInfo.rangeMax} {currentMapInfo.unit}</span>
                </div>
              </div>
              {showComparison && (
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-[10px]">
                    <div className="w-3 h-3 rounded border-2 border-[#f59e0b]" />
                    <span className="text-[#94a3b8]">Modified from stock</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <div className="w-3 h-3 rounded border-2 border-[#00d4ff]" />
                    <span className="text-[#94a3b8]">Selected cell</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
