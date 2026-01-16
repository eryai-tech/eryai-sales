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
      
      // Kolla om användaren redan har MFA
      const { data: factors } = await supabase.auth.mfa.listFactors()
      
      if (factors?.totp && factors.totp.length > 0) {
        // Användaren har redan MFA setup
        router.push('/leads')
        return
      }

      // Enrolla ny TOTP factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'EryAI Sales Dashboard'
      })

      if (error) throw error

      // Generera QR-kod
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
      
      // Skapa challenge för att verifiera koden
      const { data: challengeData, error: challengeError } = 
        await supabase.auth.mfa.challenge({ f
