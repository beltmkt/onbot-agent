import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface N8NCallback {
  token?: string;
  success: boolean;
  status: string;
  message?: string;
  error?: string;
  empresa?: string;
  id_empresa?: string;
  equipes?: any[];
  metadata?: any;
  timestamp?: string;
  operation?: 'validation' | 'processing' | 'upload';
  details?: any;
}

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

    const callback: N8NCallback = await req.json();
    
    console.log("📨 N8N Callback recebido:", JSON.stringify(callback, null, 2));

    const { error: logError } = await supabase
      .from("n8n_callbacks")
      .insert({
        token: callback.token,
        success: callback.success,
        status: callback.status,
        message: callback.message,
        error: callback.error,
        empresa: callback.empresa || callback.metadata?.empresa,
        operation: callback.operation || 'validation',
        payload: callback,
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error("❌ Erro ao salvar callback:", logError);
    } else {
      console.log("✅ Callback salvo com sucesso");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Callback recebido e processado",
        received_at: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("❌ Erro ao processar callback:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Erro ao processar callback do N8N",
        error: error instanceof Error ? error.message : "Erro desconhecido",
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