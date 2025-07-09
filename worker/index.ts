import { Hono } from 'hono'

type Bindings = {
  VIDEOS: R2Bucket;
};

const app = new Hono< CloudflareBindings>()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const route = app.post('/api/upload', async (c) => {
  const body = await c.req.parseBody()
  console.log(body['video']) // File | string
  const file: File = body['video'] as File
  console.log(file.name)
  //upload to r2
  const id = await c.env.VIDEOS.put(file.name, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'max-age=31536000', // 1 year
    },
  })
  

  return c.json({
    success: true,
    id: id,
  },
    200)
})
.get('/api/videos/:videoId', async (c) => {
  const videoId = c.req.param('videoId')
  const video = await c.env.VIDEOS.get(videoId)
  if (!video || !video.body) {
    return c.json({ error: 'Video not found' }, 404)
  }
  
  return c.body(video.body, 200, {
    'Content-Type': video.httpMetadata?.contentType ?? 'application/octet-stream',
    'Cache-Control': video.httpMetadata?.cacheControl ?? 'no-cache',
  })
})
.get('/api/videos', async (c) => {
  const list = await c.env.VIDEOS.list()
  const videos = list.objects.map((obj) => ({
    key: obj.key,
    size: obj.size,
    etag: obj.etag,
  }))
  return c.json(videos, 200)
})



export default app
export type AppType = typeof route
