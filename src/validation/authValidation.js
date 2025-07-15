import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_jwt_secret_key'; 

const authValidation = (res, userData) => {
// console.log(">>>>>>",userData)
  const payload = {
    vendor_id: userData.vendor_id,
    profile_id: userData.id,
    v_name: userData.first_name,
    v_lname: userData.last_name,
    v_email: userData.email,
    v_dial_code: userData.dial_code,
    v_number: userData.phone,
    is_temp_account: userData.is_temp,
    vendor_mode: userData.vendor_mode,
    v_created: userData.created_at,
    v_current_plan_data: userData.show_current_plan_data,
    v_email_verified: userData.email_verified,
  };

  // Sign token
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  res.cookie('token', token, {
    httpOnly: true,
    secure:false,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export default authValidation;
