import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  HelpCircleIcon,
  LifeBuoyIcon,
  MailIcon,
  MessageCircleIcon,
  PhoneIcon,
  SearchIcon,
  VideoIcon
} from 'lucide-react';
import { useState } from 'react';

export default function Help() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqData = [
    {
      question: "How do I add a new product?",
      answer: "Go to the Products page, click the 'Add Product' button, fill in the product details including name, description, categories, and upload an image. Then save the product."
    },
    {
      question: "How do I manage inventory?",
      answer: "Navigate to the Inventory page where you can add inventory items by selecting a product, entering barcode, actual price, and selling price. You can also view and manage existing inventory items."
    },
    {
      question: "How do I create an order?",
      answer: "From the main Dashboard, select products to add to the cart, enter customer information, apply any discounts, and complete the checkout process."
    },
    {
      question: "How do I add customers?",
      answer: "Go to the Customers page, click 'Add Customer', and fill in the customer details including name, contact information, and address."
    },
    {
      question: "How do I view sales analytics?",
      answer: "Visit the Analytics page to see revenue trends, top products, inventory insights, and other business metrics with different time range filters."
    },
    {
      question: "How do I backup my data?",
      answer: "Go to Settings > Data tab and click 'Export All Data' to download a backup file of all your business data."
    },
    {
      question: "How do I configure shop settings?",
      answer: "Navigate to Settings > Shop tab to update your shop information, owner details, contact information, and tax settings."
    },
    {
      question: "What if I accidentally delete something?",
      answer: "Currently, deletions are permanent. We recommend regularly backing up your data using the export feature in Settings."
    },
    {
      question: "How do I update product prices?",
      answer: "Product prices are managed through the Inventory section. Each inventory item can have different actual and selling prices."
    },
    {
      question: "Can I use this offline?",
      answer: "Yes! This POS system works completely offline. All data is stored locally on your device."
    }
  ];

  const filteredFaq = faqData.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const guides = [
    {
      title: "Getting Started Guide",
      description: "Learn the basics of setting up and using your POS system",
      duration: "5 min read",
      topics: ["Initial Setup", "Adding Products", "First Sale", "Basic Settings"]
    },
    {
      title: "Product Management",
      description: "Complete guide to managing your product catalog and inventory",
      duration: "8 min read",
      topics: ["Adding Products", "Categories", "Inventory Tracking", "Price Management"]
    },
    {
      title: "Order Processing",
      description: "Learn how to process orders efficiently and manage customer transactions",
      duration: "6 min read",
      topics: ["Creating Orders", "Payment Processing", "Order Status", "Customer Info"]
    },
    {
      title: "Analytics & Reports",
      description: "Understanding your business metrics and generating insights",
      duration: "7 min read",
      topics: ["Sales Reports", "Product Performance", "Customer Analytics", "Inventory Reports"]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Help & Support</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircleIcon className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredFaq.map((item, index) => (
                  <div key={index} className="border rounded-lg">
                    <button
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    >
                      <span className="font-medium">{item.question}</span>
                      {expandedFaq === index ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="px-4 pb-4 text-muted-foreground">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
                {filteredFaq.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No FAQ items found matching your search.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5" />
                User Guides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {guides.map((guide, index) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold">{guide.title}</h3>
                        <Badge variant="outline">{guide.duration}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{guide.description}</p>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Topics covered:</div>
                        <div className="flex flex-wrap gap-1">
                          {guide.topics.map((topic, topicIndex) => (
                            <Badge key={topicIndex} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        <BookOpenIcon className="h-4 w-4 mr-2" />
                        Read Guide
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <VideoIcon className="h-5 w-5" />
                Video Tutorials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <VideoIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <div className="text-lg font-semibold mb-2">Video Tutorials Coming Soon</div>
                <div className="text-sm">
                  We're working on creating comprehensive video tutorials to help you get the most out of your POS system.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoyIcon className="h-5 w-5" />
                Get Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MailIcon className="h-5 w-5 text-blue-600" />
                      <div className="font-medium">Email Support</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Get help via email. We typically respond within 24 hours.
                    </div>
                    <Button variant="outline" className="w-full">
                      <MailIcon className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageCircleIcon className="h-5 w-5 text-green-600" />
                      <div className="font-medium">Live Chat</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Chat with our support team in real-time.
                    </div>
                    <Button variant="outline" className="w-full" disabled>
                      <MessageCircleIcon className="h-4 w-4 mr-2" />
                      Start Chat (Coming Soon)
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-5 w-5 text-purple-600" />
                      <div className="font-medium">Phone Support</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Call us for urgent issues or complex problems.
                    </div>
                    <Button variant="outline" className="w-full">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      Call Support
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ExternalLinkIcon className="h-5 w-5 text-orange-600" />
                      <div className="font-medium">Community Forum</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Connect with other users and share experiences.
                    </div>
                    <Button variant="outline" className="w-full" disabled>
                      <ExternalLinkIcon className="h-4 w-4 mr-2" />
                      Visit Forum (Coming Soon)
                    </Button>
                  </div>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Before Contacting Support</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>Check the FAQ section above for common questions and solutions</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>Try restarting the application if you're experiencing issues</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>Have your system information ready (available in Settings > About)</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>Describe the issue in detail, including steps to reproduce</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLinkIcon className="h-5 w-5" />
                Additional Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Documentation</h3>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start">
                      <BookOpenIcon className="h-4 w-4 mr-2" />
                      User Manual
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <BookOpenIcon className="h-4 w-4 mr-2" />
                      API Documentation
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <BookOpenIcon className="h-4 w-4 mr-2" />
                      Troubleshooting Guide
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Quick Links</h3>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start">
                      <ExternalLinkIcon className="h-4 w-4 mr-2" />
                      Release Notes
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <ExternalLinkIcon className="h-4 w-4 mr-2" />
                      Feature Requests
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <ExternalLinkIcon className="h-4 w-4 mr-2" />
                      Bug Reports
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Keyboard Shortcuts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>New Product</span>
                      <Badge variant="outline">Ctrl + N</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Search</span>
                      <Badge variant="outline">Ctrl + F</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Save</span>
                      <Badge variant="outline">Ctrl + S</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Settings</span>
                      <Badge variant="outline">Ctrl + ,</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Help</span>
                      <Badge variant="outline">F1</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Refresh</span>
                      <Badge variant="outline">F5</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-center space-y-4">
                <h3 className="font-semibold">Need More Help?</h3>
                <div className="text-sm text-muted-foreground">
                  Can't find what you're looking for? Our support team is here to help.
                </div>
                <Button>
                  <LifeBuoyIcon className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
