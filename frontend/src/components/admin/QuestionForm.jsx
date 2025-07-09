import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const QuestionForm = ({ question, onClose, onSubmitSuccess }) => {
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
    const [mediaFile, setMediaFile] = useState(null);
    const [existingMediaUrl, setExistingMediaUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (question) {
            setQuestionText(question.question_text);
            const sortedOptions = question.options.sort((a, b) => a.id - b.id);
            setOptions(sortedOptions.map(o => o.text));
            setCorrectAnswerIndex(sortedOptions.findIndex(o => o.iscorrect));
            setExistingMediaUrl(question.media_url);
        }
    }, [question]);

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('question_text', questionText);
        formData.append('options', JSON.stringify(options));
        formData.append('correctAnswerIndex', correctAnswerIndex);
        if (mediaFile) {
            formData.append('media', mediaFile);
        } else if (existingMediaUrl) {
            formData.append('existingMediaUrl', existingMediaUrl);
        }

        try {
            if (question) {
                // Actualizar
                await axios.put(`${API_URL}/admin/questions/${question.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                // Crear
                await axios.post(`${API_URL}/admin/questions`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            onSubmitSuccess();
        } catch (error) {
            console.error('Error submitting form', error);
            alert('Hubo un error al guardar la pregunta.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg p-8 w-full max-w-2xl max-h-full overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">{question ? 'Editar' : 'Añadir'} Pregunta</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-semibold">Texto de la pregunta</label>
                        <input type="text" value={questionText} onChange={e => setQuestionText(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" required />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Opciones de respuesta</label>
                        {options.map((opt, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                                <input type="radio" name="correctAnswer" checked={correctAnswerIndex === index} onChange={() => setCorrectAnswerIndex(index)} className="form-radio h-5 w-5 text-cyan-500 bg-slate-600 border-slate-500 focus:ring-cyan-500" />
                                <input type="text" value={opt} onChange={e => handleOptionChange(index, e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" required placeholder={`Opción ${index + 1}`} />
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Archivo multimedia (Opcional: Video, Imagen, GIF)</label>
                        <input type="file" onChange={e => setMediaFile(e.target.files[0])} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" />
                        {existingMediaUrl && !mediaFile && <p className="text-xs mt-2 text-yellow-400">Archivo actual: {existingMediaUrl}</p>}
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-md">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 font-bold py-2 px-4 rounded-md">
                            {isSubmitting ? 'Guardando...' : 'Guardar Pregunta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuestionForm;