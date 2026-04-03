import { useNavigate } from 'react-router-dom'

export default function TermsPage() {
  const navigate = useNavigate()

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
          <h1 className="text-lg font-extrabold text-[#1D1D1D]">Terms & Conditions</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Last Updated */}
        <p className="text-xs text-[#AAAAAA]">Last updated: March 30, 2026</p>

        {/* Section 1 */}
        <div>
          <h2 className="text-[#1D1D1D] font-extrabold text-base mb-2">1. Acceptance of Terms</h2>
          <p className="text-[#757575] text-sm leading-relaxed">
            By accessing or using CreatorHub, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you may not use our services.
          </p>
        </div>

        {/* Section 2 */}
        <div>
          <h2 className="text-[#1D1D1D] font-extrabold text-base mb-2">2. User Accounts</h2>
          <p className="text-[#757575] text-sm leading-relaxed">
            You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to use our services.
          </p>
        </div>

        {/* Section 3 */}
        <div>
          <h2 className="text-[#1D1D1D] font-extrabold text-base mb-2">3. Wallet & Payments</h2>
          <p className="text-[#757575] text-sm leading-relaxed">
            All wallet recharges are non-refundable once used for chat or call services. Charges are deducted per minute based on the creator's listed rate. Unused wallet balance may be refunded subject to our refund policy.
          </p>
        </div>

        {/* Section 4 */}
        <div>
          <h2 className="text-[#1D1D1D] font-extrabold text-base mb-2">4. Chat & Call Services</h2>
          <p className="text-[#757575] text-sm leading-relaxed">
            CreatorHub provides a platform for users to connect with creators via chat and audio/video calls. We do not guarantee the availability of any creator at any time. Call quality depends on your internet connection.
          </p>
        </div>

        {/* Section 5 */}
        <div>
          <h2 className="text-[#1D1D1D] font-extrabold text-base mb-2">5. Creator Content</h2>
          <p className="text-[#757575] text-sm leading-relaxed">
            Creators are independent and their advice, opinions, and content are their own. CreatorHub does not endorse or verify the accuracy of any creator's content or advice. Users engage with creators at their own discretion.
          </p>
        </div>

        {/* Section 6 */}
        <div>
          <h2 className="text-[#1D1D1D] font-extrabold text-base mb-2">6. Prohibited Conduct</h2>
          <p className="text-[#757575] text-sm leading-relaxed">
            Users may not use the platform for any illegal, abusive, or harmful activities. Harassment, hate speech, or inappropriate behavior towards creators or other users will result in immediate account suspension.
          </p>
        </div>

        {/* Section 7 */}
        <div>
          <h2 className="text-[#1D1D1D] font-extrabold text-base mb-2">7. Privacy</h2>
          <p className="text-[#757575] text-sm leading-relaxed">
            We collect and process your personal data in accordance with our Privacy Policy. By using our services, you consent to the collection and use of your data as described therein.
          </p>
        </div>

        {/* Section 8 */}
        <div>
          <h2 className="text-[#1D1D1D] font-extrabold text-base mb-2">8. Limitation of Liability</h2>
          <p className="text-[#757575] text-sm leading-relaxed">
            CreatorHub shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our total liability shall not exceed the amount paid by you in the last 30 days.
          </p>
        </div>

        {/* Section 9 */}
        <div>
          <h2 className="text-[#1D1D1D] font-extrabold text-base mb-2">9. Changes to Terms</h2>
          <p className="text-[#757575] text-sm leading-relaxed">
            We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
          </p>
        </div>

        {/* Section 10 */}
        <div>
          <h2 className="text-[#1D1D1D] font-extrabold text-base mb-2">10. Contact Us</h2>
          <p className="text-[#757575] text-sm leading-relaxed">
            If you have any questions about these Terms & Conditions, please contact us at{' '}
            <span className="text-[#FFA500] font-bold">support@creatorhub.app</span>
          </p>
        </div>

        <div className="pt-4 pb-8 text-center">
          <p className="text-[#CCCCCC] text-xs">© 2026 CreatorHub. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}