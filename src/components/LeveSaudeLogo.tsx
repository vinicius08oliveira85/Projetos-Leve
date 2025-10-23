import React from 'react';

const LeveSaudeLogo = ({ width, height }: { width?: number | string; height?: number | string }) => (
    <svg width={width} height={height} viewBox="0 0 245 88" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M102.748 18.99C120.348 4.74 148.998 4.49 167.123 18.99" stroke="#f46321" strokeWidth="11" strokeLinecap="round"/>
        <text fill="#004b88" style={{whiteSpace: "pre"}} fontFamily="Poppins,sans-serif" fontSize="64" fontWeight="bold">
            <tspan x="0" y="77.3359">Leve</tspan>
        </text>
        <text fill="#004b88" style={{whiteSpace: "pre"}} fontFamily="Poppins,sans-serif" fontSize="32" fontWeight="bold">
            <tspan x="176.367" y="77.3359">saúde</tspan>
        </text>
    </svg>
);

export default LeveSaudeLogo;
