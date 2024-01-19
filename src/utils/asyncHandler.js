

const asyncHandler = (requestHandler)=>{
   (req,res,next) =>{
    Promise.resolve(requestHandler(req,res,next)).catch((error)=>{
        next(error);
    })
   }
}
export {asyncHandler};

// other option

// const asyncHandler = (fn) =>async(req,res,next)=>{
//     try {
//         await fn(req,res,next)
        
//     } catch (error) {
//     res.status(error.code|| 401).jsom({
//         success : false,
//         message : error.message
//     })
        
//     }


// }