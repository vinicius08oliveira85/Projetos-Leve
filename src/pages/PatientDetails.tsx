import React, { useState, useEffect, useRef } from 'react';
import { Patient, User, Esperas, HistoryEntry, LeitoType } from '../types/index.ts';
import { GoogleGenAI, LiveServerMessage, Blob, Modality } from '@google/genai';
import { createBlob, formatDateDdMmYy } from '../utils/helpers.ts';
import AppHeader from '../components/AppHeader.tsx';
import GestaoDeLeito from '../components/GestaoDeLeito.tsx';

const leitoOptions: LeitoType[] = ['CTI', 'CTI PED', 'CTI NEO', 'USI', 'USI PED', 'UI', 'UI PSQ'];

const motivoAltaOptions = [
    'ÓBITO',
    'TIH',
    'À REVELIA',
    'HOSPITALAR',
    'ADMINISTRATIVA',
];

const PatientDetails = ({ patient: initialPatient, onBack, user, onUpdatePatient, showToast }: { patient: Patient, onBack: () => void, user: User, onUpdatePatient: (patient: Patient) => void, showToast: (message: string) => void }) => {
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
            if (isRecording) {
                streamRef.current?.getTracks().forEach(track => track.stop());
                if (audioContextRef.current?.state !== 'closed') {
                    audioContextRef.current?.close();
                }
                sessionPromiseRef.current?.then(session => session.close());
            }
        };
    }, [isRecording]);


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
                alert('Não foi possível acessar o microfone. Por favor, verifique as permissões.');
                setIsRecording(false);
                setDiarioText("");
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPatient(prev => {
            const updatedPatient = { ...prev, [name]: value };
            // If the field is `leitoAdmissao`, we immediately call the update function.
            if (name === 'leitoAdmissao') {
                onUpdatePatient(updatedPatient);
            }
            return updatedPatient;
        });
    };
    
    const handleDateClear = (fieldName: keyof Patient) => {
        setPatient(prev => ({...prev, [fieldName]: ''}));
    };

    const handleHistorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (newHistoryDate && diarioText) {
             const newEntry: HistoryEntry = {
                data: newHistoryDate,
                responsavel: user.name,
                diario: diarioText,
            };
            setPatient(prev => ({
                ...prev,
                historico: [...prev.historico, newEntry]
            }));
            setNewHistoryDate('');
            setDiarioText('');
        }
    };
    
    const handleEsperaToggle = (esperaKey: keyof Esperas) => {
        setPatient(prev => ({
            ...prev,
            esperas: {
                ...prev.esperas,
                [esperaKey]: !prev.esperas[esperaKey]
            }
        }));
    };
    
    const handleSave = () => {
        onUpdatePatient(patient);
        showToast('Alterações salvas com sucesso!');
    };
    
    const handleLeitoChange = (updatedPatientState: Patient) => {
        const originalPatient = patient;

        const newHistoryEntries: HistoryEntry[] = [];
        const today = new Date().toISOString().split('T')[0];

        const originalLeitoHistory = originalPatient.leitoHistory || [];
        const updatedLeitoHistory = updatedPatientState.leitoHistory || [];

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

        setPatient({
            ...updatedPatientState,
            historico: [...(updatedPatientState.historico || []), ...newHistoryEntries]
        });
    };

    const esperaLabels: Record<keyof Esperas, string> = {
        cirurgia: 'Espera Cirurgia',
        exame: 'Espera Exame',
        parecer: 'Espera Parecer',
        desospitalizacao: 'Espera Desospitalização'
    };

    return (
        <div className="page-container">
            <AppHeader
                title={`Detalhes do Paciente: ${patient.nome} (${patient.idade} anos)`}
                subtitle={`CPF: ${patient.cpf} • Permanência: ${patient.permanencia}`}
                onBack={onBack}
            />

            <div className="details-content">
                <fieldset>
                    <legend>Dados da internação</legend>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Data IH</label>
                            <input type="text" value={formatDateDdMmYy(patient.dataIH)} disabled />
                        </div>
                        <div className="form-group">
                            <label>CID IH</label>
                            <input type="text" value={patient.cidIH} disabled />
                        </div>
                        <div className="form-group">
                            <label>Tipo Internação</label>
                            <input type="text" value={patient.tipoInternacao} disabled />
                        </div>
                         <div className="form-group">
                            <label>Hospital de Origem</label>
                            <input type="text" value={patient.hospitalOrigem} disabled />
                        </div>
                        <div className="form-group">
                            <label>Leito Admissional</label>
                            <select name="leitoAdmissao" value={patient.leitoAdmissao} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                {leitoOptions.map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Hospital de Destino</label>
                             <input type="text" name="hospitalDestino" value={patient.hospitalDestino} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                        </div>
                        <div className="form-group">
                            <label>Natureza da Guia</label>
                            <select name="natureza" value={patient.natureza} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                <option>CIRÚRGICA</option>
                                <option>CLÍNICA</option>
                                <option>OBSTÉTRICA</option>
                                <option>PEDIÁTRICA</option>
                                <option>PSIQUIÁTRICA</option>
                            </select>
                        </div>
                         <div className="form-group">
                            <label>Evento</label>
                            <select name="evento" value={patient.evento} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                <option>Agudo</option>
                                <option>Crônico agudizado</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Reinternação</label>
                            <select name="reinternacao" value={patient.reinternacao} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                <option>Sim</option>
                                <option>Não</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Liminar</label>
                            <select name="liminar" value={patient.liminar} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                <option>Sim</option>
                                <option>Não</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Fraude</label>
                            <select name="fraude" value={patient.fraude} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                <option>Sim</option>
                                <option>Não</option>
                            </select>
                        </div>
                         <div className="form-group">
                            <label>Enviado p/ Retificação</label>
                            <select name="enviadoRetificacao" value={patient.enviadoRetificacao} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                <option>Sim</option>
                                <option>Não</option>
                            </select>
                        </div>
                        {patient.reinternacao === 'Sim' && (
                            <div className="form-group full-width">
                                <label>Tipo Reinternação</label>
                                <div className="radio-group-horizontal">
                                    {['24h', '48h', '72h', '7dias', '10dias', '15dias', '30 dias'].map(value => (
                                        <label key={value}>
                                            <input
                                                type="radio"
                                                name="tipoReinternacao"
                                                value={value}
                                                checked={patient.tipoReinternacao === value}
                                                disabled={user.role !== 'admin'}
                                                onChange={handleInputChange}
                                            />
                                            {value}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </fieldset>
                
                <fieldset>
                    <legend>Gestão de Alta</legend>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Alta Prevista</label>
                            <div className="date-input-wrapper">
                                <input type="date" name="altaPrev" value={patient.altaPrev} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                                {patient.altaPrev && user.role === 'admin' && (
                                    <button className="clear-date-button" onClick={() => handleDateClear('altaPrev')} title="Limpar data">&times;</button>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Alta Replanejada</label>
                             <div className="date-input-wrapper">
                                <input type="date" name="altaReplan" value={patient.altaReplan} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                                {patient.altaReplan && user.role === 'admin' && (
                                    <button className="clear-date-button" onClick={() => handleDateClear('altaReplan')} title="Limpar data">&times;</button>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Alta Fim</label>
                            <div className="date-input-wrapper">
                                <input type="date" name="altaFim" value={patient.altaFim} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                                {patient.altaFim && user.role === 'admin' && (
                                    <button className="clear-date-button" onClick={() => handleDateClear('altaFim')} title="Limpar data">&times;</button>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Motivo da Alta</label>
                            <select
                                name="motivoAlta"
                                value={patient.motivoAlta || ''}
                                onChange={handleInputChange}
                                disabled={user.role !== 'admin'}
                            >
                                <option value="" disabled>Selecione um motivo</option>
                                {motivoAltaOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>Gestão de Leito</legend>
                    <GestaoDeLeito user={user} patient={patient} onPatientChange={handleLeitoChange} />
                </fieldset>

                <fieldset>
                    <legend>Histórico de internação</legend>
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Responsável</th>
                                <th>Diário de Internação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patient.historico.map((item, index) => (
                                <tr key={index}>
                                    <td>{formatDateDdMmYy(item.data)}</td>
                                    <td>{item.responsavel}</td>
                                    <td>{item.diario}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </fieldset>
                
                {user.role === 'admin' && (
                    <fieldset>
                        <legend>Resumo clínico</legend>
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
                            <button type="submit" className="add-history-btn">Adicionar Histórico</button>
                        </form>
                    </fieldset>
                )}

                <fieldset>
                    <legend>Criticidade</legend>
                    <div className="form-group">
                        <label>Nível de Criticidade</label>
                        <div className="radio-group-horizontal">
                            <label>
                                <input
                                    type="radio"
                                    name="criticidade"
                                    value="Diário 24h"
                                    checked={patient.criticidade === 'Diário 24h'}
                                    onChange={handleInputChange}
                                    disabled={user.role !== 'admin'}
                                />
                                Atendimento Diário (24h)
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="criticidade"
                                    value="48h"
                                    checked={patient.criticidade === '48h'}
                                    onChange={handleInputChange}
                                    disabled={user.role !== 'admin'}
                                />
                                Atendimento em 48h
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="criticidade"
                                    value="72h"
                                    checked={patient.criticidade === '72h'}
                                    onChange={handleInputChange}
                                    disabled={user.role !== 'admin'}
                                />
                                Atendimento em 72h
                            </label>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>Paciente espera</legend>
                    <div className="wait-status-buttons">
                        {(Object.keys(patient.esperas) as Array<keyof Esperas>).map(key => (
                            <button 
                                key={key}
                                className={patient.esperas[key] ? 'status-red' : 'status-green'}
                                disabled={user.role !== 'admin'}
                                onClick={() => handleEsperaToggle(key)}
                            >
                                {esperaLabels[key]}
                            </button>
                        ))}
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

export default PatientDetails;