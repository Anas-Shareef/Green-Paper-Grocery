'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types/database.types'

export interface AuthActionResult {
  success: boolean
  error?: string
}

/**
 * Server action to sign in staff/admin/owner using email and password
 */
export async function signIn(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' }
  }

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
      // Inactive or missing profile: sign out immediately
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'Your account is deactivated or unauthorized. Contact store owner.',
      }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign-in.'
    return { success: false, error: message }
  }
}

/**
 * Server action to sign out the current user session
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
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
