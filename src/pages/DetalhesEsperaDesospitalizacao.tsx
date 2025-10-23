import React, { useState } from 'https://aistudiocdn.com/react@^19.2.0';
import { Patient, User, EsperaDesospitalizacaoDetalhes } from '../types/index.ts';
import AppHeader from '../components/AppHeader.tsx';

const DetalhesEsperaDesospitalizacao = ({ patient, onBack, user, onUpdatePatient, showToast }: {
    patient: Patient,
    onBack: () => void,
    user: User,
    onUpdatePatient: (patient: Patient) => void,
    showToast: (message: string) => void
}) => {
    const [details, setDetails] = useState<EsperaDesospitalizacaoDetalhes>(patient.esperaDesospitalizacaoDetalhes || {});

    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value as 'Sim' | 'Não' }));
    };

    const handleSave = () => {
        const updatedPatient = {
            ...patient,
            esperaDesospitalizacaoDetalhes: details
        };
        onUpdatePatient(updatedPatient);
        showToast('Alterações salvas com sucesso!');
    };
    
    const fields: { key: keyof EsperaDesospitalizacaoDetalhes; label: string }[] = [
        { key: 'aguardaAntibioticoTerapia', label: 'Aguarda Antibiótico terapia' },
        { key: 'aguardaCurativoDomiciliar', label: 'Aguarda Curativo domiciliar' },
        { key: 'aguardaOxigenioTerapia', label: 'Aguarda Oxigênio terapia' },
        { key: 'aguardaHomeCare', label: 'Aguarda Home Care' },
        { key: 'aguardaPedido', label: 'Aguarda Pedido' },
    ];

    return (
        <div className="page-container">
            <AppHeader
                title={`Detalhes da Espera de Desospitalização`}
                subtitle={`Paciente: ${patient.nome}`}
                onBack={onBack}
            />
            <div className="details-content">
                <fieldset>
                    <legend>Espera Desospitalização</legend>
                    <div className="espera-desospitalizacao-grid">
                        {fields.map(field => (
                            <div className="form-group form-group-highlight" key={field.key}>
                                <label>{field.label}</label>
                                <select name={field.key} value={details[field.key] || 'Não'} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                    <option>Não</option>
                                    <option>Sim</option>
                                </select>
                            </div>
                        ))}
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

export default DetalhesEsperaDesospitalizacao;