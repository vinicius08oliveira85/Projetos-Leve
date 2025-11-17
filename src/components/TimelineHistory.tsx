import React from 'react';
import { TimelineHistoryEntry } from '../types/index.ts';
import { formatDateTimeDdMmYy } from '../utils/helpers.ts';

const TimelineHistory = ({ history }: { history: TimelineHistoryEntry[] }) => {
    if (!history || history.length === 0) {
        return <p>Nenhum histórico de alterações encontrado.</p>;
    }

    // Sort history from newest to oldest
    const sortedHistory = [...history].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return (
        <div className="timeline-container">
            {sortedHistory.map((item, index) => (
                <div className="timeline-item" key={index}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                        <div className="timeline-header">
                            <span className="timeline-user">{item.responsavel}</span>
                            <span className="timeline-date">{formatDateTimeDdMmYy(item.data)}</span>
                        </div>
                        <p className="timeline-description">{item.alteracao}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TimelineHistory;
