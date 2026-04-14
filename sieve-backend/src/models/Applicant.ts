import mongoose, { Schema, Document } from 'mongoose';

export interface IApplicant extends Document {
  jobId: mongoose.Types.ObjectId;
  source: string;
  profile: any;
  evaluation?: {
    score: number;
    justification: string;
    gaps?: string[];       
    strengths?: string[]; 
    evaluatedAt: Date;
    recruiterRank?: number; 
  };
}

const ApplicantSchema: Schema = new Schema({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  source: { type: String, required: true },
  profile: { type: Schema.Types.Mixed, required: true },
  evaluation: {
    score: { type: Number },
    justification: { type: String },
    gaps: [{ type: String }],      
    strengths: [{ type: String }],
    evaluatedAt: { type: Date },
    recruiterRank: { type: Number }
  }
}, { timestamps: true });

export default mongoose.model<IApplicant>('Applicant', ApplicantSchema);