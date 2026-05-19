import { Types } from "mongoose";

export type TSaveType = "blog" | "food";

export interface ISave {
  user: Types.ObjectId;
  type: TSaveType;
  item: Types.ObjectId;        // generic reference to a blog or food document
  name: string;                // cached human-readable label (blog title / food name)

  // Legacy field — kept optional for backwards-compat with old documents
  // that were saved as blogs-only. New writes don't populate it.
  blog?: Types.ObjectId;

  timestamp?: Date;
}
