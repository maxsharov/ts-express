import { Request, Response, NextFunction } from 'express'
import store from '../store'

const authMiddleware = (_req: Request, res: Response, next: NextFunction) => {
  if (!store.accessToken) {
    return res.status(401)
      .json({ 'message': 'Token is not available' })
  }

  next()
}

export {
  authMiddleware
}