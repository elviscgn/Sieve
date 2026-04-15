import mongoose, { Schema, Document } from 'mongoose';

// 1. TypeScript Interface (for our code)
export interface IDimension {
  name: string;
  weight: number;
  keywords: string[];
}

export interface IJob extends Document {
  title: string;
  rawJD: string;
  rubric?: {
    dimensions: IDimension[];
    dealbreakers: string[]; 
    niceToHave: string[];
    confirmedBy?: string;
    confirmedAt?: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Mongoose Schema (for the database)
const JobSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    rawJD: { type: String, required: true },
    rubric: {
      dimensions: [
        {
          name: { type: String },
          weight: { type: Number },
          keywords: [{ type: String }],
        },
      ],
      dealbreakers: [{ type: String }],
      niceToHave: [{ type: String }],
      confirmedBy: { type: String },
      confirmedAt: { type: Date },
    },
  },
  { 
    timestamps: true // Automatically manages createdAt and updatedAt 
  } 
);

export default mongoose.model<IJob>('Job', JobSchema);