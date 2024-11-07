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
  likesCount: number;
  commentsCount: number;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  updatedAt: Date;
}
