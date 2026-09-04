import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://daoactilvyzthwhrbrwr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zHIw-YW5Is_uxSTLS0DxOw_ZKXWeT3w';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);