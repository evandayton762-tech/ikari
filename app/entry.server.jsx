// app/entry.server.jsx

// 👇 Force Oxygen/Vite to include these glb assets
import '~/assets/preserve-glbs';

import { RemixServer } from '@remix-run/react';
import { renderToReadableStream } from 'react-dom/server';

export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext,
) {
  const body = await renderToReadableStream(
    <RemixServer context={remixContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    }
  );

  responseHeaders.set('Content-Type', 'text/html');

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
