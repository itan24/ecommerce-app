import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import Product from '../../../../models/Product';

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

export async function GET(req, { params }) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const product = await Product.findById(params.id);
    if (!product) {
      return new Response(JSON.stringify({ message: 'Product not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(product), { status: 200 });
  } catch (error) {
    return new Response('Error fetching product: ' + error.message, { status: 500 });
  }
}

export async function PUT(req, { params }) {
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
    const deleteImages = JSON.parse(formData.get('deleteImages') || '[]');
    const files = formData.getAll('images'); // New images

    if (!name || !price || !stock || !description) {
      return new Response('Missing required fields', { status: 400 });
    }

    const numericPrice = parseFloat(price);
    const numericStock = parseInt(stock);
    if (isNaN(numericPrice) || isNaN(numericStock)) {
      return new Response('Invalid price or stock value', { status: 400 });
    }

    await mongoose.connect(process.env.MONGO_URI);
    const product = await Product.findById(params.id);
    if (!product) {
      return new Response('Product not found', { status: 404 });
    }

    // Upload new images to Cloudinary
    const imageUploads = files.map(async (file, index) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve({ url: result.secure_url, isProminent: false });
          }
        ).end(buffer);
      });
    });

    const newImages = await Promise.all(imageUploads);

    // Filter out deleted images
    let existingImages = product.images.filter(img => !deleteImages.includes(img.url));

    // Combine existing and new images
    const allImages = [...existingImages, ...newImages];

    // Set prominent image
    if (allImages.length > 0) {
      allImages.forEach((img, index) => {
        img.isProminent = index === prominentImageIndex;
      });
    }

    // Update product
    product.name = name;
    product.price = numericPrice;
    product.stock = numericStock;
    product.description = description;
    product.images = allImages;

    await product.save();
    return new Response(JSON.stringify(product), { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return new Response('Error updating product: ' + error.message, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = authMiddleware(req);
    if (user.role !== 'admin') {
      return new Response('Admins only', { status: 403 });
    }
    await mongoose.connect(process.env.MONGO_URI);
    const product = await Product.findByIdAndDelete(params.id);
    if (!product) {
      return new Response('Product not found', { status: 404 });
    }
    return new Response('Product deleted successfully', { status: 200 });
  } catch (error) {
    return new Response('Error deleting product: ' + error.message, { status: 400 });
  }
}