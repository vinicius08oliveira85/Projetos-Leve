import React, { useState, useMemo, useRef, useEffect } from 'react';
import AppHeader from '../components/AppHeader.tsx';

// --- DADOS DA HOSPITALIZAÇÃO SUB-COMPONENT (NEW VERSION) ---
const DadosHospitalizacaoDashboard = () => {
    // Filter State & Handlers
    const [hospitalFilter, setHospitalFilter] = useState<string[]>([]);
    const [tempHospitalFilter, setTempHospitalFilter] = useState<string[]>([]);
    const [isHospitalDropdownOpen, setIsHospitalDropdownOpen] = useState(false);
    const hospitalDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (hospitalDropdownRef.current && !hospitalDropdownRef.current.contains(event.target as Node)) {
                setIsHospitalDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const uniqueHospitals = ['PRONTONIL', 'JORGE JABER', 'HSF', 'SANTA LUCIA', 'ENIO SERRA', 'ISRAELITA', 'EMCOR', 'VITORIA', 'PRO CARDIACO', 'PRONTO BABY', 'HIAS'];

    const handleApplyFilters = () => setHospitalFilter(tempHospitalFilter);
    const handleClearFilters = () => {
        setTempHospitalFilter([]);
        setHospitalFilter([]);
    };
    const handleHospitalMultiChange = (hospital: string) => {
        setTempHospitalFilter(prev => prev.includes(hospital) ? prev.filter(s => s !== hospital) : [...prev, hospital]);
    };

    // Static Data
    const carteiraData = { carteira: "98.219", totalInternado: 248, resultado: "2,52", cti: "0,64", mediaMes: "2,36", mediaMesCti: "0,70" };
    const internacaoRedeData = [{ rede: 'REDE PREMIUM', qtd: 29, ocupacao: '11,69%' }, { rede: 'REDE BÁSICA', qtd: 219, ocupacao: '88,31%' }];
    const naturezaGuiaData = [{ natureza: 'URGENCIA', total: 177, pacDia: "1,80" }, { natureza: 'ELETIVA', total: 32, pacDia: "0,33" }, { natureza: 'PSIQUIATRIA', total: 39, pacDia: "0,40" }];
    const regimeData = [{ regime: 'URGENCIA', qtd: 216 }, { regime: 'ELETIVA', qtd: 32 }, { regime: 'TOTAL', qtd: 248 }];
    const leitoData = [{ leito: 'UI', qtd: 185 }, { leito: 'USI', qtd: 0 }, { leito: 'CTI', qtd: 63 }, { leito: 'TOTAL', qtd: 248 }];
    const regiaoData = [{ regiao: 'RIO DE JANEIRO', carteira: "67.494", qtd: 178, cti: 46, pacDia: "2,64", ctiPacDia: "0,68" }, { regiao: 'BAIXADA', carteira: "10.346", qtd: 32, cti: 4, pacDia: "3,09", ctiPacDia: "0,39" }, { regiao: 'LESTE', carteira: "11.752", qtd: 31, cti: 9, pacDia: "2,64", ctiPacDia: "0,77" }];
    const produtoPremiumData = [{ carteira: '18.511', qtd: 64, cti: 15, pacDia: "3,46", ctiPacDia: "0,81" }, { carteira: 'REDE PREMIUM', qtd: 26, cti: 9, pacDia: '40,63%', ctiPacDia: '' }, { carteira: 'REDE BÁSICA', qtd: 38, cti: 8, pacDia: '59,38%', ctiPacDia: '' }];
    const metaData = { meta: "2,35", metaCti: "0,80", pctMeta: '7,45%', pctMetaCti: '-19,82%' };
    const solicitacaoData = [
        { data: '01/10/2025', qtd: 21, liberada: 21, negada: 0, eletivo: 21, evitada: 0, entrada: 42, saida: 45 },
        { data: '02/10/2025', qtd: 34, liberada: 29, negada: 3, eletivo: 18, evitada: 2, entrada: 47, saida: 41 },
        { data: '03/10/2025', qtd: 38, liberada: 35, negada: 1, eletivo: 15, evitada: 2, entrada: 50, saida: 45 },
    ];
    const hospitalData = [
        { hospital: 'PRONTONIL', ui: 4, el: 0, usi: 0, cti: 1, elCti: 0, total: 5, pct: '2,02%' },
        { hospital: 'JORGE JABER', ui: 0, el: 0, usi: 0, cti: 0, elCti: 0, total: 0, pct: '0,00%' },
        { hospital: 'HSF', ui: 9, el: 0, usi: 0, cti: 2, elCti: 0, total: 11, pct: '4,44%' },
        { hospital: 'SANTA LUCIA', ui: 0, el: 0, usi: 0, cti: 0, elCti: 0, total: 0, pct: '0,00%' },
    ];

    return (
        <div style={{ marginTop: '24px' }}>
            <div className="filter-bar">
                <div className="filter-controls">
                    <div className="form-group" ref={hospitalDropdownRef}>
                        <label>Hospital:</label>
                        <div className="multi-select-dropdown">
                            <button type="button" className="multi-select-dropdown-button" onClick={() => setIsHospitalDropdownOpen(prev => !prev)}>
                                {tempHospitalFilter.length === 0 ? 'Todos' : `${tempHospitalFilter.length} selecionados`}
                            </button>
                            {isHospitalDropdownOpen && (
                                <div className="multi-select-dropdown-menu">
                                    {uniqueHospitals.map(h => (
                                        <label key={h} className="multi-select-dropdown-item">
                                            <input type="checkbox" checked={tempHospitalFilter.includes(h)} onChange={() => handleHospitalMultiChange(h)} /> {h}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="filter-actions">
                    <button onClick={handleClearFilters} className="secondary-action-button">Limpar</button>
                    <button onClick={handleApplyFilters} className="save-button">Aplicar</button>
                </div>
            </div>

            <div className="dh-dashboard-header">
                <h2>DADOS HOSPITALIZAÇÃO</h2>
                <span>07/11/2025</span>
            </div>

            <div className="dados-hosp-dashboard">
                <div className="dh-widget">
                    <h3 className="dh-widget-title">CARTEIRA</h3>
                    <table className="dh-widget-table"><tbody>
                        <tr><td className="label-cell">CARTEIRA</td><td className="value-cell">{carteiraData.carteira}</td></tr>
                        <tr><td className="label-cell">TOTAL INTERNADO</td><td className="value-cell">{carteiraData.totalInternado}</td></tr>
                        <tr><td className="label-cell">RESULTADO</td><td className="value-cell">{carteiraData.resultado}</td></tr>
                        <tr><td className="label-cell">CTI</td><td className="value-cell">{carteiraData.cti}</td></tr>
                        <tr><td className="label-cell">Média Mês</td><td className="value-cell">{carteiraData.mediaMes}</td></tr>
                        <tr><td className="label-cell">Média Mês CTI</td><td className="value-cell">{carteiraData.mediaMesCti}</td></tr>
                    </tbody></table>
                </div>
                 <div className="dh-widget">
                    <h3 className="dh-widget-title">INTERNAÇÃO POR REDE</h3>
                    <table className="dh-widget-table"><thead><tr><th>REDE</th><th>QTD. INTERNADO</th><th>% OCUPAÇÃO</th></tr></thead><tbody>
                        {internacaoRedeData.map(d => <tr key={d.rede}><td>{d.rede}</td><td className="value-cell">{d.qtd}</td><td className="value-cell">{d.ocupacao}</td></tr>)}
                    </tbody></table>
                </div>
                 <div className="dh-widget">
                    <h3 className="dh-widget-title">NATUREZA DA GUIA</h3>
                    <table className="dh-widget-table"><thead><tr><th>NATUREZA</th><th>TOTAL</th><th>PAC DIA</th></tr></thead><tbody>
                        {naturezaGuiaData.map(d => <tr key={d.natureza}><td>{d.natureza}</td><td className="value-cell">{d.total}</td><td className="value-cell">{d.pacDia}</td></tr>)}
                        <tr><td className="label-cell"><strong>SOMA DIA</strong></td><td colSpan={2} className="value-cell"><strong>2,52</strong></td></tr>
                    </tbody></table>
                </div>
                <div className="dh-widget">
                    <h3 className="dh-widget-title">REGIME</h3>
                    <table className="dh-widget-table"><thead><tr><th>REGIME</th><th>QTD. INTERNADO</th></tr></thead><tbody>
                        {regimeData.map(d => <tr key={d.regime}><td>{d.regime}</td><td className="value-cell">{d.qtd}</td></tr>)}
                    </tbody></table>
                </div>
                 <div className="dh-widget">
                    <h3 className="dh-widget-title">LEITO</h3>
                    <table className="dh-widget-table"><thead><tr><th>LEITO</th><th>QTD. INTERNADO</th></tr></thead><tbody>
                        {leitoData.map(d => <tr key={d.leito}><td>{d.leito}</td><td className="value-cell">{d.qtd}</td></tr>)}
                    </tbody></table>
                </div>
                <div className="dh-widget">
                    <h3 className="dh-widget-title">Meta x Resultado</h3>
                    <div className="mxr-chart-container">
                        {/* Meta Group */}
                        <div className="mxr-chart-group">
                            <div className="mxr-bars">
                                <div className="mxr-bar-wrapper">
                                    <span className="mxr-bar-label">{metaData.meta}</span>
                                    <div className="mxr-bar goal" style={{ height: '120px' }}></div>
                                </div>
                                <div className="mxr-bar-wrapper">
                                    <span className="mxr-bar-label">{metaData.pctMeta}</span>
                                    <div className="mxr-bar result positive" style={{ height: '30px' }}></div>
                                </div>
                            </div>
                            <div className="mxr-category-label">Meta</div>
                        </div>

                        {/* Meta CTI Group */}
                        <div className="mxr-chart-group">
                            <div className="mxr-bars">
                                <div className="mxr-bar-wrapper">
                                    <span className="mxr-bar-label">{metaData.metaCti}</span>
                                    <div className="mxr-bar goal" style={{ height: '41px' }}></div>
                                </div>
                            </div>
                            <div className="mxr-bars negative-group">
                                <div className="mxr-bar-wrapper">
                                    <div className="mxr-bar result negative" style={{ height: '45px' }}></div>
                                    <span className="mxr-bar-label">{metaData.pctMetaCti}</span>
                                </div>
                            </div>
                            <div className="mxr-category-label">Meta CTI</div>
                        </div>
                    </div>
                    <table className="dh-widget-table">
                         <thead>
                            <tr>
                                <th>Indicador</th>
                                <th style={{ textAlign: 'right' }}>Meta</th>
                                <th style={{ textAlign: 'right' }}>Resultado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Meta</td>
                                <td className="value-cell">{metaData.meta}</td>
                                <td className="value-cell highlight-red">{metaData.pctMeta}</td>
                            </tr>
                            <tr>
                                <td>Meta CTI</td>
                                <td className="value-cell">{metaData.metaCti}</td>
                                <td className="value-cell highlight-green">{metaData.pctMetaCti}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="dh-widget full-width">
                    <h3 className="dh-widget-title">REGIÃO</h3>
                    <table className="dh-widget-table"><thead><tr><th>REGIÃO</th><th>CARTEIRA</th><th>QTD. INTERNADO</th><th>CTI</th><th>PAC DIA</th><th>CTI PAC DIA</th></tr></thead><tbody>
                        {regiaoData.map(d => <tr key={d.regiao}><td>{d.regiao}</td><td>{d.carteira}</td><td>{d.qtd}</td><td>{d.cti}</td><td>{d.pacDia}</td><td>{d.ctiPacDia}</td></tr>)}
                    </tbody></table>
                </div>
                <div className="dh-widget full-width">
                    <h3 className="dh-widget-title">PRODUTO PREMIUM</h3>
                    <table className="dh-widget-table"><thead><tr><th>CARTEIRA</th><th>QTD. INTERNADO</th><th>CTI</th><th>PAC DIA</th><th>CTI PAC DIA</th></tr></thead><tbody>
                        {produtoPremiumData.map(d => <tr key={d.carteira}><td>{d.carteira}</td><td>{d.qtd}</td><td>{d.cti}</td><td>{d.pacDia}</td><td>{d.ctiPacDia}</td></tr>)}
                    </tbody></table>
                </div>
                <div className="dh-widget full-width">
                    <h3 className="dh-widget-title">ACOMPANHAMENTO DIÁRIO</h3>
                     <table className="dh-widget-table">
                        <thead><tr><th>DATA</th><th>QTD. SOLICITAÇÃO</th><th>LIBERADA</th><th>NEGADA</th><th>ELETIVO</th><th>EVITADA</th><th>ENTRADA</th><th>SAIDA</th></tr></thead>
                        <tbody>{solicitacaoData.map(d => <tr key={d.data}><td>{d.data}</td><td>{d.qtd}</td><td>{d.liberada}</td><td>{d.negada}</td><td>{d.eletivo}</td><td>{d.evitada}</td><td>{d.entrada}</td><td>{d.saida}</td></tr>)}</tbody>
                    </table>
                </div>
                 <div className="dh-widget full-width">
                    <h3 className="dh-widget-title">OCUPAÇÃO POR HOSPITAL</h3>
                     <table className="dh-widget-table">
                        <thead><tr><th>HOSPITAL</th><th>UI</th><th>EL. UI</th><th>USI</th><th>CTI</th><th>EL. CTI</th><th>Total</th><th>%</th></tr></thead>
                        <tbody>{hospitalData.map(d => <tr key={d.hospital}><td>{d.hospital}</td><td>{d.ui}</td><td>{d.el}</td><td>{d.usi}</td><td>{d.cti}</td><td>{d.elCti}</td><td>{d.total}</td><td>{d.pct}</td></tr>)}</tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


const PainelIndicadoresInternacao = ({ onBack }: { onBack: () => void }) => {
    const [activeTab, setActiveTab] = useState('indicadores'); // 'indicadores', 'diaadia', 'porHospital', 'dadosHospitalizacao'
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
            {activeTab !== 'dadosHospitalizacao' && (
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
            )}


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
                 <button
                    className={`tab-button ${activeTab === 'dadosHospitalizacao' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dadosHospitalizacao')}
                >
                    Dados da Hospitalização
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

            {activeTab === 'dadosHospitalizacao' && <DadosHospitalizacaoDashboard />}
        </div>
    );
};

export default PainelIndicadoresInternacao;