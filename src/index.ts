import 'dotenv/config';
import app from './server';

const port = Number(process.env.PORT);

if (!port) {
  console.error('Error: PORT environment variable is required');
  process.exit(1);
}

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});

export default app;