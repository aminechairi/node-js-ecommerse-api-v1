const multer = require("multer");
const ApiError = require("../utils/apiErrore");

const multerOptions = () => {
  // 1 - discStorage engine
  // const multeStorage = multer.diskStorage({
  //   destination: (req, file, cb) => {
  //     cb(null, "uploads/categories");
  //   },
  //   filename: (req, file, cb) => {
  //     const ext = file.mimetype.split('/')[1];
  //     const fileName = `categories-${uuidv4()}-${Date.now()}.${ext}`;
  //     cb(null, fileName);
  //   },
  // });
  // 2 - memoryStorage engine
  const multeStorage = multer.memoryStorage();
  const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new ApiError("Only images allowd", 400), false);
    }
  };
  const upload = multer({ storage: multeStorage, fileFilter: multerFilter });
  return upload;
}

exports.uploadSingleImage = (fieldName) => 
  multerOptions().single(fieldName);

exports.uploadMultipleImages = (arrayOfFields) =>  
  multerOptions().fields(arrayOfFields);