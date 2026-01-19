import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, User, MapPin, Loader2 } from "lucide-react";

interface FarmerProfile {
  id: string;
  user_id: string;
  farm_name: string;
  farm_description: string | null;
  location: string;
  experience_years: number | null;
  specializations: string[] | null;
  verification_status: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

const AdminVerifyFarmers = () => {
  const { toast } = useToast();
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchPendingFarmers = async () => {
    setLoading(true);
    const { data: farmerData, error } = await supabase
      .from("farmer_profiles")
      .select("*")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching farmers:", error);
      toast({
        title: "Error",
        description: "Failed to load pending farmers.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch profiles separately
    if (farmerData && farmerData.length > 0) {
      const userIds = farmerData.map(f => f.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, { full_name: p.full_name, email: p.email }]) || []
      );

      const farmersWithProfiles = farmerData.map(farmer => ({
        ...farmer,
        profiles: profilesMap.get(farmer.user_id) || { full_name: null, email: null },
      }));

      setFarmers(farmersWithProfiles);
    } else {
      setFarmers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingFarmers();
  }, []);

  const handleVerification = async () => {
    if (!selectedFarmer || !actionType) return;

    setProcessing(true);
    const { error } = await supabase
      .from("farmer_profiles")
      .update({
        verification_status: actionType === "approve" ? "approved" : "rejected",
        verification_notes: verificationNotes,
        verified_at: new Date().toISOString(),
      })
      .eq("id", selectedFarmer.id);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${actionType} farmer.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Farmer has been ${actionType === "approve" ? "approved" : "rejected"}.`,
      });
      fetchPendingFarmers();
    }

    setProcessing(false);
    setSelectedFarmer(null);
    setActionType(null);
    setVerificationNotes("");
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Farmer Verification</h1>
          <p className="text-muted-foreground">Review and verify pending farmer applications</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : farmers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-primary/30 mb-4" />
              <p className="text-muted-foreground">No pending farmer applications</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {farmers.map((farmer) => (
              <Card key={farmer.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{farmer.farm_name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <User className="h-3 w-3" />
                        {farmer.profiles?.full_name || "Unknown"} • {farmer.profiles?.email}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-sun/20 text-sun">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {farmer.location}
                    </div>
                    {farmer.farm_description && (
                      <p className="text-sm">{farmer.farm_description}</p>
                    )}
                    {farmer.experience_years && (
                      <p className="text-sm text-muted-foreground">
                        {farmer.experience_years} years of experience
                      </p>
                    )}
                    {farmer.specializations && farmer.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {farmer.specializations.map((spec, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedFarmer(farmer);
                          setActionType("approve");
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedFarmer(farmer);
                          setActionType("reject");
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Verification Dialog */}
      <Dialog open={!!selectedFarmer && !!actionType} onOpenChange={() => {
        setSelectedFarmer(null);
        setActionType(null);
        setVerificationNotes("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Farmer
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This farmer will be visible to users and can start accepting orders."
                : "This farmer's application will be rejected."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Notes (optional)
            </label>
            <Textarea
              placeholder={actionType === "approve" 
                ? "Welcome message or any notes..."
                : "Reason for rejection..."}
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFarmer(null);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={handleVerification}
              disabled={processing}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === "approve" ? "Approve Farmer" : "Reject Farmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminVerifyFarmers;
