import express, { Request, Response } from 'express'
import * as dotenv from 'dotenv'
import dropboxV2Api from 'dropbox-v2-api'
import store from './store'
import fs from 'fs'
import path from 'path'

dotenv.config()

const router = express.Router()

const dropbox = dropboxV2Api.authenticate({
  client_id: process.env.DROPBOX_CLIENT_ID,
  client_secret: process.env.DROPBOX_CLIENT_SECRET,
  redirect_uri: process.env.DROPBOX_REDIRECT_URI,
  token_access_type: 'offline', // if you need an offline long-living refresh token
  state: 'OPTIONAL_STATE_VALUE'
})

router.get('/', (_req: Request, res: Response) => {
  return res.send('<a href="/login">Login</html>')
})

router.get('/login', async (_req: Request, res: Response) => {
  const authUrl = dropbox.generateAuthUrl();

  res.writeHead(302, { Location: authUrl })
  res.end()
})

router.get('/refresh-token', (req, res) => {
  dropbox.refreshToken(store.refreshToken, (err: any, result: { access_token: string }) => {
    store.accessToken = result.access_token
    console.log('refresh token result', result)

  })
})

router.get('/auth', (req, res) => {
  console.log('/auth')

  const { code }: { code?: any} = req.query;

  dropbox.getToken(code, (_err: any, result: { access_token: string; refresh_token: string }, response: any) => {
    console.log('result', result)

    store.accessToken = result.access_token
    store.refreshToken = result.refresh_token
    // you are authorized now!
    //
    // ...then you can refresh your token! (flow for token_access_type='offline')
    // dropbox.refreshToken(response.refresh_token, (err, result, response) => {
    //     //token is refreshed!
    // });
    res.redirect('/?auth=1')
  });
})

router.get('/get-tokens', (req, res) => {
  res.send(
    'Access token is ' + store.accessToken + 
    '. Refresh token is ' + store.refreshToken
  )
})

router.get('/get-images', (req, res) => {
  const results = []

  const dir = './images/'

  try {
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }

    const files = fs.readdirSync(dir)
  
    files.forEach(file => {
      results.push(file)
    })

    res.json(results)
  } catch (err) {
    console.log(err)
  }
})

router.get('/sync-images', (req, res) => {

  const cursor = store.cursor

  // const resource = 'files/list_folder' + (cursor ? '/continue')

  let dropboxConfig: any

  if (!cursor) {
    dropboxConfig = {
      resource: 'files/list_folder',
      parameters: {
          path: '/samples',
          limit: 2
      }
    }
  } else {
    dropboxConfig = {
      resource: 'files/list_folder/continue',
      parameters: {
        cursor
      }
    }
  }

  dropbox(dropboxConfig, async (err: any, result: { has_more: any; cursor: null; entries: any }, response: any) => {
    // console.log('some result', result)

    if (result.has_more) {
      store.cursor = result.cursor
    } else {
      store.cursor = null
    }
    
    const files = result.entries
    let i = 0

    for (let file of files) {
    
      // console.log('file', file)
      /**
        file {
          '.tag': 'file',
          name: 'image-1.jpg',
          path_lower: '/samples/image-1.jpg',
          path_display: '/samples/image-1.jpg',
          id: 'id:hiWNdCyIIa0AAAAAAAAAHg',
          client_modified: '2023-05-05T08:40:07Z',
          server_modified: '2023-05-05T08:40:07Z',
          rev: '5faee3c7d24d40df7edef',
          size: 187741,
          is_downloadable: true,
          content_hash: 'efba51e9db838068f3c59fe7cc77a8f726d93bfdfcfb492df5518756a526c7cc'
        }
      */
      dropbox({
        resource: 'files/download',
        parameters: {
            path: file.id,
        },
        
      }, (err: any, result: any, response: any) => {
        
          console.log('file downloaded')
          // console.log('file downloaded result', result)
          // console.log('file downloaded response', response)

          i++
          if (i === files.length && store.cursor) {
            // redirect to get-images with cursor
            console.log('here we need to redirect to get-images with cursor', store.cursor)
            res.redirect('/sync-images')
          }
      })
      .pipe(fs.createWriteStream(path.join('images/', file.name)))

      // console.log('after download ?')
    }
  })
})

export default router