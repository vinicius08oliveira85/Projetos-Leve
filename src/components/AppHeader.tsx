import React from 'react';
import LeveSaudeLogo from './LeveSaudeLogo';

const AppHeader = ({ title, subtitle, onBack }: { title: string, subtitle: string, onBack?: () => void }) => {
    return (
        <div className="app-header">
            {onBack && (
                <button onClick={onBack} className="back-button">← Voltar</button>
            )}
            <div className="app-header-content">
                <LeveSaudeLogo width={150} height={52} />
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>
        </div>
    );
};

export default AppHeader;
