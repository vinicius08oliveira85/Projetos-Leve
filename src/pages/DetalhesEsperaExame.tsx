import React, { useState, useMemo } from 'react';
import { Patient, User, EsperaExameDetalhes, TimelineHistoryEntry } from '../types/index.ts';
import { calculateDaysBetween, formatDateDdMmYy } from '../utils/helpers.ts';
import AppHeader from '../components/AppHeader.tsx';
import TimelineHistory from '../components/TimelineHistory.tsx';

const fieldLabels: { [key in keyof (EsperaExameDetalhes & { aguardandoExame: string })]: string } = {
    aguardandoExame: 'Aguardando Exame',
    dataInicio: 'Data Início',
    envioPedido: 'Envio do Pedido',
    esperaAgendamento: 'Espera Agendamento',
    laudo: 'Laudo',
    laudoLiberado: 'Laudo Liberado',
    dataFim: 'Data Fim',
};

const DetalhesEsperaExame = ({ patient, onBack, user, onUpdatePatient, showToast }: {
    patient: Patient,
    onBack: () => void,
    user: User,
    onUpdatePatient: (patient: Patient, user: User) => void,
    showToast: (message: string, type?: 'success' | 'error') => void
}) => {
    // Keep track of the initial state to compare on save
    const [initialDetails] = useState<EsperaExameDetalhes>(patient.esperaExameDetalhes || {});
    const [initialAguardandoExame] = useState<string>(patient.aguardandoExame || '');

    const [details, setDetails] = useState<EsperaExameDetalhes>(patient.esperaExameDetalhes || {});
    const [aguardandoExame, setAguardandoExame] = useState<string>(patient.aguardandoExame || '');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const dates = [
            { name: 'Data Início', value: details.dataInicio },
            { name: 'Envio do Pedido', value: details.envioPedido },
            { name: 'Laudo', value: details.laudo },
            { name: 'Laudo Liberado', value: details.laudoLiberado },
            { name: 'Data Fim', value: details.dataFim },
        ].filter(d => d.value);
    
        for (let i = 0; i < dates.length - 1; i++) {
            if (dates[i].value! > dates[i + 1].value!) {
                showToast(`Erro de validação: A data '${dates[i + 1].name}' não pode ser anterior à data '${dates[i].name}'.`, 'error');
                return;
            }
        }

        const newHistoryEntries: TimelineHistoryEntry[] = [];
        const now = new Date().toISOString();

        // Compare aguardandoExame
        if (initialAguardandoExame !== aguardandoExame) {
            newHistoryEntries.push({
                data: now,
                responsavel: user.name,
                alteracao: `O campo '${fieldLabels.aguardandoExame}' foi alterado de '${initialAguardandoExame || 'vazio'}' para '${aguardandoExame || 'vazio'}'.`
            });
        }
        
        // FIX: Replaced forEach with a for...of loop to allow for correct type narrowing.
        // Compare details object
        for (const key of Object.keys(fieldLabels) as Array<keyof typeof fieldLabels>) {
            if (key === 'aguardandoExame') {
                continue;
            }
            
            const initialValue = initialDetails[key];
            const currentValue = details[key];

            if (initialValue !== currentValue) {
                 const from = key.startsWith('data') ? (formatDateDdMmYy(initialValue) === 'N/A' ? 'vazio' : formatDateDdMmYy(initialValue)) : (initialValue || 'vazio');
                 const to = key.startsWith('data') ? (formatDateDdMmYy(currentValue) === 'N/A' ? 'vazio' : formatDateDdMmYy(currentValue)) : (currentValue || 'vazio');

                 if (from !== to) {
                    newHistoryEntries.push({
                        data: now,
                        responsavel: user.name,
                        alteracao: `O campo '${fieldLabels[key]}' foi alterado de '${from}' para '${to}'.`
                    });
                 }
            }
        }

        if (newHistoryEntries.length === 0) {
            showToast('Nenhuma alteração foi feita.');
            return;
        }

        const updatedPatient = {
            ...patient,
            esperaExameDetalhes: details,
            aguardandoExame: aguardandoExame,
            historicoEsperaExame: [...(patient.historicoEsperaExame || []), ...newHistoryEntries],
        };
        onUpdatePatient(updatedPatient, user);
        showToast('Alterações salvas com sucesso!');
    };

    const tempoEspera = useMemo(() => calculateDaysBetween(details.dataInicio, details.dataFim), [details.dataInicio, details.dataFim]);

    return (
        <div className="page-container">
            <AppHeader
                title={`Detalhes da Espera de Exame`}
                subtitle={`Paciente: ${patient.nome}`}
                onBack={onBack}
            />
            <div className="details-content">
                <fieldset>
                    <legend>Espera Exame</legend>
                    <div className="espera-exame-grid">
                        <div className="form-group form-group-highlight">
                            <label>Aguardando Exame</label>
                            <input
                                type="text"
                                name="aguardandoExame"
                                value={aguardandoExame}
                                onChange={(e) => setAguardandoExame(e.target.value)}
                                disabled={user.role !== 'admin'}
                            />
                        </div>
                        <div className="form-group form-group-highlight">
                            <label>Data Início</label>
                            <input type="date" name="dataInicio" value={details.dataInicio || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                        </div>
                        <div className="form-group form-group-highlight">
                            <label>Envio do Pedido</label>
                            <input type="date" name="envioPedido" value={details.envioPedido || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                        </div>
                        <div className="form-group form-group-highlight">
                            <label>Espera Agendamento</label>
                            <select name="esperaAgendamento" value={details.esperaAgendamento || ''} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                <option value="" disabled>Selecione</option>
                                <option>Sim</option>
                                <option>Não</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Laudo</label>
                            <input type="date" name="laudo" value={details.laudo || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                        </div>
                        <div className="form-group form-group-highlight">
                            <label>Laudo Liberado</label>
                            <input type="date" name="laudoLiberado" value={details.laudoLiberado || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                        </div>
                        <div className="form-group form-group-highlight">
                            <label>Data Fim</label>
                            <input type="date" name="dataFim" value={details.dataFim || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                        </div>
                        <div className="form-group">
                            <label>Tempo de Espera</label>
                            <input type="text" value={tempoEspera} disabled />
                        </div>
                    </div>
                </fieldset>
                
                <fieldset style={{ marginTop: '24px' }}>
                    <legend>Histórico de Alterações da Espera</legend>
                    <TimelineHistory history={patient.historicoEsperaExame || []} />
                </fieldset>
                
                {user.role === 'admin' && (
                    <div className="details-actions">
                        <button onClick={handleSave} className="save-details-btn">Salvar Alterações</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetalhesEsperaExame;