const asyncHandler = (requestHandler) =>{
    (req, res, next) => {
        Promise.resolve( requestHandler(req, res, next)).catch((err) => next(err))
    }
}


export {asyncHandler}



//higher order function

// const asyncHandler = () => {}
// const asyncHandler = (func) => {() => {}}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
// 
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message : error.message
//         })
//     }
// }