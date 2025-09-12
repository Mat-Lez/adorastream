const express = require('express');
const { connectDB } = require('./db');

const users = require('./routes/users.routes');
const content = require('./routes/content.routes');
const history = require('./routes/history.routes');
const { notFound, errorHandler } = require('./middleware/error');


const app = express();
app.use(express.json());

app.use('/api/users', users);
app.use('/api/content', content);
app.use('/api/history', history);  

app.use(notFound);
app.use(errorHandler);

(async () => {
  await connectDB();
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
})();