import React, { useState, useRef, useEffect } from 'react';
import { Patient, User, HistoryEntry } from '../types/index.ts';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { formatDateDdMmYy, calculateDaysWaiting, createBlob } from '../utils/helpers.ts';
import AppHeader from '../components/AppHeader.tsx';

// --- ResumoClinicoModal Component (copied from MapaDeEspera) ---
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
             if (newHistoryDate < patient.dataIH) {
                showToast('A data da anotação não pode ser anterior à data de internação.', 'error');
                return;
            }
            const today = new Date().toISOString().split('T')[0];
            if (newHistoryDate > today) {
                showToast('A data da anotação não pode ser no futuro.', 'error');
                return;
            }

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


const PacientesAguardandoDesospitalizacao = ({ onBack, onViewDetails, user, patients, onUpdatePatient, showToast }: {
    onBack: () => void,
    onViewDetails: (patient: Patient) => void,
    user: User,
    patients: Patient[],
    onUpdatePatient: (patient: Patient, user: User) => void,
    showToast: (message: string, type?: 'success' | 'error') => void
}) => {
    
    const [resumoClinicoPatient, setResumoClinicoPatient] = useState<Patient | null>(null);
    const desospitalizacaoPatients = patients.filter(p => p.esperas.desospitalizacao);

    return (
        <div className="page-container">
            <AppHeader
                title="Pacientes aguardando Desospitalização"
                subtitle="Lista dos pacientes que aguardam por desospitalização."
                onBack={onBack}
            />
            <div className="table-container" style={{ marginTop: '20px' }}>
                <table className="patient-table">
                    <thead>
                        <tr>
                            <th>Detalhes da Desospitalização</th>
                            <th>Guia</th>
                            <th>Nome do Paciente</th>
                            <th>Data IH</th>
                            <th>Hospital Destino</th>
                            <th>Aguardando Desospitalização</th>
                            <th>Desde</th>
                            <th>Dias de Espera</th>
                            <th>Leito do dia</th>
                            <th>Resumo Clínico</th>
                        </tr>
                    </thead>
                    <tbody>
                        {desospitalizacaoPatients.map(p => {
                            const diasDeEspera = calculateDaysWaiting(p.desdeDesospitalizacao);
                             const latestLeitoRecord = [...(p.leitoHistory || [])]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                            const leitoDoDia = latestLeitoRecord ? latestLeitoRecord.leitoDoDia : p.leitoAdmissao;
                            return (
                                <tr key={p.id}>
                                    <td>
                                        <button className="icon-button" onClick={() => onViewDetails(p)} aria-label={`Detalhes da Espera de Desospitalização de ${p.nome}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        </button>
                                    </td>
                                    <td>{p.guia}</td>
                                    <td>{p.nome}</td>
                                    <td>{formatDateDdMmYy(p.dataIH)}</td>
                                    <td>{p.hospitalDestino}</td>
                                    <td>{p.aguardandoDesospitalizacao || 'N/A'}</td>
                                    <td>{formatDateDdMmYy(p.desdeDesospitalizacao)}</td>
                                    <td className="days-cell">
                                        {diasDeEspera !== 'N/A' ? `${diasDeEspera} dias` : 'N/A'}
                                    </td>
                                    <td>{leitoDoDia || 'N/A'}</td>
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

export default PacientesAguardandoDesospitalizacao;