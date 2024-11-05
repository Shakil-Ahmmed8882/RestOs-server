import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { replyServices } from "./reply.service";


const handleAddReplyToComment = catchAsync(async (req, res) => {
  const { commentId } = req.params;
  // The reply text
  const { comment } = req.body; 
  const userId = req.user.userId; 

  
  console.log("_____________________________ repluy", req.body)

  const result = await replyServices.addReplyToComment(
    commentId,
    userId,
    comment
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Reply added to comment successfully",
    data: result,
  });
});

export const replyControllers = {
    handleAddReplyToComment
};
