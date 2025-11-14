import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Patient, User, Esperas, HistoryEntry, EsperaCirurgiaDetalhes, EsperaExameDetalhes, EsperaParecerDetalhes, EsperaDesospitalizacaoDetalhes } from '../types/index.ts';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import AppHeader from '../components/AppHeader.tsx';
import { formatDateDdMmYy, calculateDaysWaiting, calculateDaysBetween, createBlob } from '../utils/helpers.ts';

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


interface MapaDeEsperaProps {
    onBack: () => void;
    onSelectPatient: (patient: Patient) => void;
    user: User;
    patients: Patient[];
    onUpdatePatient: (patient: Patient, user: User) => void;
    onSavePatients: (patients: Patient[], user: User) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
    title: string;
    subtitle: string;
}

const MapaDeEspera = ({ onBack, onSelectPatient, user, patients, onUpdatePatient, onSavePatients, showToast, title, subtitle }: MapaDeEsperaProps) => {
    // Applied filters
    const [hospitalFilter, setHospitalFilter] = useState<string[]>([]);
    const [leitoFilter, setLeitoFilter] = useState('Todos');
    const [altaReplanFilter, setAltaReplanFilter] = useState<'Todos' | 'Com Alta Replan' | 'Sem Alta Replan'>('Todos');
    const [nameSearch, setNameSearch] = useState('');
    
    // Temporary filters for UI
    const [tempHospitalFilter, setTempHospitalFilter] = useState<string[]>([]);
    const [tempLeitoFilter, setTempLeitoFilter] = useState('Todos');
    const [tempAltaReplanFilter, setTempAltaReplanFilter] = useState<'Todos' | 'Com Alta Replan' | 'Sem Alta Replan'>('Todos');
    const [tempNameSearch, setTempNameSearch] = useState('');

    // Dropdown visibility
    const [isHospitalDropdownOpen, setIsHospitalDropdownOpen] = useState(false);
    const hospitalDropdownRef = useRef<HTMLDivElement>(null);
    
    const [activeFilter, setActiveFilter] = useState<keyof Esperas | null>(null);
    
    const [selectedSurgeryPatient, setSelectedSurgeryPatient] = useState<Patient | null>(null);
    const [selectedExamPatient, setSelectedExamPatient] = useState<Patient | null>(null);
    const [selectedParecerPatient, setSelectedParecerPatient] = useState<Patient | null>(null);
    const [selectedDesospitalizacaoPatient, setSelectedDesospitalizacaoPatient] = useState<Patient | null>(null);
    const [resumoClinicoPatient, setResumoClinicoPatient] = useState<Patient | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (hospitalDropdownRef.current && !hospitalDropdownRef.current.contains(event.target as Node)) {
                setIsHospitalDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const totalInternados = useMemo(() => {
        return patients.filter(p => !p.altaFim).length;
    }, [patients]);
    
    const totalPacientesEmEspera = useMemo(() => {
        return patients.filter(p => p.esperas.cirurgia || p.esperas.exame || p.esperas.parecer || p.esperas.desospitalizacao).length;
    }, [patients]);

    const esperaCounts = useMemo(() => {
        return patients.reduce((acc, p) => {
            if (p.esperas.cirurgia) acc.cirurgia++;
            if (p.esperas.exame) acc.exame++;
            if (p.esperas.parecer) acc.parecer++;
            if (p.esperas.desospitalizacao) acc.desospitalizacao++;
            return acc;
        }, { cirurgia: 0, exame: 0, parecer: 0, desospitalizacao: 0 });
    }, [patients]);

    const uniqueHospitals = useMemo(() => [...new Set(patients.map(p => p.hospitalDestino))], [patients]);
    const leitos = ['Todos', 'CTI', 'CTI PED', 'CTI NEO', 'USI', 'USI PED', 'UI', 'UI PSQ'];
    
    const handleCardClick = (type: keyof Esperas) => {
        const newFilter = activeFilter === type ? null : type;
        setActiveFilter(newFilter);
        // Reset filters when changing main category
        handleClearFilters();
    };

    const filteredPatients = useMemo(() => {
        return patients.filter(p => {
            const hospitalMatch = hospitalFilter.length === 0 || hospitalFilter.includes(p.hospitalDestino);
            const leitoMatch = leitoFilter === 'Todos' || p.leitoHoje === leitoFilter;

            if (!hospitalMatch || !leitoMatch) {
                return false;
            }
            
            if (activeFilter) {
                return p.esperas[activeFilter];
            }
            
            // Visão Geral filters
            const isWaiting = p.esperas.cirurgia || p.esperas.exame || p.esperas.parecer || p.esperas.desospitalizacao;
            if (!isWaiting) return false;

            const altaReplanMatch = altaReplanFilter === 'Todos' || 
                                   (altaReplanFilter === 'Com Alta Replan' && !!p.altaReplan) || 
                                   (altaReplanFilter === 'Sem Alta Replan' && !p.altaReplan);
            const nameMatch = nameSearch === '' || p.nome.toLowerCase().includes(nameSearch.toLowerCase());
            
            return altaReplanMatch && nameMatch;
        });
    }, [patients, hospitalFilter, leitoFilter, activeFilter, altaReplanFilter, nameSearch]);

    const handleApplyFilters = () => {
        setHospitalFilter(tempHospitalFilter);
        setLeitoFilter(tempLeitoFilter);
        setAltaReplanFilter(tempAltaReplanFilter);
        setNameSearch(tempNameSearch);
    };
    
    const handleClearFilters = () => {
        setTempHospitalFilter([]);
        setTempLeitoFilter('Todos');
        setTempAltaReplanFilter('Todos');
        setTempNameSearch('');
        
        setHospitalFilter([]);
        setLeitoFilter('Todos');
        setAltaReplanFilter('Todos');
        setNameSearch('');
    };
    
    const handleHospitalMultiChange = (hospital: string) => {
        setTempHospitalFilter(prev => {
            const isSelected = prev.includes(hospital);
            return isSelected ? prev.filter(s => s !== hospital) : [...prev, hospital];
        });
    };

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
    
    const EsperaCard = ({ type, count, onClick, isActive }: { type: keyof Esperas; count: number; onClick: (type: keyof Esperas) => void; isActive: boolean }) => {
    
        // Fix: Changed JSX.Element to React.ReactElement to resolve 'Cannot find namespace JSX' error.
        const cardConfig: Record<keyof Esperas, { title: string; subtitle: string; theme: string; icon: React.ReactElement; }> = {
            cirurgia: {
                title: 'Cirurgia',
                subtitle: 'Aguardando procedimento',
                theme: 'blue',
                icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            },
            exame: {
                title: 'Exame',
                subtitle: 'Aguardando resultado',
                theme: 'purple',
                icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            },
            parecer: {
                title: 'Parecer',
                subtitle: 'Avaliação médica',
                theme: 'orange',
                icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            },
            desospitalizacao: {
                title: 'Desospitalização',
                subtitle: 'Preparação alta',
                theme: 'green',
                icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            }
        };
        
        const config = cardConfig[type];
    
        return (
            <div className={`espera-card-new theme-${config.theme} ${isActive ? 'active' : ''}`} onClick={() => onClick(type)}>
                <div className="card-header">
                    <div className="icon-background">
                        {config.icon}
                    </div>
                    <div className="view-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </div>
                </div>
                <div className="card-body">
                    <span className="title">{config.title}</span>
                    <div className="count-wrapper">
                        <span className="count-number">{count}</span>
                        <span className="count-label">pacientes</span>
                    </div>
                    <span className="subtitle">{config.subtitle}</span>
                </div>
            </div>
        );
    };

    const PendenciasEsperaList = ({ esperas }: { esperas: Esperas }) => {
        const activeEsperas = [];
        if (esperas.cirurgia) activeEsperas.push('Cirurgia');
        if (esperas.exame) activeEsperas.push('Exame');
        if (esperas.parecer) activeEsperas.push('Parecer');
        if (esperas.desospitalizacao) activeEsperas.push('Desospitalização');
        return <span>{activeEsperas.join(', ')}</span>;
    };


    const renderPatientTable = () => {
        if (!activeFilter) {
            return (
                <table className="patient-table">
                   <thead>
                        <tr>
                            <th>Detalhes da Guia</th>
                            <th>Guia</th>
                            <th>Nome do Paciente</th>
                            <th>Data IH</th>
                            <th>Hospital Destino</th>
                            <th>Tipo de Espera</th>
                            <th>Desde</th>
                            <th>Dias de Espera</th>
                            <th>Leito do dia</th>
                            <th>Resumo clínico</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.map(p => {
                            const waitDates: Date[] = [];
                            if (p.esperas.cirurgia && p.desdeCirurgia) waitDates.push(new Date(p.desdeCirurgia));
                            if (p.esperas.exame && p.desdeExame) waitDates.push(new Date(p.desdeExame));
                            if (p.esperas.parecer && p.desdeParecer) waitDates.push(new Date(p.desdeParecer));
                            if (p.esperas.desospitalizacao && p.desdeDesospitalizacao) waitDates.push(new Date(p.desdeDesospitalizacao));
                            
                            const earliestDate = waitDates.length > 0 ? new Date(Math.min(...waitDates.map(d => d.getTime()))) : null;
                            const desdeDateString = earliestDate ? earliestDate.toISOString().split('T')[0] : undefined;
                            const diasDeEspera = calculateDaysWaiting(desdeDateString);

                            return (
                                <tr key={p.id}>
                                    <td>
                                        <button className="icon-button" onClick={() => onSelectPatient(p)} aria-label={`Detalhes da Guia de ${p.nome}`} title="Acessar Detalhes da Guia">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        </button>
                                    </td>
                                    <td>{p.guia}</td>
                                    <td>{p.nome}</td>
                                    <td>{formatDateDdMmYy(p.dataIH)}</td>
                                    <td>{p.hospitalDestino}</td>
                                    <td className="pendencias-cell" title={(Object.keys(p.esperas) as Array<keyof Esperas>).filter(k => p.esperas[k]).map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(', ')}>
                                        <PendenciasEsperaList esperas={p.esperas} />
                                    </td>
                                    <td>{formatDateDdMmYy(desdeDateString)}</td>
                                    <td className="days-cell">{diasDeEspera !== 'N/A' ? `${diasDeEspera} dias` : 'N/A'}</td>
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

            <div className="total-summary-banner">
                Total de pacientes internados: <strong>{totalInternados}</strong>
                <span className="summary-divider">|</span>
                Total de pacientes em espera: <strong>{totalPacientesEmEspera}</strong>
                <span className="summary-date">- 14/11/2025</span>
            </div>

            <div className="content-box">
                <h2 className="section-title-box">Pacientes em espera</h2>
                <div className="espera-cards-container">
                    <EsperaCard count={esperaCounts.cirurgia} type="cirurgia" onClick={handleCardClick} isActive={activeFilter === 'cirurgia'} />
                    <EsperaCard count={esperaCounts.exame} type="exame" onClick={handleCardClick} isActive={activeFilter === 'exame'} />
                    <EsperaCard count={esperaCounts.parecer} type="parecer" onClick={handleCardClick} isActive={activeFilter === 'parecer'} />
                    <EsperaCard count={esperaCounts.desospitalizacao} type="desospitalizacao" onClick={handleCardClick} isActive={activeFilter === 'desospitalizacao'} />
                </div>
            </div>

            <div className="filter-bar" style={{ marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: '1px solid var(--border-color)', flexDirection: 'column', alignItems: 'stretch', gap: '16px'}}>
                <div style={{width: '100%'}}>
                    <h2 className="section-title" style={{color: 'var(--primary-color)', margin: 0, paddingBottom: '8px'}}>{getListTitle()}</h2>
                </div>
                <div className="filter-controls">
                    <div className="form-group" ref={hospitalDropdownRef}>
                        <label>Hospital Destino:</label>
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
                    <div className="form-group">
                        <label>Leito do dia:</label>
                        <select value={tempLeitoFilter} onChange={(e) => setTempLeitoFilter(e.target.value)}>
                            {leitos.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                     {activeFilter === null && (
                        <div className="form-group">
                            <label>Alta Replan:</label>
                            <select value={tempAltaReplanFilter} onChange={(e) => setTempAltaReplanFilter(e.target.value as any)}>
                                <option value="Todos">Todos</option>
                                <option value="Com Alta Replan">Com Alta Replan</option>
                                <option value="Sem Alta Replan">Sem Alta Replan</option>
                            </select>
                        </div>
                    )}
                </div>
                {activeFilter === null && (
                     <div>
                        <div className="form-group">
                            <label>Buscar por Nome:</label>
                            <input
                                type="text"
                                placeholder="Digite o nome do paciente..."
                                value={tempNameSearch}
                                onChange={(e) => setTempNameSearch(e.target.value)}
                                style={{width: '100%'}}
                            />
                        </div>
                    </div>
                )}
                 <div className="filter-actions-wrapper">
                    <div className="filter-actions">
                        <button onClick={handleClearFilters} className="secondary-action-button">Limpar</button>
                        <button onClick={handleApplyFilters} className="save-button">Aplicar Filtros</button>
                    </div>
                    <div className="filter-totalizer">
                        <span className="totalizer-label">TOTAL</span>
                        <span className="totalizer-value">{filteredPatients.length}</span>
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

export default MapaDeEspera;