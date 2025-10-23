import React from 'react';
import AppHeader from '../components/AppHeader';

const PlaceholderPage = ({ title, subtitle, onBack }: { title: string, subtitle: string, onBack: () => void }) => (
    <div className="page-container">
        <AppHeader 
            title={title}
            subtitle={subtitle}
            onBack={onBack}
        />
        <div className="placeholder-content">
            <p>Conteúdo para {title} será implementado aqui.</p>
        </div>
    </div>
);

export default PlaceholderPage;
