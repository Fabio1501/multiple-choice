const express = require('express');
const cors = require('cors');
const db = require('./db'); // Nuestro nuevo módulo de base de datos

const app = express();
const PORT = process.env.PORT || 3001;

const whitelist = [
    'http://localhost:5173', // Tu entorno de desarrollo
    'https://multiple-choice-h9hykhwig-fabio1501s-projects.vercel.app' // ¡TU URL DE VERCEL!
];

const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

// Middleware para deshabilitar la caché en las rutas de la API
const noCache = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
};

app.use(cors(corsOptions));
app.use(express.json());


// --- API Endpoints ---

// 1. Endpoint para obtener las preguntas
app.get('/api/questions', noCache, async (req, res) => {
    try {
        const questionsQuery = 'SELECT id, question_text, video_url FROM questions ORDER BY id';
        const optionsQuery = 'SELECT id, question_id, option_text FROM options ORDER BY id';

        const questionsResult = await db.query(questionsQuery);
        const optionsResult = await db.query(optionsQuery);

        // Mapeamos los resultados para construir el formato JSON que el frontend espera
        const formattedQuestions = questionsResult.rows.map(q => {
            // Filtramos las opciones que pertenecen a esta pregunta
            const questionOptions = optionsResult.rows
                .filter(opt => opt.question_id === q.id)
                .map(opt => opt.option_text);

            return {
                id: q.id,
                question: q.question_text,
                videoUrl: q.video_url,
                options: questionOptions
                // Nota: ya no enviamos la respuesta correcta al frontend por seguridad.
            };
        });

        res.json(formattedQuestions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Error al obtener las preguntas del servidor.' });
    }
});

// 2. Endpoint para obtener el leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const query = `
      SELECT player_name, score, time_seconds 
      FROM scores 
      ORDER BY score DESC, time_seconds ASC 
      LIMIT 20`; // Limitamos a los 20 mejores, por ejemplo
        const result = await db.query(query);

        // Mapeamos para que coincida con el frontend
        const leaderboard = result.rows.map(row => ({
            name: row.player_name,
            score: row.score,
            time: row.time_seconds,
        }));

        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Error al obtener la tabla de puntuaciones.' });
    }
});

// 3. Endpoint para enviar un resultado
app.post('/api/submit', async (req, res) => {
    const { name, answers, time } = req.body;

    if (!name || !Array.isArray(answers) || time === undefined) {
        return res.status(400).json({ message: 'Faltan datos o el formato es incorrecto.' });
    }

    try {
        // Obtenemos las preguntas y sus respuestas correctas desde la DB
        const correctAnswersQuery = `
            SELECT q.id as question_id, o.id as option_id
            FROM questions q
            JOIN options o ON q.id = o.question_id
            WHERE o.is_correct = TRUE
            ORDER BY q.id;
        `;
        const correctAnswersResult = await db.query(correctAnswersQuery);
        const correctAnswersMap = correctAnswersResult.rows;

        let score = 0;

        // Iteramos sobre las respuestas correctas de la DB, que es nuestra "fuente de verdad".
        // Esto evita el error si el frontend envía más respuestas de las que existen.
        for (let i = 0; i < correctAnswersMap.length; i++) {

            // --- INICIO DE LA CORRECCIÓN ---
            // Comprobamos si el frontend proporcionó una respuesta para esta pregunta.
            // Si el usuario envió menos respuestas, `userAnswerIndex` será undefined, y la condición de abajo fallará de forma segura.
            const userAnswerIndex = answers[i];
            if (userAnswerIndex === undefined) {
                continue; // Si no hay respuesta para esta pregunta, simplemente la saltamos.
            }

            const questionId = correctAnswersMap[i].question_id;
            const correctOptionId = correctAnswersMap[i].option_id;
            // --- FIN DE LA CORRECCIÓN ---

            // Obtenemos todas las opciones para la pregunta actual para encontrar el ID de la opción elegida por el usuario
            const optionsForQuestionResult = await db.query('SELECT id FROM options WHERE question_id = $1 ORDER BY id', [questionId]);
            const optionsForQuestion = optionsForQuestionResult.rows;

            // Otra comprobación de seguridad: ¿existe la opción que el usuario marcó?
            if (optionsForQuestion[userAnswerIndex]) {
                const userAnswerOptionId = optionsForQuestion[userAnswerIndex].id;

                if (userAnswerOptionId === correctOptionId) {
                    score++;
                }
            }
        }

        // Guardar el resultado en la base de datos
        const insertQuery = 'INSERT INTO scores(player_name, score, time_seconds) VALUES($1, $2, $3)';
        await db.query(insertQuery, [name, score, time]);

        res.status(201).json({ name, score, time });

    } catch (error) {
        // Añadimos un log más detallado para futura depuración
        console.error('Error detallado en /api/submit:', error);
        res.status(500).json({ message: 'Error interno al procesar la puntuación.' });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});