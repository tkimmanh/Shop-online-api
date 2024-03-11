import jwt from 'jsonwebtoken'

export const generateToken = ({ id, secret_code = process.env.SECRET_KEY_USER, expiresIn }) => {
  return jwt.sign({ _id: id }, secret_code, {
    expiresIn: expiresIn
  })
}

export const verifyToken = ({ token, secret_code = process.env.SECRET_KEY_USER }) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret_code, (error, decoded) => {
      if (error) {
        throw reject(error)
      }
      resolve(decoded)
    })
  })
}
