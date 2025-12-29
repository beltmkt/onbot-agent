import React, { useState } from 'react';

interface DashboardProps {
    title?: string;
}

export const DashBoard: React.FC<DashboardProps> = ({ title = 'Dashboard' }) => {
    const [data, setData] = useState<string[]>([]);

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>{title}</h1>
            </header>
            
            <main className="dashboard-content">
                <section className="dashboard-section">
                    <h2>Welcome</h2>
                    <p>Select an option to get started.</p>
                </section>
            </main>
        </div>
    );
};

export default DashBoard;