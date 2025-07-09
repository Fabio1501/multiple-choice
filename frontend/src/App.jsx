import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './components/Welcome';
import Game from './components/Game';
import Results from './components/Results';
import Leaderboard from './components/Leaderboard';

import AdminLayout from './components/admin/AdminLayout';
import AdminQuestions from './components/admin/AdminQuestions';
import AdminScores from './components/admin/AdminScores';

function App() {
  const [user, setUser] = useState({ name: '', finalScore: null, time: null });

  // Función para proteger rutas que requieren un nombre de usuario
  const ProtectedRoute = ({ children }) => {
    return user.name ? children : <Navigate to="/" />;
  };

  return (
    <Router>
      <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center font-sans p-4">
        <Routes>
          <Route path="/" element={<Welcome setUser={setUser} />} />
          <Route
            path="/game"
            element={
              <ProtectedRoute>
                <Game user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <Results user={user} />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="questions" />} />
            <Route path="questions" element={<AdminQuestions />} />
            <Route path="scores" element={<AdminScores />} />
          </Route>
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<Navigate to="/" />} /> {/* Redirige cualquier ruta no encontrada a la home */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;