import { createApp } from '../server/dist/app.js';

const app = createApp();

export default function handler(req, res) {
  return app(req, res);
}
