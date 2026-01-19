import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Package, Loader2, Leaf, DollarSign, Clock } from "lucide-react";

interface Order {
  id: string;
  vegetable_name: string;
  land_size_sqft: number;
  status: string;
  total_price: number;
  advance_amount: number;
  final_amount: number;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string | null; email: string | null };
  farmer_profiles?: { farm_name: string };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  planted: "bg-green-100 text-green-800",
  growing: "bg-emerald-100 text-emerald-800",
  ready_to_harvest: "bg-lime-100 text-lime-800",
  harvested: "bg-teal-100 text-teal-800",
  delivered: "bg-primary text-primary-foreground",
  cancelled: "bg-gray-100 text-gray-800",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data: ordersData, error } = await supabase
        .from("vegetable_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        setLoading(false);
        return;
      }

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch profiles and farmer profiles separately
      const userIds = [...new Set(ordersData.map(o => o.user_id))];
      const farmerIds = [...new Set(ordersData.map(o => o.farmer_id))];

      const [profilesRes, farmersRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds),
        supabase.from("farmer_profiles").select("id, farm_name").in("id", farmerIds),
      ]);

      const profilesMap = new Map(
        profilesRes.data?.map(p => [p.user_id, { full_name: p.full_name, email: p.email }]) || []
      );
      const farmersMap = new Map(
        farmersRes.data?.map(f => [f.id, { farm_name: f.farm_name }]) || []
      );

      const ordersWithData = ordersData.map(order => ({
        ...order,
        profiles: profilesMap.get(order.user_id) || { full_name: null, email: null },
        farmer_profiles: farmersMap.get(order.farmer_id) || { farm_name: "" },
      }));

      setOrders(ordersWithData);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.vegetable_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.farmer_profiles?.farm_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    active: orders.filter((o) => ["accepted", "planted", "growing"].includes(o.status)).length,
    completed: orders.filter((o) => o.status === "delivered").length,
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">All Orders</h1>
          <p className="text-muted-foreground">Monitor all platform orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sun/10">
                  <Clock className="h-5 w-5 text-sun" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-earth/10">
                  <Leaf className="h-5 w-5 text-earth" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="planted">Planted</SelectItem>
              <SelectItem value="growing">Growing</SelectItem>
              <SelectItem value="ready_to_harvest">Ready to Harvest</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vegetable</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Farm</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.vegetable_name}
                            <p className="text-xs text-muted-foreground">
                              {order.land_size_sqft} sq ft
                            </p>
                          </TableCell>
                          <TableCell>
                            {order.profiles?.full_name || "—"}
                            <p className="text-xs text-muted-foreground">
                              {order.profiles?.email}
                            </p>
                          </TableCell>
                          <TableCell>{order.farmer_profiles?.farm_name || "—"}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[order.status] || "bg-gray-100"}>
                              {order.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${order.total_price}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrders;
