import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Patient, User, GuiaStatus, HistoryEntry } from '../types/index.ts';
import AppHeader from '../components/AppHeader.tsx';
import { formatDateDdMmYy, calculatePermanencia } from '../utils/helpers.ts';
import GestaoDeLeito from '../components/GestaoDeLeito.tsx';

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


const MapaInternacao = ({ onBack, user, patients, onSelectPatient, onUpdatePatients, title, subtitle }: { 
    onBack: () => void, 
    user: User, 
    patients: Patient[], 
    onSelectPatient: (patient: Patient) => void,
    onUpdatePatients: React.Dispatch<React.SetStateAction<Patient[]>>,
    title: string;
    subtitle: string;
}) => {
    const [criticidadeFilter, setCriticidadeFilter] = useState<Patient['criticidade'][] | null>(null);
    const [editingLeitoPatient, setEditingLeitoPatient] = useState<Patient | null>(null);

    // Applied filters
    const [dateFilter, setDateFilter] = useState<string>('');
    const [hospitalFilter, setHospitalFilter] = useState<string[]>([]);
    const [taskStatusFilter, setTaskStatusFilter] = useState<NonNullable<Patient['taskStatus']>[]>([]);
    const [guiaStatusFilter, setGuiaStatusFilter] = useState<GuiaStatus[]>([]);

    // Temporary filters for UI
    const [tempDateFilter, setTempDateFilter] = useState(dateFilter);
    const [tempHospitalFilter, setTempHospitalFilter] = useState(hospitalFilter);
    const [tempTaskStatusFilter, setTempTaskStatusFilter] = useState(taskStatusFilter);
    const [tempGuiaStatusFilter, setTempGuiaStatusFilter] = useState(guiaStatusFilter);
    
    // Dropdown visibility
    const [isHospitalDropdownOpen, setIsHospitalDropdownOpen] = useState(false);
    const [isGuiaDropdownOpen, setIsGuiaDropdownOpen] = useState(false);
    const [isTarefaDropdownOpen, setIsTarefaDropdownOpen] = useState(false);

    const hospitalDropdownRef = useRef<HTMLDivElement>(null);
    const guiaDropdownRef = useRef<HTMLDivElement>(null);
    const tarefaDropdownRef = useRef<HTMLDivElement>(null);

    const uniqueHospitals = useMemo(() => [...new Set(patients.map(p => p.hospitalDestino))], [patients]);
    const taskStatuses: NonNullable<Patient['taskStatus']>[] = ['Pendente', 'Em Andamento', 'Revisada'];
    const guiaStatuses: GuiaStatus[] = [
        'Guia emitida / liberada', 'Guia negada', 'Guia cancelada', 'Guia sob auditoria',
        'Guia parcialmente liberada', 'Guia aguardando autorização', 'Guia pedido/aguard confirmação',
        'Guia com setor de OPME',
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (guiaDropdownRef.current && !guiaDropdownRef.current.contains(event.target as Node)) {
                setIsGuiaDropdownOpen(false);
            }
            if (hospitalDropdownRef.current && !hospitalDropdownRef.current.contains(event.target as Node)) {
                setIsHospitalDropdownOpen(false);
            }
            if (tarefaDropdownRef.current && !tarefaDropdownRef.current.contains(event.target as Node)) {
                setIsTarefaDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const reviewStats = useMemo(() => {
        const stats = {
            daily: { total: 0, emFila: 0, auditados: 0, altaReplan: 0 },
            h48: { total: 0, emFila: 0, auditados: 0, altaReplan: 0 },
            h72: { total: 0, emFila: 0, auditados: 0, altaReplan: 0 },
        };

        patients.forEach(p => {
            let category: keyof typeof stats | null = null;
            if (p.criticidade === 'Diário 24h') category = 'daily';
            else if (p.criticidade === '48h') category = 'h48';
            else if (p.criticidade === '72h') category = 'h72';

            if (category) {
                if (p.status === 'Guia sob auditoria') {
                    stats[category].auditados++;
                } else {
                    stats[category].emFila++;
                }

                if (p.altaReplan && p.altaReplan.trim() !== '') {
                    stats[category].altaReplan++;
                }
            }
        });

        Object.keys(stats).forEach(key => {
            const cat = key as keyof typeof stats;
            stats[cat].total = stats[cat].emFila + stats[cat].auditados;
        });

        return stats;
    }, [patients]);
    
    const filteredPatients = useMemo(() => {
        return patients
            .filter(p => {
                const criticidadeMatch = !criticidadeFilter || criticidadeFilter.includes(p.criticidade);
                const dateMatch = !dateFilter || p.dataIH === dateFilter;
                const hospitalMatch = hospitalFilter.length === 0 || hospitalFilter.includes(p.hospitalDestino);
                const taskStatusMatch = taskStatusFilter.length === 0 || (p.taskStatus && taskStatusFilter.includes(p.taskStatus));
                const guiaStatusMatch = guiaStatusFilter.length === 0 || guiaStatusFilter.includes(p.status);
                return criticidadeMatch && dateMatch && hospitalMatch && taskStatusMatch && guiaStatusMatch;
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
    }, [patients, criticidadeFilter, dateFilter, hospitalFilter, taskStatusFilter, guiaStatusFilter]);

    const handleSelectReview = (criticidade: Patient['criticidade'][]) => {
        if (JSON.stringify(criticidadeFilter) === JSON.stringify(criticidade)) {
            setCriticidadeFilter(null);
        } else {
            setCriticidadeFilter(criticidade);
        }
    };
    
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
    
    const handleApplyFilters = () => {
        setDateFilter(tempDateFilter);
        setHospitalFilter(tempHospitalFilter);
        setGuiaStatusFilter(tempGuiaStatusFilter);
        setTaskStatusFilter(tempTaskStatusFilter);
    };
    
    const handleClearFilters = () => {
        setTempDateFilter('');
        setTempHospitalFilter([]);
        setTempGuiaStatusFilter([]);
        setTempTaskStatusFilter([]);
        
        setDateFilter('');
        setHospitalFilter([]);
        setGuiaStatusFilter([]);
        setTaskStatusFilter([]);
    };
    
    const handleHospitalMultiChange = (hospital: string) => {
        setTempHospitalFilter(prev => {
            const isSelected = prev.includes(hospital);
            return isSelected ? prev.filter(s => s !== hospital) : [...prev, hospital];
        });
    };

    const handleGuiaStatusMultiChange = (status: GuiaStatus) => {
        setTempGuiaStatusFilter(prev => {
            const isSelected = prev.includes(status);
            return isSelected ? prev.filter(s => s !== status) : [...prev, status];
        });
    };
    
    const handleTaskStatusMultiChange = (status: NonNullable<Patient['taskStatus']>) => {
        setTempTaskStatusFilter(prev => {
            const isSelected = prev.includes(status);
            return isSelected ? prev.filter(s => s !== status) : [...prev, status];
        });
    };


    const ReviewCard = ({ title, badgeText, totalCount, subCounts, theme, onClick }: { 
        title: string; 
        badgeText: string; 
        totalCount: number; 
        subCounts: { emFila: number; auditados: number; altaReplan: number };
        theme: string; 
        onClick: () => void 
    }) => (
        <div className={`review-card theme-${theme}`}>
            <div className="review-card-header">
                <h3 className="review-card-title">{title}</h3>
                <div className="review-card-badge">{badgeText}</div>
            </div>
            <div className="review-card-main-count">{totalCount}</div>
            <div className="review-card-sub-counts">
                <div className="sub-count-item">
                    <span className="sub-count-number em-fila">{subCounts.emFila}</span>
                    <span className="sub-count-label">Em fila</span>
                </div>
                <div className="sub-count-item">
                    <span className="sub-count-number auditados">{subCounts.auditados}</span>
                    <span className="sub-count-label">Auditados</span>
                </div>
                <div className="sub-count-item">
                    <span className="sub-count-number alta-replan">{subCounts.altaReplan}</span>
                    <span className="sub-count-label">Alta Replanejada</span>
                </div>
            </div>
            <button className="review-card-button" onClick={onClick}>
                Ver Detalhes &gt;
            </button>
        </div>
    );

    return (
        <div className="page-container">
            <AppHeader
                title={title}
                subtitle={subtitle}
                onBack={onBack}
            />
            <div className="review-cards-container">
                 <ReviewCard 
                    title="Revisão diária 24h" 
                    badgeText="Criticidade 1" 
                    totalCount={reviewStats.daily.total}
                    subCounts={reviewStats.daily}
                    theme="blue" 
                    onClick={() => handleSelectReview(['Diário 24h'])} 
                 />
                 <ReviewCard 
                    title="Revisão em 48h" 
                    badgeText="Criticidade 2" 
                    totalCount={reviewStats.h48.total}
                    subCounts={reviewStats.h48}
                    theme="orange" 
                    onClick={() => handleSelectReview(['48h'])} 
                 />
                 <ReviewCard 
                    title="Revisão em 72h" 
                    badgeText="Criticidade 3" 
                    totalCount={reviewStats.h72.total}
                    subCounts={reviewStats.h72}
                    theme="green" 
                    onClick={() => handleSelectReview(['72h'])} 
                 />
            </div>

            <div className="filter-bar" style={{ marginTop: '24px', marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: '1px solid var(--border-color)' }}>
                <div className="filter-controls">
                    <div className="form-group">
                        <label>Portal do tempo (Data IH):</label>
                        <input type="date" value={tempDateFilter} onChange={(e) => setTempDateFilter(e.target.value)} />
                    </div>
                    <div className="form-group" ref={hospitalDropdownRef}>
                        <label>Hosp. Destino:</label>
                        <div className="multi-select-dropdown">
                            <button type="button" className="multi-select-dropdown-button" onClick={() => setIsHospitalDropdownOpen(prev => !prev)}>
                                {tempHospitalFilter.length === 0 ? 'Todos' : tempHospitalFilter.length === 1 ? tempHospitalFilter[0] : `${tempHospitalFilter.length} selecionados`}
                            </button>
                            {isHospitalDropdownOpen && (
                                <div className="multi-select-dropdown-menu">
                                    {uniqueHospitals.map(h => (
                                        <label key={h} className="multi-select-dropdown-item">
                                            <input type="checkbox" checked={tempHospitalFilter.includes(h)} onChange={() => handleHospitalMultiChange(h)} /> {h}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="form-group" ref={guiaDropdownRef}>
                        <label>Status da Guia:</label>
                        <div className="multi-select-dropdown">
                            <button type="button" className="multi-select-dropdown-button" onClick={() => setIsGuiaDropdownOpen(prev => !prev)}>
                                {tempGuiaStatusFilter.length === 0 ? 'Todos' : tempGuiaStatusFilter.length === 1 ? tempGuiaStatusFilter[0] : `${tempGuiaStatusFilter.length} selecionados`}
                            </button>
                            {isGuiaDropdownOpen && (
                                <div className="multi-select-dropdown-menu">
                                    {guiaStatuses.map(s => (
                                        <label key={s} className="multi-select-dropdown-item">
                                            <input type="checkbox" checked={tempGuiaStatusFilter.includes(s)} onChange={() => handleGuiaStatusMultiChange(s)} /> {s}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="form-group" ref={tarefaDropdownRef}>
                        <label>Tarefa:</label>
                        <div className="multi-select-dropdown">
                            <button type="button" className="multi-select-dropdown-button" onClick={() => setIsTarefaDropdownOpen(prev => !prev)}>
                                {tempTaskStatusFilter.length === 0 ? 'Todos' : tempTaskStatusFilter.length === 1 ? tempTaskStatusFilter[0] : `${tempTaskStatusFilter.length} selecionados`}
                            </button>
                            {isTarefaDropdownOpen && (
                                <div className="multi-select-dropdown-menu">
                                    {taskStatuses.map(s => (
                                        <label key={s} className="multi-select-dropdown-item">
                                            <input type="checkbox" checked={tempTaskStatusFilter.includes(s)} onChange={() => handleTaskStatusMultiChange(s)} /> {s}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="filter-actions">
                    <button onClick={handleClearFilters} className="secondary-action-button">Limpar</button>
                    <button onClick={handleApplyFilters} className="save-button">Aplicar</button>
                </div>
            </div>

            <div className="table-container no-top-radius">
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
                                            <input
                                                type="date"
                                                className="table-input-date"
                                                value={p.altaFim || ''}
                                                onChange={(e) => handleAltaFimChange(p.id, e.target.value)}
                                            />
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

export default MapaInternacao;