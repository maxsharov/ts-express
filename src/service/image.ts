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

      const imagePath = path.join('images', data.result.name)

      fs.access(imagePath, function (error) {
        if (error) {
          fs.writeFile(
            path.join('images', data.result.name), 
            (<any> data).result.fileBinary, 
            { encoding: 'binary' },
            (err) => {
              if (err) { 
                // console.log(`File: ${data.result.name} exists.`)
              }
              console.log(`File: ${data.result.name} saved.`)
            }
          )
        } else {
          console.log(`File: ${data.result.name} exists.`)
        }
      })
    }
  } catch(err) {
    console.log(err)
  }

}

export {
  syncImagesService
}