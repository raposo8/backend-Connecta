const Materia = require('../models/materiaModel');

const listarMaterias = async (req, res) => {
    try {
        const materias = await Materia.findAll();
        res.status(200).json(materias);
    } catch (error) {
        console.error('Erro ao buscar matérias:', error);
        res.status(500).json({ message: 'Erro ao buscar matérias.' });
    }
};

module.exports = {
    listarMaterias,
};