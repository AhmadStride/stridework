'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface Props {
  email: string
  fullName: string
  avatarUrl: string | null
}

export default function AccountClient({ email, fullName: initialName, avatarUrl: initialAvatar }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(initialName)
  const [avatar, setAvatar] = useState<string | null>(initialAvatar)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)

  const initials = name
    ? name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string
      setAvatar(dataUrl)
      await supabase.auth.updateUser({ data: { avatar_url: dataUrl } })
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  async function saveProfile() {
    setSaving(true)
    await supabase.auth.updateUser({ data: { full_name: name } })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-gray-400 font-medium">Stridestack</p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile</h1>
      </div>

      {/* Avatar + name */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-4 mb-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer ring-2 ring-white shadow-sm hover:opacity-90 transition"
            >
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-gray-600">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center shadow"
            >
              {uploading ? (
                <svg className="w-2.5 h-2.5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div>
            <p className="font-semibold text-gray-900">{name || 'Your Name'}</p>
            <p className="text-sm text-gray-400">{email}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Admin</span>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Name field */}
        <div className="space-y-1.5 mb-4">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            className="h-11 border-gray-200 focus:border-gray-400 rounded-lg"
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-1.5 mb-5">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</Label>
          <Input
            value={email}
            disabled
            className="h-11 border-gray-200 bg-gray-50 text-gray-400 rounded-lg"
          />
        </div>

        <Button
          onClick={saveProfile}
          disabled={saving}
          className="w-full h-11 rounded-xl font-semibold"
        >
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Profile'}
        </Button>
      </div>

      {/* Workspace section */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Workspace</p>
        </div>
        <Link href="/team" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Team Members</p>
              <p className="text-xs text-gray-400">Manage your team</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {/* Account section */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Account</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Signed in as</p>
          <p className="text-sm font-semibold text-gray-700">{email}</p>
        </div>
        <Separator />
        <div className="px-5 py-4">
          <button
            onClick={signOut}
            className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
