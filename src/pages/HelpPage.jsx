import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const FAQ_SECTIONS = [
  {
    title: '💰 Wallet & Payments',
    faqs: [
      {
        q: 'How do I add money to my wallet?',
        a: 'Go to Wallet → Tap "Add Money" → Choose an amount or enter a custom amount → Complete payment via UPI, Card, or Net Banking.'
      },
      {
        q: 'Is my wallet balance refundable?',
        a: 'Unused wallet balance can be refunded. However, once balance is used for a chat or call session, it cannot be refunded. Contact support for refund requests.'
      },
      {
        q: 'What payment methods are accepted?',
        a: 'We accept UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Wallets through our secure payment gateway.'
      },
      {
        q: 'How are charges calculated?',
        a: 'Charges are per minute based on the creator\'s listed rate. You can see the rate on each creator\'s profile before starting a chat or call.'
      },
    ]
  },
  {
    title: '💬 Chat & Calls',
    faqs: [
      {
        q: 'How do I start a chat with a creator?',
        a: 'Browse creators on the home page → Tap on a creator → Tap "Chat Now". Make sure you have sufficient wallet balance.'
      },
      {
        q: 'What if a creator is offline?',
        a: 'If a creator is offline, you can wait for them to come online. Their status is shown on their profile card (green = Online, grey = Offline).'
      },
      {
        q: 'Can I make video calls?',
        a: 'Yes! You can make both audio and video calls with creators. Tap "Call" on the creator\'s profile and choose your preferred call type.'
      },
      {
        q: 'What happens if the call drops?',
        a: 'If a call drops due to network issues, you will only be charged for the minutes used. No extra charges are applied for dropped calls.'
      },
    ]
  },
  {
    title: '👤 Account & Profile',
    faqs: [
      {
        q: 'How do I edit my profile?',
        a: 'Tap the hamburger menu (☰) → "My Profile" → Edit your name, photo, and other details → Save changes.'
      },
      {
        q: 'How do I change my phone number?',
        a: 'Currently, phone number changes require contacting our support team. Email us at support@creatorhub.app with your old and new number.'
      },
      {
        q: 'How do I delete my account?',
        a: 'Contact our support team at support@creatorhub.app with your account deletion request. We will process it within 7 business days.'
      },
    ]
  },
  {
    title: '🎁 Offers & Referrals',
    faqs: [
      {
        q: 'How does the referral program work?',
        a: 'Share your invite link with friends. When they sign up and make their first recharge, you both get ₹100 bonus in your wallets!'
      },
      {
        q: 'How do I claim my signup bonus?',
        a: 'New users automatically receive a ₹50 signup bonus. If you haven\'t received it, please contact support.'
      },
    ]
  },
]

export default function HelpPage() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (key) => {
    setOpenFaq(prev => prev === key ? null : key)
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Header */}
      <div className="bg-[#FFC629] px-4 pt-12 pb-5 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-[#1D1D1D] rounded-xl flex items-center justify-center active:scale-90 transition"
          >
            <span className="text-[#FFC629] text-lg">←</span>
          </button>
          <h1 className="text-lg font-extrabold text-[#1D1D1D]">Help & FAQ</h1>
        </div>
      </div>

      {/* Quick Contact Banner */}
      <div className="mx-4 mt-4">
        <div className="bg-gradient-to-r from-[#1D1D1D] to-[#333333] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#FFC629] opacity-10 rounded-full"></div>
          <div className="absolute -right-2 -bottom-8 w-20 h-20 bg-[#FFC629] opacity-5 rounded-full"></div>
          <div className="w-14 h-14 bg-[#FFC629] rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📧</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-extrabold text-sm">Need Help?</p>
            <p className="text-white/50 text-xs mt-0.5">Our team is available 24/7</p>
          </div>
          <button
            onClick={() => window.open('mailto:support@creatorhub.app', '_blank')}
            className="bg-[#FFC629] text-[#1D1D1D] text-xs font-extrabold px-4 py-2 rounded-xl flex-shrink-0 active:scale-95 transition"
          >
            Email Us
          </button>
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="px-4 py-5 space-y-5">
        {FAQ_SECTIONS.map((section, sIdx) => (
          <div key={sIdx}>
            {/* Section Title */}
            <h2 className="text-[#1D1D1D] font-extrabold text-base mb-3">{section.title}</h2>

            {/* FAQ Items */}
            <div className="space-y-2">
              {section.faqs.map((faq, fIdx) => {
                const key = `${sIdx}-${fIdx}`
                const isOpen = openFaq === key

                return (
                  <div
                    key={key}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
                  >
                    {/* Question */}
                    <button
                      onClick={() => toggleFaq(key)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-[#FFF8E1] transition"
                    >
                      <span className="text-[#1D1D1D] text-sm font-bold pr-4 leading-snug">{faq.q}</span>
                      <span
                        className={`text-[#FFC629] text-lg font-bold flex-shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-45' : 'rotate-0'
                        }`}
                      >
                        +
                      </span>
                    </button>

                    {/* Answer */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-4 pb-4 pt-0">
                        <div className="border-t border-gray-100 pt-3">
                          <p className="text-[#757575] text-sm leading-relaxed">{faq.a}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Still Need Help */}
        <div className="bg-[#FFF8E1] rounded-2xl p-5 text-center border border-[#FFC629]/20 mt-6">
          <p className="text-3xl mb-2">🤔</p>
          <h3 className="text-[#1D1D1D] font-extrabold text-base">Still have questions?</h3>
          <p className="text-[#757575] text-xs mt-1 mb-4">Don't worry, we're here to help!</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.open('mailto:support@creatorhub.app', '_blank')}
              className="flex-1 bg-[#1D1D1D] text-[#FFC629] font-extrabold py-3 rounded-xl text-sm active:scale-95 transition"
            >
              📧 Email Support
            </button>
            <button
              onClick={() => window.open('https://wa.me/919876543210', '_blank')}
              className="flex-1 bg-[#25D366] text-white font-extrabold py-3 rounded-xl text-sm active:scale-95 transition"
            >
              💬 WhatsApp
            </button>
          </div>
        </div>

        <div className="pt-2 pb-8 text-center">
          <p className="text-[#CCCCCC] text-xs">© 2026 CreatorHub. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}