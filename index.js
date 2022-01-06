const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;

const app = express();
app.use(bodyParser.json());
const HTTP_OK_STATUS = 200;
const PORT = '3000';

const validateToken = (request, response, next) => {
  const { authorization } = request.headers;

  if (!authorization) {
    return response.status(401).json({ message: 'Token não encontrado' });
  }

  if (authorization.length !== 16) {
    return response.status(401).json({ message: 'Token inválido' });
  }

  next();
};

const validateTalkObject = (request, response, next) => {
  const { talk } = request.body;

  if (!talk || !talk.watchedAt || !talk.rate) {
    return response.status(400).json(
      { message: 'O campo "talk" é obrigatório e "watchedAt" e "rate" não podem ser vazios' },
    );
  }

  next();
};

// retirado de: https://stackoverflow.com/questions/46155/whats-the-best-way-to-validate-an-email-address-in-javascript
const validateEmailFormat = (email) => {
  const validEmailFormat = /\S+@\S+\.\S+/;
  return email.match(validEmailFormat);
};

const validateEmail = (request, response, next) => {
  const { email } = request.body;

  if (!email || email === '') {
    return response.status(400).json({ message: 'O campo "email" é obrigatório' });
  }
  
  const checkEmail = validateEmailFormat(email);

  if (!checkEmail) {
    return response.status(400).json({ message: 'O "email" deve ter o formato "email@email.com"' });
  }

  next();
};

const validatePassword = (request, response, next) => {
  const { password } = request.body;

  if (!password || password === '') {
    return response.status(400).json({ message: 'O campo "password" é obrigatório' });
  }

  if (password.length < 6) {
    return response.status(400).json({ message: 'O "password" deve ter pelo menos 6 caracteres' });
  }

  next();
};

const validateName = (request, response, next) => {
  const { name } = request.body;

  if (!name) {
    return response.status(400).json({ message: 'O campo "name" é obrigatório' });
  }

  if (name.length < 3) {
    return response.status(400).json({ message: 'O "name" deve ter pelo menos 3 caracteres' });
  }

  next();
};

const validateAge = (request, response, next) => {
  const { age } = request.body;

  if (!age) {
    return response.status(400).json({ message: 'O campo "age" é obrigatório' });
  }

  if (Number(age) < 18) {
    return response.status(400).json({ message: 'A pessoa palestrante deve ser maior de idade' });
  }

  next();
};

// regex retirada de: https://stackoverflow.com/q/15491894
const validateDateFormat = (date) => {
  const validDateFormat = /^(0?[1-9]|[12][0-9]|3[01])[/-](0?[1-9]|1[012])[/-]\d{4}$/;
  return date.match(validDateFormat);
};

const validateDate = (request, response, next) => {
  const { talk } = request.body;

  const isValidDateFormat = validateDateFormat(talk.watchedAt);
  
  if (!isValidDateFormat) {
    return response.status(400).json(
      { message: 'O campo "watchedAt" deve ter o formato "dd/mm/aaaa"' },
    );
  }

  next();
};

const validateTalkRate = (request, response, next) => {
  const { talk } = request.body;

  if (talk.rate < 1 || talk.rate > 5) {
    return response.status(400).json({ message: 'O campo "rate" deve ser um inteiro de 1 à 5' });
  }

  next();
};

const readTalkersFIle = async () => {
  const talkersRawData = await fs.readFile('./talker.json');
  const talkersData = JSON.parse(talkersRawData);

  return talkersData;
};

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

// req. 3:
app.post('/login', validateEmail, validatePassword, (request, response) => {
  const token = '1569351970227241';

  response.status(200).json({ token });
});

// req. 1: 
app.get('/talker', async (_request, response) => {
  const talkersData = await readTalkersFIle();

  if (!talkersData || talkersData.length === 0) return response.status(200).json([]);

  response.status(200).json(talkersData);
});

// req. 7: 
app.get('/talker/search?', validateToken, async (request, response) => {
  const { name } = request.query;

  const talkersList = await readTalkersFIle();

  const filteredTalkersList = talkersList.filter((talker) => talker.name.includes(name));

  if (!name || name === '') {
    return response.status(200).json(talkersList);
  }

  if (filteredTalkersList.length === 0) {
    return response.status(200).json([]);
  }

  response.status(200).json([...filteredTalkersList]);
});

// req. 2: 
app.get('/talker/:id', async (request, response) => {
  const talkersData = await readTalkersFIle();

  const { id } = request.params;

  const findTalkerById = talkersData.find((talker) => talker.id === Number(id));

  if (!findTalkerById) {
  return response.status(404).json({ message: 'Pessoa palestrante não encontrada' });
  }

  response.status(200).json(findTalkerById);
});

// req 4: 
app.post('/talker',
  validateToken,
  validateTalkObject,
  validateName,
  validateAge,
  validateDate,
  validateTalkRate,
  async (request, response) => {
    const { name, age, talk } = request.body;
    const talkersData = await readTalkersFIle();

    const newTalker = { id: talkersData.length + 1, name, age, talk };
    const talkersList = [...talkersData, newTalker]; 
    const talkersListString = JSON.stringify(talkersList);
    await fs.writeFile('./talker.json', talkersListString);

    return response.status(201).json(newTalker);
});

// req. 5:
app.put('/talker/:id',
  validateToken,
  validateTalkObject,
  validateName,
  validateAge,
  validateDate,
  validateTalkRate,
  async (request, response) => {
    const { id } = request.params;
    const { name, age, talk } = request.body;

    const talkersList = await readTalkersFIle();

    const talkerIndex = talkersList.findIndex((talker) => talker.id === Number(id));

    talkersList[talkerIndex] = { ...talkersList[talkerIndex], name, age, talk };

    const editedtalkersList = JSON.stringify(talkersList);

    await fs.writeFile('./talker.json', editedtalkersList);

    response.status(200).json(talkersList[talkerIndex]);
});

// req. 6:
  app.delete('/talker/:id', validateToken, async (request, response) => {
    const { id } = request.params;

    const talkersList = await readTalkersFIle();

    const talkerIndex = talkersList.findIndex((talker) => talker.id === Number(id));

    if (talkerIndex === -1) return response.status(404).json({ message: 'Talker não encontrado' });

    talkersList.splice(talkerIndex, 1);

    const listWithoutDeletedTalker = JSON.stringify(talkersList);

    await fs.writeFile('./talker.json', listWithoutDeletedTalker);

    return response.status(200).json({ message: 'Pessoa palestrante deletada com sucesso' });
  });

app.listen(PORT, () => {
  console.log('Online');
});
