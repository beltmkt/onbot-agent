// =============================================
// 🚀 INTERFACE MODERNA - USER IMPORT DASHBOARD
// =============================================

import React, { useState, useCallback } from 'react';
import { 
  Upload, Users, Building2, CheckCircle2, 
  AlertCircle, Play, Download, Settings,
  Sparkles, Shield, Zap
} from 'lucide-react';

// 🎯 Componente Principal
const UserImportDashboard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // 🎯 Estados para dados
  const [csvData, setCsvData] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [importSettings, setImportSettings] = useState({
    autoGenerateUsernames: true,
    skipDuplicates: true,
    sendWelcomeEmail: false,
    validatePhones: true
  });

  // 🎯 Processar upload do CSV
  const handleFileUpload = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      // Simulação do processamento
      const users = parseCSV(content);
      setCsvData(users);
      setCurrentStep(2);
    };
    reader.readAsText(file);
  }, []);

  // 🎯 Iniciar importação
  const startImport = async () => {
    setProcessing(true);
    
    try {
      // Simulação da API call
      const importResults = await processUsersImport({
        users: csvData,
        company: selectedCompany,
        settings: importSettings
      });
      
      setResults(importResults);
      setCurrentStep(3);
    } catch (error) {
      console.error('Erro na importação:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* 🎯 Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">User Import</h1>
                <p className="text-sm text-slate-600">Importação inteligente de usuários</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:text-slate-900 transition-colors">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Exportar Template</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 🎯 Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-slate-300 text-slate-400'
                } transition-all duration-300`}>
                  {currentStep > step ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{step}</span>
                  )}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-0.5 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-slate-300'
                  } transition-colors duration-300`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-center space-x-24 mt-4">
            <span className={`text-sm font-medium ${
              currentStep >= 1 ? 'text-blue-600' : 'text-slate-500'
            }`}>Upload do CSV</span>
            <span className={`text-sm font-medium ${
              currentStep >= 2 ? 'text-blue-600' : 'text-slate-500'
            }`}>Configuração</span>
            <span className={`text-sm font-medium ${
              currentStep >= 3 ? 'text-blue-600' : 'text-slate-500'
            }`}>Resultado</span>
          </div>
        </div>

        {/* 🎯 Step 1 - Upload */}
        {currentStep === 1 && (
          <UploadStep 
            onFileUpload={handleFileUpload}
            dragActive={dragActive}
            setDragActive={setDragActive}
          />
        )}

        {/* 🎯 Step 2 - Configuração */}
        {currentStep === 2 && (
          <ConfigurationStep
            csvData={csvData}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
            importSettings={importSettings}
            setImportSettings={setImportSettings}
            onStartImport={startImport}
            processing={processing}
          />
        )}

        {/* 🎯 Step 3 - Resultados */}
        {currentStep === 3 && (
          <ResultsStep results={results} onReset={() => setCurrentStep(1)} />
        )}
      </main>

      {/* 🎯 Features Highlight */}
      <div className="border-t border-slate-200 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-green-600" />}
              title="Anti-Duplicação"
              description="Sistema inteligente que previne usuários duplicados automaticamente"
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-blue-600" />}
              title="Processamento Rápido"
              description="Importe centenas de usuários em segundos com nossa engine otimizada"
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8 text-purple-600" />}
              title="Detecção Inteligente"
              description="Reconhece automaticamente empresas e gera usernames únicos"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// 🎯 Componente de Upload
const UploadStep = ({ onFileUpload, dragActive, setDragActive }) => {
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="p-3 bg-blue-50 rounded-full w-16 h-16 mx-auto mb-6">
          <Upload className="h-10 w-10 text-blue-600 mx-auto" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Importar Usuários via CSV
        </h2>
        
        <p className="text-slate-600 mb-8">
          Faça upload do arquivo CSV contendo os dados dos usuários. 
          Suportamos formatação automática de campos e detecção inteligente.
        </p>

        <div
          className={`border-2 border-dashed rounded-xl p-12 transition-all duration-300 ${
            dragActive 
              ? 'border-blue-400 bg-blue-50/50' 
              : 'border-slate-300 hover:border-blue-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700 mb-2">
            Arraste seu arquivo CSV aqui
          </p>
          <p className="text-slate-500 mb-6">ou</p>
          
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files[0] && onFileUpload(e.target.files[0])}
            />
            <span className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Selecionar Arquivo
            </span>
          </label>
          
          <p className="text-sm text-slate-500 mt-4">
            Formatos suportados: CSV • Máx. 10MB
          </p>
        </div>

        {/* 📋 Template Info */}
        <div className="mt-8 p-6 bg-slate-50 rounded-xl text-left">
          <h3 className="font-semibold text-slate-900 mb-3">Formato do CSV:</h3>
          <div className="text-sm text-slate-600 space-y-1">
            <p><strong>Colunas obrigatórias:</strong> nome, email, empresa_ou_equipe</p>
            <p><strong>Colunas opcionais:</strong> telefone, é master</p>
            <p><strong>Encoding:</strong> UTF-8 recomendado</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🎯 Componente de Configuração
const ConfigurationStep = ({
  csvData,
  selectedCompany,
  setSelectedCompany,
  importSettings,
  setImportSettings,
  onStartImport,
  processing
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 📊 Preview */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Prévia dos Dados ({csvData?.length || 0} usuários)
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 font-medium text-slate-700">Nome</th>
                  <th className="text-left py-3 font-medium text-slate-700">Email</th>
                  <th className="text-left py-3 font-medium text-slate-700">Empresa</th>
                  <th className="text-left py-3 font-medium text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {csvData?.slice(0, 5).map((user, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="py-3 text-slate-900">{user.nome}</td>
                    <td className="py-3 text-slate-600">{user.email}</td>
                    <td className="py-3 text-slate-600">{user.empresa_ou_equipe}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Válido
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {csvData && csvData.length > 5 && (
            <p className="text-sm text-slate-500 mt-4">
              + {csvData.length - 5} usuários adicionais...
            </p>
          )}
        </div>
      </div>

      {/* ⚙️ Configurações */}
      <div className="space-y-6">
        {/* Seleção de Empresa */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            <Building2 className="h-5 w-5 inline mr-2 text-blue-600" />
            Empresa Destino
          </h3>
          
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione uma empresa</option>
            <option value="company1">Thais Imobiliária - Equipe GUARA</option>
            <option value="company2">Thais Imobiliária - Equipe ASA SUL</option>
            <option value="company3">Thais Imobiliária - AGÊNCIA DIGITAL</option>
          </select>
        </div>

        {/* Configurações */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            <Settings className="h-5 w-5 inline mr-2 text-slate-600" />
            Configurações de Importação
          </h3>
          
          <div className="space-y-4">
            {Object.entries(importSettings).map(([key, value]) => (
              <label key={key} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setImportSettings(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  {getSettingLabel(key)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Ação */}
        <button
          onClick={onStartImport}
          disabled={processing || !selectedCompany}
          className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processando...</span>
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              <span>Iniciar Importação</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// 🎯 Componente de Resultados
const ResultsStep = ({ results, onReset }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="p-3 bg-green-50 rounded-full w-16 h-16 mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Importação Concluída!
        </h2>
        
        <p className="text-slate-600 mb-8">
          A importação dos usuários foi realizada com sucesso.
        </p>

        {/* 📊 Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            value={results?.total || 45}
            label="Total"
            color="blue"
          />
          <StatCard
            value={results?.success || 42}
            label="Sucesso"
            color="green"
          />
          <StatCard
            value={results?.duplicates || 2}
            label="Duplicatas"
            color="amber"
          />
          <StatCard
            value={results?.errors || 1}
            label="Erros"
            color="red"
          />
        </div>

        {/* ⚠️ Alertas */}
        {(results?.duplicates > 0 || results?.errors > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-left mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">
                  Atenção necessária
                </h4>
                <ul className="text-amber-800 text-sm space-y-1">
                  {results.duplicates > 0 && (
                    <li>• {results.duplicates} usuários duplicados foram ignorados</li>
                  )}
                  {results.errors > 0 && (
                    <li>• {results.errors} usuários com erro não foram processados</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onReset}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Users className="h-4 w-4" />
          <span>Nova Importação</span>
        </button>
      </div>
    </div>
  );
};

// 🎯 Componentes Auxiliares
const FeatureCard = ({ icon, title, description }) => (
  <div className="text-center p-6">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 text-sm">{description}</p>
  </div>
);

const StatCard = ({ value, label, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700'
  };

  return (
    <div className={`p-4 rounded-xl text-center ${colorClasses[color]}`}>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium">{label}</div>
    </div>
  );
};

// 🎯 Utilitários
const getSettingLabel = (key) => {
  const labels = {
    autoGenerateUsernames: 'Gerar usernames automaticamente',
    skipDuplicates: 'Ignorar usuários duplicados',
    sendWelcomeEmail: 'Enviar email de boas-vindas',
    validatePhones: 'Validar números de telefone'
  };
  return labels[key] || key;
};

// 🎯 Funções de simulação
const parseCSV = (content) => {
  // Simulação do parser CSV
  return [
    { nome: 'João Silva', email: 'joao@empresa.com', empresa_ou_equipe: 'Equipe GUARA' },
    { nome: 'Maria Santos', email: 'maria@empresa.com', empresa_ou_equipe: 'Equipe ASA SUL' },
    // ... mais dados simulados
  ];
};

const processUsersImport = async ({ users, company, settings }) => {
  // Simulação da API
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    total: users.length,
    success: users.length - 3,
    duplicates: 2,
    errors: 1
  };
};

export default UserImportDashboard;