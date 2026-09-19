import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'kmn_supabase_url';
const STORAGE_KEY_KEY = 'kmn_supabase_key';

export function getSupabaseCredentials() {
  const url = localStorage.getItem(STORAGE_KEY_URL) || import.meta.env.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem(STORAGE_KEY_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url: url.trim(), key: key.trim() };
}

export function saveSupabaseCredentials(url, key) {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
  else localStorage.removeItem(STORAGE_KEY_URL);

  if (key) localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  else localStorage.removeItem(STORAGE_KEY_KEY);
  
  // Reinitialize client
  currentClient = null;
}

let currentClient = null;

export function getSupabaseClient() {
  if (currentClient) return currentClient;

  const { url, key } = getSupabaseCredentials();
  if (url && key) {
    try {
      currentClient = createClient(url, key, {
        auth: { persistSession: true },
      });
      return currentClient;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

export async function testConnection(url, key) {
  try {
    const client = createClient(url.trim(), key.trim());
    const { data, error } = await client.from('machines').select('id').limit(1);
    if (error) {
      // If table doesn't exist yet, it's still a reachable database!
      if (error.code === '42P01') {
        return { success: true, warning: 'Connected, but the "machines" table does not exist yet. Please run the supabase_schema.sql script.' };
      }
      return { success: false, error: error.message };
    }
    return { success: true, count: data?.length || 0 };
  } catch (err) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

// Fetch all machines from Supabase
export async function fetchMachinesCloud() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');

  const { data, error } = await client
    .from('machines')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Insert or update machine in Supabase
export async function upsertMachineCloud(machine) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');

  // If machine has a temporary local ID like 'm-123', do not send UUID error
  const payload = { ...machine };
  if (typeof payload.id === 'string' && payload.id.startsWith('m-')) {
    delete payload.id;
  }

  const { data, error } = await client
    .from('machines')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete machine in Supabase
export async function deleteMachineCloud(id) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');

  // If local ID, no need to call Supabase
  if (typeof id === 'string' && id.startsWith('m-')) return;

  const { error } = await client.from('machines').delete().eq('id', id);
  if (error) throw error;
}

// Fetch all service records from Supabase
export async function fetchServicesCloud() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');

  const { data, error } = await client
    .from('service_records')
    .select('*')
    .order('service_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Upsert service record
export async function upsertServiceCloud(service) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');

  const payload = { ...service };
  if (typeof payload.id === 'string' && payload.id.startsWith('srv-')) {
    delete payload.id;
  }

  const { data, error } = await client
    .from('service_records')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete service record
export async function deleteServiceCloud(id) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');

  if (typeof id === 'string' && id.startsWith('srv-')) return;

  const { error } = await client.from('service_records').delete().eq('id', id);
  if (error) throw error;
}

// Push local seed data to Supabase in bulk
export async function seedSupabaseBulk(machines, services) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');

  // Clean IDs before inserting so Supabase generates UUIDs
  const cleanMachines = machines.map(m => {
    const copy = { ...m };
    delete copy.id;
    return copy;
  });

  const { data: insertedMachines, error: mError } = await client
    .from('machines')
    .insert(cleanMachines)
    .select();

  if (mError) throw new Error(`Machines seed failed: ${mError.message}`);

  const cleanServices = services.map(s => {
    const copy = { ...s };
    delete copy.id;
    return copy;
  });

  const { data: insertedServices, error: sError } = await client
    .from('service_records')
    .insert(cleanServices)
    .select();

  if (sError) throw new Error(`Services seed failed: ${sError.message}`);

  return { machinesCount: insertedMachines?.length || 0, servicesCount: insertedServices?.length || 0 };
}
