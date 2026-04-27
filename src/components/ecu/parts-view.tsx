'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Search,
  Car,
  Cog,
  CircleDot,
  Zap,
  Shield,
  Wrench,
  Disc3,
  Wind,
  Thermometer,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRightLeft,
  ShoppingCart,
  Filter,
  Plus,
  ChevronDown,
  Hash,
} from 'lucide-react'
import { useState } from 'react'

const partCategories = [
  { id: 'engine', label: 'Engine', icon: Cog, count: 1247 },
  { id: 'transmission', label: 'Transmission', icon: CircleDot, count: 432 },
  { id: 'brakes', label: 'Brakes', icon: Shield, count: 658 },
  { id: 'electrical', label: 'Electrical', icon: Zap, count: 891 },
  { id: 'body', label: 'Body', icon: Car, count: 1203 },
  { id: 'suspension', label: 'Suspension', icon: Wrench, count: 567 },
  { id: 'exhaust', label: 'Exhaust', icon: Wind, count: 324 },
  { id: 'cooling', label: 'Cooling', icon: Thermometer, count: 445 },
]

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order'

interface Part {
  id: string
  partNumber: string
  oemNumber: string
  name: string
  manufacturer: string
  category: string
  price: number
  aftermarketPrice?: number
  stock: StockStatus
  compatibility: string[]
  crossReference: string[]
}

const parts: Part[] = [
  { id: '1', partNumber: 'EP-02150', oemNumber: '03L 115 562 A', name: 'Turbocharger Assembly', manufacturer: 'BorgWarner', category: 'engine', price: 1299, aftermarketPrice: 849, stock: 'in_stock', compatibility: ['VW Golf 2.0 TDI', 'Audi A3 2.0 TDI', 'Skoda Octavia 2.0 TDI'], crossReference: ['BW-53039880029', 'GTB2260VK'] },
  { id: '2', partNumber: 'BR-04420', oemNumber: '5Q0 698 151 F', name: 'Front Brake Pad Set', manufacturer: 'ATE', category: 'brakes', price: 89, aftermarketPrice: 49, stock: 'in_stock', compatibility: ['VW Golf MK8', 'Audi A3 8Y', 'Seat Leon MK4', 'Skoda Octavia IV'], crossReference: ['ATE-13.0460-7117.2', 'TRW-GDB2495'] },
  { id: '3', partNumber: 'EL-08931', oemNumber: '04E 906 016 L', name: 'Ignition Coil Pack', manufacturer: 'Bosch', category: 'electrical', price: 45, aftermarketPrice: 29, stock: 'low_stock', compatibility: ['VW Golf 1.4 TSI', 'Audi A1 1.4 TFSI', 'Seat Ibiza 1.4 TSI'], crossReference: ['BOS-0 986 221 021', 'BERU-ZSE041'] },
  { id: '4', partNumber: 'TR-03215', oemNumber: '0CW 300 043 L', name: 'DSG7 Mechatronic Unit', manufacturer: 'VAG OEM', category: 'transmission', price: 2899, aftermarketPrice: 2199, stock: 'pre_order', compatibility: ['VW Golf 1.4 TSI DSG', 'Audi A3 DSG', 'Seat Leon DSG'], crossReference: ['VAG-0CW927769E'] },
  { id: '5', partNumber: 'CO-05110', oemNumber: '5Q0 121 025 CJ', name: 'Water Pump Assembly', manufacturer: 'Gates', category: 'cooling', price: 189, aftermarketPrice: 119, stock: 'in_stock', compatibility: ['VW Golf 2.0 TSI', 'Audi A4 2.0 TFSI', 'Skoda Superb 2.0 TSI'], crossReference: ['GATES-WP0249', 'DAYCO-DP0249'] },
  { id: '6', partNumber: 'SU-02345', oemNumber: '5Q0 412 231 A', name: 'Front Shock Absorber', manufacturer: 'Sachs', category: 'suspension', price: 145, aftermarketPrice: 89, stock: 'in_stock', compatibility: ['VW Golf MK8', 'Audi A3 8Y', 'Seat Leon MK4'], crossReference: ['SACHS-313 521', 'MONRO-G16738'] },
  { id: '7', partNumber: 'EX-06722', oemNumber: '04L 251 052 R', name: 'Diesel Particulate Filter', manufacturer: 'Friedrich Motorsport', category: 'exhaust', price: 799, aftermarketPrice: 549, stock: 'out_of_stock', compatibility: ['VW Golf 2.0 TDI', 'Audi A3 2.0 TDI'], crossReference: ['FM-DPVAG04L'] },
  { id: '8', partNumber: 'BO-01433', oemNumber: '5Q0 807 221 B', name: 'Front Bumper Cover', manufacturer: 'VAG OEM', category: 'body', price: 499, aftermarketPrice: 279, stock: 'in_stock', compatibility: ['VW Golf MK8', 'VW Golf Estate MK8'], crossReference: ['TYC-VW2810100'] },
]

const stockStatusConfig: Record<StockStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  in_stock: { label: 'In Stock', color: '#10b981', icon: CheckCircle2 },
  low_stock: { label: 'Low Stock', color: '#f59e0b', icon: AlertTriangle },
  out_of_stock: { label: 'Out of Stock', color: '#ef4444', icon: XCircle },
  pre_order: { label: 'Pre-order', color: '#8b5cf6', icon: Clock },
}

export function PartsView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [vinInput, setVinInput] = useState('')
  const [vinResult, setVinResult] = useState<string | null>(null)
  const [shoppingList, setShoppingList] = useState<string[]>([])
  const [showCrossRef, setShowCrossRef] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState<'part' | 'vin' | 'keyword'>('part')

  const filteredParts = parts.filter(p => {
    if (selectedCategory && p.category !== selectedCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.partNumber.toLowerCase().includes(q) || p.oemNumber.toLowerCase().includes(q) || p.manufacturer.toLowerCase().includes(q)
    }
    return true
  })

  const checkVinCompatibility = () => {
    if (vinInput.length < 5) return
    const compatibleParts = parts.filter(p => p.compatibility.some(c => c.toLowerCase().includes('golf')))
    setVinResult(`Found ${compatibleParts.length} compatible parts for VIN: ${vinInput.substring(0, 5)}...`)
  }

  const addToShoppingList = (partId: string) => {
    setShoppingList(prev => prev.includes(partId) ? prev.filter(id => id !== partId) : [...prev, partId])
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Parts Catalog</h1>
          </div>
          <p className="text-xs text-[#64748b]">OEM and aftermarket parts database</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-[#151d2b] border-[#1e2a3a] text-[#e2e8f0] hover:bg-[#1e2a3a] gap-2">
            <ShoppingCart className="h-4 w-4" />
            Shopping List ({shoppingList.length})
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-2 mb-3">
            {(['part', 'vin', 'keyword'] as const).map(mode => (
              <Button key={mode} size="sm" variant={searchMode === mode ? 'default' : 'ghost'}
                onClick={() => setSearchMode(mode)}
                className={searchMode === mode ? 'bg-[#00d4ff] text-[#0f1923] text-xs h-8' : 'text-[#64748b] text-xs h-8 hover:text-[#e2e8f0]'}
              >
                {mode === 'part' ? <Hash className="h-3 w-3 mr-1" /> : mode === 'vin' ? <Car className="h-3 w-3 mr-1" /> : <Search className="h-3 w-3 mr-1" />}
                {mode === 'part' ? 'Part Number' : mode === 'vin' ? 'VIN Lookup' : 'Keyword'}
              </Button>
            ))}
          </div>

          {searchMode === 'vin' ? (
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
                <input
                  type="text"
                  placeholder="Enter VIN (e.g., WVWZZZ1KZPW000001)"
                  value={vinInput}
                  onChange={e => setVinInput(e.target.value.toUpperCase())}
                  className="w-full h-9 pl-9 pr-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-sm text-[#e2e8f0] placeholder:text-[#475569] focus:outline-none focus:border-[#00d4ff]/50 font-mono"
                />
              </div>
              <Button onClick={checkVinCompatibility} className="bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold h-9">
                Check
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
              <input
                type="text"
                placeholder={searchMode === 'part' ? 'Search by part number (e.g., EP-02150)' : 'Search by keyword (e.g., turbocharger)'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-sm text-[#e2e8f0] placeholder:text-[#475569] focus:outline-none focus:border-[#00d4ff]/50 font-mono"
              />
            </div>
          )}

          {vinResult && (
            <div className="p-3 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 text-xs text-[#10b981]">
              {vinResult}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Browser */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[#e2e8f0]">Browse Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {partCategories.map(cat => {
            const Icon = cat.icon
            const isActive = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isActive ? null : cat.id)}
                className={`p-3 rounded-lg border text-center transition-all ${isActive ? 'bg-[#00d4ff]/10 border-[#00d4ff]/30' : 'bg-[#151d2b] border-[#1e2a3a] hover:border-[#2d3f55]'}`}
              >
                <Icon className={`h-5 w-5 mx-auto mb-1.5 ${isActive ? 'text-[#00d4ff]' : 'text-[#475569]'}`} />
                <div className={`text-[10px] font-medium ${isActive ? 'text-[#00d4ff]' : 'text-[#94a3b8]'}`}>{cat.label}</div>
                <div className="text-[9px] text-[#475569]">{cat.count}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Parts Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#e2e8f0]">
            {selectedCategory ? partCategories.find(c => c.id === selectedCategory)?.label : 'All Parts'}
            <span className="text-[#475569] ml-2">({filteredParts.length} parts)</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredParts.map(part => {
            const stockConfig = stockStatusConfig[part.stock]
            const StockIcon = stockConfig.icon
            return (
              <Card key={part.id} className="bg-[#151d2b] border-[#1e2a3a] hover:border-[#00d4ff]/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-[#e2e8f0]">{part.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[9px] h-4 bg-[#0f1923] border-[#1e2a3a] text-[#00d4ff] font-mono">{part.partNumber}</Badge>
                        <Badge variant="outline" className="text-[9px] h-4 bg-[#0f1923] border-[#1e2a3a] text-[#8b5cf6] font-mono">OEM: {part.oemNumber}</Badge>
                      </div>
                    </div>
                    <Badge className={`${stockConfig.color === '#10b981' ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' : stockConfig.color === '#f59e0b' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30' : stockConfig.color === '#ef4444' ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30' : 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30'} text-[10px] gap-1`}>
                      <StockIcon className="h-3 w-3" />
                      {stockConfig.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] text-[#475569]">Mfr:</span>
                    <span className="text-[11px] text-[#94a3b8]">{part.manufacturer}</span>
                  </div>

                  {/* Price Comparison */}
                  <div className="flex items-center gap-4 mb-3 p-2.5 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                    <div>
                      <div className="text-[9px] text-[#475569]">OEM</div>
                      <div className="text-sm font-bold text-[#e2e8f0]">${part.price}</div>
                    </div>
                    {part.aftermarketPrice && (
                      <>
                        <div className="h-8 w-px bg-[#1e2a3a]" />
                        <div>
                          <div className="text-[9px] text-[#475569]">Aftermarket</div>
                          <div className="text-sm font-bold text-[#10b981]">${part.aftermarketPrice}</div>
                        </div>
                        <div className="ml-auto">
                          <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">
                            Save {Math.round((1 - part.aftermarketPrice / part.price) * 100)}%
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Compatibility */}
                  <div className="mb-3">
                    <div className="text-[10px] text-[#475569] mb-1">Compatibility</div>
                    <div className="flex flex-wrap gap-1">
                      {part.compatibility.map((comp, i) => (
                        <Badge key={i} variant="outline" className="text-[9px] h-4 bg-[#0f1923] border-[#1e2a3a] text-[#64748b]">{comp}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => addToShoppingList(part.id)}
                      className={`h-7 text-[10px] gap-1 font-semibold ${shoppingList.includes(part.id) ? 'bg-[#10b981] text-[#0f1923] hover:bg-[#10b981]/80' : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'}`}
                    >
                      {shoppingList.includes(part.id) ? <CheckCircle2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      {shoppingList.includes(part.id) ? 'Added' : 'Add to List'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCrossRef(showCrossRef === part.id ? null : part.id)}
                      className="h-7 text-[10px] bg-[#0f1923] border-[#1e2a3a] text-[#64748b] hover:text-[#e2e8f0] gap-1"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      Cross-Ref
                    </Button>
                  </div>

                  {/* Cross Reference */}
                  {showCrossRef === part.id && (
                    <div className="mt-3 p-2.5 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                      <div className="text-[10px] text-[#475569] mb-1.5">Cross-Reference Numbers</div>
                      <div className="flex flex-wrap gap-1.5">
                        {part.crossReference.map((ref, i) => (
                          <Badge key={i} variant="outline" className="text-[9px] h-5 bg-[#151d2b] border-[#2d3f55] text-[#00d4ff] font-mono">{ref}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Shopping List Summary */}
      {shoppingList.length > 0 && (
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-[#00d4ff]" />
              Shopping List ({shoppingList.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {parts.filter(p => shoppingList.includes(p.id)).map(part => (
                <div key={part.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] h-4 bg-[#0f1923] border-[#1e2a3a] text-[#00d4ff] font-mono">{part.partNumber}</Badge>
                    <span className="text-xs text-[#e2e8f0]">{part.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#00d4ff]">${part.price}</span>
                    <Button size="sm" variant="ghost" onClick={() => addToShoppingList(part.id)} className="h-6 w-6 p-0 text-[#ef4444] hover:text-[#ef4444]">
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1e2a3a]">
              <div className="text-sm font-bold text-[#e2e8f0]">
                Total: <span className="text-[#00d4ff]">${parts.filter(p => shoppingList.includes(p.id)).reduce((sum, p) => sum + p.price, 0)}</span>
              </div>
              <Button className="bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold h-8 text-xs">
                Generate Order
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
