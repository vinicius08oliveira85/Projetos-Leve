import React, { useState, useMemo } from 'https://aistudiocdn.com/react@^19.2.0';
import { Patient, User, EsperaCirurgiaDetalhes } from '../types/index.ts';
import { calculateDaysBetween, formatDateDdMmYy } from '../utils/helpers.ts';
import AppHeader from '../components/AppHeader.tsx';

const DetalhesEsperaCirurgia = ({ patient, onBack, user, onUpdatePatient, showToast }: {
    patient: Patient,
    onBack: () => void,
    user: User,
    onUpdatePatient: (patient: Patient, user: User) => void,
    showToast: (message: string) => void
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
        <div className="page-container">
            <AppHeader
                title={`Detalhes da Espera de Cirurgia`}
                subtitle={`Paciente: ${patient.nome}`}
                onBack={onBack}
            />
            <div className="details-content">
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

                {user.role === 'admin' && (
                    <div className="details-actions">
                        <button onClick={handleSave} className="save-details-btn">Salvar Alterações</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetalhesEsperaCirurgia;