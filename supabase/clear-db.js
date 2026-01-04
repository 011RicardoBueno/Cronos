// supabase/clear-db.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.seed (or .env for general use)
dotenv.config({ path: '.env.seed' });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env.seed file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function clearDatabase() {
  console.log('Clearing database...');

  // Order of deletion is crucial due to foreign key constraints (reverse dependency order from seed.js)
  const tablesToClear = [
    'appointments',
    'reviews',
    'sales',
    'waiting_list',
    'expenses',
    'finance_transactions',
    'staff_advances',
    'slots',
    // 'professional_services', // This table has restrictions and needs manual clearing
    'professional_work_hours',
    'products',
    'services',
    'salon_users',
    'salons', // Salons should be cleared before users if users have salon_id as FK
    'users',  // Public users table
  ];

  for (const table of tablesToClear) {
    console.log(`Clearing table: ${table}...`);
    // ... existing clearing logic ...
  }
  
  // Specific warning for professional_services
  console.warn('Skipping table: professional_services. This table has database-side restrictions (e.g., "DELETE requires a WHERE clause") and needs to be cleared manually via the Supabase SQL Editor or client.');



  // Special handling for auth.users if needed, typically done via admin API if user was created programmatically
  // If the seeded users were created via supabase.auth.admin.createUser, you might want to delete them here as well.
  // Example: await supabase.auth.admin.deleteUser(authUserId);

  console.log('Database clearing complete!');
}

clearDatabase().catch((err) => {
  console.error('Failed to clear database:', err);
  process.exit(1);
});
