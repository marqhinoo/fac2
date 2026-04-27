const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// CONFIGURACIÓN REFORZADA PARA SSL (RENDER + SUPABASE)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        // Esto le dice a Node que acepte el certificado de Supabase 
        // aunque sea "self-signed" (autofirmado)
        rejectUnauthorized: false
    },
    max: 10, // Máximo de conexiones simultáneas
    idleTimeoutMillis: 30000, // Tiempo para cerrar conexiones inactivas
    connectionTimeoutMillis: 10000, // 10 segundos antes de dar error de conexión
});

const initDB = async() => {
    try {
        // Verificación inicial de conexión
        const res = await pool.query('SELECT NOW()');
        console.log("✅ Conexión exitosa con Supabase establecida el:", res.rows[0].now);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS clientes (
                id SERIAL PRIMARY KEY,
                apellido TEXT,
                nombre TEXT,
                cuit TEXT,
                tel TEXT
            )
        `);
        console.log("📁 Tabla 'clientes' verificada/creada correctamente.");
    } catch (err) {
        console.error("❌ Error crítico de conexión a la DB:", err.message);
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
        console.error("Error al insertar:", err.message);
        res.status(500).send(err.message);
    }
});

app.get('/clientes', async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clientes ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error al obtener clientes:", err.message);
        res.status(500).send(err.message);
    }
});

app.delete('/delete-cliente/:id', async(req, res) => {
    try {
        await pool.query('DELETE FROM clientes WHERE id = $1', [req.params.id]);
        res.json({ message: "Eliminado de Supabase" });
    } catch (err) {
        console.error("Error al eliminar:", err.message);
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));