'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function AccountClient({ email }: { email: string }) {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground font-medium">StrideWorks</p>
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
      </div>

      <Card className="mb-4">
        <CardContent className="p-0">
          <div className="px-4 py-4">
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Signed in as</p>
            <p className="text-sm font-semibold">{email}</p>
          </div>
          <Separator />
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Role: Admin</p>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5" onClick={signOut}>
        Sign out
      </Button>
    </div>
  )
}
