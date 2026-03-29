import { useState, useEffect } from 'react'
import apiClient from '../api/client'

export default function AdminOffers() {
  const [masterEnabled, setMasterEnabled] = useState(false)
  const [offers, setOffers] = useState([])
  const [promos, setPromos] = useState([])
  const [claims, setClaims] = useState([])
  const [activeTab, setActiveTab] = useState('offers')
  const [loading, setLoading] = useState(true)

  // Create offer form
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerForm, setOfferForm] = useState({
    offer_type: 'signup_bonus', title: '', description: '',
    bonus_type: 'flat', bonus_value: '', max_bonus_amount: '',
    min_deposit: '', event_name: '', start_date: '', end_date: '', is_active: true
  })

  // Create promo form
  const [showPromoForm, setShowPromoForm] = useState(false)
  const [promoForm, setPromoForm] = useState({
    code: '', bonus_amount: '', min_deposit: '',
    max_uses: '', max_per_user: '1', event_name: '',
    expiry_date: '', is_active: true
  })

  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

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
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleMaster = async () => {
    try {
      const res = await apiClient.put('/admin/offers/settings/toggle', { enabled: !masterEnabled })
      setMasterEnabled(res.data.offers_enabled)
    } catch (err) {
      alert('Failed to toggle')
    }
  }

  const toggleOffer = async (id, currentStatus) => {
    try {
      await apiClient.put(`/admin/offers/${id}/toggle`, { enabled: !currentStatus })
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed')
    }
  }

  const togglePromo = async (id, currentStatus) => {
    try {
      await apiClient.put(`/admin/offers/promos/${id}/toggle`, { enabled: !currentStatus })
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed')
    }
  }

  const deleteOffer = async (id) => {
    if (!confirm('Delete this offer?')) return
    try {
      await apiClient.delete(`/admin/offers/${id}`)
      fetchAll()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  const deletePromo = async (id) => {
    if (!confirm('Delete this promo code?')) return
    try {
      await apiClient.delete(`/admin/offers/promos/${id}`)
      fetchAll()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  const createOffer = async () => {
    setFormError('')
    if (!offerForm.title) { setFormError('Title is required'); return }
    if (!offerForm.bonus_value) { setFormError('Bonus value is required'); return }
    if (offerForm.offer_type === 'event' && (!offerForm.start_date || !offerForm.end_date)) {
      setFormError('Event requires start and end date'); return
    }

    try {
      const payload = {
        ...offerForm,
        bonus_value: Number(offerForm.bonus_value),
        min_deposit: Number(offerForm.min_deposit) || 0,
        max_bonus_amount: offerForm.max_bonus_amount ? Number(offerForm.max_bonus_amount) : null,
        bonus_type: offerForm.offer_type === 'event' ? 'percentage' : 'flat',
        start_date: offerForm.start_date || null,
        end_date: offerForm.end_date || null,
      }
      await apiClient.post('/admin/offers/', payload)
      setShowOfferForm(false)
      setOfferForm({
        offer_type: 'signup_bonus', title: '', description: '',
        bonus_type: 'flat', bonus_value: '', max_bonus_amount: '',
        min_deposit: '', event_name: '', start_date: '', end_date: '', is_active: true
      })
      fetchAll()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create')
    }
  }

  const createPromo = async () => {
    setFormError('')
    if (!promoForm.code) { setFormError('Code is required'); return }
    if (!promoForm.bonus_amount) { setFormError('Bonus amount is required'); return }

    try {
      const payload = {
        ...promoForm,
        code: promoForm.code.toUpperCase(),
        bonus_amount: Number(promoForm.bonus_amount),
        min_deposit: Number(promoForm.min_deposit) || 0,
        max_uses: promoForm.max_uses ? Number(promoForm.max_uses) : null,
        max_per_user: Number(promoForm.max_per_user) || 1,
        expiry_date: promoForm.expiry_date || null,
      }
      await apiClient.post('/admin/offers/promos', payload)
      setShowPromoForm(false)
      setPromoForm({
        code: '', bonus_amount: '', min_deposit: '',
        max_uses: '', max_per_user: '1', event_name: '',
        expiry_date: '', is_active: true
      })
      fetchAll()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create')
    }
  }

  const getOfferTypeLabel = (type) => {
    switch (type) {
      case 'signup_bonus': return '🎉 Signup Bonus'
      case 'first_deposit': return '🎁 First Deposit'
      case 'event': return '🎄 Event'
      default: return type
    }
  }

  const getClaimTypeColor = (type) => {
    switch (type) {
      case 'signup_bonus': return 'bg-purple-100 text-purple-700'
      case 'first_deposit': return 'bg-blue-100 text-blue-700'
      case 'event_bonus': return 'bg-green-100 text-green-700'
      case 'promo_bonus': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FFC629] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-8">
      {/* Header */}
      <div className="bg-[#FFC629] px-4 pt-10 pb-6 rounded-b-3xl">
        <h1 className="text-2xl font-extrabold text-[#1D1D1D]">🎁 Offers & Promos</h1>
        <p className="text-[#1D1D1D] opacity-60 text-sm mt-1">Manage bonuses, events & promo codes</p>
      </div>

      {/* Master Toggle */}
      <div className="mx-4 -mt-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 border-2 border-[#FFF8E1]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-[#1D1D1D]">🔌 Offers System</h3>
              <p className="text-xs text-[#AAAAAA] mt-0.5">
                {masterEnabled ? 'All offers & promos are ACTIVE' : 'All offers & promos are DISABLED'}
              </p>
            </div>
            <button
              onClick={toggleMaster}
              className={`w-14 h-7 rounded-full transition-all relative ${
                masterEnabled ? 'bg-[#00C851]' : 'bg-[#CCCCCC]'
              }`}
            >
              <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${
                masterEnabled ? 'left-7' : 'left-0.5'
              }`}></span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm flex border-2 border-[#FFF8E1]">
          {[
            { key: 'offers', label: '🎁 Offers' },
            { key: 'promos', label: '🎟️ Promos' },
            { key: 'claims', label: '📋 Claims' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-extrabold transition ${
                activeTab === tab.key
                  ? 'text-[#1D1D1D] border-b-2 border-[#FFC629]'
                  : 'text-[#AAAAAA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── OFFERS TAB ── */}
      {activeTab === 'offers' && (
        <div className="mx-4 space-y-4">
          <button onClick={() => { setShowOfferForm(true); setFormError('') }}
            className="w-full bg-[#FFC629] text-[#1D1D1D] font-extrabold py-3 rounded-2xl shadow text-sm">
            + Create New Offer
          </button>

          {/* Create Offer Form */}
          {showOfferForm && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F0F0]">
              <h3 className="font-extrabold text-[#1D1D1D] mb-3">Create Offer</h3>

              {formError && (
                <div className="bg-red-50 text-red-600 text-xs p-2 rounded-xl mb-3">{formError}</div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#757575] block mb-1">Offer Type</label>
                  <select value={offerForm.offer_type}
                    onChange={e => setOfferForm({ ...offerForm, offer_type: e.target.value })}
                    className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none">
                    <option value="signup_bonus">🎉 Signup Bonus (flat)</option>
                    <option value="first_deposit">🎁 First Deposit Bonus (flat)</option>
                    <option value="event">🎄 Event Bonus (percentage)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#757575] block mb-1">Title</label>
                  <input type="text" value={offerForm.title}
                    onChange={e => setOfferForm({ ...offerForm, title: e.target.value })}
                    placeholder="e.g. Welcome Bonus"
                    className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none" />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#757575] block mb-1">Description</label>
                  <input type="text" value={offerForm.description}
                    onChange={e => setOfferForm({ ...offerForm, description: e.target.value })}
                    placeholder="Short description"
                    className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none" />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#757575] block mb-1">
                    {offerForm.offer_type === 'event' ? 'Bonus Percentage (%)' : 'Bonus Amount (₹)'}
                  </label>
                  <input type="number" value={offerForm.bonus_value}
                    onChange={e => setOfferForm({ ...offerForm, bonus_value: e.target.value })}
                    placeholder={offerForm.offer_type === 'event' ? 'e.g. 10' : 'e.g. 50'}
                    className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none" />
                </div>

                {offerForm.offer_type === 'event' && (
                  <div>
                    <label className="text-xs font-bold text-[#757575] block mb-1">Max Bonus Cap (₹)</label>
                    <input type="number" value={offerForm.max_bonus_amount}
                      onChange={e => setOfferForm({ ...offerForm, max_bonus_amount: e.target.value })}
                      placeholder="e.g. 500 (leave empty for no cap)"
                      className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none" />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[#757575] block mb-1">Min Deposit (₹)</label>
                  <input type="number" value={offerForm.min_deposit}
                    onChange={e => setOfferForm({ ...offerForm, min_deposit: e.target.value })}
                    placeholder="e.g. 100"
                    className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none" />
                </div>

                {offerForm.offer_type === 'event' && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-[#757575] block mb-1">Event Name</label>
                      <input type="text" value={offerForm.event_name}
                        onChange={e => setOfferForm({ ...offerForm, event_name: e.target.value })}
                        placeholder="e.g. Diwali, Christmas"
                        className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-[#757575] block mb-1">Start Date</label>
                        <input type="date" value={offerForm.start_date}
                          onChange={e => setOfferForm({ ...offerForm, start_date: e.target.value })}
                          className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#757575] block mb-1">End Date</label>
                        <input type="date" value={offerForm.end_date}
                          onChange={e => setOfferForm({ ...offerForm, end_date: e.target.value })}
                          className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none" />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowOfferForm(false)}
                    className="flex-1 bg-[#F8F8F8] text-[#757575] font-bold py-2.5 rounded-xl text-sm">Cancel</button>
                  <button onClick={createOffer}
                    className="flex-1 bg-[#FFC629] text-[#1D1D1D] font-extrabold py-2.5 rounded-xl text-sm">Create</button>
                </div>
              </div>
            </div>
          )}

          {/* Offers List */}
          {offers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">🎁</p>
              <p className="text-[#AAAAAA]">No offers created yet</p>
            </div>
          ) : (
            offers.map(offer => (
              <div key={offer.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F0F0]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFF8E1] text-[#FFA500]">
                        {getOfferTypeLabel(offer.offer_type)}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        offer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {offer.is_active ? '● Active' : '● Inactive'}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-[#1D1D1D]">{offer.title}</h4>
                    {offer.description && <p className="text-xs text-[#AAAAAA] mt-0.5">{offer.description}</p>}
                  </div>
                  <button
                    onClick={() => toggleOffer(offer.id, offer.is_active)}
                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
                      offer.is_active ? 'bg-[#00C851]' : 'bg-[#CCCCCC]'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      offer.is_active ? 'left-6' : 'left-0.5'
                    }`}></span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="bg-[#F8F8F8] rounded-xl p-2">
                    <p className="text-sm font-extrabold text-[#FFA500]">
                      {offer.bonus_type === 'percentage' ? `${offer.bonus_value}%` : `₹${offer.bonus_value}`}
                    </p>
                    <p className="text-[10px] text-[#AAAAAA]">Bonus</p>
                  </div>
                  <div className="bg-[#F8F8F8] rounded-xl p-2">
                    <p className="text-sm font-extrabold text-[#1D1D1D]">₹{offer.min_deposit || 0}</p>
                    <p className="text-[10px] text-[#AAAAAA]">Min Deposit</p>
                  </div>
                  <div className="bg-[#F8F8F8] rounded-xl p-2">
                    <p className="text-sm font-extrabold text-[#00C851]">{offer.total_claims || 0}</p>
                    <p className="text-[10px] text-[#AAAAAA]">Claims</p>
                  </div>
                </div>

                {offer.offer_type === 'event' && (
                  <div className="mt-2 bg-[#FFF8E1] rounded-xl p-2 text-xs text-[#757575]">
                    🎄 {offer.event_name || 'Event'} • {offer.start_date} to {offer.end_date}
                    {offer.max_bonus_amount && ` • Max ₹${offer.max_bonus_amount}`}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F0F0F0]">
                  <p className="text-[10px] text-[#AAAAAA]">
                    Total bonus given: ₹{Number(offer.total_bonus_given || 0).toFixed(2)}
                  </p>
                  <button onClick={() => deleteOffer(offer.id)}
                    className="text-xs text-red-500 font-bold">🗑️ Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── PROMOS TAB ── */}
      {activeTab === 'promos' && (
        <div className="mx-4 space-y-4">
          <button onClick={() => { setShowPromoForm(true); setFormError('') }}
            className="w-full bg-[#FFC629] text-[#1D1D1D] font-extrabold py-3 rounded-2xl shadow text-sm">
            + Create Promo Code
          </button>

          {/* Create Promo Form */}
          {showPromoForm && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F0F0]">
              <h3 className="font-extrabold text-[#1D1D1D] mb-3">Create Promo Code</h3>

              {formError && (
                <div className="bg-red-50 text-red-600 text-xs p-2 rounded-xl mb-3">{formError}</div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#757575] block mb-1">Promo Code</label>
                  <input type="text" value={promoForm.code}
                    onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. DIWALI50"
                    className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none uppercase" />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#757575] block mb-1">Bonus Amount (₹) — Flat</label>
                  <input type="number" value={promoForm.bonus_amount}
                    onChange={e => setPromoForm({ ...promoForm, bonus_amount: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none" />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#757575] block mb-1">Min Deposit (₹)</label>
                  <input type="number" value={promoForm.min_deposit}
                    onChange={e => setPromoForm({ ...promoForm, min_deposit: e.target.value })}
                    placeholder="e.g. 100"
                    className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#757575] block mb-1">Max Total Uses</label>
                    <input type="number" value={promoForm.max_uses}
                      onChange={e => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                      placeholder="Unlimited"
                      className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#757575] block mb-1">Max Per User</label>
                    <input type="number" value={promoForm.max_per_user}
                      onChange={e => setPromoForm({ ...promoForm, max_per_user: e.target.value })}
                      placeholder="1"
                      className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#757575] block mb-1">Event Name (optional)</label>
                  <input type="text" value={promoForm.event_name}
                    onChange={e => setPromoForm({ ...promoForm, event_name: e.target.value })}
                    placeholder="e.g. Diwali Special"
                    className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none" />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#757575] block mb-1">Expiry Date</label>
                  <input type="date" value={promoForm.expiry_date}
                    onChange={e => setPromoForm({ ...promoForm, expiry_date: e.target.value })}
                    className="w-full bg-[#F8F8F8] rounded-xl px-3 py-2.5 text-sm outline-none" />
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowPromoForm(false)}
                    className="flex-1 bg-[#F8F8F8] text-[#757575] font-bold py-2.5 rounded-xl text-sm">Cancel</button>
                  <button onClick={createPromo}
                    className="flex-1 bg-[#FFC629] text-[#1D1D1D] font-extrabold py-2.5 rounded-xl text-sm">Create</button>
                </div>
              </div>
            </div>
          )}

          {/* Promos List */}
          {promos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">🎟️</p>
              <p className="text-[#AAAAAA]">No promo codes created yet</p>
            </div>
          ) : (
            promos.map(promo => (
              <div key={promo.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F0F0]">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-extrabold text-[#7C3AED] bg-purple-50 px-3 py-1 rounded-full tracking-wider">
                        {promo.code}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        promo.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {promo.is_active ? '● Active' : '● Inactive'}
                      </span>
                    </div>
                    {promo.event_name && (
                      <p className="text-xs text-[#AAAAAA] mt-1">🎄 {promo.event_name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => togglePromo(promo.id, promo.is_active)}
                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
                      promo.is_active ? 'bg-[#00C851]' : 'bg-[#CCCCCC]'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      promo.is_active ? 'left-6' : 'left-0.5'
                    }`}></span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                  <div className="bg-[#F8F8F8] rounded-xl p-2">
                    <p className="text-sm font-extrabold text-[#FFA500]">₹{promo.bonus_amount}</p>
                    <p className="text-[10px] text-[#AAAAAA]">Bonus</p>
                  </div>
                  <div className="bg-[#F8F8F8] rounded-xl p-2">
                    <p className="text-sm font-extrabold text-[#1D1D1D]">₹{promo.min_deposit}</p>
                    <p className="text-[10px] text-[#AAAAAA]">Min Dep</p>
                  </div>
                  <div className="bg-[#F8F8F8] rounded-xl p-2">
                    <p className="text-sm font-extrabold text-[#7C3AED]">
                      {promo.used_count}/{promo.max_uses || '∞'}
                    </p>
                    <p className="text-[10px] text-[#AAAAAA]">Used</p>
                  </div>
                  <div className="bg-[#F8F8F8] rounded-xl p-2">
                    <p className="text-sm font-extrabold text-[#00C851]">{promo.total_claims || 0}</p>
                    <p className="text-[10px] text-[#AAAAAA]">Claims</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F0F0F0]">
                  <p className="text-[10px] text-[#AAAAAA]">
                    {promo.expiry_date ? `Expires: ${promo.expiry_date}` : 'No expiry'}
                    {' • '}Total bonus: ₹{Number(promo.total_bonus_given || 0).toFixed(2)}
                  </p>
                  <button onClick={() => deletePromo(promo.id)}
                    className="text-xs text-red-500 font-bold">🗑️ Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CLAIMS TAB ── */}
      {activeTab === 'claims' && (
        <div className="mx-4 space-y-3">
          {claims.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-[#AAAAAA]">No bonus claims yet</p>
            </div>
          ) : (
            claims.map(claim => (
              <div key={claim.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F0F0]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getClaimTypeColor(claim.claim_type)}`}>
                      {claim.claim_type.replace('_', ' ').toUpperCase()}
                    </span>
                    {claim.promo_code && (
                      <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full">
                        {claim.promo_code}
                      </span>
                    )}
                  </div>
                  <p className="font-extrabold text-[#00C851]">+₹{Number(claim.bonus_amount).toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-[#AAAAAA]">
                  <p>👤 {claim.user_name} ({claim.user_phone})</p>
                  <p>{new Date(claim.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <p className="text-xs text-[#757575] mt-1">
                  Deposit: ₹{Number(claim.deposit_amount).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}