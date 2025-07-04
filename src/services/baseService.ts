// src/services/baseService.ts

import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';
import { Prisma } from '@prisma/client';

/**
 * A robust, dynamically-generated type representing all valid Prisma model names in lowercase,
 * matching the properties on the `prisma` client (e.g., 'user', 'novel').
 * This is the correct and most direct way to derive this type.
 */
type ModelName = Uncapitalize<Prisma.ModelName>;

// --- SIMPLE GENERIC FUNCTIONS (NON-AUDITED) ---
export async function findByIdGeneric<T>(
  modelName: ModelName,
  id: string,
  include?: any
): Promise<T | null> {
  const model = (prisma as any)[modelName];
  const result = await model.findUnique({ where: { id }, include });
  return serializeForJSON(result) as T | null;
}

export async function deleteGeneric(modelName: ModelName, id: string): Promise<void> {
  const model = (prisma as any)[modelName];
  await model.delete({ where: { id } });
}

// --- ADVANCED AUDITED FUNCTIONS ---

/**
 * Performs a soft delete and simultaneously creates corresponding log entries
 * in a single database transaction. This is the recommended soft-delete function.
 */
export async function auditedSoftDelete<T extends { id: string }>(
  modelName: ModelName,
  id: string,
  deletedBy: string | null,
  reason?: string
): Promise<T> {
  const model = (prisma as any)[modelName];

  const [updatedRecord] = await prisma.$transaction(async (tx) => {
    const transactionModel = (tx as any)[modelName];
    const recordToLog = await transactionModel.findUnique({ where: { id } });
    if (!recordToLog) {
      throw new Error(`Record with ID ${id} not found in model ${modelName}.`);
    }

    const dataToUpdate: any = {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: deletedBy,
    };
    
    if (recordToLog.hasOwnProperty('isPublished')) {
      dataToUpdate.isPublished = false;
    }

    const result = await transactionModel.update({
      where: { id },
      data: dataToUpdate,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); 

    await tx.deletionLog.create({
      data: {
        userId: deletedBy,
        modelName: modelName,
        recordId: id,
        recordData: serializeForJSON(recordToLog),
        reason: reason,
        expiresAt: expiresAt,
      },
    });

    await tx.auditLog.create({
        data: {
            userId: deletedBy,
            action: 'soft-delete',
            modelName: modelName,
            recordId: id,
            oldData: serializeForJSON(recordToLog),
            newData: serializeForJSON(result),
        }
    })

    return [result];
  });

  return serializeForJSON(updatedRecord) as T;
}