import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
}

interface NavLink {
  label: string;
  url: string;
}

interface NavbarSettings {
  links: NavLink[];
}

interface FooterSettings {
  companyName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: { platform: string; url: string }[];
}

export interface SiteSettings {
  theme: ThemeSettings;
  navbar: NavbarSettings;
  footer: FooterSettings;
}

const defaultSettings: SiteSettings = {
  theme: {
    primaryColor: '142 76% 36%',
    accentColor: '142 76% 36%',
    backgroundColor: '0 0% 100%',
  },
  navbar: {
    links: [
      { label: 'Home', url: '/' },
      { label: 'About', url: '/about' },
      { label: 'Contact', url: '/contact' },
    ],
  },
  footer: {
    companyName: 'GrowShare',
    description: 'Connecting farmers with conscious consumers',
    contactEmail: 'support@growshare.com',
    contactPhone: '+91 123-456-7890',
    socialLinks: [],
  },
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      if (data) {
        const newSettings = { ...defaultSettings };
        data.forEach((row) => {
          if (row.setting_key === 'theme') {
            newSettings.theme = row.setting_value as unknown as ThemeSettings;
          } else if (row.setting_key === 'navbar') {
            newSettings.navbar = row.setting_value as unknown as NavbarSettings;
          } else if (row.setting_key === 'footer') {
            newSettings.footer = row.setting_value as unknown as FooterSettings;
          }
        });
        setSettings(newSettings);
        applyTheme(newSettings.theme);
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (theme: ThemeSettings) => {
    document.documentElement.style.setProperty('--primary', theme.primaryColor);
    document.documentElement.style.setProperty('--accent', theme.accentColor);
  };

  const updateSettings = async (key: string, value: ThemeSettings | NavbarSettings | FooterSettings) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ setting_value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() })
        .eq('setting_key', key);

      if (error) throw error;

      await fetchSettings();
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  };

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
