import React, { useState, useMemo } from 'https://aistudiocdn.com/react@^19.2.0';
import { Patient, User, GuiaStatus, HistoryEntry } from '../types';
import AppHeader from '../components/AppHeader';
import { formatDateDdMmYy, calculatePermanencia, formatDateTimeDdMmYy } from '../utils/helpers';
import GestaoDeLeito from '../components/GestaoDeLeito';

const statusToClassName = (status: GuiaStatus) => {
    return status
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
};

const motivoAltaOptions = [
    'ÓBITO',
    'TIH',
    'À REVELIA',
    'HOSPITALAR',
    'ADMINISTRATIVA',
];

const criticidadeDisplayMap: { [key in Patient['criticidade']]: string } = {
    'Diário 24h': '1',
    '48h': '2',
    '72h': '3',
};
const criticidadeValueMap: { [key: string]: Patient['criticidade'] } = {
    '1': 'Diário 24h',
    '2': '48h',
    '3': '72h',
};

const LeitoModal = ({ patient: initialPatient, user, onClose, onSave }: {
    patient: Patient;
    user: User;
    onClose: () => void;
    onSave: (updatedPatient: Patient) => void;
}) => {
    const [patient, setPatient] = useState<Patient>(initialPatient);

    const handleSaveClick = () => {
        onSave(patient);
    };

    return (
        <div className="modal-overlay">
            <div className="leito-modal-content" style={{ maxWidth: '600px' }}>
                <div className="leito-modal-header">
                    <h3>Gestão de Leito - {patient.nome}</h3>
                    <button onClick={onClose} className="leito-modal-close-btn">&times;</button>
                </div>
                <div className="leito-modal-body" style={{ marginTop: '20px' }}>
                    <GestaoDeLeito user={user} patient={patient} onPatientChange={setPatient} />
                </div>
                <div className="details-actions" style={{ marginTop: '20px', justifyContent: 'flex-end', display: 'flex' }}>
                    <button onClick={onClose} className="modal-button cancel" style={{ marginRight: '10px' }}>Cancelar</button>
                    <button onClick={handleSaveClick} className="modal-button confirm">Salvar e Fechar</button>
                </div>
            </div>
        </div>
    );
};


const FotoDoDia = ({ onBack, onBackToCards, onSelectPatient, user, patients, onUpdatePatients, initialCriticidadeFilter = null }: { 
    onBack: () => void, 
    onBackToCards: () => void,
    onSelectPatient: (patient: Patient) => void, 
    user: User, 
    patients: Patient[], 
    onUpdatePatients: React.Dispatch<React.SetStateAction<Patient[]>>,
    initialCriticidadeFilter?: Patient['criticidade'][] | null 
}) => {
    const [dateFilter, setDateFilter] = useState<string>('2025-08-24');
    const [hospitalFilter, setHospitalFilter] = useState<string>('Todos');
    const [taskStatusFilter, setTaskStatusFilter] = useState<string>('Todos');
    const [editingLeitoPatient, setEditingLeitoPatient] = useState<Patient | null>(null);

    const uniqueHospitals = useMemo(() => ['Todos', ...new Set(patients.map(p => p.hospitalDestino))], [patients]);
    const taskStatuses: (Patient['taskStatus'] | undefined)[] = ['Pendente', 'Em Andamento', 'Revisada'];


    const filteredPatients = useMemo(() => {
        return patients
            .filter(p => {
                const dateMatch = !dateFilter || p.data === dateFilter;
                const hospitalMatch = hospitalFilter === 'Todos' || p.hospitalDestino === hospitalFilter;
                const criticidadeMatch = !initialCriticidadeFilter || initialCriticidadeFilter.includes(p.criticidade);
                const taskStatusMatch = taskStatusFilter === 'Todos' || p.taskStatus === taskStatusFilter;
                return dateMatch && hospitalMatch && criticidadeMatch && taskStatusMatch;
            })
            .sort((a, b) => {
                const priority: { [key in GuiaStatus]?: number } = { 
                    'Guia negada': 1, 
                    'Guia cancelada': 1 
                };
                const aPrio = priority[a.status] || 2;
                const bPrio = priority[b.status] || 2;
                if (aPrio < bPrio) return -1;
                if (aPrio > bPrio) return 1;
                return 0;
            });
    }, [patients, dateFilter, hospitalFilter, initialCriticidadeFilter, taskStatusFilter]);
    
    const handleSaveLeito = (updatedPatient: Patient) => {
        const originalPatient = patients.find(p => p.id === updatedPatient.id);
        if (!originalPatient) return;

        const newHistoryEntries: HistoryEntry[] = [];
        const today = new Date().toISOString().split('T')[0];

        const originalLeitoHistory = originalPatient.leitoHistory || [];
        const updatedLeitoHistory = updatedPatient.leitoHistory || [];

        updatedLeitoHistory.forEach(updatedRecord => {
            const originalRecord = originalLeitoHistory.find(r => r.id === updatedRecord.id);
            if (!originalRecord) {
                newHistoryEntries.push({
                    data: today,
                    responsavel: user.name,
                    diario: `Log de Leito: Adicionado registro para data ${formatDateDdMmYy(updatedRecord.date)} - Leito do Dia: ${updatedRecord.leitoDoDia}.`
                });
            } else {
                if (originalRecord.leitoDoDia !== updatedRecord.leitoDoDia) {
                     newHistoryEntries.push({
                        data: today,
                        responsavel: user.name,
                        diario: `Log de Leito: Atualizado registro da data ${formatDateDdMmYy(updatedRecord.date)} - Leito do Dia: ${updatedRecord.leitoDoDia}.`
                    });
                }
            }
        });

        const finalPatient = {
            ...updatedPatient,
            historico: [...(updatedPatient.historico || []), ...newHistoryEntries]
        };

        onUpdatePatients(prevPatients =>
            prevPatients.map(p => (p.id === finalPatient.id ? finalPatient : p))
        );
        
        setEditingLeitoPatient(null);
    };

    const handleAltaFimChange = (patientId: number, newDate: string) => {
        onUpdatePatients(prevPatients =>
            prevPatients.map(p =>
                p.id === patientId ? { ...p, altaFim: newDate } : p
            )
        );
    };

    const handleMotivoAltaChange = (patientId: number, newMotivo: string) => {
        onUpdatePatients(prevPatients =>
            prevPatients.map(p =>
                p.id === patientId ? { ...p, motivoAlta: newMotivo } : p
            )
        );
    };

    const handleCriticidadeChange = (patientId: number, newValue: string) => {
        const newCriticidade = criticidadeValueMap[newValue];
        onUpdatePatients(prevPatients => 
            prevPatients.map(p => 
                p.id === patientId ? { ...p, criticidade: newCriticidade } : p
            )
        );
    };

    const handleTaskStatusChange = (patientId: number) => {
        onUpdatePatients(prevPatients => 
            prevPatients.map(p => {
                if (p.id === patientId) {
                    let nextStatus: Patient['taskStatus'];
                    switch (p.taskStatus) {
                        case 'Pendente':
                            nextStatus = 'Em Andamento';
                            break;
                        case 'Em Andamento':
                            nextStatus = 'Revisada';
                            break;
                        case 'Revisada':
                        default:
                            nextStatus = 'Pendente';
                            break;
                    }
                    return { ...p, taskStatus: nextStatus };
                }
                return p;
            })
        );
    };


    return (
        <div className="page-container">
            <AppHeader
                title="Foto do dia"
                subtitle="Lista de pacientes internados com base nos filtros selecionados."
                onBack={onBack}
            />
            <div className="filter-bar">
                <div className="form-group">
                    <label>Portal do tempo:</label>
                    <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                </div>
                <div className="form-group">
                     <label>Hosp.Destino:</label>
                     <select value={hospitalFilter} onChange={(e) => setHospitalFilter(e.target.value)}>
                        {uniqueHospitals.map(h => <option key={h} value={h}>{h}</option>)}
                     </select>
                </div>
                <div className="form-group">
                    <label>Tarefa:</label>
                    <select value={taskStatusFilter} onChange={(e) => setTaskStatusFilter(e.target.value)}>
                        <option value="Todos">Todos</option>
                        {taskStatuses.map(s => s && <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <button onClick={onBackToCards} className="secondary-action-button">Voltar ao Painel</button>
            </div>
            <div className="last-update-banner">
                Última atualização: {formatDateTimeDdMmYy('2025-10-17T11:37:38')}
            </div>
            <div className="table-container">
                <table className="patient-table">
                    <thead>
                        <tr>
                            <th>Detalhes</th>
                            <th>Guia</th>
                            <th>Nome do Paciente</th>
                            <th>Data IH</th>
                            <th>Data Alta</th>
                            <th>Motivo Alta</th>
                            <th>Permanência</th>
                            <th>Criticidade</th>
                            <th>Hospital Destino</th>
                            <th>Leito do dia</th>
                            <th>Natureza da Guia</th>
                            <th>Status da Guia</th>
                            <th>TAREFA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.map(p => {
                            const latestLeitoRecord = [...(p.leitoHistory || [])]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                            const leitoDoDia = latestLeitoRecord ? latestLeitoRecord.leitoDoDia : p.leitoAdmissao;
                            
                            return (
                                <tr key={p.id}>
                                    <td>
                                        <button className="icon-button" onClick={() => onSelectPatient(p)} aria-label={`Detalhes de ${p.nome}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        </button>
                                    </td>
                                    <td>{p.guia}</td>
                                    <td>{p.nome}</td>
                                    <td>{formatDateDdMmYy(p.dataIH)}</td>
                                    <td>
                                        {user.role === 'admin' ? (
                                            <div className="date-input-wrapper">
                                                <input
                                                    type="date"
                                                    className="table-input-date"
                                                    value={p.altaFim || ''}
                                                    onChange={(e) => handleAltaFimChange(p.id, e.target.value)}
                                                />
                                                {p.altaFim && (
                                                    <button 
                                                        className="clear-date-button" 
                                                        onClick={() => handleAltaFimChange(p.id, '')}
                                                        aria-label="Limpar data"
                                                        title="Limpar data"
                                                    >
                                                        &times;
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            formatDateDdMmYy(p.altaFim)
                                        )}
                                    </td>
                                    <td>
                                        {user.role === 'admin' ? (
                                            <select
                                                className="table-select"
                                                value={p.motivoAlta || ''}
                                                onChange={(e) => handleMotivoAltaChange(p.id, e.target.value)}
                                            >
                                                <option value="" disabled>Selecione</option>
                                                {motivoAltaOptions.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            p.motivoAlta || 'N/A'
                                        )}
                                    </td>
                                    <td>{calculatePermanencia(p.dataIH, p.altaFim)}</td>
                                    <td>
                                        <select
                                            className="table-select"
                                            value={criticidadeDisplayMap[p.criticidade]}
                                            onChange={(e) => handleCriticidadeChange(p.id, e.target.value)}
                                            style={{ color: 'var(--status-red-text)', fontWeight: 'bold' }}
                                            disabled={user.role !== 'admin'}
                                        >
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                        </select>
                                    </td>
                                    <td>{p.hospitalDestino}</td>
                                    <td>
                                        <button className="leito-cell-button" onClick={() => setEditingLeitoPatient(p)}>
                                            {leitoDoDia}
                                        </button>
                                    </td>
                                    <td>{p.natureza}</td>
                                    <td><span className={`status-badge ${statusToClassName(p.status)}`}>{p.status}</span></td>
                                    <td>
                                        <button
                                            className={`task-status-badge ${p.taskStatus?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(' ', '-') || ''}`}
                                            onClick={() => user.role === 'admin' && handleTaskStatusChange(p.id)}
                                            disabled={user.role !== 'admin'}
                                            aria-label={`Status da tarefa: ${p.taskStatus}. ${user.role === 'admin' ? 'Clique para alterar.' : ''}`}
                                        >
                                            {p.taskStatus || 'N/A'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {editingLeitoPatient && user && (
                <LeitoModal
                    patient={editingLeitoPatient}
                    user={user}
                    onClose={() => setEditingLeitoPatient(null)}
                    onSave={handleSaveLeito}
                />
            )}
        </div>
    );
};

export default FotoDoDia;