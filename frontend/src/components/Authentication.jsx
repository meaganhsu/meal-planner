import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import '../styles/Authentication.css';

// this component handles the login page that restricts website access for external users
export default function Authentication() {
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [authenticated, setAuthenticated] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // checking if the user was authenticated after the component is rendered
    useEffect(() => {
        const isAuth = localStorage.getItem('authenticated');

        if (isAuth === 'true') {
            setAuthenticated(true);  // user remains authenticated
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        // checking if password entered is correct
        if (input === import.meta.env.VITE_APP_PASSWORD) {
            setAuthenticated(true);
            setError('');
            localStorage.setItem('authenticated', 'true');     // user is authenticated!
        } else {
            setError('Incorrect password');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    if (!authenticated) {
        return (
            <div className="auth-container">
                <h2 className="auth-title">Login</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="password-input-container">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            className="auth-input"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={togglePasswordVisibility}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button>
                    </div>
                    <button type="submit" className="auth-button">Login</button>
                    {error && <span className="auth-error">{error}</span>}
                </form>
            </div>
        );
    }

    return <Outlet />;
}