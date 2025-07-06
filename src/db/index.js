import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';


const connetDB = async () => {
        try{
            const connectionInstance = await mongoose.connect(`${process.env.MONOGDB_URI}/${DB_NAME}`)
            console.log('MongoDB connected !! HOST:', connectionInstance.connection.host);
        }catch(error){
            console.log("Error Connecting with Database",error);
            process.exit(1);
        }
}


export default connetDB;

