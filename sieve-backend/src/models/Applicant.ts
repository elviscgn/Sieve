import mongoose, { Schema, Document } from "mongoose";

// Defines the TypeScript interface and Mongoose schema for an Applicant, including their structured profile and AI evaluation results.
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

const ApplicantSchema: Schema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    source: { type: String, required: true },
    // Schema.Types.Mixed is used to allow storing a deeply nested, dynamic JSON object for the parsed resume profile
    profile: { type: Schema.Types.Mixed, required: true },
    evaluation: {
      score: { type: Number },
      justification: { type: String },
      gaps: [{ type: String }],
      strengths: [{ type: String }],
      evaluatedAt: { type: Date },
      recruiterRank: { type: Number },
    },
  },
  // Automatically manages createdAt and updatedAt timestamps for the document
  { timestamps: true },
);

export default mongoose.model<IApplicant>("Applicant", ApplicantSchema);