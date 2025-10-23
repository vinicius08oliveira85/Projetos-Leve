import React from 'https://aistudiocdn.com/react@^19.2.0';
import { Patient, User, LeitoType } from '../types/index.ts';

const leitoOptions: LeitoType[] = ['CTI', 'CTI PED', 'CTI NEO', 'USI', 'USI PED', 'UI', 'UI PSQ'];

const DailyTrackingTable = ({ patient, user, onPatientUpdate }: { patient: Patient, user: User, onPatientUpdate: (updatedPatient: Patient) => void }) => {
    const period = Array.from({ length: 14 }, (_, i) => `D${i}`);
    
    const handleLeitoChange = (dayIndex: number, newLeito: LeitoType) => {
        // This is a placeholder for a more complex state update logic
        // For now, we just log it
        console.log(`Day ${dayIndex} Leito Auditado changed to ${newLeito}`);
    };

    return (
        <div className="daily-tracking-container">
            <table className="daily-tracking-table">
                <thead>
                    <tr>
                        <th>Período</th>
                        {period.map(p => <th key={p}>{p}</th>)}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Data Internação</td>
                        {period.map((_, i) => <td key={i}>{i < 7 ? `${11 + i}/05` : 'Alta'}</td>)}
                    </tr>
                    <tr>
                        <td>Leito Sistema</td>
                        {['UI', 'CTI', 'CTI', 'UI', 'CTI', 'CTI', 'UI'].map((leito, i) => <td key={i}>{leito}</td>)}
                        {Array.from({length: 7}).map((_, i) => <td key={i+7}>Alta</td>)}
                    </tr>
                    <tr>
                        <td>Leito Auditado</td>
                        {['UI', 'CTI', 'CTI', 'UI', 'CTI', 'CTI', 'UI'].map((leito, i) => (
                            <td key={i}>
                                {user.role === 'admin' ? (
                                    <select defaultValue={leito} className="inline-select" onChange={(e) => handleLeitoChange(i, e.target.value as LeitoType)}>
                                        {leitoOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                ) : (
                                    leito
                                )}
                            </td>
                        ))}
                         {Array.from({length: 7}).map((_, i) => <td key={i+7}>Alta</td>)}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default DailyTrackingTable;