import app from './app.js';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server started working at the port : http://localhost:${port}`);
});
