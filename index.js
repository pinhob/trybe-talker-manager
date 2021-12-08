const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';

// adaptado de: https://medium.com/@norbertofariasmedeiros/five-steps-como-gerar-um-random-token-em-javascript-1e1488a15d28
const generateToken = () => Math.random().toString(10).substr(2);

// retirado de: https://stackoverflow.com/questions/46155/whats-the-best-way-to-validate-an-email-address-in-javascript
const validateEmail = (email) => {
  const validEmailFormat = /\S+@\S+\.\S+/;
  return email.match(validEmailFormat);
};

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

// req. 3:
app.post('/login', (request, response) => {
  const { email, password } = request.body;
  const token = generateToken();
  
  if (!email || email === '') {
    return response.status(400).json({ message: 'O campo "email" é obrigatório' });
  }
  
  const checkEmail = validateEmail(email);

  if (!checkEmail) {
    return response.status(400).json({ message: 'O "email" deve ter o formato "email@email.com"' });
  }

  if (!password || password === '') {
    return response.status(400).json({ message: 'O campo "password" é obrigatório' });
  }

  if (password.length < 6) {
    return response.status(400).json({ message: 'O "password" deve ter pelo menos 6 caracteres' })
  }

  response.status(200).json({ token });
});

app.listen(PORT, () => {
  console.log('Online');
});
