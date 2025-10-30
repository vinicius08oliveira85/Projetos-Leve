import React, { useState, useMemo } from 'https://aistudiocdn.com/react@^19.2.0';
import { Patient, User } from '../types/index.ts';
import { formatDateDdMmYy, calculateDaysWaiting } from '../utils/helpers.ts';
import AppHeader from '../components/AppHeader.tsx';

type DesospitalizacaoFilter = 'Todos' | 'Sim' | 'Não';

const PacientesAguardandoDesospitalizacao = ({ onBack, onViewDetails, user, patients, onSavePatients, showToast }: {
    onBack: () => void,
    onViewDetails: (patient: Patient) => void,
    user: User,
    patients: Patient[],
    onSavePatients: (patients: Patient[], user: User) => void,
    showToast: (message: string) => void
}) => {
    
    const [editedPatients, setEditedPatients] = useState<Record<number, Partial<Patient>>>({});
    const [filters, setFilters] = useState({
        aguardaAntibioticoTerapia: 'Todos' as DesospitalizacaoFilter,
        aguardaCurativoDomiciliar: 'Todos' as DesospitalizacaoFilter,
        aguardaOxigenioTerapia: 'Todos' as DesospitalizacaoFilter,
        aguardaHomeCare: 'Todos' as DesospitalizacaoFilter,
        aguardaPedido: 'Todos' as DesospitalizacaoFilter,
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value as DesospitalizacaoFilter }));
    };

    const desospitalizacaoPatients = useMemo(() => patients
        .filter(p => p.esperas.desospitalizacao)
        .filter(p => {
            const details = p.esperaDesospitalizacaoDetalhes;
            if (filters.aguardaAntibioticoTerapia !== 'Todos' && (details?.aguardaAntibioticoTerapia || 'Não') !== filters.aguardaAntibioticoTerapia) return false;
            if (filters.aguardaCurativoDomiciliar !== 'Todos' && (details?.aguardaCurativoDomiciliar || 'Não') !== filters.aguardaCurativoDomiciliar) return false;
            if (filters.aguardaOxigenioTerapia !== 'Todos' && (details?.aguardaOxigenioTerapia || 'Não') !== filters.aguardaOxigenioTerapia) return false;
            if (filters.aguardaHomeCare !== 'Todos' && (details?.aguardaHomeCare || 'Não') !== filters.aguardaHomeCare) return false;
            if (filters.aguardaPedido !== 'Todos' && (details?.aguardaPedido || 'Não') !== filters.aguardaPedido) return false;
            return true;
        }), [patients, filters]);
    

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

    const filterFields: { key: keyof typeof filters; label: string }[] = [
        { key: 'aguardaAntibioticoTerapia', label: 'Aguarda Antibiótico terapia' },
        { key: 'aguardaCurativoDomiciliar', label: 'Aguarda Curativo domiciliar' },
        { key: 'aguardaOxigenioTerapia', label: 'Aguarda Oxigênio terapia' },
        { key: 'aguardaHomeCare', label: 'Aguarda Home Care' },
        { key: 'aguardaPedido', label: 'Aguarda Pedido' },
    ];

    return (
        <div className="page-container">
            <AppHeader
                title="Pacientes aguardando Desospitalização"
                subtitle="Lista dos pacientes que aguardam por desospitalização."
                onBack={onBack}
            />

            <div className="content-box" style={{ marginTop: '20px' }}>
                <h2 className="section-title-box">Espera Desospitalização</h2>
                <div className="espera-desospitalizacao-grid">
                    {filterFields.map(field => (
                        <div className="form-group form-group-highlight" key={field.key}>
                            <label>{field.label}</label>
                            <select name={field.key} value={filters[field.key]} onChange={handleFilterChange}>
                                <option value="Todos">Todos</option>
                                <option value="Sim">Sim</option>
                                <option value="Não">Não</option>
                            </select>
                        </div>
                    ))}
                </div>
            </div>

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
                            <th>Aguardando Desospitalização</th>
                            <th>Desde Desospitalização</th>
                            <th>Dias de espera</th>
                            <th>Leito auditado</th>
                            <th>Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {desospitalizacaoPatients.map(p => {
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
                                            <input
                                                type="text"
                                                className="table-input-text"
                                                value={patientData.aguardandoDesospitalizacao || ''}
                                                placeholder="Ver tipos no sistema"
                                                onChange={(e) => handleFieldChange(p.id, 'aguardandoDesospitalizacao', e.target.value)}
                                            />
                                        ) : (
                                            patientData.aguardandoDesospitalizacao || 'N/A'
                                        )}
                                    </td>
                                    <td>
                                        {user.role === 'admin' ? (
                                            <input
                                                type="date"
                                                className="table-input-date"
                                                value={patientData.desdeDesospitalizacao || ''}
                                                onChange={(e) => handleFieldChange(p.id, 'desdeDesospitalizacao', e.target.value)}
                                            />
                                        ) : (
                                            formatDateDdMmYy(patientData.desdeDesospitalizacao)
                                        )}
                                    </td>
                                    <td>{calculateDaysWaiting(patientData.desdeDesospitalizacao)}</td>
                                    <td>{patientData.leitoAuditado}</td>
                                    <td>
                                        <button className="icon-button" onClick={() => onViewDetails(p)} aria-label={`Detalhes da Espera de Desospitalização de ${p.nome}`}>
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

export default PacientesAguardandoDesospitalizacao;