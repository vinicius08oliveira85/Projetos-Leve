import React from 'react';
import { Patient, User } from '../types/index.ts';
import { formatDateDdMmYy, calculateDaysWaiting } from '../utils/helpers.ts';
import AppHeader from '../components/AppHeader.tsx';

const PacientesAguardandoExame = ({ onBack, onViewDetails, user, patients, onSavePatients, showToast }: { 
    onBack: () => void, 
    onViewDetails: (patient: Patient) => void, 
    user: User, 
    patients: Patient[], 
    onSavePatients: (patients: Patient[], user: User) => void,
    showToast: (message: string) => void
}) => {
    
    const examPatients = patients.filter(p => p.esperas.exame);

    return (
        <div className="page-container">
            <AppHeader
                title="Pacientes aguardando Exame"
                subtitle="Lista dos pacientes que aguardam por um exame."
                onBack={onBack}
            />
             <div className="table-container" style={{ marginTop: '20px' }}>
                <table className="patient-table">
                    <thead>
                        <tr>
                            <th>HOSPITAL IH</th>
                            <th>PACIENTE</th>
                            <th>DATA IH</th>
                            <th>PREVISÃO DE ALTA</th>
                            <th>AGUARDANDO EXAME</th>
                            <th>DESDE EXAME</th>
                            <th>DIAS DE ESPERA</th>
                            <th>LEITO AUDITADO</th>
                            <th>DETALHES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {examPatients.map(p => {
                            const diasDeEspera = calculateDaysWaiting(p.desdeExame);
                            return (
                                <tr key={p.id}>
                                    <td>{p.hospitalDestino}</td>
                                    <td>{p.nome}</td>
                                    <td>{formatDateDdMmYy(p.dataIH)}</td>
                                    <td>{formatDateDdMmYy(p.altaPrev)}</td>
                                    <td>{p.aguardandoExame || 'N/A'}</td>
                                    <td>{formatDateDdMmYy(p.desdeExame)}</td>
                                    <td className="days-cell">
                                        {diasDeEspera !== 'N/A' ? `${diasDeEspera} dias` : 'N/A'}
                                    </td>
                                    <td>{p.leitoAuditado || 'N/A'}</td>
                                    <td>
                                        <button className="icon-button" onClick={() => onViewDetails(p)} aria-label={`Detalhes da Espera de Exame de ${p.nome}`}>
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

export default PacientesAguardandoExame;