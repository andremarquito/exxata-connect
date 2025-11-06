import { supabase } from '@/lib/supabase';

// Template padrão de documentos de onboarding
export const DEFAULT_ONBOARDING_DOCUMENTS = [
  // Fase A - Pré-Contratual
  {
    phase: 'A',
    phase_name: 'Fase Pré-Contratual',
    code: 'A.1',
    description: 'Documentação de Licitação',
    motivation: 'Obter as informações que irão estabelecer os limites do Contrato e respaldar quaisquer solicitações, alterações e demais tratativa que se fizerem necessárias.'
  },
  {
    phase: 'A',
    phase_name: 'Fase Pré-Contratual',
    code: 'A.2',
    description: 'Planilha Geral de Preços e Proposta Comercial',
    motivation: ''
  },
  {
    phase: 'A',
    phase_name: 'Fase Pré-Contratual',
    code: 'A.3',
    description: 'Proposta Técnica e Anexos',
    motivation: ''
  },
  {
    phase: 'A',
    phase_name: 'Fase Pré-Contratual',
    code: 'A.4',
    description: 'Composição de BDI',
    motivation: ''
  },
  {
    phase: 'A',
    phase_name: 'Fase Pré-Contratual',
    code: 'A.5',
    description: 'Esclarecimentos de Dúvidas',
    motivation: ''
  },
  // Fase B - Formalização Contratual
  {
    phase: 'B',
    phase_name: 'Fase de Formalização Contratual',
    code: 'B.1',
    description: 'Contrato',
    motivation: 'Conhecer as cláusulas contratuais, limites e condições estabelecidas pelos Anexos do Contrato.'
  },
  {
    phase: 'B',
    phase_name: 'Fase de Formalização Contratual',
    code: 'B.2',
    description: 'Anexos do Contrato',
    motivation: ''
  },
  {
    phase: 'B',
    phase_name: 'Fase de Formalização Contratual',
    code: 'B.3',
    description: 'Termos Aditivos',
    motivation: ''
  },
  // Fase C - Execução
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.1',
    description: 'Autorização de Início de Serviços',
    motivation: ''
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.2',
    description: 'Cronograma de Implantação Consolidado',
    motivation: ''
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.3',
    description: 'Boletins de Medição (BM) e Memórias de Cálculo',
    motivation: 'Identificar quantidades/serviços já medidos e acompanhar o faturamento do Contrato.'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.4',
    description: 'Relatórios Diários de Obra (RDO)',
    motivation: 'Avaliar os registros para documentar e embasar a elaboração de documentos.'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.5',
    description: 'Relatórios de Progresso',
    motivation: 'Consultar as principais informações de desempenho e verificar a aderência do Contrato em relação ao cronograma e locação de recursos.'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.6',
    description: 'Projeto Básico',
    motivation: 'Identificar as especificações iniciais entregues pela CONTRATANTE'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.7',
    description: 'Controle de Entrega de Projetos Executivos',
    motivation: 'Conferir as datas e documentos entregues pela empresa.'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.8',
    description: 'Controle de Comentários da Contratante e Aprovações dos Projetos Executivos',
    motivation: 'Identificar as datas de comentários e atendimento aos comentários.'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.9',
    description: 'Atas de Reunião',
    motivation: 'Obter as informações trocadas entre as partes no andamento do Contrato para embasar tratativas e eventuais reivindicações.'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.10',
    description: 'Histogramas Real de Mão de Obra e Equipamentos',
    motivation: 'Manter-se atualizado quanto a quantificação de Mão de Obra e Equipamentos alocados. Identificar possíveis desequilíbrios.'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.11',
    description: 'Correspondências Trocadas entre as Partes',
    motivation: 'Obter as informações trocadas entre as partes no andamento do Contrato para embasar tratativas e eventuais reivindicações. Identificar oportunidades e riscos no decorrer do Contrato.'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.12',
    description: 'Notificações',
    motivation: ''
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.13',
    description: 'E-mails Trocados entre as Partes',
    motivation: 'Acompanhamento de tratativas feitas entre as partes para identificar riscos e entender o cenário de oportunidades no Contrato.'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.14',
    description: 'Lista de Pendências',
    motivation: 'Obter informações acerca das pendências que possam gerar impactos na execução do objeto.'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.15',
    description: 'Plano de Execução da Implantação do EMPREENDIMENTO',
    motivation: 'Avaliar o planejamento e informações apresentadas após assinatura do Contrato.'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.16',
    description: 'Licenças de Responsabilidade da Contratante',
    motivation: 'Acompanhar o atendimento às obrigações da Contratante.'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.17',
    description: 'Cronograma de Desembolso Financeiro e Cronograma Executivo Atualizado',
    motivation: 'Consultar as principais Informações de desempenho e verificar a aderência do Contrato em relação ao cronograma e locação de recursos.'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.18',
    description: 'Controle de Datas de Liberação de Áreas',
    motivation: 'Acompanhar o atendimento às obrigações da Contratante.'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.19',
    description: 'Controle de Datas de Fornecimento de Equipamentos',
    motivation: 'Conferir as datas de fornecimento e entregas pelo Consórcio'
  },
  {
    phase: 'C',
    phase_name: 'Fase de Execução',
    code: 'C.20',
    description: 'Ordem de Variação',
    motivation: 'Identificar alterações no Contrato'
  }
];

export const onboardingService = {
  // Buscar todos os documentos de um projeto
  async getProjectDocuments(projectId) {
    const { data, error } = await supabase
      .from('project_onboarding_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('code', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Inicializar documentos padrão para um projeto
  async initializeDefaultDocuments(projectId, userId) {
    const documents = DEFAULT_ONBOARDING_DOCUMENTS.map(doc => ({
      ...doc,
      project_id: projectId,
      is_complete: false,
      observation: '',
      created_by: userId,
      updated_by: userId
    }));

    const { data, error } = await supabase
      .from('project_onboarding_documents')
      .insert(documents)
      .select();

    if (error) throw error;
    return data;
  },

  // Adicionar novo documento
  async addDocument(projectId, documentData, userId) {
    const { data, error } = await supabase
      .from('project_onboarding_documents')
      .insert({
        project_id: projectId,
        ...documentData,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar documento
  async updateDocument(documentId, updates, userId) {
    const { data, error } = await supabase
      .from('project_onboarding_documents')
      .update({
        ...updates,
        updated_by: userId
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar documento
  async deleteDocument(documentId) {
    const { error } = await supabase
      .from('project_onboarding_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  },

  // Toggle status de completude
  async toggleComplete(documentId, isComplete, userId) {
    return this.updateDocument(documentId, { is_complete: isComplete }, userId);
  }
};
