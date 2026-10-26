import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/connection';
import { User } from '@/models/User';
import { setSession } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { email: normalizedEmail.replace('@miestilo.com', '@misteriolifestyle.com') },
        { email: normalizedEmail.replace('@misteriolifestyle.com', '@miestilo.com') },
      ],
    });

    if (!user || !user.isActive) {
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    await setSession({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return successResponse({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
