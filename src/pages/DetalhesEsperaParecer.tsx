import React, { useState, useMemo } from 'react';
import { Patient, User, EsperaParecerDetalhes } from '../types/index.ts';
import { calculateDaysBetween } from '../utils/helpers.ts';
import AppHeader from '../components/AppHeader.tsx';

const DetalhesEsperaParecer = ({ patient, onBack, user, onUpdatePatient, showToast }: {
    patient: Patient,
    onBack: () => void,
    user: User,
    onUpdatePatient: (patient: Patient, user: User) => void,
    showToast: (message: string, type?: 'success' | 'error') => void
}) => {
    const [details, setDetails] = useState<EsperaParecerDetalhes>(patient.esperaParecerDetalhes || {});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (details.dataSolicitacao && details.dataResposta && details.dataSolicitacao > details.dataResposta) {
            showToast('Erro de validação: A Data da Resposta não pode ser anterior à Data da Solicitação.', 'error');
            return;
        }

        const updatedPatient = {
            ...patient,
            esperaParecerDetalhes: details
        };
        onUpdatePatient(updatedPatient, user);
        showToast('Alterações salvas com sucesso!');
    };

    const tempoEspera = useMemo(() => calculateDaysBetween(details.dataSolicitacao, details.dataResposta), [details.dataSolicitacao, details.dataResposta]);

    return (
        <div className="page-container">
            <AppHeader
                title={`Detalhes da Espera de Parecer`}
                subtitle={`Paciente: ${patient.nome}`}
                onBack={onBack}
            />
            <div className="details-content">
                <fieldset className="fieldset-dotted">
                    <legend>Espera Parecer</legend>
                    <div className="espera-parecer-grid">
                        <div className="form-group form-group-highlight">
                            <label>Especialidade</label>
                            <input type="text" name="especialidade" value={details.especialidade || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                        </div>
                        <div className="form-group form-group-highlight">
                            <label>Data da solicitação</label>
                            <input type="date" name="dataSolicitacao" value={details.dataSolicitacao || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                        </div>
                        <div className="form-group">
                            <label>Data da Resposta</label>
                            <input type="date" name="dataResposta" value={details.dataResposta || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                        </div>
                        <div className="form-group">
                            {/* Empty div for grid alignment */}
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

export default DetalhesEsperaParecer;