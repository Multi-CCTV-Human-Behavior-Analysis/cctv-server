// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import DashboardPage from './pages/DashboardPage';
import CamerasPage from './pages/CamerasPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import RecordingsPage from './pages/RecordingsPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="cameras" element={<CamerasPage />} />
                    <Route path="history" element={<HistoryPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="recordings" element={<RecordingsPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
