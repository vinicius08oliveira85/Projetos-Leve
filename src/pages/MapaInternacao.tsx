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
    'Revisão Padrão': '0',
    'Diário 24h': '1',
    '48h': '2',
    '72h': '3',
};
const criticidadeValueMap: { [key: string]: Patient['criticidade'] } = {
    '0': 'Revisão Padrão',
    '1': 'Diário 24h',
    '2': '48h',
    '3': '72h',
};

const LeitoModal = ({ patient: initialPatient, user, onClose, onSave }: {
    patient: Patient;
    user: User;
    onClose: () => void;
    onSave: (updatedPatient: Patient, user: User) => void;
}) => {
    const [patient, setPatient] = useState<Patient>(initialPatient);

    const handleSaveClick = () => {
        onSave(patient, user);
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


const MapaInternacao = ({ onBack, user, patients, onSelectPatient, onSavePatient, onSavePatients, title, subtitle, showToast }: { 
    onBack: () => void, 
    user: User, 
    patients: Patient[], 
    onSelectPatient: (patient: Patient) => void,
    onSavePatient: (patient: Patient, user: User) => void,
    onSavePatients: (patients: Patient[], user: User) => void,
    title: string;
    subtitle: string;
    showToast: (message: string, type?: 'success' | 'error') => void;
}) => {
    const [criticidadeFilter, setCriticidadeFilter] = useState<Patient['criticidade'][] | null>(null);
    const [editingLeitoPatient, setEditingLeitoPatient] = useState<Patient | null>(null);
    const [editedPatients, setEditedPatients] = useState<Record<number, Partial<Patient>>>({});

    // Applied filters
    const [dateFilter, setDateFilter] = useState<string>('');
    const [hospitalFilter, setHospitalFilter] = useState<string[]>([]);
    const [guiaStatusFilter, setGuiaStatusFilter] = useState<GuiaStatus[]>([]);
    const [patientStatusFilter, setPatientStatusFilter] = useState<'Internados' | 'Com Alta'>('Internados');
    const [statusFilter, setStatusFilter] = useState<'Todos' | 'Auditado' | 'Em Fila'>('Todos');
    const [altaReplanFilter, setAltaReplanFilter] = useState<'Todos' | 'Atrasado' | 'Sem atraso'>('Todos');
    const [nameSearch, setNameSearch] = useState('');


    // Temporary filters for UI
    const [tempDateFilter, setTempDateFilter] = useState(dateFilter);
    const [tempHospitalFilter, setTempHospitalFilter] = useState(hospitalFilter);
    const [tempGuiaStatusFilter, setTempGuiaStatusFilter] = useState(guiaStatusFilter);
    const [tempPatientStatusFilter, setTempPatientStatusFilter] = useState(patientStatusFilter);
    const [tempStatusFilter, setTempStatusFilter] = useState(statusFilter);
    const [tempAltaReplanFilter, setTempAltaReplanFilter] = useState(altaReplanFilter);

    
    // Dropdown visibility
    const [isHospitalDropdownOpen, setIsHospitalDropdownOpen] = useState(false);
    const [isGuiaDropdownOpen, setIsGuiaDropdownOpen] = useState(false);

    const hospitalDropdownRef = useRef<HTMLDivElement>(null);
    const guiaDropdownRef = useRef<HTMLDivElement>(null);

    const uniqueHospitals = useMemo(() => [...new Set(patients.map(p => p.hospitalDestino))], [patients]);
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
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const reviewStats = useMemo(() => {
        const stats = {
            padrao: { total: 0, emFila: 0, auditados: 0, altaReplan: 0, atrasado: 0 },
            daily: { total: 0, emFila: 0, auditados: 0, altaReplan: 0, atrasado: 0 },
            h48: { total: 0, emFila: 0, auditados: 0, altaReplan: 0, atrasado: 0 },
            h72: { total: 0, emFila: 0, auditados: 0, altaReplan: 0, atrasado: 0 },
        };
    
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
    
        patients.forEach(p => {
            if (p.altaFim) {
                return;
            }
    
            let category: keyof typeof stats | null = null;
            if (p.criticidade === 'Revisão Padrão') category = 'padrao';
            else if (p.criticidade === 'Diário 24h') category = 'daily';
            else if (p.criticidade === '48h') category = 'h48';
            else if (p.criticidade === '72h') category = 'h72';
    
            if (category) {
                if (p.altaReplan) {
                    stats[category].altaReplan++;
                }
    
                const getCriticidadeDays = (criticidade: Patient['criticidade']): number => {
                    switch (criticidade) {
                        case 'Diário 24h': return 1;
                        case '48h': return 2;
                        case '72h': return 3;
                        default: return Infinity;
                    }
                };
    
                const criticidadeDays = getCriticidadeDays(p.criticidade);

                if (criticidadeDays === Infinity) { // Handle 'Revisão Padrão'
                    const hasAuditToday = (p.leitoHistory || []).some(h => {
                        const recordDate = new Date(h.date);
                        recordDate.setUTCHours(0, 0, 0, 0);
                        return recordDate.getTime() === today.getTime();
                    });
                    if (hasAuditToday) {
                        stats[category].auditados++;
                    } else {
                        stats[category].emFila++;
                    }
                } else { // Handle time-based criticidade
                    const relevantHistory = (p.leitoHistory || []);
                    const sortedHistory = relevantHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    const lastAuditDateStr = sortedHistory.length > 0 ? sortedHistory[0].date : p.dataIH;
                    
                    const lastAuditDate = new Date(lastAuditDateStr);
                    lastAuditDate.setUTCHours(0, 0, 0, 0);
    
                    const diffMilliseconds = today.getTime() - lastAuditDate.getTime();
                    const diffDays = Math.floor(diffMilliseconds / (1000 * 60 * 60 * 24));
    
                    if (diffDays < criticidadeDays) {
                        stats[category].auditados++;
                    } else if (diffDays === criticidadeDays) {
                        stats[category].emFila++;
                    } else { // diffDays > criticidadeDays
                        stats[category].atrasado++;
                    }
                }
            }
        });
    
        Object.keys(stats).forEach(key => {
            const cat = key as keyof typeof stats;
            stats[cat].total = stats[cat].emFila + stats[cat].auditados + stats[cat].atrasado;
        });
    
        return stats;
    }, [patients]);
    
    const filteredPatients = useMemo(() => {
        return patients
            .filter(p => {
                const criticidadeMatch = !criticidadeFilter || criticidadeFilter.includes(p.criticidade);
                const dateMatch = !dateFilter || p.dataIH === dateFilter;
                const hospitalMatch = hospitalFilter.length === 0 || hospitalFilter.includes(p.hospitalDestino);
                const guiaStatusMatch = guiaStatusFilter.length === 0 || guiaStatusFilter.includes(p.status);
                const patientStatusMatch = patientStatusFilter === 'Internados' ? !p.altaFim : !!p.altaFim;
                
                const isAtrasado = !!p.altaReplan;
                const isAuditado = !!p.leitoAuditado;
                const primaryStatus = isAuditado ? 'Auditado' : 'Em Fila';

                const statusMatch = statusFilter === 'Todos' || primaryStatus === statusFilter;
                const altaReplanMatch = altaReplanFilter === 'Todos' ||
                    (altaReplanFilter === 'Atrasado' && isAtrasado) ||
                    (altaReplanFilter === 'Sem atraso' && !isAtrasado);
                
                const nameMatch = nameSearch === '' || p.nome.toLowerCase().includes(nameSearch.toLowerCase());

                return criticidadeMatch && dateMatch && hospitalMatch && guiaStatusMatch && patientStatusMatch && statusMatch && altaReplanMatch && nameMatch;
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
    }, [patients, criticidadeFilter, dateFilter, hospitalFilter, guiaStatusFilter, patientStatusFilter, statusFilter, altaReplanFilter, nameSearch]);

    const handleSelectReview = (criticidade: Patient['criticidade'][]) => {
        if (JSON.stringify(criticidadeFilter) === JSON.stringify(criticidade)) {
            setCriticidadeFilter(null);
        } else {
            setCriticidadeFilter(criticidade);
        }
    };
    
    const handleSaveLeito = (updatedPatient: Patient, user: User) => {
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
                        diario: `Log de Leito: Atualizado registro da data ${formatDateDdMmYy(updatedRecord.date)} - Leito do Dia: de '${originalRecord.leitoDoDia}' para '${updatedRecord.leitoDoDia}'.`
                    });
                }
            }
        });

        const finalPatient = {
            ...updatedPatient,
            historico: [...(updatedPatient.historico || []), ...newHistoryEntries]
        };

        onSavePatient(finalPatient, user);
        setEditingLeitoPatient(null);
    };

    const handleAltaFimChange = (patientId: number, newDate: string) => {
        const changes: Partial<Patient> = { altaFim: newDate };
        if (!newDate) {
            changes.motivoAlta = '';
        }
        setEditedPatients(prev => ({
            ...prev,
            [patientId]: { ...prev[patientId], ...changes }
        }));
    };

    const handleMotivoAltaChange = (patientId: number, newMotivo: string) => {
        setEditedPatients(prev => ({
            ...prev,
            [patientId]: { ...prev[patientId], motivoAlta: newMotivo }
        }));
    };

    const handleCriticidadeChange = (patientId: number, newValue: string) => {
        const newCriticidade = criticidadeValueMap[newValue];
        setEditedPatients(prev => ({
            ...prev,
            [patientId]: { ...prev[patientId], criticidade: newCriticidade }
        }));
    };
    
    const handleApplyFilters = () => {
        setDateFilter(tempDateFilter);
        setHospitalFilter(tempHospitalFilter);
        setGuiaStatusFilter(tempGuiaStatusFilter);
        setPatientStatusFilter(tempPatientStatusFilter);
        setStatusFilter(tempStatusFilter);
        setAltaReplanFilter(tempAltaReplanFilter);
    };
    
    const handleClearFilters = () => {
        setTempDateFilter('');
        setTempHospitalFilter([]);
        setTempGuiaStatusFilter([]);
        setTempPatientStatusFilter('Internados');
        setTempStatusFilter('Todos');
        setTempAltaReplanFilter('Todos');
        
        setDateFilter('');
        setHospitalFilter([]);
        setGuiaStatusFilter([]);
        setPatientStatusFilter('Internados');
        setStatusFilter('Todos');
        setAltaReplanFilter('Todos');
        setNameSearch('');
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
    
    const handleSaveAllChanges = () => {
        let validationFailed = false;

        const updatedPatientsList: Patient[] = [];

        for (const patientIdStr in editedPatients) {
            const patientId = Number(patientIdStr);
            const changes = editedPatients[patientIdStr];
            const originalPatient = patients.find(p => p.id === patientId)!;
            
            const finalData = { ...originalPatient, ...changes };

            if (finalData.altaFim && !finalData.motivoAlta) {
                showToast(`Para o paciente ${finalData.nome}, o Motivo da Alta é obrigatório.`, 'error');
                validationFailed = true;
                break;
            }
            updatedPatientsList.push(finalData);
        }

        if (validationFailed) {
            return;
        }

        if (updatedPatientsList.length > 0) {
            onSavePatients(updatedPatientsList, user);
        }

        setEditedPatients({});
        showToast('Alterações salvas com sucesso!');
    };


    const ReviewCard = ({ title, badgeText, totalCount, subCounts, theme, onClick, isActive }: { 
        title: string; 
        badgeText: string; 
        totalCount: number; 
        subCounts: { emFila: number; auditados: number; altaReplan: number; atrasado: number; };
        theme: string; 
        onClick: () => void;
        isActive: boolean;
    }) => (
        <div className={`review-card theme-${theme} ${isActive ? 'active' : ''}`} onClick={onClick}>
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
                    <span className="sub-count-number atrasado">{subCounts.atrasado}</span>
                    <span className="sub-count-label">Atrasado</span>
                </div>
                <div className="sub-count-item">
                    <span className="sub-count-number alta-replan">{subCounts.altaReplan}</span>
                    <span className="sub-count-label">Alta Replan</span>
                </div>
            </div>
            <div className="review-card-button">
                Ver Detalhes &gt;
            </div>
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
                    title="Revisão Padrão" 
                    badgeText="Criticidade 0" 
                    totalCount={reviewStats.padrao.total}
                    subCounts={reviewStats.padrao}
                    theme="purple" 
                    onClick={() => handleSelectReview(['Revisão Padrão'])} 
                    isActive={JSON.stringify(criticidadeFilter) === JSON.stringify(['Revisão Padrão'])}
                 />
                 <ReviewCard 
                    title="Revisão diária 24h" 
                    badgeText="Criticidade 1" 
                    totalCount={reviewStats.daily.total}
                    subCounts={reviewStats.daily}
                    theme="blue" 
                    onClick={() => handleSelectReview(['Diário 24h'])}
                    isActive={JSON.stringify(criticidadeFilter) === JSON.stringify(['Diário 24h'])}
                 />
                 <ReviewCard 
                    title="Revisão em 48h" 
                    badgeText="Criticidade 2" 
                    totalCount={reviewStats.h48.total}
                    subCounts={reviewStats.h48}
                    theme="orange" 
                    onClick={() => handleSelectReview(['48h'])}
                    isActive={JSON.stringify(criticidadeFilter) === JSON.stringify(['48h'])}
                 />
                 <ReviewCard 
                    title="Revisão em 72h" 
                    badgeText="Criticidade 3" 
                    totalCount={reviewStats.h72.total}
                    subCounts={reviewStats.h72}
                    theme="green" 
                    onClick={() => handleSelectReview(['72h'])}
                    isActive={JSON.stringify(criticidadeFilter) === JSON.stringify(['72h'])}
                 />
            </div>

            <div className="filter-bar" style={{ marginTop: '20px', marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: '1px solid var(--border-color)', flexDirection: 'column', alignItems: 'stretch', gap: '16px'}}>
                <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px'}}>
                    <div className="filter-controls">
                         <div className="form-group">
                            <label>Status do Paciente:</label>
                            <select value={tempPatientStatusFilter} onChange={(e) => setTempPatientStatusFilter(e.target.value as any)}>
                                <option value="Internados">Internados</option>
                                <option value="Com Alta">Com Alta</option>
                            </select>
                        </div>
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
                        <div className="form-group">
                            <label>Status:</label>
                            <select value={tempStatusFilter} onChange={(e) => setTempStatusFilter(e.target.value as any)}>
                                <option value="Todos">Todos</option>
                                <option value="Auditado">Auditado</option>
                                <option value="Em Fila">Em Fila</option>
                            </select>
                        </div>
                         <div className="form-group">
                            <label>Alta Replan:</label>
                            <select value={tempAltaReplanFilter} onChange={(e) => setTempAltaReplanFilter(e.target.value as any)}>
                                <option value="Todos">Todos</option>
                                <option value="Atrasado">Atrasado</option>
                                <option value="Sem atraso">Sem atraso</option>
                            </select>
                        </div>
                    </div>
                    <div className="filter-actions">
                        <button onClick={handleClearFilters} className="secondary-action-button">Limpar</button>
                        <button onClick={handleApplyFilters} className="save-button">Aplicar Filtros</button>
                        <button onClick={handleSaveAllChanges} className="save-button" disabled={Object.keys(editedPatients).length === 0}>Salvar Alterações</button>
                    </div>
                </div>
                 <div>
                    <div className="form-group">
                        <label>Buscar por Nome:</label>
                        <input
                            type="text"
                            placeholder="Digite o nome do paciente (busca automática)"
                            value={nameSearch}
                            onChange={(e) => setNameSearch(e.target.value)}
                            style={{width: '100%'}}
                        />
                    </div>
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
                            <th>Data da Alta</th>
                            <th>Motivo da Alta</th>
                            <th>Permanência</th>
                            <th>Criticidade</th>
                            <th>Hospital Destino</th>
                            <th>Leito do dia</th>
                            <th>Natureza da Guia</th>
                            <th>Status da Guia</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.map(p => {
                            const editedData = editedPatients[p.id] || {};
                            const patientData = { ...p, ...editedData };
                            
                            const today = new Date();
                            today.setUTCHours(0, 0, 0, 0);

                            let statusText: 'Atrasado' | 'Auditado' | 'Em Fila' | null = null;
                            let badgeClass: 'atrasado' | 'auditado' | 'em-fila' | null = null;

                            if (!patientData.altaFim) { // Only calculate for internados patients
                                const getCriticidadeDays = (criticidade: Patient['criticidade']): number => {
                                    switch (criticidade) {
                                        case 'Diário 24h': return 1;
                                        case '48h': return 2;
                                        case '72h': return 3;
                                        default: return Infinity;
                                    }
                                };

                                const criticidadeDays = getCriticidadeDays(patientData.criticidade);

                                if (criticidadeDays === Infinity) { // Revisão Padrão
                                    const hasAuditToday = (patientData.leitoHistory || []).some(h => {
                                        const recordDate = new Date(h.date);
                                        recordDate.setUTCHours(0, 0, 0, 0);
                                        return recordDate.getTime() === today.getTime();
                                    });
                                    if (hasAuditToday) {
                                        statusText = 'Auditado';
                                        badgeClass = 'auditado';
                                    } else {
                                        statusText = 'Em Fila';
                                        badgeClass = 'em-fila';
                                    }
                                } else { // Time-based criticidade
                                    const relevantHistory = (patientData.leitoHistory || []);
                                    const sortedHistory = relevantHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                    const lastAuditDateStr = sortedHistory.length > 0 ? sortedHistory[0].date : patientData.dataIH;
                                    
                                    const lastAuditDate = new Date(lastAuditDateStr);
                                    lastAuditDate.setUTCHours(0, 0, 0, 0);

                                    const diffMilliseconds = today.getTime() - lastAuditDate.getTime();
                                    const diffDays = Math.floor(diffMilliseconds / (1000 * 60 * 60 * 24));

                                    if (diffDays < criticidadeDays) {
                                        statusText = 'Auditado';
                                        badgeClass = 'auditado';
                                    } else if (diffDays === criticidadeDays) {
                                        statusText = 'Em Fila';
                                        badgeClass = 'em-fila';
                                    } else { // diffDays > criticidadeDays
                                        statusText = 'Atrasado';
                                        badgeClass = 'atrasado';
                                    }
                                }
                            }

                            const latestLeitoRecord = [...(patientData.leitoHistory || [])]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                            const leitoDoDia = latestLeitoRecord ? latestLeitoRecord.leitoDoDia : patientData.leitoAdmissao;
                            
                            return (
                                <tr key={p.id}>
                                    <td>
                                        <button className="icon-button" onClick={() => onSelectPatient(p)} aria-label={`Detalhes de ${p.nome}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        </button>
                                    </td>
                                    <td>{patientData.guia}</td>
                                    <td>{patientData.nome}</td>
                                    <td>{formatDateDdMmYy(patientData.dataIH)}</td>
                                    <td>
                                        {user.role === 'admin' ? (
                                            <div className="date-input-wrapper">
                                                <input
                                                    type="date"
                                                    className="table-input-date"
                                                    value={patientData.altaFim || ''}
                                                    onChange={(e) => handleAltaFimChange(p.id, e.target.value)}
                                                />
                                                {patientData.altaFim && (
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
                                            formatDateDdMmYy(patientData.altaFim)
                                        )}
                                    </td>
                                    <td>
                                        {user.role === 'admin' ? (
                                            <select
                                                className="table-select"
                                                value={patientData.motivoAlta || ''}
                                                onChange={(e) => handleMotivoAltaChange(p.id, e.target.value)}
                                                disabled={!patientData.altaFim}
                                            >
                                                <option value="" disabled>Selecione</option>
                                                {motivoAltaOptions.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            patientData.motivoAlta || 'N/A'
                                        )}
                                    </td>
                                    <td>{calculatePermanencia(patientData.dataIH, patientData.altaFim)}</td>
                                    <td>
                                        <select
                                            className="table-select"
                                            value={criticidadeDisplayMap[patientData.criticidade]}
                                            onChange={(e) => handleCriticidadeChange(p.id, e.target.value)}
                                            style={patientData.criticidade === 'Revisão Padrão' ? {} : { color: 'var(--status-red-text)', fontWeight: 'bold' }}
                                            disabled={user.role !== 'admin'}
                                        >
                                            <option value="0">0</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                        </select>
                                    </td>
                                    <td>{patientData.hospitalDestino}</td>
                                    <td>
                                        <button className="leito-cell-button" onClick={() => setEditingLeitoPatient(p)}>
                                            {leitoDoDia}
                                        </button>
                                    </td>
                                    <td>{patientData.natureza}</td>
                                    <td><span className={`status-badge ${statusToClassName(patientData.status)}`}>{patientData.status}</span></td>
                                    <td>
                                        {statusText && badgeClass ? (
                                            <span className={`task-status-badge ${badgeClass}`}>
                                                {statusText}
                                            </span>
                                        ) : (
                                            <span>-</span>
                                        )}
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