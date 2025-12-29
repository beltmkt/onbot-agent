import React, { useState } from 'react';

interface ResetPasswordInputProps {
    onSubmit: (password: string) => void;
    isLoading?: boolean;
}

export const ResetPasswordInput: React.FC<ResetPasswordInputProps> = ({
    onSubmit,
    isLoading = false,
}) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const validatePassword = (pwd: string): boolean => {
        if (pwd.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        if (!/[A-Z]/.test(pwd)) {
            setError('Password must contain at least one uppercase letter');
            return false;
        }
        if (!/[0-9]/.test(pwd)) {
            setError('Password must contain at least one number');
            return false;
        }
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!password || !confirmPassword) {
            setError('Both fields are required');
            return;
        }

        if (!validatePassword(password)) {
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        onSubmit(password);
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter new password"
                />
            </div>

            <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="Confirm password"
                />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
        </form>
    );
};