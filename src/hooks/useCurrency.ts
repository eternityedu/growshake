import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number;
}

const CURRENCY_DATA: Record<string, { symbol: string; rate: number }> = {
  USD: { symbol: "$", rate: 1 },
  GBP: { symbol: "£", rate: 0.79 },
  EUR: { symbol: "€", rate: 0.92 },
  INR: { symbol: "₹", rate: 83.12 },
  AUD: { symbol: "A$", rate: 1.53 },
  CAD: { symbol: "C$", rate: 1.36 },
  JPY: { symbol: "¥", rate: 149.50 },
  CNY: { symbol: "¥", rate: 7.24 },
  BDT: { symbol: "৳", rate: 110.50 },
  PKR: { symbol: "₨", rate: 278.50 },
  NGN: { symbol: "₦", rate: 1550.00 },
  BRL: { symbol: "R$", rate: 4.97 },
  MXN: { symbol: "$", rate: 17.15 },
  ZAR: { symbol: "R", rate: 18.65 },
  KES: { symbol: "KSh", rate: 153.50 },
};

export const useCurrency = () => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<CurrencyInfo>({ 
    code: "USD", 
    symbol: "$", 
    rate: 1 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserCurrency = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("currency")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching currency:", error);
          setLoading(false);
          return;
        }

        const currencyCode = data?.currency || "USD";
        const currencyInfo = CURRENCY_DATA[currencyCode] || CURRENCY_DATA.USD;
        
        setCurrency({
          code: currencyCode,
          symbol: currencyInfo.symbol,
          rate: currencyInfo.rate,
        });
      } catch (err) {
        console.error("Error in fetchUserCurrency:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCurrency();
  }, [user]);

  const formatPrice = (usdAmount: number): string => {
    const convertedAmount = usdAmount * currency.rate;
    return `${currency.symbol}${convertedAmount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const convertToLocal = (usdAmount: number): number => {
    return usdAmount * currency.rate;
  };

  return { currency, loading, formatPrice, convertToLocal };
};
