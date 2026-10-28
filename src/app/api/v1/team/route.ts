import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/connection';
import { User } from '@/models/User';
import { AuditEvent } from '@/models/AuditEvent';
import { getSession } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const createMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid work email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum([
    'SUPER_ADMIN',
    'ADMIN',
    'ORDER_MANAGER',
    'INVENTORY_MANAGER',
    'SALES_MANAGER',
    'WAREHOUSE_STAFF',
    'MANAGEMENT',
  ]),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const members = await User.find({})
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    return successResponse(members);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    }

    if (session.role !== 'SUPER_ADMIN') {
      return errorResponse('FORBIDDEN', 'Only Super Admin can add new team members.', 403);
    }

    const body = await req.json();
    const data = createMemberSchema.parse(body);

    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return errorResponse('CONFLICT', 'A team member with this email already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const newMember = await User.create({
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: data.role,
      isActive: data.isActive,
    });

    await AuditEvent.create({
      action: 'USER_CREATED',
      entity: 'USER',
      entityId: newMember._id.toString(),
      actorId: session.id,
      actorName: session.name,
      details: {
        email: newMember.email,
        role: newMember.role,
      },
    });

    const responseData = {
      _id: newMember._id,
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      isActive: newMember.isActive,
      createdAt: newMember.createdAt,
    };

    return successResponse(responseData, {}, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
