import { Id } from './_generated/dataModel';
import { httpAction } from './_generated/server';
import { httpRouter } from 'convex/server';

const http = httpRouter();

http.route({
  path: '/getFile',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const { searchParams } = new URL(request.url);
    const storageId = searchParams.get('storageId')! as Id<'_storage'>;

    const blob = await ctx.storage.get(storageId);
    if (blob === null) {
      return new Response('File not found', {
        status: 404,
      });
    }

    return new Response(blob);
  }),
});

export default http;
