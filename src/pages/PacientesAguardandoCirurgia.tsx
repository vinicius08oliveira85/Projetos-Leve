import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Patient, User, EsperaCirurgiaDetalhes, HistoryEntry } from '../types/index.ts';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { formatDateDdMmYy, calculateDaysWaiting, calculateDaysBetween, createBlob } from '../utils/helpers.ts';
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

const ResumoClinicoModal = ({ patient: initialPatient, onClose, user, onUpdatePatient, showToast }: {
    patient: Patient;
    onClose: () => void;
    user: User;
    onUpdatePatient: (patient: Patient, user: User) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}) => {
    const [patient, setPatient] = useState<Patient>(initialPatient);
    const [isRecording, setIsRecording] = useState(false);
    const [diarioText, setDiarioText] = useState('');
    const [newHistoryDate, setNewHistoryDate] = useState('');

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const accumulatedTranscriptionRef = useRef('');

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => session?.close());
            }
        };
    }, []);

    const handleToggleRecording = async () => {
        if (isRecording) {
            setIsRecording(false);
            streamRef.current?.getTracks().forEach(track => track.stop());
            if (scriptProcessorRef.current && mediaStreamSourceRef.current && audioContextRef.current) {
                mediaStreamSourceRef.current.disconnect(scriptProcessorRef.current);
                scriptProcessorRef.current.disconnect(audioContextRef.current.destination);
            }
            if (audioContextRef.current?.state !== 'closed') {
                await audioContextRef.current?.close();
            }
            if (sessionPromiseRef.current) {
                const session = await sessionPromiseRef.current;
                session.close();
                sessionPromiseRef.current = null;
            }
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                setIsRecording(true);
                setDiarioText("Iniciando gravação...");
                accumulatedTranscriptionRef.current = '';

                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                
                const sessionPromise = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: {
                        onopen: () => {
                            setDiarioText("Conectado. Pode falar agora...");
                            const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                            audioContextRef.current = context;
                            mediaStreamSourceRef.current = context.createMediaStreamSource(stream);
                            const processor = context.createScriptProcessor(4096, 1, 1);
                            scriptProcessorRef.current = processor;
                            processor.onaudioprocess = (audioProcessingEvent) => {
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const pcmBlob = createBlob(inputData);
                                sessionPromise.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            };
                            mediaStreamSourceRef.current.connect(processor);
                            processor.connect(context.destination);
                        },
                        onmessage: (message: LiveServerMessage) => {
                            if (message.serverContent?.inputTranscription) {
                                const text = message.serverContent.inputTranscription.text;
                                accumulatedTranscriptionRef.current += text;
                                setDiarioText(accumulatedTranscriptionRef.current);
                            }
                        },
                        onerror: (e: ErrorEvent) => {
                            console.error('Session error', e);
                            setDiarioText("Erro na gravação. Tente novamente.");
                            if(isRecording) handleToggleRecording();
                        },
                        onclose: () => {
                           setDiarioText(accumulatedTranscriptionRef.current);
                        },
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        inputAudioTranscription: {},
                    },
                });
                sessionPromiseRef.current = sessionPromise;

            } catch (error) {
                console.error('Error getting user media or starting session', error);
                showToast('Não foi possível acessar o microfone. Por favor, verifique as permissões.', 'error');
                setIsRecording(false);
                setDiarioText("");
            }
        }
    };

    const handleHistorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (newHistoryDate && diarioText) {
             const newEntry: HistoryEntry = {
                data: newHistoryDate,
                responsavel: user.name,
                diario: diarioText,
            };
            const updatedPatient = {
                ...patient,
                historico: [...patient.historico, newEntry]
            };
            setPatient(updatedPatient); // Update local state for immediate feedback
            onUpdatePatient(updatedPatient, user);
            setNewHistoryDate('');
            setDiarioText('');
            showToast('Anotação adicionada com sucesso!');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="leito-modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="leito-modal-header">
                    <h3>Resumo Clínico - {patient.nome}</h3>
                    <button onClick={onClose} className="leito-modal-close-btn">&times;</button>
                </div>
                <div className="leito-modal-body" style={{ marginTop: '20px' }}>
                     <fieldset style={{ marginBottom: '24px' }}>
                        <legend>Histórico de Anotações</legend>
                        {patient.historico && patient.historico.length > 0 ? (
                            <div className="table-container" style={{ padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Responsável</th>
                                            <th>Diário de Internação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...patient.historico].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((item, index) => (
                                            <tr key={index}>
                                                <td>{formatDateDdMmYy(item.data)}</td>
                                                <td>{item.responsavel}</td>
                                                <td>{item.diario}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>Nenhuma anotação registrada.</p>
                        )}
                    </fieldset>
                    
                    {user.role === 'admin' ? (
                        <fieldset>
                            <legend>Adicionar Nova Anotação</legend>
                            <form className="add-history-form" onSubmit={handleHistorySubmit}>
                                <div className="history-form-grid">
                                    <div className="form-group">
                                        <label>Data Auditoria</label>
                                        <div className="date-input-wrapper">
                                            <input type="date" name="data" required value={newHistoryDate} onChange={(e) => setNewHistoryDate(e.target.value)} />
                                            {newHistoryDate && (
                                                <button type="button" className="clear-date-button" onClick={() => setNewHistoryDate('')} title="Limpar data">&times;</button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Responsável</label>
                                        <input type="text" name="responsavel" value={user.name} disabled />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Diário de Internação</label>
                                        <div className="textarea-with-mic">
                                            <textarea 
                                                name="diario" 
                                                rows={3} 
                                                required 
                                                value={diarioText} 
                                                onChange={(e) => setDiarioText(e.target.value)}
                                                disabled={isRecording}
                                                placeholder={isRecording ? "" : "Digite ou grave o resumo clínico..."}
                                            />
                                            <button type="button" className={`mic-button ${isRecording ? 'recording' : ''}`} onClick={handleToggleRecording} aria-label={isRecording ? 'Parar gravação' : 'Iniciar gravação'}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="add-history-btn">Adicionar Anotação</button>
                            </form>
                        </fieldset>
                    ) : null}
                </div>
                 <div className="modal-actions" style={{ paddingTop: '20px' }}>
                     <button onClick={onClose} className="modal-button cancel">Fechar</button>
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
    const [resumoClinicoPatient, setResumoClinicoPatient] = useState<Patient | null>(null);
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
                            <th>Detalhes da Cirurgia</th>
                            <th>Guia</th>
                            <th>Nome do Paciente</th>
                            <th>Data IH</th>
                            <th>Hospital Destino</th>
                            <th>Aguardando Cirurgia</th>
                            <th>Desde</th>
                            <th>Dias de Espera</th>
                            <th>Leito do dia</th>
                            <th>Resumo Clínico</th>
                        </tr>
                    </thead>
                    <tbody>
                        {surgeryPatients.map(p => {
                            const diasDeEspera = calculateDaysWaiting(p.desdeCirurgia);
                            return (
                                <tr key={p.id}>
                                    <td>
                                        <button className="icon-button" onClick={() => setSelectedPatient(p)} aria-label={`Detalhes da Cirurgia de ${p.nome}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        </button>
                                    </td>
                                    <td>{p.guia}</td>
                                    <td>{p.nome}</td>
                                    <td>{formatDateDdMmYy(p.dataIH)}</td>
                                    <td>{p.hospitalDestino}</td>
                                    <td>{p.tipoCirurgia || 'N/A'}</td>
                                    <td>{formatDateDdMmYy(p.desdeCirurgia)}</td>
                                    <td className="days-cell">
                                        {diasDeEspera !== 'N/A' ? `${diasDeEspera} dias` : 'N/A'}
                                    </td>
                                    <td>{p.leitoHoje}</td>
                                    <td>
                                        <button className="icon-button" onClick={() => setResumoClinicoPatient(p)} aria-label={`Resumo clínico de ${p.nome}`} title="Ver/Adicionar Resumo clínico">
                                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
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
            
            {resumoClinicoPatient && (
                <ResumoClinicoModal 
                    patient={resumoClinicoPatient}
                    onClose={() => setResumoClinicoPatient(null)}
                    user={user}
                    onUpdatePatient={onUpdatePatient}
                    showToast={showToast}
                />
            )}
        </div>
    );
};

export default PacientesAguardandoCirurgia;