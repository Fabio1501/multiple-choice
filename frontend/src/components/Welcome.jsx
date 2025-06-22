import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Welcome({ setUser }) {
    const [name, setName] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            setUser({ name: name.trim() });
            navigate('/game');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto text-center">
            <h1 className="text-5xl font-bold text-cyan-400 mb-4">Quiz del coach</h1>
            <p className="text-slate-300 mb-8">Demuestra tus conocimientos de coaching.</p>
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8 text-left">
                <h2 className="text-2xl font-semibold mb-3 text-cyan-300">Reglas del juego</h2>
                <ul className="list-disc list-inside space-y-2 text-slate-300 text-[14px]">
                    <li>Ingresa tu nombre para comenzar.</li>
                    <li>Responde a todas las preguntas una por una.</li>
                    <li>No sabrás si tu respuesta es correcta hasta el final.</li>
                    <li>El tiempo que tardes en responder también cuenta.</li>
                    <li>¡El más rápido y preciso será el campeón!</li>
                </ul>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Escribe tu nombre aquí"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-grow bg-slate-700 text-white placeholder-slate-400 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    required
                />
                <button
                    type="submit"
                    className="bg-cyan-600 hover:bg-cyan-700 font-bold py-3 px-6 rounded-md transition-transform transform hover:scale-105"
                >
                    ¡A jugar!
                </button>
            </form>
        </div>
    );
}

export default Welcome;