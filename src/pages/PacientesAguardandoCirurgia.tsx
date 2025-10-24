import React, { useState } from 'https://aistudiocdn.com/react@^19.2.0';
import { Patient, User } from '../types/index.ts';
import { formatDateDdMmYy, calculateDaysWaiting } from '../utils/helpers.ts';
import AppHeader from '../components/AppHeader.tsx';

const PacientesAguardandoCirurgia = ({ onBack, onViewDetails, user, patients, onSavePatients, showToast }: { 
    onBack: () => void, 
    onViewDetails: (patient: Patient) => void, 
    user: User, 
    patients: Patient[], 
    onSavePatients: (patients: Patient[], user: User) => void,
    showToast: (message: string) => void
}) => {
    
    const [editedPatients, setEditedPatients] = useState<Record<number, Partial<Patient>>>({});
    const surgeryPatients = patients.filter(p => p.esperas.cirurgia);
    const surgeryTypes: Patient['tipoCirurgia'][] = ['Ortopédica', 'Cardíaca', 'Endovascular', 'Abdominal', 'Vascular', 'Transplante', 'Obstetrícia', 'Outra'];

    const handleFieldChange = (patientId: number, field: keyof Patient, value: any) => {
        setEditedPatients(prev => ({
            ...prev,
            [patientId]: { ...prev[patientId], [field]: value }
        }));
    };

    const handleSave = () => {
        if (Object.keys(editedPatients).length === 0) {
            showToast("Nenhuma alteração para salvar.");
            return;
        }
        const updatedPatients = patients
            .map(p => editedPatients[p.id] ? { ...p, ...editedPatients[p.id] } : p)
            .filter(p => editedPatients[p.id]);

        onSavePatients(updatedPatients, user);
        setEditedPatients({});
        showToast("Alterações salvas com sucesso!");
    };

    return (
        <div className="page-container">
            <AppHeader
                title="Pacientes aguardando Cirurgia"
                subtitle="Lista dos pacientes que aguardam por uma cirurgia."
                onBack={onBack}
            />
            <div className="espera-filter-bar" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
                <div className="filter-controls">
                    <button className="save-button" onClick={handleSave} disabled={Object.keys(editedPatients).length === 0}>Salvar</button>
                </div>
            </div>
             <div className="table-container no-top-radius">
                <table className="patient-table">
                    <thead>
                        <tr>
                            <th>Hospital IH</th>
                            <th>CPF</th>
                            <th>Paciente</th>
                            <th>Data IH</th>
                            <th>Previsão de Alta</th>
                            <th>Aguardando Cirurgia</th>
                            <th>Desde Cirurgia</th>
                            <th>Dias de espera</th>
                            <th>Leito auditado</th>
                            <th>Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {surgeryPatients.map(p => {
                            const editedData = editedPatients[p.id] || {};
                            const patientData = { ...p, ...editedData };
                            return (
                                <tr key={p.id}>
                                    <td>{patientData.hospitalDestino}</td>
                                    <td>{patientData.cpf}</td>
                                    <td>{patientData.nome}</td>
                                    <td>{formatDateDdMmYy(patientData.dataIH)}</td>
                                    <td>{formatDateDdMmYy(patientData.altaPrev)}</td>
                                    <td>
                                        {user.role === 'admin' ? (
                                            <select
                                                className="inline-select"
                                                value={patientData.tipoCirurgia || ''}
                                                onChange={(e) => handleFieldChange(p.id, 'tipoCirurgia', e.target.value as Patient['tipoCirurgia'])}
                                            >
                                                <option value="" disabled>Selecione</option>
                                                {surgeryTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                            </select>
                                        ) : (
                                            patientData.tipoCirurgia || 'N/A'
                                        )}
                                    </td>
                                    <td>
                                        {user.role === 'admin' ? (
                                            <input
                                                type="date"
                                                className="table-input-date"
                                                value={patientData.desdeCirurgia || ''}
                                                onChange={(e) => handleFieldChange(p.id, 'desdeCirurgia', e.target.value)}
                                            />
                                        ) : (
                                            formatDateDdMmYy(patientData.desdeCirurgia)
                                        )}
                                    </td>
                                    <td>{calculateDaysWaiting(patientData.desdeCirurgia)}</td>
                                    <td>{patientData.leitoAuditado}</td>
                                    <td>
                                        <button className="icon-button" onClick={() => onViewDetails(p)} aria-label={`Detalhes da Espera de Cirurgia de ${p.nome}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PacientesAguardandoCirurgia;