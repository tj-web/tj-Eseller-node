// validInput.js
export const validInput = async (req, res, next) => {
  try {
    const { email, phone, name, password } = req.body;

    // 1. Check required fields exist
    if (!email || !phone || !name || !password) {
      return res.status(400).json({ message: "All fields (email, phone, name, password) are required." });
    }

    // 2. Validate business email (not gmail, yahoo, outlook, etc.)
    const freeDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com", "protonmail.com"];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }
    const domain = email.split("@")[1].toLowerCase();
    if (freeDomains.includes(domain)) {
      return res.status(400).json({ message: "Only business emails are allowed." });
    }

    // 3. Validate phone (10–15 digits, optional +country code)
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number format." });
    }

    // 4. Validate name (only letters & spaces, at least 2 chars)
    const nameRegex = /^[A-Za-z\s]{2,50}$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ message: "Invalid name. Only alphabets and spaces allowed (2–50 chars)." });
    }

    // 5. Validate password (at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&#!]{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
      });
    }

    //  If all validations pass
    next();
  } catch (err) {
    console.error("Validation error:", err);
    res.status(500).json({message: "Server error during validation." });
  }
};

export const emailValidate= async (req,res,next)=>{
  try {

       const { email } = req.body;

    // 1. Check required fields exist
    if (!email ) {
      return res.status(400).json({ message: "email is required" });
    }


    const freeDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com", "protonmail.com"];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }
    const domain = email.split("@")[1].toLowerCase();
    if (freeDomains.includes(domain)) {
      return res.status(400).json({ message: "Only business emails are allowed." });
    }
 next();
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({message: "Server error during validation." });
  }
}
