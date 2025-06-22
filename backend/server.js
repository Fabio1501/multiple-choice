const express = require('express');
const cors = require('cors');
const db = require('./db'); // Nuestro nuevo módulo de base de datos

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- API Endpoints ---

// 1. Endpoint para obtener las preguntas
app.get('/api/questions', async (req, res) => {
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

    if (!name || !answers || time === undefined) {
        return res.status(400).json({ message: 'Faltan datos en la petición.' });
    }

    try {
        // Obtenemos las preguntas y sus respuestas correctas desde la DB para validar
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
        // La respuesta del frontend es un índice (0, 1, 2, 3), necesitamos mapearlo a un option_id
        for (let i = 0; i < answers.length; i++) {
            const questionId = correctAnswersMap[i].question_id;
            const userAnswerIndex = answers[i];

            // Obtenemos todas las opciones para la pregunta actual para encontrar el ID de la opción elegida
            const optionsForQuestion = await db.query('SELECT id FROM options WHERE question_id = $1 ORDER BY id', [questionId]);
            const userAnswerOptionId = optionsForQuestion.rows[userAnswerIndex].id;

            if (userAnswerOptionId === correctAnswersMap[i].option_id) {
                score++;
            }
        }

        // Guardar el resultado en la base de datos
        const insertQuery = 'INSERT INTO scores(player_name, score, time_seconds) VALUES($1, $2, $3)';
        await db.query(insertQuery, [name, score, time]);

        res.status(201).json({ name, score, time });

    } catch (error) {
        console.error('Error submitting score:', error);
        res.status(500).json({ message: 'Error al guardar la puntuación.' });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});