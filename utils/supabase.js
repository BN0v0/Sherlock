import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class SupabaseClient {
    constructor() {
        this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);
    }

    // Method to fetch data from the database
    async fetchData(tableName) {
        const { data, error } = await this.supabase
            .from(tableName)
            .select('*'); // Replace '*' with specific columns if needed

        if (error) {
            console.error(`Error fetching data from ${tableName}:`, error);
            return null;
        }

        return data;
    }

    // Method to insert data into the database
    async insertData(tableName, rowData) {
        const { data, error } = await this.supabase
            .from(tableName)
            .insert([rowData]); // rowData should be an object with column names and values

        if (error) {
            console.error(`Error inserting data into ${tableName}:`, error);
            return null;
        }

        console.log(`Inserted data into ${tableName}:`, data);
        return data;
    }
}

export default SupabaseClient;
