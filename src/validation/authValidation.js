import jwt from 'jsonwebtoken'


const JWT_SECRET = 'your_jwt_secret_key'; 
// authValidation function
const authValidation = (res, userId) => {
  const payload = {
    id: userId,
  };


  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });


  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in production
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};
export default authValidation;
