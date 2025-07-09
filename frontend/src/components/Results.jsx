import React from 'react';
import { Link } from 'react-router-dom';

function Results({ user }) {
    if (user.finalScore === null) {
        return (
            <div className="text-center">
                <p className="text-xl">Aún no has completado el juego.</p>
                <Link to="/" className="mt-4 inline-block bg-cyan-500 hover:bg-cyan-600 font-bold py-2 px-4 rounded">
                    Jugar ahora
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto text-center bg-slate-800 p-8 rounded-lg shadow-2xl">
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">¡Juego Terminado!</h1>
            <p className="text-2xl text-white mb-6">¡Buen trabajo, <span className="font-bold">{user.name}</span>!</p>

            <div className="bg-slate-700 p-6 rounded-lg mb-6">
                <p className="text-lg text-slate-300">Tu puntuación final es:</p>
                <p className="text-6xl font-extrabold text-white my-2">{user.finalScore}</p>
                <p className="text-lg text-slate-300">Tiempo total: <span className="font-bold">{user.time} segundos</span></p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
                {/* <Link
                    to="/"
                    className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 font-bold py-3 px-6 rounded-md transition"
                >
                    Jugar de Nuevo
                </Link> */}
                <Link
                    to="/leaderboard"
                    className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 font-bold py-3 px-6 rounded-md transition"
                >
                    Ver Puntuaciones
                </Link>
            </div>
        </div>
    );
}

export default Results;