// Chamado todo dia pelo Cron do Vercel (ver vercel.json).
// O plano grátis do Supabase pausa o projeto depois de 7 dias sem uso;
// uma consulta diária no banco conta como uso e evita a pausa.
export default async function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return res.status(500).json({ ok: false, erro: 'Variáveis do Supabase ausentes' })
  }

  // RPC pública que já existe; com um slug inexistente devolve vazio, mas passa pelo banco
  const resposta = await fetch(`${url}/rest/v1/rpc/rpc_turma_publica`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_slug: 'keepalive' })
  })

  return res.status(resposta.ok ? 200 : 502).json({ ok: resposta.ok, status: resposta.status })
}
