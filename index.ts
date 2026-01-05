import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper: Normalize Phone to deterministic digits-only format
// Defaults to Brazil (55) if country code is missing (10-11 digits)
function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')

  // Check for standard Brazil lengths (Landline: 10, Mobile: 11)
  // If matches, prepend 55. If already has country code (12-13+), keep as is.
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }

  return digits
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize Supabase Client with User Context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 2. Authenticate User
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Parse and Validate Input
    const { salon_id, name, phone, email } = await req.json()

    if (!salon_id || !name || !phone) {
      return new Response(JSON.stringify({ error: 'Missing required fields', code: 'BAD_REQUEST' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Validate Salon Access (Using User Client)
    // RLS should allow access if user is owner or staff
    const { data: salonAccess } = await supabaseClient
      .from('salons')
      .select('id')
      .eq('id', salon_id)
      .maybeSingle()

    // Fallback: Check user_salons if salons table is restricted
    let hasAccess = !!salonAccess
    if (!hasAccess) {
      const { data: membership } = await supabaseClient
        .from('user_salons')
        .select('salon_id')
        .eq('user_id', user.id)
        .eq('salon_id', salon_id)
        .maybeSingle()

      if (membership) hasAccess = true
    }

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Forbidden: No access to this salon', code: 'FORBIDDEN' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Normalize Phone Number
    const normalizedPhone = normalizePhone(phone)
    if (normalizedPhone.length < 8) {
      return new Response(JSON.stringify({ error: 'Invalid phone number', code: 'INVALID_PHONE' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 6. Enforce Uniqueness (Using User Client)
    const { data: existingCustomer } = await supabaseClient
      .from('customers')
      .select('id')
      .eq('salon_id', salon_id)
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (existingCustomer) {
      return new Response(JSON.stringify({ error: 'Customer already exists', code: 'DUPLICATE_CUSTOMER' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 7. Enforce Subscription Limits (Using Service Role)
    // We use admin here to ensure we get the authoritative plan and count
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_type')
      .eq('salon_id', salon_id)
      .maybeSingle()

    const planType = subscription?.plan_type || 'free'

    if (planType === 'free') {
      const { count, error: countError } = await supabaseAdmin
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('salon_id', salon_id)

      if (countError) throw countError

      if (count !== null && count >= 50) {
        return new Response(JSON.stringify({
          error: 'Free plan limit reached',
          code: 'PLAN_LIMIT_REACHED',
          details: { plan: 'free', limit: 50, current: count }
        }), {
          status: 403, // Forbidden (Business Rule)
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 8. Create Customer (Using User Client)
    const insertPayload: any = { salon_id, name, phone: normalizedPhone }
    if (email) insertPayload.email = email

    const { data: newCustomer, error: insertError } = await supabaseClient
      .from('customers')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) throw insertError

    return new Response(JSON.stringify(newCustomer), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, code: 'INTERNAL_ERROR' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})