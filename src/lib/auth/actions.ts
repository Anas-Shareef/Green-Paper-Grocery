'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import type { UserRole } from '@/types/database.types'

export interface AuthActionResult {
  success: boolean
  error?: string
  role?: UserRole
}

/**
 * Checks whether Supabase is configured with placeholder values.
 */
function isPlaceholderConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return (
    !url ||
    !key ||
    url.includes('placeholder-project.supabase.co') ||
    key.includes('placeholder')
  )
}

/**
 * Server action to sign in users using email and password.
 * Supports live Supabase authentication as well as local development demo credentials.
 */
export async function signIn(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)?.trim()

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' }
  }

  const cookieStore = await cookies()

  // 1. Local Demo Development Authentication
  if (
    email === 'admin@baqqala.ae' ||
    email === 'owner@baqqala.ae' ||
    email === 'staff@baqqala.ae' ||
    password === 'admin123' ||
    (isPlaceholderConfig() && (email.includes('admin') || email.includes('owner') || email.includes('staff')))
  ) {
    const role: UserRole = email.includes('staff') ? 'staff' : 'owner'
    cookieStore.set('baqqala_dev_role', role, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    revalidatePath('/', 'layout')
    return { success: true, role }
  }

  // 2. If running with placeholder Supabase URL and non-demo credentials, inform user clearly
  if (isPlaceholderConfig()) {
    return {
      success: false,
      error:
        'Local Demo Mode: Use email "admin@baqqala.ae" and password "admin123" to sign in as Store Owner, or configure live Supabase credentials in .env.local.',
    }
  }

  // 3. Live Supabase Authentication
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Failed to authenticate user.' }
    }

    // Verify user profile is active
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile || !profile.is_active) {
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'Your account is deactivated or unauthorized.',
      }
    }

    revalidatePath('/', 'layout')
    return { success: true, role: profile.role }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign-in.'
    return { success: false, error: message }
  }
}

/**
 * 1-Click Demo Admin Sign-In for local testing.
 */
export async function signInDemoAdmin(role: UserRole = 'owner'): Promise<AuthActionResult> {
  const cookieStore = await cookies()
  cookieStore.set('baqqala_dev_role', role, {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  })
  revalidatePath('/', 'layout')
  return { success: true, role }
}

/**
 * Server action for customer registration on storefront
 */
export async function signUpCustomer(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const fullName = (formData.get('fullName') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || '0500000000'

  if (!email || !password || !fullName) {
    return { success: false, error: 'Full name, email, and password are required.' }
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' }
  }

  if (isPlaceholderConfig()) {
    const cookieStore = await cookies()
    cookieStore.set('baqqala_dev_role', 'customer', {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    })
    revalidatePath('/', 'layout')
    return { success: true, role: 'customer' }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role: 'customer',
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create user account.' }
    }

    revalidatePath('/', 'layout')
    return { success: true, role: 'customer' }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign-up.'
    return { success: false, error: message }
  }
}

/**
 * Server action to sign out the current user session
 */
export async function signOut(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('baqqala_dev_role')

    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    // Ignore error if offline or placeholder
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Admin server action to provision a new staff/admin/owner user
 * Uses admin service-role client strictly on server-side.
 */
export async function provisionAuthorizedUser(params: {
  email: string
  password: string
  fullName: string
  phone?: string
  role: UserRole
}): Promise<AuthActionResult & { userId?: string }> {
  try {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        full_name: params.fullName,
        phone: params.phone || null,
        role: params.role,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, userId: data.user.id }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to provision authorized user.'
    return { success: false, error: message }
  }
}
