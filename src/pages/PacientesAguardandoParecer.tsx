import React from 'https://aistudiocdn.com/react@^19.2.0';
import { Patient, User } from '../types/index.ts';
import { formatDateDdMmYy, calculateDaysWaiting } from '../utils/helpers.ts';
import AppHeader from '../components/AppHeader.tsx';

const PacientesAguardandoParecer = ({ onBack, onViewDetails, user, patients, onUpdatePatients, showToast }: {
    onBack: () => void,
    onViewDetails: (patient: Patient) => void,
    user: User,
    patients: Patient[],
    onUpdatePatients: React.Dispatch<React.SetStateAction<Patient[]>>,
    showToast: (message: string) => void
}) => {
    
    const parecerPatients = patients.filter(p => p.esperas.parecer);

    const handleFieldChange = (patientId: number, field: keyof Patient, value: any) => {
        onUpdatePatients(currentPatients =>
            currentPatients.map(p =>
                p.id === patientId ? { ...p, [field]: value } : p
            )
        );
    };

    const handleSave = () => {
        showToast("Alterações salvas com sucesso!");
    };

    return (
        <div className="page-container">
            <AppHeader
                title="Pacientes aguardando Parecer"
                subtitle="Lista dos pacientes que aguardam por um parecer."
                onBack={onBack}
            />
            <div className="espera-filter-bar" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
                <div className="filter-controls">
                    <button className="save-button" onClick={handleSave}>Salvar</button>
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
                            <th>Aguardando Parecer</th>
                            <th>Desde Parecer</th>
                            <th>Dias de espera</th>
                            <th>Leito auditado</th>
                            <th>Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parecerPatients.map(p => (
                            <tr key={p.id}>
                                <td>{p.hospitalDestino}</td>
                                <td>{p.cpf}</td>
                                <td>{p.nome}</td>
                                <td>{formatDateDdMmYy(p.dataIH)}</td>
                                <td>{formatDateDdMmYy(p.altaPrev)}</td>
                                <td>
                                    {user.role === 'admin' ? (
                                        <input
                                            type="text"
                                            className="table-input-text"
                                            value={p.aguardandoParecer || ''}
                                            placeholder="Ver tipos no sistema"
                                            onChange={(e) => handleFieldChange(p.id, 'aguardandoParecer', e.target.value)}
                                        />
                                    ) : (
                                        p.aguardandoParecer || 'N/A'
                                    )}
                                </td>
                                <td>
                                    {user.role === 'admin' ? (
                                        <input
                                            type="date"
                                            className="table-input-date"
                                            value={p.desdeParecer || ''}
                                            onChange={(e) => handleFieldChange(p.id, 'desdeParecer', e.target.value)}
                                        />
                                    ) : (
                                        formatDateDdMmYy(p.desdeParecer)
                                    )}
                                </td>
                                <td>{calculateDaysWaiting(p.desdeParecer)}</td>
                                <td>{p.leitoAuditado}</td>
                                <td>
                                    <button className="icon-button" onClick={() => onViewDetails(p)} aria-label={`Detalhes da Espera de Parecer de ${p.nome}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PacientesAguardandoParecer;