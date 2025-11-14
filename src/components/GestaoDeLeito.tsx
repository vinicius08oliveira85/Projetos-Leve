import React, { useState } from 'react';
import { User, Patient, LeitoRecord, LeitoType } from '../types/index.ts';
import { formatDateDdMmYy } from '../utils/helpers.ts';

const leitoOptions: LeitoType[] = ['CTI', 'CTI PED', 'CTI NEO', 'USI', 'USI PED', 'UI', 'UI PSQ'];
const leitoDoDiaOptions: (LeitoType | 'Alta')[] = [...leitoOptions, 'Alta'];

const GestaoDeLeito = ({ user, patient, onPatientChange, showToast }: { 
    user: User, 
    patient: Patient, 
    onPatientChange: (p: Patient) => void,
    showToast: (message: string, type?: 'success'|'error') => void
}) => {
    const [newDate, setNewDate] = useState('');
    const [newLeitoDoDia, setNewLeitoDoDia] = useState<LeitoType | 'Alta'>('UI');

    const handleRecordChange = (recordId: number, field: 'leitoDoDia', newValue: LeitoType | 'Alta') => {
        const updatedHistory = (patient.leitoHistory || []).map(r =>
            r.id === recordId ? { ...r, [field]: newValue } : r
        );
        onPatientChange({ ...patient, leitoHistory: updatedHistory });
    };

    const handleAddRecord = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDate) {
            showToast('Por favor, selecione uma data.', 'error');
            return;
        }
        if (newDate < patient.dataIH) {
            showToast('A data do registro não pode ser anterior à data de internação.', 'error');
            return;
        }
        const today = new Date();
        today.setUTCHours(0,0,0,0);
        const selectedDate = new Date(newDate);
        // Adjust for timezone differences by getting UTC date parts
        const selectedUTCDate = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate()));


        if (selectedUTCDate > today) {
            showToast('A data do registro não pode ser no futuro.', 'error');
            return;
        }
        if ((patient.leitoHistory || []).some(h => h.date === newDate)) {
            showToast('Já existe um registro para esta data.', 'error');
            return;
        }


        const newRecord: LeitoRecord = {
            id: Date.now(),
            date: newDate,
            leitoDoDia: newLeitoDoDia,
        };

        const newHistory = [...(patient.leitoHistory || []), newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        onPatientChange({ ...patient, leitoHistory: newHistory });

        setNewDate('');
        setNewLeitoDoDia('UI');
    };

    return (
        <div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                    <label>Leito Admissional</label>
                    <select
                        value={patient.leitoAdmissao}
                        onChange={(e) => onPatientChange({ ...patient, leitoAdmissao: e.target.value as LeitoType })}
                        disabled={user.role !== 'admin'}
                    >
                        {leitoOptions.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Leito Auditado</label>
                    <select
                        value={patient.leitoAuditado}
                        onChange={(e) => onPatientChange({ ...patient, leitoAuditado: e.target.value as LeitoType | 'Alta' })}
                        disabled={user.role !== 'admin'}
                    >
                        {leitoDoDiaOptions.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                </div>
            </div>
            <table className="history-table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Leito do Dia</th>
                    </tr>
                </thead>
                <tbody>
                    {(patient.leitoHistory || []).map(record => (
                        <tr key={record.id}>
                            <td>{formatDateDdMmYy(record.date)}</td>
                            <td>
                                {user.role === 'admin' ? (
                                    <select
                                        className="table-select"
                                        value={record.leitoDoDia}
                                        onChange={(e) => handleRecordChange(record.id, 'leitoDoDia', e.target.value as LeitoType | 'Alta')}
                                    >
                                        {leitoDoDiaOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                ) : (
                                    record.leitoDoDia
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {user.role === 'admin' && (
                <form className="add-history-form" onSubmit={handleAddRecord}>
                     <p style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '16px', fontSize: '16px' }}>Adicionar Novo Registro de Leito</p>
                    <div className="history-form-grid" style={{ gridTemplateColumns: '1fr 1fr auto', alignItems: 'flex-end', gap: '16px' }}>
                         <div className="form-group">
                            <label>Data</label>
                            <div className="date-input-wrapper">
                                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
                                {newDate && (
                                    <button 
                                        type="button"
                                        className="clear-date-button" 
                                        onClick={() => setNewDate('')}
                                        aria-label="Limpar data"
                                        title="Limpar data"
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Leito do Dia</label>
                            <select value={newLeitoDoDia} onChange={(e) => setNewLeitoDoDia(e.target.value as LeitoType | 'Alta')}>
                                {leitoDoDiaOptions.map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="add-history-btn">Adicionar</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default GestaoDeLeito;