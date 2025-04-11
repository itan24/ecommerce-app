import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  stock: Number,
  description: String,
  images: [{
    url: String,
    isProminent: { type: Boolean, default: false }
  }]
});

export default mongoose.models.Product || mongoose.model('Product', productSchema);