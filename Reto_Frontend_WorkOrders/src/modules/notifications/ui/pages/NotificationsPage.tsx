import React from 'react';

/**
 * Página de OTs (Órdenes de Trabajo)
 * 
 * Renderiza el módulo remoto de Notifications usando Module Federation
 */
const NotificationsPage: React.FC = () => {
    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h1 style={{ color: '#333', margin: 0 }}>Renderizando module work orders</h1>
            </div>
        </div>
    );
};

export default NotificationsPage;

