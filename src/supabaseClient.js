// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nbaoripzckjnqwpsnxnz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iYW9yaXB6Y2tqbnF3cHNueG56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMxNzc4NSwiZXhwIjoyMDU3ODkzNzg1fQ.fEw0YukWwXTv4wCNBwNFLsUarVYMOMW9wYmXWLNiOnQ';

export const supabase = createClient(supabaseUrl, supabaseKey);