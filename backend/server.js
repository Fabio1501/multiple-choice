const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db'); // Nuestro módulo de base de datos

const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuración de CORS ---
const whitelist = [
    'http://localhost:5173',
    'https://multiple-choice-h9hykhwig-fabio1501s-projects.vercel.app',
    'https://multiple-choice-coach.vercel.app'
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

app.use(cors(corsOptions));
app.use(express.json());

// --- Servir archivos estáticos de la carpeta 'uploads' ---
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// --- Configuración de Multer para la subida de archivos ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });


// --- Middleware para deshabilitar la caché ---
const noCache = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
};

// ===============================================
// --- API Endpoints PÚBLICOS (para el juego) ---
// ===============================================

// 1. Endpoint para obtener las preguntas (MODIFICADO)
app.get('/questions', noCache, async (req, res) => {
    try {
        const questionsQuery = 'SELECT id, question_text, media_url, media_type FROM questions ORDER BY id';
        const optionsQuery = 'SELECT id, question_id, option_text FROM options ORDER BY id';

        const questionsResult = await db.query(questionsQuery);
        const optionsResult = await db.query(optionsQuery);

        const formattedQuestions = questionsResult.rows.map(q => {
            const questionOptions = optionsResult.rows
                .filter(opt => opt.question_id === q.id)
                .map(opt => opt.option_text);

            return {
                id: q.id,
                question: q.question_text,
                mediaUrl: q.media_url, // Cambiado de videoUrl
                mediaType: q.media_type, // Nuevo campo
                options: questionOptions
            };
        });

        res.json(formattedQuestions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Error al obtener las preguntas del servidor.' });
    }
});

// 2. Endpoint para obtener el leaderboard (Sin cambios)
app.get('/leaderboard', async (req, res) => {
    try {
        const query = `
      SELECT player_name, score, time_seconds 
      FROM scores 
      ORDER BY score DESC, time_seconds ASC 
      LIMIT 20`;
        const result = await db.query(query);
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

// 3. Endpoint para enviar un resultado (Sin cambios en la lógica principal)
app.post('/submit', async (req, res) => {
    const { name, answers, time } = req.body;
    if (!name || !Array.isArray(answers) || time === undefined) {
        return res.status(400).json({ message: 'Faltan datos o el formato es incorrecto.' });
    }
    try {
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
        for (let i = 0; i < correctAnswersMap.length; i++) {
            const userAnswerIndex = answers[i];
            if (userAnswerIndex === undefined) continue;

            const questionId = correctAnswersMap[i].question_id;
            const correctOptionId = correctAnswersMap[i].option_id;

            const optionsForQuestionResult = await db.query('SELECT id FROM options WHERE question_id = $1 ORDER BY id', [questionId]);
            const optionsForQuestion = optionsForQuestionResult.rows;

            if (optionsForQuestion[userAnswerIndex]) {
                const userAnswerOptionId = optionsForQuestion[userAnswerIndex].id;
                if (userAnswerOptionId === correctOptionId) {
                    score++;
                }
            }
        }

        const insertQuery = 'INSERT INTO scores(player_name, score, time_seconds) VALUES($1, $2, $3)';
        await db.query(insertQuery, [name, score, time]);

        res.status(201).json({ name, score, time });

    } catch (error) {
        console.error('Error detallado en /submit:', error);
        res.status(500).json({ message: 'Error interno al procesar la puntuación.' });
    }
});

// ===============================================
// --- API Endpoints ADMIN (para el mantenedor) ---
// ===============================================

// --- PREGUNTAS (CRUD) ---

// [READ] Obtener todas las preguntas para el admin
app.get('/admin/questions', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT q.id, q.question_text, q.media_url, q.media_type,
                   json_agg(json_build_object('id', o.id, 'text', o.option_text, 'isCorrect', o.is_correct)) as options
            FROM questions q
            LEFT JOIN options o ON q.id = o.question_id
            GROUP BY q.id
            ORDER BY q.id ASC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Admin: Error fetching questions", error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// [CREATE] Crear una nueva pregunta
app.post('/admin/questions', upload.single('media'), async (req, res) => {
    const { question_text, options, correctAnswerIndex } = req.body;
    const mediaFile = req.file;
    const parsedOptions = JSON.parse(options);

    try {
        // Insertar pregunta
        const questionResult = await db.query(
            'INSERT INTO questions (question_text, media_url, media_type) VALUES ($1, $2, $3) RETURNING id',
            [question_text, mediaFile ? `/uploads/${mediaFile.filename}` : null, mediaFile ? 'image' : null] // Simplificado a 'image', puedes mejorar esto si quieres
        );
        const newQuestionId = questionResult.rows[0].id;

        // Insertar opciones
        for (let i = 0; i < parsedOptions.length; i++) {
            await db.query(
                'INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)',
                [newQuestionId, parsedOptions[i], i === parseInt(correctAnswerIndex, 10)]
            );
        }

        res.status(201).json({ message: 'Pregunta creada con éxito' });
    } catch (error) {
        console.error("Admin: Error creating question", error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});


// [UPDATE] Actualizar una pregunta existente
app.put('/admin/questions/:id', upload.single('media'), async (req, res) => {
    const { id } = req.params;
    const { question_text, options, correctAnswerIndex, existingMediaUrl } = req.body;
    const mediaFile = req.file;
    const parsedOptions = JSON.parse(options);

    try {
        // 1. Obtener la pregunta actual para saber si hay un archivo que borrar
        const oldQuestion = await db.query('SELECT media_url FROM questions WHERE id = $1', [id]);

        let media_url = existingMediaUrl;
        if (mediaFile) {
            media_url = `/uploads/${mediaFile.filename}`;
            // Si había un archivo antiguo, bórralo del servidor
            if (oldQuestion.rows[0]?.media_url) {
                const oldPath = path.join(__dirname, 'public', oldQuestion.rows[0].media_url);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
        }

        // 2. Actualizar la tabla de preguntas
        await db.query(
            'UPDATE questions SET question_text = $1, media_url = $2, media_type = $3 WHERE id = $4',
            [question_text, media_url, mediaFile ? 'image' : (media_url ? 'image' : null), id]
        );

        // 3. Borrar opciones antiguas y crear las nuevas (más simple que actualizarlas)
        await db.query('DELETE FROM options WHERE question_id = $1', [id]);

        for (let i = 0; i < parsedOptions.length; i++) {
            await db.query(
                'INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)',
                [id, parsedOptions[i], i === parseInt(correctAnswerIndex, 10)]
            );
        }

        res.status(200).json({ message: 'Pregunta actualizada con éxito' });
    } catch (error) {
        console.error(`Admin: Error updating question ${id}`, error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});


// [DELETE] Borrar una pregunta
app.delete('/admin/questions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Opcional: Borrar el archivo asociado del servidor si existe
        const result = await db.query('SELECT media_url FROM questions WHERE id = $1', [id]);
        if (result.rows[0]?.media_url) {
            const filePath = path.join(__dirname, 'public', result.rows[0].media_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Borrar de la base de datos (ON DELETE CASCADE se encargará de las opciones)
        await db.query('DELETE FROM questions WHERE id = $1', [id]);
        res.status(200).json({ message: 'Pregunta eliminada con éxito' });
    } catch (error) {
        console.error(`Admin: Error deleting question ${id}`, error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// --- PARTICIPANTES (SCORES) ---

// [READ] Obtener todos los scores
app.get('/admin/scores', async (req, res) => {
    try {
        const result = await db.query('SELECT id, player_name, score, time_seconds, created_at FROM scores ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error("Admin: Error fetching scores", error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// [DELETE] Borrar un score
app.delete('/admin/scores/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM scores WHERE id = $1', [id]);
        res.status(200).json({ message: 'Puntuación eliminada con éxito' });
    } catch (error) {
        console.error(`Admin: Error deleting score ${id}`, error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});