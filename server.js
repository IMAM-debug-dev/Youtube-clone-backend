import app from "./src/app.js"
import dotenv from "dotenv"
import connectDB from "./src/config/db.js";

dotenv.config({
    path: './.env'
})


const PORT = process.env.PORT || 3000;


const StartServer = async ()=> {
    try {
        await connectDB()

        app.listen(PORT , ()=>{
    console.log(`server is runing on port number ${PORT}`)
        });



    } catch (error) {
        console.log("server error" , error.message);
        process.exit(1)
    }
}
// Function call
StartServer();