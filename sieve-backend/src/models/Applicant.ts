import mongoose, { Schema, Document } from 'mongoose';

// 1. TypeScript Interface
export interface IApplicant extends Document {
  jobId: mongoose.Types.ObjectId;
  source: 'umurava' | 'external';
  profile: Record<string, any>;
  rawText?: string;
}

// 2. Mongoose Schema
const ApplicantSchema: Schema = new Schema(
  {
    jobId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Job', 
      required: true 
    },
    source: { 
      type: String, 
      enum: ['umurava', 'external'], 
      required: true 
    },
    profile: { 
      type: Schema.Types.Mixed, 
      default: {} 
    },
    rawText: { 
      type: String 
    },
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IApplicant>('Applicant', ApplicantSchema);