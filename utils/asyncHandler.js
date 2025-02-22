const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.log("ERROR", err);
      return res.status(500).json({
        success: false,
        message: "Inernal Server Error",
      });
    });
  };
};
export { asyncHandler };
