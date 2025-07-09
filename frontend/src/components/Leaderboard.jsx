import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Spinner from './common/Spinner'; // <-- 1. Importa el Spinner

const API_URL = import.meta.env.VITE_API_URL;

function Leaderboard() {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Es buena práctica manejar errores

    // 2. Encapsulamos la lógica de fetch en una función para poder llamarla de nuevo
    const fetchScores = async () => {
        setLoading(true); // Activa el loader cada vez que se llama
        setError(null); // Limpia errores previos
        try {
            const response = await axios.get(`${API_URL}/leaderboard`);
            setScores(response.data);
        } catch (error) {
            console.error("Error al cargar el leaderboard:", error);
            setError("No se pudieron cargar las puntuaciones. Inténtalo de nuevo.");
        } finally {
            setLoading(false); // Desactiva el loader al terminar (con éxito o error)
        }
    };

    // 3. El useEffect ahora solo llama a nuestra función una vez al montar
    useEffect(() => {
        fetchScores();
    }, []);

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-cyan-400">Tabla de Puntuaciones</h1>

                {/* --- 4. Botón de Recarga --- */}
                <button
                    onClick={fetchScores}
                    disabled={loading} // Se deshabilita mientras carga para evitar múltiples clics
                    className="bg-slate-700 hover:bg-slate-600 font-bold py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} // El icono también gira
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0121 12a9 9 0 01-9 9C7.3 21 4.1 17.5 3 13"
                        />
                    </svg>
                    {loading ? 'Cargando...' : 'Recargar'}
                </button>
            </div>

            {/* --- 5. Lógica de renderizado con el Spinner --- */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner text="Actualizando puntuaciones..." />
                </div>
            ) : error ? (
                <p className="text-center text-red-400 bg-red-900/50 p-4 rounded-md">{error}</p>
            ) : scores.length === 0 ? (
                <p className="text-center text-slate-400">Aún no hay puntuaciones. ¡Sé el primero!</p>
            ) : (
                <div className="bg-slate-800 rounded-lg shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            {/* ... El resto de la tabla sigue igual ... */}
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
        </div>
    );
}

export default Leaderboard;