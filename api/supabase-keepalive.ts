declare const process: {
  env: Record<string, string | undefined>;
};

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ error: 'Supabase nao configurado.' });
  }

  try {
    const response = await fetch(
      supabaseUrl + '/rest/v1/health_inputs?select=id&limit=1',
      {
        headers: {
          apikey: anonKey,
          Authorization: 'Bearer ' + anonKey
        }
      }
    );

    if (!response.ok) {
      return res.status(502).json({ error: 'Supabase respondeu ' + response.status + '.' });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: 'Falha ao consultar o Supabase.' });
  }
}
