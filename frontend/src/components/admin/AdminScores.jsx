import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const AdminScores = () => {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchScores = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/admin/scores`);
            setScores(response.data);
            setError(null);
        } catch (err) {
            setError('No se pudieron cargar las puntuaciones.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScores();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta puntuación?')) {
            try {
                await axios.delete(`${API_URL}/admin/scores/${id}`);
                setScores(prev => prev.filter(s => s.id !== id));
            } catch (err) {
                alert('Error al eliminar la puntuación.');
                console.error(err);
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('es-ES');
    };

    if (loading) return <p className="text-center">Cargando...</p>;
    if (error) return <p className="text-center text-red-400">{error}</p>;

    return (
        <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-700">
                        <tr>
                            <th className="p-4 font-semibold text-cyan-300">ID</th>
                            <th className="p-4 font-semibold text-cyan-300">Nombre</th>
                            <th className="p-4 font-semibold text-cyan-300">Puntuación</th>
                            <th className="p-4 font-semibold text-cyan-300">Tiempo (s)</th>
                            <th className="p-4 font-semibold text-cyan-300">Fecha</th>
                            <th className="p-4 font-semibold text-cyan-300">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scores.map(score => (
                            <tr key={score.id} className="border-t border-slate-600 hover:bg-slate-700/50">
                                <td className="p-4">{score.id}</td>
                                <td className="p-4">{score.player_name}</td>
                                <td className="p-4 font-mono">{score.score}</td>
                                <td className="p-4 font-mono">{score.time_seconds}</td>
                                <td className="p-4 text-sm">{formatDate(score.created_at)}</td>
                                <td className="p-4">
                                    <button onClick={() => handleDelete(score.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-md text-sm">
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminScores;