import dotenv from 'dotenv';
import connectDB from './db/index.js';
import app from './app.js';


dotenv.config({
    path : './env'
});

connectDB()
.then(() =>  {

    app.on("Error", (error) =>{
        console.log("Error in connecting db and server", error);
        throw error;
    })
    

    app.listen(process.env.PORT || 8080, () => {
        console.log(`Server is running at PORT : ${process.env.PORT}`)
    });

})
.catch((error) => {

    console.log('Mongo DB connection failed !!!!',error);

});