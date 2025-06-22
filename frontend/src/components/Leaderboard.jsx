import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

function Leaderboard() {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScores = async () => {
            try {
                const response = await axios.get(`${API_URL}/leaderboard`);
                setScores(response.data);
            } catch (error) {
                console.error("Error al cargar el leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, []);

    return (
        <div className="w-full max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-cyan-400 text-center mb-8">Tabla de Puntuaciones</h1>

            {loading ? (
                <p>Cargando puntuaciones...</p>
            ) : scores.length === 0 ? (
                <p className="text-center text-slate-400">Aún no hay puntuaciones. ¡Sé el primero!</p>
            ) : (
                <div className="bg-slate-800 rounded-lg shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-700">
                                <tr>
                                    <th className="p-4 font-semibold text-cyan-300">#</th>
                                    <th className="p-4 font-semibold text-cyan-300">Nombre</th>
                                    <th className="p-4 font-semibold text-cyan-300 text-center">Puntuación</th>
                                    <th className="p-4 font-semibold text-cyan-300 text-center">Tiempo (s)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scores.map((score, index) => (
                                    <tr key={index} className="border-t border-slate-600 hover:bg-slate-700/50">
                                        <td className="p-4 font-bold">{index + 1}</td>
                                        <td className="p-4">{score.name}</td>
                                        <td className="p-4 text-center font-mono">{score.score}</td>
                                        <td className="p-4 text-center font-mono">{score.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="text-center mt-8">
                <Link to="/" className="bg-cyan-500 hover:bg-cyan-600 font-bold py-3 px-6 rounded-md transition">
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
}

export default Leaderboard;