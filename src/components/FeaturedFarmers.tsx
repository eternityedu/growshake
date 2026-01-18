import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Leaf } from "lucide-react";
import { Link } from "react-router-dom";

const farmers = [
  {
    id: 1,
    name: "Green Valley Farm",
    location: "California",
    rating: 4.9,
    reviews: 128,
    specialties: ["Tomatoes", "Peppers", "Herbs"],
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&h=300&fit=crop",
    verified: true,
  },
  {
    id: 2,
    name: "Sunrise Organics",
    location: "Oregon",
    rating: 4.8,
    reviews: 95,
    specialties: ["Leafy Greens", "Root Vegetables"],
    image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=300&fit=crop",
    verified: true,
  },
  {
    id: 3,
    name: "Heritage Homestead",
    location: "Texas",
    rating: 4.7,
    reviews: 73,
    specialties: ["Squash", "Beans", "Corn"],
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop",
    verified: true,
  },
];

const FeaturedFarmers = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Verified Farmers
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Featured Farmers
            </h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/farmers">View All Farmers</Link>
          </Button>
        </div>

        {/* Farmers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {farmers.map((farmer, index) => (
            <Card
              key={farmer.id}
              className="overflow-hidden group hover:shadow-glow transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={farmer.image}
                  alt={farmer.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {farmer.verified && (
                  <Badge className="absolute top-3 left-3 bg-primary">
                    <Leaf className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center text-sun">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="ml-1 text-sm font-semibold text-foreground">{farmer.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">({farmer.reviews} reviews)</span>
                </div>

                {/* Name & Location */}
                <h3 className="text-xl font-display font-semibold mb-2">{farmer.name}</h3>
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{farmer.location}</span>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {farmer.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>

                {/* CTA */}
                <Button className="w-full" asChild>
                  <Link to={`/farmer/${farmer.id}`}>View Farm</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedFarmers;
