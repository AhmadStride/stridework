'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/'); router.refresh() }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <Image src="/logo-icon.png" alt="StrideWork" width={36} height={36} className="shrink-0" />
            <span className="text-2xl font-black tracking-tight text-gray-950" style={{ letterSpacing: '-0.02em' }}>StrideWork</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your workspace</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@agency.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
