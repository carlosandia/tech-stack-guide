// AIDEV-NOTE: Reexporta o cliente singleton de src/lib/supabase.ts
// para evitar múltiplas instâncias do GoTrueClient no mesmo browser context.
// O cliente principal com timeout customizado está em src/lib/supabase.ts.
export { supabase } from '@/lib/supabase'
