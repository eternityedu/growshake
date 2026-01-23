import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import UserSidebar from '@/components/dashboard/UserSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';
import { MapPin, Leaf, DollarSign, ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';

interface LandListing {
  id: string;
  title: string;
  location: string;
  available_size_sqft: number;
  price_per_sqft: number;
  supported_vegetables: string[];
  farmer_id: string;
  farmer_profiles?: {
    farm_name: string;
    user_id: string;
  };
}

export default function PlaceOrder() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice, loading: currencyLoading } = useCurrency();
  
  const [listing, setListing] = useState<LandListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedVegetable, setSelectedVegetable] = useState('');
  const [landSize, setLandSize] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [plantingInstructions, setPlantingInstructions] = useState('');

  useEffect(() => {
    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('land_listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (error) throw error;

      // Fetch farmer profile separately
      if (data) {
        const { data: farmerData } = await supabase
          .from('farmer_profiles')
          .select('farm_name, user_id')
          .eq('id', data.farmer_id)
          .single();

        setListing({
          ...data,
          farmer_profiles: farmerData || undefined
        });
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const landSizeNum = parseFloat(landSize) || 0;
  const totalPrice = landSizeNum * (listing?.price_per_sqft || 0);
  const advanceAmount = totalPrice * 0.3; // 30% advance
  const finalAmount = totalPrice * 0.7; // 70% final

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !listing) return;
    
    if (!selectedVegetable) {
      toast.error('Please select a vegetable');
      return;
    }
    
    if (landSizeNum <= 0 || landSizeNum > listing.available_size_sqft) {
      toast.error(`Please enter a valid land size (1-${listing.available_size_sqft} sq ft)`);
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }

    setSubmitting(true);

    try {
      // Get user profile for notification
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();

      // Get farmer profile for notification
      const { data: farmerProfile } = await supabase
        .from('farmer_profiles')
        .select('user_id, farm_name')
        .eq('id', listing.farmer_id)
        .single();

      let farmerEmail = '';
      if (farmerProfile) {
        const { data: farmerUser } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', farmerProfile.user_id)
          .single();
        farmerEmail = farmerUser?.email || '';
      }

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('vegetable_orders')
        .insert({
          user_id: user.id,
          farmer_id: listing.farmer_id,
          land_listing_id: listing.id,
          vegetable_name: selectedVegetable,
          land_size_sqft: landSizeNum,
          total_price: totalPrice,
          advance_amount: advanceAmount,
          final_amount: finalAmount,
          delivery_address: deliveryAddress,
          delivery_notes: deliveryNotes,
          planting_instructions: plantingInstructions,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create advance payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          user_id: user.id,
          amount: advanceAmount,
          payment_type: 'advance',
          status: 'pending',
        });

      if (paymentError) throw paymentError;

      // Send notification to farmer
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'order_placed',
            orderId: order.id,
            recipientEmail: farmerEmail,
            recipientName: farmerProfile?.farm_name || 'Farmer',
            vegetableName: selectedVegetable,
            farmerName: farmerProfile?.farm_name,
            customerName: userProfile?.full_name || 'Customer',
          },
        });
      } catch (err) {
        console.log('Notification logged (email service not configured)');
      }

      toast.success('Order placed successfully!');
      navigate('/dashboard/user/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || currencyLoading) {
    return (
      <DashboardLayout sidebar={<UserSidebar />}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!listing) {
    return (
      <DashboardLayout sidebar={<UserSidebar />}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Listing not found</p>
          <Button onClick={() => navigate('/dashboard/user/farmers')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Farmers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/user/farmers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Place Order</h1>
            <p className="text-muted-foreground">Order vegetables from {listing.farmer_profiles?.farm_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{listing.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {listing.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="vegetable">Select Vegetable *</Label>
                    <Select value={selectedVegetable} onValueChange={setSelectedVegetable}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a vegetable to grow" />
                      </SelectTrigger>
                      <SelectContent>
                        {listing.supported_vegetables.map((veg) => (
                          <SelectItem key={veg} value={veg}>
                            <span className="flex items-center gap-2">
                              <Leaf className="h-4 w-4 text-primary" />
                              {veg}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="landSize">Land Size (sq ft) *</Label>
                    <Input
                      id="landSize"
                      type="number"
                      min="1"
                      max={listing.available_size_sqft}
                      value={landSize}
                      onChange={(e) => setLandSize(e.target.value)}
                      placeholder={`Max available: ${listing.available_size_sqft} sq ft`}
                    />
                    <p className="text-sm text-muted-foreground">
                      Available: {listing.available_size_sqft} sq ft at {formatPrice(listing.price_per_sqft)}/sq ft
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                    <Textarea
                      id="deliveryAddress"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter your full delivery address"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryNotes">Delivery Notes (Optional)</Label>
                    <Textarea
                      id="deliveryNotes"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Any special delivery instructions"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plantingInstructions">Planting Instructions (Optional)</Label>
                    <Textarea
                      id="plantingInstructions"
                      value={plantingInstructions}
                      onChange={(e) => setPlantingInstructions(e.target.value)}
                      placeholder="Any specific planting preferences or instructions"
                      rows={2}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {submitting ? 'Placing Order...' : 'Place Order'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vegetable</span>
                  <span className="font-medium">{selectedVegetable || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Land Size</span>
                  <span className="font-medium">{landSizeNum || 0} sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price per sq ft</span>
                  <span className="font-medium">{formatPrice(listing.price_per_sqft)}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Price</span>
                  <span className="font-bold text-lg">{formatPrice(totalPrice)}</span>
                </div>
                <hr />
                <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Advance Payment (30%)</span>
                    <span className="font-medium text-primary">{formatPrice(advanceAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Final Payment (70%)</span>
                    <span className="font-medium">{formatPrice(finalAmount)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  * Advance payment is required before planting begins. Final payment is due before harvest delivery.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
