const express = require('express');
const path = require('path');
const { connectToCollection, desconnect, generateCode } = require('../connection_db.js');

const server = express();

require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Middlewares
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.get('/api/v1/muebles', async (req, res) => {
    const { precio_gte, precio_lte, categoria } = req.query;

    const muebles = [];

    try {
        let collection = await connectToCollection('muebles');
        if (categoria) muebles.push(...await collection.find({ categoria }).sort({ nombre: 1 }).toArray());
        else if (precio_gte) muebles.push(...await collection.find({ precio: { $gte: Number(precio_gte)} }).sort({ precio: 1 }).toArray());
        else if (precio_lte) muebles.push(...await collection.find({ precio: { $lte: Number(precio_lte)} }).sort({ precio: -1 }).toArray());
        else muebles.push(...await collection.find().toArray());

        res.status(200).send({ payload: muebles });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({message: 'Se ha generado un error en el servidor'});
    } finally {
        await desconnect();
    }
});

server.get('/api/v1/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;

    try {
        const collection = await connectToCollection('muebles');
        const mueble = await collection.findOne({ codigo: { $eq: Number(codigo) } });

        if (!mueble) return res.status(400).send({ message: 'El código no corresponde a un mueble registrado' });

        res.status(200).send({ payload: mueble });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: 'Se ha generado un error en el servidor' });
    } finally {
        await desconnect();
    }
});

server.post('/api/v1/muebles', async (req, res) => {
    const { nombre, precio, categoria } = req.body;

    if (!nombre || !precio || !categoria) {
        return res.status(400).send({ message: 'Faltan datos relevantes' });
    }

    try {
        const collection = await connectToCollection('muebles');
        const mueble = { codigo: Number(await generateCode(collection)), nombre, precio: parseFloat(precio), categoria };

        await collection.insertOne(mueble);

        res.status(201).send({ message: 'Registro creado', payload: mueble });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: 'Se ha generado un error en el servidor' });
    } finally {
        await desconnect();
    }
});

server.put('/api/v1/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { nombre, precio, categoria } = req.body;

    if (!codigo || !nombre || !precio || !categoria) {
        return res.status(400).send({ message: 'Faltan datos relevantes' });
    }

    const mueble = { codigo: Number(codigo), nombre, precio: Number(precio), categoria };


    try {
        const collection = await connectToCollection('muebles');
        const muebleExists = await collection.findOne({ codigo: { $eq: Number(codigo) } });

        if (!muebleExists) return res.status(400).send({ message: 'El código no corresponde a un mueble registrado' });

        await collection.updateOne({ codigo: Number(codigo) }, { $set: mueble});

        res.status(200).send({message: 'Registro actualizado', payload: mueble});
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: 'Se ha generado un error en el servidor' });
    } finally {
        await desconnect();
    }
});

server.delete('/api/v1/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;

    try {
        const collection = await connectToCollection('muebles');
        const muebleExists = await collection.findOne({ codigo: { $eq: Number(codigo) } });

        if (!muebleExists) return res.status(400).send({ message: 'El código no corresponde a un mueble registrado' });

        await collection.deleteOne({ codigo: { $eq: Number(codigo) } });


        res.status(200).send({ message: 'Registro eliminado' });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: 'Se ha generado un error en el servidor' });
    } finally {
        await desconnect();
    }
});

server.use('*', (req, res) => {
    res.status(404).send({ message: 'La URL indicada no existe' });
});

server.listen(process.env.SERVER_PORT, process.env.SERVER_HOST, () => {
    console.log(`Ejecutandose en http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/v1/muebles`);
});