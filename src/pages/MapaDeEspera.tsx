import React, { useState, useMemo } from 'react';
import { Patient, User, Esperas } from '../types/index.ts';
import AppHeader from '../components/AppHeader.tsx';
import { formatDateDdMmYy } from '../utils/helpers.ts';

const criticidadeDisplayMap: { [key in Patient['criticidade']]: string } = {
    'Revisão Padrão': '0',
    'Diário 24h': '1',
    '48h': '2',
    '72h': '3',
};

const MapaDeEspera = ({ onBack, onSelectPatient, user, patients, onSavePatients, showToast, title, subtitle, onViewDetails }: { 
    onBack: () => void, 
    onSelectPatient: (patient: Patient) => void, 
    user: User, 
    patients: Patient[], 
    onSavePatients: (patients: Patient[], user: User) => void, 
    showToast: (message: string) => void, 
    title: string, 
    subtitle: string, 
    onViewDetails: (esperaType: keyof Esperas) => void 
}) => {
    const [hospitalFilter, setHospitalFilter] = useState('Todos');
    const [leitoFilter, setLeitoFilter] = useState('Todos');

    const esperaCounts = useMemo(() => {
        return patients.reduce((acc, p) => {
            if (p.esperas.cirurgia) acc.cirurgia++;
            if (p.esperas.exame) acc.exame++;
            if (p.esperas.parecer) acc.parecer++;
            if (p.esperas.desospitalizacao) acc.desospitalizacao++;
            return acc;
        }, { cirurgia: 0, exame: 0, parecer: 0, desospitalizacao: 0 });
    }, [patients]);

    const uniqueHospitals = useMemo(() => ['Todos', ...new Set(patients.map(p => p.hospitalDestino))], [patients]);
    const leitos = ['Todos', 'CTI', 'CTI PED', 'CTI NEO', 'USI', 'USI PED', 'UI', 'UI PSQ'];

    const filteredPatients = useMemo(() => {
        return patients.filter(p => {
            const hospitalMatch = hospitalFilter === 'Todos' || p.hospitalDestino === hospitalFilter;
            const leitoMatch = leitoFilter === 'Todos' || p.leitoHoje === leitoFilter;

            if (!hospitalMatch || !leitoMatch) {
                return false;
            }
            
            return p.esperas.cirurgia || p.esperas.exame || p.esperas.parecer || p.esperas.desospitalizacao;
        });
    }, [patients, hospitalFilter, leitoFilter]);
    
    const EsperaCard = ({ title, count, type }: { title: string, count: number, type: keyof Esperas }) => (
        <div className="espera-card">
            <h3>{title}</h3>
            <div className="count">{count}</div>
            <button className="details-button" onClick={() => onViewDetails(type)} aria-label={`Ver detalhes de ${title}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
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
            <div className="content-box">
                <h2 className="section-title-box">Pacientes em espera</h2>
                <div className="espera-cards-container">
                    <EsperaCard title="Cirurgia" count={esperaCounts.cirurgia} type="cirurgia" />
                    <EsperaCard title="Exame" count={esperaCounts.exame} type="exame" />
                    <EsperaCard title="Parecer" count={esperaCounts.parecer} type="parecer" />
                    <EsperaCard title="Desospitalização" count={esperaCounts.desospitalizacao} type="desospitalizacao" />
                </div>
            </div>

            <div className="espera-filter-bar">
                <h2 className="section-title">Visão Geral de Esperas</h2>
                <div className="filter-controls">
                    <div className="form-group">
                        <label>Hospital IH:</label>
                        <select value={hospitalFilter} onChange={(e) => setHospitalFilter(e.target.value)}>
                            {uniqueHospitals.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Leito:</label>
                        <select value={leitoFilter} onChange={(e) => setLeitoFilter(e.target.value)}>
                            {leitos.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            <div className="table-container no-top-radius">
                 <table className="patient-table">
                    <thead>
                        <tr>
                            <th>HOSPITAL IH</th>
                            <th>PACIENTE</th>
                            <th>DETALHES</th>
                            <th>CRITICIDADE</th>
                            <th>LEITO</th>
                            <th>TIPO</th>
                            <th>INTERNAÇÃO</th>
                            <th>PREVISÃO DE ALTA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.map(p => {
                            return (
                                <tr key={p.id}>
                                    <td>{p.hospitalDestino}</td>
                                    <td>{p.nome}</td>
                                    <td>
                                        <button className="icon-button" onClick={() => onSelectPatient(p)} aria-label={`Detalhes de ${p.nome}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        </button>
                                    </td>
                                    <td>
                                        <span style={p.criticidade === 'Revisão Padrão' ? {} : { color: 'var(--status-red-text)', fontWeight: 'bold' }}>
                                            {criticidadeDisplayMap[p.criticidade]}
                                        </span>
                                    </td>
                                    <td>{p.leitoHoje}</td>
                                    <td>{p.tipoInternacao}</td>
                                    <td>{formatDateDdMmYy(p.dataIH)}</td>
                                    <td>{formatDateDdMmYy(p.altaPrev)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MapaDeEspera;