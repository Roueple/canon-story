// src/services/baseService.ts
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';
import { Prisma } from '@prisma/client';

// This is the definitive, type-safe way to get model names
type ModelName = Uncapitalize<Prisma.ModelName>;

// --- CORRECTED & SIMPLIFIED GENERIC FUNCTIONS ---

/**
 * Finds a single record by its ID, with optional additional 'where' clauses.
 * Uses 'findFirst' for flexibility.
 */
export async function findByIdGeneric<T>(
  modelName: ModelName,
  id: string,
  options: {
    include?: any;
    where?: any; // Allows for additional filters like { isDeleted: false }
  } = {}
): Promise<T | null> {
  const model = (prisma as any)[modelName];
  // CORRECTED: Use findFirst for flexible where clauses
  const result = await model.findFirst({
    where: {
      id,
      ...options.where,
    },
    include: options.include,
  });
  return serializeForJSON(result) as T | null;
}

// This function was already correct and doesn't need changes.
export async function findAllGeneric<T>(
    modelName: ModelName,
    options: {
      where?: any;
      include?: any;
      orderBy?: any;
      skip?: number;
      take?: number;
    } = {}
  ): Promise<{ data: T[]; total: number }> {
    const model = (prisma as any)[modelName];
    const [data, total] = await prisma.$transaction([
      model.findMany(options),
      model.count({ where: options.where }),
    ]);
    return { data: serializeForJSON(data) as T[], total };
}


export async function deleteGeneric(modelName: ModelName, id: string): Promise<void> {
  const model = (prisma as any)[modelName];
  await model.delete({ where: { id } });
}

// --- AUDITED SOFT DELETE (Unchanged) ---
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