import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { Request } from 'express';
import 'dotenv/config';

cloudinary.config({
  cloud_name: 'dqd3wgjba',
  api_key: '237841915261381',
  api_secret: 'aJXHB5Vfh7-liswVhJw4Vk-m_uI',
});


console.log('CLOUDINARY API KEY:', process.env.CLOUDINARY_API_KEY);


const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      folder: 'book-covers',
      allowed_formats: ['jpg', 'png', 'gif', 'webp'],
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

export const uploadConfig = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/pjpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido.'));
    }
  },
});

export const deleteImage = async (publicId: string) => {
  return await cloudinary.uploader.destroy(publicId);
};

export const extractPublicId = (url: string): string => {
  const parts = url.split('/');
  const fileWithExtension = parts[parts.length - 1];
  const folder = parts.slice(parts.indexOf('upload') + 1, parts.length - 1).join('/');
  const fileName = fileWithExtension.split('.')[0];
  return `${folder}/${fileName}`;
};


export { cloudinary };
