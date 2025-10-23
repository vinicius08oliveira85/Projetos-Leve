import React, { useState, useMemo } from 'react';
import { Patient, User, EsperaExameDetalhes } from '../types/index.ts';
import { calculateDaysBetween } from '../utils/helpers.ts';
import AppHeader from '../components/AppHeader.tsx';

const DetalhesEsperaExame = ({ patient, onBack, user, onUpdatePatient, showToast }: {
    patient: Patient,
    onBack: () => void,
    user: User,
    onUpdatePatient: (patient: Patient) => void,
    showToast: (message: string) => void
}) => {
    const [details, setDetails] = useState<EsperaExameDetalhes>(patient.esperaExameDetalhes || {});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const updatedPatient = {
            ...patient,
            esperaExameDetalhes: details
        };
        onUpdatePatient(updatedPatient);
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