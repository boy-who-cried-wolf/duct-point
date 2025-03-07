import { supabase } from "./client";
import { OrganizationsData } from "./types/organizations_data.type";

// Fetch organizations data
export const getOrganizationsData = async () => {
    const { data, error } = await supabase
        .from('organizations_data')
        .select('*');

    if (error) {
        console.error('Error fetching organizations_data:', error);
        return [];
    }

    return data as OrganizationsData[];
};

// Upload CSV and handle duplicates
export const uploadCSV = async (file: File) => {
    const text = await file.text();
    const rows = text.split('\n').slice(1); // Skip the header row

    const results = {
        success: 0,
        skipped: 0,
        errors: 0,
    };

    const newRows = []; // Collect non-duplicate rows for batch insert

    for (const row of rows) {
        const [company_id, company_name, ytd_spend] = row.split(',');

        // Check for duplicates
        const { data: existing, error: duplicateError } = await supabase
            .from('organizations_data')
            .select('id')
            .eq('company_id', company_id.trim())
            .maybeSingle(); // Use maybeSingle instead of single

        if (duplicateError) {
            console.error('Error checking for duplicates:', duplicateError);
            results.errors++;
            continue;
        }

        if (existing) {
            console.log(`Skipping duplicate: ${company_id}`);
            results.skipped++;
            continue;
        }

        // Add non-duplicate row to the batch
        newRows.push({
            company_id: company_id.trim(),
            company_name: company_name.trim(),
            ytd_spend: parseFloat(ytd_spend.trim()),
        });
    }

    // Batch insert non-duplicate rows
    if (newRows.length > 0) {
        const { error: insertError } = await supabase
            .from('organizations_data')
            .insert(newRows);

        if (insertError) {
            console.error('Error inserting records:', insertError);
            results.errors += newRows.length; // Count all rows as errors
        } else {
            results.success += newRows.length; // Count all rows as successes
        }
    }

    return results;
};