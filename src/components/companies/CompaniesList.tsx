import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrganizationsData, uploadCSV } from '@/integrations/supabase/organizations_data';
import { OrganizationsData } from '@/integrations/supabase/types/organizations_data.type';
import { FC, PropsWithChildren, useEffect, useState } from 'react';
import LoadingOverLay from '../loading/LoadingOverlay';
import CompanyUploadDialog from './CompanyUploadDialog';

const CompaniesList: FC<PropsWithChildren<{ search?: string }>> = ({ search = "" }) => {
    const [companies, setCompanies] = useState<Array<OrganizationsData>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

    const filteredCompanies = companies.filter(company =>
        company.company_name.toLowerCase().includes(search.toLowerCase())
    );

    const loadData = async () => {
        setIsLoading(true);
        const ret = await getOrganizationsData();
        setIsLoading(false);
        setCompanies(ret);
    };

    const handleUpload = async (file: File) => {
        const result = await uploadCSV(file);
        await loadData(); // Reload data after upload
        return result;
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <Card>
            <CardHeader
                action={
                    <Button variant="default" size="sm" onClick={() => setIsUploadDialogOpen(true)}>
                        Upload CSV
                    </Button>
                }
            >
                <CardTitle>All Companies</CardTitle>
                <CardDescription>
                    Manage organizations using the platform.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <LoadingOverLay open={isLoading}>
                    <div className="space-y-4">
                        {filteredCompanies.length === 0 ? (
                            <p className="text-center py-4 text-muted-foreground">No companies found.</p>
                        ) : (
                            filteredCompanies.map(company => (
                                <div key={company.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarFallback>{company.company_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{company.company_name}</p>
                                            <p className="text-sm text-muted-foreground">{0} members</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="font-medium">{company.ytd_spend} total points</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </LoadingOverLay>
            </CardContent>

            <CompanyUploadDialog
                isOpen={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
                onUpload={handleUpload}
            />
        </Card>
    );
};

export default CompaniesList;