import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/types/database.types'
import { redirect } from 'next/navigation'

/**
 * Role hierarchy levels
 * 'owner' has access to everything
 * 'admin' has operational management access
 * 'staff' has operational access
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  customer: 0,
  staff: 1,
  admin: 2,
  owner: 3,
}

/**
 * Checks whether a given role meets the required minimum role or is in the allowed list
 */
export function hasRole(currentRole: UserRole, allowedRoles: UserRole[]): boolean {
  if (allowedRoles.includes(currentRole)) return true

  // Check if current role has equal or greater authority than any allowed role
  const currentLevel = ROLE_HIERARCHY[currentRole] ?? 0
  return allowedRoles.some((role) => currentLevel >= (ROLE_HIERARCHY[role] ?? 0))
}

/**
 * Retrieves the currently authenticated user's profile from the database
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (profileError || !profile) {
      return null
    }

    return profile as Profile
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      (error as { digest?: string }).digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw error
    }
    console.error('Error fetching current profile:', error)
    return null
  }
}

/**
 * Server-side guard to enforce role authorization.
 * Redirects to /login if unauthenticated, or throws an authorization error if role is insufficient.
 */
export async function requireRole(
  allowedRoles: UserRole[],
  redirectTo: string = '/login'
): Promise<Profile> {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect(redirectTo)
  }

  const isAuthorized = hasRole(profile.role, allowedRoles)
  if (!isAuthorized) {
    throw new Error(
      `Unauthorized: Role "${profile.role}" lacks permission. Required: [${allowedRoles.join(', ')}]`
    )
  }

  return profile
}
