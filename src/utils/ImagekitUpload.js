
import imagekit from "../config/imagekit.js";
import fs from "fs";

const uploadImage = async (localPath) => {
    try {
        if (!localPath) return null;

        const response = await imagekit.upload({
            file: fs.createReadStream(localPath),
            fileName: `image-${Date.now()}`,
            folder: "/uploads"
        });

        console.log("Image uploaded:", response.url);

        fs.unlinkSync(localPath);

        return response;

    } catch (error) {
        console.log("ImageKit Error:", error);

        if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
        }

        return null;
    }
};

export default uploadImage;
