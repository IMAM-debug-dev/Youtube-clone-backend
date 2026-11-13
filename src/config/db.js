import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config();

const connectDB = async ()=> {
   try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongDB connect sucessfully")
    
   } catch (error) {
    console.log("Databage error" , error.message);
    process.exit(1)
   }
}

export default connectDB