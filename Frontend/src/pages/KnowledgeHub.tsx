import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Video, FileText, HelpCircle, Globe } from "lucide-react";

export default function KnowledgeHub() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Knowledge Hub</h1>
        <p className="text-muted-foreground">
          Access farming guides, best practices, and expert advice
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for farming guides, pest control, fertilizers..."
              className="pl-10 h-12"
            />
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <Button variant="secondary" size="sm" className="gap-2">
              <Globe className="w-4 h-4" />
              English
            </Button>
            <Badge variant="outline">Hindi</Badge>
            <Badge variant="outline">Punjabi</Badge>
            <Badge variant="outline">Tamil</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Popular Topics */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "Wheat Cultivation",
              "Pest Management",
              "Soil Health",
              "Irrigation Methods",
              "Organic Farming",
              "Fertilizer Guide",
              "Crop Rotation",
              "Disease Control",
            ].map((topic, idx) => (
              <Button key={idx} variant="outline" className="justify-start">
                {topic}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Featured Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Complete Wheat Growing Guide</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">Beginner Friendly</Badge>
                  <Badge variant="outline">15 min read</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Step-by-step guide covering seed selection, soil preparation, sowing, irrigation, 
              fertilization, pest control, and harvesting for maximum yield.
            </p>
            <Button variant="default" size="sm">Read Guide</Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Video className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Drip Irrigation Setup</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">Video Tutorial</Badge>
                  <Badge variant="outline">22 minutes</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Learn how to install and maintain a drip irrigation system for water efficiency. 
              Includes cost breakdown and ROI analysis.
            </p>
            <Button variant="outline" size="sm">Watch Video</Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Organic Pest Control Methods</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">Advanced</Badge>
                  <Badge variant="outline">12 min read</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Eco-friendly pest management techniques using neem oil, beneficial insects, 
              companion planting, and biological controls.
            </p>
            <Button variant="default" size="sm">Read Guide</Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Soil Fertility Management</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">Intermediate</Badge>
                  <Badge variant="outline">18 min read</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Understand NPK ratios, soil testing, composting, green manuring, 
              and sustainable fertilizer practices for long-term soil health.
            </p>
            <Button variant="outline" size="sm">Read Guide</Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-warning" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              q: "What is the best time to sow wheat in Punjab?",
              a: "The ideal sowing window for wheat in Punjab is November 1-20. Early sowing ensures better tillering and higher yields."
            },
            {
              q: "How much water does wheat crop need?",
              a: "Wheat requires 4-6 irrigations depending on soil type and rainfall. Critical stages are CRI (21 days), tillering, jointing, flowering, and grain filling."
            },
            {
              q: "What are signs of nitrogen deficiency?",
              a: "Yellowing of older leaves, stunted growth, and pale green color. Soil test confirming N below 250 ppm indicates deficiency."
            },
            {
              q: "How to control aphids organically?",
              a: "Use neem oil spray (5ml/liter), encourage ladybugs, spray garlic-chili solution, and maintain good field hygiene."
            },
          ].map((faq, idx) => (
            <div key={idx} className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
              <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
          
          <Button variant="outline" className="w-full">View All FAQs</Button>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Browse by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Crop Management", count: 45, icon: Sprout },
              { name: "Pest & Disease", count: 32, icon: AlertCircle },
              { name: "Irrigation & Water", count: 28, icon: Droplets },
              { name: "Soil & Fertilizers", count: 38, icon: Leaf },
              { name: "Equipment & Tools", count: 22, icon: Settings },
              { name: "Government Schemes", count: 15, icon: FileText },
            ].map((cat, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="h-auto py-4 flex items-start gap-3 justify-start"
              >
                <cat.icon className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.count} articles</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Note: Missing imports will be added in the next step
import { Sprout, AlertCircle, Droplets, Leaf, Settings } from "lucide-react";
