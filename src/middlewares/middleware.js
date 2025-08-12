

import jwt from 'jsonwebtoken'

const SECRET = 'myVerySecretKey'; 

 export function decodeTokenMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET);

   
    req.vendor_id = decoded.vendor_id;
    req.current_plan_data = decoded.current_plan_data;

    next(); 
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}


