const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';

// const talkersRawData;

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

// req. 1: 
app.get('/talker', (_request, response) => {
  const talkersRawData = fs.readFileSync('./talker.json');
  const talkersData = JSON.parse(talkersRawData);

  if (!talkersData || talkersData.length === 0) return response.status(200).json([]);

  response.status(200).json(talkersData);
});

// req. 2: 
app.get('/talker/:id', (request, response) => {
  const talkersRawData = fs.readFileSync('./talker.json');
  const talkersData = JSON.parse(talkersRawData);

  const { id } = request.params;

  const findTalkerById = talkersData.find((talker) => talker.id === Number(id));

  if (!findTalkerById) {
  return response.status(404).json({ message: 'Pessoa palestrante não encontrada' });
  }

  response.status(200).json(findTalkerById);
});

app.listen(PORT, () => {
  console.log('Online');
});
