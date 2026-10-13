import React, { useEffect, useState, useMemo } from 'react'
import { Routes, Route, Link, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom'
import {
  Leaf, LayoutDashboard, ShoppingBag, Package, Users, LogOut, Search,
  ShoppingCart, Plus, Minus, ClipboardList, ArrowRight, Boxes, TrendingUp,
  Clock, CheckCircle2, AlertCircle, RefreshCw, Eye, Sparkles, ShieldCheck,
  Heart, Truck, X, Tag
} from 'lucide-react'
import api from './api'

const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0)
const getUser = () => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } }

function App() {
  const [user, setUser] = useState(getUser())
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'))
  const [backendStatus, setBackendStatus] = useState('checking') // 'checking' | 'connected' | 'disconnected'
  const [toasts, setToasts] = useState([])
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const nav = useNavigate()
  const loc = useLocation()

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }

  const removeToast = id => setToasts(t => t.filter(x => x.id !== id))

  // Check backend health
  useEffect(() => {
    api.get('/medicines')
      .then(() => setBackendStatus('connected'))
      .catch(() => setBackendStatus('disconnected'))
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const logout = () => {
    localStorage.clear()
    setUser(null)
    setCart([])
    addToast('You have signed out.', 'info')
    nav('/shop')
  }

  const onLogin = (u, message = 'Welcome back!') => {
    localStorage.setItem('token', u.token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    addToast(message, 'success')
    nav(u.role === 'ADMIN' ? '/admin' : '/shop')
  }

  const quickLogin = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      onLogin(res.data, `Logged in as ${res.data.name}`)
    } catch (err) {
      addToast(err.response?.data?.message || 'Quick login failed', 'error')
    }
  }

  const addCart = (m, qty = 1) => {
    setCart(old => {
      const found = old.find(x => x.id === m.id)
      if (found) {
        const newQty = Math.min(found.quantity + qty, m.stock)
        return old.map(x => x.id === m.id ? { ...x, quantity: newQty } : x)
      } else {
        return [...old, { ...m, quantity: Math.min(qty, m.stock) }]
      }
    })
    addToast(`Added "${m.name}" to cart!`)
  }

  const updateQty = (id, delta) => {
    setCart(old => old.map(x => {
      if (x.id !== id) return x
      const newQty = Math.max(1, Math.min(x.stock, x.quantity + delta))
      return { ...x, quantity: newQty }
    }))
  }

  const removeCart = id => {
    setCart(old => old.filter(x => x.id !== id))
    addToast('Item removed from cart.', 'info')
  }

  const cartCount = cart.reduce((s, x) => s + x.quantity, 0)

  return (
    <div className="app">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' && <CheckCircle2 size={16} />}
            {t.type === 'error' && <AlertCircle size={16} />}
            {t.type === 'info' && <Sparkles size={16} />}
            <span>{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="toast-close">×</button>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <Link to={user?.role === 'ADMIN' ? '/admin' : '/shop'} className="brand">
          <span className="brand-mark"><Leaf size={22} /></span>
          <div>
            <span className="brand-title">AyurVeda<span className="brand-accent">Care</span></span>
            <small>CLASSICAL WELLNESS</small>
          </div>
        </Link>

        {/* Quick Demo Switcher inside sidebar */}
        <div className="quick-demo-box">
          <span className="quick-demo-title">QUICK DEMO ACCESS</span>
          <div className="quick-demo-buttons">
            <button
              className="btn-demo-pill"
              onClick={() => quickLogin('customer@ayurveda.local', 'Customer@12345')}
              title="Click to sign in instantly as customer"
            >
              🌿 Customer
            </button>
            <button
              className="btn-demo-pill"
              onClick={() => quickLogin('admin@ayurveda.local', 'Admin@12345')}
              title="Click to sign in instantly as admin"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        <div className="side-label">NAVIGATION</div>
        {user?.role === 'ADMIN' ? (
          <>
            <SideLink to="/admin" icon={<LayoutDashboard />}>Dashboard</SideLink>
            <SideLink to="/admin/medicines" icon={<Package />}>Medicine Catalog</SideLink>
            <SideLink to="/admin/orders" icon={<ClipboardList />}>Customer Orders</SideLink>
            <div className="side-divider" />
            <SideLink to="/shop" icon={<ShoppingBag />}>View Storefront</SideLink>
          </>
        ) : (
          <>
            <SideLink to="/shop" icon={<ShoppingBag />}>Browse Medicines</SideLink>
            <SideLink to="/cart" icon={<ShoppingCart />}>
              My Cart {cartCount > 0 && <span className="nav-count">{cartCount}</span>}
            </SideLink>
            {user && <SideLink to="/orders" icon={<ClipboardList />}>My Orders</SideLink>}
          </>
        )}

        <div className="sidebar-bottom">
          <div className="backend-indicator">
            <span className={`status-dot ${backendStatus}`} />
            <span>
              {backendStatus === 'connected' ? 'H2 Database Live' : backendStatus === 'checking' ? 'Connecting...' : 'Backend Offline'}
            </span>
          </div>

          {user ? (
            <div className="user-profile-card">
              <div className="avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
              <div className="user-info">
                <b>{user.name}</b>
                <span className="user-role-badge">{user.role}</span>
              </div>
              <button className="logout-btn" onClick={logout} title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="auth-nav-buttons">
              <Link className="btn btn-primary btn-block btn-sm" to="/login">Sign In</Link>
              <Link className="btn btn-outline btn-block btn-sm" to="/register">Create Account</Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="breadcrumb">
              AyurVedaCare <span>/</span>{' '}
              <b>
                {loc.pathname.includes('/admin/medicines') ? 'Medicine Catalog' :
                 loc.pathname.includes('/admin/orders') ? 'Order Management' :
                 loc.pathname.includes('/admin') ? 'Administration Dashboard' :
                 loc.pathname.includes('/orders') ? 'My Orders' :
                 loc.pathname.includes('/cart') ? 'Shopping Cart' : 'Medicine Store'}
              </b>
            </div>
          </div>

          <div className="top-actions">
            <div className="announcement-pill">
              <Sparkles size={14} /> 100% Classical Formulations · Zero MySQL (H2 Embedded)
            </div>

            <Link to="/cart" className="top-cart-btn" title="View Cart">
              <ShoppingCart size={18} />
              {cartCount > 0 && <span className="top-cart-badge">{cartCount}</span>}
            </Link>

            {!user && (
              <Link className="btn btn-primary btn-sm" to="/login">Sign In</Link>
            )}
          </div>
        </header>

        {/* Dynamic Page Views */}
        <div className="page">
          <Routes>
            <Route path="/" element={<Navigate to={user?.role === 'ADMIN' ? '/admin' : '/shop'} replace />} />
            <Route path="/login" element={<Auth mode="login" onLogin={onLogin} quickLogin={quickLogin} />} />
            <Route path="/register" element={<Auth mode="register" onLogin={onLogin} quickLogin={quickLogin} />} />
            <Route path="/shop" element={<Shop addCart={addCart} onViewMedicine={setSelectedMedicine} user={user} />} />
            <Route path="/cart" element={<Cart cart={cart} updateQty={updateQty} removeCart={removeCart} clear={() => setCart([])} user={user} addToast={addToast} />} />
            <Route path="/orders" element={user ? <Orders addToast={addToast} /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user?.role === 'ADMIN' ? <Admin /> : <Navigate to="/login" />} />
            <Route path="/admin/medicines" element={user?.role === 'ADMIN' ? <AdminMedicines addToast={addToast} /> : <Navigate to="/login" />} />
            <Route path="/admin/orders" element={user?.role === 'ADMIN' ? <AdminOrders addToast={addToast} /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/shop" />} />
          </Routes>
        </div>

        {/* Product Quick View Modal */}
        {selectedMedicine && (
          <MedicineModal
            medicine={selectedMedicine}
            onClose={() => setSelectedMedicine(null)}
            onAddToCart={qty => {
              addCart(selectedMedicine, qty)
              setSelectedMedicine(null)
            }}
          />
        )}

        <footer>
          <div className="footer-content">
            <div>
              <b>AyurVeda Care System</b> — Authentic Ayurvedic Medicine Management & E-Commerce.
              <span className="footer-sub"> Running on Spring Boot 3 & H2 Embedded Database</span>
            </div>
            <div className="footer-badges">
              <span>🌿 Pure Botanicals</span>
              <span>🛡️ Lab Certified</span>
              <span>⚡ Zero MySQL Dependency</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

function SideLink({ to, icon, children }) {
  return (
    <NavLink className={({ isActive }) => 'side-link' + (isActive ? ' active' : '')} to={to} end={to === '/admin' || to === '/shop'}>
      {React.cloneElement(icon, { size: 18 })}
      <span>{children}</span>
    </NavLink>
  )
}

// -------------------------------------------------------------
// Authentication View (Sign In & Registration)
// -------------------------------------------------------------
function Auth({ mode, onLogin, quickLogin }) {
  const reg = mode === 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const r = await api.post('/auth/' + (reg ? 'register' : 'login'), form)
      onLogin(r.data, reg ? 'Account created successfully!' : 'Signed in successfully!')
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Unable to connect to backend. Please ensure backend is running.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-art">
        <div className="art-orb orb-one" />
        <div className="art-orb orb-two" />
        <div className="art-content">
          <div className="art-icon"><Leaf size={32} /></div>
          <p className="eyebrow light">ANCIENT WISDOM · MODERN CARE</p>
          <h1>Health &amp; Harmony<br />With Ayurveda</h1>
          <p>
            Experience authentic botanical remedies formulated according to classical Ayurvedic treatises.
            Hassle-free management, order tracking, and inventory control.
          </p>
          <div className="art-stats">
            <div><b>100% Herbal</b><small>Pure extracts</small></div>
            <div><b>H2 Embedded</b><small>No MySQL required</small></div>
            <div><b>Fast Delivery</b><small>Direct to home</small></div>
          </div>
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="mobile-logo"><Leaf /> AyurVeda Care</div>
          <p className="eyebrow">{reg ? 'GET STARTED' : 'WELCOME BACK'}</p>
          <h2>{reg ? 'Create an account' : 'Sign in to your portal'}</h2>
          <p className="muted">
            {reg ? 'Register as a customer to browse medicines and place orders.' : 'Enter your credentials to access your orders and medicines.'}
          </p>

          {/* Quick Demo Login Helpers */}
          {!reg && (
            <div className="demo-login-card">
              <b>⚡ Quick One-Click Demo Logins:</b>
              <div className="demo-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => quickLogin('customer@ayurveda.local', 'Customer@12345')}
                >
                  🌿 Login as Customer (Priya Sharma)
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => quickLogin('admin@ayurveda.local', 'Admin@12345')}
                >
                  🛡️ Login as System Admin
                </button>
              </div>
            </div>
          )}

          {err && <div className="alert">{err}</div>}

          <form onSubmit={submit}>
            {reg && (
              <label>Full Name
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                />
              </label>
            )}
            <label>Email Address
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. customer@ayurveda.local"
              />
            </label>
            <label>Password
              <input
                required
                minLength="8"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="At least 8 characters"
              />
            </label>
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Verifying…' : reg ? 'Create Account' : 'Sign In'} <ArrowRight size={17} />
            </button>
          </form>

          <p className="auth-switch">
            {reg ? 'Already have an account?' : 'Need an account?'}
            {' '}<Link to={reg ? '/login' : '/register'}>{reg ? 'Sign in' : 'Create an account'}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Shop Catalog & Storefront View
// -------------------------------------------------------------
function Shop({ addCart, onViewMedicine, user }) {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('All')
  const [sortBy, setSortBy] = useState('featured')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const loadMedicines = () => {
    setLoading(true)
    setErr('')
    api.get('/medicines')
      .then(r => setItems(r.data))
      .catch(() => setErr('Could not connect to backend server. Make sure the backend Spring Boot process is running.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadMedicines()
  }, [])

  const categories = useMemo(() => {
    const set = new Set(items.map(x => x.category))
    return ['All', ...Array.from(set).sort()]
  }, [items])

  const filtered = useMemo(() => {
    return items.filter(x => {
      const matchCat = category === 'All' || x.category.toLowerCase() === category.toLowerCase()
      const term = q.toLowerCase()
      const matchQ = !term || x.name.toLowerCase().includes(term) ||
        x.category.toLowerCase().includes(term) ||
        (x.description && x.description.toLowerCase().includes(term))
      const matchStock = inStockOnly ? x.stock > 0 : true
      return matchCat && matchQ && matchStock
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price
      if (sortBy === 'price-high') return b.price - a.price
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'stock') return b.stock - a.stock
      return 0 // featured default
    })
  }, [items, category, q, sortBy, inStockOnly])

  return (
    <>
      {/* Hero Banner */}
      <div className="hero">
        <div className="hero-copy">
          <span className="pill"><Leaf size={14} /> CLASSICAL AYURVEDA · MODERN WELLNESS</span>
          <h1>Holistic Healing,<br />Rooted in <em>Nature.</em></h1>
          <p>
            Explore pure herbal extracts, classical churnas, rasayanas, and medicated thailams crafted
            to restore your natural Vata, Pitta, and Kapha equilibrium.
          </p>
          <div className="hero-cta-group">
            <a className="btn btn-white" href="#catalog">
              Explore Remedies <ArrowRight size={17} />
            </a>
            <span className="hero-subtext">Free shipping on orders above ₹499</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-circle"><Leaf size={92} /></div>
          <span className="floating-leaf leaf-a">✦</span>
          <span className="floating-leaf leaf-b">✿</span>
          <div className="hero-tag"><ShieldCheck size={16} /> 100% Authentic Classical Formulas</div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="features-ribbon">
        <div className="feature-item">
          <div className="feature-icon"><Leaf size={20} /></div>
          <div>
            <b>Classical Ayurvedic Heritage</b>
            <p>Formulated according to Charaka &amp; Sushruta Samhita</p>
          </div>
        </div>
        <div className="feature-item">
          <div className="feature-icon"><ShieldCheck size={20} /></div>
          <div>
            <b>Zero MySQL Installation</b>
            <p>Runs cleanly with embedded H2 file database</p>
          </div>
        </div>
        <div className="feature-item">
          <div className="feature-icon"><Truck size={20} /></div>
          <div>
            <b>Express Dispatch</b>
            <p>Direct doorstep shipping across India</p>
          </div>
        </div>
      </div>

      {/* Catalog Search & Controls */}
      <div className="section-head" id="catalog">
        <div>
          <p className="eyebrow">MEDICINE CATALOG</p>
          <h2>Explore Remedies ({filtered.length} Available)</h2>
          <p className="muted">Find the right medicines and herbs for your health requirements.</p>
        </div>

        <div className="catalog-toolbar">
          <div className="searchbox">
            <Search size={18} />
            <input
              placeholder="Search medicines, herbs, conditions..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            {q && <button className="clear-search" onClick={() => setQ('')}>×</button>}
          </div>

          <div className="sort-box">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="featured">Sort: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
              <option value="stock">Highest Stock</option>
            </select>
          </div>

          <label className="instock-checkbox">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={e => setInStockOnly(e.target.checked)}
            />
            <span>In stock only</span>
          </label>
        </div>
      </div>

      {/* Category Pills */}
      <div className="filters">
        {categories.map(c => {
          const count = c === 'All' ? items.length : items.filter(x => x.category === c).length
          return (
            <button
              key={c}
              className={'filter ' + (category === c ? 'active' : '')}
              onClick={() => setCategory(c)}
            >
              {c} <span className="cat-badge">{count}</span>
            </button>
          )
        })}
      </div>

      {err && (
        <div className="alert alert-error-box">
          <AlertCircle size={20} />
          <div>
            <b>Backend Connection Notice:</b>
            <p>{err}</p>
            <button className="btn btn-sm btn-outline" onClick={loadMedicines}>
              <RefreshCw size={14} /> Retry Connection
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-box">
          <RefreshCw className="spin" size={28} />
          <p>Loading herbal catalog from H2 database…</p>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map((m, i) => (
            <article className="product-card" key={m.id}>
              <div className={'product-image product-tone-' + (i % 4)}>
                {m.imageUrl ? (
                  <img
                    src={m.imageUrl}
                    alt={m.name}
                    loading="lazy"
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className="fallback-art" style={{ display: m.imageUrl ? 'none' : 'flex' }}>
                  <Leaf size={46} />
                </div>
                <span className="product-category">{m.category}</span>
                <button
                  className="quick-view-btn"
                  title="Quick View Details"
                  onClick={() => onViewMedicine(m)}
                >
                  <Eye size={16} /> Details
                </button>
              </div>

              <div className="product-info">
                <div className="product-title-row">
                  <h3>{m.name}</h3>
                </div>
                <p className="product-desc">{m.description || 'Traditional Ayurvedic herbal preparation.'}</p>

                {m.dosage && (
                  <div className="dosage-hint">
                    <Sparkles size={12} />
                    <span>{m.dosage}</span>
                  </div>
                )}

                <div className="product-meta">
                  <span className="price">{money(m.price)}</span>
                  <span className={m.stock > 10 ? 'in-stock' : m.stock > 0 ? 'low-stock-pill' : 'out-stock'}>
                    {m.stock > 10 ? `${m.stock} in stock` : m.stock > 0 ? `Only ${m.stock} left!` : 'Out of stock'}
                  </span>
                </div>

                <div className="product-card-actions">
                  <button
                    disabled={m.stock < 1}
                    className="btn btn-primary btn-block"
                    onClick={() => addCart(m)}
                  >
                    <Plus size={16} /> {m.stock > 0 ? 'Add to Cart' : 'Unavailable'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !filtered.length && (
        <div className="empty">
          <Package size={42} />
          <h3>No medicines match your search</h3>
          <p>Try resetting the category filter or searching for another herb.</p>
          <button className="btn btn-outline" onClick={() => { setQ(''); setCategory('All'); setInStockOnly(false) }}>
            Clear Filters
          </button>
        </div>
      )}
    </>
  )
}

// -------------------------------------------------------------
// Product Details Modal
// -------------------------------------------------------------
function MedicineModal({ medicine, onClose, onAddToCart }) {
  const [qty, setQty] = useState(1)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        <div className="modal-grid">
          <div className="modal-img-col">
            {medicine.imageUrl ? (
              <img
                src={medicine.imageUrl}
                alt={medicine.name}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="modal-fallback"><Leaf size={64} /></div>
            )}
            <span className="modal-badge">{medicine.category}</span>
          </div>

          <div className="modal-info-col">
            <span className="eyebrow">{medicine.category}</span>
            <h2>{medicine.name}</h2>
            <div className="modal-price-row">
              <span className="modal-price">{money(medicine.price)}</span>
              <span className={medicine.stock > 0 ? 'in-stock' : 'out-stock'}>
                {medicine.stock > 0 ? `${medicine.stock} units available` : 'Out of stock'}
              </span>
            </div>

            <div className="modal-section">
              <h4>Traditional Description &amp; Indications</h4>
              <p>{medicine.description || 'Authentic classical Ayurvedic remedy.'}</p>
            </div>

            {medicine.dosage && (
              <div className="modal-section modal-dosage">
                <h4>Recommended Dosage &amp; Directions</h4>
                <p>🌿 {medicine.dosage}</p>
              </div>
            )}

            <div className="modal-actions-row">
              <div className="modal-qty">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}><Minus size={14} /></button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => Math.min(medicine.stock, q + 1))} disabled={qty >= medicine.stock}><Plus size={14} /></button>
              </div>

              <button
                disabled={medicine.stock < 1}
                className="btn btn-primary"
                onClick={() => onAddToCart(qty)}
              >
                <ShoppingCart size={16} /> Add {qty} to Cart ({money(medicine.price * qty)})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Shopping Cart & Checkout View
// -------------------------------------------------------------
function Cart({ cart, updateQty, removeCart, clear, user, addToast }) {
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [coupon, setCoupon] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const nav = useNavigate()

  const subtotal = cart.reduce((s, x) => s + x.price * x.quantity, 0)
  const shippingFee = subtotal >= 499 || subtotal === 0 ? 0 : 60
  const discountAmount = (subtotal * discountPercent) / 100
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee)

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'AYUR10') {
      setDiscountPercent(10)
      addToast('Coupon AYUR10 applied! 10% discount added.', 'success')
    } else {
      addToast('Invalid coupon code. Try "AYUR10"', 'error')
    }
  }

  const checkout = async () => {
    if (!user) {
      addToast('Please sign in or use a demo account to checkout.', 'info')
      nav('/login')
      return
    }
    if (!address.trim()) {
      setMsg('Please provide your complete shipping delivery address.')
      return
    }

    setBusy(true)
    setMsg('')
    try {
      const fullShipping = phone ? `${address.trim()} (Phone: ${phone.trim()})` : address.trim()
      const res = await api.post('/orders', {
        shippingAddress: fullShipping,
        items: cart.map(x => ({ medicineId: x.id, quantity: x.quantity }))
      })
      clear()
      setOrderSuccess(res.data)
      addToast(`Order #${res.data.id} placed successfully!`, 'success')
    } catch (e) {
      setMsg(e.response?.data?.message || 'Checkout failed. Please review stock and retry.')
      addToast('Checkout could not be completed.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="CHECKOUT"
        title="Your Shopping Cart"
        subtitle="Review selected medicines and complete your delivery details."
      />

      {orderSuccess ? (
        <div className="panel order-success-card">
          <div className="success-icon"><CheckCircle2 size={54} /></div>
          <h2>Order Placed Successfully!</h2>
          <p className="order-id-label">Order Reference: <b>#{orderSuccess.id}</b></p>
          <p className="muted">
            Thank you for ordering with AyurVedaCare. Your order has been placed in our system
            and your items are reserved.
          </p>
          <div className="order-details-mini">
            <div><span>Total Amount:</span> <b>{money(orderSuccess.total)}</b></div>
            <div><span>Status:</span> <Status status={orderSuccess.status} /></div>
            <div><span>Shipping to:</span> <b>{orderSuccess.shippingAddress}</b></div>
          </div>
          <div className="success-actions">
            <Link to="/orders" className="btn btn-primary">Track My Orders <ArrowRight size={16} /></Link>
            <Link to="/shop" className="btn btn-outline">Continue Shopping</Link>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items List */}
          <div className="panel">
            {cart.length === 0 ? (
              <div className="empty">
                <ShoppingBag size={48} />
                <h3>Your shopping cart is empty</h3>
                <p>Explore our traditional herbal catalog to add wellness remedies.</p>
                <Link className="btn btn-primary" to="/shop">Browse Medicines</Link>
              </div>
            ) : (
              <div className="cart-items-list">
                {cart.map(x => (
                  <div className="cart-row" key={x.id}>
                    <div className="cart-thumb">
                      {x.imageUrl ? (
                        <img src={x.imageUrl} alt={x.name} onError={e => { e.currentTarget.style.display = 'none' }} />
                      ) : (
                        <Leaf size={24} />
                      )}
                    </div>
                    <div className="cart-product">
                      <b>{x.name}</b>
                      <small>{x.category}</small>
                      <strong>{money(x.price)} each</strong>
                    </div>

                    <div className="qty">
                      <button onClick={() => updateQty(x.id, -1)} disabled={x.quantity <= 1}><Minus size={14} /></button>
                      <span>{x.quantity}</span>
                      <button onClick={() => updateQty(x.id, 1)} disabled={x.quantity >= x.stock}><Plus size={14} /></button>
                    </div>

                    <div className="cart-line-total">
                      <b>{money(x.price * x.quantity)}</b>
                    </div>

                    <button className="icon-btn danger" title="Remove Item" onClick={() => removeCart(x.id)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout & Summary Panel */}
          {cart.length > 0 && (
            <div className="panel summary">
              <h3>Order Summary</h3>

              <div className="summary-line">
                <span>Items ({cart.reduce((s, x) => s + x.quantity, 0)})</span>
                <b>{money(subtotal)}</b>
              </div>

              <div className="summary-line">
                <span>Shipping Fee</span>
                <b>{shippingFee === 0 ? <span className="free-tag">FREE</span> : money(shippingFee)}</b>
              </div>

              {discountAmount > 0 && (
                <div className="summary-line discount-line">
                  <span>Discount ({discountPercent}%)</span>
                  <b>- {money(discountAmount)}</b>
                </div>
              )}

              {/* Coupon Box */}
              <div className="coupon-box">
                <input
                  placeholder="Coupon code (Try: AYUR10)"
                  value={coupon}
                  onChange={e => setCoupon(e.target.value)}
                />
                <button type="button" className="btn btn-sm btn-outline" onClick={applyCoupon}>
                  Apply
                </button>
              </div>

              <div className="summary-total">
                <span>Total Amount</span>
                <strong>{money(grandTotal)}</strong>
              </div>

              {/* Shipping Address Inputs */}
              <div className="checkout-fields">
                <label>Contact Phone Number
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </label>

                <label>Shipping Delivery Address
                  <textarea
                    rows="3"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="House/Apartment #, Street, City, State, PIN code"
                  />
                </label>
              </div>

              {msg && <div className="alert">{msg}</div>}

              <button
                disabled={!cart.length || busy}
                className="btn btn-primary btn-block"
                onClick={checkout}
              >
                {busy ? 'Placing Order…' : 'Confirm & Place Order'} <ArrowRight size={17} />
              </button>

              <div className="checkout-trust">
                <span>🔒 Powered by In-Memory / File H2 Database</span>
                <span>🌿 100% Secure Checkout</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function PageTitle({ eyebrow, title, subtitle, action }) {
  return (
    <div className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

function Status({ status }) {
  return <span className={'status status-' + String(status).toLowerCase()}>{String(status).replaceAll('_', ' ')}</span>
}

// -------------------------------------------------------------
// Customer Orders View
// -------------------------------------------------------------
function Orders({ addToast }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  const loadOrders = () => {
    setLoading(true)
    api.get('/orders')
      .then(r => setOrders(r.data))
      .catch(e => setErr(e.response?.data?.message || 'Could not load your orders.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const cancelOrder = async (id) => {
    if (!confirm(`Are you sure you want to cancel order #${id}?`)) return
    setCancellingId(id)
    try {
      await api.patch(`/orders/${id}/cancel`)
      addToast(`Order #${id} has been cancelled.`, 'info')
      loadOrders()
    } catch (e) {
      addToast(e.response?.data?.message || 'Unable to cancel order', 'error')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="YOUR ORDERS"
        title="Order History &amp; Tracking"
        subtitle="View the current status, fulfillment progress, and item receipts for your orders."
        action={
          <button className="btn btn-outline btn-sm" onClick={loadOrders}>
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <div className="panel">
        {err && <div className="alert">{err}</div>}

        {loading ? (
          <div className="loading-box">
            <RefreshCw className="spin" size={24} />
            <p>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty">
            <ClipboardList size={40} />
            <h3>No orders placed yet</h3>
            <p>When you complete an order from the shop, it will appear here for tracking.</p>
            <Link to="/shop" className="btn btn-primary">Browse Medicines</Link>
          </div>
        ) : (
          <div className="orders-cards-list">
            {orders.map(o => (
              <div className="order-card" key={o.id}>
                <div className="order-header-row">
                  <div>
                    <span className="order-id-badge">Order #{o.id}</span>
                    <span className="order-date-text">
                      Placed on {new Date(o.createdAt).toLocaleDateString()} at {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="order-header-status">
                    <Status status={o.status} />
                    {o.status === 'PLACED' && (
                      <button
                        className="btn btn-sm btn-danger"
                        disabled={cancellingId === o.id}
                        onClick={() => cancelOrder(o.id)}
                      >
                        {cancellingId === o.id ? 'Cancelling…' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="order-progress-stepper">
                  {['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'].map((st, idx) => {
                    const statuses = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED']
                    const currentIdx = statuses.indexOf(o.status)
                    const isDone = o.status !== 'CANCELLED' && currentIdx >= idx
                    const isCurrent = o.status === st
                    return (
                      <div key={st} className={`step-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                        <div className="step-node">{idx + 1}</div>
                        <span className="step-label">{st}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Ordered Items Table */}
                <div className="order-items-table">
                  {o.items?.map(i => (
                    <div className="order-item-row" key={i.id}>
                      <div className="item-meta">
                        <b>{i.medicine?.name || 'Medicinal Item'}</b>
                        <small>{i.medicine?.category} · {money(i.unitPrice)} each</small>
                      </div>
                      <div className="item-qty-badge">Qty: {i.quantity}</div>
                      <div className="item-subtotal"><b>{money(i.unitPrice * i.quantity)}</b></div>
                    </div>
                  ))}
                </div>

                <div className="order-footer-row">
                  <div className="order-shipping-note">
                    <Truck size={15} />
                    <span><b>Deliver to:</b> {o.shippingAddress}</span>
                  </div>
                  <div className="order-grand-total">
                    <span>Total Paid:</span>
                    <strong>{money(o.total)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// -------------------------------------------------------------
// Administration Dashboard
// -------------------------------------------------------------
function Admin() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data))
      .catch(e => setErr(e.response?.data?.message || 'Unable to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageTitle
        eyebrow="ADMINISTRATION"
        title="Management Dashboard"
        subtitle="Overview of medicine inventory, sales performance, and fulfillment status."
        action={
          <div className="admin-quick-actions-bar">
            <Link className="btn btn-primary btn-sm" to="/admin/medicines">
              <Plus size={16} /> Add Medicine
            </Link>
            <a
              className="btn btn-outline btn-sm"
              href="http://localhost:8080/h2-console"
              target="_blank"
              rel="noreferrer"
              title="Open Spring Boot H2 Console in new tab"
            >
              H2 DB Console
            </a>
          </div>
        }
      />

      {err && <div className="alert">{err}</div>}

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <Stat
          icon={<TrendingUp />}
          label="Total Revenue"
          value={money(data?.totalRevenue ?? 0)}
          color="green"
        />
        <Stat
          icon={<ClipboardList />}
          label="Total Orders"
          value={data?.orderCount ?? '—'}
          color="blue"
        />
        <Stat
          icon={<Package />}
          label="Medicines in Catalog"
          value={data?.medicineCount ?? '—'}
          color="purple"
        />
        <Stat
          icon={<Boxes />}
          label="Low Stock Items"
          value={data?.lowStock ?? '—'}
          color="orange"
        />
      </div>

      <div className="dashboard-grid">
        {/* Recent Orders Panel */}
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Recent Customer Orders</h3>
              <p className="muted">Latest purchase activities across the storefront</p>
            </div>
            <Link to="/admin/orders">View All Orders <ArrowRight size={15} /></Link>
          </div>

          {data?.recentOrders?.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ORDER</th>
                    <th>CUSTOMER</th>
                    <th>ITEMS</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map(o => (
                    <tr key={o.id}>
                      <td>
                        <b>#{o.id}</b>
                        <small className="table-sub">{new Date(o.createdAt).toLocaleDateString()}</small>
                      </td>
                      <td>
                        <b>{o.customer?.name}</b>
                        <small className="table-sub">{o.customer?.email}</small>
                      </td>
                      <td>{o.items?.length || 0} items</td>
                      <td><b>{money(o.total)}</b></td>
                      <td><Status status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty compact">
              <ClipboardList />
              <p>Customer orders will appear here once placed.</p>
            </div>
          )}
        </div>

        {/* Quick Management Panel */}
        <div className="panel quick-panel">
          <h3>Quick Management</h3>
          <Link to="/admin/medicines" className="quick-action">
            <span className="quick-icon green-bg"><Package /></span>
            <span>
              <b>Manage Medicine Catalog</b>
              <small>Add new remedies, update stock and prices</small>
            </span>
            <ArrowRight />
          </Link>

          <Link to="/admin/orders" className="quick-action">
            <span className="quick-icon blue-bg"><ClipboardList /></span>
            <span>
              <b>Process Orders</b>
              <small>Advance order statuses to Confirmed, Packed, Shipped</small>
            </span>
            <ArrowRight />
          </Link>

          <div className="tip-box">
            <Leaf />
            <div>
              <b>Zero-MySQL Database Architecture</b>
              <p>
                This application uses Spring Boot JPA with an embedded file H2 database
                (<code>./data/ayurvedadb</code>). All data persists across server restarts without
                needing an external MySQL service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Stat({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={'stat-icon ' + color}>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small><TrendingUp size={13} /> Active metrics</small>
    </div>
  )
}

// -------------------------------------------------------------
// Administration: Medicine Inventory Management
// -------------------------------------------------------------
function AdminMedicines({ addToast }) {
  const blank = {
    name: '',
    category: 'Herbal Supplements',
    price: '',
    stock: '25',
    description: '',
    imageUrl: '',
    dosage: '',
    active: true
  }
  const [items, setItems] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [err, setErr] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const load = () => {
    api.get('/admin/medicines')
      .then(r => setItems(r.data))
      .catch(e => setErr(e.response?.data?.message || 'Could not load medicines.'))
  }

  useEffect(() => { load() }, [])

  const save = async e => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const body = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock)
      }
      if (editing) {
        await api.put('/admin/medicines/' + editing, body)
        addToast(`Updated "${form.name}" successfully!`)
      } else {
        await api.post('/admin/medicines', body)
        addToast(`Added "${form.name}" to inventory!`)
      }
      setShow(false)
      setEditing(null)
      setForm(blank)
      load()
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed. Please verify input data.')
    } finally {
      setBusy(false)
    }
  }

  const edit = m => {
    setEditing(m.id)
    setForm({ ...m, price: String(m.price), stock: String(m.stock) })
    setShow(true)
  }

  const toggleStatus = async (m) => {
    try {
      await api.patch(`/admin/medicines/${m.id}/toggle-active`)
      addToast(`Medicine is now ${m.active ? 'Inactive' : 'Active'}.`)
      load()
    } catch (e) {
      addToast('Status toggle failed.', 'error')
    }
  }

  const quickRestock = async (m, amount = 10) => {
    try {
      await api.put(`/admin/medicines/${m.id}`, {
        ...m,
        stock: m.stock + amount
      })
      addToast(`Added +${amount} stock to ${m.name}.`)
      load()
    } catch (e) {
      addToast('Restock failed.', 'error')
    }
  }

  const filtered = items.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <PageTitle
        eyebrow="INVENTORY"
        title="Medicine Catalog Management"
        subtitle="Create, edit, restock, and activate/deactivate Ayurvedic medicines."
        action={
          <button
            className="btn btn-primary"
            onClick={() => { setEditing(null); setForm(blank); setShow(true) }}
          >
            <Plus size={16} /> Add Medicine
          </button>
        }
      />

      {err && <div className="alert">{err}</div>}

      {/* Add / Edit Medicine Modal */}
      {show && (
        <div className="panel form-panel">
          <div className="panel-head">
            <h3>{editing ? 'Edit Medicine' : 'Add New Ayurvedic Medicine'}</h3>
            <button className="icon-btn" onClick={() => setShow(false)}>×</button>
          </div>
          <form className="medicine-form" onSubmit={save}>
            <label>Medicine Name *
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ashwagandha Ghan Vati"
              />
            </label>

            <label>Category *
              <input
                required
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Herbal Supplements, Digestive Care"
              />
            </label>

            <label>Price (₹) *
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="299.00"
              />
            </label>

            <label>Stock Quantity *
              <input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                placeholder="50"
              />
            </label>

            <label className="wide">Image URL (Web image or Unsplash)
              <input
                type="url"
                value={form.imageUrl}
                onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
              />
            </label>

            <label className="wide">Dosage &amp; Label Directions
              <input
                value={form.dosage}
                onChange={e => setForm({ ...form, dosage: e.target.value })}
                placeholder="e.g. 1 tablet twice daily after meals with warm water"
              />
            </label>

            <label className="wide">Therapeutic Description &amp; Traditional Indications
              <textarea
                rows="3"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Traditional indications, herbs included, balancing effects..."
              />
            </label>

            <div className="wide form-actions">
              <button className="btn btn-primary" disabled={busy}>
                {busy ? 'Saving…' : editing ? 'Update Medicine' : 'Save to Inventory'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShow(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Catalog Table */}
      <div className="panel">
        <div className="table-filter-bar">
          <div className="searchbox">
            <Search size={16} />
            <input
              placeholder="Filter by name or category..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="muted">{filtered.length} products listed</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>MEDICINE</th>
                <th>CATEGORY</th>
                <th>PRICE</th>
                <th>STOCK</th>
                <th>QUICK RESTOCK</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td>
                    <div className="medicine-cell">
                      <div className="mini-thumb">
                        {m.imageUrl ? (
                          <img src={m.imageUrl} alt={m.name} onError={e => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <Leaf />
                        )}
                      </div>
                      <span>
                        <b>{m.name}</b>
                        <small className="table-sub">ID: #{m.id}</small>
                      </span>
                    </div>
                  </td>
                  <td>{m.category}</td>
                  <td><b>{money(m.price)}</b></td>
                  <td>
                    <span className={m.stock < 10 ? 'low-stock-alert' : ''}>
                      {m.stock} units
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-xs btn-outline"
                      title="Add 10 units to stock"
                      onClick={() => quickRestock(m, 10)}
                    >
                      +10 Stock
                    </button>
                  </td>
                  <td>
                    <button
                      className={`status-toggle-btn ${m.active ? 'active' : 'inactive'}`}
                      onClick={() => toggleStatus(m)}
                    >
                      <Status status={m.active ? 'ACTIVE' : 'INACTIVE'} />
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-sm btn-outline" onClick={() => edit(m)}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <div className="empty compact">No medicines match filter criteria.</div>}
        </div>
      </div>
    </>
  )
}

// -------------------------------------------------------------
// Administration: Order Fulfillment
// -------------------------------------------------------------
function AdminOrders({ addToast }) {
  const [orders, setOrders] = useState([])
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [search, setSearch] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(null)

  const load = () => {
    api.get('/admin/orders')
      .then(r => setOrders(r.data))
      .catch(e => setErr(e.response?.data?.message || 'Could not load orders.'))
  }

  useEffect(() => { load() }, [])

  const update = async (id, status) => {
    setBusy(id)
    setErr('')
    try {
      await api.patch(`/admin/orders/${id}/status`, { status })
      addToast(`Order #${id} updated to ${status}.`)
      load()
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not update order.')
      addToast('Status update failed', 'error')
    } finally {
      setBusy(null)
    }
  }

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'ALL' || o.status === filterStatus
    const term = search.toLowerCase()
    const matchSearch = !term ||
      String(o.id).includes(term) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(term)) ||
      (o.customer?.email && o.customer.email.toLowerCase().includes(term))
    return matchStatus && matchSearch
  })

  return (
    <>
      <PageTitle
        eyebrow="FULFILLMENT"
        title="Customer Order Management"
        subtitle="Track, update status, and manage shipments across the entire store."
      />

      <div className="stats-grid compact-stats">
        <Stat icon={<ClipboardList />} label="All Orders" value={orders.length} color="green" />
        <Stat
          icon={<Clock />}
          label="Awaiting Action"
          value={orders.filter(o => ['PLACED', 'CONFIRMED'].includes(o.status)).length}
          color="orange"
        />
        <Stat
          icon={<CheckCircle2 />}
          label="Delivered"
          value={orders.filter(o => o.status === 'DELIVERED').length}
          color="blue"
        />
      </div>

      {err && <div className="alert">{err}</div>}

      <div className="panel">
        <div className="table-filter-bar">
          <div className="order-status-tabs">
            {['ALL', 'PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(st => (
              <button
                key={st}
                className={`order-tab ${filterStatus === st ? 'active' : ''}`}
                onClick={() => setFilterStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="searchbox">
            <Search size={16} />
            <input
              placeholder="Search by Order # or Customer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ORDER</th>
                <th>CUSTOMER</th>
                <th>ITEMS &amp; ADDRESS</th>
                <th>TOTAL</th>
                <th>DATE</th>
                <th>CURRENT STATUS</th>
                <th>UPDATE STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td><b>#{o.id}</b></td>
                  <td>
                    <b>{o.customer?.name}</b>
                    <small className="table-sub">{o.customer?.email}</small>
                  </td>
                  <td>
                    <div className="order-items-snippet">
                      {o.items?.map(i => (
                        <div key={i.id} className="item-line">
                          {i.medicine?.name} × <b>{i.quantity}</b>
                        </div>
                      ))}
                    </div>
                    <small className="table-sub shipping-snippet">📍 {o.shippingAddress}</small>
                  </td>
                  <td><b>{money(o.total)}</b></td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td><Status status={o.status} /></td>
                  <td>
                    <select
                      className="status-select"
                      value={o.status}
                      disabled={busy === o.id || o.status === 'CANCELLED'}
                      onChange={e => update(o.id, e.target.value)}
                    >
                      {['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {busy === o.id && <small className="saving-indicator"> Updating…</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <div className="empty compact">No orders found for this view.</div>}
        </div>
      </div>
    </>
  )
}

export default App
