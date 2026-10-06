'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Store, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const nextUrl = searchParams.get('next') || '/admin/dashboard'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMsg(null)

    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await signIn(formData)
      if (!result.success) {
        setErrorMsg(result.error ?? 'Authentication failed')
      } else {
        router.push(nextUrl)
        router.refresh()
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-600/30 mb-4">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Baqqala Staff Portal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your authorized grocery management credentials
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3.5 flex items-start gap-3 text-destructive text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="leading-snug">{errorMsg}</p>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Staff Email
              </label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="staff@baqqala.ae"
                  className="pl-9 h-10"
                  disabled={isPending}
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  className="pl-9 h-10"
                  disabled={isPending}
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In to Baqqala'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Zone 19 physical grocery operations. Role-based access enforced via Supabase RLS.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
