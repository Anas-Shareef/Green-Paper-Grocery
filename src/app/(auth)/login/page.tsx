'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, signInDemoAdmin } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Store,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

export default function LoginPage() {
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
      const result = await signIn(formData)
      if (!result.success) {
        setErrorMsg(result.error ?? 'Authentication failed')
      } else {
        const target =
          result.role === 'customer'
            ? nextUrl && !nextUrl.startsWith('/admin')
              ? nextUrl
              : '/account'
            : nextUrl && nextUrl.startsWith('/admin')
            ? nextUrl
            : '/admin/dashboard'
        window.location.href = target
      }
    })
  }

  async function handleQuickDemoAdmin() {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await signInDemoAdmin('owner')
      if (result.success) {
        window.location.href = '/admin/dashboard'
      } else {
        setErrorMsg(result.error ?? 'Demo sign-in failed')
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-600/30">
              <Store className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Welcome to Baqqala
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Zone 19 Grocery Platform • Sign in to your account
          </p>
        </div>

        {/* 1-Click Demo Admin Access Banner */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-3 text-xs shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>Admin Dashboard Access</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-bold">
              Zone 19 Owner
            </span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            Click below to instantly access the <strong>Admin Dashboard</strong> (orders, catalog, promotions, and operations).
          </p>
          <Button
            type="button"
            disabled={isPending}
            onClick={handleQuickDemoAdmin}
            className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-xs"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Enter Admin Dashboard (1-Click)
          </Button>
          <div className="text-[10px] text-muted-foreground/80 flex items-center justify-between pt-1 border-t border-emerald-200/40 font-mono">
            <span>Login: admin@baqqala.ae</span>
            <span>Pass: admin123</span>
          </div>
        </div>

        {/* Standard Login Card */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 flex items-start gap-2.5 text-destructive text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="leading-snug">{errorMsg}</p>
              </div>
            )}

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
                  defaultValue="admin@baqqala.ae"
                  placeholder="your.email@example.com"
                  className="pl-9 h-11 rounded-xl text-xs font-medium"
                  disabled={isPending}
                />
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  defaultValue="admin123"
                  placeholder="••••••••••••"
                  className="pl-9 h-11 rounded-xl text-xs font-medium"
                  disabled={isPending}
                />
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-xl bg-foreground hover:bg-foreground/90 text-background font-bold text-xs shadow-xs transition-all gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>

          {/* Registration Link */}
          <div className="pt-3 border-t border-border text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account yet?{' '}
              <Link
                href={`/register${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`}
                className="font-bold text-emerald-600 hover:underline"
              >
                Create an Account
              </Link>
            </p>
            <div>
              <Link
                href="/"
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                ← Return to Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
