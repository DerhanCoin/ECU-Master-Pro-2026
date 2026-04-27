'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShoppingCart,
  Search,
  Star,
  Heart,
  Filter,
  Package,
  Cable,
  Monitor,
  Key,
  Wrench,
  Layers,
  X,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  Zap,
  Truck,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'

const categories = [
  { id: 'all', label: 'All Products', icon: Package },
  { id: 'diagnostic', label: 'Diagnostic Tools', icon: Monitor },
  { id: 'cables', label: 'Cables & Adapters', icon: Cable },
  { id: 'software', label: 'Software Licenses', icon: Key },
  { id: 'accessories', label: 'Accessories', icon: Wrench },
  { id: 'bundles', label: 'Bundles', icon: Layers },
]

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  rating: number
  reviews: number
  category: string
  brand: string
  image: string
  inStock: boolean
  featured?: boolean
  sale?: boolean
  description: string
}

const products: Product[] = [
  { id: '1', name: 'VAS 6154+', price: 899, originalPrice: 1099, rating: 4.8, reviews: 234, category: 'diagnostic', brand: 'VAG', image: '🔍', inStock: true, featured: true, sale: true, description: 'Official VAG diagnostic interface with DoIP support for VW, Audi, Seat, Skoda' },
  { id: '2', name: 'OBDLink MX+', price: 299, rating: 4.6, reviews: 512, category: 'diagnostic', brand: 'ScanTool', image: '📡', inStock: true, featured: true, description: 'Professional OBD-II scanner with multi-protocol support and real-time data' },
  { id: '3', name: 'J2534 Passthru Pro', price: 1249, originalPrice: 1499, rating: 4.7, reviews: 89, category: 'diagnostic', brand: 'DrewTech', image: '🔧', inStock: true, sale: true, description: 'SAE J2534 pass-through device for ECU reprogramming and module flashing' },
  { id: '4', name: 'CAN Analyzer Kit', price: 449, rating: 4.5, reviews: 167, category: 'diagnostic', brand: 'Vector', image: '📊', inStock: true, description: 'High-speed CAN/LIN bus analyzer with trace and simulation capabilities' },
  { id: '5', name: 'DoIP Gateway', price: 579, rating: 4.4, reviews: 98, category: 'diagnostic', brand: 'Softing', image: '🌐', inStock: false, description: 'Diagnostic over IP gateway for modern vehicle architectures' },
  { id: '6', name: 'ECU Flash Cable', price: 89, rating: 4.3, reviews: 342, category: 'cables', brand: 'ProCable', image: '🔌', inStock: true, description: 'BDM/JTAG flashing cable for ECU read/write operations' },
  { id: '7', name: 'Universal OBD Cable Set', price: 149, originalPrice: 189, rating: 4.6, reviews: 278, category: 'cables', brand: 'AutoCable', image: '🔗', inStock: true, sale: true, description: 'Complete set of OBD adapters covering 16-pin and legacy connectors' },
  { id: '8', name: 'Professional Kit Bundle', price: 2199, originalPrice: 2899, rating: 4.9, reviews: 45, category: 'bundles', brand: 'ECU Master', image: '📦', inStock: true, featured: true, sale: true, description: 'Complete diagnostic kit: VAS 6154+, J2534, cables, and 1-year license' },
]

const brandFilters = ['All Brands', 'VAG', 'ScanTool', 'DrewTech', 'Vector', 'Softing', 'ProCable', 'AutoCable', 'ECU Master']

export function ShopView() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cartItems, setCartItems] = useState<{ product: Product; qty: number }[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [showCart, setShowCart] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState('All Brands')
  const [priceRange, setPriceRange] = useState<'all' | 'under200' | '200to500' | '500plus'>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.brand.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (selectedBrand !== 'All Brands' && p.brand !== selectedBrand) return false
    if (priceRange === 'under200' && p.price >= 200) return false
    if (priceRange === '200to500' && (p.price < 200 || p.price > 500)) return false
    if (priceRange === '500plus' && p.price < 500) return false
    return true
  })

  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0)
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0)

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(i => i.product.id !== productId))
  }

  const updateQty = (productId: string, delta: number) => {
    setCartItems(prev => prev.map(i => {
      if (i.product.id !== productId) return i
      const newQty = i.qty + delta
      return newQty > 0 ? { ...i, qty: newQty } : i
    }))
  }

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId])
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">ECU Master Shop</h1>
          </div>
          <p className="text-xs text-[#64748b]">Diagnostic equipment and accessories store</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCart(!showCart)}
            className="relative bg-[#151d2b] border-[#1e2a3a] text-[#e2e8f0] hover:bg-[#1e2a3a] hover:border-[#00d4ff]/30 gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
            {cartCount > 0 && (
              <Badge className="bg-[#00d4ff] text-[#0f1923] text-[10px] h-5 min-w-5 flex items-center justify-center">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
              <input
                type="text"
                placeholder="Search products, brands..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-sm text-[#e2e8f0] placeholder:text-[#475569] focus:outline-none focus:border-[#00d4ff]/50"
              />
            </div>
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="h-9 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-sm text-[#e2e8f0] focus:outline-none focus:border-[#00d4ff]/50"
            >
              {brandFilters.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="flex gap-2">
              {(['all', 'under200', '200to500', '500plus'] as const).map(range => (
                <Button
                  key={range}
                  size="sm"
                  variant={priceRange === range ? 'default' : 'outline'}
                  onClick={() => setPriceRange(range)}
                  className={priceRange === range ? 'bg-[#00d4ff] text-[#0f1923] h-9 text-xs' : 'bg-[#0f1923] border-[#1e2a3a] text-[#64748b] h-9 text-xs hover:text-[#e2e8f0]'}
                >
                  {range === 'all' ? 'All' : range === 'under200' ? '<$200' : range === '200to500' ? '$200-500' : '$500+'}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => {
              const Icon = cat.icon
              return (
                <Button
                  key={cat.id}
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 gap-2 text-xs h-8 ${selectedCategory === cat.id ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30' : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]'}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Featured Products */}
      {selectedCategory === 'all' && !searchQuery && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#f59e0b]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Featured & On Sale</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.filter(p => p.featured || p.sale).slice(0, 3).map(product => (
              <Card key={product.id} className="bg-[#151d2b] border-[#1e2a3a] hover:border-[#00d4ff]/30 transition-all group cursor-pointer" onClick={() => setSelectedProduct(product)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{product.image}</div>
                    <div className="flex gap-1.5">
                      {product.sale && <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[10px]">SALE</Badge>}
                      {product.featured && <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[10px]">FEATURED</Badge>}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">{product.name}</h3>
                  <p className="text-[11px] text-[#64748b] mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#1e2a3a]'}`} />
                    ))}
                    <span className="text-[10px] text-[#64748b] ml-1">({product.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-[#00d4ff]">${product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-[#475569] line-through">${product.originalPrice}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={e => { e.stopPropagation(); addToCart(product) }}
                      className="h-7 text-[10px] bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#e2e8f0]">
            {selectedCategory === 'all' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.label}
            <span className="text-[#475569] ml-2">({filteredProducts.length} items)</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <Card key={product.id} className="bg-[#151d2b] border-[#1e2a3a] hover:border-[#00d4ff]/30 transition-all group cursor-pointer" onClick={() => setSelectedProduct(product)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-[#0f1923] flex items-center justify-center text-2xl">{product.image}</div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleWishlist(product.id) }}
                    className="p-1.5 rounded-md hover:bg-[#1e2a3a] transition-colors"
                  >
                    <Heart className={`h-4 w-4 ${wishlist.includes(product.id) ? 'text-[#ef4444] fill-[#ef4444]' : 'text-[#475569]'}`} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge variant="outline" className="text-[9px] h-4 bg-[#1e2a3a] border-[#2d3f55] text-[#64748b]">{product.brand}</Badge>
                  {!product.inStock && <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[9px]">Out of Stock</Badge>}
                </div>
                <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1 group-hover:text-[#00d4ff] transition-colors">{product.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-2.5 w-2.5 ${i < Math.floor(product.rating) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#1e2a3a]'}`} />
                  ))}
                  <span className="text-[10px] text-[#475569]">({product.reviews})</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-base font-bold text-[#00d4ff]">${product.price}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-[#475569] line-through ml-1">${product.originalPrice}</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    disabled={!product.inStock}
                    onClick={e => { e.stopPropagation(); addToCart(product) }}
                    className="h-7 text-[10px] bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1 disabled:opacity-40"
                  >
                    <ShoppingCart className="h-3 w-3" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}>
          <Card className="bg-[#151d2b] border-[#1e2a3a] w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-[#0f1923] flex items-center justify-center text-3xl">{selectedProduct.image}</div>
                <div>
                  <CardTitle className="text-base text-[#e2e8f0]">{selectedProduct.name}</CardTitle>
                  <p className="text-xs text-[#64748b]">{selectedProduct.brand}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)} className="text-[#475569] hover:text-[#e2e8f0]">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#94a3b8]">{selectedProduct.description}</p>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(selectedProduct.rating) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#1e2a3a]'}`} />
                ))}
                <span className="text-xs text-[#64748b]">{selectedProduct.rating} ({selectedProduct.reviews} reviews)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                  <div className="text-[10px] text-[#475569] mb-1">Price</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#00d4ff]">${selectedProduct.price}</span>
                    {selectedProduct.originalPrice && <span className="text-sm text-[#475569] line-through">${selectedProduct.originalPrice}</span>}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                  <div className="text-[10px] text-[#475569] mb-1">Availability</div>
                  <Badge className={selectedProduct.inStock ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' : 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'}>
                    {selectedProduct.inStock ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="text-[10px] text-[#475569] mb-2">Specifications</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-[#475569]">Brand:</span> <span className="text-[#e2e8f0]">{selectedProduct.brand}</span></div>
                  <div><span className="text-[#475569]">Category:</span> <span className="text-[#e2e8f0]">{selectedProduct.category}</span></div>
                  <div><span className="text-[#475569]">Warranty:</span> <span className="text-[#e2e8f0]">2 Years</span></div>
                  <div><span className="text-[#475569]">Shipping:</span> <span className="text-[#10b981]">Free</span></div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#64748b]">
                <Truck className="h-3.5 w-3.5" /> Free shipping on orders over $200
                <ShieldCheck className="h-3.5 w-3.5 ml-3" /> 30-day money back
              </div>
              <div className="flex gap-3">
                <Button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null) }} className="flex-1 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-2">
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </Button>
                <Button variant="outline" onClick={() => toggleWishlist(selectedProduct.id)} className="border-[#1e2a3a] hover:border-[#ef4444]/30 gap-2">
                  <Heart className={`h-4 w-4 ${wishlist.includes(selectedProduct.id) ? 'text-[#ef4444] fill-[#ef4444]' : 'text-[#64748b]'}`} />
                  Wishlist
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shopping Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)}>
          <Card className="bg-[#151d2b] border-l border-[#1e2a3a] w-full max-w-md h-full overflow-y-auto rounded-none" onClick={e => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-[#1e2a3a]">
              <CardTitle className="text-base text-[#e2e8f0] flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-[#00d4ff]" />
                Shopping Cart ({cartCount})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCart(false)} className="text-[#475569]"><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-10 w-10 text-[#1e2a3a] mx-auto mb-3" />
                  <p className="text-sm text-[#475569]">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cartItems.map(item => (
                      <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                        <div className="w-10 h-10 rounded-lg bg-[#1e2a3a] flex items-center justify-center text-lg">{item.product.image}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-[#e2e8f0] truncate">{item.product.name}</div>
                          <div className="text-xs text-[#00d4ff]">${item.product.price}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => updateQty(item.product.id, -1)} className="h-6 w-6 p-0 text-[#64748b]"><Minus className="h-3 w-3" /></Button>
                          <span className="text-xs text-[#e2e8f0] w-6 text-center">{item.qty}</span>
                          <Button size="sm" variant="ghost" onClick={() => updateQty(item.product.id, 1)} className="h-6 w-6 p-0 text-[#64748b]"><Plus className="h-3 w-3" /></Button>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.product.id)} className="h-6 w-6 p-0 text-[#ef4444]"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#1e2a3a] pt-4 space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-[#64748b]">Subtotal</span><span className="text-[#e2e8f0]">${cartTotal}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-[#64748b]">Shipping</span><span className="text-[#10b981]">{cartTotal >= 200 ? 'Free' : '$25'}</span></div>
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#1e2a3a]"><span className="text-[#e2e8f0]">Total</span><span className="text-[#00d4ff]">${cartTotal + (cartTotal >= 200 ? 0 : 25)}</span></div>
                  </div>
                  <Button className="w-full bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold">
                    Checkout <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Wishlist */}
      {wishlist.length > 0 && (
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
              <Heart className="h-4 w-4 text-[#ef4444]" /> Wishlist ({wishlist.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {products.filter(p => wishlist.includes(p.id)).map(product => (
                <div key={product.id} className="shrink-0 w-40 p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a] text-center">
                  <div className="text-2xl mb-1">{product.image}</div>
                  <div className="text-xs font-medium text-[#e2e8f0] truncate">{product.name}</div>
                  <div className="text-xs text-[#00d4ff] font-bold">${product.price}</div>
                  <Button size="sm" onClick={() => addToCart(product)} className="mt-2 h-6 text-[10px] bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] w-full">
                    Add to Cart
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
