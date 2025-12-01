/**
 * Authentication Helper Functions
 * 
 * This module provides helper functions for authentication using Supabase Auth
 * with a dual-login system that supports both email and member ID login.
 * 
 * System Design:
 * - Member IDs are stored as technical emails: <memberId>@members.tikredi.ht
 * - Real emails are stored in user_metadata.true_email
 * - Member IDs are stored in user_metadata.member_id
 */

import { supabase } from './supabase';

/**
 * Technical email domain for member IDs
 */
const MEMBER_ID_DOMAIN = '@members.tikredi.ht';

/**
 * Converts a member ID to a technical email format
 * @param memberId - The numeric member ID (e.g., "250000001")
 * @returns Technical email (e.g., "250000001@members.tikredi.ht")
 */
export function memberIdToTechnicalEmail(memberId: string): string {
  // Remove any hyphens and trim whitespace
  const cleanMemberId = memberId.replace(/-/g, '').trim();
  return `${cleanMemberId}${MEMBER_ID_DOMAIN}`;
}

/**
 * Checks if a string is a valid email format
 * @param str - String to check
 * @returns true if the string contains @ and looks like an email
 */
export function isEmail(str: string): boolean {
  return str.includes('@') && str.length > 3;
}

/**
 * Validates if a string is a numeric member ID
 * @param str - String to validate
 * @returns true if the string is numeric (after removing hyphens)
 */
export function isMemberId(str: string): boolean {
  const clean = str.replace(/-/g, '').trim();
  return /^\d+$/.test(clean);
}

/**
 * Normalizes an identifier (email or member ID) to an email format for Supabase Auth
 * @param identifier - Either an email or member ID
 * @returns Email address (either the original email or technical email)
 */
export function normalizeIdentifier(identifier: string): string {
  const trimmed = identifier.trim();
  
  if (isEmail(trimmed)) {
    // It's already an email, return as-is
    return trimmed;
  }
  
  // It's a member ID, convert to technical email
  if (isMemberId(trimmed)) {
    return memberIdToTechnicalEmail(trimmed);
  }
  
  // Invalid format
  throw new Error('Identifiant invalide. Utilisez un email ou un numéro de membre.');
}

/**
 * Login function that supports both email and member ID
 * @param identifier - Email address or member ID
 * @param password - User password
 * @returns Auth response from Supabase
 */
export async function login(identifier: string, password: string) {
  try {
    const email = normalizeIdentifier(identifier);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Provide user-friendly error messages
      if (error.message?.includes('Invalid login credentials') || 
          error.message?.includes('Invalid password') ||
          error.message?.includes('User not found')) {
        throw new Error('Identifiant ou mot de passe incorrect');
      }
      throw error;
    }

    return { data, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion';
    return { data: null, error: new Error(errorMessage) };
  }
}

/**
 * Signup function that creates a user with technical email and stores real email in metadata
 * @param memberId - Numeric member ID (e.g., "250000001")
 * @param realEmail - User's real email address
 * @param password - User password
 * @param fullName - Optional full name
 * @returns Auth response from Supabase
 */
export async function signUp(
  memberId: string,
  realEmail: string,
  password: string,
  fullName?: string
) {
  try {
    // Validate member ID
    const cleanMemberId = memberId.replace(/-/g, '').trim();
    if (!isMemberId(cleanMemberId)) {
      throw new Error('Le numéro de membre doit être un numéro valide (ex: 250000001)');
    }

    // Validate email
    if (!isEmail(realEmail)) {
      throw new Error('L\'adresse email n\'est pas valide');
    }

    // Validate password
    if (password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }

    // Convert member ID to technical email
    const technicalEmail = memberIdToTechnicalEmail(cleanMemberId);

    // Create user with technical email
    const { data, error } = await supabase.auth.signUp({
      email: technicalEmail,
      password,
      options: {
        data: {
          true_email: realEmail,
          member_id: cleanMemberId,
          full_name: fullName || '',
        },
      },
    });

    if (error) {
      if (error.message?.includes('already registered') || 
          error.message?.includes('already exists') ||
          error.message?.includes('User already registered')) {
        throw new Error('Ce numéro de membre ou cet email est déjà enregistré');
      }
      throw error;
    }

    return { data, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription';
    return { data: null, error: new Error(errorMessage) };
  }
}

/**
 * Gets the real email from user metadata
 * @param user - Supabase user object
 * @returns Real email or null
 */
export function getRealEmail(user: any): string | null {
  return user?.user_metadata?.true_email || null;
}

/**
 * Gets the member ID from user metadata
 * @param user - Supabase user object
 * @returns Member ID or null
 */
export function getMemberId(user: any): string | null {
  return user?.user_metadata?.member_id || null;
}

