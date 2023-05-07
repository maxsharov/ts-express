import express, { Express } from 'express'
import router from './router'

const app: Express = express()
const PORT = process.env.PORT || 5000

app.use(express.static('client/build'))
app.use('/images', express.static('images'))
app.use(router)

const start = async () => {
  try {
    app.listen(PORT, () => console.log(`Server started on ${PORT} port`))
  } catch (e) {
    console.log(e)
  }
}

start()
