import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AdminSidebar from '@/components/dashboard/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import { Palette, Link, FileText, Plus, Trash2, Save } from 'lucide-react';

export default function AdminSettings() {
  const { settings, loading, updateSettings } = useSiteSettings();
  
  const [theme, setTheme] = useState(settings.theme);
  const [navbar, setNavbar] = useState(settings.navbar);
  const [footer, setFooter] = useState(settings.footer);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTheme(settings.theme);
    setNavbar(settings.navbar);
    setFooter(settings.footer);
  }, [settings]);

  const handleSaveTheme = async () => {
    setSaving(true);
    const success = await updateSettings('theme', theme);
    setSaving(false);
    if (success) {
      toast.success('Theme settings saved!');
    } else {
      toast.error('Failed to save theme settings');
    }
  };

  const handleSaveNavbar = async () => {
    setSaving(true);
    const success = await updateSettings('navbar', navbar);
    setSaving(false);
    if (success) {
      toast.success('Navbar settings saved!');
    } else {
      toast.error('Failed to save navbar settings');
    }
  };

  const handleSaveFooter = async () => {
    setSaving(true);
    const success = await updateSettings('footer', footer);
    setSaving(false);
    if (success) {
      toast.success('Footer settings saved!');
    } else {
      toast.error('Failed to save footer settings');
    }
  };

  const addNavLink = () => {
    setNavbar({
      ...navbar,
      links: [...navbar.links, { label: '', url: '' }],
    });
  };

  const removeNavLink = (index: number) => {
    setNavbar({
      ...navbar,
      links: navbar.links.filter((_, i) => i !== index),
    });
  };

  const updateNavLink = (index: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...navbar.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setNavbar({ ...navbar, links: newLinks });
  };

  if (loading) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Site Settings</h1>
          <p className="text-muted-foreground">Customize your website appearance and content</p>
        </div>

        <Tabs defaultValue="theme" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="navbar" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Navbar
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Footer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <CardTitle>Theme Colors</CardTitle>
                <CardDescription>
                  Customize the color scheme of your website (HSL format)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color (HSL)</Label>
                    <Input
                      id="primaryColor"
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                      placeholder="142 76% 36%"
                    />
                    <div 
                      className="w-full h-8 rounded border"
                      style={{ backgroundColor: `hsl(${theme.primaryColor})` }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color (HSL)</Label>
                    <Input
                      id="accentColor"
                      value={theme.accentColor}
                      onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                      placeholder="142 76% 36%"
                    />
                    <div 
                      className="w-full h-8 rounded border"
                      style={{ backgroundColor: `hsl(${theme.accentColor})` }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Background Color (HSL)</Label>
                    <Input
                      id="backgroundColor"
                      value={theme.backgroundColor}
                      onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                      placeholder="0 0% 100%"
                    />
                    <div 
                      className="w-full h-8 rounded border"
                      style={{ backgroundColor: `hsl(${theme.backgroundColor})` }}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveTheme} disabled={saving} className="mt-4">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Theme'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="navbar">
            <Card>
              <CardHeader>
                <CardTitle>Navbar Links</CardTitle>
                <CardDescription>
                  Manage the navigation links in your website header
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {navbar.links.map((link, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Label"
                        value={link.label}
                        onChange={(e) => updateNavLink(index, 'label', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => updateNavLink(index, 'url', e.target.value)}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeNavLink(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={addNavLink}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                  <Button onClick={handleSaveNavbar} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Navbar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="footer">
            <Card>
              <CardHeader>
                <CardTitle>Footer Content</CardTitle>
                <CardDescription>
                  Update your website footer information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={footer.companyName}
                      onChange={(e) => setFooter({ ...footer, companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={footer.contactEmail}
                      onChange={(e) => setFooter({ ...footer, contactEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={footer.contactPhone}
                      onChange={(e) => setFooter({ ...footer, contactPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={footer.description}
                    onChange={(e) => setFooter({ ...footer, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button onClick={handleSaveFooter} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Footer'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
