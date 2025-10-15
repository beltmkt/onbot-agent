export const uploadCSVToN8N = async (
  file: File,
  token: string
): Promise<{ success: boolean; mensagem?: string; dados?: any }> => {
  try {
    if (!file) throw new Error('Nenhum arquivo CSV foi selecionado.');
    if (!token) throw new Error('Token não fornecido.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('token', token);

    const response = await fetch(
      'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook-test/criar_conta_final',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    let result: any = {};
    try {
      result = await response.json();
    } catch {
      result = {};
    }

    return {
      success: result.success ?? true,
      mensagem: result.mensagem ?? 'Upload concluído com sucesso.',
      dados: result.data ?? null,
    };
  } catch (error: any) {
    return {
      success: false,
      mensagem:
        error instanceof Error ? error.message : 'Erro desconhecido durante o envio do CSV.',
    };
  }
};
