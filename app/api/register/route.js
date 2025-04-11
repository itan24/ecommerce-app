import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../../../models/User';

export async function POST(req) {
  try {
    const body = await req.json();
    await mongoose.connect(process.env.MONGO_URI);
    const { email, password } = body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role: 'admin' });
    await user.save();
    return new Response('User registered', { status: 201 });
  } catch (error) {
    return new Response('Error registering user: ' + error.message, { status: 400 });
  }
}