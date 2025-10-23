import React from 'https://aistudiocdn.com/react@^19.2.0';
import { User, MenuItem } from '../types/index.ts';
import AppHeader from '../components/AppHeader.tsx';

const MainMenu = ({ onSelectPage, user, onLogout, menuItems }: { onSelectPage: (page: string) => void, user: User, onLogout: () => void, menuItems: MenuItem[] }) => {
    
    return (
        <div className="main-menu-page">
            <div className="main-menu-top-bar">
                <span>Bem-vindo, {user.name}</span>
                <button onClick={onLogout} className="logout-button">Sair</button>
            </div>
             <AppHeader
                title="Selecione um Painel"
                subtitle="Escolha o painel que deseja acessar."
             />

            <div className="menu-grid">
                {menuItems.map(item => (
                     <div key={item.id} className="menu-card">
                        <div className="card-icon">{item.icon}</div>
                        <div className="card-content">
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </div>
                        <button className="card-button" onClick={() => onSelectPage(item.page)}>
                           Acessar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MainMenu;