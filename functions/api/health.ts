// Health check endpoint for Cloudflare Workers
export const onRequestGet: PagesFunction = async () => {
  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      agent: 'CodeReviewAgent',
      model: 'gpt-3.5-turbo',
      platform: 'Cloudflare Pages + Workers'
    }),
    {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    }
  );
};
