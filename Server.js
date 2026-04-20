const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// CONFIGURACIÓN PARA RENDER + SUPABASE
const pool = new Pool({
    // Render leerá automáticamente la URL que pegamos en Environment Variables
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Esto es obligatorio para conectar con Supabase
    }
});

const initDB = async() => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS clientes (
                id SERIAL PRIMARY KEY,
                apellido TEXT,
                nombre TEXT,
                cuit TEXT,
                tel TEXT
            )
        `);
        console.log("Conectado a Supabase: Tabla lista.");
    } catch (err) {
        console.error("Error al conectar con la base de datos:", err);
    }
};
initDB();

app.post('/add-cliente', async(req, res) => {
    const { apellido, nombre, cuit, tel } = req.body;
    try {
        const query = 'INSERT INTO clientes (apellido, nombre, cuit, tel) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await pool.query(query, [apellido, nombre, cuit, tel]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/clientes', async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clientes ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/delete-cliente/:id', async(req, res) => {
    try {
        await pool.query('DELETE FROM clientes WHERE id = $1', [req.params.id]);
        res.json({ message: "Eliminado de Supabase" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUERTO DINÁMICO: Render usa process.env.PORT, localmente usa el 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));