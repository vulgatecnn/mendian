import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { BadRequestError } from '@/utils/errors.js';

declare module 'fastify' {
  interface FastifyInstance {
    validateSchema: <T>(schema: z.ZodSchema<T>, data: unknown) => T;
  }
}

const validationPlugin = async (fastify: FastifyInstance): Promise<void> => {
  // Schema validation decorator
  fastify.decorate('validateSchema', <T>(schema: z.ZodSchema<T>, data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        throw new BadRequestError(`Validation failed: ${messages.join(', ')}`);
      }
      throw error;
    }
  });

  // Common validation schemas
  const commonSchemas = {
    // Pagination
    pagination: z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
    }),

    // ID parameter
    idParam: z.object({
      id: z.string().cuid('Invalid ID format'),
    }),

    // Date range
    dateRange: z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    }),

    // Status filter
    statusFilter: z.object({
      status: z.string().optional(),
    }),

    // Search
    search: z.object({
      q: z.string().min(1).optional(),
    }),
  };

  // Business domain validation schemas
  const businessSchemas = {
    // Store Plan
    storePlan: z.object({
      year: z.number().min(2020).max(2030),
      quarter: z.number().min(1).max(4).optional(),
      regionId: z.string().cuid(),
      entityId: z.string().cuid(),
      storeType: z.string().min(1),
      plannedCount: z.number().min(1),
      budget: z.number().positive().optional(),
    }),

    storePlanUpdate: z.object({
      quarter: z.number().min(1).max(4).optional(),
      storeType: z.string().min(1).optional(),
      plannedCount: z.number().min(1).optional(),
      budget: z.number().positive().optional(),
      status: z.enum(['DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED']).optional(),
    }),

    // Candidate Location
    candidateLocation: z.object({
      storePlanId: z.string().cuid().optional(),
      regionId: z.string().cuid(),
      name: z.string().min(1),
      address: z.string().min(1),
      area: z.number().positive().optional(),
      rentPrice: z.number().positive().optional(),
      rentUnit: z.string().optional(),
      landlordName: z.string().optional(),
      landlordPhone: z.string().optional(),
      coordinates: z.string().optional(),
      photos: z.array(z.string().url()).optional(),
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
      notes: z.string().optional(),
    }),

    candidateLocationUpdate: z.object({
      name: z.string().min(1).optional(),
      address: z.string().min(1).optional(),
      area: z.number().positive().optional(),
      rentPrice: z.number().positive().optional(),
      rentUnit: z.string().optional(),
      landlordName: z.string().optional(),
      landlordPhone: z.string().optional(),
      coordinates: z.string().optional(),
      photos: z.array(z.string().url()).optional(),
      status: z.enum(['PENDING', 'FOLLOWING', 'NEGOTIATING', 'CONTRACTED', 'REJECTED']).optional(),
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
      notes: z.string().optional(),
    }),

    // Follow Up Record
    followUpRecord: z.object({
      candidateLocationId: z.string().cuid(),
      assigneeId: z.string().cuid(),
      type: z.string().min(1),
      content: z.string().min(1),
      nextFollowUpDate: z.string().datetime().optional(),
      attachments: z.array(z.string().url()).optional(),
    }),

    // Store File
    storeFile: z.object({
      candidateLocationId: z.string().cuid().optional(),
      entityId: z.string().cuid(),
      storeCode: z.string().min(1),
      storeName: z.string().min(1),
      storeType: z.string().min(1),
      address: z.string().min(1),
      area: z.number().positive().optional(),
      openDate: z.string().datetime().optional(),
      businessLicense: z.string().optional(),
      licenseExpiry: z.string().datetime().optional(),
      franchiseeInfo: z.record(z.any()).optional(),
      coordinates: z.string().optional(),
      photos: z.array(z.string().url()).optional(),
      documents: z.array(z.string().url()).optional(),
    }),

    // Approval Flow
    approvalFlow: z.object({
      templateId: z.string().cuid(),
      title: z.string().min(1),
      businessType: z.string().min(1),
      businessId: z.string().cuid(),
      data: z.record(z.any()).optional(),
    }),

    approvalRecord: z.object({
      action: z.enum(['APPROVE', 'REJECT', 'FORWARD', 'RETURN']),
      comments: z.string().optional(),
      attachments: z.array(z.string().url()).optional(),
    }),
  };

  // Add schemas to fastify instance
  fastify.decorate('schemas', {
    common: commonSchemas,
    business: businessSchemas,
  });
};

export default fp(validationPlugin, {
  name: 'validation',
});