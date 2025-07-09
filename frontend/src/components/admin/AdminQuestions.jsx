import { useState, useEffect } from 'react';
import axios from 'axios';
import QuestionForm from './QuestionForm'; // Importaremos este componente a continuación

const API_URL = import.meta.env.VITE_API_URL;

const AdminQuestions = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(null); // Para editar

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/admin/questions`);
            setQuestions(response.data);
            setError(null);
        } catch (err) {
            setError('No se pudieron cargar las preguntas.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleOpenModal = (question = null) => {
        setCurrentQuestion(question);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentQuestion(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
            try {
                await axios.delete(`${API_URL}/admin/questions/${id}`);
                setQuestions(prev => prev.filter(q => q.id !== id));
            } catch (err) {
                alert('Error al eliminar la pregunta.');
                console.error(err);
            }
        }
    };

    const handleFormSubmit = () => {
        handleCloseModal();
        fetchQuestions(); // Vuelve a cargar todo para ver los cambios
    };

    if (loading) return <p className="text-center">Cargando...</p>;
    if (error) return <p className="text-center text-red-400">{error}</p>;

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Preguntas del Quiz</h2>
                <button onClick={() => handleOpenModal()} className="bg-emerald-500 hover:bg-emerald-600 font-bold py-2 px-4 rounded-md transition">
                    + Añadir Pregunta
                </button>
            </div>

            <div className="space-y-4">
                {questions.map(q => (
                    <div key={q.id} className="bg-slate-700 p-4 rounded-md flex justify-between items-start">
                        <div>
                            <p className="font-bold text-lg">{q.id}. {q.question_text}</p>
                            <ul className="list-disc list-inside mt-2 text-sm text-slate-300">
                                {q.options.sort((a, b) => a.id - b.id).map(opt => (
                                    <li key={opt.id} className={opt.iscorrect ? 'text-cyan-400 font-semibold' : ''}>
                                        {opt.text} {opt.iscorrect && '(Correcta)'}
                                    </li>
                                ))}
                            </ul>
                            {q.media_url && <p className="text-xs mt-2 text-yellow-400">Media: {q.media_url}</p>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0 ml-4">
                            <button onClick={() => handleOpenModal(q)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-md text-sm">Editar</button>
                            <button onClick={() => handleDelete(q.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-md text-sm">Eliminar</button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <QuestionForm
                    question={currentQuestion}
                    onClose={handleCloseModal}
                    onSubmitSuccess={handleFormSubmit}
                />
            )}
        </div>
    );
};

export default AdminQuestions;