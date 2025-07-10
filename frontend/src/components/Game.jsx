import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Spinner from './common/Spinner';

const API_URL = import.meta.env.VITE_API_URL;

function Game({ user, setUser }) {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startTime, setStartTime] = useState(null);

    // NUEVO: Estado para controlar si el video fue "visto"
    const [isVideoWatched, setIsVideoWatched] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await axios.get(`${API_URL}/questions`);
                setQuestions(response.data);
                setStartTime(Date.now());
                if (response.data.length > 0 && !response.data[0].mediaUrl) { // MODIFICADO: videoUrl -> mediaUrl
                    setIsVideoWatched(true);
                }
            } catch (error) {
                console.error("Error al cargar las preguntas:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    const handleAnswer = async (optionIndex) => {
        const newAnswers = [...answers, optionIndex];
        setAnswers(newAnswers);

        const nextQuestionIndex = currentQuestionIndex + 1;

        if (nextQuestionIndex < questions.length) {
            setCurrentQuestionIndex(nextQuestionIndex);
            // LÓGICA MODIFICADA: Resetear el estado del video para la siguiente pregunta.
            // Si la siguiente pregunta no tiene video, marcamos como "visto" para habilitar las opciones.
            if (questions[nextQuestionIndex].mediaUrl) {
                setIsVideoWatched(false);
            } else {
                setIsVideoWatched(true);
            }
        } else {
            // Fin del juego
            setIsSubmitting(true);
            const endTime = Date.now();
            const timeTaken = Math.round((endTime - startTime) / 1000);

            try {
                const response = await axios.post(`${API_URL}/submit`, {
                    name: user.name,
                    answers: newAnswers,
                    time: timeTaken,
                });
                setUser({ ...user, finalScore: response.data.score, time: response.data.time });
                navigate('/results');
            } catch (error) {
                console.error("Error al enviar los resultados:", error);
                alert("Hubo un problema al enviar tus resultados. Por favor, inténtalo de nuevo.");
                setIsSubmitting(false);
            }
        }
    };

    if (loading) return <p className="text-xl">Cargando preguntas...</p>;
    if (questions.length === 0) return <p className="text-xl text-red-400">No se pudieron cargar las preguntas.</p>;

    const currentQuestion = questions[currentQuestionIndex];
    const hasMedia = !!currentQuestion.mediaUrl;

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-2xl">

                {/* RENDERIZADO CONDICIONAL DEL VIDEO */}
                {hasMedia && (
                    <div className="mb-6">
                        <div className="aspect-w-16 aspect-h-9 w-full bg-black rounded-lg overflow-hidden">
                            {/* NUEVA LÓGICA DE RENDERIZADO */}
                            {currentQuestion.mediaType === 'video' ? (
                                <iframe
                                    src={currentQuestion.mediaUrl}
                                    title="Video de la pregunta"
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <img
                                    src={`${API_URL}${currentQuestion.mediaUrl}`}
                                    alt="Media de la pregunta"
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>
                        {!isVideoWatched && (
                            <button
                                onClick={() => setIsVideoWatched(true)}
                                className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 font-bold py-3 px-6 rounded-md transition"
                            >
                                He visto la imágen, ¡estoy listo para responder!
                            </button>
                        )}
                    </div>
                )}

                <div className="mb-6">
                    <p className="text-cyan-400 font-semibold">Pregunta {currentQuestionIndex + 1} de {questions.length}</p>
                    <h2 className="text-2xl md:text-3xl mt-2">{currentQuestion.question}</h2>
                </div>

                {/* LÓGICA PARA DESHABILITAR OPCIONES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswer(index)}
                            disabled={!isVideoWatched} // El botón está deshabilitado si el video no ha sido "visto"
                            className={`w-full p-4 rounded-md text-left transition ${!isVideoWatched
                                ? 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50'
                                : 'bg-slate-700 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500'
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                {isSubmitting && (
                    <div className="fixed inset-0 bg-slate-900 bg-opacity-90 flex flex-col items-center justify-center z-50 transition-opacity duration-300 animate-fadeIn">
                        <Spinner
                            text='"Cuando la transparencia se rompe, el quiebre es una oportunidad con disfraz de obstáculo."'
                            textColor="italic text-slate-200"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Game;