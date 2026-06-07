import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { initSocket } from './socket.js';
import { UPLOAD_DIR } from './services/storage/local.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(
  cors({
    origin(origin, cb) {
      // allow same-origin / curl (no origin) and any configured client URL
      if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
      cb(null, true); // permissive in this reference build; tighten for production
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve locally-stored media (when STORAGE_DRIVER=local)
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/', (req, res) =>
  res.json({ name: 'Event & Media Management Platform API', version: '1.0.0', docs: '/api/health' })
);

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

server.listen(env.port, () => {
  console.log(`API + Socket.io listening on http://localhost:${env.port}`);
  console.log(`Storage driver: ${env.storageDriver} | AI driver: ${env.aiDriver}`);
});

export default app;
