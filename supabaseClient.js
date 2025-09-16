// Uzupełnij tymczasowo klucze projektu Supabase
// Bezpieczne operacje (etykiety Apaczka, sekrety) zawsze wykonuj w Edge Functions.
// PUBLIC-ANON-KEY jest jawny na froncie i to jest OK (RLS musi chronić dane).
const SUPABASE_URL = window.SUPABASE_URL || "https://iqwpkssdebadfeisnzrh.supabase.co";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxd3Brc3NkZWJhZGZlaXNuenJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTU5MDIsImV4cCI6MjA3MzU5MTkwMn0.nlyDBinTrIpQDIKqc7gA2Yov0Sc7umB5jALHparkxfM";

window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
