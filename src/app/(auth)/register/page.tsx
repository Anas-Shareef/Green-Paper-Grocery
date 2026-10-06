'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signUpCustomer } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Store, Lock, Mail, User, Phone, AlertCircle, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const nextUrl = searchParams.get('next')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMsg(null)

    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await signUpCustomer(formData)
      if (!result.success) {
        setErrorMsg(result.error ?? 'Registration failed')
      } else {
        const target = nextUrl && !nextUrl.startsWith('/admin') ? nextUrl : '/account'
        router.push(target)
        router.refresh()
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-600/30">
              <Store className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Create an Account
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Join Baqqala Grocery for fast express grocery deliveries in Zone 19
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 flex items-start gap-3 text-destructive text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="leading-snug">{errorMsg}</p>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="fullName"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Full Name
              </label>
              <div className="relative">
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Fatima Al Hosani"
                  className="pl-9 h-11 rounded-xl text-xs font-medium"
                  disabled={isPending}
                />
                <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Email Address
              </label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="fatima@example.com"
                  className="pl-9 h-11 rounded-xl text-xs font-medium"
                  disabled={isPending}
                />
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Mobile Phone (UAE) */}
            <div className="space-y-1.5">
              <label
                htmlFor="phone"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Mobile Phone (UAE)
              </label>
              <div className="relative">
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="050 123 4567"
                  className="pl-9 h-11 rounded-xl text-xs font-medium"
                  disabled={isPending}
                />
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  className="pl-9 h-11 rounded-xl text-xs font-medium"
                  disabled={isPending}
                />
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all pt-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Customer Account'
              )}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="pt-4 border-t border-border text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link
                href={`/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`}
                className="font-bold text-emerald-600 hover:underline"
              >
                Sign In
              </Link>
            </p>
            <div>
              <Link href="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                ← Return to Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
