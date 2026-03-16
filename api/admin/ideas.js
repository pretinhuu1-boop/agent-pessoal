export const config = { runtime: 'edge' };

export default async function handler(req) {
  // CORS for the admin page
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  // --- Auth: check admin password ---
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'ADMIN_PASSWORD not configured on server' }), { status: 500, headers });
  }

  const password = req.headers.get('x-admin-password');
  if (!password || password !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Senha incorreta' }), { status: 401, headers });
  }

  // --- Appwrite config ---
  const endpoint = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
  const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.VITE_APPWRITE_IDEAS_COLLECTION_ID || process.env.APPWRITE_IDEAS_COLLECTION_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !databaseId || !collectionId || !apiKey) {
    return new Response(JSON.stringify({
      error: 'Missing Appwrite config',
      missing: {
        endpoint: !endpoint,
        projectId: !projectId,
        databaseId: !databaseId,
        collectionId: !collectionId,
        apiKey: !apiKey,
      },
    }), { status: 500, headers });
  }

  // --- Fetch all ideas from Appwrite REST API ---
  try {
    const url = `${endpoint}/databases/${databaseId}/collections/${collectionId}/documents?queries[]=${encodeURIComponent(JSON.stringify({ method: 'limit', values: [500] }))}&queries[]=${encodeURIComponent(JSON.stringify({ method: 'orderDesc', attribute: '$createdAt' }))}`;

    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: `Appwrite error: ${res.status}`, details: err }), { status: res.status, headers });
    }

    const data = await res.json();

    // Transform documents to clean format
    const ideas = data.documents.map(doc => ({
      id: doc.$id,
      userId: doc.userId,
      title: doc.title || '',
      description: doc.description || '',
      category: doc.category || 'outro',
      status: doc.status || 'idea',
      priority: doc.priority || 'medium',
      tags: doc.tags || [],
      notes: doc.notes || '',
      tasks: doc.tasks ? JSON.parse(doc.tasks) : [],
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    }));

    return new Response(JSON.stringify({
      total: data.total,
      ideas,
    }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
