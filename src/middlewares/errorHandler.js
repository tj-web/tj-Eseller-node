export const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err);

  // ✅ Known error (AppError)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // ❌ Unknown error (programming / DB / crash)
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};