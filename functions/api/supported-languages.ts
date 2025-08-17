// Supported languages endpoint for Cloudflare Workers
export const onRequestGet: PagesFunction = async () => {
  return new Response(
    JSON.stringify({
      languages: [
        'javascript',
        'typescript',
        'python',
        'java',
        'cpp',
        'c',
        'go',
        'rust',
        'php',
        'ruby',
        'swift',
        'kotlin',
      ],
    }),
    {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    }
  );
};
