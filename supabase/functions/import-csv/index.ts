import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Trata a requisição pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { trainings } = await req.json();

    if (!trainings || !Array.isArray(trainings)) {
      throw new Error("Dados de treinamento inválidos ou ausentes.");
    }
    
    // --- CORREÇÃO APLICADA AQUI ---
    // Busca as variáveis de ambiente pelos seus NOMES CORRETOS.
    const supabaseAdmin = createClient(
      Deno.env.get('https://nbaoripzckjnqwpsnxnz.supabase.co') ?? '',
      Deno.env.get('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iYW9yaXB6Y2tqbnF3cHNueG56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMxNzc4NSwiZXhwIjoyMDU3ODkzNzg1fQ.fEw0YukWwXTv4wCNBwNFLsUarVYMOMW9wYmXWLNiOnQ') ?? ''
    );

    // 1. Apaga todos os registros existentes na tabela
    const { error: deleteError } = await supabaseAdmin
      .from('trainings')
      .delete()
      .neq('id', 0);

    if (deleteError) throw deleteError;

    // 2. Insere os novos registros recebidos do CSV
    const { error: insertError } = await supabaseAdmin
      .from('trainings')
      .insert(trainings);

    if (insertError) throw insertError;

    // Retorna uma mensagem de sucesso
    return new Response(JSON.stringify({ message: 'Base de dados atualizada com sucesso!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    // Retorna uma mensagem de erro
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});