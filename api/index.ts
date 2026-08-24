import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../server';

export default function (req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
