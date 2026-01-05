import { supabase } from '../lib/supabase';
import { auditService } from './auditService';

export interface TokenValidationResult {
  success: boolean;
  error?: string;
  data?: {
    isValid: boolean;
    companyId?: string;
    companyName?: string;
  };
}

/**
 * Valida um token de empresa
 * @param token - Token a ser validado
 * @param userEmail - Email do usuário que está validando o token
 * @returns Promise<TokenValidationResult>
 */
export const validateCompanyToken = async (token: string, userEmail: string): Promise<TokenValidationResult> => {
  const tokenLast4 = token.slice(-4);
  try {
    // Validação básica do formato do token (mantida para feedback imediato)
    if (!token || typeof token !== 'string') {
      await auditService.createLog({ userEmail, actionType: 'token_validation', status: 'error', errorMessage: 'Token é obrigatório', metadata: { token_last4: tokenLast4 } });
      return {
        success: false,
        error: 'Token é obrigatório'
      };
    }

    const trimmedToken = token.trim();

    if (trimmedToken.length < 5) {
      await auditService.createLog({ userEmail, actionType: 'token_validation', status: 'error', errorMessage: 'Token muito curto', metadata: { token_last4: tokenLast4 } });
      return {
        success: false,
        error: 'Token muito curto'
      };
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(trimmedToken)) {
      await auditService.createLog({ userEmail, actionType: 'token_validation', status: 'error', errorMessage: 'Token contém caracteres inválidos', metadata: { token_last4: tokenLast4 } });
      return {
        success: false,
        error: 'Token contém caracteres inválidos'
      };
    }

        // Consulta no Supabase para validar o token
        const { data, error } = await supabase
          .from('token_validations')
          .select('id, company_id, company_name, is_valid, validated_at')
          .eq('token', trimmedToken)
          .eq('is_valid', true) // Usa o campo correto para 'ativo'
          .maybeSingle();
    
        if (error) {
          console.error('Database error validating token:', error);
          await auditService.createLog({ userEmail, actionType: 'token_validation', status: 'error', errorMessage: 'Erro interno do servidor', metadata: { token_last4: tokenLast4 } });
          return {
            success: false,
            error: 'Erro interno do servidor'
          };
        }
    
        if (!data) {
          // Token não existe, considerar como 'Novo/Válido' para prosseguir com a criação/upsert
          await auditService.createLog({ userEmail, actionType: 'token_validation', status: 'info', errorMessage: 'Token não encontrado, considerado novo para criação', metadata: { token_last4: tokenLast4 } });
          return {
            success: true,
            data: {
              isValid: true, // Temporariamente válido para permitir criação
              companyId: undefined, // Sem companyId ainda
              companyName: undefined // Sem companyName ainda
            }
          };
        }
    
        // Verifica se o token é válido
        if (!data.is_valid) { // Se is_valid for false, o token é considerado inválido
          await auditService.createLog({ userEmail, actionType: 'token_validation', status: 'error', errorMessage: 'Token inválido', metadata: { token_last4: tokenLast4 } });
          return {
            success: false,
            error: 'Token inválido'
          };
        }
    
    
        await auditService.createLog({ userEmail, actionType: 'token_validation', status: 'success', metadata: { token_last4: tokenLast4, company_id: data.company_id, company_name: data.company_name } });
        return {
          success: true,
          data: {
            isValid: true,
            companyId: data.company_id,
            companyName: data.company_name
          }
        };
    
      } catch (error) {
        console.error('Error validating company token:', error);
        await auditService.createLog({ userEmail, actionType: 'token_validation', status: 'error', errorMessage: 'Erro interno do servidor', metadata: { token_last4: tokenLast4 } });
        return {
          success: false,
          error: 'Erro interno do servidor'
        };
      }
    };


/**
 * Gera um token temporário para testes (apenas desenvolvimento)
 * @returns string
 */
export const generateTestToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Armazena o token validado no localStorage
 * @param token - Token validado
 * @param companyData - Dados da empresa
 */
export const storeValidatedToken = (token: string, companyData: { companyId: string; companyName: string }): void => {
  try {
    localStorage.setItem('company_token', token);
    localStorage.setItem('company_data', JSON.stringify(companyData));
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

/**
 * Recupera o token armazenado do localStorage
 * @returns Token armazenado ou null
 */
export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem('company_token');
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

/**
 * Recupera os dados da empresa armazenados
 * @returns Dados da empresa ou null
 */
export const getStoredCompanyData = (): { companyId: string; companyName: string } | null => {
  try {
    const data = localStorage.getItem('company_data');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving company data:', error);
    return null;
  }
};

/**
 * Remove o token armazenado
 */
export const clearStoredToken = (): void => {
  try {
    localStorage.removeItem('company_token');
    localStorage.removeItem('company_data');
  } catch (error) {
    console.error('Error clearing token:', error);
  }
};