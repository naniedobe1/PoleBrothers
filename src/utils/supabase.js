import 'react-native-url-polyfill/auto';
import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL, SUPABASE_ANON_KEY} from '@env';
import Logger from './logger';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Disable session persistence for now (optional)
  },
});

/**
 * Test Supabase connection
 * @returns {Promise<boolean>}
 */
export const testSupabaseConnection = async () => {
  try {
    const {data, error} = await supabase.from('PolesCaptured').select('count');
    if (error) {
      Logger.error('Supabase connection error:', error);
      return false;
    }
    Logger.log('Supabase connected successfully!');
    return true;
  } catch (error) {
    Logger.error('Supabase connection failed:', error);
    return false;
  }
};
