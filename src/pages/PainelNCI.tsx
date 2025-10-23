import React, { useState } from 'https://aistudiocdn.com/react@^19.2.0';
import AppHeader from '../components/AppHeader.tsx';

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--light-text-color)' }}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const FormularioIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);
const DetalhesIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);


const PainelNCI = ({ onBack, title, subtitle }: { onBack: () => void; title: string; subtitle: string; }) => {
    const [activeTab, setActiveTab] = useState('indicadores'); // 'indicadores', 'lista'
    const [timeFilter, setTimeFilter] = useState('Ontem');
    const [dropdownFilter, setDropdownFilter] = useState('Todos');

    const programPerformanceData = [
        { title: 'Inscritos', value: '50.000', color: 'blue' },
        { title: 'Internações', value: '4.000', color: 'blue' },
        { title: 'TX de Internação (%)', value: '8.00%', color: 'blue' },
        { title: 'PACdia/1000', value: '44.44' },
        { title: 'Internações CTI', value: '1.328', color: 'blue' },
        { title: 'CTIdia/1000', value: '14.76' },
        { title: 'Tendência (QTD de Internados)', value: '—' },
        { title: 'Tempo médio Internação (Diárias)', value: '9', color: 'red' },
        { title: 'Reinternado em 30 dias', value: '51', color: 'red', hasIcon: true },
        { title: 'Reinternado em 15 dias', value: '11', color: 'red', hasIcon: true },
        { title: 'Reinternado em 10 dias', value: '15', color: 'red', hasIcon: true },
        { title: 'Reinternado em 7 Dias', value: '5', color: 'red', hasIcon: true },
        { title: 'Reinternado em 72 Horas', value: '12', color: 'red', hasIcon: true },
        { title: 'Reinternado em 48 Horas', value: '34', color: 'red', hasIcon: true },
        { title: 'Reinternado em 2 horas', value: '8', color: 'red', hasIcon: true },
    ];
    
    const programOptions = [
        'Todos',
        'Sem programa',
        'APS',
        'Alta Complexidade',
        'Gestação Segura',
        'Home Care',
        'PGC',
        'Planejamento Familiar',
        'Saúde mental',
        'Te abraça'
    ];
    
    const internadosPorProgramaData = [
        { nome: 'Sofia Nascimento', cpf: '380.489.120-78', programa: 'Te abraça', hospital: 'HSF', dataIh: '13/03/2024', qtdDiarias: 22, cid: 'I21 - Infarto agudo do miocárdio', escalaLace: 14 },
        { nome: 'Natália Gomes', cpf: '500.302.247-35', programa: 'Te abraça', hospital: 'HSF', dataIh: '19/08/2025', qtdDiarias: 24, cid: 'F32 - Episódios depressivos', escalaLace: 6 },
        { nome: 'Natália Silva', cpf: '499.983.774-32', programa: 'Planejamento Familiar', hospital: 'HSF', dataIh: '09/03/2024', qtdDiarias: 22, cid: 'M75 - Lesões do ombro', escalaLace: 13 },
        { nome: 'Felipe Rocha', cpf: '352.622.271-37', programa: 'PGC', hospital: 'HIAS', dataIh: '22/03/2023', qtdDiarias: 13, cid: 'E11 - Diabetes mellitus tipo 2', escalaLace: 6 },
        { nome: 'Gabriela Rocha', cpf: '191.701.497-54', programa: 'Saúde mental', hospital: 'Vitória', dataIh: '01/08/2025', qtdDiarias: 14, cid: 'K35 - Apendicite aguda', escalaLace: 12 },
    ];
    
    const nciFilters = [
        { label: 'Programa', options: ['Todos'] },
        { label: 'Hospital Destino', options: ['Todos'] },
        { label: 'Produto', options: ['Todos'] },
        { label: 'Rede', options: ['Todos'] },
        { label: 'Região', options: ['Todos'] },
        { label: 'Macro Região', options: ['Todos'] },
        { label: 'Tipo Internação', options: ['Todos'] },
        { label: 'Leito', options: ['Todos'] },
        { label: 'CID', options: ['Todos'] },
        { label: 'Tipo Reinternação', options: ['Todos'] },
    ];


    return (
        <div className="page-container">
            <AppHeader
                title={title}
                subtitle={subtitle}
                onBack={onBack}
            />

            <div className="tab-bar">
                <button
                    className={`tab-button ${activeTab === 'indicadores' ? 'active' : ''}`}
                    onClick={() => setActiveTab('indicadores')}
                >
                    Performance dos Programas
                </button>
                <button
                    className={`tab-button ${activeTab === 'lista' ? 'active' : ''}`}
                    onClick={() => setActiveTab('lista')}
                >
                    Lista de Internados por Programa
                </button>
            </div>

            {activeTab === 'indicadores' && (
                <>
                    <div className="page-filters-bar">
                        <div className="internacoes-filter-dropdown">
                            <select value={dropdownFilter} onChange={(e) => setDropdownFilter(e.target.value)}>
                                {programOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        <div className="time-filter-bar">
                            <button className={`time-filter-button ${timeFilter === 'Ontem' ? 'active' : ''}`} onClick={() => setTimeFilter('Ontem')}>Ontem</button>
                            <button className={`time-filter-button ${timeFilter === 'Semana Passada' ? 'active' : ''}`} onClick={() => setTimeFilter('Semana Passada')}>Semana Passada</button>
                            <button className={`time-filter-button ${timeFilter === 'Últimos 30 Dias' ? 'active' : ''}`} onClick={() => setTimeFilter('Últimos 30 Dias')}>Últimos 30 dias</button>
                        </div>
                    </div>
                    <div className="indicadores-grid-container">
                        {programPerformanceData.map(item => (
                            <div className="indicator-card" key={item.title}>
                                <h3>{item.title}</h3>
                                <div className={`value ${item.color === 'blue' ? 'text-blue' : ''} ${item.color === 'red' ? 'text-red' : ''}`}>
                                    {item.value}
                                    {item.hasIcon && <EyeIcon />}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'lista' && (
                <>
                    <div className="content-box nci-filters-container">
                        <div className="nci-filters-grid">
                            {nciFilters.map(filter => (
                                <div className="form-group" key={filter.label}>
                                    <label>{filter.label}</label>
                                    <select>
                                        {filter.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="table-container" style={{marginTop: '20px', borderRadius: '12px', padding: '24px'}}>
                        <table className="internacoes-table">
                                <thead>
                                <tr>
                                    <th>NOME</th>
                                    <th>CPF</th>
                                    <th>PROGRAMA</th>
                                    <th>HOSPITAL IH</th>
                                    <th>DATA IH</th>
                                    <th>QTD DIÁRIAS</th>
                                    <th>CID</th>
                                    <th>ESCALA LACE</th>
                                    <th>FORMULÁRIO</th>
                                    <th>DETALHES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {internadosPorProgramaData.map((row, index) => (
                                    <tr key={index}>
                                        <td>{row.nome}</td>
                                        <td>{row.cpf}</td>
                                        <td>{row.programa}</td>
                                        <td>{row.hospital}</td>
                                        <td>{row.dataIh}</td>
                                        <td>{row.qtdDiarias}</td>
                                        <td className="truncate" title={row.cid}>{row.cid}</td>
                                        <td className={row.escalaLace >= 10 ? 'text-red' : 'text-green'}>
                                            {row.escalaLace}
                                        </td>
                                        <td>
                                            <button className="icon-button" aria-label="Formulário">
                                                <FormularioIcon />
                                            </button>
                                        </td>
                                        <td>
                                            <button className="icon-button" aria-label="Detalhes">
                                                <DetalhesIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default PainelNCI;