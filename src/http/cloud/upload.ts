import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../../config/cloudn'; // já tipado como v2

const router = express.Router();

const storage = new CloudinaryStorage({
    cloudinary, // agora é do tipo certo
    params: async (req: express.Request, file: Express.Multer.File) => ({
        folder: 'biblioteca/covers',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        public_id: `${Date.now()}-${file.originalname}`,
    })
    });

const upload = multer({ storage });

router.post('/upload', upload.single('image'), (req, res) => {
  const file = req.file as Express.Multer.File;
  res.json({ imageUrl: file.path }); // file.path é a URL da imagem
});

export default router;
