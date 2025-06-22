const fs = 'fs';
const path = 'path';
const db = require('./db');
const questionsData = require('./data/questions.json');

async function seedDatabase() {
    try {
        console.log('Iniciando el proceso de seeding...');

        // Limpiar tablas existentes para evitar duplicados
        await db.query('TRUNCATE TABLE scores, options, questions RESTART IDENTITY CASCADE');
        console.log('Tablas limpiadas.');

        // Iterar sobre cada pregunta del archivo JSON
        for (const q of questionsData) {
            // Insertar la pregunta y obtener su nuevo ID
            const questionInsertResult = await db.query(
                'INSERT INTO questions (question_text, video_url) VALUES ($1, $2) RETURNING id',
                [q.question, q.videoUrl || null]
            );
            const newQuestionId = questionInsertResult.rows[0].id;
            console.log(`Pregunta creada con ID: ${newQuestionId}`);

            // Insertar las opciones para esa pregunta
            for (let i = 0; i < q.options.length; i++) {
                const optionText = q.options[i];
                const isCorrect = (i === q.correctAnswer);
                await db.query(
                    'INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)',
                    [newQuestionId, optionText, isCorrect]
                );
            }
            console.log(`Opciones para la pregunta ${newQuestionId} insertadas.`);
        }

        console.log('¡Seeding completado con éxito!');
    } catch (error) {
        console.error('Error durante el seeding:', error);
    } finally {
        // Cierra el pool de conexiones cuando termines
        const pool = db.query.__self.pool;
        pool.end();
    }
}

seedDatabase();