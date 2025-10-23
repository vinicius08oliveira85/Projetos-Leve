import React, { useState } from 'react';
import AppHeader from '../components/AppHeader.tsx';

const PainelIndicadoresInternacao = ({ onBack }: { onBack: () => void }) => {
    const [activeTab, setActiveTab] = useState('indicadores'); // 'indicadores', 'diaadia', 'porHospital'
    const [timeFilter, setTimeFilter] = useState('Ontem');
    const [dropdownFilter, setDropdownFilter] = useState('Todos');

    const indicatorData = [
        { title: 'Consultas de Urgência', value: '823', color: 'blue' },
        { title: 'Internações', value: '226' },
        { title: 'TX de Conversão (%)', value: '27.46%', color: 'blue' },
        { title: 'PACdia/1000', value: '2.51' },
        { title: 'Internações CTI', value: '80', color: 'blue' },
        { title: 'CTIdia/1000', value: '0.89' },
        { title: 'Tendência (QTD de Internados)', value: '↓', type: 'trend' },
        { title: 'Tempo médio Internação (Diárias)', value: '8', color: 'blue' },
        { title: 'Internações HIAS', value: '113', color: 'blue' },
        { title: 'TX HIAS Real (%)', value: '27.81%', color: 'blue' },
        { title: 'TX HIAS Plan (%)', value: '28.81%' },
        { title: 'Diferença (RxP)', value: '1.00', color: 'blue' },
    ];

    const tableData = [
        { dia: '25.08', consultasUrgencia: 532, internacoes: 216, txConversao: '40.60%', pacdia1000: '2.40', internacoesCTI: 69, ctidia1000: '0.77', tendencia: 'none', tempoMedio: 10, internacoesHIAS: 94, txHiasReal: '23.92%', txHiasPlan: '28.92%', diferenca: '5.00' },
        { dia: '24.08', consultasUrgencia: 836, internacoes: 278, txConversao: '33.25%', pacdia1000: '3.09', internacoesCTI: 100, ctidia1000: '1.11', tendencia: 'down', tempoMedio: 9, internacoesHIAS: 114, txHiasReal: '31.42%', txHiasPlan: '35.42%', diferenca: '4.00' },
        { dia: '23.08', consultasUrgencia: 832, internacoes: 214, txConversao: '25.72%', pacdia1000: '2.38', internacoesCTI: 68, ctidia1000: '0.76', tendencia: 'down', tempoMedio: 11, internacoesHIAS: 177, txHiasReal: '22.94%', txHiasPlan: '26.94%', diferenca: '4.00' },
        { dia: '22.08', consultasUrgencia: 698, internacoes: 290, txConversao: '41.55%', pacdia1000: '3.22', internacoesCTI: 90, ctidia1000: '1.00', tendencia: 'up', tempoMedio: 7, internacoesHIAS: 166, txHiasReal: '21.41%', txHiasPlan: '24.41%', diferenca: '3.00' },
        { dia: '21.08', consultasUrgencia: 680, internacoes: 280, txConversao: '41.18%', pacdia1000: '3.11', internacoesCTI: 98, ctidia1000: '1.09', tendencia: 'down', tempoMedio: 12, internacoesHIAS: 154, txHiasReal: '24.76%', txHiasPlan: '29.76%', diferenca: '5.00' },
    ];

    const hospitalTableData = [
        { hospital: 'Pro Cardiaco', consultasUrgencia: 784, internacoes: 326, txConversao: '41.58%', pacdia1000: '3.62', internacoesCTI: 109, ctidia1000: '1.21', tendencia: 'none', tempoMedio: 9 },
        { hospital: 'HIAS', consultasUrgencia: 766, internacoes: 305, txConversao: '39.82%', pacdia1000: '3.39', internacoesCTI: 100, ctidia1000: '1.11', tendencia: 'none', tempoMedio: 8 },
        { hospital: 'SEMIU', consultasUrgencia: 710, internacoes: 297, txConversao: '41.83%', pacdia1000: '3.30', internacoesCTI: 98, ctidia1000: '1.09', tendencia: 'none', tempoMedio: 9 },
        { hospital: 'HSF', consultasUrgencia: 696, internacoes: 270, txConversao: '38.79%', pacdia1000: '3.00', internacoesCTI: 89, ctidia1000: '0.99', tendencia: 'none', tempoMedio: 7 },
        { hospital: 'Vitória', consultasUrgencia: 697, internacoes: 267, txConversao: '38.31%', pacdia1000: '2.97', internacoesCTI: 91, ctidia1000: '1.01', tendencia: 'none', tempoMedio: 8 },
        { hospital: 'Pronto Baby', consultasUrgencia: 666, internacoes: 264, txConversao: '39.64%', pacdia1000: '2.93', internacoesCTI: 84, ctidia1000: '0.93', tendencia: 'none', tempoMedio: 7 },
    ];

    const renderTendencia = (tendencia: 'up' | 'down' | 'none') => {
        if (tendencia === 'up') return <span className="trend-up">↑</span>;
        if (tendencia === 'down') return <span className="trend-down">↓</span>;
        return <span>—</span>;
    };

    return (
        <div className="page-container">
            <AppHeader
                title="Painel de Internação"
                subtitle="Indicadores de performance e acompanhamento diário."
                onBack={onBack}
            />
            <div className="page-filters-bar">
                {(activeTab === 'diaadia' || activeTab === 'porHospital') && (
                    <div className="internacoes-filter-dropdown">
                        <select value={dropdownFilter} onChange={(e) => setDropdownFilter(e.target.value)}>
                            <option value="Todos">Todos</option>
                        </select>
                    </div>
                )}
                <div className="time-filter-bar">
                    <button className={`time-filter-button ${timeFilter === 'Ontem' ? 'active' : ''}`} onClick={() => setTimeFilter('Ontem')}>Ontem</button>
                    <button className={`time-filter-button ${timeFilter === 'Semana Passada' ? 'active' : ''}`} onClick={() => setTimeFilter('Semana Passada')}>Semana Passada</button>
                    <button className={`time-filter-button ${timeFilter === 'Últimos 30 Dias' ? 'active' : ''}`} onClick={() => setTimeFilter('Últimos 30 Dias')}>Últimos 30 dias</button>
                </div>
            </div>

            <div className="tab-bar">
                <button
                    className={`tab-button ${activeTab === 'indicadores' ? 'active' : ''}`}
                    onClick={() => setActiveTab('indicadores')}
                >
                    Indicadores de Internação
                </button>
                <button
                    className={`tab-button ${activeTab === 'diaadia' ? 'active' : ''}`}
                    onClick={() => setActiveTab('diaadia')}
                >
                    Internações dia a dia
                </button>
                <button
                    className={`tab-button ${activeTab === 'porHospital' ? 'active' : ''}`}
                    onClick={() => setActiveTab('porHospital')}
                >
                    Internações por Hospital
                </button>
            </div>

            {activeTab === 'indicadores' && (
                <div className="indicadores-grid-container">
                    {indicatorData.map(item => (
                        <div className="indicator-card" key={item.title}>
                            <h3>{item.title}</h3>
                            <div className={`value ${item.color === 'blue' ? 'text-blue' : ''} ${item.type === 'trend' ? 'trend-down' : ''}`}>
                                {item.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {activeTab === 'diaadia' && (
                <div className="internacoes-table-container">
                    <table className="internacoes-table">
                        <thead>
                            <tr>
                                <th>DIA</th>
                                <th>CONSULTAS DE URGÊNCIA</th>
                                <th>INTERNAÇÕES</th>
                                <th>TX DE CONVERSÃO (%)</th>
                                <th>PACDIA/1000</th>
                                <th>INTERNAÇÕES CTI</th>
                                <th>CTIDIA/1000</th>
                                <th>TENDÊNCIA (QTD DE INTERNADOS)</th>
                                <th>TEMPO MÉDIO INTERNAÇÃO (DIÁRIAS)</th>
                                <th>INTERNAÇÕES HIAS</th>
                                <th>TX HIAS REAL</th>
                                <th>TX HIAS PLAN</th>
                                <th>DIFERENÇA (RXP)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row, index) => (
                                <tr key={index}>
                                    <td>{row.dia}</td>
                                    <td className="text-blue">{row.consultasUrgencia}</td>
                                    <td>{row.internacoes}</td>
                                    <td className="text-blue">{row.txConversao}</td>
                                    <td>{row.pacdia1000}</td>
                                    <td>{row.internacoesCTI}</td>
                                    <td>{row.ctidia1000}</td>
                                    <td>{renderTendencia(row.tendencia as any)}</td>
                                    <td className="text-red">{row.tempoMedio}</td>
                                    <td>{row.internacoesHIAS}</td>
                                    <td className="text-blue">{row.txHiasReal}</td>
                                    <td>{row.txHiasPlan}</td>
                                    <td className="text-blue">{row.diferenca}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'porHospital' && (
                 <div className="internacoes-table-container">
                    <table className="internacoes-table">
                        <thead>
                            <tr>
                                <th>HOSPITAL IH</th>
                                <th>CONSULTAS DE URGÊNCIA</th>
                                <th>INTERNAÇÕES</th>
                                <th>TX DE CONVERSÃO (%)</th>
                                <th>PACDIA/1000</th>
                                <th>INTERNAÇÕES CTI</th>
                                <th>CTIDIA/1000</th>
                                <th>TENDÊNCIA (QTD DE INTERNADOS)</th>
                                <th>TEMPO MÉDIO INTERNAÇÃO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hospitalTableData.map((row, index) => (
                                <tr key={index}>
                                    <td>{row.hospital}</td>
                                    <td className="text-blue">{row.consultasUrgencia}</td>
                                    <td>{row.internacoes}</td>
                                    <td className="text-blue">{row.txConversao}</td>
                                    <td>{row.pacdia1000}</td>
                                    <td>{row.internacoesCTI}</td>
                                    <td>{row.ctidia1000}</td>
                                    <td>{renderTendencia(row.tendencia as any)}</td>
                                    <td className="text-red">{row.tempoMedio}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PainelIndicadoresInternacao;