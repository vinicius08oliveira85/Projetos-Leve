import React, { useState } from 'react';
import { User } from '../types';
import LeveSaudeLogo from '../components/LeveSaudeLogo';

const LoginScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
    const [username, setUsername] = useState('usuario.admin');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if ((username.toLowerCase() === 'usuario.admin' || username.toLowerCase() === 'usuario.viewer') && password === 'password') {
            const role = username.toLowerCase() === 'usuario.admin' ? 'admin' : 'viewer';
            onLogin({ name: username, role });
        } else {
            setError('Usuário ou senha inválidos. Use "usuario.admin" ou "usuario.viewer" com a senha "password".');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="logo-container">
                    <LeveSaudeLogo width={120} height={40} />
                </div>
                <h2>Bem-vindo</h2>
                <p>Faça login para continuar</p>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label htmlFor="username">Usuário</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="usuario.admin ou usuario.viewer"
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Senha</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="password"
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="login-btn">Entrar</button>
                    <a href="#" className="forgot-password">Esqueci minha senha</a>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;