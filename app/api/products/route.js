import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import Product from '../../../models/Product';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const authMiddleware = (req) => {
  const token = req.headers.get('authorization');
  if (!token) throw new Error('No token provided');
  return jwt.verify(token, process.env.JWT_SECRET);
};

export async function GET(req) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const products = await Product.find();
    return new Response(JSON.stringify(products), { status: 200 });
  } catch (error) {
    return new Response('Error fetching products: ' + error.message, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = authMiddleware(req);
    if (user.role !== 'admin') {
      return new Response('Admins only', { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get('name');
    const price = formData.get('price');
    const stock = formData.get('stock');
    const description = formData.get('description');
    const prominentImageIndex = parseInt(formData.get('prominentImageIndex') || 0);
    const files = formData.getAll('images'); // Get uploaded images

    if (!name || !price || !stock || !description) {
      return new Response('Missing required fields', { status: 400 });
    }

    const numericPrice = parseFloat(price);
    const numericStock = parseInt(stock);
    if (isNaN(numericPrice) || isNaN(numericStock)) {
      return new Response('Invalid price or stock value', { status: 400 });
    }

    // Upload images to Cloudinary
    const imageUploads = files.map(async (file, index) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve({ url: result.secure_url, isProminent: index === prominentImageIndex });
          }
        ).end(buffer);
      });
    });

    const images = await Promise.all(imageUploads);

    await mongoose.connect(process.env.MONGO_URI);
    const product = new Product({
      name,
      price: numericPrice,
      stock: numericStock,
      description,
      images,
    });

    await product.save();
    return new Response(JSON.stringify(product), { status: 201 });
  } catch (error) {
    console.error('Error adding product:', error);
    return new Response('Error adding product: ' + error.message, { status: 400 });
  }
}