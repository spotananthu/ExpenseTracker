const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://scoywrgjdprmjrqonyln.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjb3l3cmdqZHBybWpycW9ueWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzU0NzIsImV4cCI6MjA5MjYxMTQ3Mn0.fX7gktD2dMJQ8QpoWYjyPBqcgFvbq5mj-XldQSNhfAs';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
