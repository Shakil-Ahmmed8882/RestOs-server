export interface IBlog extends Document {
  title: string;
  category: string;
  description: string;
  instructions: string[];
  tags?: string[];
  image?: string;
  author: {
    user: string;
    name: string;
  };
  status: "pending" | "approved" | "test-approved";
  isDeleted: boolean,
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  commentsCount: number;
}
