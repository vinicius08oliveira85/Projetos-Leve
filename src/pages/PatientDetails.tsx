import React, { useState, useEffect, useRef } from 'react';
import { Patient, User, Esperas, HistoryEntry, LeitoType, GuiaStatus } from '../types/index.ts';
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

type SessionKey = 'dadosPaciente' | 'dadosInternacao' | 'gestaoLeito' | 'historico' | 'historicoAlteracoes' | 'criticidadePrazos' | 'pendenciasEspera';

const sessions: { id: SessionKey, title: string }[] = [
    { id: 'dadosPaciente', title: 'Dados do Paciente' },
    { id: 'dadosInternacao', title: 'Dados da Internação' },
    { id: 'gestaoLeito', title: 'Gestão de Leito' },
    { id: 'historico', title: 'Histórico de Internação' },
    { id: 'historicoAlteracoes', title: 'Histórico de Alterações / Anotações' },
    { id: 'criticidadePrazos', title: 'Criticidade e Prazos' },
    { id: 'pendenciasEspera', title: 'Pendências e Espera' },
];

const statusToClassName = (status: GuiaStatus) => {
    return status
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
};


const PatientDetails = ({ patient: initialPatient, allPatients, onBack, user, onSavePatient, showToast, onSelectPatient }: { 
    patient: Patient, 
    allPatients: Patient[],
    onBack: () => void, 
    user: User, 
    onSavePatient: (patient: Patient, user: User) => void, 
    showToast: (message: string, type?: 'success'|'error') => void,
    onSelectPatient: (patient: Patient) => void 
}) => {
    const [patient, setPatient] = useState<Patient>(initialPatient);
    const [isRecording, setIsRecording] = useState(false);
    const [diarioText, setDiarioText] = useState('');
    const [newHistoryDate, setNewHistoryDate] = useState('');
    const [activeSession, setActiveSession] = useState<SessionKey>('dadosPaciente');

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const accumulatedTranscriptionRef = useRef('');

    useEffect(() => {
        setPatient(initialPatient);
    }, [initialPatient]);

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
        setPatient(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDateClear = (fieldName: keyof Patient) => {
        setPatient(prev => {
            const newState: Partial<Patient> = { ...prev, [fieldName]: '' };
            if (fieldName === 'altaFim') {
                newState.motivoAlta = '';
            }
            return newState as Patient;
        });
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
        if (patient.altaFim && !patient.motivoAlta) {
            showToast('O Motivo da Alta é obrigatório quando a Data da Alta é preenchida.', 'error');
            return;
        }

        // The logic for generating history is centralized in App.tsx's handleUpdatePatient,
        // which uses the comprehensive generateChangeHistory helper. We just need to
        // pass the updated patient state. This will correctly log all changes,
        // including additions, modifications, and deletions in "Gestão de Leito".
        onSavePatient(patient, user);
        showToast('Alterações salvas com sucesso!');
    };
    
    const esperaLabels: Record<keyof Esperas, string> = {
        cirurgia: 'Espera Cirurgia',
        exame: 'Espera Exame',
        parecer: 'Espera Parecer',
        desospitalizacao: 'Espera Desospitalização'
    };

    const renderContent = () => {
        switch (activeSession) {
            case 'dadosPaciente':
                return (
                    <fieldset>
                        <legend>Dados Principais</legend>
                        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px 24px' }}>
                            <div className="form-group">
                                <label>Nome</label>
                                <input type="text" value={patient.nome} disabled />
                            </div>
                            <div className="form-group">
                                <label>CPF</label>
                                <input type="text" value={patient.cpf} disabled />
                            </div>
                            <div className="form-group">
                                <label>Dia IH (Data)</label>
                                <input type="text" value={formatDateDdMmYy(patient.dataIH)} disabled />
                            </div>
                            <div className="form-group">
                                <label>Hospital IH</label>
                                <input type="text" value={patient.hospitalDestino} disabled />
                            </div>
                            <div className="form-group">
                                <label>Hospital Origem</label>
                                <input type="text" value={patient.hospitalOrigem} disabled />
                            </div>
                            <div className="form-group">
                                <label>Leito Hoje - No sistema</label>
                                <input type="text" value={patient.leitoHoje} disabled />
                            </div>
                            <div className="form-group">
                                <label>Permanência</label>
                                <input type="text" value={patient.permanencia} disabled />
                            </div>
                            <div className="form-group">
                                <label>CID de Entrada</label>
                                <input type="text" value={patient.cidIH} disabled />
                            </div>
                             <div className="form-group">
                                <label>Idade</label>
                                <input type="text" value={patient.idade} disabled />
                            </div>
                            <div className="form-group">
                                <label>Natureza da Guia</label>
                                <input type="text" value={patient.natureza} disabled />
                            </div>
                            <div className="form-group">
                                <label>Diagnósticos</label>
                                <input type="text" value={patient.diagnosticos} disabled />
                            </div>
                            <div className="form-group">
                                <label>Tipo Internação</label>
                                <input type="text" value={patient.tipoInternacao} disabled />
                            </div>
                            <div className="form-group">
                                <label>Programa NCI</label>
                                <input type="text" value={patient.programa} disabled />
                            </div>
                            <div className="form-group">
                                <label>Rede</label>
                                <input type="text" value={patient.rede || ''} disabled />
                            </div>
                            <div className="form-group">
                                <label>Região</label>
                                <input type="text" value={patient.regiao || ''} disabled />
                            </div>
                            <div className="form-group">
                                <label>Macro Região</label>
                                <input type="text" value={patient.macroRegiao || ''} disabled />
                            </div>
                        </div>
                    </fieldset>
                );
            case 'dadosInternacao':
                return (
                    <fieldset>
                        <legend>Dados da Internação</legend>
                        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px 24px' }}>
                            {/* Row 1 */}
                            <div className="form-group">
                                <label>Paciente</label>
                                <input type="text" value={patient.nome} disabled />
                            </div>
                            <div className="form-group">
                                <label>CPF</label>
                                <input type="text" value={patient.cpf} disabled />
                            </div>
                            <div className="form-group">
                                <label>Leito Ontem</label>
                                <input type="text" value={formatDateDdMmYy(patient.dataIH)} disabled />
                            </div>
                            {/* Row 2 */}
                            <div className="form-group">
                                <label>Leito Hoje</label>
                                <select name="leitoHoje" value={patient.leitoHoje} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                    {[...leitoOptions, 'Alta'].map(option => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Leito Auditado</label>
                                <select name="leitoAuditado" value={patient.leitoAuditado} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                    <option value="">Selecione</option>
                                    {[...leitoOptions, 'Alta'].map(option => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Alta Prev</label>
                                <input type="date" name="altaPrev" value={patient.altaPrev || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            {/* Row 3 */}
                            <div className="form-group form-group-highlight">
                                <label>Alta Replan</label>
                                <input type="date" name="altaReplan" value={patient.altaReplan || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Alta FIM</label>
                                <input type="date" name="altaFim" value={patient.altaFim || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Produto</label>
                                <input type="text" name="produto" value={patient.produto || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            {/* Row 4 */}
                            <div className="form-group form-group-highlight">
                                <label>Liminar</label>
                                <select name="liminar" value={patient.liminar} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                    <option>Não</option>
                                    <option>Sim</option>
                                </select>
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Carência</label>
                                <select name="carencia" value={patient.carencia || 'Não'} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                    <option>Não</option>
                                    <option>Sim</option>
                                </select>
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>CPT</label>
                                <select name="cpt" value={patient.cpt || 'Não'} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                    <option>Não</option>
                                    <option>Sim</option>
                                </select>
                            </div>
                            {/* Row 5 */}
                            <div className="form-group">
                                <label>CID Entrada</label>
                                <input type="text" name="cidIH" value={patient.cidIH} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>CID Evolutivo</label>
                                <input type="text" name="cidEvolutivo" value={patient.cidEvolutivo || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>CID Alta</label>
                                <input type="text" name="cidAlta" value={patient.cidAlta || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            {/* Row 6 */}
                            <div className="form-group">
                                <label>Criticidade</label>
                                <select name="criticidade" value={patient.criticidade} onChange={handleInputChange} disabled={user.role !== 'admin'}>
                                    <option value="Revisão Padrão">0-Revisão Padrão</option>
                                    <option value="Diário 24h">1-Rev diária</option>
                                    <option value="48h">2-Rev 48h</option>
                                    <option value="72h">3-Rev 72h</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Nome do Médico</label>
                                <input type="text" name="medico" value={patient.medico || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group form-group-highlight">
                                <label>Telefone</label>
                                <input type="tel" name="telefone" value={patient.telefone || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            {/* Row 7 */}
                            <div className="form-group">
                                <label>Última consulta</label>
                                <input type="date" name="ultimaConsulta" value={patient.ultimaConsulta || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            <div className="form-group full-width" style={{ gridColumn: 'span 2' }}>
                                {/* placeholder for alignment */}
                            </div>
                            {/* Row 8 */}
                            <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                                <label>Diagnóstico</label>
                                <textarea name="diagnosticos" rows={2} value={patient.diagnosticos} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                            {/* Row 9 */}
                            <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                                <label>Notas da Regulação</label>
                                <textarea name="notasRegulacao" rows={2} value={patient.notasRegulacao || ''} onChange={handleInputChange} disabled={user.role !== 'admin'} />
                            </div>
                        </div>
                    </fieldset>
                );
            case 'gestaoLeito':
                return (
                    <fieldset>
                        <legend>Gestão de Leito</legend>
                        <GestaoDeLeito user={user} patient={patient} onPatientChange={setPatient} />
                    </fieldset>
                );
            case 'historico':
                 const patientAdmissions = allPatients
                    .filter(p => p.cpf === initialPatient.cpf)
                    .sort((a, b) => new Date(b.dataIH).getTime() - new Date(a.dataIH).getTime());

                 return (
                    <fieldset>
                        <legend>Histórico de Internação</legend>
                        <p style={{ marginBottom: '16px', color: 'var(--light-text-color)' }}>
                            Esta sessão apresenta o histórico completo de todas as internações do paciente (vinculadas por CPF), compilado das Guias de Internação.
                        </p>
                        <div className="table-container" style={{ padding: 0 }}>
                            <table className="patient-table">
                                <thead>
                                    <tr>
                                        <th>Detalhes</th>
                                        <th>Guia</th>
                                        <th>Data IH</th>
                                        <th>Data da Alta</th>
                                        <th>Motivo da Alta</th>
                                        <th>Hospital Destino</th>
                                        <th>Natureza da Guia</th>
                                        <th>Status da Guia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patientAdmissions.length > 0 ? (
                                        patientAdmissions.map((admission) => (
                                            <tr key={admission.guia} className={admission.id === patient.id ? 'current-admission-row' : ''}>
                                                <td>
                                                    <button
                                                        className="icon-button"
                                                        onClick={() => onSelectPatient(admission)}
                                                        aria-label={`Acessar detalhes da guia ${admission.guia}`}
                                                        title="Acessar Guia"
                                                        disabled={admission.id === patient.id}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                    </button>
                                                </td>
                                                <td>{admission.guia}</td>
                                                <td>{formatDateDdMmYy(admission.dataIH)}</td>
                                                <td>{formatDateDdMmYy(admission.altaFim)}</td>
                                                <td>{admission.motivoAlta || 'N/A'}</td>
                                                <td>{admission.hospitalDestino}</td>
                                                <td>{admission.natureza}</td>
                                                <td>
                                                    <span className={`status-badge ${statusToClassName(admission.status)}`}>
                                                        {admission.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center' }}>Nenhum histórico de internação encontrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </fieldset>
                );
            case 'historicoAlteracoes':
                return (
                    <>
                        <fieldset>
                            <legend>Histórico de Alterações / Anotações</legend>
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
                                    <button type="submit" className="add-history-btn">Adicionar Anotação</button>
                                </form>
                            </fieldset>
                        )}
                    </>
                );
            case 'criticidadePrazos':
                return (
                    <>
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
                                    <label>Data da Alta</label>
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
                                        disabled={user.role !== 'admin' || !patient.altaFim}
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
                            <legend>Criticidade</legend>
                            <div className="form-group">
                                <label>Nível de Criticidade</label>
                                <div className="radio-group-horizontal">
                                    <label>
                                        <input
                                            type="radio"
                                            name="criticidade"
                                            value="Revisão Padrão"
                                            checked={patient.criticidade === 'Revisão Padrão'}
                                            onChange={handleInputChange}
                                            disabled={user.role !== 'admin'}
                                        />
                                        Revisão Padrão
                                    </label>
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
                    </>
                );
            case 'pendenciasEspera':
                return (
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
                );
            default:
                return null;
        }
    };

    return (
        <div className="page-container">
            <AppHeader
                title={`Detalhes da Guia`}
                subtitle={`${patient.nome} • Guia: ${patient.guia}`}
                onBack={onBack}
            />

            <div className="details-content-wrapper">
                <div className="details-layout">
                    <nav className="details-nav">
                        <h3 className="session-nav-title">Sessões</h3>
                        <div className="session-nav-list">
                            {sessions.map(session => (
                                <button
                                    key={session.id}
                                    className={`session-nav-item ${activeSession === session.id ? 'active' : ''}`}
                                    onClick={() => setActiveSession(session.id)}
                                >
                                    {session.title}
                                </button>
                            ))}
                        </div>
                    </nav>

                    <main className="details-main-content">
                        {renderContent()}
                        
                        {user.role === 'admin' && (
                            <div className="details-actions">
                                <button onClick={handleSave} className="save-details-btn">Salvar Alterações</button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default PatientDetails;