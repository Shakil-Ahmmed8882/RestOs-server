export interface IBlog extends Document {
  title: string;
  category: string;
  description: string;
  instructions: string[];
  tags?: string[];
  image?: string;
  author: {
    userId: string;
    name: string;
  };
  status: "pending" | "approved" | "test-approved";
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  commentsCount: number;
}
