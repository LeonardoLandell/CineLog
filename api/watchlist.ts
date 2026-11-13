import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, initDb } from './db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configuração de CORS para permitir requisições do front-end local ou da Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await initDb();
    const userId = 'default_user'; // Contexto fixo para o MVP

    // 1. CONSULTAR LISTA (GET /api/watchlist)
    if (req.method === 'GET') {
      const rs = await db.execute({
        sql: 'SELECT * FROM watchlist WHERE user_id = ? ORDER BY created_at DESC',
        args: [userId]
      });
      return res.status(200).json(rs.rows);
    }

    // 2. ADICIONAR FILME/SÉRIE/ANIME (POST /api/watchlist)
    if (req.method === 'POST') {
      const { uid, externalId, source, type, title, poster, year, rating, overview } = req.body;
      
      if (!uid || !externalId || !source || !type || !title) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
      }

      await db.execute({
        sql: `INSERT INTO watchlist (user_id, media_uid, external_id, source, type, title, poster, year, rating, overview)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(user_id, media_uid) DO NOTHING`,
        args: [userId, uid, externalId, source, type, title, poster || '', year || '', rating || null, overview || '']
      });

      return res.status(201).json({ success: true, message: 'Adicionado com sucesso.' });
    }

    // 3. ATUALIZAR STATUS OU NOTA PESSOAL (PATCH /api/watchlist?uid=...)
    if (req.method === 'PATCH') {
      const { uid } = req.query;
      const { status, personal_rating } = req.body;

      if (!uid) {
        return res.status(400).json({ error: 'Identificador (uid) não fornecido.' });
      }

      // Validação de regra de negócio: nota pessoal de 1 a 10
      if (personal_rating !== undefined && personal_rating !== null) {
        const numRating = Number(personal_rating);
        if (isNaN(numRating) || numRating < 1 || numRating > 10) {
          return res.status(400).json({ error: 'A avaliação pessoal deve estar entre 1 e 10.' });
        }
      }

      await db.execute({
        sql: `UPDATE watchlist 
              SET status = COALESCE(?, status), 
                  personal_rating = CASE 
                    WHEN ? = -1 THEN NULL 
                    ELSE COALESCE(?, personal_rating) 
                  END
              WHERE user_id = ? AND media_uid = ?`,
        args: [
          status || null, 
          personal_rating === null ? -1 : 0, 
          personal_rating !== undefined && personal_rating !== null ? Number(personal_rating) : null, 
          userId, 
          String(uid)
        ]
      });

      return res.status(200).json({ success: true, message: 'Atualizado com sucesso.' });
    }

    // 4. REMOVER DA WATCHLIST (DELETE /api/watchlist?uid=...)
    if (req.method === 'DELETE') {
      const { uid } = req.query;

      if (!uid) {
        return res.status(400).json({ error: 'Identificador (uid) não fornecido.' });
      }

      await db.execute({
        sql: 'DELETE FROM watchlist WHERE user_id = ? AND media_uid = ?',
        args: [userId, String(uid)]
      });

      return res.status(200).json({ success: true, message: 'Removido com sucesso.' });
    }

    return res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']).status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}