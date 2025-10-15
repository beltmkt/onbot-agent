import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Recebe a resposta COMPLETA do n8n
    const n8nResponse = await req.json();
    
    console.log("📨 Resposta recebida do n8n:", JSON.stringify(n8nResponse, null, 2));

    // Extrai dados para salvar no banco (se necessário)
    const { 
      status, 
      success, 
      message, 
      token_status, 
      companies_count,
      empresa,
      id_empresa,
      token 
    } = n8nResponse;

    // Salva o log da resposta do n8n (opcional)
    if (token) {
      const { error: dbError } = await supabase
        .from("token_validations")
        .insert({
          token,
          is_valid: success === true,
          company_name: empresa || n8nResponse.metadata?.empresa,
          company_id: id_empresa || n8nResponse.metadata?.id_empresa,
          n8n_response: n8nResponse, // Salva a resposta completa do n8n
          validated_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error("Erro ao salvar no banco:", dbError);
        // Não retorna erro, apenas loga - o importante é retornar a resposta do n8n
      }
    }

    // Retorna EXATAMENTE o que o n8n enviou
    return new Response(
      JSON.stringify(n8nResponse),
      {
        status: status || 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Erro na função edge:", error);
    
    // Em caso de erro, retorna uma estrutura compatível com o n8n
    return new Response(
      JSON.stringify({
        success: false,
        status: 500,
        message: "Erro ao processar resposta do n8n",
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});