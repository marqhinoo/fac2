const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'admin',
    port: 5432,
});

const initDB = async() => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS clientes (
            id SERIAL PRIMARY KEY,
            apellido TEXT,
            nombre TEXT,
            cuit TEXT,
            tel TEXT
        )
    `);
    console.log("Tabla lista en el motor PostgreSQL.");
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
        res.json({ message: "Eliminado del motor" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(3000, () => console.log('Corriendo en http://localhost:3000'));