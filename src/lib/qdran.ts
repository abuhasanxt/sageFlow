import { QdrantClient } from "@qdrant/js-client-rest";
import { envVars } from "../config/env";

export const qrant =new QdrantClient({
    url:envVars.QDRANT_URL,
    apiKey:envVars.QDRANT_API_KEY
})

export const testQdranConnection=async()=>{
    const result=await qrant.getCollections()
    console.log("Qdran connected : ", result);
}