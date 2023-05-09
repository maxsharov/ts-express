import fs from 'fs'
import path from 'path'
import { Dropbox } from 'dropbox'
import store from '../store'

async function syncImagesService() {
  try {
    const dbx = new Dropbox({ accessToken: store.accessToken })

    const response: any = await dbx.filesListFolder({ path: '/samples' })

    const files = response.result.entries

    for (let file of files) {
      const data = await dbx.filesDownload({ path: file.id })

      fs.writeFile(path.join('images', data.result.name), (<any> data).result.fileBinary, { encoding: 'binary' }, (err) => {
        // if (err) { throw err; }
        console.log(`File: ${data.result.name} saved.`)
      })
    }

    // const cursor = store.cursor

  } catch(err) {
    console.log(err)
  }

}

export {
  syncImagesService
}