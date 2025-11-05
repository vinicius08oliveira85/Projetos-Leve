import React from 'react';

export type User = {
  name: string;
  role: 'admin' | 'viewer';
};

export type MenuItem = {
  id: string;
  page: string;
  title: string;
  description: string;
  icon: React.ReactElement;
};

export type Esperas = {
  cirurgia: boolean;
  exame: boolean;
  parecer: boolean;
  desospitalizacao: boolean;
};

export type HistoryEntry = {
  data: string;
  responsavel: string;
  diario: string;
};

export type LeitoType = 'CTI' | 'CTI PED' | 'CTI NEO' | 'USI' | 'USI PED' | 'UI' | 'UI PSQ' | 'EL';

export type LeitoRecord = {
  id: number;
  date: string; // YYYY-MM-DD
  leitoDoDia: LeitoType | 'Alta';
};

export type EsperaCirurgiaDetalhes = {
  dataInicio?: string;
  envioPedido?: string;
  aguardaOPME?: 'Sim' | 'Não';
  opmeSolicitado?: string;
  opmeRecebido?: string;
  dataAgendamento?: string;
  dataRealizacao?: string;
  dataFim?: string;
};

export type EsperaExameDetalhes = {
  dataInicio?: string;
  envioPedido?: string;
  esperaAgendamento?: 'Sim' | 'Não';
  laudo?: string;
  laudoLiberado?: string;
  dataFim?: string;
};

export type EsperaParecerDetalhes = {
    especialidade?: string;
    dataSolicitacao?: string;
    dataResposta?: string;
};

export type EsperaDesospitalizacaoDetalhes = {
  aguardaAntibioticoTerapia?: 'Sim' | 'Não';
  aguardaCurativoDomiciliar?: 'Sim' | 'Não';
  aguardaOxigenioTerapia?: 'Sim' | 'Não';
  aguardaHomeCare?: 'Sim' | 'Não';
  aguardaPedido?: 'Sim' | 'Não';
};

export type GuiaStatus = 
  | 'Guia emitida / liberada'
  | 'Guia negada'
  | 'Guia cancelada'
  | 'Guia sob auditoria'
  | 'Guia parcialmente liberada'
  | 'Guia aguardando autorização'
  | 'Guia pedido/aguard confirmação'
  | 'Guia com setor de OPME';


export type Patient = {
  id: number;
  data: string;
  guia: string;
  tipoInternacao: 'Urgência' | 'Eletivo';
  natureza: 'PSIQUIÁTRICA' | 'OBSTÉTRICA' | 'CLÍNICA' | 'CIRÚRGICA' | 'PEDIÁTRICA' | 'ONCOLOGIA';
  dataIH: string;
  nome: string;
  cpf: string;
  idade: number;
  diagnosticos: string;
  leitoOntem: LeitoType | 'Alta';
  leitoHoje: LeitoType | 'Alta';
  leitoAuditado: LeitoType | 'Alta' | '';
  hospitalDestino: string;
  permanencia: string;
  relatorioMedico: string;
  criticidade: 'Revisão Padrão' | 'Diário 24h' | '48h' | '72h';
  programa: 'Outros' | 'Oncologia' | 'Confirma Suporte' | 'Home Care' | 'Gestação Segura';
  altaPrev: string;
  altaReplan: string;
  altaFim: string;
  altaAutorizada?: string;
  motivoAlta?: string;
  status: GuiaStatus;
  esperas: Esperas;
  historico: HistoryEntry[];
  leitoHistory?: LeitoRecord[];
  cidIH: string;
  hospitalOrigem: string;
  leitoAdmissao: LeitoType;
  evento: 'Agudo' | 'Crônico agudizado';
  reinternacao: 'Sim' | 'Não';
  liminar: 'Sim' | 'Não';
  fraude: 'Sim' | 'Não';
  enviadoRetificacao: 'Sim' | 'Não';
  tipoReinternacao?: '24h' | '48h' | '72h' | '7dias' | '10dias' | '15dias' | '30 dias';
  tipoCirurgia?: 'Ortopédica' | 'Cardíaca' | 'Endovascular' | 'Abdominal' | 'Vascular' | 'Transplante' | 'Obstetrícia' | 'Outra';
  desdeCirurgia?: string;
  esperaCirurgiaDetalhes?: EsperaCirurgiaDetalhes;
  aguardandoExame?: string;
  desdeExame?: string;
  esperaExameDetalhes?: EsperaExameDetalhes;
  aguardandoParecer?: string;
  desdeParecer?: string;
  esperaParecerDetalhes?: EsperaParecerDetalhes;
  aguardandoDesospitalizacao?: string;
  desdeDesospitalizacao?: string;
  esperaDesospitalizacaoDetalhes?: EsperaDesospitalizacaoDetalhes;
  rede?: string;
  regiao?: string;
  macroRegiao?: string;
  produto?: string;
  carencia?: 'Sim' | 'Não';
  cpt?: 'Sim' | 'Não';
  cidEvolutivo?: string;
  cidAlta?: string;
  medico?: string;
  telefone?: string;
  ultimaConsulta?: string;
  notasRegulacao?: string;
};