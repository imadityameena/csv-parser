import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { router as api } from './routes';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/api', api);

const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

mongoose.connect(mongoUri).then(() => {
  console.log('MongoDB connected');
  app.listen(port, () => console.log(`API on :${port}`));
}).catch(err => {
  console.error('Mongo connect error', err);
  process.exit(1);
});



