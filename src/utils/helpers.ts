import { HistoryEntry, Patient, User, Esperas } from '../types/index.ts';
import { Blob } from '@google/genai';

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const formatDateDdMmYy = (dateString?: string): string => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return 'N/A';
    const [year, month, day] = dateString.split('-');
    const shortYear = year.slice(-2);
    return `${day}/${month}/${shortYear}`;
};

export const formatDateTimeDdMmYy = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};


export const calculateDaysWaiting = (sinceDate?: string): number | string => {
    if (!sinceDate || !/^\d{4}-\d{2}-\d{2}$/.test(sinceDate)) return 'N/A';
    const today = new Date();
    const [year, month, day] = sinceDate.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day));
    const diffTime = today.getTime() - startDate.getTime();
    if (diffTime < 0) return 0;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

export const calculatePermanencia = (dataIH?: string, altaFim?: string): string => {
    if (!dataIH || !/^\d{4}-\d{2}-\d{2}$/.test(dataIH)) return 'N/A';

    const today = new Date();
    
    const startDate = new Date(dataIH);
    // Use altaFim if provided and valid, otherwise use today
    const endDate = (altaFim && /^\d{4}-\d{2}-\d{2}$/.test(altaFim)) ? new Date(altaFim) : today;

    // Set time to 0 to compare dates only
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - startDate.getTime();
    
    if (diffTime < 0) return '0 dias';
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} dias`;
};


export const calculateDaysBetween = (startDateStr?: string, endDateStr?: string): string => {
    if (!startDateStr || !endDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(startDateStr) || !/^\d{4}-\d{2}-\d{2}$/.test(endDateStr)) {
        return 'N/A';
    }
    const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
    const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);
    const startDate = new Date(Date.UTC(sYear, sMonth - 1, sDay));
    const endDate = new Date(Date.UTC(eYear, eMonth - 1, eDay));
    const diffTime = endDate.getTime() - startDate.getTime();

    if (diffTime < 0) return 'Data inválida';

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} dias`;
};


const fieldLabels: Partial<Record<keyof Patient, string>> = {
    tipoInternacao: 'Tipo Internação',
    natureza: 'Natureza da Guia',
    altaPrev: 'Alta Prevista',
    altaReplan: 'Alta Replanejada',
    altaFim: 'Data da Alta',
    motivoAlta: 'Motivo da Alta',
    criticidade: 'Criticidade',
    programa: 'Programa NCI',
    hospitalDestino: 'Hospital de Destino',
    leitoAdmissao: 'Leito Admissional',
    leitoAuditado: 'Leito Auditado',
    leitoHoje: 'Leito Hoje',
    evento: 'Evento',
    reinternacao: 'Reinternação',
    liminar: 'Liminar',
    fraude: 'Fraude',
    enviadoRetificacao: 'Enviado para Retificação',
    tipoReinternacao: 'Tipo Reinternação',
    diagnosticos: 'Diagnósticos',
    produto: 'Produto',
    carencia: 'Carência',
    cpt: 'CPT',
    cidIH: 'CID de Entrada',
    cidEvolutivo: 'CID Evolutivo',
    cidAlta: 'CID Alta',
    medico: 'Nome do Médico',
    telefone: 'Telefone',
    ultimaConsulta: 'Última consulta',
    notasRegulacao: 'Notas da Regulação',
    tipoCirurgia: 'Tipo de Cirurgia',
    desdeCirurgia: 'Aguardando Cirurgia Desde',
    aguardandoExame: 'Aguardando Exame',
    desdeExame: 'Aguardando Exame Desde',
    aguardandoParecer: 'Aguardando Parecer',
    desdeParecer: 'Aguardando Parecer Desde',
    aguardandoDesospitalizacao: 'Aguardando Desospitalização',
    desdeDesospitalizacao: 'Aguardando Desospitalização Desde',
};

const formatDateForHistory = (dateStr: string | undefined) => {
    if (!dateStr) return 'não definida';
    return formatDateDdMmYy(dateStr);
}

export const generateChangeHistory = (original: Patient, updated: Patient, user: User): HistoryEntry[] => {
    const changes: HistoryEntry[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Handle simple fields
    for (const key in fieldLabels) {
        const typedKey = key as keyof Patient;
        const originalValue = original[typedKey];
        const updatedValue = updated[typedKey];

        if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
            let from = originalValue || 'vazio';
            let to = updatedValue || 'vazio';

            if (['altaPrev', 'altaReplan', 'altaFim', 'desdeCirurgia', 'desdeExame', 'desdeParecer', 'desdeDesospitalizacao', 'ultimaConsulta'].includes(key)) {
                from = formatDateForHistory(originalValue as string | undefined);
                to = formatDateForHistory(updatedValue as string | undefined);
            }
            
            if (from !== to) {
                changes.push({
                    data: today,
                    responsavel: user.name,
                    diario: `Log de Alteração: O campo '${fieldLabels[typedKey]}' foi alterado de '${from}' para '${to}'.`
                });
            }
        }
    }
    
    // Special handling for 'esperas' object
    const esperaLabels: Record<keyof Esperas, string> = {
        cirurgia: 'Espera Cirurgia',
        exame: 'Espera Exame',
        parecer: 'Espera Parecer',
        desospitalizacao: 'Espera Desospitalização'
    };

    const originalEsperas = original.esperas;
    const updatedEsperas = updated.esperas;
    for (const key in originalEsperas) {
        const typedKey = key as keyof Esperas;
        if (originalEsperas[typedKey] !== updatedEsperas[typedKey]) {
            const status = updatedEsperas[typedKey] ? 'ativada' : 'desativada';
            changes.push({
                data: today,
                responsavel: user.name,
                diario: `Log de Alteração: A pendência '${esperaLabels[typedKey]}' foi ${status}.`
            });
        }
    }
    
    // Special handling for 'leitoHistory' array
    const originalLeitoHistory = original.leitoHistory || [];
    const updatedLeitoHistory = updated.leitoHistory || [];

    // Check for added or modified records
    updatedLeitoHistory.forEach(updatedRecord => {
        const originalRecord = originalLeitoHistory.find(r => r.id === updatedRecord.id);
        if (!originalRecord) {
            changes.push({
                data: today,
                responsavel: user.name,
                diario: `Log de Leito: Adicionado registro para data ${formatDateDdMmYy(updatedRecord.date)} com leito '${updatedRecord.leitoDoDia}'.`
            });
        } else {
            if (originalRecord.leitoDoDia !== updatedRecord.leitoDoDia) {
                changes.push({
                    data: today,
                    responsavel: user.name,
                    diario: `Log de Leito: Leito do dia para data ${formatDateDdMmYy(updatedRecord.date)} alterado de '${originalRecord.leitoDoDia}' para '${updatedRecord.leitoDoDia}'.`
                });
            }
        }
    });

    // Check for deleted records
    originalLeitoHistory.forEach(originalRecord => {
        const stillExists = updatedLeitoHistory.some(r => r.id === originalRecord.id);
        if (!stillExists) {
             changes.push({
                data: today,
                responsavel: user.name,
                diario: `Log de Leito: Removido registro para data ${formatDateDdMmYy(originalRecord.date)} com leito '${originalRecord.leitoDoDia}'.`
            });
        }
    });

    return changes;
};