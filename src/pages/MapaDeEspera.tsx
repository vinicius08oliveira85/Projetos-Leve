import React, { useState, useMemo } from 'react';
import { Patient, User, Esperas, EsperaCirurgiaDetalhes, EsperaExameDetalhes, EsperaParecerDetalhes, EsperaDesospitalizacaoDetalhes } from '../types/index.ts';
import AppHeader from '../components/AppHeader.tsx';
import { formatDateDdMmYy, calculateDaysWaiting, calculateDaysBetween } from '../utils/helpers.ts';

const criticidadeDisplayMap: { [key in Patient['criticidade']]: string } = {
    'Revisão Padrão': '0',
    'Diário 24h': '1',
    '48h': '2',
    '72h': '3',
};

// --- Modal Components ---
const DetalhesEsperaCirurgiaModal = ({ patient, onClose, user, onUpdatePatient, showToast }: {
    patient: Patient;
    onClose: () => void;
    user: User;
    onUpdatePatient: (patient: Patient, user: User) => void;
    showToast: (message: string) => void;
}) => {
    const [details, setDetails] = useState<EsperaCirurgiaDetalhes>(patient.esperaCirurgiaDetalhes || {});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const updatedPatient = {
            ...patient,
            esperaCirurgiaDetalhes: details
        };
        onUpdatePatient(updatedPatient, user);
        showToast('Alterações salvas com sucesso!');
        onClose();
    };

    const tempoEspera = useMemo(() => calculateDaysBetween(details.dataInicio, details.dataFim), [details.dataInicio, details.dataFim]);

    const historyData = useMemo(() => {
        const stages = [
            { label: 'Aguardando Envio do Pedido', start: details.dataInicio, end: details.envioPedido },
            { label: 'Aguardando Solicitação OPME', start: details.envioPedido, end: details.opmeSolicitado },
            { label: 'Aguardando Recebimento OPME', start: details.opmeSolicitado, end: details.opmeRecebido },
            { label: 'Aguardando Agendamento', start: details.opmeRecebido, end: details.dataAgendamento },
            { label: 'Aguardando Realização', start: details.dataAgendamento, end: details.dataRealizacao },
            { label: 'Aguardando Finalização', start: details.dataRealizacao, end: details.dataFim },
        ];

        return stages
            .filter(stage => stage.start && stage.end)
            .map(stage => ({
                status: stage.label,
                startDate: stage.start!,
                endDate: stage.end!,
                duration: calculateDaysBetween(stage.start, stage.end),
            }));
    }, [details]);

    return (
        <div className="modal-overlay">
            <div className="leito-modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="leito-modal-header">
                    <h3>Detalhes da Espera de Cirurgia</h3>
                    <button onClick={onClose} className="leito-modal-close-btn">&times;</button>
                </div>
                <div className="leito-modal-body" style={{ marginTop: '20px' }}>
                     <fieldset>
                        <legend>Espera Cirurgia</legend>
                        <div className="espera-cirurgia-grid">
                            <div className="form-group form-group-highlight">
                                <label>Data Início Espera Cirurgia</label>
                                <input type="date" name="dataInicio" value={details.dataInicio || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Envio do Pedido</label>
                                <input type="date" name="envioPedido" value={details.envioPedido || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Aguarda OPME</label>
                                <select name="aguardaOPME" value={details.aguardaOPME || ''} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                    <option value="" disabled>Selecione</option>
                                    <option>Sim</option>
                                    <option>Não</option>
                                </select>
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>OPME Solicitado</label>
                                <input type="date" name="opmeSolicitado" value={details.opmeSolicitado || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>OPME Recebido</label>
                                <input type="date" name="opmeRecebido" value={details.opmeRecebido || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Data do Agendamento</label>
                                <input type="date" name="dataAgendamento" value={details.dataAgendamento || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Data de Realização</label>
                                <input type="date" name="dataRealizacao" value={details.dataRealizacao || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Data Fim Espera Cirurgia</label>
                                <input type="date" name="dataFim" value={details.dataFim || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Tempo de Espera Cirurgia</label>
                                <input type="text" value={tempoEspera} disabled />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset style={{ marginTop: '24px' }}>
                        <legend>Histórico de Status da Espera</legend>
                        <div className="table-container" style={{ padding: 0 }}>
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Data Início</th>
                                        <th>Data Fim</th>
                                        <th>Tempo de Atuação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyData.length > 0 ? (
                                        historyData.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.status}</td>
                                                <td>{formatDateDdMmYy(item.startDate)}</td>
                                                <td>{formatDateDdMmYy(item.endDate)}</td>
                                                <td>{item.duration}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                                                Dados insuficientes para gerar o histórico.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </fieldset>
                </div>
                <div className="modal-actions" style={{ paddingTop: '20px' }}>
                     {user.role === 'admin' ? (
                        <>
                            <button onClick={onClose} className="modal-button cancel">Cancelar</button>
                            <button onClick={handleSave} className="modal-button confirm">Salvar Alterações</button>
                        </>
                    ) : (
                         <button onClick={onClose} className="modal-button cancel">Fechar</button>
                    )}
                </div>
            </div>
        </div>
    );
};

const DetalhesEsperaExameModal = ({ patient, onClose, user, onUpdatePatient, showToast }: {
    patient: Patient;
    onClose: () => void;
    user: User;
    onUpdatePatient: (patient: Patient, user: User) => void;
    showToast: (message: string) => void;
}) => {
    const [details, setDetails] = useState<EsperaExameDetalhes>(patient.esperaExameDetalhes || {});
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };
    const handleSave = () => {
        const updatedPatient = { ...patient, esperaExameDetalhes: details };
        onUpdatePatient(updatedPatient, user);
        showToast('Alterações salvas com sucesso!');
        onClose();
    };
    const tempoEspera = useMemo(() => calculateDaysBetween(details.dataInicio, details.dataFim), [details.dataInicio, details.dataFim]);

    return (
        <div className="modal-overlay">
            <div className="leito-modal-content" style={{ maxWidth: '800px' }}>
                <div className="leito-modal-header">
                    <h3>Detalhes da Espera de Exame</h3>
                    <button onClick={onClose} className="leito-modal-close-btn">&times;</button>
                </div>
                <div className="leito-modal-body" style={{ marginTop: '20px' }}>
                    <fieldset>
                        <legend>Espera Exame</legend>
                        <div className="espera-exame-grid">
                            <div className="form-group form-group-highlight">
                                <label>Data Início</label>
                                <input type="date" name="dataInicio" value={details.dataInicio || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Envio do Pedido</label>
                                <input type="date" name="envioPedido" value={details.envioPedido || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Espera Agendamento</label>
                                <select name="esperaAgendamento" value={details.esperaAgendamento || ''} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                    <option value="" disabled>Selecione</option>
                                    <option>Sim</option>
                                    <option>Não</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Laudo</label>
                                <input type="date" name="laudo" value={details.laudo || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Laudo Liberado</label>
                                <input type="date" name="laudoLiberado" value={details.laudoLiberado || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Data Fim</label>
                                <input type="date" name="dataFim" value={details.dataFim || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group">
                                <label>Tempo de Espera</label>
                                <input type="text" value={tempoEspera} disabled />
                            </div>
                        </div>
                    </fieldset>
                </div>
                <div className="modal-actions" style={{ paddingTop: '20px' }}>
                     {user.role === 'admin' ? (
                        <>
                            <button onClick={onClose} className="modal-button cancel">Cancelar</button>
                            <button onClick={handleSave} className="modal-button confirm">Salvar Alterações</button>
                        </>
                    ) : (
                         <button onClick={onClose} className="modal-button cancel">Fechar</button>
                    )}
                </div>
            </div>
        </div>
    );
};

const DetalhesEsperaParecerModal = ({ patient, onClose, user, onUpdatePatient, showToast }: {
    patient: Patient;
    onClose: () => void;
    user: User;
    onUpdatePatient: (patient: Patient, user: User) => void;
    showToast: (message: string) => void;
}) => {
    const [details, setDetails] = useState<EsperaParecerDetalhes>(patient.esperaParecerDetalhes || {});
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };
    const handleSave = () => {
        const updatedPatient = { ...patient, esperaParecerDetalhes: details };
        onUpdatePatient(updatedPatient, user);
        showToast('Alterações salvas com sucesso!');
        onClose();
    };
    const tempoEspera = useMemo(() => calculateDaysBetween(details.dataSolicitacao, details.dataResposta), [details.dataSolicitacao, details.dataResposta]);

    return (
        <div className="modal-overlay">
            <div className="leito-modal-content" style={{ maxWidth: '600px' }}>
                <div className="leito-modal-header">
                    <h3>Detalhes da Espera de Parecer</h3>
                    <button onClick={onClose} className="leito-modal-close-btn">&times;</button>
                </div>
                <div className="leito-modal-body" style={{ marginTop: '20px' }}>
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
                                <label>Tempo de Espera</label>
                                <input type="text" value={tempoEspera} disabled />
                            </div>
                        </div>
                    </fieldset>
                </div>
                <div className="modal-actions" style={{ paddingTop: '20px' }}>
                     {user.role === 'admin' ? (
                        <>
                            <button onClick={onClose} className="modal-button cancel">Cancelar</button>
                            <button onClick={handleSave} className="modal-button confirm">Salvar Alterações</button>
                        </>
                    ) : (
                         <button onClick={onClose} className="modal-button cancel">Fechar</button>
                    )}
                </div>
            </div>
        </div>
    );
};

const DetalhesEsperaDesospitalizacaoModal = ({ patient, onClose, user, onUpdatePatient, showToast }: {
    patient: Patient;
    onClose: () => void;
    user: User;
    onUpdatePatient: (patient: Patient, user: User) => void;
    showToast: (message: string) => void;
}) => {
    const [details, setDetails] = useState<EsperaDesospitalizacaoDetalhes>(patient.esperaDesospitalizacaoDetalhes || {});
    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value as 'Sim' | 'Não' }));
    };
    const handleSave = () => {
        const updatedPatient = { ...patient, esperaDesospitalizacaoDetalhes: details };
        onUpdatePatient(updatedPatient, user);
        showToast('Alterações salvas com sucesso!');
        onClose();
    };
    const fields: { key: keyof EsperaDesospitalizacaoDetalhes; label: string }[] = [
        { key: 'aguardaAntibioticoTerapia', label: 'Aguarda Antibiótico terapia' },
        { key: 'aguardaCurativoDomiciliar', label: 'Aguarda Curativo domiciliar' },
        { key: 'aguardaOxigenioTerapia', label: 'Aguarda Oxigênio terapia' },
        { key: 'aguardaHomeCare', label: 'Aguarda Home Care' },
        { key: 'aguardaPedido', label: 'Aguarda Pedido' },
    ];

    return (
         <div className="modal-overlay">
            <div className="leito-modal-content" style={{ maxWidth: '800px' }}>
                <div className="leito-modal-header">
                    <h3>Detalhes da Espera de Desospitalização</h3>
                    <button onClick={onClose} className="leito-modal-close-btn">&times;</button>
                </div>
                <div className="leito-modal-body" style={{ marginTop: '20px' }}>
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
                </div>
                <div className="modal-actions" style={{ paddingTop: '20px' }}>
                     {user.role === 'admin' ? (
                        <>
                            <button onClick={onClose} className="modal-button cancel">Cancelar</button>
                            <button onClick={handleSave} className="modal-button confirm">Salvar Alterações</button>
                        </>
                    ) : (
                         <button onClick={onClose} className="modal-button cancel">Fechar</button>
                    )}
                </div>
            </div>
        </div>
    );
};

interface MapaDeEsperaProps {
    onBack: () => void;
    onSelectPatient: (patient: Patient) => void;
    user: User;
    patients: Patient[];
    onUpdatePatient: (patient: Patient, user: User) => void;
    onSavePatients: (patients: Patient[], user: User) => void;
    showToast: (message: string) => void;
    title: string;
    subtitle: string;
}

const MapaDeEspera = ({ onBack, onSelectPatient, user, patients, onUpdatePatient, onSavePatients, showToast, title, subtitle }: MapaDeEsperaProps) => {
    const [hospitalFilter, setHospitalFilter] = useState('Todos');
    const [leitoFilter, setLeitoFilter] = useState('Todos');
    const [activeFilter, setActiveFilter] = useState<keyof Esperas | null>(null);
    
    const [selectedSurgeryPatient, setSelectedSurgeryPatient] = useState<Patient | null>(null);
    const [selectedExamPatient, setSelectedExamPatient] = useState<Patient | null>(null);
    const [selectedParecerPatient, setSelectedParecerPatient] = useState<Patient | null>(null);
    const [selectedDesospitalizacaoPatient, setSelectedDesospitalizacaoPatient] = useState<Patient | null>(null);


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
    
    const handleCardClick = (type: keyof Esperas) => {
        setActiveFilter(prev => (prev === type ? null : type));
    };

    const filteredPatients = useMemo(() => {
        return patients.filter(p => {
            const hospitalMatch = hospitalFilter === 'Todos' || p.hospitalDestino === hospitalFilter;
            const leitoMatch = leitoFilter === 'Todos' || p.leitoHoje === leitoFilter;

            if (!hospitalMatch || !leitoMatch) {
                return false;
            }
            
            if (activeFilter) {
                return p.esperas[activeFilter];
            }
            
            return p.esperas.cirurgia || p.esperas.exame || p.esperas.parecer || p.esperas.desospitalizacao;
        });
    }, [patients, hospitalFilter, leitoFilter, activeFilter]);

    const getListTitle = () => {
        if (!activeFilter) return "Visão Geral de Esperas";
        switch (activeFilter) {
            case 'cirurgia': return "Pacientes Aguardando Cirurgia";
            case 'exame': return "Pacientes Aguardando Exame";
            case 'parecer': return "Pacientes Aguardando Parecer";
            case 'desospitalizacao': return "Pacientes Aguardando Desospitalização";
            default: return "Visão Geral de Esperas";
        }
    };
    
    const EsperaCard = ({ title, count, type, onClick, isActive }: { title: string, count: number, type: keyof Esperas, onClick: (type: keyof Esperas) => void, isActive: boolean }) => (
        <div className={`espera-card ${isActive ? 'active' : ''}`} onClick={() => onClick(type)}>
            <h3>{title}</h3>
            <div className="count">{count}</div>
            <div className="details-button" aria-label={`Filtrar por ${title}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </div>
        </div>
    );

    const renderPatientTable = () => {
        if (!activeFilter) {
            return (
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
                        {filteredPatients.map(p => (
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
                        ))}
                    </tbody>
                </table>
            );
        }

        const renderRow = (p: Patient, type: keyof Esperas) => {
            let aguardando, desde, detailsHandler;

            switch (type) {
                case 'cirurgia':
                    aguardando = p.tipoCirurgia;
                    desde = p.desdeCirurgia;
                    detailsHandler = () => setSelectedSurgeryPatient(p);
                    break;
                case 'exame':
                    aguardando = p.aguardandoExame;
                    desde = p.desdeExame;
                    detailsHandler = () => setSelectedExamPatient(p);
                    break;
                case 'parecer':
                    aguardando = p.aguardandoParecer;
                    desde = p.desdeParecer;
                    detailsHandler = () => setSelectedParecerPatient(p);
                    break;
                case 'desospitalizacao':
                    aguardando = p.aguardandoDesospitalizacao;
                    desde = p.desdeDesospitalizacao;
                    detailsHandler = () => setSelectedDesospitalizacaoPatient(p);
                    break;
                default:
                    return null;
            }

            const diasDeEspera = calculateDaysWaiting(desde);

            return (
                <tr key={p.id}>
                    <td>{p.hospitalDestino}</td>
                    <td>{p.nome}</td>
                    <td>{formatDateDdMmYy(p.dataIH)}</td>
                    <td>{formatDateDdMmYy(p.altaPrev)}</td>
                    <td>{aguardando || 'N/A'}</td>
                    <td>{formatDateDdMmYy(desde)}</td>
                    <td className="days-cell">{diasDeEspera !== 'N/A' ? `${diasDeEspera} dias` : 'N/A'}</td>
                    <td>{p.leitoAuditado || 'N/A'}</td>
                    <td>
                        <button className="icon-button" onClick={detailsHandler} aria-label={`Detalhes da Espera de ${p.nome}`}>
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                    </td>
                </tr>
            );
        };
        
        const headerLabels: Record<keyof Esperas, string> = {
            cirurgia: 'AGUARDANDO CIRURGIA',
            exame: 'AGUARDANDO EXAME',
            parecer: 'AGUARDANDO PARECER',
            desospitalizacao: 'AGUARDANDO DESOSPITALIZAÇÃO'
        };

        const desdeLabels: Record<keyof Esperas, string> = {
            cirurgia: 'DESDE CIRURGIA',
            exame: 'DESDE EXAME',
            parecer: 'DESDE PARECER',
            desospitalizacao: 'DESDE DESOSPITALIZAÇÃO'
        };
        
        return (
            <table className="patient-table">
                <thead>
                    <tr>
                        <th>HOSPITAL IH</th>
                        <th>PACIENTE</th>
                        <th>DATA IH</th>
                        <th>PREVISÃO DE ALTA</th>
                        <th>{headerLabels[activeFilter]}</th>
                        <th>{desdeLabels[activeFilter]}</th>
                        <th>DIAS DE ESPERA</th>
                        <th>LEITO AUDITADO</th>
                        <th>DETALHES</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPatients.map(p => renderRow(p, activeFilter))}
                </tbody>
            </table>
        );
    };
    
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
                    <EsperaCard title="Cirurgia" count={esperaCounts.cirurgia} type="cirurgia" onClick={handleCardClick} isActive={activeFilter === 'cirurgia'} />
                    <EsperaCard title="Exame" count={esperaCounts.exame} type="exame" onClick={handleCardClick} isActive={activeFilter === 'exame'} />
                    <EsperaCard title="Parecer" count={esperaCounts.parecer} type="parecer" onClick={handleCardClick} isActive={activeFilter === 'parecer'} />
                    <EsperaCard title="Desospitalização" count={esperaCounts.desospitalizacao} type="desospitalizacao" onClick={handleCardClick} isActive={activeFilter === 'desospitalizacao'} />
                </div>
            </div>

            <div className="espera-filter-bar">
                <h2 className="section-title">{getListTitle()}</h2>
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
                 {renderPatientTable()}
            </div>

            {selectedSurgeryPatient && (
                <DetalhesEsperaCirurgiaModal 
                    patient={selectedSurgeryPatient}
                    onClose={() => setSelectedSurgeryPatient(null)}
                    user={user}
                    onUpdatePatient={onUpdatePatient}
                    showToast={showToast}
                />
            )}
            {selectedExamPatient && (
                <DetalhesEsperaExameModal 
                    patient={selectedExamPatient}
                    onClose={() => setSelectedExamPatient(null)}
                    user={user}
                    onUpdatePatient={onUpdatePatient}
                    showToast={showToast}
                />
            )}
             {selectedParecerPatient && (
                <DetalhesEsperaParecerModal 
                    patient={selectedParecerPatient}
                    onClose={() => setSelectedParecerPatient(null)}
                    user={user}
                    onUpdatePatient={onUpdatePatient}
                    showToast={showToast}
                />
            )}
             {selectedDesospitalizacaoPatient && (
                <DetalhesEsperaDesospitalizacaoModal 
                    patient={selectedDesospitalizacaoPatient}
                    onClose={() => setSelectedDesospitalizacaoPatient(null)}
                    user={user}
                    onUpdatePatient={onUpdatePatient}
                    showToast={showToast}
                />
            )}
        </div>
    );
};

export default MapaDeEspera;