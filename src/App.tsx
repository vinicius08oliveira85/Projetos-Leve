import React, { useState, useMemo } from 'react';
import { User, Patient, MenuItem, Esperas } from './types/index.ts';
import { mockPatients } from './data/mockPatients.ts';
import { generateChangeHistory } from './utils/helpers.ts';
import LoginScreen from './pages/LoginScreen.tsx';
import MainMenu from './pages/MainMenu.tsx';
import MapaInternacao from './pages/MapaInternacao.tsx';
import MapaDeEspera from './pages/MapaDeEspera.tsx';
import PatientDetails from './pages/PatientDetails.tsx';
import PacientesAguardandoCirurgia from './pages/PacientesAguardandoCirurgia.tsx';
import PacientesAguardandoExame from './pages/PacientesAguardandoExame.tsx';
import PacientesAguardandoParecer from './pages/PacientesAguardandoParecer.tsx';
import PacientesAguardandoDesospitalizacao from './pages/PacientesAguardandoDesospitalizacao.tsx';
import DetalhesEsperaCirurgia from './pages/DetalhesEsperaCirurgia.tsx';
import DetalhesEsperaExame from './pages/DetalhesEsperaExame.tsx';
import DetalhesEsperaParecer from './pages/DetalhesEsperaParecer.tsx';
import DetalhesEsperaDesospitalizacao from './pages/DetalhesEsperaDesospitalizacao.tsx';
import PainelIndicadoresInternacao from './pages/PainelIndicadoresInternacao.tsx';
import PainelNCI from './pages/PainelNCI.tsx';
import Toast from './components/Toast.tsx';

const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<string>('Menu');
    const [previousPage, setPreviousPage] = useState<string>('Menu');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patients, setPatients] = useState<Patient[]>(mockPatients);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const menuItems: MenuItem[] = useMemo(() => [
        { id: 'painel-nci', page: 'Painel NCI', title: 'Painel NCI', description: 'Performance de programas e lista de internados.', icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
        { id: 'mapa-internacao', page: 'Mapa de Internação', title: 'Mapa de Internação', description: 'Cadastro de dados diários', icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
        { id: 'painel-internacao', page: 'Painel de Internação', title: 'Painel de Internação', description: 'Indicadores de performance', icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg> },
        { id: 'mapa-espera', page: 'Mapa de Espera', title: 'Mapa de Espera', description: 'Lista de ações imediatas', icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg> },
    ].sort((a, b) => a.title.localeCompare(b.title)), []);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
        setCurrentPage('Menu');
    };

    const handleLogout = () => {
        setUser(null);
        setCurrentPage('Login');
    };

    const handleSelectPage = (page: string) => {
        setPreviousPage(currentPage);
        setCurrentPage(page);
    };

    const handleSelectPatient = (patient: Patient) => {
        const currentPatientData = patients.find(p => p.id === patient.id) || patient;
        setSelectedPatient(currentPatientData);
        setPreviousPage(currentPage);
        setCurrentPage('Detalhes da Guia');
    };
    
    const handleBackToMenu = () => {
        setPreviousPage(currentPage);
        setCurrentPage('Menu');
        setSelectedPatient(null);
    };

    const handleUpdatePatient = (updatedPatient: Patient, user: User) => {
        const originalPatient = patients.find(p => p.id === updatedPatient.id);
        if (!originalPatient) return;

        const historyEntries = generateChangeHistory(originalPatient, updatedPatient, user);
        
        const finalPatient = {
            ...updatedPatient,
            historico: [...(updatedPatient.historico || []), ...historyEntries]
        };

        setPatients(prevPatients =>
            prevPatients.map(p => (p.id === finalPatient.id ? finalPatient : p))
        );
        if (selectedPatient && selectedPatient.id === finalPatient.id) {
            setSelectedPatient(finalPatient);
        }
    };
    
    const handleUpdateMultiplePatients = (updatedPatients: Patient[], user: User) => {
        const updatedPatientMap = new Map<number, Patient>();

        for (const updated of updatedPatients) {
            const original = patients.find(p => p.id === updated.id);
            if (!original) continue;

            const historyEntries = generateChangeHistory(original, updated, user);
            const finalPatient = {
                ...updated,
                historico: [...(updated.historico || []), ...historyEntries],
            };
            updatedPatientMap.set(updated.id, finalPatient);
        }
        
        setPatients(currentPatients => 
            currentPatients.map(p => updatedPatientMap.get(p.id) || p)
        );
    };

    const handleBackFromDetails = () => {
        setSelectedPatient(null);
        setCurrentPage(previousPage);
    };
    
    const handleSelectEspera = (esperaType: keyof Esperas) => {
        setPreviousPage(currentPage);
        switch (esperaType) {
            case 'cirurgia':
                setCurrentPage('Pacientes Aguardando Cirurgia');
                break;
            case 'exame':
                setCurrentPage('Pacientes Aguardando Exame');
                break;
            case 'parecer':
                setCurrentPage('Pacientes Aguardando Parecer');
                break;
            case 'desospitalizacao':
                setCurrentPage('Pacientes Aguardando Desospitalização');
                break;
            default:
                break;
        }
    };
    
    const handleViewSurgeryWaitDetails = (patient: Patient) => {
        setSelectedPatient(patient);
        setPreviousPage(currentPage);
        setCurrentPage('Detalhes da Espera de Cirurgia');
    };
    
    const handleViewExamWaitDetails = (patient: Patient) => {
        setSelectedPatient(patient);
        setPreviousPage(currentPage);
        setCurrentPage('Detalhes da Espera de Exame');
    };

    const handleViewParecerWaitDetails = (patient: Patient) => {
        setSelectedPatient(patient);
        setPreviousPage(currentPage);
        setCurrentPage('Detalhes da Espera de Parecer');
    };
    
    const handleViewDesospitalizacaoWaitDetails = (patient: Patient) => {
        setSelectedPatient(patient);
        setPreviousPage(currentPage);
        setCurrentPage('Detalhes da Espera de Desospitalização');
    };

    const renderPage = () => {
        if (!user) {
            return <LoginScreen onLogin={handleLogin} />;
        }
        
        const pageInfo = menuItems.find(item => item.page === currentPage);

        if (selectedPatient && currentPage === 'Detalhes da Guia') {
            return <PatientDetails 
                        patient={selectedPatient} 
                        allPatients={patients}
                        onBack={handleBackFromDetails} 
                        user={user}
                        onSavePatient={handleUpdatePatient}
                        showToast={showToast}
                        onSelectPatient={handleSelectPatient}
                    />;
        }

        switch (currentPage) {
            case 'Menu':
                return <MainMenu onSelectPage={handleSelectPage} user={user} onLogout={handleLogout} menuItems={menuItems} />;
            case 'Mapa de Internação':
                 return <MapaInternacao 
                            onBack={handleBackToMenu} 
                            user={user} 
                            patients={patients} 
                            onSelectPatient={handleSelectPatient}
                            onSavePatient={handleUpdatePatient}
                            onSavePatients={handleUpdateMultiplePatients}
                            title={pageInfo?.title ?? 'Mapa de Internação'}
                            subtitle={pageInfo?.description ?? ''} 
                            showToast={showToast}
                        />;
            case 'Mapa de Espera':
                return <MapaDeEspera 
                            onBack={handleBackToMenu} 
                            onSelectPatient={handleSelectPatient} 
                            user={user} 
                            patients={patients}
                            onUpdatePatient={handleUpdatePatient}
                            onSavePatients={handleUpdateMultiplePatients} 
                            showToast={showToast}
                            title={pageInfo?.title ?? 'Mapa de Espera'}
                            subtitle={pageInfo?.description ?? ''}
                        />;
            case 'Pacientes Aguardando Cirurgia':
                 return <PacientesAguardandoCirurgia
                            onBack={() => handleSelectPage('Mapa de Espera')}
                            onUpdatePatient={handleUpdatePatient}
                            user={user}
                            patients={patients}
                            showToast={showToast}
                        />;
            case 'Pacientes Aguardando Exame':
                return <PacientesAguardandoExame
                           onBack={() => handleSelectPage('Mapa de Espera')}
                           onViewDetails={handleViewExamWaitDetails}
                           user={user}
                           patients={patients}
                           onUpdatePatient={handleUpdatePatient}
                           showToast={showToast}
                       />;
            case 'Pacientes Aguardando Parecer':
                return <PacientesAguardandoParecer
                           onBack={() => handleSelectPage('Mapa de Espera')}
                           onViewDetails={handleViewParecerWaitDetails}
                           user={user}
                           patients={patients}
                           onSavePatients={handleUpdateMultiplePatients}
                           showToast={showToast}
                       />;
            case 'Pacientes Aguardando Desospitalização':
                return <PacientesAguardandoDesospitalizacao
                           onBack={() => handleSelectPage('Mapa de Espera')}
                           onViewDetails={handleViewDesospitalizacaoWaitDetails}
                           user={user}
                           patients={patients}
                           onUpdatePatient={handleUpdatePatient}
                           showToast={showToast}
                       />;
            case 'Detalhes da Espera de Cirurgia':
                 return <DetalhesEsperaCirurgia
                            patient={selectedPatient!}
                            onBack={handleBackFromDetails}
                            user={user}
                            onUpdatePatient={handleUpdatePatient}
                            showToast={showToast}
                        />;
            case 'Detalhes da Espera de Exame':
                 return <DetalhesEsperaExame
                            patient={selectedPatient!}
                            onBack={handleBackFromDetails}
                            user={user}
                            onUpdatePatient={handleUpdatePatient}
                            showToast={showToast}
                        />;
            case 'Detalhes da Espera de Parecer':
                 return <DetalhesEsperaParecer
                             patient={selectedPatient!}
                             onBack={handleBackFromDetails}
                             user={user}
                             onUpdatePatient={handleUpdatePatient}
                             showToast={showToast}
                         />;
            case 'Detalhes da Espera de Desospitalização':
                 return <DetalhesEsperaDesospitalizacao
                             patient={selectedPatient!}
                             onBack={handleBackFromDetails}
                             user={user}
                             onUpdatePatient={handleUpdatePatient}
                             showToast={showToast}
                         />;
            case 'Painel de Internação':
                return <PainelIndicadoresInternacao onBack={handleBackToMenu} />;
            case 'Painel NCI':
                return <PainelNCI 
                            title={pageInfo?.title ?? currentPage} 
                            subtitle={pageInfo?.description ?? 'Performance de programas e lista de internados.'} 
                            onBack={handleBackToMenu} 
                        />;
            default:
                return <MainMenu onSelectPage={handleSelectPage} user={user} onLogout={handleLogout} menuItems={menuItems} />;
        }
    };

    return (
        <div className="app-container">
            {renderPage()}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default App;