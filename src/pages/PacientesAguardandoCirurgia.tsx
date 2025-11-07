import React, { useState, useMemo } from 'react';
import { Patient, User, EsperaCirurgiaDetalhes } from '../types/index.ts';
import { formatDateDdMmYy, calculateDaysWaiting, calculateDaysBetween } from '../utils/helpers.ts';
import AppHeader from '../components/AppHeader.tsx';

// --- Modal Component ---
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

const PacientesAguardandoCirurgia = ({
    onBack,
    user,
    patients,
    onUpdatePatient,
    showToast,
}: { 
    onBack: () => void;
    user: User;
    patients: Patient[];
    onUpdatePatient: (patient: Patient, user: User) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}) => {
    
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const surgeryPatients = patients.filter(p => p.esperas.cirurgia);

    return (
        <div className="page-container">
            <AppHeader
                title="Pacientes Aguardando Cirurgia"
                subtitle="Lista dos pacientes que aguardam por uma cirurgia."
                onBack={onBack}
            />
             <div className="table-container" style={{marginTop: '20px'}}>
                <table className="patient-table">
                    <thead>
                        <tr>
                            <th>HOSPITAL IH</th>
                            <th>PACIENTE</th>
                            <th>DATA IH</th>
                            <th>PREVISÃO DE ALTA</th>
                            <th>AGUARDANDO CIRURGIA</th>
                            <th>DESDE CIRURGIA</th>
                            <th>DIAS DE ESPERA</th>
                            <th>LEITO AUDITADO</th>
                            <th>DETALHES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {surgeryPatients.map(p => {
                            const diasDeEspera = calculateDaysWaiting(p.desdeCirurgia);
                            return (
                                <tr key={p.id}>
                                    <td>{p.hospitalDestino}</td>
                                    <td>{p.nome}</td>
                                    <td>{formatDateDdMmYy(p.dataIH)}</td>
                                    <td>{formatDateDdMmYy(p.altaPrev)}</td>
                                    <td>{p.tipoCirurgia || 'N/A'}</td>
                                    <td>{formatDateDdMmYy(p.desdeCirurgia)}</td>
                                    <td className="days-cell">
                                        {diasDeEspera !== 'N/A' ? `${diasDeEspera} dias` : 'N/A'}
                                    </td>
                                    <td>{p.leitoAuditado || 'N/A'}</td>
                                    <td>
                                        <button className="icon-button" onClick={() => setSelectedPatient(p)} aria-label={`Detalhes da Espera de Cirurgia de ${p.nome}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selectedPatient && (
                <DetalhesEsperaCirurgiaModal 
                    patient={selectedPatient}
                    onClose={() => setSelectedPatient(null)}
                    user={user}
                    onUpdatePatient={onUpdatePatient}
                    showToast={showToast}
                />
            )}
        </div>
    );
};

export default PacientesAguardandoCirurgia;