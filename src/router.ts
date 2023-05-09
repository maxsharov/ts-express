import express, { Request, Response } from 'express'
import * as dotenv from 'dotenv'
import dropboxV2Api from 'dropbox-v2-api'
import store from './store'
import fs from 'fs'
import fsPromises from "node:fs/promises"
import path from 'node:path'
import { authMiddleware } from './middleware/authMiddleware'

import { Dropbox, DropboxAuth } from 'dropbox'
import { syncImagesService } from './service/image'

dotenv.config()

const router = express.Router()

const dropbox = dropboxV2Api.authenticate({
  client_id: process.env.DROPBOX_CLIENT_ID,
  client_secret: process.env.DROPBOX_CLIENT_SECRET,
  redirect_uri: process.env.DROPBOX_REDIRECT_URI,
  token_access_type: 'offline', // if you need an offline long-living refresh token
  state: 'OPTIONAL_STATE_VALUE'
})

// const dbx = new Dropbox({
//   clientId: process.env.CLIENT_ID
// })

const dbxAuth = new DropboxAuth({
  clientId: process.env.DROPBOX_CLIENT_ID,
  clientSecret: process.env.DROPBOX_CLIENT_SECRET,
})

// console.log('dbxAuth',  dbxAuth)

// router.get('/', (_req: Request, res: Response) => {
//   return res.send('<a href="/login">Login</html>')
// })

router.get('/login', async (_req: Request, res: Response) => {
  try {
    const authUrl = await dbxAuth.getAuthenticationUrl(process.env.DROPBOX_REDIRECT_URI, null, 'code', 'offline', null, 'none', false)
    console.log('authUrl', authUrl) 

    res.writeHead(302, { Location: authUrl.toString() })
    res.end()
  } catch(err) {
    console.log(err)
  }

  // old implementation:
  // dbx.auth.getAuthenticationUrl(redirectUri, null, 'code', 'offline', null, 'none', true)
  // const authUrl = dropbox.generateAuthUrl()
  // console.log('authUrl', authUrl)
})

router.get('/refresh-token', (req, res) => {
  dropbox.refreshToken(store.refreshToken, (err: any, result: { access_token: string }) => {
    store.accessToken = result.access_token
    console.log('refresh token result', result)

  })
})

router.get('/auth',  async (req, res) => {
  console.log('/auth')

  const { code }: { code?: any} = req.query

  console.log('code', code)
  console.log('process.env.DROPBOX_REDIRECT_URI', process.env.DROPBOX_REDIRECT_URI)

  try {
    const response: any = await dbxAuth.getAccessTokenFromCode(process.env.DROPBOX_REDIRECT_URI, code)
    console.log('result', response)
  
    store.accessToken = response.result.access_token
    store.refreshToken = response.result.refresh_token

    return res.redirect('/?auth=1')
  } catch (err) {
    console.log(err)
  }


  // dropbox.getToken(code, (err: any, result: { access_token: string; refresh_token: string }, response: any) => {
    
    
  //   console.log('result', result)

  //   store.accessToken = result.access_token
  //   store.refreshToken = result.refresh_token
  //   // you are authorized now!
  //   //
  //   // ...then you can refresh your token! (flow for token_access_type='offline')
  //   // dropbox.refreshToken(response.refresh_token, (err, result, response) => {
  //   //     //token is refreshed!
  //   // });
  //   res.redirect('/?auth=1')
  // });
  
})

router.get('/reset', async () => {
  store.accessToken = null
  store.refreshToken = null

  const directory = "images";

  for (const file of await fsPromises.readdir(directory)) {
    await fsPromises.unlink(path.join(directory, file));
  }
})

router.get('/get-tokens', (req, res) => {
  res.send(
    'Access token is ' + store.accessToken + 
    '. Refresh token is ' + store.refreshToken
  )
})

function getImages (req, res) {
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
    console.log('getImages error', err)
  }
}

router.get('/get-images', getImages)

async function syncImages (req, res, next) {
  await syncImagesService()
  return res.json({ "message": "done" })

  const dbx = new Dropbox({ accessToken: store.accessToken })

  const result = await dbx.filesListFolder({ path: '/samples' })
  console.log('result', result)
  // return

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

  dropbox(dropboxConfig, (err: any, result: any, response: any) => {
    // console.log('[files/list_folder] error', err)

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

      const imagePath = path.join('images/', file.name)

      dropbox({
        resource: 'files/download',
        parameters: {
            path: file.id,
        },
        
      }, (err: any, result: any, response: any) => {
        // console.log('backend sync error', err)
        
          console.log('file downloaded')
          // console.log('file downloaded result', result)
          // console.log('file downloaded response', response)

          i++
          if (i === files.length && store.cursor) {
            // redirect to get-images with cursor
            console.log('here we need to redirect to get-images with cursor', store.cursor)
            res.redirect('/sync-images')
          } else {
            // everything is downloaded
          }
      })
      .pipe(fs.createWriteStream(imagePath, { flags: 'a+' }))

      // console.log('after download ?')
    }
  })
}

router.get('/sync-images', authMiddleware, syncImages)

export default router