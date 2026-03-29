import { useState, useEffect } from 'react'
import apiClient from '../../../api/client'

export default function OffersTab() {
  const [masterEnabled, setMasterEnabled] = useState(false)
  const [offers, setOffers] = useState([])
  const [promos, setPromos] = useState([])
  const [claims, setClaims] = useState([])
  const [activeSection, setActiveSection] = useState('offers')
  const [loading, setLoading] = useState(true)

  // Offer form
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerForm, setOfferForm] = useState({
    offer_type: 'signup_bonus', title: '', description: '',
    bonus_value: '', max_bonus_amount: '', min_deposit: '',
    event_name: '', start_date: '', end_date: ''
  })

  // Promo form
  const [showPromoForm, setShowPromoForm] = useState(false)
  const [promoForm, setPromoForm] = useState({
    code: '', bonus_amount: '', min_deposit: '',
    max_uses: '', max_per_user: '1', event_name: '', expiry_date: ''
  })

  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 3000)
      return () => clearTimeout(t)
    }
  }, [successMsg])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [settingsRes, offersRes, promosRes, claimsRes] = await Promise.all([
        apiClient.get('/admin/offers/settings'),
        apiClient.get('/admin/offers/'),
        apiClient.get('/admin/offers/promos'),
        apiClient.get('/admin/offers/claims?limit=50')
      ])
      setMasterEnabled(settingsRes.data.offers_enabled)
      setOffers(offersRes.data.data || [])
      setPromos(promosRes.data.data || [])
      setClaims(claimsRes.data.data || [])
    } catch (err) {
      console.error('Failed to load offers data:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Master Toggle ──
  const toggleMaster = async () => {
    try {
      const res = await apiClient.put('/admin/offers/settings/toggle', { enabled: !masterEnabled })
      setMasterEnabled(res.data.offers_enabled)
      setSuccessMsg(res.data.message)
    } catch (err) {
      alert('Failed to toggle offers system')
    }
  }

  // ── Offer CRUD ──
  const toggleOffer = async (id, currentActive) => {
    try {
      await apiClient.put(`/admin/offers/${id}/toggle`, { enabled: !currentActive })
      setSuccessMsg(`Offer ${!currentActive ? 'enabled' : 'disabled'}`)
      fetchAll()
    } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const deleteOffer = async (id) => {
    if (!confirm('Delete this offer permanently?')) return
    try {
      await apiClient.delete(`/admin/offers/${id}`)
      setSuccessMsg('Offer deleted')
      fetchAll()
    } catch (err) { alert('Failed to delete') }
  }

  const createOffer = async () => {
    setFormError('')
    if (!offerForm.title.trim()) return setFormError('Title is required')
    if (!offerForm.bonus_value || Number(offerForm.bonus_value) <= 0) return setFormError('Bonus value must be > 0')
    if (offerForm.offer_type === 'event') {
      if (!offerForm.start_date || !offerForm.end_date) return setFormError('Event needs start & end date')
      if (!offerForm.event_name.trim()) return setFormError('Event name is required')
    }
    try {
      await apiClient.post('/admin/offers/', {
        offer_type: offerForm.offer_type,
        title: offerForm.title,
        description: offerForm.description || null,
        bonus_type: offerForm.offer_type === 'event' ? 'percentage' : 'flat',
        bonus_value: Number(offerForm.bonus_value),
        max_bonus_amount: offerForm.max_bonus_amount ? Number(offerForm.max_bonus_amount) : null,
        min_deposit: Number(offerForm.min_deposit) || 0,
        event_name: offerForm.event_name || null,
        start_date: offerForm.start_date || null,
        end_date: offerForm.end_date || null,
        is_active: true
      })
      setShowOfferForm(false)
      setOfferForm({ offer_type: 'signup_bonus', title: '', description: '', bonus_value: '', max_bonus_amount: '', min_deposit: '', event_name: '', start_date: '', end_date: '' })
      setSuccessMsg('Offer created!')
      fetchAll()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create offer')
    }
  }

  // ── Promo CRUD ──
  const togglePromo = async (id, currentActive) => {
    try {
      await apiClient.put(`/admin/offers/promos/${id}/toggle`, { enabled: !currentActive })
      setSuccessMsg(`Promo ${!currentActive ? 'enabled' : 'disabled'}`)
      fetchAll()
    } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const deletePromo = async (id) => {
    if (!confirm('Delete this promo code permanently?')) return
    try {
      await apiClient.delete(`/admin/offers/promos/${id}`)
      setSuccessMsg('Promo code deleted')
      fetchAll()
    } catch (err) { alert('Failed to delete') }
  }

  const createPromo = async () => {
    setFormError('')
    if (!promoForm.code.trim()) return setFormError('Promo code is required')
    if (!promoForm.bonus_amount || Number(promoForm.bonus_amount) <= 0) return setFormError('Bonus amount must be > 0')
    try {
      await apiClient.post('/admin/offers/promos', {
        code: promoForm.code.trim().toUpperCase(),
        bonus_amount: Number(promoForm.bonus_amount),
        min_deposit: Number(promoForm.min_deposit) || 0,
        max_uses: promoForm.max_uses ? Number(promoForm.max_uses) : null,
        max_per_user: Number(promoForm.max_per_user) || 1,
        event_name: promoForm.event_name || null,
        expiry_date: promoForm.expiry_date || null,
        is_active: true
      })
      setShowPromoForm(false)
      setPromoForm({ code: '', bonus_amount: '', min_deposit: '', max_uses: '', max_per_user: '1', event_name: '', expiry_date: '' })
      setSuccessMsg('Promo code created!')
      fetchAll()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create promo')
    }
  }

  const offerTypeLabel = (t) => ({
    signup_bonus: '🎉 Signup', first_deposit: '🎁 First Deposit', event: '🎄 Event'
  }[t] || t)

  const claimColor = (t) => ({
    signup_bonus: 'bg-purple-500/20 text-purple-400',
    first_deposit: 'bg-blue-500/20 text-blue-400',
    event_bonus: 'bg-green-500/20 text-green-400',
    promo_bonus: 'bg-orange-500/20 text-orange-400'
  }[t] || 'bg-gray-500/20 text-gray-400')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Success Toast ── */}
      {successMsg && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-bold p-3 rounded-2xl text-center">
          ✅ {successMsg}
        </div>
      )}

      {/* ── Master Toggle ── */}
      <div className={`rounded-2xl p-4 border ${masterEnabled ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">🔌 Offers System — Master Switch</h3>
            <p className={`text-xs mt-0.5 font-semibold ${masterEnabled ? 'text-green-400' : 'text-red-400'}`}>
              {masterEnabled ? '✅ All offers & promos are ACTIVE' : '❌ All offers & promos are DISABLED'}
            </p>
          </div>
          <button onClick={toggleMaster}
            className={`w-14 h-7 rounded-full transition-all relative ${masterEnabled ? 'bg-green-500' : 'bg-gray-600'}`}>
            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${masterEnabled ? 'left-7' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* ── Section Tabs ── */}
      <div className="bg-gray-900 rounded-2xl flex overflow-hidden border border-gray-800">
        {[
          { key: 'offers', label: '🎁 Offers', count: offers.length },
          { key: 'promos', label: '🎟️ Promos', count: promos.length },
          { key: 'claims', label: '📋 Claims', count: claims.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveSection(tab.key)}
            className={`flex-1 py-3 text-xs font-bold transition-all ${
              activeSection === tab.key
                ? 'text-violet-400 bg-violet-500/10 border-b-2 border-violet-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* ── OFFERS SECTION ── */}
      {/* ══════════════════════════════════════════ */}
      {activeSection === 'offers' && (
        <div className="space-y-3">
          <button onClick={() => { setShowOfferForm(!showOfferForm); setFormError('') }}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-2xl text-sm transition">
            {showOfferForm ? '✕ Cancel' : '+ Create Offer'}
          </button>

          {showOfferForm && (
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
              <h3 className="font-bold text-white text-sm">New Offer</h3>
              {formError && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-xl">{formError}</p>}

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Type</label>
                <select value={offerForm.offer_type}
                  onChange={e => setOfferForm({ ...offerForm, offer_type: e.target.value })}
                  className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700">
                  <option value="signup_bonus">🎉 Signup Bonus (flat ₹)</option>
                  <option value="first_deposit">🎁 First Deposit Bonus (flat ₹)</option>
                  <option value="event">🎄 Event Bonus (% percentage)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Title</label>
                <input type="text" value={offerForm.title}
                  onChange={e => setOfferForm({ ...offerForm, title: e.target.value })}
                  placeholder="e.g. Welcome Bonus"
                  className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700 placeholder-gray-600" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Description (optional)</label>
                <input type="text" value={offerForm.description}
                  onChange={e => setOfferForm({ ...offerForm, description: e.target.value })}
                  placeholder="Short description"
                  className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700 placeholder-gray-600" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    {offerForm.offer_type === 'event' ? 'Bonus %' : 'Bonus ₹'}
                  </label>
                  <input type="number" value={offerForm.bonus_value}
                    onChange={e => setOfferForm({ ...offerForm, bonus_value: e.target.value })}
                    placeholder={offerForm.offer_type === 'event' ? '10' : '50'}
                    className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700 placeholder-gray-600" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Min Deposit ₹</label>
                  <input type="number" value={offerForm.min_deposit}
                    onChange={e => setOfferForm({ ...offerForm, min_deposit: e.target.value })}
                    placeholder="100"
                    className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700 placeholder-gray-600" />
                </div>
              </div>

              {offerForm.offer_type === 'event' && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Max Bonus Cap ₹</label>
                    <input type="number" value={offerForm.max_bonus_amount}
                      onChange={e => setOfferForm({ ...offerForm, max_bonus_amount: e.target.value })}
                      placeholder="500"
                      className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700 placeholder-gray-600" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Event Name</label>
                    <input type="text" value={offerForm.event_name}
                      onChange={e => setOfferForm({ ...offerForm, event_name: e.target.value })}
                      placeholder="Diwali"
                      className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700 placeholder-gray-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Start</label>
                      <input type="date" value={offerForm.start_date}
                        onChange={e => setOfferForm({ ...offerForm, start_date: e.target.value })}
                        className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">End</label>
                      <input type="date" value={offerForm.end_date}
                        onChange={e => setOfferForm({ ...offerForm, end_date: e.target.value })}
                        className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700" />
                    </div>
                  </div>
                </>
              )}

              <button onClick={createOffer}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-2xl text-sm transition">
                ✅ Create Offer
              </button>
            </div>
          )}

          {/* Offers List */}
          {offers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-2">🎁</p>
              <p className="text-gray-500 text-sm">No offers yet</p>
            </div>
          ) : (
            offers.map(offer => (
              <div key={offer.id} className={`bg-gray-900 rounded-2xl p-4 border ${offer.is_active ? 'border-green-500/30' : 'border-red-500/30'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
                        {offerTypeLabel(offer.offer_type)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${offer.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {offer.is_active ? '● Live' : '● Off'}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm truncate">{offer.title}</h4>
                    {offer.description && <p className="text-[10px] text-gray-500 truncate">{offer.description}</p>}
                  </div>
                  <button onClick={() => toggleOffer(offer.id, offer.is_active)}
                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ml-2 ${offer.is_active ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${offer.is_active ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="bg-orange-500/10 rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-orange-400">
                      {offer.bonus_type === 'percentage' ? `${Number(offer.bonus_value)}%` : `₹${Number(offer.bonus_value)}`}
                    </p>
                    <p className="text-[9px] text-orange-500/70">Bonus</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-white">₹{Number(offer.min_deposit) || 0}</p>
                    <p className="text-[9px] text-gray-500">Min Dep</p>
                  </div>
                  <div className="bg-green-500/10 rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-green-400">{offer.total_claims || 0}</p>
                    <p className="text-[9px] text-green-500/70">Claims</p>
                  </div>
                </div>

                {offer.offer_type === 'event' && (
                  <div className="mt-2 bg-purple-500/10 rounded-xl px-3 py-2 text-[10px] text-purple-400">
                    🎄 <b>{offer.event_name}</b> · {offer.start_date} → {offer.end_date}
                    {offer.max_bonus_amount ? ` · Cap ₹${Number(offer.max_bonus_amount)}` : ''}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-800">
                  <p className="text-[9px] text-gray-500">Given: ₹{Number(offer.total_bonus_given || 0).toFixed(0)}</p>
                  <button onClick={() => deleteOffer(offer.id)} className="text-[10px] text-red-400 font-bold hover:text-red-300">🗑 Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* ── PROMO CODES SECTION ── */}
      {/* ══════════════════════════════════════════ */}
      {activeSection === 'promos' && (
        <div className="space-y-3">
          <button onClick={() => { setShowPromoForm(!showPromoForm); setFormError('') }}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-2xl text-sm transition">
            {showPromoForm ? '✕ Cancel' : '+ Create Promo Code'}
          </button>

          {showPromoForm && (
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
              <h3 className="font-bold text-white text-sm">New Promo Code</h3>
              {formError && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-xl">{formError}</p>}

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Code</label>
                <input type="text" value={promoForm.code}
                  onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  placeholder="DIWALI50"
                  className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700 uppercase font-mono tracking-wider placeholder-gray-600" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Bonus ₹</label>
                  <input type="number" value={promoForm.bonus_amount}
                    onChange={e => setPromoForm({ ...promoForm, bonus_amount: e.target.value })}
                    placeholder="50"
                    className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700 placeholder-gray-600" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Min Deposit ₹</label>
                  <input type="number" value={promoForm.min_deposit}
                    onChange={e => setPromoForm({ ...promoForm, min_deposit: e.target.value })}
                    placeholder="100"
                    className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700 placeholder-gray-600" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Max Total Uses</label>
                  <input type="number" value={promoForm.max_uses}
                    onChange={e => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                    placeholder="∞"
                    className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700 placeholder-gray-600" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Per User</label>
                  <input type="number" value={promoForm.max_per_user}
                    onChange={e => setPromoForm({ ...promoForm, max_per_user: e.target.value })}
                    placeholder="1"
                    className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700 placeholder-gray-600" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Event Name (optional)</label>
                <input type="text" value={promoForm.event_name}
                  onChange={e => setPromoForm({ ...promoForm, event_name: e.target.value })}
                  placeholder="Diwali Special"
                  className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700 placeholder-gray-600" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Expiry Date</label>
                <input type="date" value={promoForm.expiry_date}
                  onChange={e => setPromoForm({ ...promoForm, expiry_date: e.target.value })}
                  className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none mt-1 border border-gray-700" />
              </div>

              <button onClick={createPromo}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-2xl text-sm transition">
                ✅ Create Promo Code
              </button>
            </div>
          )}

          {/* Promos List */}
          {promos.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-2">🎟️</p>
              <p className="text-gray-500 text-sm">No promo codes yet</p>
            </div>
          ) : (
            promos.map(promo => (
              <div key={promo.id} className={`bg-gray-900 rounded-2xl p-4 border ${promo.is_active ? 'border-green-500/30' : 'border-red-500/30'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-violet-400 bg-violet-500/20 px-3 py-1 rounded-full font-mono tracking-wider">
                        {promo.code}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${promo.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {promo.is_active ? '● Live' : '● Off'}
                      </span>
                    </div>
                    {promo.event_name && <p className="text-[10px] text-gray-500">🎄 {promo.event_name}</p>}
                  </div>
                  <button onClick={() => togglePromo(promo.id, promo.is_active)}
                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${promo.is_active ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${promo.is_active ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5 mt-3">
                  <div className="bg-orange-500/10 rounded-xl p-2 text-center">
                    <p className="text-xs font-bold text-orange-400">₹{Number(promo.bonus_amount)}</p>
                    <p className="text-[8px] text-orange-500/70">Bonus</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-2 text-center">
                    <p className="text-xs font-bold text-white">₹{Number(promo.min_deposit)}</p>
                    <p className="text-[8px] text-gray-500">Min</p>
                  </div>
                  <div className="bg-violet-500/10 rounded-xl p-2 text-center">
                    <p className="text-xs font-bold text-violet-400">{promo.used_count}/{promo.max_uses || '∞'}</p>
                    <p className="text-[8px] text-violet-500/70">Used</p>
                  </div>
                  <div className="bg-green-500/10 rounded-xl p-2 text-center">
                    <p className="text-xs font-bold text-green-400">{promo.total_claims || 0}</p>
                    <p className="text-[8px] text-green-500/70">Claims</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-800">
                  <p className="text-[9px] text-gray-500">
                    {promo.expiry_date ? `Expires: ${promo.expiry_date}` : 'No expiry'}
                    {' · '}₹{Number(promo.total_bonus_given || 0).toFixed(0)} given
                  </p>
                  <button onClick={() => deletePromo(promo.id)} className="text-[10px] text-red-400 font-bold hover:text-red-300">🗑 Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* ── CLAIMS HISTORY SECTION ── */}
      {/* ══════════════════════════════════════════ */}
      {activeSection === 'claims' && (
        <div className="space-y-2">
          {claims.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-gray-500 text-sm">No bonus claims yet</p>
            </div>
          ) : (
            claims.map(claim => (
              <div key={claim.id} className="bg-gray-900 rounded-2xl p-3 border border-gray-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${claimColor(claim.claim_type)}`}>
                      {(claim.claim_type || '').replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {claim.promo_code && (
                      <span className="text-[9px] font-bold text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded-full font-mono">
                        {claim.promo_code}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-green-400 text-sm">+₹{Number(claim.bonus_amount).toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>👤 {claim.user_name || 'User'} ({claim.user_phone || '—'})</span>
                  <span>{claim.created_at ? new Date(claim.created_at).toLocaleDateString('en-IN') : ''}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Deposit: ₹{Number(claim.deposit_amount || 0).toFixed(0)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}