import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/connection';
import { User } from '@/models/User';
import { AuditEvent } from '@/models/AuditEvent';
import { getSession } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const updateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum([
    'SUPER_ADMIN',
    'ADMIN',
    'ORDER_MANAGER',
    'INVENTORY_MANAGER',
    'SALES_MANAGER',
    'WAREHOUSE_STAFF',
    'MANAGEMENT',
  ]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    }

    if (session.role !== 'SUPER_ADMIN') {
      return errorResponse('FORBIDDEN', 'Only Super Admin can update team members.', 403);
    }

    const { id } = await params;
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return errorResponse('NOT_FOUND', 'Team member not found.', 404);
    }

    const body = await req.json();
    const data = updateMemberSchema.parse(body);

    // Prevent deactivating own account
    if (session.id === id && data.isActive === false) {
      return errorResponse('BAD_REQUEST', 'You cannot deactivate your own Super Admin account.', 400);
    }

    // Prevent demoting own role
    if (session.id === id && data.role && data.role !== 'SUPER_ADMIN') {
      return errorResponse('BAD_REQUEST', 'You cannot remove your own Super Admin privileges.', 400);
    }

    if (data.name) targetUser.name = data.name.trim();
    if (data.role) targetUser.role = data.role;
    if (typeof data.isActive === 'boolean') targetUser.isActive = data.isActive;
    if (data.password) {
      targetUser.passwordHash = await bcrypt.hash(data.password, 10);
    }

    await targetUser.save();

    await AuditEvent.create({
      action: 'USER_UPDATED',
      entity: 'USER',
      entityId: id,
      actorId: session.id,
      actorName: session.name,
      details: {
        role: targetUser.role,
        isActive: targetUser.isActive,
        passwordReset: !!data.password,
      },
    });

    const response = {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      isActive: targetUser.isActive,
      lastLoginAt: targetUser.lastLoginAt,
      updatedAt: targetUser.updatedAt,
    };

    return successResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    }

    if (session.role !== 'SUPER_ADMIN') {
      return errorResponse('FORBIDDEN', 'Only Super Admin can remove team members.', 403);
    }

    const { id } = await params;
    if (session.id === id) {
      return errorResponse('BAD_REQUEST', 'You cannot delete your own Super Admin account.', 400);
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return errorResponse('NOT_FOUND', 'Team member not found.', 404);
    }

    await AuditEvent.create({
      action: 'USER_DELETED',
      entity: 'USER',
      entityId: id,
      actorId: session.id,
      actorName: session.name,
      details: { email: user.email, name: user.name },
    });

    return successResponse({ message: 'Team member deleted successfully.' });
  } catch (error) {
    return handleApiError(error);
  }
}
