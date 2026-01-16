'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import QRCode from 'qrcode'

export default function MFASetup() {
  const router = useRouter()
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    enrollMFA()
  }, [])

  const enrollMFA = async () => {
    try {
      const supabase = createClient()
      
      const { data: factors } = await supabase.auth.mfa.listFactors()
      
      if (factors?.totp && factors.totp.length > 0) {
        router.push('/leads')
        return
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'EryAI Sales Dashboard'
      })

      if (error) throw error

      const qrCodeDataUrl = await QRCode.toDataURL(data.totp.uri)
      
      setQrCode(qrCodeDataUrl)
      setSecret(data.totp.secret)
      setFactorId(data.id)
      setLoading(false)
    } catch (err) {
      console.error('MFA enrollment error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const verifyAndEnable = async (e) => {
    e.preventDefault()
    setVerifying(true)
    setError('')

    try {
      const supabase = createClient()
      
      const { data: challengeData, error: challengeError } = 
        await supabase.auth.mfa.challenge({ factorId })

      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode
      })

      if (verifyError) throw verifyError

      router.push('/leads')
    } catch (err) {
      console.error('Verification error:', err)
      setError('Fel kod. Försök igen.')
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-gray-900 text-xl">Laddar...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Aktivera 2FA
          </h1>
          <p className="text-gray-600">
            Skanna QR-koden med Google Authenticator eller Authy
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <img 
              src={qrCode} 
              alt="MFA QR Code" 
              className="w-full h-auto"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              Kan inte scanna? Ange denna kod manuellt:
            </p>
            <code className="text-gray-900 font-mono text-sm break-all">
              {secret}
            </code>
          </div>

          <form onSubmit={verifyAndEnable} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ange 6-siffrig kod från appen
              </label>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                pattern="[0-9]{6}"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="000000"
                disabled={verifying}
              />
            </div>

            <button
              type="submit"
              disabled={verifying || verifyCode.length !== 6}
              className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? 'Verifierar...' : 'Aktivera 2FA'}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Tillbaka till inloggning
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
